// ---------------------------------------------------------------------------
// CHECK — RECORDING A GRADE ACTUALLY MOVES HER ON.
//
// Run with: node scripts/check-khan-advance.mjs
//
// ---- WHY THIS EXISTS ----
//
// Gigi, Aug 23 2026: "When she is in her Today's Planner it is supposed to
// connect her to the unit she is working on in Khan Academy, but it is a new
// week and the links still have the same units connected."
//
// The cause was not the calendar. `addKhanGrade` stored
// { subject, unit, percent, at, note } and `nextUnitFor` counts a unit as done
// only when the row carries `courseId` AND `unitN`. Neither was ever written by
// any code path in this app. So every grade Gigi could enter was invisible to
// the thing that advances Azianna, and the Planner offered Unit 1 for ever.
//
// ---- AND TWENTY-NINE CHECKS PASSED WHILE IT WAS BROKEN ----
//
// check-khan-units §6c walks Unit 1 to 8 and then the Course Challenge. It did
// that with grade objects IT BUILT ITSELF — `grades.push({ courseId, unitN })` —
// a shape the app had never once produced. It was testing `nextUnitFor` in
// isolation and printing "advance one unit per grade", which is a claim about
// the APP.
//
// That check's own comment, one section higher, confesses to the identical
// mistake: "it asserted the block opens an exact unit and never once asked
// WHICH. It passed, green, while the app skipped five units." A check that
// tests the shape of an answer and not the answer is how a bug ships with
// twenty-nine checks passing. It happened twice, in one file.
//
// So this check never builds a grade row. It puts one through THE APP'S OWN
// WRITER and hands the result to the app's own resolver.
//
// ---- WHAT IT ASSERTS ----
//
//   0. The ladder matches every letter on Lamar's real report card, the A+
//      threshold stays marked as assumed, and every percent 0-100 has a letter.
//   0b. A fraction becomes a percent and a letter — 8 of 10 is 80% and a B- —
//      and THE FRACTION IS WHAT GETS STORED, not just the conclusion.
//   0c. A course average counts recorded units only, never absent ones.
//   0d. A COURSE CHALLENGE IS NOT A UNIT TEST. It never marks a unit done, it
//      is never averaged in with the units, it is refused for a course Khan
//      built no challenge for, and a row written before the kind existed is
//      still read as a unit test.
//   1. The writer stamps courseId and unitN on every row it produces.
//   2. A row from the writer makes `nextUnitFor` move to the next unit —
//      the round trip, end to end, for every gradeable course.
//   3. Walking a whole course one recorded result at a time ends at the
//      Course Challenge, where the course has one.
//   4. The store still calls the writer and does not hand-build a row again.
//      That is the exact regression, so it is asserted as source, not style.
//   5. The form cannot save a unit that is not in the catalog — the free-text
//      box is what made an unmatchable row possible.
//   6. A pre-v3.74 row is still ignored rather than guessed at.
//
// ---- WHAT IT DOES NOT ASSERT, so it never claims more than it tests ----
//
//   · That Gigi will record anything. Nothing can know that.
//   · That a percent is right, or that Khan agrees with it.
//   · That the unit URLs are live — check-khan-units owns that, and cannot
//     promise it either.
//   · That the SCREEN renders any of this. It asserts the call sites exist,
//     not what they look like.
//
// NOTE ON REGEXES BELOW: no quote character appears inside a character class,
// because check-sources strips strings before counting brackets and has no
// concept of a regex literal — see the header of src/lib/readingLoad.js.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// v3.73: Windows rejects a bare path here. pathToFileURL, every time.
const load = (p) => import(pathToFileURL(resolve(ROOT, p)).href);

const {
  khanGradeRow, gradeAdvances, KHAN_GRADEABLE_COURSES, KHAN_GRADE_LETTERS, KHAN_MASTERY_GUIDE,
  KHAN_LETTER_BANDS, letterForPercent, percentFromFraction, courseAverage, bandForPercent,
  KIND_UNIT, KIND_CHALLENGE, kindOf, isChallenge, challengeFor
} = await load('src/lib/khanGrade.js');
const { KHAN_UNIT_COURSES, nextUnitFor, countsAsUnitDone } = await load('src/data/khan/khanUnits.js');

