// ---------------------------------------------------------------------------
// CHECK — THE BLOCK OPENS ONE LESSON, AND IT IS THE RIGHT ONE.
//
// Run with: node scripts/check-lesson-gate.mjs
//
// ---- WHY THIS EXISTS ----
//
// Gigi, Aug 25 2026: "I will like it that her today prompt just sends her to
// the lesson she is to complete and she doesn't see the other lessons.
// Sometimes she goes ahead without completing the full lesson."
//
// Until v3.79 every one of the four courses THIS APP TEACHES resolved to
// `{ kind: 'view', view: 'lessons', course }` — the course index. Ninety-six
// Herbalism lessons, four quarter tabs, nothing locked. A nine-year-old handed
// a menu picks from the menu.
//
// ⚠️ AND THE COMMENT ABOVE THE HERBALISM BRANCH HAD CLAIMED THE OPPOSITE SINCE
// v2.0: "the block that says Herbalism opens the lesson she is up to." It did
// not. It opened the index. That sentence was true about the INTENTION and
// false about the code for fifty-nine versions, and nothing ever read it —
// which is the same shape as check-khan-units §6c printing "advance one unit
// per grade" while the writer it described had never written a usable row.
//
// So this check does not read a comment and it does not build a lesson row of
// its own. It calls the functions the app calls, with lists of finished
// lessons, and asks what she is handed.
//
// ---- THE FOUR THINGS IT HOLDS ----
//
//   1. Every lesson lives in exactly one week. WEEKS is the order this app
//      walks, and a lesson missing from it can never be reached — the
//      "correct and unreachable" failure, five times so far. The 13 flat cards
//      (hb-1-01..13) carry no course/quarter/week ON THE LESSON, so walking
//      lesson metadata instead would drop thirteen real Herbalism lessons.
//   2. `nextLessonFor` returns the FIRST UNFINISHED lesson in that order — not
//      the one after the last one she finished. Those two rules agree until she
//      skips, and telling them apart is the entire point of this feature.
//   3. `resolveBlockTarget` hands back ONE lessonId for all four courses, and
//      it is the same one. A block and a screen reading the same fact by two
//      routes is v3.70's rule; here it is a block and a screen reading it by
//      one.
//   4. `lessonIsOpen` lets her back into anything finished, into the one she is
//      up to, and into nothing past it.
//
// ---- AND IT ASSERTS THE PLUMBING, BECAUSE THE LESSON CAN BE COMPUTED AND
//      THEN DROPPED ----
//
// resolveBlockTarget can return a perfect lessonId and TodayView can call
// onNavigate(view, course) and throw it away — the screen then opens the index
// and everything still looks like it works. That is exactly the v3.42 bug, when
// the label knew which day it was and the target did not. Read as text, the
// same way check-khan-units reads its call sites.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// v3.73: Windows rejects a bare path here. pathToFileURL, every time.
const load = (p) => import(pathToFileURL(resolve(ROOT, p)).href);

const { nextLessonFor, courseLessonOrder, lessonIsOpen, courseFinished } =
  await load('src/lib/rotatingBlock.js');
const { resolveBlockTarget } = await load('src/lib/blockLinks.js');
const { WEEKS } = await load('src/config/assessment.js');
const { APP_COURSES } = await load('src/data/lessons/appCourses.js');

const errors = [];
const notes = [];
const fail = (rule, msg) => errors.push(`[${rule}] ${msg}`);

/** Comments stripped, so an assertion cannot be satisfied by prose. v3.62. */
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((line) => {
      const i = line.indexOf('//');
      return i === -1 ? line : line.slice(0, i);
    })
    .join('\n');
}

/** The four courses this app teaches, and the block subject that opens each. */
const COURSES = [
  { courseId: 'herbalism', subject: 'herbalism', blockId: 'blk-herb' },
  { courseId: 'sciencelab', subject: 'science', blockId: 'blk-science' },
  { courseId: 'social', subject: 'social', blockId: 'blk-anything' },
  { courseId: 'humanbody', subject: 'body', blockId: 'blk-anything' }
];

