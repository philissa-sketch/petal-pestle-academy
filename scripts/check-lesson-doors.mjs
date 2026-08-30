// ---------------------------------------------------------------------------
// CHECK — EVERY DOOR INTO THE LESSON READER ASKS THE GATE, AND EVERY SCREEN
//         KNOWS ALL FOUR COURSES.
//
// Run with: node scripts/check-lesson-doors.mjs
//
// ---- WHY THIS EXISTS ----
//
// Gigi, Aug 30 2026, on being offered a one-line fix to a label:
// "It is supposed to be that she can only see the lesson that is due so that she
// doesn't move forward before completing."
//
// She was right to ask, and the asking found something. check-lesson-gate holds
// that lessonIsOpen BEHAVES — first unfinished in week order, on all four
// courses, including after a skip — and that the block's target survives to the
// screen. It does not hold that everything which OPENS a lesson asked it.
//
// LessonsView had four routes into LessonReader. Three asked. The fourth, the
// "Worth going back to" buttons on a test's results, called setOpenLesson
// straight through and had done since the feature was written.
//
// ⚠️ NOTHING WAS WRONG ON SCREEN. A test only covers lessons she has already
// read, and a read lesson is open, so the gate would have said yes to every one
// of them. That is the part worth writing down: the door was correct BY ACCIDENT
// OF THE DATA, and the day a test covers a lesson she has not read it stops
// being correct with no warning and no red check. This is the same shape as the
// comment above the Herbalism branch that described the intention truthfully and
// the code falsely for fifty-nine versions (check-lesson-gate's opening note),
// and the same shape as check-khan-units §6c printing a promise nothing kept.
//
// ---- AND THE SECOND HALF, WHICH IS THE BUG THAT STARTED THE CONVERSATION ----
//
// TestView imported HERBALISM_Q1 and looked lesson titles up in it. HERBALISM_Q1
// holds THIRTEEN of the app's 256 lessons — the hb-1-01..13 flat cards. The
// other 243 fell through to a raw-id fallback, so after a Human Body test she
// was offered a button reading "hb2-07", and so were Herbalism Q2, Q3 and Q4.
//
// That is the v3.95 Gradebook bug in a fifth place: a screen that knows one
// course of four. So this check does not assert "TestView does not import
// herbalismQ1" — that is the instance. It asserts NO SCREEN imports a
// single-course lesson module, which is the class.
//
// ---- THE FIVE THINGS IT HOLDS ----
//
//   1. The doors are ENUMERATED. Every call that opens the reader in
//      LessonsView is found with the parser and matched against a named list
//      with a reason for each. A fifth door is red on arrival — it does not
//      matter whether the fifth door is gated, only that nobody was asked.
//   2. The revisit door asks the gate INSIDE LessonsView, not only on the
//      screen. A disabled button is a fact about the screen.
//   3. TestView is HANDED the gate. A missing canOpenLesson prop fails closed in
//      the component, which is the safe direction and the wrong outcome; this is
//      what stops it shipping.
//   4. The revisit button is greyed from the gate — disabled bound to it, not to
//      a constant.
//   5. No file under src/components imports a lesson module other than
//      appCourses.js.
//
// ---- AND IT ASSERTS THE GATE STILL BITES, ON REAL DATA ----
//
// Text alone would pass if lessonIsOpen were quietly changed to return true. So
// it also runs the gate on all four courses with a real read-list and asserts a
// lesson beyond the next one is CLOSED. That is the assertion which would go red
// if someone "opened the course back up" without saying who decided and when —
// which rotatingBlock.js line 296 explicitly invites them to do properly.
//
// ---- WHAT THIS DOES NOT TEST ----
//
// That the screen renders, that greyed is legible, or that "Not yet — this one
// comes later" is the right sentence. Gigi chose that wording; a check cannot.
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, relative, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const errors = [];
const notes = [];
const fail = (rule, msg) => errors.push(`[${rule}] ${msg}`);

