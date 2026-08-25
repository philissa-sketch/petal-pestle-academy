// ---------------------------------------------------------------------------
// CHECK #32 — THE ANNUAL PROGRESS REPORT SAYS ONLY WHAT IT CAN PROVE.
//
// Run with: node scripts/check-annual-report.mjs
//
// ---- WHY THIS EXISTS ----
//
// O.C.G.A. § 20-2-690(c) asks for a written annual assessment of progress in
// each of five named subjects, kept for three years. This is the one document
// in the project that leaves the house — a grandmother files it, and it is the
// record that answers for a child's year.
//
// ⚠️ AND IT IS THE DOCUMENT MOST ABLE TO LIE QUIETLY. A grade is a single
// number standing in for a year. Three ways it can be wrong without anyone
// noticing, and all three have happened in this family of apps already:
//
//   1. COVERAGE COUNTED AS PERFORMANCE. Gigi caught this in Mission Control:
//      the Report Card printed "1/106 mastered · 1%" as though it were a
//      grade, when it measured how much curriculum had been BUILT. His log:
//      "Conflating 'curriculum completion' with 'performance' made the
//      platform's own unfinished state look like his failure." A nine-year-old
//      must never be marked down for a lesson nobody wrote yet.
//
//   2. UNGRADED AVERAGED AS ZERO. Blueprint anti-pattern 23, and this app has
//      already had the Number(null)-is-0 bug three times in two days, once in
//      a course average. An absent result is not a failing one.
//
//   3. A NUMBER THAT DRIFTED FROM ITS SOURCE. §5.4: anything countable is
//      generated, never hand-typed. Ten hand-typed numbers in this project
//      have drifted, and this is the file where that would matter most.
//
// ---- WHAT IT ASSERTS ----
//
//   1. All five statute subjects appear, named as the statute names them.
//   2. Ungraded is null with a reason — never 0, never F.
//   3. COVERAGE AND HOURS CANNOT MOVE A GRADE. Asserted by running the report
//      twice on the same graded evidence with the coverage changed, and
//      requiring every letter to be identical.
//   4. A subject's grade is the mean of its own components and nothing else.
//   5. The Check-In never appears inside a grade (§3.10.6) and growth is
//      reported on its own instrument (§3.10.8).
//   6. Enrichment is never counted as one of the five.
//   7. The letter comes from the ONE ladder in khanGrade.js, not a second copy.
//
// ---- WHAT IT DOES NOT ASSERT, so it never claims more than it tests ----
//
//   · That the report satisfies Georgia. Nothing in software can promise that,
//     and this check is not legal advice.
//   · That her grades are good, or that the evidence behind them is enough.
//   · What the printed page looks like.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const load = (p) => import(pathToFileURL(resolve(ROOT, p)).href);

const { annualReport } = await load('src/lib/annualReport.js');
const { GEORGIA } = await load('src/lib/hours.js');
const { letterForPercent } = await load('src/lib/khanGrade.js');
const { khanGradeRow } = await load('src/lib/khanGrade.js');

const errors = [];
const notes = [];

/** A record with real graded evidence, built through the app's own writers. */
function withEvidence() {
  return {
    khanGrades: [
      khanGradeRow({ courseId: 'math2', unitN: 1, correct: 9, total: 10 }).row,
      khanGradeRow({ courseId: 'math2', unitN: 2, correct: 7, total: 10 }).row
    ],
    writingMarks: [],
    journalMarks: {},
    attempts: [],
    lessonReads: [],
    strandStates: [],
    scheduleDays: {},
    scheduleBlocks: []
  };
}

// ---- 1. all five, named as the statute names them -------------------------

