// ---------------------------------------------------------------------------
// Run with: node scripts/check-imports.mjs
//
// The sixteenth check, and it fills a real gap.
//
// The fifteen checks before it import the plain .js files, so a typo in one of
// those blows up immediately. The .jsx files are different: nothing in this
// project ever loads them outside a browser. A component that imports a
// function which does not exist — renamed, moved, never written — parses fine,
// passes check-jsx, passes check-hooks, and then white-screens the app the
// moment she taps that tab.
//
// That failure mode is the worst kind here, because it does not happen on the
// screen anyone was testing. It happens on the screen nobody opened, on a
// laptop in another house, when the person using it is nine.
//
// npm is not reachable in the sandbox this is built in, so there is no bundler
// to catch it. This does the one part of a bundler's job that matters most:
// every import points at a file that exists, and every named import is
// something that file actually exports.
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

/** Strip comments and strings so an import written about in a comment is not
 *  mistaken for one. This project's files are heavily commented, and an earlier
 *  check in this repo (check-avatar) failed on its own documentation for
 *  exactly this reason. */
function blank(src) {
  let out = '';
  let i = 0;
  let mode = 'code';
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (mode === 'code') {
      if (c === '/' && n === '/') mode = 'line';
      else if (c === '/' && n === '*') mode = 'block';
      else if (c === "'" || c === '"' || c === '`') {
        mode = c;
        out += c;
        i++;
        continue;
      } else {
        out += c;
        i++;
        continue;
      }
      out += '  ';
      i += 2;
      continue;
    }
    if (mode === 'line') {
      if (c === '\n') {
        mode = 'code';
        out += '\n';
      } else out += ' ';
      i++;
      continue;
    }
    if (mode === 'block') {
      if (c === '*' && n === '/') {
        mode = 'code';
        out += '  ';
        i += 2;
        continue;
      }
      out += c === '\n' ? '\n' : ' ';
      i++;
      continue;
    }
    // inside a string: keep it, so import specifiers survive
    out += c;
    if (c === '\\') {
      out += src[i + 1] ?? '';
      i += 2;
      continue;
    }
    if (c === mode) mode = 'code';
    i++;
  }
  return out;
}

/**
 * blank() with the INSIDES of strings emptied too.
 *
 * blank() keeps string contents on purpose — import specifiers live in them and
 * the whole file above needs them. The call-site scan needs the opposite: a
 * call site is never inside a string, and `buildStamp.js` is 900 lines of
 * changelog prose that quotes function names by design. Six of them tripped the
 * first run of this check.
 *
 * A CHECK THAT FAILS CORRECT CONTENT teaches whoever hits it to reach for the
 * check instead of the code. This project has recorded that four times, so the
 * fix is the cause and not an exemption for one file.
 *
 * Template literals are emptied whole, `${…}` included. That can hide a call
 * written inside an interpolation — a FALSE NEGATIVE, chosen deliberately over
 * a false positive, because a check that cries wolf gets switched off and a
 * check that stays quiet at least never costs anyone a correct edit.
 */
function codeOnly(src) {
  const s = blank(src);
  let out = '';
  let mode = 'code';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (mode === 'code') {
      if (c === "'" || c === '"' || c === '`') mode = c;
      out += c;
      continue;
    }
    if (c === '\\') {
      out += '  ';
      i++;
      continue;
    }
    if (c === mode) {
      mode = 'code';
      out += c;
      continue;
    }
    out += c === '\n' ? '\n' : ' ';
  }
  return out;
}

/** Every name a file exports. */
function exportsOf(file) {
  const src = blank(readFileSync(file, 'utf8'));
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s+(?:const|let|var|class)\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  // export { a, b as c }
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const bit = part.trim();
      if (!bit) continue;
      const as = bit.split(/\s+as\s+/);
      names.add((as[1] || as[0]).trim());
    }
  }
  if (/export\s+default/.test(src)) names.add('default');
  return names;
}

const files = walk(SRC);
const exportCache = new Map();
function cachedExports(file) {
  if (!exportCache.has(file)) exportCache.set(file, exportsOf(file));
  return exportCache.get(file);
}

const errors = [];
let checkedLocal = 0;
let checkedNames = 0;