const errors = [];
const notes = [];

// ---- 0. THE LADDER, AND IT COMES OFF THE SCREEN --------------------------
//
// ⚠️ v3.74 REPORTED LAMAR'S SCALE AS FIVE BANDS AND WAS WRONG. It read
// PROJECT_LOG.md — "A 90-100, B 80-89, C 70-79, D 60-69, F below 60" — and
// stated it as a fact in a build log. Gigi then sent a screenshot of the
// report card his app ACTUALLY RENDERS:
//
//      Mathematics  B 86%  ·  ELA  A 93%  ·  Reading & Literature  A+ 99%
//      Grammar & Writing  B 86%  ·  Science  B- 82%
//
// A+ and B- cannot exist on a five-band scale. All five points fit the
// plus/minus ladder and only that: 86 is a B because B+ starts at 87, and 82
// is a B- because B starts at 83.
//
// A DOCUMENT ABOUT AN APP IS NOT THE APP. Lamar's folder holds docs and no
// code, so the newest thing in it is still older than his screen. The five
// points below are the evidence, asserted, so the ladder cannot be quietly
// retuned without one of them going red.

{
  // Every row of the screenshot, and it is the whole reason the ladder is
  // shaped this way. Changing a band breaks the row that proves it.
  // Declared outside the loop so the notes below can name every proven point.
  const FROM_THE_SCREENSHOT = [
    { percent: 99, grade: 'A+', where: 'Reading & Literature' },
    { percent: 93, grade: 'A', where: 'English Language Arts' },
    { percent: 86, grade: 'B', where: 'Mathematics' },
    { percent: 86, grade: 'B', where: 'Grammar & Writing' },
    { percent: 82, grade: 'B-', where: 'Science' }
  ];
  for (const row of FROM_THE_SCREENSHOT) {
    const got = letterForPercent(row.percent);
    if (got !== row.grade) {
      errors.push(
        `${row.percent}% gives ${got}, but Lamar's report card shows ${row.grade} for ${row.where}. ` +
          `That screenshot is the only evidence this ladder has — if the ladder changed on purpose, ` +
          `change this list too, with the new evidence beside it.`
      );
    }
  }

  // The bands must descend and end at a floor, or some percent has no letter.
  for (let i = 1; i < KHAN_LETTER_BANDS.length; i += 1) {
    if (KHAN_LETTER_BANDS[i].min >= KHAN_LETTER_BANDS[i - 1].min) {
      errors.push(
        `the ladder goes ${KHAN_LETTER_BANDS[i - 1].min} then ${KHAN_LETTER_BANDS[i].min} — ` +
          `bands must descend or a percent lands on the wrong letter`
      );
    }
  }
  if (KHAN_LETTER_BANDS[KHAN_LETTER_BANDS.length - 1].min !== 0) {
    errors.push('the ladder has no floor at 0, so some percent has no letter at all');
  }
  for (let p = 0; p <= 100; p += 1) {
    if (!letterForPercent(p)) errors.push(`${p}% has no letter`);
  }

  // ⚠️ THE ASSUMED BAND MUST STAY DECLARED. The screenshot proves 99 earns an
  // A+ and does not say where A+ starts. 97 is the ordinary threshold and it
  // is a guess. A guess that stops announcing itself becomes a fact.
  const assumed = KHAN_LETTER_BANDS.filter((b) => b.assumed);
  if (assumed.length !== 1 || assumed[0].grade !== 'A+') {
    errors.push(
      'the A+ threshold is no longer marked `assumed: true`. It was never confirmed against ' +
        "Lamar's app — only that 99% earns an A+. Confirm it or keep the flag."
    );
  } else {
    notes.push(`A+ starts at ${assumed[0].min}% — ASSUMED, not confirmed. Affects 97, 98, 99 only.`);
  }

  /* ---- WHAT THE SCREENSHOT PINS, AND WHAT IT DOES NOT ----
   *
   * Found by a negative test that CORRECTLY STAYED GREEN. Moving the B- floor
   * from 80 to 79 broke nothing, because the evidence is five points and not a
   * ladder: it proves 82 is a B- and 86 is a B, so B's floor is somewhere in
   * 83..86 — and 83, 84 and 85 are convention, not evidence.
   *
   * That is the check behaving correctly, not a hole in it. Rule 4: a check
   * must never claim more than it tests. So it says out loud which rungs are
   * proven and which are the ordinary +/- ladder filled in around them, rather
   * than printing five green ticks and letting the ladder look confirmed.
   *
   * TO PIN THE REST: one more screenshot of Lamar's report card with a mark in
   * the 80s or the low 90s, or a look at his code. Not urgent — every band
   * here is the standard ladder, and it already matches every point we have.
   */
  const PROVEN = FROM_THE_SCREENSHOT.map((r) => `${r.percent}→${r.grade}`).join(', ');
  notes.push(`pinned by the screenshot: ${PROVEN}`);
  notes.push(
    'the rungs BETWEEN those points are the ordinary +/- ladder, not evidence — ' +
      'B floor is only known to be 83..86'
  );

  // A letter is not a number and must never be sorted like one.
  if (letterForPercent(89) === letterForPercent(90)) {
    errors.push('89% and 90% give the same letter — the A- band is not doing anything');
  }
  if (letterForPercent(59) !== 'F') errors.push('59% is not an F');
  if (letterForPercent(100) !== 'A+') errors.push('100% is not an A+');
  if (letterForPercent(null) !== null || letterForPercent('x') !== null) {
    errors.push('a missing mark gets a letter — an absent score is not a failing one');
  }
}