{
  const r = annualReport({});
  const want = GEORGIA.requiredSubjects.map((s) => s.statute);
  const got = r.subjects.map((s) => s.statute);
  for (const s of want) {
    if (!got.includes(s)) {
      errors.push(`the report has no section for "${s}" — the statute names all five`);
    }
  }
  if (got.length !== want.length) {
    errors.push(`the report has ${got.length} subject sections, the statute names ${want.length}`);
  }
  if (!r.statute || !/20-2-690/.test(r.statute.cite || '')) {
    errors.push('the report does not cite the statute it answers');
  }
  if (r.statute && r.statute.retainYears !== 3) {
    errors.push('the report does not state the three-year retention period');
  }
  notes.push(`all ${want.length} statute subjects present: ${want.join(', ')}`);
}

// ---- 2. ungraded is null with a reason. NEVER zero, never F ---------------

{
  const r = annualReport({});
  for (const s of r.subjects) {
    if (s.grade !== null) {
      errors.push(`${s.statute} has a grade of "${s.grade}" with no evidence recorded at all`);
    }
    if (s.percent === 0) {
      errors.push(
        `${s.statute} reports 0% with nothing recorded. An absent result is not a failing one — ` +
          `blueprint anti-pattern 23, and Lamar's own rule: "Not yet graded," not a misleading 0%.`
      );
    }
    if (s.percent !== null) {
      errors.push(`${s.statute} reports a percent of ${s.percent} with no evidence`);
    }
    if (!s.ungradedReason) {
      errors.push(`${s.statute} is ungraded and does not say why`);
    }
  }
  notes.push('with an empty record every subject reads "Not yet graded" — none reads 0% or F');
}

// ---- 3. ⚠️ COVERAGE AND HOURS CANNOT MOVE A GRADE -------------------------
//
// The assertion this whole file is really for. Same graded evidence, wildly
// different coverage and hours: every letter must be identical.

{
  const base = withEvidence();
  const bare = annualReport(base);

  const loaded = annualReport({
    ...base,
    // A hundred lessons read, and a full year of hours logged.
    lessonReads: Array.from({ length: 100 }, (_, i) => ({ lessonId: `hb-1-${i}` })),
    scheduleDays: Object.fromEntries(
      Array.from({ length: 180 }, (_, i) => [`2026-09-${i}`, { dayKey: `2026-09-${i}`, done: { 'blk-math': 'x' } }])
    ),
    scheduleBlocks: [{ id: 'blk-math', subject: 'math', minutes: 300 }]
  });

  for (let i = 0; i < bare.subjects.length; i += 1) {
    const a = bare.subjects[i];
    const b = loaded.subjects[i];
    if (a.grade !== b.grade || a.percent !== b.percent) {
      errors.push(
        `${a.statute}: coverage and hours changed the grade from ${a.grade}/${a.percent}% to ` +
          `${b.grade}/${b.percent}%. THIS IS THE MISSION CONTROL BUG — "conflating curriculum ` +
          `completion with performance made the platform's own unfinished state look like his ` +
          `failure." A child is never marked on how much of the app exists.`
      );
    }
  }

  // And the coverage numbers must actually have changed, or the test proved
  // nothing — the "mutation that did not mutate", which has caught this
  // project four times.
  const movedCoverage = bare.subjects.some(
    (s, i) => s.coverage.lessonsRead !== loaded.subjects[i].coverage.lessonsRead
  );
  const movedHours = bare.attendance.hours === loaded.attendance.hours;
  if (!movedCoverage) {
    errors.push('this test changed no coverage figure, so it proved nothing about coverage');
  }
  if (movedHours) {
    errors.push('this test changed no hours figure, so it proved nothing about hours');
  }
  if (movedCoverage && !movedHours) {
    notes.push('coverage and hours moved a long way and not one letter changed');
  }
}

// ---- 4. a grade is the mean of its own components, and nothing else -------

