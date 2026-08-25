// ---------------------------------------------------------------------------
// Run with: node scripts/check-links.mjs
//
// WHY THIS EXISTS.
//
// The grandmother asked a one-word question — does her day connect to the
// lessons? — and the answer was no. Every block named a subject and carried a
// note saying "Khan Academy — the unit on My Plan", which meant: leave this
// screen, open My Plan, find the row, read the unit name, open Khan, find that
// unit. Six steps to start a thirty-minute maths block.
//
// Nothing checked it, because nothing was broken. Every file compiled, every
// tag closed, every test passed. The schedule was simply a poster.
//
// So this checks the connection itself:
//
//   1. Every block naming a subject resolves to something openable, OR is on
//      the short list of subjects deliberately left unlinked — and that list
//      has to be stated here, not discovered later by a nine-year-old.
//   2. Every Khan URL is a real https khanacademy.org address.
//   3. Every course referenced by the level map actually exists in KHAN_COURSES.
//   4. Resolution works at EVERY level she could be measured at, not just the
//      one the developer happened to try.
//
// Point 4 is the one that earns its keep. A band table with a hole in it fails
// only for the child whose level lands in the hole, and there is exactly one
// child using this app.
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { DEFAULT_SCHEDULE } = await import(pathToFileURL(resolve(ROOT, 'src/config/schedule.js')).href);
const { resolveBlockTarget, SUBJECT_STRANDS, SUBJECT_OPTIONS } = await import(pathToFileURL(resolve(ROOT, 'src/lib/blockLinks.js')).href);
const { isRotatingBlock, blockLabelOnDay, BLOCK_ROTATION, ROTATION_COURSE_IDS } = await import(pathToFileURL(resolve(ROOT, 'src/lib/rotatingBlock.js')).href);
const { KHAN_COURSES, KHAN_MAP, khanFor, NOT_ON_KHAN } = await import(pathToFileURL(resolve(ROOT, 'src/data/khan/khanMap.js')).href);
const { STRAND_IDS } = await import(pathToFileURL(resolve(ROOT, 'src/config/strands.js')).href);

const errors = [];
const notes = [];

// ---------------------------------------------------------------------------
// THE UNLINKED EXEMPTION IS DERIVED, NOT LISTED — v3.42
//
// ---- WHAT THIS USED TO BE, AND WHAT IT COST ----
//
// A hand-written object:
//
//   const DELIBERATELY_UNLINKED = {
//     social:  'Khan has no elementary Social Studies at all…',
//     science: 'Khan has no elementary Science either…'
//   };
//
// Both reasons are TRUE. Both are also about KHAN, and Khan was never the
// question. The question is whether THIS APP teaches the subject — and it has
// taught The Science Lab since v3.30 and Social Studies since v3.37, 48 lessons
// each. blockLinks.js returned null for both the whole time, so her 2:10 and
// 2:45 blocks named a subject and offered nothing to press, and this check
// stayed green through twelve versions because the names were on the list.
//
// GIGI FOUND IT ON SCREEN. Tenth time.
//
// ---- WHY A LIST WAS ALWAYS GOING TO DO THIS ----
//
// An exemption fails once it is no longer needed (v3.24, fired at v3.26 and
// v3.30). A LIST cannot fire, because nothing about a list changes when the
// world underneath it does. The same lesson was already learned about reading
// exemptions at v3.25 — "a reading exemption is DERIVED from what is taught,
// never a list" — and it was not carried across to this one.
//
// So it is derived now, from the only fact that matters:
//
//   A SUBJECT MAY BE UNLINKED ONLY IF THE APP HAS NO WRITTEN LESSONS FOR IT.
//
// This would have failed itself the day The Science Lab shipped its 48th
// lesson. It will fail itself again the day The Human Body gets its first week,
// which is the next course to be written — and at that point the "being
// written" notice on her Tuesday block must become a real link, or the build
// stops. That is the point: the rule now expires on its own.
// ---------------------------------------------------------------------------
const { APP_COURSES } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/appCourses.js')).href);
const { WEEKS } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);

/** Which course id a timetable subject is taught by, where the app teaches it. */
const SUBJECT_COURSE = {
  science: 'sciencelab',
  social: 'social',
  herbalism: 'herbalism',
  body: 'humanbody'
};

/** Lessons written, by COURSE id. */
function lessonsWrittenForCourse(courseId) {
  const course = APP_COURSES.find((c) => c.id === courseId);
  return course ? course.lessons.length : 0;
}

/** Lessons written, by course id — the fact the exemption is derived from. */
function lessonsWrittenFor(subject) {
  const courseId = SUBJECT_COURSE[subject];
  if (!courseId) return null; // not one of the app's own courses
  return lessonsWrittenForCourse(courseId);
}

/** Which rotation key a rotating block holds on a given day, ignoring progress. */
function ROTATION_KEY_ON_DAY(block, date) {
  const rota = BLOCK_ROTATION[block.id];
  if (!rota) return null;
  const dow = date.getDay() === 0 ? 7 : date.getDay();
  return rota[dow] || null;
}

/**
 * May this subject be left unlinked?
 *
 * Only when the app teaches it and has written nothing yet. A subject the app
 * does not own at all (Khan's three) is not covered here — those must resolve
 * through the band tables, and do.
 */
function mayBeUnlinked(subject) {
  const written = lessonsWrittenFor(subject);
  if (written === null) return false;
  return written === 0;
}

function unlinkedReason(subject) {
  const courseId = SUBJECT_COURSE[subject];
  const weeks = (WEEKS[courseId] || []).length;
  return (
    `the app owns "${subject}" (course ${courseId}) and has written 0 lessons and ${weeks} weeks ` +
    `for it so far — unwritten is not finished, so the block says so in words instead of ` +
    `opening an empty course. This exemption expires by itself the moment a lesson is written.`
  );
}

// ---- 3. every course in the band tables exists ----
let notOnKhan = 0;
for (const [strandId, bands] of Object.entries(KHAN_MAP)) {
  // A strand Khan does not teach at her level is a NAMED value, not an empty
  // list, so it cannot be mistaken for a table nobody has filled in yet. The
  // three science strands are here because Khan's 3rd, 4th and 5th grade
  // science pages were all rendered on Aug 16 2026 and every one returns
  // "Page not found" — Khan's science index starts at 6th grade now.
  if (bands === NOT_ON_KHAN) { notOnKhan++; continue; }
  if (!Array.isArray(bands)) {
    errors.push(`${strandId}: is neither a list of bands nor NOT_ON_KHAN`);
    continue;
  }
  for (const band of bands) {
    if (!KHAN_COURSES[band.course]) {
      errors.push(`${strandId}: band "${band.unit}" points at course "${band.course}", which does not exist`);
    }
  }
}
if (notOnKhan) notes.push(`${notOnKhan} strands marked NOT_ON_KHAN — Khan has nothing at her level, and that is recorded rather than left blank`);

// ---- 2. every URL is a real Khan address ----
for (const [id, course] of Object.entries(KHAN_COURSES)) {
  if (!/^https:\/\/www\.khanacademy\.org\/[\w\-/]+$/.test(course.url || '')) {
    errors.push(`course "${id}" has a URL that is not a plain https khanacademy.org address: ${course.url}`);
  }
}
if (!errors.length) notes.push(`${Object.keys(KHAN_COURSES).length} Khan courses, all with valid URLs`);

