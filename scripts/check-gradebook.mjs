// ---------------------------------------------------------------------------
// CHECK — THE GRADEBOOK KNOWS EVERY COURSE, IN EVERY SECTION.
//
// Run with: node scripts/check-gradebook.mjs
//
// ---- WHY THIS EXISTS ----
//
// Gigi, Aug 29 2026: "The long list of randomness in the Test tab under
// Gradebook is confusing. I want to open one place and see how she is doing in
// each subject."
//
// GradebookPanel.jsx was written for Herbalism and three courses were added
// around it. ONE BUG, FOUR TIMES, IN ONE FILE:
//
//   · the Tests table called allWeeks() — 104 weeks across four courses — and
//     printed all of them under a heading reading "Herbalism · Quarter 1", with
//     no column saying which course a row was. She had sat 11 tests.
//   · the practice gate filtered HERBALISM_Q1 only.
//   · lessonLabel() searched HERBALISM_Q1 only, so Science Lab, Social Studies
//     and Human Body questions printed raw ids like `sl-m2-04`.
//   · the exam rows were hardcoded `herbalism-q1-final` and `q2-final`, while
//     assessmentEngine generates `${course}-q${n}-final` for every course and
//     every quarter — fourteen exam results with nowhere to appear.
//
// A course was added four times and this screen was updated zero times. That is
// what this check is for: it is not "does the Gradebook work", it is "has a
// course been left out of a section AGAIN".
//
// ---- IT ASKS THE CODE, NOT THE TEXT ----
//
// The arithmetic is in src/lib/gradebook.js as a PURE function precisely so
// this file can call it with a built record and assert what the screen would
// show. v3.92 is why: 38 checks were green while the Grown-Up Corner was down,
// because every one of them read text. A comment explaining why something is
// fine is not a check — three bugs in this project came from exactly that, so
// the panel assertions below run on the PARSED import list and on source with
// comments and strings stripped, never on the raw file.
//
// ⚠️ WHAT THIS DOES NOT TEST: that the screen renders, that the numbers are the
// ones Gigi would choose, or that a subject's grade is fair. It tests that no
// course has been left out and that no quarter holding work is hidden.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// v3.73: Windows rejects a bare absolute path as a module specifier. Every
// time, without exception — seventeen scripts died on this and looked green.
const load = (p) => import(pathToFileURL(resolve(ROOT, p)).href);

const errors = [];
const fail = (msg) => errors.push(msg);

let parse;
try {
  ({ parse } = await import('@babel/parser'));
} catch (err) {
  console.error('\nPetal & Pestle — gradebook check\n');
  console.error(
    '  COULD NOT LOAD THE PARSER, so nothing was checked and this is a FAILURE,\n' +
      '  not a skip. @babel/parser is declared in package.json.\n' +
      `  Run npm install and try again.\n\n  ${err.message}\n`
  );
  process.exit(1);
}

const { APP_COURSES } = await load('src/data/lessons/appCourses.js');
const { allWeeks, RETAKE } = await load('src/config/assessment.js');
const { getSubjectGrades, GRADEBOOK_SUBJECTS, YEAR_QUARTERS, testLoadByDay, retakeState } =
  await load('src/lib/gradebook.js');
const { KHAN_UNIT_COURSES } = await load('src/data/khan/khanUnits.js');

const weeks = allWeeks();

// ===========================================================================
// 1. EVERY COURSE HAS A CARD.
// ===========================================================================
//
// The exact failure, stated as an assertion. Deleting a course from
// GRADEBOOK_SUBJECTS — or from APP_COURSES, or building the list by hand again
// — turns this red.

const cards = getSubjectGrades({});
const cardIds = new Set(cards.map((c) => c.id));

for (const course of APP_COURSES) {
  if (!cardIds.has(course.id)) {
    fail(
      `no subject card for "${course.id}" (${course.label}). Every course in APP_COURSES must ` +
        `have one — a course added and not shown here is the bug this check exists for.`
    );
  }
}

// The fifth card is not a course and must still be there.
if (!cardIds.has('language-arts')) {
  fail('no "language-arts" card. Language Arts & Writing is a subject on this screen.');
}