// ---- 0b. THE FRACTION IS THE WAY IN, AND 8/10 IS B- ----------------------
//
// Gigi, Aug 24: "I'll type 8/10. The app will make that into a percentage and
// a letter grade." Khan prints a fraction on a unit test; that is the entry.

{
  const CASES = [
    { correct: 8, total: 10, percent: 80, grade: 'B-' },
    { correct: 10, total: 10, percent: 100, grade: 'A+' },
    { correct: 7, total: 9, percent: 78, grade: 'C+' },
    { correct: 0, total: 10, percent: 0, grade: 'F' },
    { correct: 6, total: 7, percent: 86, grade: 'B' }
  ];
  for (const t of CASES) {
    const p = percentFromFraction(t.correct, t.total);
    if (p !== t.percent) {
      errors.push(`${t.correct} of ${t.total} came out ${p}%, expected ${t.percent}%`);
      continue;
    }
    const built = khanGradeRow({ courseId: 'math2', unitN: 1, correct: t.correct, total: t.total });
    if (!built.ok) {
      errors.push(`the writer refused ${t.correct} of ${t.total}: ${built.reason}`);
      continue;
    }
    if (built.row.grade !== t.grade) {
      errors.push(
        `${t.correct} of ${t.total} is ${t.percent}% and was graded ${built.row.grade}, expected ${t.grade}`
      );
    }
    // ⚠️ THE FRACTION IS STORED, NOT JUST THE CONCLUSION. addWritingMark's
    // rule: keep what was observed so a total can never quietly disagree with
    // what it came from.
    if (built.row.correct !== t.correct || built.row.total !== t.total) {
      errors.push(
        `${t.correct} of ${t.total} did not survive into the row (got ${built.row.correct}/${built.row.total}). ` +
          `Storing only the percent loses the thing Gigi actually read off Khan.`
      );
    }
    if (built.row.gradedFrom !== 'fraction') {
      errors.push(`a fraction was recorded as gradedFrom "${built.row.gradedFrom}"`);
    }
  }

  // A fraction that cannot be true must be refused, never rounded into shape.
  for (const bad of [
    { correct: 11, total: 10, why: 'more right than there were' },
    { correct: -1, total: 10, why: 'a negative score' },
    { correct: 5, total: 0, why: 'out of zero' }
  ]) {
    if (percentFromFraction(bad.correct, bad.total) !== null) {
      errors.push(`percentFromFraction accepted ${bad.why}`);
    }
    const built = khanGradeRow({ courseId: 'math2', unitN: 1, correct: bad.correct, total: bad.total });
    if (built.ok) errors.push(`the writer accepted ${bad.why}`);
  }

  // The word fallback still works, and it says it was a word.
  {
    const built = khanGradeRow({ courseId: 'math2', unitN: 1, grade: 'A' });
    if (!built.ok) errors.push(`the writer refused a letter with no fraction: ${built.reason}`);
    else {
      if (built.row.gradedFrom !== 'letter') {
        errors.push(`a picked letter was recorded as gradedFrom "${built.row.gradedFrom}"`);
      }
      if (built.row.percent !== null || built.row.correct !== null) {
        errors.push('a picked letter invented a percent — there was no fraction to make one from');
      }
    }
  }

  // An override is recorded AS an override, so a transcript is never guessing.
  {
    const built = khanGradeRow({ courseId: 'math2', unitN: 1, correct: 9, total: 10, grade: 'A' });
    if (!built.ok || built.row.grade !== 'A' || built.row.gradedFrom !== 'overridden') {
      errors.push('overriding the letter on a fraction is not recorded as an override');
    }
  }

  // Every letter the word-guide offers must be one the writer accepts, or the
  // screen tells Gigi to pick something that cannot be saved.
  for (const row of KHAN_MASTERY_GUIDE) {
    for (const letter of row.letters) {
      if (!KHAN_GRADE_LETTERS.includes(letter)) {
        errors.push(`the guide maps "${row.says}" to ${letter}, which is not on the ladder`);
      }
    }
  }

  // Azianna never sees the letter, and below 70 never reads as encouragement.
  if (bandForPercent(95) !== bandForPercent(91)) errors.push('90s do not agree on her band');
  if (bandForPercent(69) === bandForPercent(75)) {
    errors.push('below 70% gives her the same words as above it');
  }
  if (bandForPercent(null) !== null) errors.push('a missing percent still gives her words');
}

