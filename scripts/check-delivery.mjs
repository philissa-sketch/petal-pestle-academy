// ---------------------------------------------------------------------------
// Run with: node scripts/check-delivery.mjs
//
// CHECK #25 — A LESSON THAT IS WRITTEN IS A LESSON SHE CAN REACH.
//
// ---- WHY THIS EXISTS ----
//
// At v3.24 The Science Lab shipped its first module: six lessons, sixty bank
// questions, a verified video on each, its own check passing, and a line in the
// build log saying "wired in and checked".
//
// Nothing in the app imported it. Not one file.
//
//   LessonsView.jsx      read herbalismCourse.js
//   assessmentEngine.js  read herbalismCourseBank.js
//   WarmUpCard.jsx       read herbalismQ1Bank.js
//   GradebookPanel.jsx   read herbalismCourseBank.js
//   catchUp.js           read herbalismCourse.js
//   WEEKS                had exactly one key, and it was 'herbalism'
//
// The only mention of the course anywhere in src/components was a microscope
// emoji printed beside its name on the year plan. She could not open a lesson,
// Thursday could not ask her a question about one, her morning warm-up could not
// serve one, and the Gradebook could not have recorded a miss.
//
// TWENTY-FOUR CHECKS WERE GREEN THE WHOLE TIME. check-sciencelab imported the
// data files directly with node and asked whether the DATA was well-formed. It
// never asked whether a SCREEN could reach any of it. That is the ninth time a
// check in this project has claimed more than it tested, and the same shape as
// v3.21: testing the shape of the answer instead of the answer.
//
// This is not a new failure either. v3.3 fixed exactly it — a lesson written,
// delivered and invisible, imported nowhere — and the lesson learned was written
// into the build log as a sentence: "Placed is not shipped." A sentence in a log
// is not a rule. Twenty-one versions later the identical thing happened to a
// whole course. A rule she has to act on is a CHECK, not a note.
//
// ---- WHAT IT ASSERTS ----
//
//  1. Every course with written lessons is in appCourses.js.
//  2. Every course in appCourses.js has weeks registered in WEEKS.
//  3. Every written lesson sits in exactly one week, has bank questions behind
//     it, and can be found by the app-wide lookup. That triple is what "she can
//     reach it" actually means.
//  4. Every screen and lib reads the app-wide door, not a single course's file.
//     Asserted by reading the source as TEXT, because an import can be correct
//     in the data layer while a screen carries on calling the old one.
//  5. WIDENING THE DOOR DID NOT DISTURB HERBALISM. Its question set through
//     appBank.js is identical, by id, to its own course bank — same count, same
//     ids, no duplicates. Gigi's condition for this whole change.
//  6. Every Science Lab module has a bank behind it, so a module cannot be
//     written and left sixty questions short in silence.
//  7. THE VIDEO RENDERS ABOVE THE LESSON PROSE, between the hook question and
//     Part 1. Asserted by the POSITION of rendered elements with all comments
//     stripped — never by searching for the word "video". Reaching a lesson is
//     not the same as reaching it in an order she can read. Added v3.41.
// ---------------------------------------------------------------------------

import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const { APP_COURSES, ALL_LESSONS, lessonById } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/appCourses.js')).href);
const { ALL_BANK_ITEMS, itemsForLesson, BANKS } = await import(pathToFileURL(resolve(ROOT, 'src/data/assessments/appBank.js')).href);
const { HERBALISM_COURSE_BANK } = await import(pathToFileURL(resolve(ROOT, 'src/data/assessments/herbalismCourseBank.js')).href);
const { SCIENCELAB_BANKS } = await import(pathToFileURL(resolve(ROOT, 'src/data/assessments/sciencelabCourseBank.js')).href);
const { SCIENCELAB_MODULES } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/sciencelabCourse.js')).href);
const { WEEKS, allWeeks, weekForLesson, practiceGateResult } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
const { lessonFinishSummary } = await import(pathToFileURL(resolve(ROOT, 'src/lib/lessonFinish.js')).href);
const { APP_COURSES: PLANNED_COURSES } = await import(pathToFileURL(resolve(ROOT, 'src/config/curriculumPlan.js')).href);

const errors = [];
const notes = [];

