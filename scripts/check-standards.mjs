// ---------------------------------------------------------------------------
// Run with: node scripts/check-standards.mjs
//
// THE PROBLEM THIS EXISTS TO CATCH, in the parent's words: "it isn't going by
// GA state standards."
//
// She was right, and nothing in the app could have told her. Herbalism &
// Botany and The Human Body were called her science for months. Against
// Georgia's actual fourth-grade document they covered ZERO of the eight
// standards between them, and the one standard a garden owns outright — S4L1,
// ecosystems and food webs — was not even planned.
//
// A claim about standards coverage that no script checks is a claim that drifts
// the moment anyone is busy. Social Studies already had this treatment. Science
// did not.
//
// ---- WHAT IT ASSERTS ----
//
// 1. Every one of the 25 elements is owned by EXACTLY ONE course. No orphans,
//    no two courses each assuming the other has it.
// 2. Every owner names a real course and a quarter that course actually runs.
// 3. Every element's owner gives a VEHICLE — a sentence saying how it gets
//    taught. An element assigned with no vehicle is an intention, not a plan.
// 4. Every lesson that declares a standard code declares a REAL one.
// 5. A lesson may only declare an element its own course owns. A Herbalism
//    lesson claiming a Science Lab element is how double-counting starts.
// 6. For any course marked 'complete': every element it owns has at least one
//    lesson behind it. This is the one that fails loudly.
//
// ---- WHY IT DOES NOT FAIL ON AN UNBUILT COURSE ----
//
// Twenty-five elements and one course under construction would mean a red
// build for months, and a build that is always red is a build nobody reads.
//
// So coverage is reported against each course's declared STATE. A course
// 'building' prints its gap every single run, element by element, and does not
// fail. A course 'complete' with a hole fails immediately.
//
// The gap can therefore never be hidden — it is printed in full on every run,
// whether or not anything is wrong — but it also cannot be quietly widened,
// because marking a course complete is a claim the script tests.
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---- BOTH SUBJECTS, SINCE v3.32 ----
//
// This check imported GA_SCIENCE_4 and nothing else from v3.5 to v3.31, and
// that is precisely why curriculumPlan.js could claim for nine versions that
// the Social Studies standards were "already built, verbatim" when
// src/data/standards/ held one file. A subject no check reads can assert
// anything about itself. Neither subject is optional here now.
const {
  GA_SOCIAL_4,
  allElements: allSocialElements,
  ELEMENT_COUNT: SOCIAL_ELEMENT_COUNT,
  LETTERED_ELEMENT_COUNT: SOCIAL_LETTERED_COUNT,
  REJECTED_COUNTS
} = await import(pathToFileURL(resolve(ROOT, 'src/data/standards/georgiaSS4.js')).href);

const { GA_SCIENCE_4, allElements, ELEMENT_COUNT, OFF_GRADE_NOTES } = await import(pathToFileURL(resolve(ROOT, 'src/data/standards/georgiaScience4.js')).href);
const {
  APP_COURSES,
  STANDARD_OWNERS: SCIENCE_OWNERS,
  SOCIAL_STANDARD_OWNERS,
  DECLARED_OMISSIONS,
  TAUGHT_OFF_GRADE,
  courseById
} = await import(pathToFileURL(resolve(ROOT, 'src/config/curriculumPlan.js')).href);

/** One crosswalk across both subjects. Every entry knows which subject it is. */
const STANDARD_OWNERS = [
  ...SCIENCE_OWNERS.map((o) => ({ ...o, subject: 'science' })),
  ...SOCIAL_STANDARD_OWNERS.map((o) => ({ ...o, subject: 'social studies' }))
];

/**
 * Which elements a course owns. Re-derived here rather than imported, because
 * `elementsOwnedBy` in curriculumPlan.js reads the SCIENCE list only — and a
 * helper that silently answers for one subject is how this check went blind in
 * the first place.
 */
function elementsOwnedBy(courseId) {
  return STANDARD_OWNERS.filter((o) => o.course === courseId);
}