// ---- 1. EVERY LESSON IS IN EXACTLY ONE WEEK -------------------------------
//
// The floor under everything below. If a lesson is not in a week, nothing in
// this feature can ever open it, and the app will look complete while a lesson
// sits unreachable — which has happened five times: the Science Lab course at
// v3.24, the rubrics at v3.38, the read-aloud breakdown at v3.56, the goals
// engine at v3.58 and Singing & Movement at v3.64.
for (const c of APP_COURSES) {
  const weeks = WEEKS[c.id] || [];
  if (!weeks.length) {
    fail('course-has-weeks', `${c.id} has no weeks registered, so no lesson in it can be opened`);
    continue;
  }
  const inWeeks = weeks.flatMap((w) => w.lessons || []);
  const seen = new Set();
  const twice = inWeeks.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
  const ids = c.lessons.map((l) => l.id);
  const missing = ids.filter((id) => !seen.has(id));
  const ghosts = [...seen].filter((id) => !ids.includes(id));

  if (missing.length) {
    fail(
      'every-lesson-in-a-week',
      `${c.id}: ${missing.length} lesson(s) sit in no week and can never be opened — ` +
        `${missing.slice(0, 5).join(', ')}`
    );
  }
  if (ghosts.length) {
    fail(
      'no-week-names-a-missing-lesson',
      `${c.id}: week table names ${ghosts.length} lesson(s) that do not exist — ` +
        `${ghosts.slice(0, 5).join(', ')}`
    );
  }
  if (twice.length) {
    fail(
      'no-lesson-in-two-weeks',
      `${c.id}: ${twice.slice(0, 5).join(', ')} appear(s) in more than one week, so "next" is ambiguous`
    );
  }

  // Order must ascend, or "first unfinished" means nothing.
  const ord = weeks.map((w) => w.quarter * 100 + w.n);
  if (!ord.every((v, i) => i === 0 || v > ord[i - 1])) {
    fail('weeks-ascend', `${c.id}: weeks are not in strictly ascending quarter/week order`);
  }
  if (!missing.length && !ghosts.length && !twice.length) {
    notes.push(`${c.id}: ${ids.length} lessons, ${weeks.length} weeks, every lesson placed exactly once`);
  }
}

// ---- 2. FIRST UNFINISHED, NOT "THE ONE AFTER THE LAST ONE SHE DID" --------
//
// ⚠️ THIS IS THE ASSERTION THE WHOLE FEATURE RESTS ON, and the two rules it
// separates give the SAME answer for every child who never skips. Her record
// holds five lesson reads, so a fixture built from her real data would not tell
// them apart either. The skip is constructed on purpose.
for (const { courseId } of COURSES) {
  const order = courseLessonOrder(courseId);
  if (order.length < 4) {
    fail('course-long-enough-to-test', `${courseId} has ${order.length} lessons; cannot test ordering`);
    continue;
  }

  // Nothing done → the very first lesson.
  const first = nextLessonFor(courseId, []);
  if (!first || first.lessonId !== order[0]) {
    fail(
      'starts-at-the-beginning',
      `${courseId}: with nothing finished the block offers ${first?.lessonId ?? 'nothing'}, ` +
        `expected ${order[0]}`
    );
  }

  // In order → the next one.
  const twoDone = nextLessonFor(courseId, [order[0], order[1]]);
  if (!twoDone || twoDone.lessonId !== order[2]) {
    fail(
      'advances-in-order',
      `${courseId}: after finishing lessons 1 and 2 the block offers ${twoDone?.lessonId ?? 'nothing'}, ` +
        `expected ${order[2]}`
    );
  }

  // ---- THE ONE THAT MATTERS: SHE SKIPPED ----
  // Lessons 1 and 3 finished, 2 abandoned. "The one after her last" would send
  // her to lesson 4 and lesson 2 would never be seen again. "First unfinished"
  // sends her back to 2, which is what Gigi asked for in the sentence that
  // started this: "sometimes she goes ahead without completing the full lesson."
  const skipped = nextLessonFor(courseId, [order[0], order[2]]);
  if (!skipped || skipped.lessonId !== order[1]) {
    fail(
      'an-abandoned-lesson-comes-back',
      `${courseId}: with lessons 1 and 3 finished and 2 abandoned the block offers ` +
        `${skipped?.lessonId ?? 'nothing'}, expected ${order[1]}. A lesson she walked away ` +
        `from must be the next thing she is given, not the thing she never sees again.`
    );
  }

  // Everything done → null, and courseFinished agrees. Two answers to one
  // question that must not disagree.
  const done = nextLessonFor(courseId, order);
  if (done !== null) {
    fail('finished-course-offers-nothing', `${courseId}: every lesson finished but ${done.lessonId} offered`);
  }
  if (!courseFinished(courseId, order)) {
    fail(
      'finished-agrees-with-next',
      `${courseId}: nextLessonFor says the course is finished and courseFinished says it is not`
    );
  }
}
if (!errors.length) notes.push('first unfinished in week order, on all four courses, including after a skip');

