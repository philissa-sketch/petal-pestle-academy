// ---------------------------------------------------------------------------
// CHECK — EVERY NAME THE CODE USES ACTUALLY EXISTS.
//
// Run with: node scripts/check-undefined.mjs
//
// ---- WHY THIS EXISTS, AND IT IS THE WORST ONE YET ----
//
// v3.92 changed one call in three files:
//
//     buildActionPlan(strands)  ->  buildActionPlan(strands, grades)
//
// HomeDashboard and PlanView each got a selector added beside it. ParentDashboard
// DID NOT — and there IS a `grades` in that file, at line 798, inside a
// DIFFERENT component. So the edit read as correct on the screen, in the diff,
// and in review.
//
// It threw ReferenceError the moment the screen rendered. THE GROWN-UP CORNER
// WAS DOWN ON THE LIVE SITE — the screen where Gigi records a Khan grade, marks
// the journal and takes a backup — and she found it by opening it.
//
// ⚠️ ALL 38 CHECKS WERE GREEN WHILE IT WAS BROKEN.
//
// Every check in this folder reads text: does the tag close, does the import
// resolve, does the bracket balance, does this file mention that string. NOT ONE
// of them asked the only question that mattered: DOES THIS NAME EXIST HERE?
//
// check-sources gets closest and cannot help — its own header says it strips
// strings and counts brackets. A balanced bracket around an undefined variable
// is still balanced.
//
// ---- WHAT IT DOES ----
//
// Parses every .js and .jsx file in src/ with Babel and walks the real scope
// chain. For every identifier that is READ, it asks Babel whether a binding
// exists — module import, declaration, function parameter, catch clause, class
// name, or anything in an enclosing scope.
//
// This is scope analysis, not a text search. `grades` declared inside
// KhanGradesPanel is NOT in scope inside ParentDashboard, and that is the whole
// bug. A file-wide search would have found `grades` and passed.
//
// ---- WHAT IT DOES NOT ASSERT, so it never claims more than it tests ----
//
//   · That the value is the RIGHT one. `khanGrades` where `strands` was meant
//     is defined, and wrong, and this cannot see it.
//   · That anything renders. A component can be free of undefined names and
//     still throw on null, and only running it would show that.
//   · Anything about scripts/ — this walks src/, which is what ships.
//
// ---- ⚠️ ON THE PARSER, AND WHY IT MUST NEVER SKIP QUIETLY ----
//
// @babel/parser and @babel/traverse arrive with @vitejs/plugin-react. They are
// declared in package.json as direct devDependencies anyway, because a check
// resting on a transitive dependency is a check that disappears on an unrelated
// upgrade — and it would disappear SILENTLY, which is the shape this whole
// folder exists to refuse.
//
// If the parser cannot be loaded this FAILS. It does not skip. A green run must
// always mean the files were read.
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SRC = resolve(ROOT, 'src');

const failures = [];
const fail = (rule, detail) => failures.push({ rule, detail });

let parse;
let traverse;
try {
  ({ parse } = await import('@babel/parser'));
  const t = await import('@babel/traverse');
  traverse = t.default?.default || t.default || t;
} catch (err) {
  console.error('\nPetal & Pestle — undefined name check\n');
  console.error(
    '  COULD NOT LOAD THE PARSER, so nothing was checked and this is a FAILURE,\n' +
      '  not a skip. @babel/parser and @babel/traverse are declared in package.json.\n' +
      `  Run npm install and try again.\n\n  ${err.message}\n`
  );
  process.exit(1);
}

/**
 * Names that exist at runtime without being declared anywhere in src/.
 *
 * ⚠️ KEPT SHORT ON PURPOSE. Every name added here is a name this check stops
 * protecting, and the temptation when it goes red is to add one. It went red
 * exactly once while being written — on `process`, in a file that reads
 * import.meta.env — and the answer was to add the real global, not to widen it.
 */