// v3.9 — ONE SOURCE FOR THE COURSE.
//
// This read two arrays — Quarter 1 and Module 1 — and so it could not see the
// fourteen module files added since. With all four quarters wired it was still
// reporting "0 of 25 elements have a lesson" while ten elements had lessons
// declaring their codes. Exactly the drift check-curriculum-volume was caught by
// on the same day, in a different file, for the same reason: a counter that knows
// the file layout instead of asking the course.
//
// ---- AND IT WAS DOING THE SAME THING ITSELF UNTIL v3.27 ----
//
// This file imported ALL_HERBALISM_LESSONS and called the result "every lesson
// in the app". It was true when it was written and it silently stopped being
// true at v3.24, when The Science Lab got its first six lessons.
//
// The effect was not a crash. It was a REPORT THAT WAS WRONG IN THE SAFE
// DIRECTION: The Science Lab owns fifteen Georgia elements, and this check
// printed all fifteen as "still owed" on every run no matter how many lessons
// were written against them. Eighteen lessons carrying S4P3a, S4P3b and S4P3c
// existed and the standards report still said none of them were taught.
//
// A gap that is printed too large looks like honesty and is not. It hides real
// progress, and — the dangerous half — it means the ONE thing this check
// actually fails on, a course claiming to be complete with holes in it, could
// never have been evaluated correctly for that course either.
const { ALL_LESSONS: ALL_APP_LESSONS, APP_COURSES: TAUGHT_COURSES } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/appCourses.js')).href);

/** Every lesson in the app, tagged with the course it belongs to. */
const ALL_LESSONS = ALL_APP_LESSONS.map((l) => ({ ...l, course: l.course || 'herbalism' }));

const errors = [];
const notes = [];
const SCIENCE_ELEMENTS = allElements().map((e) => ({ ...e, subject: 'science' }));
const SOCIAL_ELEMENTS = allSocialElements().map((e) => ({ ...e, subject: 'social studies' }));
const elements = [...SCIENCE_ELEMENTS, ...SOCIAL_ELEMENTS];
const elementCodes = new Set(elements.map((e) => e.code));
const subjectOf = new Map(elements.map((e) => [e.code, e.subject]));

// A code cannot belong to two subjects. Science codes start S4, social SS4, so
// this can only fire if a future transcription is careless — which is exactly
// when nobody would be looking.
{
  const seenCode = new Set();
  for (const e of elements) {
    if (seenCode.has(e.code)) {
      errors.push(`"${e.code}" appears in both standards files — one code, two subjects`);
    }
    seenCode.add(e.code);
  }
}

// ---- AND THE OWNING COURSE'S SUBJECT MUST MATCH THE ELEMENT'S ----
//
// ⚠️ THE FIRST DRAFT OF THIS DID NOTHING, and its negative test is what showed
// it. It compared `o.subject` — which this file had just stamped on every entry
// according to WHICH ARRAY it came out of — against the element's subject. Both
// sides were the same fact wearing two names, so moving SS4H6d to The Science
// Lab changed neither and the assertion sat there passing.
//
// The rule that actually matters is about the COURSE. A science course owning a
// social studies element is a real crosswalk bug, and `kind` in
// curriculumPlan.js is the independent fact to test against.
const KIND_FOR_SUBJECT = { science: 'science', 'social studies': 'social' };
for (const o of STANDARD_OWNERS) {
  const elementSubject = subjectOf.get(o.element);
  if (!elementSubject) continue;
  const c = courseById(o.course);
  if (!c) continue;
  const wanted = KIND_FOR_SUBJECT[elementSubject];
  if (c.kind !== wanted) {
    errors.push(
      `${o.element} is a ${elementSubject} element, but ${c.title} is a "${c.kind}" course. ` +
        `A course cannot be answerable to Georgia for a subject it does not teach.`
    );
  }
}