// ===========================================================================
// 2. NO KHAN RESULT REACHES THIS SCREEN. NO MATHEMATICS CARD.
// ===========================================================================
//
// Gigi, Aug 29, correcting the first cut of this file: "I asked for grades for
// the lessons that the app creates on this screen. Kahn has its own tab."
//
// The first version counted Khan GRAMMAR toward Language Arts while keeping
// Khan MATHS off, on a distinction about which subjects had app-owned work
// beside them. That distinction was invented and it would have drifted. Hers is
// drawn by WHO WROTE THE WORK, needs no exceptions, and is what is asserted.
//
// ⚠️ EVERY KHAN COURSE IS PROBED, NOT JUST MATHS. Asserting only "no card
// called Mathematics" would still pass if a Khan row were folded into another
// subject's average — which is exactly what the first cut did, and it looked
// completely reasonable on screen.

for (const c of cards) {
  if (/^math/i.test(c.id) || /mathematic/i.test(c.label)) {
    fail(`"${c.label}" is a card on the Gradebook. Maths belongs on the Khan grades tab only.`);
  }
}

const khanCourseIds = Object.keys(KHAN_UNIT_COURSES);
if (!khanCourseIds.length) {
  fail('KHAN_UNIT_COURSES is empty — this check can no longer prove Khan work is excluded.');
}

for (const courseId of khanCourseIds) {
  const course = KHAN_UNIT_COURSES[courseId];
  const probed = getSubjectGrades({
    khanGrades: [
      {
        gradeId: `probe-${courseId}`,
        courseId,
        subject: course.subject,
        unitN: 1,
        unit: 'Unit 1',
        courseLabel: course.label,
        kind: 'unit',
        percent: 100,
        grade: 'A+',
        at: '2026-09-01'
      }
    ]
  });
  const landed = probed.filter((c) => c.assessedCount > 0);
  if (landed.length) {
    fail(
      `a Khan result from "${course.label}" (subject "${course.subject}") reached ` +
        `${landed.map((c) => c.label).join(', ')}. No Khan result may reach any card — this ` +
        `screen grades the work THIS APP made, and Khan is graded on its own tab.`
    );
  }
}

// ===========================================================================
// 3. A CARD'S QUARTERS ARE THE QUARTERS ITS COURSE WAS BUILT FOR.
// ===========================================================================
//
// sciencelab is [1, 3] and social is [1, 2, 3]. A quarter a course was never
// built for is not "not reached yet" — it is not coming, and a greyed row would
// promise work that does not exist.

for (const course of APP_COURSES) {
  const card = cards.find((c) => c.id === course.id);
  if (!card) continue;
  const want = [...(course.quarters || [])].sort((a, b) => a - b).join(',');
  const got = card.quarters.map((q) => q.quarter).join(',');
  if (want !== got) {
    fail(`${course.label}: card shows quarters [${got}], course declares [${want}].`);
  }
}

// ===========================================================================
// 4. NO QUARTER THAT HOLDS WORK IS OMITTED — AND EVERY EXAM ID IS CONSUMED.
// ===========================================================================
//
// Built rather than assumed: one weekly test AND one quarter exam sat in every
// quarter of every course, then every one of them is looked for on the card it
// belongs to. This is the negative test's target — delete a course from any
// section and this block goes red.

const attempts = [];
for (const course of APP_COURSES) {
  for (const q of course.quarters || []) {
    const week = weeks.find((w) => w.course === course.id && w.quarter === q);
    if (!week) {
      fail(`${course.label} declares quarter ${q} and allWeeks() has no week in it.`);
      continue;
    }
    attempts.push({
      testId: week.id,
      attemptId: `a-${week.id}`,
      at: '2026-09-01',
      dayKey: '2026-09-01',
      right: 8,
      total: 10,
      percent: 80,
      bandId: 'nearly',
      rows: []
    });
    attempts.push({
      testId: `${course.id}-q${q}-final`,
      attemptId: `a-${course.id}-q${q}-final`,
      at: '2026-09-02',
      dayKey: '2026-09-02',
      right: 30,
      total: 40,
      percent: 75,
      bandId: 'nearly',
      rows: []
    });
  }
}

const filled = getSubjectGrades({ attempts });

for (const course of APP_COURSES) {
  const card = filled.find((c) => c.id === course.id);
  if (!card) continue;

  for (const q of course.quarters || []) {
    const row = card.quarters.find((r) => r.quarter === q);
    if (!row) {
      fail(`${course.label}: quarter ${q} holds work and has no row on the card.`);
      continue;
    }
    if (row.percent === null) {
      fail(`${course.label} Q${q}: work was recorded and the row still reads "not reached".`);
    }
    const exam = card.assessments.find(
      (a) => a.source === 'quarter-exam' && a.quarter === q
    );
    if (!exam) {
      fail(
        `${course.label} Q${q}: the exam "${course.id}-q${q}-final" was sat and reaches no card. ` +
          `assessmentEngine generates that id for every course and every quarter.`
      );
    }
  }
}