const GLOBALS = new Set([
  'window', 'document', 'navigator', 'location', 'history', 'screen',
  'console', 'globalThis', 'process',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'queueMicrotask',
  'fetch', 'Request', 'Response', 'Headers', 'AbortController', 'URL', 'URLSearchParams',
  'Blob', 'File', 'FileReader', 'FormData', 'Image', 'Audio', 'DOMParser', 'Event',
  'CustomEvent', 'MutationObserver', 'IntersectionObserver', 'ResizeObserver',
  'localStorage', 'sessionStorage', 'indexedDB', 'IDBKeyRange', 'crypto',
  'structuredClone', 'speechSynthesis', 'SpeechSynthesisUtterance', 'matchMedia',
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Symbol', 'BigInt',
  'Math', 'JSON', 'Date', 'RegExp', 'Error', 'TypeError', 'RangeError',
  'SyntaxError', 'ReferenceError', 'EvalError', 'URIError', 'AggregateError',
  'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet', 'WeakRef', 'Proxy', 'Reflect',
  'Intl', 'Infinity', 'NaN', 'undefined', 'isNaN', 'isFinite',
  'parseInt', 'parseFloat', 'encodeURIComponent', 'decodeURIComponent',
  'encodeURI', 'decodeURI', 'ArrayBuffer', 'Uint8Array', 'TextEncoder', 'TextDecoder',
  'performance', 'alert', 'confirm', 'prompt', 'print', 'atob', 'btoa'
]);

/** Every .js and .jsx under src/. */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(name) && !name.startsWith('.')) out.push(full);
  }
  return out;
}

const files = walk(SRC).sort();
let checked = 0;
let references = 0;

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const code = readFileSync(file, 'utf8');

  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx'],
      errorRecovery: false
    });
  } catch (err) {
    fail('every-file-parses', `${rel} could not be parsed: ${err.message}`);
    continue;
  }
  checked += 1;

  traverse(ast, {
    ReferencedIdentifier(path) {
      const name = path.node.name;

      // JSX <Tag> names resolve as identifiers only when capitalised; lowercase
      // ones are host elements like <div> and are not references at all.
      if (path.parent.type === 'JSXOpeningElement' || path.parent.type === 'JSXClosingElement') {
        if (!/^[A-Z]/.test(name)) return;
      }
      if (path.parent.type === 'JSXAttribute' && path.parent.name === path.node) return;

      if (GLOBALS.has(name)) return;
      if (path.scope.hasBinding(name, true)) {
        references += 1;
        return;
      }

      references += 1;
      const line = path.node.loc?.start?.line ?? '?';
      fail(
        'every-name-exists-in-its-own-scope',
        `${rel}:${line} uses "${name}", which is not declared in any scope that reaches it. ` +
          `This is the v3.93 bug: a name that exists SOMEWHERE ELSE in the same file reads as ` +
          `correct and throws ReferenceError the moment the screen renders.`
      );
    }
  });
}

// ⚠️ THE FLOOR. A walk that found no files, or a traverse that visited nothing,
// would report no failures and exit green — the shape run-all-checks refuses.
if (checked === 0) {
  fail('some-files-were-parsed', 'no files under src/ were parsed. The walk found nothing.');
}
if (references === 0) {
  fail(
    'some-references-were-checked',
    'not one identifier reference was examined across the whole of src/. The visitor name or the ' +
      'traverse import has changed shape, and this check is walking nothing while printing a pass.'
  );
}

// ---- report ----------------------------------------------------------------

console.log('\nPetal & Pestle — undefined name check');
console.log('Does every name the code uses actually exist where it is used?\n');
console.log(`  files parsed           ${checked} of ${files.length}`);
console.log(`  identifier references  ${references}`);
console.log(`  known globals allowed  ${GLOBALS.size}`);
console.log(
  '\n  NOT TESTED HERE: whether a defined name is the RIGHT one, or whether\n' +
    '  anything renders. A component free of undefined names can still throw.\n'
);

if (failures.length === 0) {
  console.log('Every name resolves in the scope that uses it.\n');
  process.exit(0);
}

console.error(`FAILED — ${failures.length}\n`);
for (const f of failures.slice(0, 30)) console.error(`  [${f.rule}] ${f.detail}`);
if (failures.length > 30) console.error(`  … and ${failures.length - 30} more`);
console.error('');
process.exit(1);