// ---- 0c. A COURSE AVERAGE COUNTS WHAT IS RECORDED, NOT WHAT EXISTS -------
//
// Lamar's report card prints "5 Khan Academy units graded, 86% average" and
// says "Not yet graded" rather than 0% for a subject with no attempts. A unit
// she has not sat is not a zero, and averaging it in would make an unfinished
// course look like a failing child.

{
  if (courseAverage('math2', []) !== null) {
    errors.push('a course with nothing recorded reports an average instead of nothing');
  }
  const rows = [
    khanGradeRow({ courseId: 'math2', unitN: 1, correct: 9, total: 10 }).row,
    khanGradeRow({ courseId: 'math2', unitN: 2, correct: 7, total: 10 }).row
  ];
  const avg = courseAverage('math2', rows);
  if (!avg || avg.percent !== 80 || avg.units !== 2 || avg.grade !== 'B-') {
    errors.push(
      `two units at 90% and 70% averaged to ${avg && avg.percent}% / ${avg && avg.grade}, expected 80% / B-. ` +
        `If it came out lower, the six unrecorded units are being counted as zeros.`
    );
  }
  // A word-graded row has no percent and must not drag the average to nothing.
  const mixed = [...rows, khanGradeRow({ courseId: 'math2', unitN: 3, grade: 'A' }).row];
  const avg2 = courseAverage('math2', mixed);
  if (!avg2 || avg2.percent !== 80) {
    errors.push('a letter-only row broke the course average — it has no percent to average');
  }
  notes.push('a course average counts only recorded units, and says nothing when there are none');
}

// ---- 0d. THE TWO INSTRUMENTS ---------------------------------------------
//
// Gigi, Aug 24: "The unit tests are what is being graded by Khan Academy and
// the course challenge is the test after all the units are completed." And
// from her Aug 23 handoff: "Both should be recorded, and they are not the same
// thing."
//
// A unit test measures one unit. The Course Challenge is cumulative. The two
// failures this guards against are opposite and both are silent:
//
//   · a Course Challenge marking a unit DONE would skip a unit she never sat,
//     which is what this whole file exists to prevent;
//   · and averaging a cumulative final in with the units counts the same
//     material twice and lets one sitting outweigh the eight before it.