for (const file of files) {
  const src = blank(readFileSync(file, 'utf8'));
  const rel = file.slice(ROOT.length + 1);

  for (const m of src.matchAll(/import\s+([^;]*?)\s+from\s*['"]([^'"]+)['"]/gs)) {
    const clause = m[1].trim();
    const spec = m[2];

    // Bare specifiers are packages (react, zustand, dexie). Their presence is
    // package.json's problem, not this check's.
    if (!spec.startsWith('.')) continue;

    const target = resolve(dirname(file), spec);
    checkedLocal++;
    if (!existsSync(target)) {
      errors.push(`${rel}: imports "${spec}", which does not exist`);
      continue;
    }

    // Named imports: { a, b as c }
    const named = clause.match(/\{([^}]*)\}/);
    const hasDefault = /^[A-Za-z0-9_$]+\s*(,|$)/.test(clause);
    const available = cachedExports(target);

    if (hasDefault && !available.has('default')) {
      errors.push(`${rel}: imports a default from "${spec}", which has no default export`);
    }
    if (named) {
      for (const part of named[1].split(',')) {
        const bit = part.trim();
        if (!bit) continue;
        const name = bit.split(/\s+as\s+/)[0].trim();
        checkedNames++;
        if (!available.has(name)) {
          errors.push(
            `${rel}: imports { ${name} } from "${spec}", which does not export it. ` +
              `In a .jsx file this white-screens the app the first time that tab is opened.`
          );
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// AND THE OTHER DIRECTION: A NAME USED WITH NO IMPORT AT ALL.
//
// ---- WHY THIS EXISTS. Aug 19, and it was mine. ----
//
// `lessonById()` was called inside LessonReader.jsx and never imported. Every
// lesson carrying a retrieve beat would have white-screened — the screen a
// nine-year-old opens every morning — and THIS CHECK PASSED, because everything
// above only asks whether an import points at a real export. A name with no
// import has no import to inspect, so there was nothing to look at.
//
// Both halves of the same question, and only one of them was ever asked:
//   · does what we import exist?          ← the whole file above
//   · does what we use get imported?      ← this block
//
// ---- WHY IT ONLY LOOKS AT NAMES THIS PROJECT EXPORTS ----
//
// Guessing at every identifier means fighting parameters, closures, globals and
// browser APIs forever, and a check that fails correct code teaches whoever hits
// it to reach for the check instead of the code — this project has done that
// four times. So the question is narrow and answerable: is this a name some
// module HERE exports, called HERE, and imported nowhere in this file? That is
// exactly the shape of the bug, and it cannot fire on a React hook or a `Math.`
// call.
// ---------------------------------------------------------------------------
{
  // Every name exported anywhere in src, and where from.
  const exportedBy = new Map();
  for (const f of files) {
    for (const name of cachedExports(f)) {
      if (name === 'default') continue;
      if (!exportedBy.has(name)) exportedBy.set(name, []);
      exportedBy.get(name).push(f.slice(ROOT.length + 1));
    }
  }

  let callsChecked = 0;

  for (const file of files) {
    // codeOnly, not blank: changelog prose quotes function names by design.
    const src = codeOnly(readFileSync(file, 'utf8'));
    const rel = file.slice(ROOT.length + 1);

    // ---- what this file already has a right to say ----
    const known = new Set();
    for (const m of src.matchAll(/import\s+([^;]*?)\s+from\s*['"][^'"]+['"]/gs)) {
      const clause = m[1].trim();
      const named = clause.match(/\{([^}]*)\}/);
      if (named) {
        for (const part of named[1].split(',')) {
          const bit = part.trim();
          if (bit) known.add((bit.split(/\s+as\s+/)[1] || bit.split(/\s+as\s+/)[0]).trim());
        }
      }
      const def = clause.match(/^([A-Za-z0-9_$]+)\s*(?:,|$)/);
      if (def) known.add(def[1]);
      const star = clause.match(/\*\s+as\s+([A-Za-z0-9_$]+)/);
      if (star) known.add(star[1]);
    }
    // declared right here — exported or not
    for (const m of src.matchAll(/(?:function|class)\s+([A-Za-z0-9_$]+)/g)) known.add(m[1]);
    for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z0-9_$]+)/g)) known.add(m[1]);
    // destructured, and every parameter list — crude on purpose, and it only
    // ever makes this check QUIETER, never louder.
    for (const m of src.matchAll(/(?:const|let|var)\s*[[{]([^\]}]*)[\]}]/g)) {
      for (const bit of m[1].split(',')) {
        const n = bit.split(':').pop().trim().replace(/^\.\.\./, '').split('=')[0].trim();
        if (/^[A-Za-z0-9_$]+$/.test(n)) known.add(n);
      }
    }
    for (const m of src.matchAll(/\(([^()]*)\)\s*=>/g)) {
      for (const bit of m[1].split(',')) {
        const n = bit.trim().replace(/^\.\.\./, '').split('=')[0].trim();
        if (/^[A-Za-z0-9_$]+$/.test(n)) known.add(n);
      }
    }
    for (const m of src.matchAll(/function\s*[A-Za-z0-9_$]*\s*\(([^()]*)\)/g)) {
      for (const bit of m[1].split(',')) {
        const n = bit.trim().replace(/^\.\.\./, '').split('=')[0].trim();
        if (/^[A-Za-z0-9_$]+$/.test(n)) known.add(n);
      }
    }

    // ---- call sites. Not `.method(`, not `new`. ----
    const seen = new Set();
    for (const m of src.matchAll(/(^|[^.\w$])([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)) {
      const name = m[2];
      if (seen.has(name) || known.has(name)) continue;
      seen.add(name);
      if (!exportedBy.has(name)) continue;
      const from = exportedBy.get(name).filter((f) => f !== rel);
      if (from.length === 0) continue;
      callsChecked++;
      errors.push(
        `${rel}: calls ${name}() and never imports it. It is exported by ${from[0]}` +
          `${from.length > 1 ? ` (and ${from.length - 1} other)` : ''}. ` +
          `In a .jsx file this white-screens the app the first time that tab is opened — which is ` +
          `what LessonReader.jsx did on Aug 19 with every check green.`
      );
    }
  }

  if (callsChecked === 0) {
    console.log(`  · every called name is imported or declared where it is used`);
  }
}

console.log('\nPetal & Pestle — import check\n');
console.log(`  · ${files.length} files`);
console.log(`  · ${checkedLocal} local imports resolved`);
console.log(`  · ${checkedNames} named imports matched against real exports`);

if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors.slice(0, 20)) console.error(`  ✗ ${e}`);
  if (errors.length > 20) console.error(`  ...and ${errors.length - 20} more`);
  process.exit(1);
}
console.log('\nEvery import points at a real file and a real export.\n');
