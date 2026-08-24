// ---------------------------------------------------------------------------
// Run with: node scripts/check-sources.mjs
//
// A static check over every file in src/, written because this project was
// assembled in an environment with no access to the npm registry — Vite could
// not be installed, so the code could not be compiled before it was handed
// over. That is a real limitation and pretending otherwise would be worse than
// stating it.
//
// This does not replace a build. It catches the three things most likely to be
// wrong in code that has never been bundled:
//
//   1. An import pointing at a file that does not exist (a typo'd path).
//   2. A named import of something the target file does not export.
//   3. Unbalanced brackets, ignoring strings, comments and template literals.
//
// A syntax error INSIDE an expression will still get past this. `npm run dev`
// on a machine with internet is the real check, and it is one command.
//
// ---- KNOWN LIMITATION: APOSTROPHES IN JSX TEXT ----
//
// blankNonCode() has no parser and cannot tell JS from JSX text, so a straight
// apostrophe in prose — <h2>Dr. Marigold's voice</h2> — reads as the start of a
// string and swallows everything to the next quote. That shows up here as a
// phantom "brace never closed" on a file that is perfectly fine.
//
// The fix is in the source, not here: use the typographic apostrophe (U+2019)
// in JSX text. It is correct typography anyway, and it removes the ambiguity
// rather than teaching this script to guess at it. Writing a real JSX parser to
// support a character that should be curly regardless would be the tail wagging
// the dog.
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

/** Blank out strings, template literals and comments so bracket counting and
 *  import scanning are not fooled by them. Replaces content with spaces so all
 *  character offsets stay put. */
function blankNonCode(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const next = src[i + 1];
    if (c === '/' && next === '/') {
      while (i < n && src[i] !== '\n') out += ' ', i++;
      continue;
    }
    if (c === '/' && next === '*') {
      out += '  ';
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) out += src[i] === '\n' ? '\n' : ' ', i++;
      out += '  ';
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      out += quote;
      i++;
      while (i < n) {
        if (src[i] === '\\') {
          out += '  ';
          i += 2;
          continue;
        }
        if (src[i] === quote) break;
        // Template literals can contain ${ ... } with real code in it. Keeping
        // those braces would unbalance the count, so the whole interpolation is
        // blanked along with the rest of the string.
        out += src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      out += quote;
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

const errors = [];
const files = walk(SRC);

// Cache of exported names per file.
const exportCache = new Map();
function exportsOf(file) {
  if (exportCache.has(file)) return exportCache.get(file);
  const src = blankNonCode(readFileSync(file, 'utf8'));
  const names = new Set();
  const patterns = [
    /export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g,
    /export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)/g,
    /export\s+class\s+([A-Za-z0-9_$]+)/g
  ];
  for (const rx of patterns) {
    let m;
    while ((m = rx.exec(src))) names.add(m[1]);
  }
  // export { a, b as c }
  const braceRx = /export\s*\{([^}]*)\}/g;
  let bm;
  while ((bm = braceRx.exec(src))) {
    for (const part of bm[1].split(',')) {
      const t = part.trim();
      if (!t) continue;
      const asMatch = t.match(/\s+as\s+([A-Za-z0-9_$]+)$/);
      names.add(asMatch ? asMatch[1] : t);
    }
  }
  if (/export\s+default\b/.test(src)) names.add('default');
  exportCache.set(file, names);
  return names;
}

for (const file of files) {
  const rel = relative(ROOT, file);
  const raw = readFileSync(file, 'utf8');
  const code = blankNonCode(raw);

  // ---- 1 & 2: imports ----
  const importRx = /import\s+([^;]*?)\s+from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = importRx.exec(raw))) {
    const clause = m[1];
    const spec = m[2] || m[3];
    if (!spec.startsWith('.')) continue; // node_modules — not resolvable here
    const target = resolve(dirname(file), spec);
    if (!existsSync(target)) {
      errors.push(`${rel}: imports "${spec}" but ${relative(ROOT, target)} does not exist`);
      continue;
    }
    if (!clause) continue;
    const named = clause.match(/\{([^}]*)\}/);
    if (!named) continue;
    const available = exportsOf(target);
    for (const part of named[1].split(',')) {
      const t = part.trim();
      if (!t) continue;
      const name = t.split(/\s+as\s+/)[0].trim();
      if (!available.has(name)) {
        errors.push(`${rel}: imports { ${name} } from "${spec}", which does not export it`);
      }
    }
  }

  // ---- 3: brackets ----
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  let line = 1;
  for (const ch of code) {
    if (ch === '\n') line++;
    else if (ch === '(' || ch === '[' || ch === '{') stack.push({ ch, line });
    else if (ch === ')' || ch === ']' || ch === '}') {
      const top = stack.pop();
      if (!top) {
        errors.push(`${rel}:${line}: closing "${ch}" with nothing open`);
        break;
      }
      if (top.ch !== pairs[ch]) {
        errors.push(`${rel}:${line}: "${ch}" closes a "${top.ch}" opened on line ${top.line}`);
        break;
      }
    }
  }
  if (stack.length) {
    const t = stack[stack.length - 1];
    errors.push(`${rel}: "${t.ch}" opened on line ${t.line} is never closed`);
  }
}

console.log(`\nPetal & Pestle — source check\n`);
console.log(`Files scanned: ${files.length}`);
if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('Imports resolve, named imports exist, brackets balance.\n');
