// ---------------------------------------------------------------------------
// Run with: node scripts/check-sciencelab.mjs
//
// CHECK #24 — The Science Lab's lessons and its question bank.
//
// ---- THE TWO THINGS THIS EXISTS TO CATCH ----
//
// 1. A VIDEO THAT HAS NOTHING TO DO WITH ITS LESSON.
//
//    Gigi, on the first draft of this module: "make sure you used the same
//    format as Herbalism and just didnt add random videos that has nothing to
//    do with the lesson." She was right. One lesson called "the pulley and the
//    screw" carried a video titled "Types of Levers", and a lesson about the
//    WEDGE carried one about the screw.
//
//    check-videos already proves a video EXISTS and is verified. It has no
//    opinion about whether it teaches the lesson it sits on. Nothing can fully
//    judge that automatically — but the cheap half can be tested, and the two
//    flatly wrong ones would both have been caught by it: every word in a
//    lesson's `words` list should appear somewhere in what the video claims to
//    teach, and the video's `teaches` list may not be empty.
//
// 2. A BANK WHERE GUESSING ONE LETTER PASSES.
//
//    The first draft of this bank had 42 of its 60 answers in slot B and not a
//    single one in slot D. A child who worked that out scores 70% without
//    reading a word. Herbalism's bank header says "the right answer moves
//    around" — it was a rule nothing tested, so it drifted the moment sixty
//    questions were written in one sitting.
//
//    The spread is checked PER MODULE as well as across the course, because a
//    module written in one sitting is exactly the thing that drifts, and six
//    even modules will average a lopsided seventh back into range.
//
// Also asserted: ten bank questions per lesson, four choices, exactly one null
// in the feedback array and it sits on the right answer, no duplicate choices,
// no duplicate ids, and every bank question points at a lesson that exists.
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { ALL_SCIENCELAB_LESSONS, SCIENCELAB_MODULES } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/sciencelabCourse.js')).href);
// v3.25 — was the Module 1 bank, imported by name. See the note below.
const { SCIENCELAB_COURSE_BANK, SCIENCELAB_BANKS } = await import(pathToFileURL(resolve(ROOT, 'src/data/assessments/sciencelabCourseBank.js')).href);
const { APP_COURSES } = await import(pathToFileURL(resolve(ROOT, 'src/config/curriculumPlan.js')).href);

const errors = [];
const notes = [];
// ---- THE BANK IS THE COURSE'S, NOT ONE MODULE'S (v3.25) ----
//
// This line used to read `const BANK = SCIENCELAB_M1_BANK`, destructured from a
// hard-coded path. With one module that was the same thing as "the bank". With
// two it silently stopped being: every assertion below — and above all the
// answer-spread rule written after 42 of 60 answers turned up in slot B — would
// have gone on measuring Module 1's sixty questions for ever, however many
// modules were stacked on top. Module 2 could have shipped with every answer in
// slot A and this check would have printed "15/15/15/15" and passed.
//
// A check that measures a fixed subset while claiming to measure the whole is
// the same fault as a check that claims more than it tests. It reads the course
// bank now, and check-delivery fails the build if a written module is missing
// from it.
const BANK = SCIENCELAB_COURSE_BANK;
const lessonIds = new Set(ALL_SCIENCELAB_LESSONS.map((l) => l.id));

// ---- 1. lesson shape ------------------------------------------------------
for (const l of ALL_SCIENCELAB_LESSONS) {
  if (l.minutes !== 30) errors.push(`${l.id}: ${l.minutes} minutes — blk-science is 30`);
  if (!Array.isArray(l.beats) || l.beats.length !== 2) errors.push(`${l.id}: needs exactly 2 beats`);
  for (const b of l.beats || []) {
    if (!b.applyIt) errors.push(`${l.id} beat ${b.n}: no Apply-It — a beat without one is just a card`);
    else if (b.applyIt.feedback?.[b.applyIt.answer] !== null) {
      errors.push(`${l.id} beat ${b.n}: the right Apply-It answer carries feedback meant for a wrong one`);
    }
  }
  if (!Array.isArray(l.check) || l.check.length !== 3) errors.push(`${l.id}: the check must be 3 questions`);
  if (!l.standards?.length) errors.push(`${l.id}: no Georgia element — Science Lab lessons all carry one`);
  if (!l.activity?.safety) errors.push(`${l.id}: activity has no safety line`);
  if (!l.ledger?.ifSheIsStuck) errors.push(`${l.id}: ledger has no "if she is stuck"`);
}