// ---- 3. THE BLOCK HANDS BACK ONE LESSON, AND THE SAME ONE -----------------
//
// resolveBlockTarget is asked the way TodayView asks it. Monday is used for the
// rotating block so it lands on Social Studies; Tuesday for The Human Body.
const MONDAY = new Date('2026-08-24T09:00:00');
const TUESDAY = new Date('2026-08-25T09:00:00');

const BLOCK_CASES = [
  { courseId: 'herbalism', block: { id: 'blk-herb', subject: 'herbalism' }, date: MONDAY },
  { courseId: 'sciencelab', block: { id: 'blk-science', subject: 'science' }, date: MONDAY },
  { courseId: 'social', block: { id: 'blk-social', subject: 'social' }, date: MONDAY },
  { courseId: 'humanbody', block: { id: 'blk-social', subject: 'social' }, date: TUESDAY }
];

for (const { courseId, block, date } of BLOCK_CASES) {
  const order = courseLessonOrder(courseId);
  const read = [order[0], order[1]];
  const target = resolveBlockTarget(block, {}, [], read, date);

  if (!target) {
    fail('block-opens-something', `${courseId}: the block resolved to nothing at all`);
    continue;
  }
  if (target.kind !== 'lesson') {
    fail(
      'block-opens-a-lesson-not-an-index',
      `${courseId}: the block returned kind "${target.kind}", expected "lesson". ` +
        `An index is a menu, and a menu is what Gigi asked to remove.`
    );
    continue;
  }
  if (!target.lessonId) {
    fail('target-carries-a-lesson-id', `${courseId}: kind is "lesson" but no lessonId is on it`);
    continue;
  }
  // THE SAME lesson the pure function names. Two routes to one fact.
  const expected = nextLessonFor(courseId, read)?.lessonId;
  if (target.lessonId !== expected) {
    fail(
      'block-and-function-agree',
      `${courseId}: the block opens ${target.lessonId} while nextLessonFor says ${expected}`
    );
  }
  if (target.course !== courseId) {
    fail(
      'target-carries-its-course',
      `${courseId}: the target says course "${target.course}". Without it LessonsView falls back ` +
        `to APP_COURSES[0], which is Herbalism — the v3.42 bug.`
    );
  }
}