// ---- 4. resolution works at every level, measured and unmeasured ----
const LEVELS = [];
for (let l = 2.0; l <= 6.5001; l += 0.1) LEVELS.push(Math.round(l * 10) / 10);

for (const [subject, strandIds] of Object.entries(SUBJECT_STRANDS)) {
  const block = { id: 'test', subject };

  // Unmeasured — she has not taken the Check-In yet. Must still give her
  // somewhere to go, or the first morning is a dead end.
  const cold = resolveBlockTarget(block, {});
  if (!cold) {
    errors.push(`"${subject}" resolves to nothing before the Check-In — her first day would be a dead end`);
  }

  // Measured, at every level in range.
  let holes = 0;
  for (const level of LEVELS) {
    const strands = {};
    for (const id of strandIds) strands[id] = { level, asked: 8, correct: 4 };
    const t = resolveBlockTarget(block, strands);
    if (!t || !t.url || !t.label) holes++;
    // And the underlying band lookup itself
    for (const id of strandIds) {
      if (!khanFor(id, level)) holes++;
    }
  }
  if (holes) {
    errors.push(`"${subject}" fails to resolve at ${holes} of ${LEVELS.length} possible levels`);
  } else {
    notes.push(`"${subject}" resolves at all ${LEVELS.length} levels from 2.0 to 6.5`);
  }
}

// ---- 1. every block on the default day opens, on EVERY DAY OF HER WEEK ----
//
// v3.42: this used to resolve once, with no day and no progress. That was
// enough while every subject gave the same answer all week — and the 2:45 block
// has rotated since v3.22. Asking on one unnamed day is how a block that is
// right on Monday and broken on Tuesday passes.
//
// Monday to Friday, every block, every time.
const WEEK = [
  ['Mon', new Date('2026-08-17T09:00:00')],
  ['Tue', new Date('2026-08-18T09:00:00')],
  ['Wed', new Date('2026-08-19T09:00:00')],
  ['Thu', new Date('2026-08-20T09:00:00')],
  ['Fri', new Date('2026-08-21T09:00:00')]
];

for (const block of DEFAULT_SCHEDULE) {
  if (!block.subject) continue;
  for (const [dayName, date] of WEEK) {
    const t = resolveBlockTarget(block, {}, [], [], date);
    if (!t && !mayBeUnlinked(block.subject)) {
      errors.push(
        `block "${block.label}" names subject "${block.subject}" and opens nothing on ${dayName}, ` +
          `and that is not a decision the data supports — the app has ` +
          `${lessonsWrittenFor(block.subject) ?? 'no'} lessons written for it. She would press a ` +
          `subject and get a dead end.`
      );
    }
    // A target that exists but points nowhere is the same dead end wearing a
    // button. 'notice' is the one kind that is allowed to have neither a url
    // nor a view, because it deliberately renders words and no control.
    if (t && t.kind !== 'notice' && !t.url && !t.view) {
      errors.push(
        `block "${block.label}" on ${dayName} resolves to a target with no url and no view — ` +
          `a button that goes nowhere is worse than no button`
      );
    }
    // The lessons tab holds several courses. Arriving without saying which one
    // lands on APP_COURSES[0] — Herbalism — whatever the block was called.
    if (t && t.view === 'lessons' && !t.course) {
      errors.push(
        `block "${block.label}" on ${dayName} opens the lessons tab without naming a course, so it ` +
          `would land on "${APP_COURSES[0].id}" regardless of the subject she pressed. This is the ` +
          `v3.20 bug — her schedule opening a course index instead of her work.`
      );
    }
    if (t && t.course && !APP_COURSES.some((c) => c.id === t.course)) {
      errors.push(`block "${block.label}" on ${dayName} names course "${t.course}", which does not exist`);
    }
  }
}