// ---------------------------------------------------------------------------
// 1-3. The crosswalk itself
// ---------------------------------------------------------------------------
{
  const seen = new Map();
  for (const o of STANDARD_OWNERS) {
    if (!elementCodes.has(o.element)) {
      errors.push(`the crosswalk owns "${o.element}", which is not a real Georgia element`);
      continue;
    }
    if (seen.has(o.element)) {
      errors.push(
        `${o.element} is owned by both ${seen.get(o.element)} and ${o.course}. ` +
          `Exactly one course is answerable for each element — two owners is how both assume the other has it.`
      );
    }
    seen.set(o.element, o.course);

    const c = courseById(o.course);
    if (!c) {
      errors.push(`${o.element} is owned by "${o.course}", which is not a course`);
      continue;
    }
    if (!c.quarters.includes(o.quarter)) {
      errors.push(
        `${o.element} is assigned to ${c.title} quarter ${o.quarter}, but that course only runs in quarters ${c.quarters.join(', ')}`
      );
    }
    if (!o.vehicle || o.vehicle.trim().length < 15) {
      errors.push(
        `${o.element} has no vehicle — no sentence saying how it actually gets taught. ` +
          `An element assigned with no vehicle is an intention, not a plan.`
      );
    }
  }

  // ---- AN UNOWNED UNIT IS AN ERROR UNLESS IT IS DECLARED (v3.33) ----
  //
  // The easy way to drop a standard is to delete its crosswalk line, and then
  // this check goes quiet and the record silently covers 36 of 37 while every
  // screen still says the course is aligned to GSE. So a declaration is
  // required, and it has to carry a reason, a date and a person.
  const declared = new Map(DECLARED_OMISSIONS.map((d) => [d.element, d]));

  for (const d of DECLARED_OMISSIONS) {
    if (!elementCodes.has(d.element)) {
      errors.push(`"${d.element}" is declared dropped but is not a real Georgia unit`);
    }
    if (!d.reason || d.reason.trim().length < 20) {
      errors.push(`${d.element} is declared dropped with no reason written down`);
    }
    if (!d.decidedBy || !d.decidedOn) {
      errors.push(`${d.element} is declared dropped without saying who decided, or when`);
    }
    // A stale declaration is two people disagreeing in writing.
    if (seen.has(d.element)) {
      errors.push(
        `${d.element} is declared dropped AND owned by ${seen.get(d.element)}. ` +
          `One of those is out of date, and nothing on a screen would say which.`
      );
    }
  }

  const orphans = elements.filter((e) => !seen.has(e.code) && !declared.has(e.code));
  for (const e of orphans) {
    errors.push(`${e.code} is owned by no course. Georgia requires it; nothing in this app teaches it.`);
  }

  if (!orphans.length) {
    const dropped = DECLARED_OMISSIONS.length;
    notes.push(
      `all ${ELEMENT_COUNT} Georgia fourth-grade science elements AND ` +
        `${SOCIAL_ELEMENT_COUNT - dropped} of ${SOCIAL_ELEMENT_COUNT} social studies units are owned, ` +
        `each by exactly one course` +
        (dropped ? ` — ${dropped} declared dropped, below` : '')
    );
  }
}