// ---- 3b. AND IT READS HER PROGRESS, OR IT IS LESSON ONE FOR EVER ---------
//
// `lessonsRead` is optional in the signature. A caller that omits it gets "she
// has done nothing" — and before v3.79 that cost a wrong WORD on a label. It
// now costs the wrong LESSON, every day, for ever.
{
  const order = courseLessonOrder('herbalism');
  const withProgress = resolveBlockTarget(
    { id: 'blk-herb', subject: 'herbalism' }, {}, [], [order[0], order[1]], MONDAY
  );
  const without = resolveBlockTarget({ id: 'blk-herb', subject: 'herbalism' }, {}, [], null, MONDAY);
  if (withProgress?.lessonId === without?.lessonId) {
    fail(
      'progress-changes-the-answer',
      'resolveBlockTarget returns the same lesson whether or not it is told what she has finished. ' +
        'The lessonsRead argument is not reaching the lesson choice.'
    );
  }
}

// ---- 4. THE WALL: BACK YES, AHEAD NO --------------------------------------
for (const { courseId } of COURSES) {
  const order = courseLessonOrder(courseId);
  const read = [order[0], order[1]];

  if (!lessonIsOpen(order[0], courseId, read)) {
    fail(
      'she-can-always-go-back',
      `${courseId}: ${order[0]} is finished and is not open. Going back over a finished lesson is ` +
        `the behaviour §3.12 most wants to encourage and it must never be blocked.`
    );
  }
  if (!lessonIsOpen(order[2], courseId, read)) {
    fail('the-next-one-is-open', `${courseId}: ${order[2]} is the one she is up to and is not open`);
  }
  if (lessonIsOpen(order[3], courseId, read)) {
    fail(
      'the-road-ahead-is-closed',
      `${courseId}: ${order[3]} is two lessons ahead and is open. That is the skipping Gigi asked ` +
        `to stop.`
    );
  }
  // An abandoned lesson is open — she is being sent back to it.
  const skipRead = [order[0], order[2]];
  if (!lessonIsOpen(order[1], courseId, skipRead)) {
    fail('the-abandoned-one-is-open', `${courseId}: ${order[1]} was abandoned and is not open`);
  }
}

// ---- 5. THE SCREEN ASKS THE SAME FUNCTION --------------------------------
//
// A second implementation of "is this lesson open" in the component would drift
// from this one, and the day they disagree the list greys out a lesson the
// block just sent her into. v3.70's rule, and letterForPercent's.
{
  const VIEW = codeOnly(readFileSync(resolve(ROOT, 'src/components/Lessons/LessonsView.jsx'), 'utf8'));
  if (!VIEW.includes('lessonIsOpen(')) {
    fail(
      'screen-asks-the-shared-rule',
      'LessonsView no longer calls lessonIsOpen. If it is deciding for itself which lessons are ' +
        'open, there are two definitions of the rule and they will drift.'
    );
  }
  // ⚠️ THIS ASSERTION WAS WRONG ON ITS FIRST WRITING AND ITS OWN NEGATIVE TEST
  // SAID SO. It read /disabled=\{!open\}/ — and `aria-disabled={!open}` CONTAINS
  // that string. Deleting the real `disabled` attribute left the aria one
  // behind, the button became clickable again, and this check stayed green.
  //
  // The button would have looked locked to a sighted child and opened anyway.
  // Same family as v3.72, where both guard assertions matched the COMMENTS
  // explaining the thing they were testing: an assertion satisfied by something
  // adjacent to the rule is not protecting the rule. The lookbehind pins it to
  // the real attribute.
  if (!/(?<!aria-)disabled=\{!open\}/.test(VIEW)) {
    fail(
      'locked-lessons-are-really-locked',
      'LessonsView no longer disables the button for a lesson that is not open. Greying it out ' +
        'while leaving it clickable is a wall she can walk through. (aria-disabled alone does ' +
        'not count — it tells a screen reader the button is off and lets the click through.)'
    );
  }
  if (!/onClick=\{\(\) => open && setOpenLesson\(lid\)\}/.test(VIEW)) {
    fail(
      'the-handler-checks-too',
      'LessonsView no longer guards the click handler itself. `disabled` is the only thing ' +
        'standing between her and the lesson, and one attribute is not two guards — v3.76.'
    );
  }
  // v3.63's rule, and it applies to every screen she can read.
  for (const word of ['weakest', 'behind', 'catch up']) {
    if (new RegExp(`>\\s*[^<]*\\b${word}\\b`, 'i').test(VIEW)) {
      fail(
        'no-judgement-words-on-her-screen',
        `LessonsView shows the word "${word}" to her. The order carries the meaning; ` +
          `the words do not appear where she can read them.`
      );
    }
  }
}