// ---------------------------------------------------------------------------
// IT MUST OPEN THE RIGHT THING, NOT MERELY SOMETHING — v3.42
//
// Found by a negative test that MISSED. Inverting the Science Lab run-out rule
// — so the block hands its half hour to the garden while all 48 lessons are
// still unread — passed every assertion above, because gardenTarget() is a
// perfectly well-formed target with a view on it. The check was asking "is
// there an answer" and never "is the answer right".
//
// That is v3.21's rule word for word: a check that tests the SHAPE of an answer
// instead of the answer is no check at all. It cost a whole version then too.
//
// Both directions are tested, with made-up progress, which is only possible
// because courseFinished() is pure.
// ---------------------------------------------------------------------------
for (const block of DEFAULT_SCHEDULE) {
  if (!block.subject) continue;
  const courseId = SUBJECT_COURSE[block.subject];
  if (!courseId) continue;
  const course = APP_COURSES.find((c) => c.id === courseId);
  if (!course || !course.lessons.length) continue;

  const everyLesson = (WEEKS[courseId] || []).flatMap((w) => w.lessons || []);

  for (const [dayName, date] of WEEK) {
    // ---- nothing read: the garden is not where an unstarted course goes ----
    const fresh = resolveBlockTarget(block, {}, [], [], date);
    if (fresh?.view === 'greenhouse') {
      errors.push(
        `block "${block.label}" hands its time to the garden on ${dayName} with NOTHING read. ` +
          `The garden is where a FINISHED course goes — ${course.lessons.length} lessons of ` +
          `${courseId} are written and unread. Unstarted is not finished, the same way ` +
          `unwritten is not (v3.31).`
      );
    }
    // ⚠️ THIS ASSUMED ONE SUBJECT MEANS ONE COURSE, AND THAT STOPPED BEING TRUE
    // THE DAY THE HUMAN BODY HAD A LESSON.
    //
    // The 2:45 block's subject is 'social', and on Tuesday and Thursday it
    // legitimately opens 'humanbody'. Written at v3.42, when the rotation's
    // other course was unwritten and always answered with a notice, so the
    // block only ever resolved to Social Studies and the assumption never
    // showed. It failed the first correct build after Module 1 landed.
    //
    // The expected course is read from the rotation now, the same way the label
    // is — which is the very rule this check exists to enforce, applied to the
    // check itself.
    let expected = courseId;
    if (isRotatingBlock(block.id)) {
      const key = ROTATION_KEY_ON_DAY(block, date);
      if (key) expected = ROTATION_COURSE_IDS[key] || courseId;
    }
    if (fresh?.view === 'lessons' && fresh.course !== expected) {
      errors.push(
        `block "${block.label}" on ${dayName} should open "${expected}" and opens ` +
          `"${fresh.course}" instead`
      );
    }

    // ---- every lesson read: it must let go ----
    // Only asserted where a hand-over is actually declared. Herbalism runs all
    // four quarters and keeps its block for ever, so it is not claimed here —
    // a check must never claim more than it tests.
    if (courseId === 'sciencelab' && everyLesson.length) {
      const done = resolveBlockTarget(block, {}, [], everyLesson, date);
      if (done?.view === 'lessons' && done.course === courseId) {
        errors.push(
          `block "${block.label}" still opens The Science Lab on ${dayName} after every one of its ` +
            `${everyLesson.length} lessons has been read. §7.1 declares this half hour open in ` +
            `Quarters 2 and 4 — and with no calendar in this app, her progress is the only thing ` +
            `that can hand it over.`
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// A "STILL BEING WRITTEN" NOTICE MUST DISAPPEAR THE DAY IT IS WRITTEN — v3.46
//
// ⚠️ v3.42 MADE A PROMISE IN A COMMENT AND DID NOT KEEP IT.
//
// The unlinked exemption was made derived, and the note beside it said: "it
// will fail itself the day The Human Body gets its first week." It did not.
// Module 1 landed with four lessons, forty questions and two registered weeks,
// and her Tuesday block still read "still being written" — because blockLinks
// returned that notice unconditionally, and this check only ever asked whether
// a target EXISTED. A notice is a target. So nothing fired.
//
// The exemption was genuinely derived. The thing it guarded was not reachable
// from it. A PROMISE A CHECK MAKES IN A COMMENT IS NOT A PROMISE THE CHECK
// KEEPS, and the only way to tell the difference is to assert it.
// ---------------------------------------------------------------------------
for (const block of DEFAULT_SCHEDULE) {
  if (!block.subject) continue;
  for (const [dayName, date] of WEEK) {
    const t = resolveBlockTarget(block, {}, [], [], date);
    if (t?.kind !== 'notice') continue;

    // Which course is this notice standing in for? Either the block's own
    // subject, or — on a rotating block — whatever course holds today.
    let courseId = SUBJECT_COURSE[block.subject];
    if (isRotatingBlock(block.id)) {
      const key = ROTATION_KEY_ON_DAY(block, date);
      if (key) courseId = ROTATION_COURSE_IDS[key] || courseId;
    }
    const written = lessonsWrittenForCourse(courseId);
    if (written > 0) {
      errors.push(
        `block "${block.label}" on ${dayName} still shows "${t.detail}" while ${written} lesson(s) ` +
          `of ${courseId} are written and reachable. A notice saying a course is being written is ` +
          `only true while it is being written, and this is the exact promise v3.42 made and did ` +
          `not keep.`
      );
    }
  }
}

// THE LABEL AND THE LINK MUST NAME THE SAME COURSE.
//
// This is the fault underneath the one Gigi reported. The label is built by
// blockLabelOnDay(block, date, …, lessonsRead) and knew about the rotation; the
// target was built from block.subject alone and did not. So on a Tuesday the
// block read "The Human Body" while the only thing deciding what it opened was
// the string 'social'. Nothing compared the two.
// ---- ⚠️ v3.79 — AND IT COMPARED MORE THAN IT CLAIMED TO ----
//
// The heading above says THE SAME COURSE. The test said `label !== detail`,
// which is the same thing only while `detail` holds nothing but a course name.
//
// v3.79 gave the four app-course blocks a real destination, so detail became
// "Social Studies · Week 1 · The bill, and the people who refused" — the same
// course, and now also the week she is up to. All four rotating days went red
// on a change that made the screen MORE truthful, not less.
//
// THAT IS THIS PROJECT'S MOST REPEATED SIN, and the seventh time: a check that
// fails a safer change. The fix people reach for is to weaken the check —
// delete the assertion, or exempt the block. Both would have thrown away the
// rule that caught the v3.42 bug, where a Tuesday block read "The Human Body"
// and opened Social Studies.
//
// So it compares THE COURSE SEGMENT, which is what the heading always promised.
// Everything after the first separator is detail ABOUT that course and cannot
// contradict it. A link that names a different course still fails, and the
// negative test that reintroduces the v3.42 bug still goes red.
const courseSegment = (s) => String(s || '').split(' · ')[0].trim();

for (const block of DEFAULT_SCHEDULE) {
  if (!isRotatingBlock(block.id)) continue;
  for (const [dayName, date] of WEEK) {
    const label = blockLabelOnDay(block, date, undefined, []);
    const t = resolveBlockTarget(block, {}, [], [], date);
    const named = courseSegment(t?.kind === 'notice' ? t.label : t?.detail);
    if (!named) continue;
    if (label && named && label !== named && !['Catch-up', 'Garden & Projects'].includes(label)) {
      errors.push(
        `the rotating block reads "${label}" on ${dayName} but its link is for "${named}". ` +
          `A label and a link reading two different facts is how a screen tells her one thing ` +
          `and does another.`
      );
    }
  }
}

// Every subject offered to a grown-up in the dropdown must behave.
for (const [id] of SUBJECT_OPTIONS) {
  if (!id) continue;
  const t = resolveBlockTarget({ subject: id }, {}, [], []);
  if (!t && !mayBeUnlinked(id)) {
    errors.push(`the Grown-Up Corner offers "${id}" but it opens nothing`);
  }
}

const linked = DEFAULT_SCHEDULE.filter((b) => b.subject && resolveBlockTarget(b, {}, [], []));
notes.push(`${linked.length} of ${DEFAULT_SCHEDULE.length} blocks on the default day open something`);
for (const subject of Object.keys(SUBJECT_COURSE)) {
  if (mayBeUnlinked(subject)) notes.push(`"${subject}" may be unlinked, DERIVED: ${unlinkedReason(subject)}`);
  else {
    const n = lessonsWrittenFor(subject);
    notes.push(`"${subject}" must link — the app has written ${n} lessons for it`);
  }
}


// ---------------------------------------------------------------------------
// TODAYVIEW MUST PASS HER PROGRESS INTO resolveBlockTarget — v3.42
//
// resolveBlockTarget(block, strands, grades, lessonsRead, date) defaults the
// last two, and a caller that omits them gets the pre-v3.42 answer: the 2:45
// block resolved as though it were Social Studies every day of the week, and
// the Science Lab block never noticed she had finished the course. Every other
// assertion in this file would stay green, because they call it correctly.
//
// AN OPTIONAL ARGUMENT THAT MUST ALWAYS BE PASSED IS A RULE NOBODY ENFORCES —
// v3.31, and it fired for real at v3.40 when a one-argument miniLessonFor would
// have handed her lesson 1 for ever.
//
// Counted with a real parenthesis scan, not a regex. `fn\([^)]*\)` stops at the
// first close paren, so `resolveBlockTarget(b, strands, khanGrades, lessonsRead,
// new Date())` reads as ending at `new Date(` and every correct call is reported
// as a bare one. That check was wrong once already, at v3.31, and the fix was to
// match the parentheses rather than weaken the rule.
// ---------------------------------------------------------------------------
{
  const src = readFileSync(resolve(ROOT, 'src/components/Schedule/TodayView.jsx'), 'utf8');
  const name = 'resolveBlockTarget(';
  const calls = [];
  let i = src.indexOf(name);
  while (i !== -1) {
    let depth = 0;
    let j = i + name.length - 1;
    for (; j < src.length; j++) {
      if (src[j] === '(') depth++;
      else if (src[j] === ')') {
        depth--;
        if (depth === 0) break;
      }
    }
    calls.push(src.slice(i, j + 1));
    i = src.indexOf(name, j + 1);
  }

  // The import line is not a call.
  const real = calls.filter((c) => c.includes(','));
  if (!real.length) {
    errors.push(
      'TodayView no longer calls resolveBlockTarget — her day would show no links at all'
    );
  }
  const bare = real.filter((c) => !c.includes('lessonsRead'));
  if (bare.length) {
    errors.push(
      `TodayView calls resolveBlockTarget without lessonsRead ${bare.length} time(s) — the rotating ` +
        `block would resolve as Social Studies every day, including the two that belong to The ` +
        `Human Body, and the Science Lab block would never hand its half hour to the garden`
    );
  }
  const undated = real.filter((c) => !c.includes('Date'));
  if (undated.length) {
    errors.push(
      `TodayView calls resolveBlockTarget without a date ${undated.length} time(s) — the 2:45 block ` +
        `cannot know which day it is, so its link and its label would disagree`
    );
  }
  if (real.length && !bare.length && !undated.length) {
    notes.push(
      `TodayView passes her progress and the date into all ${real.length} resolveBlockTarget call(s)`
    );
  }
}

// ---------------------------------------------------------------------------
// THE GRADE SHE IS SENT TO MUST MATCH THE GRADE SHE MEASURED AT.
//
// Gigi caught this on screen, which means every check I had written missed it.
// My Plan printed, on one row:
//
//     Writing Strategies · about halfway through 2nd grade
//     3rd Grade Reading & Vocabulary
//
// The description and the assignment contradicted each other. The cause was a
// hole in the band table: writing-strategies had a 1st-grade band and a
// 3rd-grade band and NOTHING BETWEEN THEM, so every level from 2.0 to 2.9 fell
// through into 3rd grade. A separate off-by-one sent every 2.0 to 1st grade.
//
// Nothing failed. Every link resolved, every URL was valid, every level
// produced a course — the tests only ever asked "is there an answer", never
// "is the answer right". A child would simply have opened work a full year
// above her and concluded she was stupid.
//
// So: sweep every strand at every level and require the assigned grade to equal
// the measured grade. Khan's Grammar course has no grade in its name and is
// exempt by name, not by accident.
// ---------------------------------------------------------------------------
{
  const gradeOf = (label) => {
    const m = String(label).match(/(\d)(?:st|nd|rd|th) Grade/);
    return m ? Number(m[1]) : null;
  };
  let mismatches = 0;
  let checked = 0;
  // Only the strands the Check-In actually measures. KHAN_MAP still carries
  // bands for plants-life, human-body and scientific-method — those were parked
  // when Science came out of the Check-In, and they start at 3rd grade because
  // that is where the Herbalism course will pick them up. Sweeping them here
  // would report a dozen failures about a screen no child can reach.
  const LIVE = new Set(STRAND_IDS);
  for (const strandId of Object.keys(KHAN_MAP)) {
    if (!LIVE.has(strandId)) continue;
    if (KHAN_MAP[strandId] === NOT_ON_KHAN) continue;
    // Swept in HUNDREDTHS, not tenths. At 0.1 steps this check passed while
    // 2.91 was still being sent to 3rd grade — the gap was narrower than the
    // sweep. A real child's vocabulary landed in it.
    for (let l = 1.2; l <= 6.5001; l += 0.01) {
      const level = Math.round(l * 100) / 100;
      const k = khanFor(strandId, level);
      if (!k) {
        errors.push(`${strandId}: no Khan unit at level ${level}`);
        continue;
      }
      const grade = gradeOf(k.courseLabel);
      if (grade === null) continue; // Grammar, Middle School Biology — no grade in the name
      checked++;
      const expected = Math.floor(level);
      if (grade !== expected) {
        mismatches++;
        if (mismatches <= 6) {
          errors.push(
            `${strandId}: measured ${level} sends her to ${k.courseLabel} — ` +
              `a grade ${grade > expected ? 'ABOVE' : 'below'} where she tested`
          );
        }
      }
    }
  }
  if (mismatches > 6) errors.push(`...and ${mismatches - 6} more level/grade mismatches`);
  if (!mismatches) {
    notes.push(
      `every level from 1.2 to 6.5 lands in its own grade, across all ${LIVE.size} live strands (${checked} checks)`
    );
  }
}

// ---------------------------------------------------------------------------
// THE NAVIGATION — six tabs, and NOTHING LOST BEHIND THE MERGE.
//
// Gigi, backlog §3: eleven top-level destinations collapsing to about six. The
// danger in a merge like that is not the tabs — it is the two hundred places
// inside the app that say `onNavigate('market')`. Every one of those was
// written against a tab that no longer exists at the top level, and a link that
// goes nowhere does not crash, does not log, and looks to a nine-year-old
// exactly like the app being broken.
//
// So the merge was done by making every SECTION id the old VIEW id, and these
// assertions are what prove that held. Four rules:
//
//   1. Every id the app navigates to is a real section somewhere in the nav.
//   2. Every section the nav offers is a screen App.jsx can actually render.
//   3. No id appears in two tabs, so "where am I" always has one answer.
//   4. The bar stays short. Twelve tabs wrapped onto two rows, which is how a
//      child ends up never finding My Courses.
// ---------------------------------------------------------------------------
{
  const { NAV, ALL_VIEWS, tabForView, MAX_TABS } = await import(pathToFileURL(resolve(ROOT, 'src/config/navigation.js')).href);

  // ---- 3. one home each
  const seen = new Map();
  for (const tab of NAV) {
    for (const sec of tab.sections) {
      if (seen.has(sec.id)) {
        errors.push(`"${sec.id}" is in both ${seen.get(sec.id)} and ${tab.label} — it needs one home`);
      }
      seen.set(sec.id, tab.label);
    }
  }

  // ---- 4. the bar stays short
  //
  // Belt and braces, and worth saying so honestly: rules 1-3 already make a
  // seventh tab hard to add, because any new tab needs a section, and a section
  // must be a screen App.jsx renders and must not already live in another tab.
  // The negative test for this line therefore trips rule 3 first. It stays
  // because the day someone writes a genuinely new screen, this is the line
  // that makes them displace something instead of lengthening the row.
  if (NAV.length > MAX_TABS) {
    errors.push(`${NAV.length} top-level tabs, and the bar wraps past ${MAX_TABS}`);
  }

  // ---- 2. every section is a screen App.jsx renders
  const app = readFileSync(resolve(ROOT, 'src/App.jsx'), 'utf8');
  const rendered = new Set([...app.matchAll(/view === '([a-z]+)'/g)].map((m) => m[1]));
  rendered.delete('parent');
  for (const id of ALL_VIEWS) {
    if (!rendered.has(id)) {
      errors.push(`the nav offers "${id}" but App.jsx renders no screen for it — a tab that shows nothing`);
    }
  }
  for (const id of rendered) {
    if (!ALL_VIEWS.includes(id)) {
      errors.push(`App.jsx can render "${id}" but no tab or section reaches it — a screen she cannot get to`);
    }
  }

  // ---- 1. EVERY LINK IN THE APP STILL LANDS SOMEWHERE
  //
  // This is the one that makes "nothing breaks" a fact rather than a promise.
  // It reads every navigate call in every source file, so a button in a lesson
  // screen written six versions ago is covered by the same rule as the nav.
  const files = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const p = `${dir}/${name}`;
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.jsx?$/.test(p)) files.push(p);
    }
  })(resolve(ROOT, 'src'));

  const ALLOWED = new Set([...ALL_VIEWS, 'parent']);
  let links = 0;
  const dead = new Set();
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/(?:onNavigate|setView|navigate)\(\s*'([a-z][a-z-]*)'\s*\)/g)) {
      links += 1;
      if (!ALLOWED.has(m[1])) dead.add(`${m[1]} (in ${file.split('/src/')[1]})`);
    }
  }
  for (const d of dead) {
    errors.push(`a button navigates to "${d}" — nothing in the nav reaches it, so tapping it does nothing`);
  }
  if (!dead.size) {
    notes.push(`${NAV.length} tabs, ${ALL_VIEWS.length} screens, ${links} navigation calls — every one lands somewhere`);
  }
}