{
  const CHALLENGE_COURSE = 'math2';
  const built = khanGradeRow({ courseId: CHALLENGE_COURSE, kind: KIND_CHALLENGE, correct: 45, total: 50 });
  if (!built.ok) {
    errors.push(`the writer refused a valid Course Challenge: ${built.reason}`);
  } else {
    const row = built.row;
    if (row.kind !== KIND_CHALLENGE) errors.push('a Course Challenge row does not carry its kind');
    if (row.unitN !== null) {
      errors.push(`a Course Challenge row carries unitN ${row.unitN} — it covers the whole course`);
    }
    if (!isChallenge(row)) errors.push('isChallenge() does not recognise a Course Challenge row');
    if (row.percent !== 90 || row.grade !== 'A-') {
      errors.push(`45 of 50 on the Course Challenge came out ${row.percent}% / ${row.grade}, expected 90% / A-`);
    }

    // ⚠️ IT MUST NOT ADVANCE HER. `Number(null)` is 0 and 0 is finite, so before
    // v3.76 this row would have been read as "unit 0 is done" — harmless only
    // because no course has a unit 0, which is luck and not a design.
    if (gradeAdvances(row)) {
      errors.push('a Course Challenge counts as a unit being done — it would skip a unit she never sat');
    }
    const offered = nextUnitFor(CHALLENGE_COURSE, [row]);
    if (!offered || offered.n !== 1) {
      errors.push(
        `with only a Course Challenge recorded, maths offers Unit ${offered && offered.n} instead of Unit 1`
      );
    }

    // ⚠️ AND IT MUST NOT BE AVERAGED WITH THE UNITS.
    const unitRow = khanGradeRow({ courseId: CHALLENGE_COURSE, unitN: 1, correct: 6, total: 10 }).row;
    const avg = courseAverage(CHALLENGE_COURSE, [unitRow, row]);
    if (!avg || avg.units !== 1 || avg.percent !== 60) {
      errors.push(
        `one unit at 60% and a Course Challenge at 90% averaged to ${avg && avg.percent}% over ` +
          `${avg && avg.units} unit(s), expected 60% over 1. A cumulative test is not a unit test.`
      );
    }
    if (!challengeFor(CHALLENGE_COURSE, [unitRow, row])) {
      errors.push('challengeFor() cannot find a recorded Course Challenge');
    }
    if (challengeFor(CHALLENGE_COURSE, [unitRow])) {
      errors.push('challengeFor() returned a unit test as though it were a Course Challenge');
    }
    notes.push('a Course Challenge is recorded, advances nothing, and stays out of the unit average');
  }

  // Refused where Khan built none. ela2/ela3 have no challenge and no tests —
  // offering a row that can never be filled in would be a promise the app
  // cannot keep.
  for (const c of KHAN_GRADEABLE_COURSES) {
    const r = khanGradeRow({ courseId: c.courseId, kind: KIND_CHALLENGE, correct: 9, total: 10 });
    if (c.courseChallenge && !r.ok) {
      errors.push(`${c.label} has a Course Challenge on Khan and the writer refused it: ${r.reason}`);
    }
    if (!c.courseChallenge && r.ok) {
      errors.push(`${c.label} has no Course Challenge on Khan and the writer accepted one anyway`);
    }
  }

  // A challenge cannot also name a unit — that is two claims in one row.
  if (khanGradeRow({ courseId: 'math2', kind: KIND_CHALLENGE, unitN: 3, correct: 9, total: 10 }).ok) {
    errors.push('a Course Challenge was accepted with a unit number on it');
  }
  if (khanGradeRow({ courseId: 'math2', unitN: 1, kind: 'quiz', correct: 9, total: 10 }).ok) {
    errors.push('the writer accepted a kind of assessment it does not record');
  }

  /* ---- ROWS WRITTEN BEFORE THE FIELD EXISTED ----
   * A Course Challenge could not be recorded at all until v3.76, so every row
   * with no kind IS a unit test. That is a fact about her data, not a default
   * chosen because it was convenient, and it must keep advancing her.
   */
  const older = { gradeId: 'kg-old', courseId: 'math2', unitN: 1, percent: 80, grade: 'B-' };
  if (kindOf(older) !== KIND_UNIT) errors.push('a pre-v3.76 row is no longer read as a unit test');
  if (!gradeAdvances(older)) {
    errors.push('a pre-v3.76 unit row stopped advancing her — v3.74 and v3.75 grades would go dead');
  }
  const after = nextUnitFor('math2', [older]);
  if (!after || after.n !== 2) {
    errors.push(`a pre-v3.76 grade on Unit 1 leaves her on Unit ${after && after.n}, not Unit 2`);
  }

  /* ---- THE RULE IS WRITTEN TWICE, AND IT IS ASKED DIRECTLY ----
   *
   * ⚠️ TWO NEGATIVE TESTS AGAINST THIS RULE CAME BACK GREEN, AND BOTH WERE
   * RIGHT TO. Deleting the null guard, and deleting the kind guard, each
   * changed NOTHING OBSERVABLE: the two guards are redundant with each other,
   * and a null unit number lands on "unit 0", which no course has.
   *
   * Observed through `nextUnitFor` alone, every wrong answer this rule can
   * give still yields the right unit. THAT IS NOT A CHECK PASSING — it is a
   * rule nothing is protecting, dressed as one, and the redundancy is only
   * defence while both halves are still there. Same family as #20 on the
   * build log's list: green for a reason unrelated to the thing being true.
   *
   * So the predicate is exported now and asked directly, one shape at a time.
   */
  const SHAPES = [
    { row: { courseId: 'math2', unitN: 1, kind: KIND_UNIT }, done: true, why: 'a plain unit test' },
    { row: { courseId: 'math2', unitN: 1 }, done: true, why: 'a pre-v3.76 row with no kind' },
    { row: { courseId: 'math2', unitN: null, kind: KIND_CHALLENGE }, done: false, why: 'a Course Challenge' },
    // ⚠️ THE SHAPE THE WRITER REFUSES TO MAKE, AND THE ONE THAT MATTERS. It
    // cannot come from this app — but it can come from an imported backup or a
    // hand-edited file, and it is the only case where the kind guard is doing
    // the work on its own. Without it, a cumulative result marks a unit done.
    { row: { courseId: 'math2', unitN: 3, kind: KIND_CHALLENGE }, done: false, why: 'a Course Challenge carrying a unit number' },
    { row: { courseId: 'math2', unitN: null }, done: false, why: 'a row with no unit number' },
    { row: { courseId: 'math2', unitN: '' }, done: false, why: 'a row with an empty unit number' },
    { row: { courseId: 'math2', unitN: undefined }, done: false, why: 'a row missing the field' }
  ];
  for (const s of SHAPES) {
    if (countsAsUnitDone(s.row) !== s.done) {
      errors.push(
        `countsAsUnitDone says ${!s.done} for ${s.why} — expected ${s.done}. ` +
          `Number(null) is 0 and 0 is finite, which is how a row with no unit number ` +
          `becomes "unit 0 is done".`
      );
    }
    // The same question, asked of the other file. Two copies of a rule drift.
    if (gradeAdvances(s.row) !== s.done) {
      errors.push(
        `gradeAdvances says ${!s.done} for ${s.why} but countsAsUnitDone says ${s.done} — ` +
          `the same rule is written in khanGrade.js and khanUnits.js and they have drifted`
      );
    }
  }
  notes.push(`the unit-done rule agrees across both files on ${SHAPES.length} shapes of row`);
}