// ---- 6. THE PLUMBING, READ AS TEXT ---------------------------------------
//
// The lesson can be computed perfectly and dropped one function later.
{
  const TODAY = codeOnly(readFileSync(resolve(ROOT, 'src/components/Schedule/TodayView.jsx'), 'utf8'));
  if (!/onNavigate\?\.\(\s*target\.view\s*,\s*target\.course\s*,\s*target\.lessonId\s*\)/.test(TODAY)) {
    fail(
      'todayview-passes-the-lesson-on',
      "TodayView does not call onNavigate(target.view, target.course, target.lessonId). The block " +
        'computes the right lesson and the screen then opens the course index — which looks exactly ' +
        'like it worked. This is the v3.42 bug: the label knew the day and the target did not.'
    );
  }

  const APP = codeOnly(readFileSync(resolve(ROOT, 'src/App.jsx'), 'utf8'));
  if (!/navigate\s*=\s*useCallback\(\s*\(\s*next\s*,\s*course\s*=\s*null\s*,\s*lesson\s*=\s*null\s*\)/.test(APP)) {
    fail(
      'navigate-accepts-a-lesson',
      'App.navigate no longer takes a third argument, so a lesson passed by TodayView is discarded ' +
        'between the two.'
    );
  }
  if (!/lessonId=\{viewLesson\}/.test(APP)) {
    fail('app-hands-the-lesson-to-the-screen', 'App does not pass lessonId to LessonsView.');
  }
}

// ---- 7. THE COMMENT THAT WAS WRONG STAYS FIXED ---------------------------
//
// db.js said lessonReads records when she first OPENED a lesson. The code has
// only ever written it on finish. v3.79 builds on the real behaviour, so the
// sentence going back would make the feature look like a bug.
{
  const DB = readFileSync(resolve(ROOT, 'src/db/db.js'), 'utf8');
  if (/keyed by lessonId — when she first opened a lesson/i.test(DB)) {
    fail(
      'lessonreads-is-described-correctly',
      'db.js says lessonReads records when she first OPENED a lesson. markLessonRead is called ' +
        'only from LessonReader.finish(), whose button is disabled until every check question is ' +
        'answered. A document about an app is not the app.'
    );
  }
  const READER = codeOnly(
    readFileSync(resolve(ROOT, 'src/components/Lessons/LessonReader.jsx'), 'utf8')
  );
  if (!/disabled=\{!allChecked\}/.test(READER)) {
    fail(
      'finishing-still-requires-the-check',
      'LessonReader no longer requires every check question before Finish. The moment it does not, ' +
        '"finished" stops meaning finished and this whole feature advances her on a lesson she ' +
        'walked away from.'
    );
  }
}

// ---- report ---------------------------------------------------------------
console.log('\nPetal & Pestle — does the block open one lesson, and the right one?\n');
if (errors.length) {
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(`\n${errors.length} problem${errors.length === 1 ? '' : 's'}.\n`);
  process.exit(1);
}
for (const n of notes) console.log('  · ' + n);
console.log('  · the block hands back one lessonId on all four courses, and TodayView passes it on');
console.log('  · finished lessons stay open · the next one is open · the road ahead is not');
console.log('  · no lesson row in this check was built by hand — the week table is the one the app walks');
console.log('\nOne lesson, and the one she is up to.\n');
process.exit(0);