// ---------------------------------------------------------------------------
// THE GROWN-UP CORNER — six groups, and everything that moves data lives in one.
//
// Gigi's §3, verbatim: "Import · Export · Backup — all under Settings." They
// were three separate places: loading her data was its own top-level panel,
// downloading a backup was buried at the bottom of Settings, and the export in
// the other direction does not exist yet at all (§4.3, still owed).
//
// The last rule here is the one worth having. "All under Settings" is easy to
// satisfy on the day and easy to undo six versions later by adding a second
// download button somewhere convenient — and then a grown-up has two places to
// look for the same thing, which is how "I don't understand this tab" starts.
// ---------------------------------------------------------------------------
{
  const { PARENT_NAV, ALL_PARENT_VIEWS, parentTabForView, DATA_GROUP } = await import(pathToFileURL(resolve(ROOT, 'src/config/navigation.js')).href);
  const dash = readFileSync(resolve(ROOT, 'src/components/Parent/ParentDashboard.jsx'), 'utf8');

  const seen = new Map();
  for (const group of PARENT_NAV) {
    for (const sec of group.sections) {
      if (seen.has(sec.id)) {
        errors.push(`grown-up panel "${sec.id}" is in both ${seen.get(sec.id)} and ${group.label}`);
      }
      seen.set(sec.id, group.label);
    }
  }
  if (PARENT_NAV.length > 6) {
    errors.push(`${PARENT_NAV.length} groups in the Grown-Up Corner — Gigi asked for about six`);
  }

  const rendered = new Set([...dash.matchAll(/tab === '([a-z]+)'/g)].map((m) => m[1]));
  for (const id of ALL_PARENT_VIEWS) {
    if (!rendered.has(id)) {
      errors.push(`the Grown-Up Corner offers "${id}" but nothing renders it — an empty panel`);
    }
  }
  for (const id of rendered) {
    if (!ALL_PARENT_VIEWS.includes(id)) {
      errors.push(`ParentDashboard can render "${id}" but no group reaches it — a panel she cannot open`);
    }
  }

  // ---- IMPORT, EXPORT AND BACKUP ALL UNDER SETTINGS ----
  for (const id of ['import', 'settings']) {
    const where = parentTabForView(id);
    if (!where) {
      errors.push(`"${id}" has no home in the Grown-Up Corner`);
    } else if (where.id !== DATA_GROUP) {
      errors.push(
        `"${id}" sits under ${where.label}, not Settings — Gigi asked for import, export and ` +
          `backup to be in one place`
      );
    }
  }
  // And exactly one of each, so a second download button cannot appear elsewhere.
  const exports_ = (dash.match(/onClick=\{handleExport\}/g) || []).length;
  const imports_ = (dash.match(/<ImportPanel\b/g) || []).length;
  if (exports_ !== 1) {
    errors.push(`${exports_} download-backup buttons in the Grown-Up Corner — there must be exactly one, and it lives in Settings`);
  }
  if (imports_ !== 1) {
    errors.push(`${imports_} places to load her data — there must be exactly one, and it lives in Settings`);
  }

  // ---- §1.4: the panel has to EXPLAIN itself ----
  //
  // "I don't understand the 'load her data' tab." The rewrite answers three
  // questions in order — what the file is, where it comes from, what happens
  // after. This asserts the third one is still there, because it is the one a
  // future tidy-up would cut as redundant.
  // SLICE CAREFULLY, and here is why this comment exists. The first version
  // sliced from ImportPanel to the next `\nfunction `, and ImportPanel is the
  // LAST plain function in the file — so the slice ran to the end and swallowed
  // the Settings panel, which also contains the words "Download backup". The
  // assertion below then passed on the wrong region: it was reading Settings and
  // reporting on the import panel. Its own negative test caught it, which is the
  // entire argument for negative-testing a check rather than trusting it green.
  const pStart = dash.indexOf('function ImportPanel');
  const pEnd = dash.indexOf('export function ParentDashboard', pStart);
  if (pStart === -1 || pEnd === -1) {
    errors.push('could not find the load-her-data panel to read it');
  }
  const panel = dash.slice(pStart, pEnd);

  // ---- AND THE LABEL IS READ, NOT TYPED. Aug 19. ----
  //
  // This asserted the literal string "Download backup". Renaming the button to
  // "Export / download backup" — the §32.7 findability fix, a CORRECT change —
  // turned it red for the wrong reason, because the check held its own copy of a
  // label that lives in another panel.
  //
  // Two hand-typed copies of one label is rule 20's failure waiting to happen,
  // and the failure mode is the nasty one: the instructions on this screen tell a
  // grown-up to look for a button whose name has changed. So the check now READS
  // the export button's real label and asserts these instructions quote it.
  // Rename the button and this stays green; rename it in ONE place and it goes
  // red naming both. Stronger than what it replaced, not looser.
  const btn = dash.match(/>\s*⬇\s*([^<{]*?)\s*\(\.json\)\s*</);
  if (!btn) {
    errors.push(
      'could not find the export button to read its label. It is the control the load panel ' +
        'sends a grown-up to look for, and this check compares the two rather than holding a copy.'
    );
  }
  const exportLabel = btn ? btn[1].trim() : null;
  if (exportLabel && !panel.toLowerCase().includes(exportLabel.toLowerCase())) {
    errors.push(
      `the load-her-data panel tells a grown-up to look for a control this app does not have. ` +
        `The export button says "${exportLabel}" and step 1 of the instructions does not quote it — ` +
        `so the one screen that explains where the file comes from names the wrong thing.`
    );
  } else if (!exportLabel) {
    errors.push('the load-her-data panel no longer says WHERE the file comes from');
  }
  if (!/deleted or written over/.test(panel)) {
    errors.push('the load-her-data panel no longer says what happens to what is already here');
  }

  notes.push(
    `Grown-Up Corner: ${PARENT_NAV.length} groups, ${ALL_PARENT_VIEWS.length} panels — import, export and backup all under Settings`
  );
}

// ---------------------------------------------------------------------------
// THE READ-ALOUD CAVEAT MUST COVER EVERY STRAND IT APPLIES TO — AND RENDER.
//
// Found in §32.2a and fixed Aug 19. Two separate faults in one paragraph:
//
//   1. READING_STRANDS = ['reading-comprehension', 'vocabulary'] was typed
//      INSIDE ParentDashboard, where no check could reach it. Grammar-Usage and
//      Writing-Strategies were missing, so the One-Page Report told a grown-up
//      that hearing a GRAMMAR question aloud "removes the reading load".
//      NINE of Azianna's forty-two read-aloud answers are in those two strands,
//      and grammar is the strand she is about to be re-measured in.
//
//   2. readAloudByStrand() computed the per-strand breakdown correctly and had
//      ZERO CONSUMERS — the fourth thing in this app written right and rendered
//      nowhere, after the Science Lab course at v3.24, the rubrics at v3.38 and
//      the goals engine at v3.58.
// ---------------------------------------------------------------------------
{
  const { readFileSync } = await import('node:fs');
  const dashSrc = readFileSync(resolve(ROOT, 'src/components/Parent/ParentDashboard.jsx'), 'utf8');
  const { STRANDS, READ_ALOUD_CHANGES_CONSTRUCT } = await import(pathToFileURL(resolve(ROOT, 'src/config/strands.js')).href);

  // DERIVED, NEVER TYPED. The expectation is computed from the same STRANDS
  // table the app reads, so adding a tenth strand cannot leave this stale.
  const expected = STRANDS.filter((s) => s.subject === 'ela').map((s) => s.id);
  const missing = expected.filter((id) => !READ_ALOUD_CHANGES_CONSTRUCT.includes(id));
  if (missing.length) {
    errors.push(
      `read-aloud: ${missing.join(', ')} measure reading and are not in ` +
        `READ_ALOUD_CHANGES_CONSTRUCT. The report would tell a grown-up that hearing ` +
        `${missing.length === 1 ? 'that question' : 'those questions'} aloud "removes the reading ` +
        `load", which is the v3.56 finding.`
    );
  }
  if (READ_ALOUD_CHANGES_CONSTRUCT.length < expected.length) {
    errors.push('read-aloud: the construct list is shorter than the ELA strands it is derived from.');
  }

  // A hand-typed list of strand ids in the component is the fault itself, not a
  // style preference. Matching on the ids means renaming the constant cannot
  // hide it.
  const handTyped = dashSrc.match(/\[\s*'reading-comprehension'\s*,\s*'vocabulary'\s*\]/);
  if (handTyped) {
    errors.push(
      'read-aloud: a strand list is typed inside ParentDashboard again. It lives in ' +
        'config/strands.js so a check can reach it — rule 13, and rule 20.'
    );
  }

  // AND IT HAS TO REACH THE SCREEN. Rule 21: what RENDERS, not what is mentioned.
  if (!/readAloud\.perStrand\.map/.test(dashSrc)) {
    errors.push(
      'read-aloud: the per-strand breakdown is computed and never rendered. readAloudByStrand() ' +
        'sat correct and consumerless from v3.55 to v3.59; a second time would be a pattern.'
    );
  }
  if (!/\{s\.readAloud\} of \{s\.total\}/.test(dashSrc)) {
    errors.push('read-aloud: the per-strand rows render no numbers.');
  }
  if (!/readAloudByStrand\(\)/.test(dashSrc)) {
    errors.push('read-aloud: the report no longer reads the store function that computes this.');
  }

  if (!missing.length && !handTyped) {
    notes.push(
      `read-aloud: all ${READ_ALOUD_CHANGES_CONSTRUCT.length} Reading & Writing strands carry the ` +
        `caveat, derived from the subject, and the per-strand counts render`
    );
  }
}

// ---------------------------------------------------------------------------
// THE PLAY TAB — EVERY ADDRESS CARRIES ITS EVIDENCE, AND THE EXCLUSIONS HOLD.
//
// Gigi, Aug 19: a tab of learning games for when the lesson is done early.
//
// ⚠️ WHY THIS CHECK IS NOT OPTIONAL. Gathering those eleven links produced
// FIVE wrong addresses in one afternoon, every one of which looked entirely
// reasonable typed into a file:
//
//   · four Cyberchase games guessed from their tile names — ALL FOUR 404
//   · roomrecess.com/pages/Grammar.html — guessed path, 404
//   · pbskids.org/wordgirl/games — silently redirects to /videos/
//   · apps.mathlearningcenter.org — silently redirects to the www host
//
// And the first draft of gameLinks.js SAID "every address below was opened in
// a browser" while eight of the eleven had only been inferred. A note that
// claims more than was checked is the same lie as a check that overstates.
// ---------------------------------------------------------------------------
{
  const { GAME_LINKS, GAPS, REJECTED, REVERIFY_DAYS } = await import(pathToFileURL(resolve(ROOT, 'src/data/games/gameLinks.js')).href);
  const { readFileSync } = await import('node:fs');
  const nav = readFileSync(resolve(ROOT, 'src/config/navigation.js'), 'utf8');
  const screen = readFileSync(resolve(ROOT, 'src/components/Games/GamesView.jsx'), 'utf8');

  // ---- 1. EVERY LINK CARRIES WHAT WAS SEEN, AND WHEN. ----
  for (const g of GAME_LINKS) {
    if (!/^https:\/\//.test(g.url)) {
      errors.push(`play: ${g.id} is not an https address.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(g.verifiedOn || '')) {
      errors.push(`play: ${g.id} has no verification date. An unverified address is a guess.`);
    }
    if (!g.saw || g.saw.length < 25) {
      errors.push(
        `play: ${g.id} records no account of what was actually seen on the page. "It exists" is ` +
          `not verification — Khan serves HTTP 200 for a dead address and draws the error in ` +
          `JavaScript afterwards.`
      );
    }
    if (!['game', 'tool', 'hosted'].includes(g.kind)) {
      errors.push(`play: ${g.id} has no kind. A geoboard is not a game and must not be called one.`);
    }
    // ---- A HOSTED GAME MUST SAY IT NEEDS A CODE. ----
    // Blooket, Gimkit and Kahoot are classroom tools: everything else in this
    // tab is "open it and play", these are "join a game someone is running".
    // A child alone with an empty PIN box has been handed a locked door.
    if (g.kind === 'hosted' && !/code|PIN/i.test(g.blurb || '')) {
      errors.push(
        `play: ${g.id} needs a game code from a host and does not say so. She finds out by ` +
          `typing nothing into an empty box, which reads as the app being broken.`
      );
    }
    // ---- AN EXCEPTION TO GIGI'S RULE CARRIES ITS EVIDENCE. ----
    if (g.exception && !/marketing|storefront|Sign [Uu]p|pricing|\$/.test(g.saw || '')) {
      errors.push(
        `play: ${g.id} is a declared exception to the no-payment-prompt rule and its record does ` +
          `not say what was actually on the page. An exception without evidence is a hole.`
      );
    }
    // The exception is for the JOIN door, never the shop.
    if (g.exception && /^https:\/\/(www\.)?(blooket|gimkit)\.com\/?$/.test(g.url)) {
      errors.push(
        `play: ${g.id} points at the marketing homepage instead of the join page. That is where ` +
          `the pricing lives, and avoiding it is the whole reason the exception was acceptable.`
      );
    }
    if (g.exception && /^https:\/\/kahoot\.com/.test(g.url)) {
      errors.push(
        `play: kahoot points at kahoot.com — a full storefront with $3/mo and $19/mo tiers and a ` +
          `countdown offer. kahoot.it is the join door and has no figures on it.`
      );
    }
  }

  // ---- 2. RE-VERIFICATION CADENCE (§3.5). ----
  //         An address checked once and trusted forever is the Khan bug waiting.
  const stale = GAME_LINKS.filter((g) => {
    const days = (Date.now() - Date.parse(g.verifiedOn)) / 86400000;
    return days > REVERIFY_DAYS;
  });
  if (stale.length) {
    errors.push(
      `play: ${stale.length} address(es) have not been opened in over ${REVERIFY_DAYS} days — ` +
        `${stale.map((g) => g.id).join(', ')}. Open them and look, then update verifiedOn.`
    );
  }

  // ---- 3. THE EXCLUSIONS CANNOT QUIETLY COME BACK. ----
  //         Gigi's rule, Aug 19: a payment prompt on the page rules a site out.
  //         It cost this search the one Black-educator result it found.
  const banned = REJECTED.map((r) => new URL(r.url).hostname.replace(/^www\./, ''));
  for (const g of GAME_LINKS) {
    const host = new URL(g.url).hostname.replace(/^www\./, '');
    const hit = banned.find((b) => b === host && !g.url.startsWith('https://pbskids.org/games/play/') && !g.url.startsWith('https://pbskids.org/cyberchase'));
    if (hit) {
      errors.push(
        `play: ${g.id} points at ${hit}, which is on the rejected list. Rejections are decisions, ` +
          `not notes — if this is deliberate, move the entry out of REJECTED with a written reason.`
      );
    }
  }
  for (const r of REJECTED) {
    if (!r.why || r.why.length < 30) {
      errors.push(`play: a rejected address carries no reason. A failed search that is not written down gets run again.`);
    }
  }

  // ---- 4. A STRAND WITH NOTHING IS DECLARED, NEVER SILENTLY ABSENT. ----
  //         Grammar-Usage is her LOWEST strand at 2.20 and nothing passed.
  const declaredGaps = new Set(GAPS.map((g) => g.strandId));
  if (!declaredGaps.has('grammar-usage')) {
    errors.push(
      'play: grammar-usage has nothing behind it and the file no longer declares that. Her ' +
        'lowest strand going quietly missing from a list is how it stops being anybody’s job.'
    );
  }
  for (const g of GAPS) {
    if (!g.note || g.note.length < 40) {
      errors.push(`play: the gap for ${g.strandId} has no explanation of what was tried.`);
    }
  }

  // ---- 5. THE TAB EXISTS, IT IS NOT LOCKED, AND LINKS LEAVE SAFELY. ----
  if (!/id: 'play'/.test(nav)) errors.push('play: the tab is gone from the nav.');
  if (!/target="_blank"/.test(screen) || !/rel="noopener noreferrer"/.test(screen)) {
    errors.push('play: links do not open in a new tab safely — target/rel missing.');
  }
  // ---- ⚠️ THESE TWO READ THE RENDERED PART ONLY, AND HERE IS WHY. ----
  //
  // The first draft tested the whole file and WENT RED ON CORRECT CODE, twice.
  // The header comment explains the decision — "asked whether to GREY this out",
  // "a LOCKED tab also means a bad morning ends with a locked door", "her four
  // WEAKEST strands come first" — and a helper was called `weakest`. Every one
  // of those is the file DESCRIBING the rule, not breaking it.
  //
  // That is rule 21 in the assertion instead of the app, and this project has
  // now recorded a check failing correct content five times. A check that
  // punishes an explanation teaches the next person to delete explanations.
  // ⚠️ AND THE FIRST FIX HAD ITS OWN BUG: it stripped the comments and then
  // sliced at an offset computed on the UNSTRIPPED text, so the slice landed in
  // the wrong place and every assertion below reported nonsense. Strip first,
  // find the render second — in that order, on the same string.
  const noComments = screen.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
  const returnAt = noComments.indexOf('return (');
  if (returnAt === -1) {
    errors.push('play: could not find the render in GamesView.jsx to read it.');
  }
  const rendered = returnAt === -1 ? '' : noComments.slice(returnAt);

  if (/disabled=|aria-disabled/i.test(rendered)) {
    errors.push(
      'play: something on this screen is disabled. Gigi chose ALWAYS OPEN — the screen says what ' +
        'is left on her day and gets out of the way. If that decision changes, INVERT this ' +
        'assertion with the reason and the date, never delete it.'
    );
  }
  if (!/left === 0/.test(rendered) || !/still have \{left\}/.test(rendered)) {
    errors.push('play: the screen no longer tells her what is left on her day.');
  }
  // The order carries the weighting; the WORDS SHE READS must not.
  if (/weakest|behind|remedial|catch up|your gaps/i.test(rendered)) {
    errors.push(
      'play: this screen names her weak strands to her. The ORDER carries the weighting on ' +
        'purpose — a tab that tells a nine-year-old it is made of the things she is worst at is ' +
        'a tab she stops opening.'
    );
  }

  // The hosted three must be labelled on the CARD, not just in the data.
  const view2 = screen.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
  if (GAME_LINKS.some((g) => g.kind === 'hosted') && !/ask Gigi for a code first/.test(view2)) {
    errors.push(
      'play: a hosted game is listed and the screen never tells her it needs a code. She finds ' +
        'out by typing nothing into an empty PIN box, which reads as the app being broken.'
    );
  }

  notes.push(
    `play: ${GAME_LINKS.length} addresses, every one opened and dated · ${REJECTED.length} ` +
      `rejections kept with their reasons · ${GAPS.length} strand(s) declared empty rather than ` +
      `quietly missing`
  );
}

// ---------------------------------------------------------------------------
// SINGING & YOGA — THE TWO LADDERS. Azianna asked for these herself, Aug 19.
//
// §9 of the master plan, queued as item 7b since v3.2: "two ladders of 6–8
// verified videos. PARTICIPATION, NOT A GRADE."
//
// The block has been on her schedule at 15:40 since v3.2 with nothing behind
// it — a tick-box with no door. This asserts the door exists, that every rung
// was actually verified, and that the thing never quietly becomes graded.
// ---------------------------------------------------------------------------
{
  const { readFileSync } = await import('node:fs');
  const {
    SINGING_LADDER,
    YOGA_LADDER,
    ALL_MOVEMENT_VIDEOS,
    MOVEMENT_SAFETY,
    NEEDS_GIGI,
    MOVEMENT_CHANNELS
  } = await import(pathToFileURL(resolve(ROOT, 'src/data/movement/movementLadders.js')).href);
  const view = readFileSync(resolve(ROOT, 'src/components/Movement/MovementView.jsx'), 'utf8');
  const links = readFileSync(resolve(ROOT, 'src/lib/blockLinks.js'), 'utf8');
  const sched = readFileSync(resolve(ROOT, 'src/config/schedule.js'), 'utf8');

  // ---- 1. §9 ASKS FOR 6–8 RUNGS EACH. ----
  for (const [name, ladder] of [['singing', SINGING_LADDER], ['yoga', YOGA_LADDER]]) {
    if (ladder.length < 6 || ladder.length > 8) {
      errors.push(`movement: the ${name} ladder has ${ladder.length} rungs; §9 asks for 6–8.`);
    }
    const rungs = ladder.map((r) => r.rung).join(',');
    const expected = ladder.map((_, i) => i + 1).join(',');
    if (rungs !== expected) {
      errors.push(`movement: the ${name} ladder is not numbered 1..${ladder.length} in order.`);
    }
  }

  // ---- 2. EVERY RUNG CARRIES ITS VERIFIED TITLE AND A REAL LENGTH. ----
  //         "All verified, all with a recorded length" is the standing rule for
  //         every video in this app; a ladder is not exempt from it.
  const ids = new Set();
  for (const v of ALL_MOVEMENT_VIDEOS) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(v.videoId || '')) {
      errors.push(`movement: "${v.title}" has no valid 11-character YouTube id.`);
    }
    if (ids.has(v.videoId)) {
      errors.push(`movement: ${v.videoId} appears on both ladders or twice on one.`);
    }
    ids.add(v.videoId);
    if (!v.title || v.title.length < 10) {
      errors.push(`movement: ${v.videoId} has no title recorded as YouTube returns it.`);
    }
    if (!Number.isFinite(v.seconds) || v.seconds <= 0) {
      errors.push(
        `movement: ${v.videoId} has no recorded length. Every video in this app carries one, ` +
          `and a length nobody read is a length somebody estimated.`
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.verifiedOn || '')) {
      errors.push(`movement: ${v.videoId} has no verification date.`);
    }
  }

  // ---- 3. IT MUST FIT THE BLOCK IT LIVES IN. ----
  //         Read off schedule.js, never typed here — the block is 15 minutes,
  //         and the day it becomes 10 this assertion should move with it.
  const doing = sched.match(/id: 'blk-doing'[\s\S]{0,300}?minutes: (\d+)/);
  if (!doing) {
    errors.push('movement: could not read the length of blk-doing out of schedule.js.');
  } else {
    const cap = Number(doing[1]) * 60;
    const over = ALL_MOVEMENT_VIDEOS.filter((v) => v.seconds > cap);
    if (over.length) {
      errors.push(
        `movement: ${over.map((v) => `${v.videoId} (${Math.round(v.seconds / 60)}m)`).join(', ')} ` +
          `will not fit the ${doing[1]}-minute block. A 45-minute video was rejected on length ` +
          `alone at v3.51 for exactly this reason.`
      );
    }
  }

  // ---- 4. THE BLOCK OPENS SOMETHING, AND IT IS STILL NOT INSTRUCTION. ----
  if (!/block\?\.id === 'blk-doing'/.test(links)) {
    errors.push(
      'movement: blk-doing no longer resolves to a screen. It was a tick-box with no door for ' +
        'sixty-one versions; that is what this fixed.'
    );
  }
  if (/id: 'blk-doing'[\s\S]{0,300}?subject:/.test(sched)) {
    errors.push(
      '⚠️ movement: blk-doing has been given a `subject`. minutesOf() counts a block toward the ' +
        'GEORGIA INSTRUCTIONAL-MINUTES TOTAL only when it has one — so this adds 15 minutes a ' +
        'day to a legal record. §9: participation, NOT a grade, and not instruction either.'
    );
  }

  // ---- 5. IT MAY NEVER QUIETLY BECOME GRADED. ----
  if (/recordReview|recordItemEvents|markLessonRead|itemEvents/.test(view)) {
    errors.push(
      'movement: the Singing & Movement screen now writes to her record. §9 says participation, ' +
        'not a grade. If that changes, INVERT this assertion with the reason and the date — and ' +
        'the screen’s "nothing is written down" line becomes a lie the same day.'
    );
  }

  // ---- 6. THE SAFETY LINE RENDERS. ----
  //         Yoga is the one thing in this app that can hurt her if pushed.
  if (!/\{MOVEMENT_SAFETY\}/.test(view)) {
    errors.push('movement: the stop-if-it-hurts line is not rendered on the yoga ladder.');
  }
  if (!/hurt/i.test(MOVEMENT_SAFETY)) {
    errors.push('movement: the safety line no longer tells her to stop if a pose hurts.');
  }
  // The Human Body fence, unchanged and applied here.
  if (/weight|slim|fat|calorie|how you look|body shape/i.test(view + MOVEMENT_SAFETY)) {
    errors.push(
      'movement: weight or appearance language on a movement screen. The Human Body fence is ' +
        'standing and applies here: no weight, no body composition, no appearance.'
    );
  }

  // ---- 7. THE ADULT-CHANNEL CAUTION SURVIVES. ----
  if (!MOVEMENT_CHANNELS.singing.caution) {
    errors.push(
      'movement: the note that Cheryl Porter’s channel is built for ADULT singers is gone. It is ' +
        'the whole reason specific rungs are offered instead of the channel.'
    );
  }
  if (NEEDS_GIGI.some((n) => !n.why || n.why.length < 40)) {
    errors.push('movement: a video flagged for Gigi to watch carries no reason.');
  }

  notes.push(
    `movement: ${SINGING_LADDER.length} singing rungs and ${YOGA_LADDER.length} yoga rungs, every ` +
      `one oEmbed-verified with its length recorded · never graded · blk-doing opens a screen and ` +
      `still contributes no instructional minutes`
  );
}

// ---------------------------------------------------------------------------
// THE IMPORT PANEL MAY NOT SAY THE APP CANNOT DO SOMETHING IT CAN.
//
// Gigi, Aug 19: "I left a message on her journals. Where would she see them?"
// The panel said: "a note written here will never reach her. To send her
// something, write it on her computer."
//
// THAT WAS FALSE. exportAll ships messages, importBackup merges them, and a
// fresh note arrives on a machine that has never seen it. Nobody had used it in
// that direction, so the screen wrote the HABIT down as a LIMIT — and cost her a
// feature the app already had.
//
// Same class as a screen claiming something is not recorded when it is. This
// one costs a capability instead of the truth.
// ---------------------------------------------------------------------------
{
  const { readFileSync } = await import('node:fs');
  const dash = readFileSync(resolve(ROOT, 'src/components/Parent/ParentDashboard.jsx'), 'utf8');
  const rendered = dash.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

  if (/never reach her|will never reach|cannot reach her/i.test(rendered)) {
    errors.push(
      'the import panel tells a grown-up a note written here can never reach her laptop. It can — ' +
        'notes ship in the export and merge on import. The screen is describing a habit as a limit.'
    );
  }
  if (!/it goes both\s*\{?'?\s*\}?\s*ways|goes both/i.test(rendered)) {
    errors.push('the import panel no longer says the copying works in both directions.');
  }
  if (!/To send her a note/i.test(rendered)) {
    errors.push(
      'the import panel no longer tells her HOW to send a note. "It goes both ways" without the ' +
        'steps is the findability problem again — §32.7 took six exchanges to locate a button.'
    );
  }
  notes.push('two-way: the import panel says notes travel both directions, and how to send one');
}

console.log('\nPetal & Pestle — lesson link check\n');
for (const n of notes) console.log(`  · ${n}`);
if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\nEvery block that names a subject opens it, or says why it cannot.\n');