// ---- 1. the writer stamps both fields --------------------------------------

for (const c of KHAN_GRADEABLE_COURSES) {
  const built = khanGradeRow({ courseId: c.courseId, unitN: 1, correct: 9, total: 10 });
  if (!built.ok) {
    errors.push(`the writer refused a valid result for ${c.label} unit 1: ${built.reason}`);
    continue;
  }
  const row = built.row;
  if (row.courseId !== c.courseId) {
    errors.push(`a ${c.label} row came back with courseId ${row.courseId}`);
  }
  if (row.unitN !== 1) {
    errors.push(`a ${c.label} row came back with unitN ${row.unitN}, not 1`);
  }
  if (!gradeAdvances(row)) {
    errors.push(
      `a row the writer just produced for ${c.label} does not satisfy gradeAdvances — ` +
        `this is the v3.74 bug exactly: a saved grade that nothing will ever count`
    );
  }
  // The unit name must be Khan's, copied from the catalog, not typed.
  const catalogName = KHAN_UNIT_COURSES[c.courseId].units[0].name;
  if (row.unit !== catalogName) {
    errors.push(
      `the writer stored the unit name "${row.unit}" for ${c.label}, the catalog says "${catalogName}"`
    );
  }
}

// ---- 2 and 3. the round trip, and the whole course ------------------------
//
// One recorded result at a time, each one produced by the writer, each one
// handed to the resolver. If the two ever disagree about the shape of a grade
// again, this loop stops on the first unit.