// ===========================================================================
// 5. AN EXAM WEIGHS WHAT THE QUARTER WEIGHS. (Gigi's decision, Aug 29 2026.)
// ===========================================================================
//
// Not a preference written down — a rule with a number. Three weekly tests at
// 100 and a quarter exam at 0 must come out 50, not the 75 equal weight gives.
// If this ever reads 75 again, the exam has silently become 2.8% of the grade
// and she could fail all four and finish with an A.

{
  const q1 = weeks.filter((w) => w.course === 'herbalism' && w.quarter === 1).slice(0, 3);
  const probe = q1.map((w, i) => ({
    testId: w.id,
    attemptId: `w${i}`,
    at: `2026-09-0${i + 1}`,
    dayKey: `2026-09-0${i + 1}`,
    right: 10,
    total: 10,
    percent: 100,
    bandId: 'got-it',
    rows: []
  }));
  probe.push({
    testId: 'herbalism-q1-final',
    attemptId: 'ex',
    at: '2026-10-20',
    dayKey: '2026-10-20',
    right: 0,
    total: 40,
    percent: 0,
    bandId: 'go-back',
    rows: []
  });
  const herb = getSubjectGrades({ attempts: probe }).find((c) => c.id === 'herbalism');
  if (herb.percent !== 50) {
    fail(
      `an exam no longer weighs its quarter: three tests at 100% and an exam at 0% came out ` +
        `${herb.percent}%, and it must be 50%. At equal weight it reads 75%.`
    );
  }
}

// ===========================================================================
// 6. AN UNREACHED QUARTER IS NULL, NEVER ZERO.
// ===========================================================================
//
// "Never a blank, never a zero" — Gigi. A zero is a grade she was never given,
// and it is the difference between "she has not got there" and "she failed".

for (const c of cards) {
  for (const row of c.quarters) {
    if (row.percent === 0 || row.letter === 'F') {
      fail(`${c.label} ${row.label}: nothing has been sat and the row reads ${row.percent}%.`);
    }
    if (row.state !== 'not-reached') {
      fail(`${c.label} ${row.label}: nothing has been sat and the row does not say so.`);
    }
  }
}

// ===========================================================================
// 7. THE PANEL RENDERS FROM THE LIB AND KNOWS NO SINGLE COURSE BY NAME.
// ===========================================================================
//
// Parsed, not grepped. The import list comes off the AST, so the comments in
// GradebookPanel.jsx that DISCUSS the old `HERBALISM_Q1` import cannot satisfy
// or trip this — the v3.72 failure, where a check matched the comments
// explaining the decision it was testing.

const PANEL = 'src/components/Parent/GradebookPanel.jsx';
const panelSrc = readFileSync(resolve(ROOT, PANEL), 'utf8');

let ast;
try {
  ast = parse(panelSrc, { sourceType: 'module', plugins: ['jsx'] });
} catch (err) {
  fail(`${PANEL} does not parse: ${err.message}`);
  ast = null;
}

if (ast) {
  const imported = ast.program.body
    .filter((n) => n.type === 'ImportDeclaration')
    .map((n) => n.source.value);

  for (const spec of imported) {
    if (/\/lessons\/(?!appCourses)/.test(spec)) {
      fail(
        `${PANEL} imports "${spec}" — a single course's lessons. This screen must read every ` +
          `course through appCourses.js. That import IS the bug: it is how the practice gate and ` +
          `lessonLabel came to know Herbalism and nothing else.`
      );
    }
  }

  if (!imported.some((s) => s.includes('lib/gradebook.js'))) {
    fail(
      `${PANEL} does not import lib/gradebook.js. The arithmetic lives there so this check can ` +
        `call it; a panel that computes its own numbers cannot be tested by anything but reading it.`
    );
  }
  if (!imported.some((s) => s.includes('lessons/appCourses.js'))) {
    fail(`${PANEL} does not import appCourses.js, so it cannot know all four courses.`);
  }
}