// ---------------------------------------------------------------------------
// 4-5. What the lessons declare
// ---------------------------------------------------------------------------
{
  const ownerOf = new Map(STANDARD_OWNERS.map((o) => [o.element, o.course]));
  for (const l of ALL_LESSONS) {
    for (const code of l.standards || []) {
      if (!elementCodes.has(code)) {
        errors.push(`lesson ${l.id} declares "${code}", which is not a real Georgia element`);
        continue;
      }
      const owner = ownerOf.get(code);
      if (owner && owner !== l.course) {
        errors.push(
          `lesson ${l.id} (${l.course}) declares ${code}, which ${courseById(owner)?.title} owns. ` +
            `Reinforcing is fine; claiming is double-counting.`
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Coverage, by course state
// ---------------------------------------------------------------------------
// ---- THE SELF-GUARD, v3.27 ----
//
// The bug above was not that a course had no lessons. It was that this check
// could not SEE them. So before reporting coverage, it asserts that every
// course owning Georgia elements is a course whose lessons it is actually
// reading. Narrow the lesson source back to one course and this fails
// immediately, instead of printing a confident and wrong "still owed" list.
{
  const visible = new Set(ALL_LESSONS.map((l) => l.course));
  const teachable = new Set(TAUGHT_COURSES.map((c) => c.id));
  for (const c of APP_COURSES) {
    if (!elementsOwnedBy(c.id).length) continue;
    if (!teachable.has(c.id)) continue;
    const written = TAUGHT_COURSES.find((t) => t.id === c.id)?.lessons.length || 0;
    if (written > 0 && !visible.has(c.id)) {
      errors.push(
        `this check cannot see any lesson from "${c.id}", which owns ` +
          `${elementsOwnedBy(c.id).length} Georgia elements and has ${written} lessons written. ` +
          `Its coverage line below is not a measurement, it is a guess — and it would read "still ` +
          `owed" for every element however much work was done.`
      );
    }
  }
}

const coverage = [];
{
  for (const c of APP_COURSES) {
    const owned = elementsOwnedBy(c.id);
    if (!owned.length) continue;

    const lessons = ALL_LESSONS.filter((l) => l.course === c.id);
    const taught = new Set(lessons.flatMap((l) => l.standards || []));
    const missing = owned.filter((o) => !taught.has(o.element));

    coverage.push({
      course: c,
      owned: owned.length,
      covered: owned.length - missing.length,
      missing: missing.map((m) => m.element)
    });

    if (c.state === 'complete' && missing.length) {
      errors.push(
        `${c.title} is marked COMPLETE but ${missing.length} of its ${owned.length} elements have no lesson: ` +
          `${missing.map((m) => m.element).join(', ')}`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\nPetal & Pestle — Georgia standards check\n');

console.log(`  Georgia GSE, fourth-grade SCIENCE: ${GA_SCIENCE_4.length} standards, ${ELEMENT_COUNT} lettered elements`);
console.log(
  `  Georgia GSE, fourth-grade SOCIAL STUDIES: ${GA_SOCIAL_4.length} standards, ` +
    `${SOCIAL_LETTERED_COUNT} lettered elements + 2 standards with no letters = ${SOCIAL_ELEMENT_COUNT} units\n`
);

// The two secondary readings that disagreed with the GaDOE document are printed
// on every run, not filed away. A number that was nearly planned against is
// worth seeing next to the number that replaced it.
for (const r of REJECTED_COUNTS) {
  console.log(`  ⚠ "${r.claim}" — ${r.source}`);
  console.log(`      ${r.verdict}`);
}
console.log('');

for (const row of coverage) {
  const { course, owned, covered, missing } = row;
  const state = course.state.toUpperCase();
  console.log(`  ${course.title} — ${covered}/${owned} elements taught · ${state}`);
  if (missing.length) {
    console.log(`      still owed: ${missing.join(', ')}`);
  }
}

const totalOwned = coverage.reduce((s, r) => s + r.owned, 0);
const totalCovered = coverage.reduce((s, r) => s + r.covered, 0);

// Split by subject, because one number across both would let a finished subject
// carry an unstarted one — the same fault as a reading floor averaged across
// courses (v3.29). 25 of 25 and 0 of 37 is not "25 of 62 done".
for (const subj of ['science', 'social studies']) {
  const owners = STANDARD_OWNERS.filter((o) => o.subject === subj);
  const courseIds = new Set(owners.map((o) => o.course));
  let cov = 0;
  for (const row of coverage) {
    if (!courseIds.has(row.course.id)) continue;
    cov += row.covered;
  }
  console.log(`\n  ${subj.toUpperCase()}: ${cov} of ${owners.length} units have a lesson behind them.`);
}

console.log(`\n  TOTAL: ${totalCovered} of ${totalOwned} Georgia units have a lesson behind them.`);

if (totalCovered < totalOwned) {
  // ---- THIS SENTENCE WAS WRONG THE MOMENT A COURSE FINISHED (v3.32) ----
  //
  // It read "No course is marked complete, so this does not fail the build",
  // which was true from v3.5 to v3.29 and stopped being true at v3.30. A
  // hard-coded sentence in a report is a claim like any other, and this one had
  // been printing under two completed courses. It is computed now.
  const done = APP_COURSES.filter((c) => c.state === 'complete');
  const unfinished = coverage.filter((r) => r.course.state !== 'complete' && r.missing.length);
  console.log(
    `  ${totalOwned - totalCovered} still owed. Printed every run on purpose — a gap that is not\n` +
      `  on the screen is a gap that gets forgotten. ` +
      (done.length
        ? `${done.length} course(s) claim COMPLETE — ${done.map((c) => c.title).join(', ')} — and\n` +
          `  that claim IS tested and holds. `
        : `No course claims complete. `) +
      `The gap above sits in\n  ${unfinished.map((r) => r.course.title).join(', ') || 'no course'}, ` +
      `which ${unfinished.length === 1 ? 'says it is' : 'say they are'} still being built, so it does not fail the build.`
  );
}

// Printed on every run, not filed away. A decision that is not on the screen is
// a decision that gets forgotten, and this one changes what the app may claim.
if (DECLARED_OMISSIONS.length) {
  console.log('\n  Georgia units DELIBERATELY NOT TAUGHT, declared with a reason:');
  for (const d of DECLARED_OMISSIONS) {
    const el = elements.find((e) => e.code === d.element);
    console.log(`      ${d.element} — ${el ? el.standardText : ''}`);
    console.log(`          ${d.decidedBy}, ${d.decidedOn}: ${d.reason}`);
  }
}

console.log('\n  Taught deliberately off grade level, recorded rather than hidden:');
for (const t of TAUGHT_OFF_GRADE) {
  console.log(`      ${courseById(t.course)?.title} — ${t.realStandard} (grade ${t.grade})`);
}
console.log(`      ${OFF_GRADE_NOTES.length} off-grade standards documented in georgiaScience4.js`);

if (notes.length) {
  console.log('');
  for (const n of notes) console.log(`  · ${n}`);
}

if (errors.length) {
  console.log(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log('');
  process.exit(1);
}

console.log('\nThe crosswalk is sound: every element owned once, every owner real, every gap named.\n');