// ---------------------------------------------------------------------------
// 1. A course with lessons written is a course the app knows about
// ---------------------------------------------------------------------------
{
  const taught = new Set(APP_COURSES.map((c) => c.id));
  for (const c of PLANNED_COURSES) {
    if ((c.lessonsWritten || 0) > 0 && !taught.has(c.id)) {
      errors.push(
        `curriculumPlan says "${c.title}" has ${c.lessonsWritten} lessons written, and it is not in ` +
          `appCourses.js. Nothing can open it. This is the v3.24 failure exactly.`
      );
    }
  }
  for (const c of APP_COURSES) {
    const planned = PLANNED_COURSES.find((x) => x.id === c.id);
    if (!planned) {
      errors.push(`appCourses.js teaches "${c.id}", which curriculumPlan.js has never heard of`);
      continue;
    }
    if (planned.lessonsWritten !== c.lessons.length) {
      errors.push(
        `curriculumPlan says ${planned.lessonsWritten} lessons written for "${c.id}"; the data has ` +
          `${c.lessons.length}. A hand-maintained count that drifts is how "Module 1 is already ` +
          `completed" survived a whole version.`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 2. A course the app teaches has weeks, or it can never produce a test
// ---------------------------------------------------------------------------
for (const c of APP_COURSES) {
  const weeks = WEEKS[c.id];
  if (!Array.isArray(weeks) || weeks.length === 0) {
    errors.push(
      `"${c.id}" has ${c.lessons.length} written lessons and no weeks in WEEKS. A course with no ` +
        `weeks cannot sit a Thursday test, cannot interleave, and cannot open a quarter exam.`
    );
    continue;
  }
  const wrong = weeks.filter((w) => w.course !== c.id);
  if (wrong.length) {
    errors.push(`WEEKS.${c.id} contains ${wrong.length} week(s) whose course field says otherwise`);
  }
}

// ---------------------------------------------------------------------------
// 3. THE REACHABILITY TRIPLE — the assertion this check exists for
// ---------------------------------------------------------------------------
{
  let unreachable = 0;
  for (const l of ALL_LESSONS) {
    const inWeek = weekForLesson(l.id);
    const questions = itemsForLesson(l.id);
    const findable = lessonById(l.id);
    if (!findable) errors.push(`${l.id}: the app-wide lesson lookup cannot find it`);
    if (!inWeek) {
      unreachable += 1;
      errors.push(
        `${l.id} "${l.title}": written, and in no week. She cannot be tested on it and Friday ` +
          `cannot offer it. Written is not the same as reachable.`
      );
    }
    if (!questions.length) {
      unreachable += 1;
      errors.push(
        `${l.id} "${l.title}": no bank questions reach it through appBank.js. Its weekly test, its ` +
          `warm-up and its practice gate all have nothing to serve.`
      );
    }
  }
  const twice = ALL_LESSONS.filter((l) => allWeeks().filter((w) => w.lessons.includes(l.id)).length > 1);
  if (twice.length) errors.push(`${twice.length} lesson(s) sit in more than one week: ${twice.map((l) => l.id).join(', ')}`);
  if (!unreachable) notes.push(`all ${ALL_LESSONS.length} written lessons are in a week and have questions behind them`);
}

// ---------------------------------------------------------------------------
// 4. EVERY SCREEN READS THE APP-WIDE DOOR — read as text, not imported
// ---------------------------------------------------------------------------
{
  // A file named after ONE course standing in for the whole app is the bug.
  const SINGLE_COURSE_BANKS = /from ['"][^'"]*\/(herbalismQ1Bank|herbalismCourseBank|sciencelabM1Bank|sciencelabCourseBank)\.js['"]/;
  const SINGLE_COURSE_LESSONS = /from ['"][^'"]*\/(herbalismCourse|sciencelabCourse)\.js['"]/;
  // The index files are allowed to read the course files — that is their job.
  const ALLOWED = new Set([
    'src/data/assessments/appBank.js',
    'src/data/assessments/herbalismCourseBank.js',
    'src/data/assessments/sciencelabCourseBank.js',
    'src/data/lessons/appCourses.js'
  ]);

  function walk(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
      const full = resolve(dir, name);
      if (statSync(full).isDirectory()) out.push(...walk(full));
      else if (/\.(js|jsx)$/.test(name)) out.push(full);
    }
    return out;
  }

  const files = [
    ...walk(resolve(ROOT, 'src/components')),
    ...walk(resolve(ROOT, 'src/lib')),
    ...walk(resolve(ROOT, 'src/store')),
    ...walk(resolve(ROOT, 'src/data'))
  ];

  let offenders = 0;
  for (const full of files) {
    const rel = relative(ROOT, full).split('\\').join('/');
    if (ALLOWED.has(rel)) continue;
    const src = readFileSync(full, 'utf8');
    // Only the lines that are imports; a mention in a comment is a mention.
    const importLines = src.split('\n').filter((l) => /^\s*import\s/.test(l) || /^\}\s*from\s/.test(l));
    const joined = importLines.join('\n');
    if (SINGLE_COURSE_BANKS.test(joined)) {
      offenders += 1;
      errors.push(
        `${rel} imports a SINGLE COURSE's question bank. Every consumer must read ` +
          `src/data/assessments/appBank.js — a file named after one course standing in for the app ` +
          `is why sixty written Science Lab questions could never appear in a test.`
      );
    }
    if (SINGLE_COURSE_LESSONS.test(joined)) {
      offenders += 1;
      errors.push(
        `${rel} imports a SINGLE COURSE's lesson index. Every consumer must read ` +
          `src/data/lessons/appCourses.js, or the next course added is invisible in exactly the ` +
          `same way this one was.`
      );
    }
  }
  if (!offenders) notes.push(`${files.length} source files read the app-wide door, not a single course's file`);
}

// ---------------------------------------------------------------------------
// 5. HERBALISM IS UNDISTURBED — Gigi's condition for widening the door
// ---------------------------------------------------------------------------
{
  const throughDoor = ALL_BANK_ITEMS.filter((q) => String(q.lesson).startsWith('hb-')).map((q) => q.id);
  const own = HERBALISM_COURSE_BANK.map((q) => q.id);
  if (throughDoor.length !== own.length) {
    errors.push(
      `Herbalism has ${own.length} questions in its own bank and ${throughDoor.length} through ` +
        `appBank.js. Widening the door was allowed on the condition that Herbalism did not move.`
    );
  }
  const ownSet = new Set(own);
  const missing = own.filter((id) => !throughDoor.includes(id));
  const extra = throughDoor.filter((id) => !ownSet.has(id));
  if (missing.length) errors.push(`appBank.js drops ${missing.length} Herbalism question(s): ${missing.slice(0, 5).join(', ')}`);
  if (extra.length) errors.push(`appBank.js invents ${extra.length} Herbalism question(s): ${extra.slice(0, 5).join(', ')}`);
  if (new Set(ALL_BANK_ITEMS.map((q) => q.id)).size !== ALL_BANK_ITEMS.length) {
    errors.push('two questions share an id across the app — a merged bank must not double-count');
  }
  if (!missing.length && !extra.length) {
    notes.push(`Herbalism: ${own.length} questions, identical by id through the app-wide door`);
  }
}

// ---------------------------------------------------------------------------
// 6. EVERY SCIENCE LAB MODULE HAS A BANK
// ---------------------------------------------------------------------------
{
  for (const m of SCIENCELAB_MODULES) {
    const key = `sciencelab-m${m.n}`;
    const bank = SCIENCELAB_BANKS[key];
    if (!Array.isArray(bank) || !bank.length) {
      errors.push(
        `Module ${m.n} "${m.title}" is written and has no bank at "${key}" in ` +
          `sciencelabCourseBank.js. Adding a module without adding it there leaves its questions ` +
          `out of every test AND out of the answer-spread rule.`
      );
      continue;
    }
    const wrong = bank.filter((q) => !m.lessons.includes(q.lesson));
    if (wrong.length) errors.push(`${key} holds ${wrong.length} question(s) belonging to another module`);
    const uncovered = m.lessons.filter((id) => !bank.some((q) => q.lesson === id));
    if (uncovered.length) errors.push(`${key} has no questions for ${uncovered.join(', ')}`);
  }
  if (Object.keys(BANKS).length < Object.keys(SCIENCELAB_BANKS).length) {
    errors.push('the app-wide BANKS map is missing Science Lab modules');
  }
}

// ---------------------------------------------------------------------------
// 7. NO RAW COURSE ID EVER REACHES HER SCREEN
// ---------------------------------------------------------------------------
//
// The quarter exam titled itself "sciencelab, Quarter 1" the first time a second
// course could sit one, because the label lookup was a ternary with one course
// hard-coded into it and the course id as the fallback. Small, and exactly the
// kind of thing that ships: it only appears on a paper that could not be opened
// until the whole quarter was built.
{
  const { buildQuarterTest } = await import(pathToFileURL(resolve(ROOT, 'src/lib/assessmentEngine.js')).href);
  for (const c of APP_COURSES) {
    for (const q of c.quarters) {
      const form = buildQuarterTest(`${c.id}-q${q}`, { attempt: 1 });
      if (!form) continue;
      if (form.title.includes(c.id)) {
        errors.push(
          `the ${c.id} Quarter ${q} exam is titled "${form.title}" — that is the course's ID on a ` +
            `nine-year-old's screen, not its name.`
        );
      }
      if (!form.title.includes(c.label)) {
        errors.push(`the ${c.id} Quarter ${q} exam title does not name the course: "${form.title}"`);
      }
    }
  }
  if (!errors.length) notes.push('every quarter exam names its course, not its id');
}

// ---------------------------------------------------------------------------
// 8. A QUARTER EXAM WAITS FOR THE QUARTER TO BE BUILT, NOT JUST SAT
// ---------------------------------------------------------------------------
//
// quarterTestReady used to ask only "has she sat every REGISTERED week?". That
// is the same sentence as "every week of the quarter" for a finished course and
// a different one for a course being built: The Science Lab had two of its eight
// Quarter 1 weeks written, so its quarter exam would have unlocked after two
// weekly tests and called twenty-four questions drawn from six lessons a
// quarter exam.
//
// The first attempt to negative-test that fix could not fail it, because every
// registered quarter happened to be complete — built and planned were the same
// number, so putting the bug back changed nothing. This assertion tests the
// RULE instead of the current data: `planned` must come from the quarter shape,
// not from however many weeks happen to exist. The Science Lab's Quarter 3 has
// no weeks registered at all, so it distinguishes the two immediately.
{
  const { quarterTestReady } = await import(pathToFileURL(resolve(ROOT, 'src/lib/assessmentEngine.js')).href);
  const { QUARTER } = await import(pathToFileURL(resolve(ROOT, 'src/config/curriculumPlan.js')).href);
  for (const c of APP_COURSES) {
    for (const q of c.quarters) {
      const r = quarterTestReady(`${c.id}-q${q}`, {});
      if (r.planned !== QUARTER.teachingWeeks) {
        errors.push(
          `${c.id} Quarter ${q}: the exam thinks the quarter is ${r.planned} weeks long, but a quarter ` +
            `is ${QUARTER.teachingWeeks} teaching weeks. Reading that number off however many weeks ` +
            `exist is what let a two-week quarter open its own exam.`
        );
      }
      const built = (WEEKS[c.id] || []).filter((w) => w.quarter === q).length;
      if (built < QUARTER.teachingWeeks && r.ready) {
        errors.push(
          `${c.id} Quarter ${q} exam is offered with only ${built} of ${QUARTER.teachingWeeks} weeks built`
        );
      }
    }
  }
  if (!errors.length) {
    notes.push(`every quarter exam waits for all ${QUARTER.teachingWeeks} of its weeks to be written`);
  }
}

// ---------------------------------------------------------------------------
// 7. THE VIDEO RENDERS ABOVE THE PROSE — added v3.41
//
// Gigi's reason, and it is a reading-level reason rather than a layout one:
// her Reading 3.46 is a LISTENING score. Ten of her thirteen reading questions
// were read aloud, so her independent reading sits below it, and she pressed
// read-aloud on 36 of 61 Check-In questions. With the video underneath the
// beats she read her way toward the thing meant to explain the lesson.
//
// WHAT WENT WRONG BEFORE, AND WHY THIS IS NOT A WORD SEARCH.
//
// The comment above the video block used to say "Sits INSIDE the System
// Concept step". It did not — it rendered after Part 1, Part 2 and both
// Apply-Its. That wrong sentence was then repeated into the master plan and
// read back as fact for several versions. A comment nothing tests is a comment
// that goes stale, which is the v3.38 failure exactly.
//
// And at v3.40 a check stayed green while the rubric was deleted from her
// screen, because the panel's own sentence "Read the rubric first" still
// contained the word "rubric". So this assertion must not look for the word
// "video" anywhere. It compares the POSITION OF RENDERED ELEMENTS:
//
//   · every block comment is stripped first, so no comment can satisfy or
//     break the assertion — the v3.38 hole, closed by construction
//   · the video is located by its <iframe>, the actual rendered element
//   · the prose is located by the beats/core ternary that opens it
//   · the hook question is located by the expression that prints it
//
// Then: hookQuestion < iframe < prose-ternary.
//
// The upper bound is what catches the bug being put back. Dropping the video
// inside Part 1 puts the iframe AFTER the ternary opens, and it fails — even
// though inside Part 1 the iframe would still sit above {b.teachingText},
// which is why this compares against the ternary and not against the first
// paragraph. An assertion that only said "above some prose" would have passed
// the reintroduced bug.
// ---------------------------------------------------------------------------
{
  const rel = 'src/components/Lessons/LessonReader.jsx';
  const raw = readFileSync(resolve(ROOT, rel), 'utf8');

  // Strip block comments — this removes {/* ... */} JSX comments and /* ... */
  // alike. Nothing a comment says can move these numbers.
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, '');

  // Measure only INSIDE the component that renders. The file opens with
  // lessonChunks(), the read-aloud helper, and its very first line is
  //   const out = [lesson.title, lesson.hook.text, lesson.hook.question];
  //
  // The first draft of this assertion searched the whole file, so the hook
  // question resolved to that line — above every JSX element — and the
  // "video must not float above the hook" branch could never fire. Its
  // negative test caught it: floating the video to the top of the page passed
  // silently. That is v3.39's rule again, from the other side — a mutation
  // that lands in the wrong function is not a test of anything, and neither is
  // an assertion that reads the wrong function.
  const bodyStart = src.indexOf('export function LessonReader');
  if (bodyStart < 0) {
    errors.push(
      `${rel}: cannot find the LessonReader component. The video-position assertion measures ` +
        `positions inside the component that renders, never across the whole file.`
    );
  }
  const at = (needle) => (bodyStart < 0 ? -1 : src.indexOf(needle, bodyStart));

  const iframeIdx = at('<iframe');
  const proseIdx = at('lesson.beats?.length');
  const hookIdx = at('lesson.hook.question');

  const missing = [];
  if (iframeIdx < 0) missing.push('the video <iframe>');
  if (proseIdx < 0) missing.push('the beats/core ternary');
  if (hookIdx < 0) missing.push('the hook question');

  if (missing.length) {
    errors.push(
      `${rel}: cannot locate ${missing.join(', ')} outside of comments. This assertion ` +
        `is about where the video renders relative to the lesson prose; if the shape of ` +
        `the component changed, the assertion must be rewritten, not deleted.`
    );
  } else {
    const iframes = (src.match(/<iframe/g) || []).length;
    if (iframes !== 1) {
      errors.push(
        `${rel} renders ${iframes} iframes. The video position is asserted against a single ` +
          `rendered element; two of them means this check no longer knows which one she sees.`
      );
    }
    if (iframeIdx > proseIdx) {
      errors.push(
        `${rel}: THE VIDEO RENDERS BELOW THE LESSON PROSE. It must sit above the beats/core ` +
          `block, between the hook question and Part 1. Her independent reading is below her ` +
          `3.46 LISTENING score and she pressed read-aloud on 36 of 61 Check-In questions — ` +
          `putting the video under the prose makes her read her way toward the thing meant to ` +
          `explain the lesson. This also fails if the video was moved INSIDE Part 1.`
      );
    }
    if (iframeIdx < hookIdx) {
      errors.push(
        `${rel}: the video renders ABOVE the hook question. The question is the reason to ` +
          `watch — she should meet it first and watch with it already in her head. Order is ` +
          `header, read-aloud, hook, question, video, Part 1.`
      );
    }
    if (iframeIdx > hookIdx && iframeIdx < proseIdx && iframes === 1) {
      const withVideo = ALL_LESSONS.filter((l) => l.video?.id).length;
      notes.push(
        `the video renders between the hook question and the lesson prose, for all ` +
          `${withVideo} of ${ALL_LESSONS.length} lessons that carry one — asserted by element ` +
          `position with comments stripped, not by looking for the word "video"`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 8. WHAT SHE HEARS IS WHAT THE SCREEN SHOWS — added v3.43
//
// ---- THE BUG ----
//
// lessonChunks(), which builds the "Read the lesson to me" script, read
// `lesson.core` and then `lesson.beats`, unconditionally. The component renders
// beats OR the flat cards, never both — and 179 of the 192 lessons carry BOTH
// fields holding the SAME CONTENT. hb-m1-01's core headings are "What a seed is
// made of" and "How a seed wakes up"; its beat labels are those same two
// strings.
//
// So read-aloud said the whole lesson, then "Go and do this.", then the whole
// lesson again. For a child whose Reading 3.46 is a LISTENING score and who
// pressed read-aloud on 36 of 61 Check-In questions, that is not cosmetic —
// it is the main channel she takes a lesson in, doubled and out of order.
//
// ---- WHY TWENTY-SIX CHECKS MISSED IT ----
//
// Every one of them asks about the SCREEN. The read-aloud is a SECOND rendering
// of the same lesson through a different function, and nothing had ever
// compared the two. A rule enforced on what is displayed and not on what is
// spoken is half a rule — v3.34's lesson, where the paper the child was handed
// was the thing nobody checked. Here the paper was the sound.
//
// ---- WHAT IS ASSERTED ----
//
// Structurally, on the source, comments stripped — not by counting words, which
// would be a check on the content rather than the rule:
//
//   1. lessonChunks branches on `beats` the same way the component does, so it
//      cannot read both.
//   2. It does not push core and beats unconditionally one after the other,
//      which is the exact shape of the bug.
//   3. It mentions the video, which sits between the question and Part 1 on
//      screen since v3.41 — a listener should not get silence where the main
//      event is.
// ---------------------------------------------------------------------------
{
  const rel = 'src/components/Lessons/LessonReader.jsx';
  const raw = readFileSync(resolve(ROOT, rel), 'utf8');
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, '');

  const start = src.indexOf('function lessonChunks');
  if (start < 0) {
    errors.push(
      `${rel}: cannot find lessonChunks. The read-aloud script is built there; if it moved, this ` +
        `assertion must be rewritten, not dropped — what she HEARS is a second rendering of the ` +
        `lesson and nothing else checks it.`
    );
  } else {
    // The function body, by matching braces — not by reading to the next blank
    // line, which is how a v3.39 assertion ended up reading to end of file.
    let depth = 0;
    let end = start;
    for (let i = src.indexOf('{', start); i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    const body = src.slice(start, end + 1);

    const readsBeats = body.includes('lesson.beats');
    const readsCore = body.includes('lesson.core');
    const branches = /lesson\.beats\?\.length\s*>\s*0/.test(body);

    if (readsBeats && readsCore && !branches) {
      errors.push(
        `${rel}: lessonChunks reads BOTH lesson.core and lesson.beats without branching between ` +
          `them. 179 of ${ALL_LESSONS.length} lessons carry both fields with the same content, so ` +
          `read-aloud would say the entire lesson twice. The screen renders one or the other; what ` +
          `she hears must match what it shows.`
      );
    }
    if (!readsBeats) {
      errors.push(`${rel}: lessonChunks never reads lesson.beats — 179 lessons would be read aloud as empty`);
    }
    // ⚠️ THIS TESTED FOR `lesson.video` AND WAS SATISFIED BY THE GUARD.
    // Deleting the line that actually SPEAKS the video left
    // `if (lesson.video?.id) {` in place, so the assertion stayed green while
    // the listener got silence. Found by its own negative test. It asserts the
    // TITLE is pushed now — the thing she hears, not the thing that was checked
    // before speaking it. A name is not a call; a guard is not an utterance.
    if (!/out\.push\([^)]*lesson\.video\.title/.test(body)) {
      errors.push(
        `${rel}: lessonChunks never speaks the video's title. Since v3.41 the video renders between ` +
          `the hook question and Part 1, so a child listening with her eyes shut gets silence where ` +
          `the thing that teaches the lesson is.`
      );
    }

    // And the data really does duplicate, which is WHY the branch matters. If
    // this ever stops being true the assertion above is guarding nothing, and
    // saying so is better than quietly passing.
    const both = ALL_LESSONS.filter((l) => l.beats?.length > 0 && l.core?.length > 0);
    const dup = both.filter((l) =>
      l.beats.every((b, i) => l.core[i] && String(b.label) === String(l.core[i].heading))
    );
    if (!dup.length && both.length) {
      notes.push(
        `⚠️ no lesson duplicates its beats in core any more — assertion 8's branch still holds the ` +
          `rule, but the failure it was written for can no longer occur`
      );
    } else {
      notes.push(
        `read-aloud follows the screen: one branch, not both — ${dup.length} lessons carry the same ` +
          `content in core and beats and would otherwise be spoken twice`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 9. WHAT COMES BACK TO HER WHEN SHE FINISHES — added v3.56
//
// ---- THE HOLE, ON A REAL LESSON, ON A REAL DAY ----
//
// The finish screen printed ONE message and printed it identically whatever
// happened: "🌿 Lesson finished". Three of three and one of three got the same
// sentence. On sl-m2-01, Aug 17, she answered two of the three wrong and the
// app said nothing about it and moved her on.
//
// Worse underneath: the button was never disabled, and practiceGateResult([])
// returns asked: 0, passed: TRUE. A lesson finished without a single answer was
// WRITTEN DOWN AS PASSED, into a row that feeds the Gradebook, the backup and
// the Georgia record.
//
// Gigi, Aug 18: "I will like Azianna to see her grades so she can see what she
// is doing well in and what she needs to work harder on." And then, on whether
// a weekly card would do it: "Should it be only weekly for a child that is
// behind in her levels?" No. The week is for the step back. THIS is the moment
// that closes a gap.
//
// ---- THE GENERAL RULE, WHICH IS THE VALUABLE PART ----
//
// The Quick check told her "Nothing is written down. This is just for you."
// while markLessonRead wrote asked, correct and passed on every finish.
//
// A SCREEN MAY NOT TELL A CHILD SOMETHING IS NOT RECORDED WHEN IT IS. That is
// the same family as a stale comment and an overstating check, except the
// person it misleads is nine. Asserted below by reading the screen as TEXT
// against what the store actually writes.
// ---------------------------------------------------------------------------
{
  const rel = 'src/components/Lessons/LessonReader.jsx';
  const src = readFileSync(resolve(ROOT, rel), 'utf8');
  // Comments explain the fix and quote the old wording. Strip them, or this
  // check reads its own explanation and passes on it — the v3.40 failure, where
  // an assertion was kept green by a comment marker.
  const body = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  const store = readFileSync(resolve(ROOT, 'src/store/useAppStore.js'), 'utf8');

  // ---- 9a. The record is only written from answers she actually gave. ----
  if (!/disabled=\{!allChecked\}/.test(body)) {
    errors.push(
      `${rel}: the finish button is not gated on allChecked. practiceGateResult([]) returns ` +
        `passed: true, so a lesson finished with nothing answered is written down as PASSED — a row ` +
        `in a Georgia record claiming more than it tested.`
    );
  }

  // ---- 9b. WHAT SHE IS TOLD — RUN, NOT GREPPED. ----
  //
  // ⚠️ THE FIRST VERSION OF THIS BLOCK WAS WORTH NOTHING, AND ITS OWN NEGATIVE
  // TESTS SAID SO. It looked for the string `gate.correct === gate.asked` in the
  // component. Delete the branch that tells three-of-three from one-of-three and
  // the check stayed GREEN, because that same string appeared two lines further
  // down in a different expression. Two of six mutations passed.
  //
  // So the decision moved into src/lib/lessonFinish.js — a pure function — and
  // this calls it on a REAL lesson with made-up answers and asserts what a child
  // would actually read. A rule the app must follow lives where a check can CALL
  // it. Grepping a component for a substring is not calling it.
  const sample = ALL_LESSONS.find((l) => (l.check || []).length === 3);
  if (!sample) {
    errors.push('no lesson with three check questions to test the finish summary against');
  } else {
    const right = sample.check.map((c) => c.answer);
    const wrong = sample.check.map((c) => (c.answer === 0 ? 1 : 0));
    const at = (n) => Object.fromEntries(sample.check.map((c, i) => [i, i < n ? right[i] : wrong[i]]));

    const all3 = lessonFinishSummary(sample, at(3));
    const two = lessonFinishSummary(sample, at(2));
    const one = lessonFinishSummary(sample, at(1));
    const none = lessonFinishSummary(sample, at(0));

    // Four outcomes, four different things said. This is the whole fix.
    const headlines = [all3.headline, two.headline, one.headline, none.headline];
    if (new Set(headlines).size !== 4) {
      errors.push(
        `the finish screen says the same thing for different outcomes: ${JSON.stringify(headlines)}. ` +
          `That is the screen that told her "Lesson finished" after she got one of three.`
      );
    }
    const closings = new Set([all3.closing, two.closing, one.closing]);
    if (closings.size < 3) {
      errors.push(
        'all-right, a near miss and a hard miss do not get three different closing lines. A child ' +
          'who is behind needs to know which of the three just happened.'
      );
    }

    // The numbers in the words must be the real numbers.
    if (!all3.headline.includes('3') || !two.headline.includes('2') || !one.headline.includes('1')) {
      errors.push(`the finish headline does not carry her real score: ${JSON.stringify(headlines)}`);
    }

    // She gets the MISSED QUESTION back, with the right answer — not a count.
    for (const [label, s, expect] of [['all right', all3, 0], ['one wrong', two, 1], ['two wrong', one, 2], ['all wrong', none, 3]]) {
      if (s.missed.length !== expect) {
        errors.push(`finish summary, ${label}: ${s.missed.length} questions offered back, expected ${expect}`);
      }
      for (const m of s.missed) {
        if (!m.prompt || !m.answerText) {
          errors.push(
            `finish summary, ${label}: a missed question comes back without its ` +
              `${!m.prompt ? 'question text' : 'right answer'}. A summary that says only how many ` +
              `she got is a score, and a score is not something a nine-year-old can act on.`
          );
        }
      }
    }

    // No praise over a miss. §3.7.2 rule 2 — warm tone must never soften an
    // honest score, and a child works out fast that praise arriving whatever she
    // does is not about her.
    const PRAISE = /\b(great|brilliant|amazing|perfect|well done|fantastic|excellent|superstar)\b/i;
    for (const [label, s] of [['a near miss', two], ['a hard miss', one], ['all wrong', none]]) {
      if (PRAISE.test(`${s.headline} ${s.closing}`)) {
        errors.push(`the finish screen praises ${label}: "${s.headline} ${s.closing}"`);
      }
    }

    // SCREEN AND SOUND ARE ONE THING. v3.43 was two functions describing the
    // same lesson, drifting apart until she heard it twice.
    for (const [label, s] of [['all right', all3], ['one wrong', two], ['two wrong', one]]) {
      const spoken = s.chunks.join(' | ');
      if (!spoken.includes(s.headline) || !spoken.includes(s.closing)) {
        errors.push(`finish summary, ${label}: what she hears is missing the headline or the closing line`);
      }
      for (const m of s.missed) {
        if (!spoken.includes(m.prompt) || !spoken.includes(m.answerText)) {
          errors.push(
            `finish summary, ${label}: the missed question is on screen and not in the read-aloud. ` +
              `Her Reading 3.46 is a LISTENING score.`
          );
        }
      }
    }

    // The gate and the words must agree about what "a miss" is.
    const gateTwo = practiceGateResult(sample.check.map((c, i) => ({ correct: at(2)[i] === c.answer })));
    if (gateTwo.passed !== two.nearMiss) {
      errors.push(
        `the practice gate and the finish screen disagree: the gate says passed=${gateTwo.passed} ` +
          `and the screen treats it as ${two.nearMiss ? 'a near miss' : 'a hard miss'}.`
      );
    }

    notes.push(
      `the finish screen says four different things for four outcomes, hands back ${one.missed.length} ` +
        `missed questions with their answers after two wrong, and reads all of it aloud`
    );
  }

  // ---- 9c. The component must actually USE the tested function. ----
  if (!/function FinishSummary/.test(body) || !/lessonFinishSummary\(/.test(body)) {
    errors.push(
      `${rel}: the finish screen no longer renders from lessonFinishSummary(). Everything asserted ` +
        `above is then true of a function nothing calls.`
    );
  }
  if (!/speakChunks\(\s*s\.chunks/.test(body)) {
    errors.push(`${rel}: the finish screen does not speak the chunks it was given.`);
  }

  // ---- 9d. NO SCREEN MAY CLAIM A RESULT IS UNRECORDED WHEN IT IS. ----
  //
  // ⚠️ THIS ONE ALSO FAILED ITS OWN NEGATIVE TEST FIRST, AND FAILED IT SILENTLY.
  // It gated on /markLessonRead\(...passed:/ in the store — and the store never
  // contains that. markLessonRead takes `practice` as a parameter and the caller
  // builds it. So the whole assertion was SKIPPED, the false sentence was put
  // back, and the check stayed green. An assertion behind a condition that is
  // never true is not a passing check; it is an absent one.
  //
  // It now gates on what actually proves the result is kept AND used:
  // shakyLessons() reads practice.passed to tell Gigi what to go over.
  const writesResult = /shakyLessons\(\)[\s\S]{0,400}?practice\.passed/.test(store);

  // ⚠️ AND IT IS ASSERTED PER PANEL, NOT PER FILE.
  //
  // Gigi found the second instance from a screenshot: the practice gate said
  // "it is not a score" three inches below the line that had just been
  // corrected to say the opposite. The obvious fix — add "not a score" and
  // "not scored" to the phrase list — WOULD HAVE FAILED CORRECT CONTENT.
  //
  // The Try It Now panel (ApplyIt) says "This one is not scored" and IT IS
  // TELLING THE TRUTH: it holds the pick in local state and writes nothing
  // anywhere. A file-wide phrase ban fails that honest sentence, and this
  // project has already learned three times over what happens then — v3.43,
  // v3.44 and v3.53 — "a check that fails correct content teaches whoever hits
  // it to reach for the check instead of the content."
  //
  // So the rule is scoped to the panel that makes the claim:
  //   a panel that writes nothing MAY say so;
  //   a panel whose result is recorded MAY NOT.
  const CLAIMS_UNRECORDED =
    /nothing is written down|not written down|nothing is recorded|not recorded anywhere|no one sees this|nobody sees this|(is )?not a score|not scored|does not count/i;

  // ApplyIt's claim is only true while ApplyIt stays inert. If anyone ever
  // wires a store write into it, the sentence becomes a lie on the same day.
  const applyIt = body.slice(body.indexOf('function ApplyIt'));
  const applyItBody = applyIt.slice(0, applyIt.indexOf('\n}') + 2);
  if (!applyItBody) {
    errors.push(`${rel}: ApplyIt is gone — the Try It Now panel inside each beat`);
  } else if (
    CLAIMS_UNRECORDED.test(applyItBody) &&
    /useAppStore|recordReview|markLessonRead|putLessonRead/.test(applyItBody)
  ) {
    errors.push(
      `${rel}: the Try It Now panel says its question is not scored AND now writes to the store. ` +
        `That sentence was true for as long as the panel kept her pick in local state and threw it ` +
        `away. It is not true any more.`
    );
  }

  // Everything OUTSIDE ApplyIt is the recorded half of this screen: the Quick
  // check and the practice gate both sit on a result markLessonRead keeps.
  const recordedPanels = body.replace(applyItBody, ' ');
  if (writesResult && CLAIMS_UNRECORDED.test(recordedPanels)) {
    const hit = recordedPanels.match(CLAIMS_UNRECORDED);
    errors.push(
      `${rel}: a panel on the recorded half of this screen says "${hit[0]}". markLessonRead writes ` +
        `asked, correct and passed on every finish — into her backup, the Gradebook, and ` +
        `shakyLessons(), which is what tells Gigi which lessons to go over. Low stakes is the right ` +
        `FEELING and it can be said truthfully. Telling a nine-year-old her answers are not kept, ` +
        `and keeping them, is not a wording problem.`
    );
  }
  if (!writesResult) {
    errors.push(
      'shakyLessons() no longer reads practice.passed, so this check cannot tell whether the lesson ' +
        'check is recorded — and it would sit here reporting nothing rather than green. That is the ' +
        'v3.56 failure: an assertion behind a condition that is never true is an absent one.'
    );
  } else {
    notes.push(
      'honesty, per panel: Try It Now writes nothing and may say so; the Quick check and the ' +
        'practice gate are recorded and no longer claim otherwise'
    );
  }

  // ---- 9d. The unreachable branch stays honestly unreachable. ----
  //          FinishSummary carries an `asked === 0` fallback and calls it
  //          defensive. That is only true while every lesson has check
  //          questions — otherwise it is a live branch nobody has looked at.
  const noCheck = ALL_LESSONS.filter((l) => !(l.check || []).length);
  if (noCheck.length) {
    errors.push(
      `${noCheck.length} lessons carry no check questions (${noCheck.slice(0, 3).map((l) => l.id).join(', ')}). ` +
        `FinishSummary's asked === 0 branch documents itself as unreachable, and these lessons reach it.`
    );
  } else {
    notes.push(
      `all ${ALL_LESSONS.length} lessons carry check questions, so the finish button always gates and ` +
        `FinishSummary's defensive branch stays unreachable`
    );
  }
}

// ---------------------------------------------------------------------------

console.log('\nPetal & Pestle — delivery: is a written lesson a lesson she can reach?\n');
if (errors.length) {
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(`\n${errors.length} problem${errors.length === 1 ? '' : 's'}. Placed is not shipped.\n`);
  process.exit(1);
}
for (const c of APP_COURSES) {
  const weeks = (WEEKS[c.id] || []).length;
  const qs = ALL_BANK_ITEMS.filter((q) => c.lessons.some((l) => l.id === q.lesson)).length;
  console.log(`  · ${c.emoji} ${c.label} — ${c.lessons.length} lessons · ${c.modules.length} modules · ${weeks} weeks registered · ${qs} questions`);
}
for (const n of notes) console.log('  · ' + n);
console.log('\nEvery written lesson is in a week, has questions, and is reachable from a screen.\n');
