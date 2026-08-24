// ---------------------------------------------------------------------------
// Run with: node scripts/check-hooks.mjs
//
// WHY THIS EXISTS.
//
// While building the Today card I wrote this:
//
//     function TodayCard() {
//       const blocks = useAppStore(...)          // hook 1
//       if (orderedBlocks(blocks).length === 0) return null
//       const done = useAppStore(...)            // hook 2 — only sometimes
//       ...
//
// React does not track hooks by name. It tracks them BY ORDER, counting them on
// every render and matching call #2 this render to call #2 last render. A
// component that renders one hook when the schedule is empty and three when it
// is not breaks that count, and React throws "rendered more hooks than during
// the previous render" — not when the file is written, but at the exact moment
// a grown-up adds the first block to an empty timetable.
//
// Every other check in this project would have passed it. The imports resolve.
// The brackets balance. The bug is real, it is in shipped-looking code, and it
// only fires for the one user who edits their schedule.
//
// So: no hook may appear after a conditional `return` inside a component.
//
// ---- WHAT THIS DOES AND DOES NOT CATCH ----
//
// It is a scanner, not a parser. It finds function bodies that look like React
// components (capitalised name, or a use* hook inside), tracks the first
// early-return at the body's top nesting level, and flags any hook call after
// it. Hooks inside nested callbacks are ignored, because those are not
// component-level hooks.
//
// It cannot see a hook hidden behind a helper function, and it does not try.
// The common, easy-to-write, hard-to-notice version is the one above, and that
// is the one this refuses to let through.
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

const HOOK = /\b(use[A-Z]\w*)\s*\(/;
const FUNC_START = /^(?:export\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(name)) out.push(full);
  }
  return out;
}

/** Strip comments and strings so a hook named in prose is not a finding. */
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
      out += q;
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
      out += q;
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

const errors = [];
const scanned = [];

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  const lines = blank(readFileSync(file, 'utf8')).split('\n');

  let inFn = null; // { name, startLine, depthAtBody, sawReturn }
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = FUNC_START.exec(line);

    if (m && depth === 0) {
      inFn = { name: m[1], startLine: i + 1, sawReturn: null, hooks: 0 };
    }

    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    const depthAtLineStart = depth;

    if (inFn) {
      // Only look at statements sitting directly in the function body — depth 1
      // relative to the file. Anything deeper is inside a callback or a block,
      // where an early return is just normal control flow.
      const topLevelOfBody = depthAtLineStart === 1;

      if (topLevelOfBody && /^\s*(?:if\s*\(.*\)\s*)?return\b/.test(line) && i + 1 > inFn.startLine) {
        if (!inFn.sawReturn) inFn.sawReturn = i + 1;
      }

      if (topLevelOfBody && HOOK.test(line)) {
        inFn.hooks += 1;
        if (inFn.sawReturn) {
          const hookName = HOOK.exec(line)[1];
          errors.push(
            `${rel}:${i + 1}: ${inFn.name}() calls ${hookName}() after the early return on ` +
              `line ${inFn.sawReturn} — React counts hooks by order, so this component will ` +
              `crash the first time that branch flips`
          );
        }
      }
    }

    depth += opens - closes;

    if (inFn && depth <= 0) {
      if (inFn.hooks > 0) scanned.push(`${inFn.name} (${inFn.hooks} hooks)`);
      inFn = null;
      depth = 0;
    }
  }
}

console.log('\nPetal & Pestle — React hook-order check\n');
console.log(`Components with hooks: ${scanned.length}`);
if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('Every hook runs before every early return.\n');