for (const c of KHAN_GRADEABLE_COURSES) {
  const course = KHAN_UNIT_COURSES[c.courseId];
  const grades = [];
  let broke = false;

  for (const u of course.units) {
    const offered = nextUnitFor(c.courseId, grades);
    if (!offered) {
      errors.push(
        `${c.label} offered nothing while ${course.units.length - grades.length} unit(s) were still unrecorded`
      );
      broke = true;
      break;
    }
    if (offered.n !== u.n) {
      errors.push(
        `after ${grades.length} recorded result(s) ${c.label} offers Unit ${offered.n}, not Unit ${u.n}`
      );
      broke = true;
      break;
    }
    const built = khanGradeRow({ courseId: c.courseId, unitN: u.n, correct: 8, total: 10 });
    if (!built.ok) {
      errors.push(`the writer refused ${c.label} unit ${u.n}: ${built.reason}`);
      broke = true;
      break;
    }
    grades.push(built.row);

    // THE ASSERTION THE OLD CHECK COULD NOT MAKE: the unit moved because of a
    // row this app produced, not because of one a check invented.
    const after = nextUnitFor(c.courseId, grades);
    if (after && after.n === u.n) {
      errors.push(
        `recording a result for ${c.label} Unit ${u.n} left her on Unit ${u.n}. ` +
          `A grade that does not advance her is the whole of the v3.74 bug.`
      );
      broke = true;
      break;
    }
  }

  if (broke) continue;

  if (nextUnitFor(c.courseId, grades) !== null) {
    errors.push(`${c.label} still offers a unit after every unit was recorded`);
  } else {
    notes.push(
      `${c.label}: ${course.units.length} units walked in order through the writer, ` +
        `then ${course.courseChallenge ? 'the Course Challenge' : 'nothing left (Khan built no challenge)'}`
    );
  }
}

// ---- 4. the store still uses the writer ------------------------------------
//
// Rule 11: a rule the app must follow lives where a check can test it. The
// shaping was moved into a lib precisely so this could be asserted; putting it
// back into the store is how the fields went missing the first time.