// ---- THE PARSER. If it will not load this FAILS, it does not skip. ----------
let parse;
let traverse;
try {
  ({ parse } = await import('@babel/parser'));
  const t = await import('@babel/traverse');
  traverse = t.default?.default || t.default || t;
} catch (err) {
  console.error('\nFAILED — the parser could not be loaded, so nothing was read.');
  console.error(`  ${err.message}`);
  console.error('  This is a failure, not a skip. @babel/parser and @babel/traverse');
  console.error('  are declared in package.json and arrive with @vitejs/plugin-react.\n');
  process.exit(1);
}

const LESSONS_VIEW = 'src/components/Lessons/LessonsView.jsx';
const TEST_VIEW = 'src/components/Assess/TestView.jsx';

function read(rel) {
  try {
    return readFileSync(resolve(ROOT, rel), 'utf8');
  } catch {
    fail('files-exist', `${rel} is not on disk. This check reads it by name.`);
    return null;
  }
}

function ast(rel, code) {
  try {
    return parse(code, { sourceType: 'module', plugins: ['jsx'], errorRecovery: false });
  } catch (err) {
    fail('every-file-parses', `${rel} could not be parsed: ${err.message}`);
    return null;
  }
}

const lvCode = read(LESSONS_VIEW);
const tvCode = read(TEST_VIEW);
if (!lvCode || !tvCode) {
  console.error('\nFAILED — a file this check reads by name is missing.');
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

const lvAst = ast(LESSONS_VIEW, lvCode);
const tvAst = ast(TEST_VIEW, tvCode);
if (!lvAst || !tvAst) {
  console.error('\nFAILED — a file this check reads did not parse.');
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

// ===========================================================================
// 1. THE DOORS ARE ENUMERATED
//
// Each known door is identified by the ARGUMENT EXPRESSION passed to
// setOpenLesson, printed back from source. That is stable across reformatting
// and specific enough that a new door cannot hide behind an existing name.
// ===========================================================================

const KNOWN_DOORS = [
  {
    arg: 'requestedLessonId',
    why:
      'the block sends her in. Gated UPSTREAM by resolveBlockTarget, which ' +
      'check-lesson-gate holds to the same gate on all four courses.',
    gatedHere: false
  },
  {
    arg: 'lessonId',
    why:
      "the revisit buttons on a test's results, handed up from TestView. Gated " +
      'HERE — the door asks canOpenLesson before it opens.',
    gatedHere: true
  },
  {
    arg: 'next.lessonId',
    why:
      '"start the next one". Gated BY CONSTRUCTION — next IS nextLessonFor, so ' +
      'the value and the gate come from the same call.',
    gatedHere: false
  },
  {
    arg: 'lid',
    why: 'the lesson list. Gated HERE — disabled={!open}, and open is lessonIsOpen.',
    gatedHere: true
  },
  {
    arg: 'null',
    why: 'onBack. Closes the reader; opens nothing.',
    gatedHere: false
  }
];

const src = (node) => lvCode.slice(node.start, node.end).replace(/\s+/g, ' ').trim();

const doorsFound = [];
traverse(lvAst, {
  CallExpression(path) {
    const c = path.node.callee;
    if (c.type !== 'Identifier' || c.name !== 'setOpenLesson') return;
    const arg = path.node.arguments[0];
    doorsFound.push({
      arg: arg ? src(arg) : '(no argument)',
      line: path.node.loc?.start.line ?? 0,
      // Walk up to the enclosing function/handler and ask whether the gate is
      // named anywhere in it. Naming it is not proof it is obeyed, but NOT
      // naming it is proof it is not.
      guardText: (() => {
        const fn = path.getFunctionParent();
        return fn ? lvCode.slice(fn.node.start, fn.node.end) : '';
      })()
    });
  }
});

if (doorsFound.length === 0) {
  fail(
    'doors-were-found',
    `no setOpenLesson() calls were found in ${LESSONS_VIEW}. Either the reader is opened ` +
      `some other way now, or this check is walking nothing while printing a pass.`
  );
}

const knownArgs = new Set(KNOWN_DOORS.map((d) => d.arg));
for (const found of doorsFound) {
  if (!knownArgs.has(found.arg)) {
    fail(
      'doors-are-enumerated',
      `a route into the lesson reader that nobody has ruled on: setOpenLesson(${found.arg}) ` +
        `at ${LESSONS_VIEW}:${found.line}. Add it to KNOWN_DOORS in this file with the reason ` +
        `it is safe — and if the reason is "the gate is asked somewhere else", say WHERE. ` +
        `A door is not wrong for being new; it is wrong for being unexamined.`
    );
  }
}

for (const door of KNOWN_DOORS) {
  const found = doorsFound.filter((d) => d.arg === door.arg);
  if (found.length === 0) {
    fail(
      'doors-are-enumerated',
      `setOpenLesson(${door.arg}) is named in KNOWN_DOORS and is no longer in ${LESSONS_VIEW}. ` +
        `If it was removed on purpose, remove it here too — a list that describes a screen ` +
        `that has moved on is the stale comment this project keeps being bitten by.`
    );
    continue;
  }
  if (door.gatedHere) {
    for (const f of found) {
      if (!/canOpenLesson|lessonIsOpen|\bopen\b/.test(f.guardText)) {
        fail(
          'gated-doors-ask',
          `setOpenLesson(${door.arg}) at ${LESSONS_VIEW}:${f.line} is meant to ask the gate ` +
            `and its handler never names canOpenLesson, lessonIsOpen or open. ` +
            `${door.why}`
        );
      }
    }
  }
}

if (!errors.some((e) => e.startsWith('[doors-'))) {
  notes.push(`${doorsFound.length} routes into the reader, all of them ruled on`);
}

// ===========================================================================
// 2 & 3. THE GATE IS DEFINED HERE, AND HANDED TO TestView
// ===========================================================================

if (!/const canOpenLesson\s*=/.test(lvCode)) {
  fail(
    'gate-is-defined',
    `${LESSONS_VIEW} does not define canOpenLesson. Every door and the screen below it ` +
      `read the gate through this one function; without it they each ask their own way, ` +
      `which is the two-definitions drift v3.70 exists because of.`
  );
}

if (!/courseOfLesson\(/.test(lvCode)) {
  fail(
    'gate-asks-the-lessons-own-course',
    `${LESSONS_VIEW} defines canOpenLesson without calling courseOfLesson. The gate must be ` +
      `asked about the course the LESSON belongs to, not the tab she happens to be looking ` +
      `at — a Human Body result can be on screen with the Herbalism tab selected, and asking ` +
      `about the wrong course is the v3.42 bug: a link that goes to the wrong place.`
  );
}

let handedTheGate = false;
traverse(lvAst, {
  JSXOpeningElement(path) {
    if (path.node.name?.name !== 'TestView') return;
    handedTheGate = path.node.attributes.some(
      (a) => a.type === 'JSXAttribute' && a.name?.name === 'canOpenLesson'
    );
  }
});
if (!handedTheGate) {
  fail(
    'testview-is-handed-the-gate',
    `${LESSONS_VIEW} renders <TestView> without canOpenLesson. TestView fails CLOSED on a ` +
      `missing predicate, which is the safe direction — so this would not let her through, ` +
      `it would grey out every lesson she is entitled to revisit and look like a different bug.`
  );
} else {
  notes.push('TestView is handed the gate');
}

// ===========================================================================
// 4. THE REVISIT BUTTON IS GREYED FROM THE GATE
// ===========================================================================

let revisitGuarded = false;
let revisitDisabledFromGate = false;
let sawOnOpenLessonCall = false;
// ⚠️ `onOpenLesson?.(x)` parses as an OptionalCallExpression, NOT a
// CallExpression. Visiting only CallExpression saw nothing and reported the
// guard missing — on code that had the guard. This check's FIRST RUN found its
// own blind spot, which is the good outcome and the reason it runs before the
// commit rather than after: a visitor that matches nothing reports a lock as
// broken, and the next version along it would have reported one as present.
const onOpenLessonCall = (path) => {
  const c = path.node.callee;
  const member =
    (c.type === 'OptionalMemberExpression' || c.type === 'MemberExpression') &&
    c.object?.name === 'onOpenLesson';
  const direct = c.type === 'Identifier' && c.name === 'onOpenLesson';
  if (!member && !direct) return;
  const fn = path.getFunctionParent();
  const text = fn ? tvCode.slice(fn.node.start, fn.node.end) : '';
  if (/\bopen\b\s*&&/.test(text) || /canOpenLesson/.test(text)) revisitGuarded = true;
  sawOnOpenLessonCall = true;
};

traverse(tvAst, {
  CallExpression: onOpenLessonCall,
  OptionalCallExpression: onOpenLessonCall,
  JSXAttribute(path) {
    if (path.node.name?.name !== 'disabled') return;
    const v = path.node.value;
    if (v?.type !== 'JSXExpressionContainer') return;
    if (/!\s*open\b/.test(tvCode.slice(v.start, v.end))) revisitDisabledFromGate = true;
  }
});

if (!/canOpenLesson\s*\?\s*canOpenLesson\(|canOpenLesson\s*\(/.test(tvCode)) {
  fail(
    'testview-uses-the-gate',
    `${TEST_VIEW} never calls canOpenLesson. Accepting the prop and not asking it is the ` +
      `check-gradebook failure exactly: importing a name is not using it.`
  );
}
if (!/canOpenLesson\s*\?[^:]*:\s*false/.test(tvCode)) {
  fail(
    'missing-gate-means-closed',
    `${TEST_VIEW} does not fail CLOSED when canOpenLesson is absent. A default of "open" ` +
      `means one forgotten prop hands her the whole course, and nothing on screen would say so.`
  );
}
// ⚠️ THE FLOOR. If the walk found no call at all, the three assertions below
// are being made about nothing. Silence is not a pass.
if (!sawOnOpenLessonCall) {
  fail(
    'revisit-button-was-actually-read',
    `${TEST_VIEW} has no call to onOpenLesson anywhere. Either the revisit buttons are gone, ` +
      `or this check walked the file and matched nothing while asserting the lock is present.`
  );
}
if (!revisitGuarded) {
  fail(
    'revisit-button-asks',
    `${TEST_VIEW} calls onOpenLesson without a guard in the same handler. The button being ` +
      `greyed is not the lock — the call is.`
  );
}
if (!revisitDisabledFromGate) {
  fail(
    'revisit-button-is-greyed-from-the-gate',
    `${TEST_VIEW} has no disabled={!open} on the revisit button. Gigi asked for it greyed, ` +
      `Aug 30 2026: visible and not open, the same answer the lesson list gives.`
  );
}
if (!errors.some((e) => e.startsWith('[revisit-') || e.startsWith('[testview-') || e.startsWith('[missing-'))) {
  notes.push('the revisit door asks the gate and greys when it says no');
}

// ===========================================================================
// 5. NO SCREEN KNOWS ONE COURSE OF FOUR
// ===========================================================================

const COMPONENTS = resolve(ROOT, 'src/components');
const ALLOWED_LESSON_MODULE = 'appCourses.js';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(name)) out.push(full);
  }
  return out;
}

const componentFiles = walk(COMPONENTS);
if (componentFiles.length === 0) {
  fail('components-were-walked', 'no files were found under src/components. The walk found nothing.');
}

let scanned = 0;
for (const full of componentFiles) {
  const rel = relative(ROOT, full).replace(/\\/g, '/');
  const code = readFileSync(full, 'utf8');
  const tree = ast(rel, code);
  if (!tree) continue;
  scanned += 1;
  traverse(tree, {
    ImportDeclaration(path) {
      const from = path.node.source.value;
      if (!from.includes('data/lessons/')) return;
      const file = from.split('/').pop();
      if (file === ALLOWED_LESSON_MODULE) return;
      fail(
        'screens-know-every-course',
        `${rel}:${path.node.loc?.start.line} imports ${file} directly. That is ONE COURSE, and ` +
          `often one quarter of one course — herbalismQ1.js is 13 of the app's 256 lessons. A ` +
          `screen built on it is right for Herbalism and silently wrong for the other three, ` +
          `which is the v3.95 Gradebook bug and the v3.96 TestView bug. Ask appCourses.js: ` +
          `ALL_LESSONS, lessonById, courseOfLesson have covered all four since v3.25.`
      );
    }
  });
}
if (scanned === 0) {
  fail('components-were-parsed', 'no component files were parsed while this check printed a pass.');
} else if (!errors.some((e) => e.startsWith('[screens-know'))) {
  notes.push(`${scanned} screens scanned, none built on a single course`);
}

// ===========================================================================
// AND THE GATE STILL BITES — RUN IT, DO NOT READ IT
// ===========================================================================

const { APP_COURSES } = await import(
  pathToFileURL(resolve(ROOT, 'src/data/lessons/appCourses.js')).href
);
const { lessonIsOpen, nextLessonFor } = await import(
  pathToFileURL(resolve(ROOT, 'src/lib/rotatingBlock.js')).href
);

for (const course of APP_COURSES) {
  const next = nextLessonFor(course.id, []);
  if (!next) {
    fail('gate-bites', `nextLessonFor('${course.id}', []) returned nothing on a fresh start.`);
    continue;
  }
  if (!lessonIsOpen(next.lessonId, course.id, [])) {
    fail(
      'gate-bites',
      `${course.id}: the lesson she is up to (${next.lessonId}) is CLOSED on a fresh start. ` +
        `She would open the course and be able to enter nothing.`
    );
  }
  // The one after it must be shut. This is the assertion that goes red if the
  // gate is ever made to return true unconditionally.
  const after = nextLessonFor(course.id, [next.lessonId]);
  if (after && lessonIsOpen(after.lessonId, course.id, [])) {
    fail(
      'gate-bites',
      `${course.id}: ${after.lessonId} is OPEN before ${next.lessonId} has been read. ` +
        `She can move forward without completing, which is the one thing Gigi asked for by name.`
    );
  }
  // And anything finished stays open — going back is not jumping ahead.
  if (!lessonIsOpen(next.lessonId, course.id, [next.lessonId])) {
    fail(
      'gate-bites',
      `${course.id}: ${next.lessonId} is closed AFTER she read it. She may always go back ` +
        `over what she has finished — v3.79, and the reason the road ahead is visible.`
    );
  }
}
if (!errors.some((e) => e.startsWith('[gate-bites]'))) {
  notes.push(`the gate opens one lesson and shuts the next, on all ${APP_COURSES.length} courses`);
}

// ===========================================================================
// REPORT
// ===========================================================================

console.log('\nPetal & Pestle — lesson doors check\n');
console.log(`  routes into the reader   ${doorsFound.length}`);
for (const d of doorsFound) {
  const known = KNOWN_DOORS.find((k) => k.arg === d.arg);
  console.log(`    line ${String(d.line).padStart(4)}  setOpenLesson(${d.arg})`);
  if (known) console.log(`              ${known.why}`);
}
console.log(`  screens scanned          ${scanned}`);
console.log(`  courses the gate ran on  ${APP_COURSES.length}`);
console.log('');
for (const n of notes) console.log(`  · ${n}`);
console.log('');
console.log('  NOT TESTED HERE: that the screen renders, that greyed is legible, or');
console.log('  that "Not yet — this one comes later" is the right sentence. Gigi chose');
console.log('  those words; a check cannot.');

if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors.slice(0, 20)) console.error(`  ✗ ${e}`);
  if (errors.length > 20) console.error(`  ...and ${errors.length - 20} more`);
  process.exit(1);
}

console.log('\nEvery door into a lesson asks the same gate, and every screen knows all four courses.\n');