{
  const r = annualReport(withEvidence());
  const maths = r.subjects.find((s) => s.statute === 'Mathematics');
  if (!maths || !maths.grade) {
    errors.push('two recorded Khan unit tests produced no Mathematics grade');
  } else {
    const want = Math.round(maths.inside.reduce((a, c) => a + c.percent, 0) / maths.inside.length);
    if (maths.percent !== want) {
      errors.push(
        `Mathematics reports ${maths.percent}% but its own components average ${want}% — ` +
          `something is in the grade that is not listed under it`
      );
    }
    if (maths.grade !== letterForPercent(maths.percent)) {
      errors.push(
        `Mathematics shows ${maths.grade} for ${maths.percent}%, the ladder says ` +
          `${letterForPercent(maths.percent)}. The report must use the one ladder in khanGrade.js.`
      );
    }
    if (!maths.inside.length) {
      errors.push('Mathematics has a grade and nothing listed inside it — the figure is unexplained');
    }
    notes.push(
      `Mathematics: ${maths.grade} ${maths.percent}%, and it equals the mean of its ${maths.inside.length} listed component(s)`
    );
  }
}

// ---- 5. the Check-In is never inside a grade, and growth is its own -------

{
  const withCheckIn = {
    ...withEvidence(),
    strandStates: [
      { strandId: 'numbers-operations', level: 3.48, settled: true },
      { strandId: 'geometry', level: 2.7, settled: false }
    ]
  };
  const a = annualReport(withEvidence());
  const b = annualReport(withCheckIn);
  for (let i = 0; i < a.subjects.length; i += 1) {
    if (a.subjects[i].grade !== b.subjects[i].grade) {
      errors.push(
        `${a.subjects[i].statute}: adding Check-In levels changed the grade. §3.10.6 keeps ` +
          `diagnostic evidence out of mastery — a placement instrument measures where to start ` +
          `her, not how she did.`
      );
    }
  }
  if (!b.growth || b.growth.instrument !== 'Check-In') {
    errors.push('growth is not reported against the Check-In by name (§3.10.8)');
  }
  if (b.growth && b.growth.haveSecondSitting === false && !b.growth.note) {
    errors.push('there is no second sitting and the report does not say so');
  }
  if (b.growth && b.growth.rows.length !== 2) {
    errors.push('growth did not report every measured strand');
  }
  notes.push('the Check-In moves no grade, and growth is reported on its own instrument');
}

// ---- 6. enrichment is named and never counted as one of the five ----------

{
  const r = annualReport({});
  if (!r.enrichment.length) {
    errors.push('The Human Body is not reported at all — enrichment is named, not hidden');
  }
  for (const e of r.enrichment) {
    if (r.subjects.some((s) => s.statute === e.label)) {
      errors.push(`${e.label} is being reported as one of the five statute subjects`);
    }
    if (!e.note) errors.push(`${e.label} does not say it is enrichment`);
  }
  notes.push(`${r.enrichment.length} enrichment course(s) named and excluded from the five`);
}

// ---- 7. nothing on the screen is a stored number --------------------------
//
// Rule 11 and §5.4 together: the figures must be derived at render. A panel
// that reads a saved report can show a number the record no longer supports.

{
  const src = readFileSync(resolve(ROOT, 'src/components/Parent/AnnualReportPanel.jsx'), 'utf8');
  if (!/annualReport\(/.test(src)) {
    errors.push('the panel does not call annualReport() — it is not deriving the figures');
  }
  if (/useState\s*\(/.test(src)) {
    errors.push(
      'the panel holds state. Every figure must be computed at render from her record; a stored ' +
        'report is a number that can drift from the thing it describes.'
    );
  }
  if (!/window\.print/.test(src)) {
    errors.push('the report cannot be printed, and Georgia asks for a WRITTEN assessment');
  }
}

// ---- report ---------------------------------------------------------------

console.log('\nPetal & Pestle — the annual progress report\n');
if (errors.length) {
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(`\n${errors.length} problem${errors.length === 1 ? '' : 's'}.\n`);
  process.exit(1);
}
for (const n of notes) console.log('  · ' + n);
console.log(
  '\n  NOT TESTED HERE: whether this satisfies Georgia — nothing in software can promise\n' +
    '  that, and this is not legal advice. Nor whether her grades are good, nor what the\n' +
    '  printed page looks like.\n'
);
console.log('The report says only what it can prove.\n');
process.exit(0);