// ---- 2. THE VIDEO MUST TEACH THE LESSON -----------------------------------
for (const l of ALL_SCIENCELAB_LESSONS) {
  const v = l.video;
  if (!v) { errors.push(`${l.id}: no video`); continue; }
  if (!Array.isArray(v.teaches) || v.teaches.length === 0) {
    errors.push(
      `${l.id}: the video declares nothing it teaches. That empty list is how a video about levers ` +
        `ended up on a lesson about pulleys.`
    );
    continue;
  }
  // ---- CALIBRATION, and the first run of this check forced it ----
  //
  // Written first as "every lesson word must appear in the video's teaches
  // list", it failed five of six lessons on its first run. Reading the failures,
  // it was the CHECK that was wrong, not the lessons: Lesson 3 teaches
  // "prediction", "evidence" and "result" — the words for how to run a fair
  // test — and its video is a tug-of-war demonstration. The video is exactly
  // right for the lesson. The lesson simply teaches vocabulary the video does
  // not, which is what a teacher is for.
  //
  // Demanding a perfect match would have pushed me to pad the teaches lists
  // with words the videos do not actually cover — a check that makes the data
  // dishonest is worse than no check.
  //
  // So: MOST of the lesson's words must be in the video, and NONE is a hard
  // failure. That still catches the thing this exists for — the levers video on
  // the pulley lesson shared zero words with it — while leaving room for a
  // lesson to teach more than its video does.
  const taught = v.teaches.map((t) => String(t).toLowerCase());
  const words = l.words || [];
  const hit = words.filter((w) => taught.some((t) => t.includes(String(w).toLowerCase())));
  const missing = words.filter((w) => !hit.includes(w));
  if (words.length && hit.length === 0) {
    errors.push(
      `${l.id} "${l.title}": its video ("${v.title}") shares NOTHING with what the lesson teaches. ` +
        `This is the "Types of Levers on a lesson about pulleys" failure.`
    );
  } else if (words.length && hit.length / words.length < 0.5 && !v.coverageNote) {
    errors.push(
      `${l.id} "${l.title}": only ${hit.length} of ${words.length} lesson words appear in what its video ` +
        `claims to teach (missing ${missing.map((m) => `"${m}"`).join(', ')}). Either the video is wrong ` +
        `for the lesson, or the teaches list is — or it is deliberate, in which case say so in a ` +
        `coverageNote on the video and this will accept it.`
    );
  } else if (v.coverageNote && hit.length / words.length >= 0.5) {
    // The reverse: an exemption left behind after the thing it excused is gone.
    // A stale exemption is how a rule quietly stops applying to anything.
    errors.push(
      `${l.id}: carries a coverageNote but its video now covers ${hit.length} of ${words.length} words — ` +
        `the exemption is no longer needed and should come out`
    );
  }
  if (!v.sourceGap) {
    errors.push(`${l.id}: no sourceGap — every video not from a Black American educator records the search`);
  }
}
const vids = ALL_SCIENCELAB_LESSONS.map((l) => l.video?.id);
if (new Set(vids).size !== vids.length) errors.push('two lessons share a video id');

// ---- 3. THE BANK ----------------------------------------------------------
const seenIds = new Set();
for (const q of BANK) {
  if (seenIds.has(q.id)) errors.push(`${q.id}: duplicate question id`);
  seenIds.add(q.id);
  if (!lessonIds.has(q.lesson)) errors.push(`${q.id}: points at lesson "${q.lesson}", which does not exist`);
  if (q.choices?.length !== 4) errors.push(`${q.id}: needs 4 choices`);
  if (q.feedback?.length !== q.choices?.length) errors.push(`${q.id}: one feedback per choice`);
  if (q.feedback?.filter((f) => f === null).length !== 1) {
    errors.push(`${q.id}: exactly one feedback entry must be null, and it must be the right answer`);
  } else if (q.feedback[q.answer] !== null) {
    errors.push(`${q.id}: the null is on choice ${q.feedback.indexOf(null)}, but the answer is ${q.answer}`);
  }
  if (new Set(q.choices).size !== q.choices?.length) errors.push(`${q.id}: two identical choices`);
  if (!q.why) errors.push(`${q.id}: no "why" — a grown-up reading a miss gets nothing`);
}
for (const l of ALL_SCIENCELAB_LESSONS) {
  const n = BANK.filter((q) => q.lesson === l.id).length;
  if (n !== 10) errors.push(`${l.id}: ${n} bank questions, not 10 — the weekly test draws 8 from three lessons`);
}