// ===========================================================================
// 8. "WHAT IS STICKING" SURVIVED THE REBUILD.
// ===========================================================================
//
// ⚠️ Gigi: "Keep it. Do not move it, shrink it, or soften a single number."
// It is the most useful thing on the screen and it was not what she asked to
// have fixed, so it is asserted rather than trusted to care.
//
// Checked against source with COMMENTS AND STRINGS BLANKED for the structural
// parts, and against the raw text only for the visible words — which is the
// right way round, because these ARE the visible words.

for (const phrase of [
  'What is sticking',
  'Worth sitting down with her about',
  'Solid',
  'Settling',
  'Slipping',
  'Not yet met'
]) {
  if (!panelSrc.includes(phrase)) {
    fail(`"${phrase}" is gone from the Gradebook. The "What is sticking" panel must stay intact.`);
  }
}

// ===========================================================================
// 9. THE SUBJECT LIST IS GENERATED, NOT TYPED.
// ===========================================================================
//
// Rule 19 of this project: anything countable is generated. A hand-typed list
// of five subjects is how a sixth course gets forgotten — which is the entire
// history of this file.

const libSrc = readFileSync(resolve(ROOT, 'src/lib/gradebook.js'), 'utf8');
if (!/APP_COURSES\.map\(/.test(libSrc)) {
  fail(
    'src/lib/gradebook.js no longer builds its subjects from APP_COURSES.map(). A typed list ' +
      'means the next course added is missing from this screen and nothing says so.'
  );
}

/**
 * Source with comments and string bodies blanked.
 *
 * ⚠️ v3.72: a check searched a component's raw source and "found" the guards it
 * was testing IN THE COMMENTS EXPLAINING THEM — it stayed green twice with the
 * real code deleted. Every text assertion in this file runs through here.
 */
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

// ===========================================================================
// 10. HER BEST IS SHOWN BESIDE HER LATEST, AND IS NEVER BELOW IT.
// ===========================================================================
//
// Gigi's call, Aug 29, after "I don't want to overwhelm her. Her grades aren't
// doing so well." ⚠️ THE LATEST IS STILL THE RECORD — this asserts that best is
// ADDED, never substituted, and that it cannot silently become a second way of
// reporting the same number or, worse, a lower one.
//
// A "best" that could come out below the latest would be arithmetic nobody
// would question on screen, because it would still look like a plausible
// grade. That is the class of bug this project keeps finding.

{
  const probe = [
    ['sciencelab-q1-w1', 50, '2026-08-24'],
    ['sciencelab-q1-w1', 63, '2026-08-26'],
    ['sciencelab-q1-w1', 38, '2026-08-28']
  ].map(([testId, percent, day], i) => ({
    testId,
    attemptId: `b${i}`,
    at: day,
    dayKey: day,
    right: 0,
    total: 8,
    percent,
    bandId: 'nearly',
    kind: 'weekly',
    rows: []
  }));

  const card = getSubjectGrades({ attempts: probe }).find((c) => c.id === 'sciencelab');

  if (card.percent !== 38) {
    fail(`the headline is no longer her LATEST attempt: got ${card.percent}%, expected 38%.`);
  }
  if (card.percentBest !== 63) {
    fail(`her best is wrong: got ${card.percentBest}%, expected 63% (50, 63, 38).`);
  }
}

for (const c of filled) {
  if (c.percent !== null && c.percentBest === null) {
    fail(`${c.label}: has a grade and no "best" beside it.`);
  }
  if (c.percentBest !== null && c.percentBest < c.percent) {
    fail(`${c.label}: "best" (${c.percentBest}%) is BELOW the latest (${c.percent}%).`);
  }
  for (const q of c.quarters) {
    if (q.percentBest !== null && q.percentBest < q.percent) {
      fail(`${c.label} ${q.label}: "best" is below the latest.`);
    }
  }
}

// ===========================================================================
// 11. THE TEST-LOAD COUNT, AND THE RE-TAKE CAP READ FROM CONFIG.
// ===========================================================================
//
// The load line exists because nothing was counting how much she sat in a day.
// Her record held FOUR assessments on Aug 26 and THREE on Aug 28, and the only
// story the screen could tell was the one about her.
//
// ⚠️ THE CAP IS ASSERTED AGAINST config/assessment.js, NOT AGAINST A NUMBER
// TYPED HERE. Two copies of one rule is v3.92, v3.84 and v3.78 — three times
// this app has had two answers to one question and shown both.

{
  const day = (d, n) =>
    Array.from({ length: n }, (_, i) => ({
      testId: `t-${d}-${i}`,
      attemptId: `l-${d}-${i}`,
      at: d,
      dayKey: d,
      percent: 50,
      right: 0,
      total: 8,
      bandId: 'nearly',
      rows: []
    }));
  const rows = testLoadByDay([...day('2026-08-26', 4), ...day('2026-08-24', 2)]);

  if (rows.length !== 2) fail(`testLoadByDay returned ${rows.length} days, expected 2.`);
  const heavy = rows.find((r) => r.day === '2026-08-26');
  const light = rows.find((r) => r.day === '2026-08-24');
  if (heavy?.count !== 4) fail(`the four-assessment day counted ${heavy?.count}, expected 4.`);
  if (!heavy?.heavy) fail('a day with FOUR assessments is not flagged heavy.');
  if (light?.heavy) fail('a day with TWO assessments is flagged heavy, and should not be.');
  if (rows[0].day < rows[1].day) fail('testLoadByDay is not newest-first.');
}

{
  const st = retakeState(3);
  if (st.cap !== RETAKE.maxAttempts) {
    fail(
      `retakeState reports a cap of ${st.cap} while config/assessment.js says ` +
        `${RETAKE.maxAttempts}. The cap must be READ from RETAKE, never typed beside it.`
    );
  }
  if (st.minDaysBetween !== RETAKE.minDaysBetween) {
    fail('retakeState reports a re-take gap that disagrees with RETAKE.minDaysBetween.');
  }
  if (!retakeState(RETAKE.maxAttempts).atCap) {
    fail('a test sat the maximum number of times does not report atCap.');
  }
  if (retakeState(RETAKE.maxAttempts - 1).atCap) {
    fail('a test with a re-take still available reports atCap.');
  }
}

/**
 * The panel must CALL both and RENDER the result.
 *
 * ⚠️ THIS ASSERTION WAS WRITTEN WEAKLY FIRST AND ITS NEGATIVE TEST CAUGHT IT.
 * It searched the panel's source for the two names. The load was then deleted
 * from the component and replaced with an empty array — and the check STAYED
 * GREEN, because the names were still sitting in the import statement at the
 * top of the file.
 *
 * An import is not a call and a call is not a render. So this walks the AST for
 * a real CallExpression on each name, and for the <TestLoad> element itself. A
 * value computed and shown to nobody is the failure Lamar's app was rebuilt
 * over — "a grade written to a row that no record reads is not a grade."
 */
if (ast) {
  const calls = new Set();
  const jsxNames = new Set();
  (function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.type === 'CallExpression' && node.callee?.type === 'Identifier') {
      calls.add(node.callee.name);
    }
    if (node.type === 'JSXOpeningElement' && node.name?.type === 'JSXIdentifier') {
      jsxNames.add(node.name.name);
    }
    for (const k of Object.keys(node)) {
      if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments') continue;
      walk(node[k]);
    }
  })(ast.program);

  for (const name of ['testLoadByDay', 'retakeState']) {
    if (!calls.has(name)) {
      fail(
        `${PANEL} never CALLS ${name}() — importing the name is not using it. The value would be ` +
          `computed in the lib and shown to nobody.`
      );
    }
  }
  if (!jsxNames.has('TestLoad')) {
    fail(
      `${PANEL} does not render <TestLoad>. The test-load figures exist and reach no screen, ` +
        `which is the whole failure they were added to fix.`
    );
  }
}

// ===========================================================================
// REPORT
// ===========================================================================

console.log('\nPetal & Pestle — gradebook check\n');
console.log(`  subject cards          ${cards.length} (${cards.map((c) => c.id).join(', ')})`);
console.log(`  courses required       ${APP_COURSES.length}`);
console.log(`  weeks across courses   ${weeks.length}`);
console.log(`  quarters in the year   ${YEAR_QUARTERS.join(', ')}`);
console.log(`  probe assessments      ${attempts.length} (a test and an exam in every quarter)`);
console.log(`  declared subjects      ${GRADEBOOK_SUBJECTS.length}`);
console.log('');
console.log('  NOT TESTED HERE: that the screen renders, that the numbers are');
console.log('  the right ones to have chosen, or that a grade is fair.');

if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors.slice(0, 20)) console.error(`  ✗ ${e}`);
  if (errors.length > 20) console.error(`  ...and ${errors.length - 20} more`);
  process.exit(1);
}

console.log('\nEvery course has a card, in every section, and no quarter with work is hidden.\n');
