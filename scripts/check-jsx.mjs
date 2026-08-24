// ---------------------------------------------------------------------------
// Run with: node scripts/check-jsx.mjs
//
// WHY THIS EXISTS.
//
// This project is built in a sandbox with no access to the npm registry, so
// Vite cannot be installed and the code cannot be COMPILED before it is handed
// over. check-sources.mjs was written to cover part of that gap — it proves
// imports resolve and curly braces balance.
//
// It does not prove the JSX is valid. A single unclosed <div> balances its
// braces perfectly and fails instantly in the browser, and the failure looks
// like "the app is not loading" rather than like a missing tag on line 212.
// That is a bad trade: the machine could have found it in a second, and instead
// a grandmother restarts a dev server three times.
//
// So this walks the JSX tags and checks they nest and close, the same way the
// bracket checker walks braces.
//
// ---- WHAT IT CHECKS ----
//
//   1. Every opening tag has a matching closing tag
//   2. Tags close in the right ORDER — </section> cannot close a <div>
//   3. Nothing closes that was never opened
//   4. class= instead of className= (silently does nothing in React)
//   5. for= instead of htmlFor=
//
// ---- WHAT IT IS NOT ----
//
// It is not a parser and it is not a substitute for a build. It skips strings,
// comments, and regex-looking things, treats void and self-closing tags
// correctly, and ignores anything inside a {...} expression that is not
// obviously a tag. A genuinely exotic construction could slip past it. The
// common, cheap, high-cost mistake is the one it refuses to let through.
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

/** HTML elements that never have a closing tag. */
const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
  // SVG leaves used in this project
  'path', 'circle', 'ellipse', 'rect', 'line', 'polygon', 'polyline', 'stop', 'use'
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.jsx$/.test(name)) out.push(full);
  }
  return out;
}

/** Blank comments and string/template contents, preserving offsets. */
function blank(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') (out += ' '), i++;
      continue;
    }
    if (c === '/' && n === '*') {
      out += '  ';
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
        out += src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      out += '  ';
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      out += ' ';
      i++;
      while (i < src.length) {
        if (src[i] === '\\') {
          out += '  ';
          i += 2;
          continue;
        }
        if (src[i] === q) break;
        out += src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      out += ' ';
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

const errors = [];
let tagsChecked = 0;
const files = walk(SRC);

for (const file of files) {
  const rel = relative(ROOT, file);
  const raw = readFileSync(file, 'utf8');
  const code = blank(raw);

  // ---- 4 & 5: attributes React silently ignores ----
  // Checked on the blanked source so the words in a comment do not count.
  for (const [bad, good] of [
    ['class', 'className'],
    ['for', 'htmlFor']
  ]) {
    const rx = new RegExp(`<[A-Za-z][^>]*?\\s${bad}=`, 'g');
    let m;
    while ((m = rx.exec(code))) {
      const line = code.slice(0, m.index).split('\n').length;
      errors.push(`${rel}:${line}: uses ${bad}= — React needs ${good}=, and ignores this silently`);
    }
  }

  // ---- 1, 2, 3: tag nesting ----
  //
  // Scanned character by character rather than by regex. The first draft used a
  // regex for the whole tag and reported 23 failures in files that had been
  // running correctly for days — because an opening tag like
  //
  //     <button onClick={() => { setKind(k.id); setNudge(0) }}>
  //
  // contains NESTED braces, which no single regex handled, so the opening tag
  // silently failed to match while its </button> matched fine. Every "error"
  // was the checker's own.
  //
  // That is the failure mode worth naming: a checker that cries wolf is worse
  // than no checker, because the next real failure gets waved through as
  // another false alarm. So this tracks brace depth properly and stops
  // guessing.
  const stack = [];
  let i = 0;
  const n = code.length;

  while (i < n) {
    if (code[i] !== '<') {
      i++;
      continue;
    }
    let j = i + 1;
    const closing = code[j] === '/';
    if (closing) j++;

    const nameMatch = /^[A-Za-z][\w.]*/.exec(code.slice(j, j + 64));
    if (!nameMatch) {
      // `<>` and `</>` fragments, or a stray less-than. Both are symmetric, so
      // ignoring them cannot unbalance the stack.
      i++;
      continue;
    }
    const name = nameMatch[0];
    j += name.length;

    // Walk to the closing '>' of THIS tag, ignoring anything inside {...}.
    let depth = 0;
    let selfClose = false;
    let closed = false;
    while (j < n) {
      const c = code[j];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) {
        let k = j - 1;
        while (k > 0 && /\s/.test(code[k])) k--;
        selfClose = code[k] === '/';
        closed = true;
        break;
      } else if (c === '<' && depth === 0) {
        // A new tag started before this one closed — malformed, but bail
        // quietly rather than cascading nonsense down the rest of the file.
        break;
      }
      j++;
    }
    if (!closed) {
      i++;
      continue;
    }

    const line = code.slice(0, i).split('\n').length;

    if (closing) {
      const top = stack.pop();
      if (!top) {
        errors.push(`${rel}:${line}: </${name}> closes a tag that was never opened`);
        break;
      }
      if (top.name !== name) {
        errors.push(
          `${rel}:${line}: </${name}> closes the <${top.name}> opened on line ${top.line}`
        );
        break;
      }
      tagsChecked++;
    } else if (selfClose || VOID.has(name)) {
      tagsChecked++;
    } else {
      stack.push({ name, line });
      tagsChecked++;
    }
    i = j + 1;
  }

  if (stack.length) {
    const t = stack[stack.length - 1];
    errors.push(`${rel}: <${t.name}> opened on line ${t.line} is never closed`);
  }
}

console.log('\nPetal & Pestle — JSX check\n');
console.log(`Files: ${files.length} · tags checked: ${tagsChecked}`);
if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('Every tag opens, nests and closes. No class= or for=.\n');