{
  const src = readFileSync(resolve(ROOT, 'src/store/useAppStore.js'), 'utf8');
  const body = src.slice(src.indexOf('async addKhanGrade('));
  const end = body.indexOf('async removeKhanGrade(');
  const fn = end === -1 ? body : body.slice(0, end);

  if (!/khanGradeRow\(/.test(fn)) {
    errors.push(
      'addKhanGrade does not call khanGradeRow — the row is being built in the store again, ' +
        'which is where courseId and unitN went missing before v3.74'
    );
  }
  if (/gradeId:\s*\n?\s*globalThis/.test(fn)) {
    errors.push(
      'addKhanGrade is building a row by hand again (it mints its own gradeId). ' +
        'One writer, in src/lib/khanGrade.js, or the two shapes drift apart.'
    );
  }
  if (!/import \{ khanGradeRow \}/.test(src)) {
    errors.push('useAppStore.js does not import khanGradeRow');
  }
}

// ---- 5. the form picks a unit, it does not accept typed text ---------------

{
  const src = readFileSync(resolve(ROOT, 'src/components/Parent/ParentDashboard.jsx'), 'utf8');
  const start = src.indexOf('function KhanGradesPanel(');
  if (start === -1) {
    errors.push('could not find KhanGradesPanel in ParentDashboard.jsx');
  } else {
    // The whole component, located by the next top-level function rather than
    // by a character count — a fixed window silently stopped covering the
    // picker the moment the panel grew, and the assertion went quiet.
    const after = src.slice(start + 1);
    const nextFn = after.indexOf('\nfunction ');
    const panel = nextFn === -1 ? after : after.slice(0, nextFn);
    if (!/KHAN_GRADEABLE_COURSES/.test(panel)) {
      errors.push(
        'the Khan grade form does not offer KHAN_GRADEABLE_COURSES — if the unit is typed rather ' +
          'than picked, the row cannot name a unit and cannot advance her'
      );
    }
    if (!/addKhanGrade\(\{ courseId, unitN, correct, total/.test(panel)) {
      errors.push(
        'the Khan panel does not pass courseId, unitN and the fraction to addKhanGrade'
      );
    }
    if (!/percentFromFraction\(correct, total\)/.test(panel)) {
      errors.push(
        'the Khan panel does not work the percent out from the fraction as Gigi types. ' +
          'She should see what the row is about to record before it records it.'
      );
    }
    // Lamar's shape: rows with an inline picker, not a control you choose from
    // first. Gigi, Aug 24: "I don't like the dropdown that is currently there."
    if (/<select/.test(panel)) {
      errors.push(
        'the Khan panel has a select element again. Lamar\u2019s Mission Control grades each ' +
          'skill on its own row with an inline picker, and that is what was asked for.'
      );
    }
    if (!/KHAN_GRADE_LETTERS\.map/.test(panel)) {
      errors.push('the Khan panel does not render the letter picker from KHAN_GRADE_LETTERS');
    }
    if (!/KIND_CHALLENGE/.test(panel)) {
      errors.push(
        'the Khan panel has no way to record a Course Challenge. It is the one cumulative result ' +
          'in a course and without a row it cannot reach the annual progress report.'
      );
    }
    if (!/KHAN_MASTERY_GUIDE/.test(panel)) {
      errors.push(
        'the Khan panel does not show what Khan\u2019s own screen says beside each letter. ' +
          'Without it Gigi is converting something rather than copying it.'
      );
    }
  }
}

// A unit that is not in the catalog must be refused, not stored hopefully.
for (const bad of [
  { courseId: 'math2', unitN: 99, why: 'a unit number Khan does not have' },
  { courseId: 'not-a-course', unitN: 1, why: 'a course that does not exist' },
  { courseId: 'math2', unitN: null, why: 'no unit at all' },
  { courseId: 'math2', unitN: 1, grade: undefined, correct: undefined, total: undefined, why: 'nothing at all' },
  { courseId: 'math2', unitN: 1, grade: 'G', why: 'a letter that is not on the ladder' },
  { courseId: 'math2', unitN: 1, grade: '88%', why: 'a percent where a letter belongs' }
]) {
  const built = khanGradeRow({ correct: 8, total: 10, ...bad });
  if (built.ok) {
    errors.push(`the writer accepted ${bad.why} — it must refuse it with words`);
  } else if (!built.reason) {
    errors.push(`the writer refused ${bad.why} without saying why`);
  }
}

// ---- 6. a pre-v3.74 row is still ignored, never guessed at ----------------
//
// The old rows on her record are free text: "Geometry", "Intro to
// multiplication". Matching them by string would mark a unit she never sat as
// done, on a record that becomes a transcript.

{
  const legacy = { gradeId: 'kg-old', subject: 'math', unit: 'Geometry', percent: 82, at: '2026-08-01' };
  if (gradeAdvances(legacy)) {
    errors.push('a pre-v3.74 free-text row is being treated as advancing her');
  }
  const offered = nextUnitFor('math2', [legacy]);
  if (!offered || offered.n !== 1) {
    errors.push(
      `a pre-v3.74 free-text row moved the maths course to Unit ${offered && offered.n}. ` +
        `Old prose rows must be ignored — guessing the unit from the text marks the wrong unit done.`
    );
  } else {
    notes.push('a pre-v3.74 free-text row is ignored, and the course still offers Unit 1');
  }
}

// ---- report ----------------------------------------------------------------

console.log('\nPetal & Pestle — does recording a grade move her on?\n');

if (errors.length) {
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(`\n${errors.length} problem${errors.length === 1 ? '' : 's'}.\n`);
  process.exit(1);
}

for (const n of notes) console.log('  · ' + n);
console.log(
  `\n  · ${KHAN_GRADEABLE_COURSES.length} gradeable courses, every one walked end to end through ` +
    `the writer the app itself uses`
);
console.log('  · no grade row in this check was built by hand — that is the point of it');
console.log(
  '\n  NOT TESTED HERE: whether Gigi records anything, whether a percent is right,\n' +
    '  whether the Khan addresses are still live, or what any screen looks like.\n'
);
console.log('Recording a result advances her.\n');
process.exit(0);