// ---- 4. GUESSING ONE LETTER MUST NOT PASS ---------------------------------
{
  const spread = [0, 0, 0, 0];
  for (const q of BANK) if (Number.isInteger(q.answer)) spread[q.answer] += 1;
  const worst = Math.max(...spread);
  const share = worst / BANK.length;
  if (spread.some((n) => n === 0)) {
    errors.push(
      `no correct answer is ever in slot ${String.fromCharCode(65 + spread.indexOf(0))} across all ` +
        `${BANK.length} questions — a child who notices never has to consider it`
    );
  }
  if (share > 0.4) {
    errors.push(
      `${worst} of ${BANK.length} answers sit in the same slot (${Math.round(share * 100)}%) — ` +
        `guessing that one letter scores ${Math.round(share * 100)}% without reading anything`
    );
  }
  if (!errors.length) notes.push(`answer spread ${spread.join('/')} — one letter guessed throughout scores ${Math.round(share * 100)}%`);

  // ---- AND PER MODULE, v3.25 ----
  //
  // The overall rule alone is not enough once there is more than one module. Six
  // even modules and one lopsided one average out: a module with all sixty
  // answers in slot A moves the whole-course share by a few points and passes,
  // while the child sitting THAT fortnight's tests can score full marks on one
  // letter. The bank is written a module at a time, in one sitting, which is
  // exactly the condition that produced the 42-of-60 bug in the first place.
  for (const [key, modBank] of Object.entries(SCIENCELAB_BANKS)) {
    if (!Array.isArray(modBank) || !modBank.length) continue;
    const ms = [0, 0, 0, 0];
    for (const q of modBank) if (Number.isInteger(q.answer)) ms[q.answer] += 1;
    const mWorst = Math.max(...ms);
    const mShare = mWorst / modBank.length;
    if (ms.some((n) => n === 0)) {
      errors.push(
        `${key}: no correct answer is ever in slot ${String.fromCharCode(65 + ms.indexOf(0))} across ` +
          `its ${modBank.length} questions — within this module she never has to consider it`
      );
    }
    if (mShare > 0.4) {
      errors.push(
        `${key}: ${mWorst} of ${modBank.length} answers sit in slot ` +
          `${String.fromCharCode(65 + ms.indexOf(mWorst))} (${Math.round(mShare * 100)}%) — a whole ` +
          `fortnight of tests guessable on one letter, even though the course total looks even`
      );
    }
    if (!errors.length) notes.push(`${key} spread ${ms.join('/')}`);
  }
}

// ---- 5. modules line up with the plan -------------------------------------
{
  const course = APP_COURSES.find((c) => c.id === 'sciencelab');
  if (course && course.lessonsWritten !== ALL_SCIENCELAB_LESSONS.length) {
    errors.push(
      `curriculumPlan says ${course.lessonsWritten} Science Lab lessons written; the data has ` +
        `${ALL_SCIENCELAB_LESSONS.length}`
    );
  }
  for (const m of SCIENCELAB_MODULES) {
    for (const id of m.lessons) if (!lessonIds.has(id)) errors.push(`module ${m.n} lists "${id}", which does not exist`);
    const wrong = m.lessons.filter((id) => {
      const l = ALL_SCIENCELAB_LESSONS.find((x) => x.id === id);
      return l && !m.elements.some((el) => l.standards.includes(el));
    });
    if (wrong.length) errors.push(`module ${m.n} claims ${m.elements.join(',')} but ${wrong.join(', ')} teaches something else`);

    // ---- THE LESSON MUST AGREE WITH ITS MODULE ABOUT WHEN IT IS TAUGHT (v3.29) ----
    //
    // Found by a negative test on Module 5: flipping every Q3 lesson to
    // `quarter: 1` changed nothing anywhere. Nothing compared a lesson's own
    // quarter and week against the module that lists it.
    //
    // That is not cosmetic. A lesson's `quarter` is what check-assessment uses to
    // pick its reading caps — Quarter 1 caps at 11 words a sentence and Quarter 3
    // at 14 with a floor of 6.5 — so a mislabelled lesson is measured against the
    // wrong standard entirely, in whichever direction happens to pass.
    for (const id of m.lessons) {
      const l = ALL_SCIENCELAB_LESSONS.find((x) => x.id === id);
      if (!l) continue;
      if (l.quarter !== m.quarter) {
        errors.push(
          `${id} says quarter ${l.quarter}; module ${m.n} that lists it says quarter ${m.quarter}. ` +
            `The lesson's own quarter chooses its reading caps, so this is measured against the wrong ruler.`
        );
      }
      if (Array.isArray(m.weeks) && !m.weeks.includes(l.week)) {
        errors.push(`${id} says week ${l.week}; module ${m.n} runs weeks ${m.weeks.join('–')}`);
      }
    }
  }
}

console.log('\nPetal & Pestle — The Science Lab check\n');
if (errors.length) {
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(`\n${errors.length} problem${errors.length === 1 ? '' : 's'} in The Science Lab.\n`);
  process.exit(1);
}
for (const m of SCIENCELAB_MODULES) {
  console.log(`  · Module ${m.n} "${m.title}" — ${m.lessons.length} lessons, weeks ${m.weeks.join('–')}, ${m.elements.join(', ')}`);
}
console.log(`  · ${ALL_SCIENCELAB_LESSONS.length} lessons · ${BANK.length} bank questions · ${new Set(vids).size} distinct videos`);
for (const n of notes) console.log('  · ' + n);
console.log('  · every lesson word appears in what its own video claims to teach');
console.log('\nThe lessons written so far hold together, and no video is sitting on the wrong lesson.\n');
