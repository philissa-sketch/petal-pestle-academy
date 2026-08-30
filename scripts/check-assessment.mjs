// ---------------------------------------------------------------------------
// Run with: node scripts/check-assessment.mjs
//
// The fifteenth check. It exists because a test is the one part of this app
// that can be BADLY WRONG AND LOOK COMPLETELY FINE.
//
// A broken screen is obvious in five seconds. A test with a wrong answer key
// records that a child does not know something she knows perfectly well, and
// nothing about it looks wrong — not to her, not to a grown-up reading the
// gradebook, and not to me. That result then feeds a re-take, a report card and
// eventually a transcript.
//
// The earlier checks in this project all asked "is there an answer". The
// grade-mapping bug in v2.7 got through because none of them asked "is the
// answer RIGHT". This one asks that, in eleven different ways:
//
//   1.  Every lesson has enough questions to build a re-take from.
//   2.  Every question points at a lesson that exists.
//   3.  The answer key is internally sound — index in range, feedback aligned.
//   4.  The right answer is not always in the same place.
//   5.  NO DOSING. No question suggests a plant treats anything.
//   6.  She can read it — same reading bar the lessons are held to.
//   7.  Every test form is exactly the length it claims.
//   8.  No test asks about a lesson it has not covered.
//   9.  A re-take is genuinely a different paper.
//   10. The same attempt always builds the same paper.
//   11. The spaced-review boxes expand, and a miss really does reset.
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { allBankItems, bankItemById, itemsForLessons } = await import(pathToFileURL(resolve(ROOT, 'src/data/assessments/appBank.js')).href);
const { QUARTER_TEST, RETAKE, REVIEW_INTERVALS, bandFor } =
  await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
const { buildQuarterTest, gradeTest, retakeStatus, quarterTestReady } = await import(pathToFileURL(resolve(ROOT, 'src/lib/assessmentEngine.js')).href);
const { newReviewItem, applyReviewAnswer, dayKeyOf, addDays, pickWarmUp } = await import(pathToFileURL(resolve(ROOT, 'src/lib/reviewQueue.js')).href);
const { pickReviewItem } = await import(pathToFileURL(resolve(ROOT, 'src/lib/mergeBackup.js')).href);
const { HERBALISM_MODULES, FLAT_CARD_LESSONS } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/herbalismCourse.js')).href);
// v3.25 — every course, not just Herbalism. This check reads the bank through
// appBank.js, so reading lessons from a single course made every Science Lab
// question look like it pointed at a lesson that does not exist.
const { ALL_LESSONS: ALL_APP_LESSONS } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/appCourses.js')).href);
const { WEEKLY_TEST, REVIEW_DAY, CATCH_UP_DAY, allWeeks, weekTestReady } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
const { buildWeeklyTest } = await import(pathToFileURL(resolve(ROOT, 'src/lib/assessmentEngine.js')).href);
const { WEEK: WEEK_SHAPE, APP_COURSES: PLAN_COURSES } = await import(pathToFileURL(resolve(ROOT, 'src/config/curriculumPlan.js')).href);

// ---- THE WEEK SHAPE IS PER COURSE, AND THIS CHECK DID NOT KNOW (v3.34) ----
//
// v3.22 made lesson-days-a-week and weekly-test-size per-course numbers so a
// two-day course could exist at all. curriculumPlan.js has carried them ever
// since. THIS FILE WENT ON READING THE GLOBAL THREE AND THE GLOBAL EIGHT.
//
// Nothing failed, because until v3.34 every registered week belonged to a
// three-day course. The first two-day week in the app made it fire four times
// over — "plans 2 lessons; the week shape is 3" and "an 8-question test needs
// at least 11" — against a course whose own plan says two lessons and five
// questions. The check was measuring Social Studies with Herbalism's ruler.
//
// Same shape as the reading floor at v3.29: an assumption that was true of
// every course in the app is still an assumption.
function planFor(courseId) {
  const c = PLAN_COURSES.find((x) => x.id === courseId);
  return {
    lessonDays: c?.lessonDaysPerWeek ?? WEEK_SHAPE.newLessonDays,
    testSize: c?.weeklyTestQuestions ?? WEEKLY_TEST.total
  };
}

// EVERY lesson the app teaches, from every course — a lesson this check cannot
// see is a lesson nothing is holding to the standard, which is exactly how six
// Science Lab lessons and sixty questions reached v3.24 untested by anything but
// their own module check.
const ALL_LESSONS = ALL_APP_LESSONS;

/**
 * Lessons that are deliberately in no week, and why.
 *
 * EMPTY as of v3.8, and that is the point. Every one of the 48 lessons in
 * Quarters 1 and 2 sits in exactly one week, so nothing needs excusing.
 *
 * The map stays because it fails in BOTH directions: a lesson in no week that
 * is not listed here still fails, and a listed lesson that IS in a week fails as
 * a stale entry. Its contents print on every run. An allowance that can be
 * quietly widened passes forever and proves nothing — that is the whole reason
 * this file exists.
 */
const LESSONS_WITHOUT_A_WEEK = new Map([]);

const errors = [];
const notes = [];
const bank = allBankItems();
const lessonIds = new Set(ALL_LESSONS.map((l) => l.id));
let MIN_PER_LESSON = 5;
const WARM_UP_SIZE = 3;

// ---------------------------------------------------------------------------
// 1 & 2. Coverage
// ---------------------------------------------------------------------------
{
  // Five per lesson is not a round number chosen for tidiness. A unit test takes
  // seven questions from a three-lesson unit; a re-take must overlap it by at
  // most three (RETAKE.maxRepeatedQuestions). Three lessons at five questions is
  // fifteen, which makes that possible. Four would not.
  MIN_PER_LESSON = 5;
  for (const l of ALL_LESSONS) {
    const n = itemsForLesson(l.id).length;
    if (n < MIN_PER_LESSON) {
      errors.push(
        `lesson ${l.id} (${l.title}) has ${n} test questions, needs ${MIN_PER_LESSON}. ` +
          `Fewer than that and a re-take is the same paper twice.`
      );
    }
  }
  for (const q of bank) {
    if (!lessonIds.has(q.lesson)) {
      errors.push(`question ${q.id} points at lesson "${q.lesson}", which does not exist`);
    }
  }
  // Every lesson named by a week must be a real lesson, and every lesson must be
  // in exactly one week — a lesson in no week is one no test will ever cover.
  const inWeeks = allWeeks().flatMap((w) => w.lessons);
  for (const lid of inWeeks) {
    if (!lessonIds.has(lid)) errors.push(`week lists lesson "${lid}", which does not exist`);
  }
  for (const l of ALL_LESSONS) {
    const count = inWeeks.filter((x) => x === l.id).length;
    const allowed = LESSONS_WITHOUT_A_WEEK.has(l.id);
    if (count === 0 && !allowed) {
      errors.push(`lesson ${l.id} is in no week — no test will ever cover it`);
    }
    if (count > 0 && allowed) {
      errors.push(
        `lesson ${l.id} is in a week now, but LESSONS_WITHOUT_A_WEEK still excuses it. ` +
          `Remove the entry — a stale allowance is how a real gap gets hidden.`
      );
    }
    if (count > 1) errors.push(`lesson ${l.id} is in ${count} weeks`);
  }
  if (!errors.length) {
    const inAWeek = ALL_LESSONS.length - LESSONS_WITHOUT_A_WEEK.size;
    notes.push(
      `${bank.length} questions across ${ALL_LESSONS.length} lessons; ${inAWeek} placed in a week`
    );
    for (const [lid, why] of LESSONS_WITHOUT_A_WEEK) {
      notes.push(`${lid} is in no week on purpose: ${why} Its lesson check and practice gate still run.`);
    }
  }
}

// ---------------------------------------------------------------------------
// THE WEEKLY TEST — Day 4, and the thing that replaces the unit test
// ---------------------------------------------------------------------------
{
  if (WEEKLY_TEST.fromThisWeek + WEEKLY_TEST.fromEarlierWeeks !== WEEKLY_TEST.total) {
    errors.push(
      `the weekly test does not add up: ${WEEKLY_TEST.fromThisWeek} + ${WEEKLY_TEST.fromEarlierWeeks} is not ${WEEKLY_TEST.total}`
    );
  }
  if (!WEEKLY_TEST.fromEarlierWeeks) {
    errors.push(
      'the weekly test interleaves nothing from earlier weeks. Those questions are why she still ' +
        'knows week 1 in March, and they are the first thing anyone cuts to make a test "fairer".'
    );
  }
  // Friday has to agree across both config files for the same reason Thursday
  // does — two files quietly disagreeing about which day a thing happens is how
  // the app ends up with no rhythm a child can feel.
  if (CATCH_UP_DAY.day !== WEEK_SHAPE.catchUpDay) {
    errors.push(
      `the catch-up day is day ${CATCH_UP_DAY.day} in assessment.js and day ` +
        `${WEEK_SHAPE.catchUpDay} in curriculumPlan.js`
    );
  }
  if (CATCH_UP_DAY.day <= REVIEW_DAY.day) {
    errors.push(
      `the catch-up day (${CATCH_UP_DAY.day}) must come AFTER the review-and-test day ` +
        `(${REVIEW_DAY.day}). Friday is for catching up on the week, not before it.`
    );
  }
  if (CATCH_UP_DAY.newLessons !== 0) {
    errors.push('the catch-up day teaches new lessons. Friday is for finishing the week, not extending it.');
  }
  if (REVIEW_DAY.day !== WEEK_SHAPE.reviewDay) {
    errors.push(
      `the review day is day ${REVIEW_DAY.day} in assessment.js and day ${WEEK_SHAPE.reviewDay} in curriculumPlan.js`
    );
  }

  const weeks = allWeeks();
  const lessonsInWeeks = weeks.flatMap((w) => w.lessons);

  // THE REPLACEMENT RULE, now enforced at the root. A weekly test over three
  // lessons and a unit test over three or four are the same test with two names.
  // Until v3.8 this walked UNITS and failed any lesson in both. UNITS is gone, so
  // the rule became stronger: the export itself must not come back. If someone
  // reintroduces it, this fails before a single lesson can be double-tested.
  const assessmentCfg = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
  for (const banned of ['UNITS', 'UNIT_TEST', 'allUnits', 'unitById', 'unitForLesson', 'unitsBefore']) {
    if (banned in assessmentCfg) {
      errors.push(
        `src/config/assessment.js exports "${banned}" again. The weekly test REPLACED the unit ` +
          `test at v3.8; it does not stack on top of it, and she would sit the same material twice.`
      );
    }
  }

  const seenLesson = new Map();
  for (const w of weeks) {
    const plan = planFor(w.course);
    if (w.planned !== plan.lessonDays) {
      errors.push(
        `${w.id} plans ${w.planned} lessons; ${w.course} declares ${plan.lessonDays} lesson days a week`
      );
    }
    if (w.lessons.length > w.planned) {
      errors.push(`${w.id} has ${w.lessons.length} lessons but only planned ${w.planned}`);
    }
    for (const lid of w.lessons) {
      if (!lessonIds.has(lid)) errors.push(`${w.id} lists lesson "${lid}", which does not exist`);
      if (seenLesson.has(lid)) {
        errors.push(`lesson ${lid} is in two weeks: ${seenLesson.get(lid)} and ${w.id}`);
      }
      seenLesson.set(lid, w.id);
    }

    // A week that is not finished must REFUSE its test rather than serve a short
    // paper over one lesson and file the result as a week's grade.
    const readAll = weekTestReady(w, w.lessons);
    if (w.lessons.length < w.planned && readAll.ready) {
      errors.push(`${w.id} is only ${w.lessons.length}/${w.planned} written but its test says it is ready`);
    }

    // POOL HEADROOM, checked against a FULL week rather than what happens to be
    // written today. Three lessons at five questions is fifteen; an eight-question
    // test plus a three-question morning warm-up needs eleven clear, and a re-take
    // needs enough left over to be a genuinely different paper.
    const full = w.planned * MIN_PER_LESSON;
    const needed = plan.testSize + WARM_UP_SIZE;
    if (full < needed) {
      errors.push(
        `a full ${w.id} would hold ${full} questions; a ${plan.testSize}-question test that must ` +
          `avoid ${WARM_UP_SIZE} warm-up questions needs at least ${needed}`
      );
    }

    // And the engine has to actually build one.
    const f1 = buildWeeklyTest(w.id, { attempt: 1 });
    if (!f1) {
      errors.push(`buildWeeklyTest returned nothing for ${w.id}`);
      continue;
    }

    // ---- THE PAPER SHE SITS IS THE SIZE HER COURSE DECLARES (v3.34) ----
    //
    // check-curriculum-volume already refused a test larger than three
    // questions per lesson taught. It tested the DECLARATION. Nothing tested
    // whether the ENGINE obeyed it, and the engine did not: it used the global
    // eight for every course, so the first two-day week in the app got eight
    // questions drawn from two lessons.
    //
    // A rule enforced on the number in the config and not on the paper the
    // child is handed is half a rule.
    if (f1.questionIds.length !== plan.testSize) {
      errors.push(
        `${w.id} is a ${w.course} week, which declares a ${plan.testSize}-question weekly test, ` +
          `but the engine built one with ${f1.questionIds.length}`
      );
    }
    // ---- AND MOST OF THE PAPER IS THIS WEEK'S WORK (v3.34) ----
    //
    // ⚠️ THIS ASSERTION EXISTS BECAUSE A NEGATIVE TEST MISSED. Removing the
    // clamp that scales the earlier-weeks share left the paper five questions
    // long, so the length check above stayed green while the MIX went from one
    // old question to two. A five-question test with two old questions is a
    // three-question test of this week's work, and the child's Thursday score
    // is filed as this week's grade either way.
    //
    // The comment in the engine already said that. A rule stated in a comment
    // and not tested is a rule nobody is keeping.
    const thisWeek = new Set(w.lessons);
    const fromThisWeek = f1.questionIds.filter((qid) => thisWeek.has(bankItemById(qid)?.lesson)).length;
    const fromEarlier = f1.questionIds.length - fromThisWeek;
    if (fromEarlier * 4 > f1.questionIds.length) {
      errors.push(
        `${w.id}'s paper is ${f1.questionIds.length} questions with ${fromEarlier} from earlier weeks — ` +
          `over a quarter of it, so the score filed as this week's grade mostly is not`
      );
    }

    if (plan.testSize > w.planned * 3) {
      errors.push(
        `${w.course} sits a ${plan.testSize}-question test on ${w.planned} lesson(s) a week — ` +
          `more than three questions per lesson taught tests what was never covered`
      );
    }
    // (The per-course size assertion is above. This used to repeat it against
    // the GLOBAL total, which is the same hard-coded eight in a second place.)
    if (new Set(f1.questionIds).size !== f1.questionIds.length) {
      errors.push(`${w.id} weekly test asks the same question twice`);
    }
    const again = buildWeeklyTest(w.id, { attempt: 1 });
    if (JSON.stringify(again.questionIds) !== JSON.stringify(f1.questionIds)) {
      errors.push(`${w.id} weekly test does not rebuild identically — a page refresh would lose her answers`);
    }
    if (f1.kind !== 'weekly') errors.push(`${w.id} weekly test is not tagged 'weekly'`);
  }

  if (!errors.length) {
    notes.push(
      `the weekly test replaces the unit test: ${WEEKLY_TEST.total} questions on day ${REVIEW_DAY.day}, ` +
        `${WEEKLY_TEST.fromEarlierWeeks} of them from earlier weeks, and no lesson sits in both a week and a unit`
    );
    notes.push(`${weeks.length} week${weeks.length === 1 ? '' : 's'} registered, each rebuilding its paper identically`);
  }
}

function itemsForLesson(lessonId) {
  return bank.filter((q) => q.lesson === lessonId);
}

// ---------------------------------------------------------------------------
// 3. The answer key itself
// ---------------------------------------------------------------------------
{
  const seenIds = new Set();
  for (const q of bank) {
    if (seenIds.has(q.id)) errors.push(`duplicate question id ${q.id}`);
    seenIds.add(q.id);

    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      errors.push(`${q.id}: needs exactly 4 choices, has ${q.choices?.length}`);
      continue;
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
      errors.push(`${q.id}: answer index ${q.answer} is not 0-3`);
      continue;
    }
    if (!Array.isArray(q.feedback) || q.feedback.length !== 4) {
      errors.push(`${q.id}: feedback must have one entry per choice`);
      continue;
    }
    if (q.feedback[q.answer] !== null) {
      errors.push(`${q.id}: feedback slot ${q.answer} is the CORRECT answer and must be null`);
    }
    for (let i = 0; i < 4; i++) {
      if (i === q.answer) continue;
      if (!q.feedback[i] || !String(q.feedback[i]).trim()) {
        errors.push(
          `${q.id}: choice "${q.choices[i]}" has no feedback. A wrong answer with no explanation ` +
            `is a red cross, and a red cross teaches nothing.`
        );
      }
    }
    if (!q.why || !String(q.why).trim()) {
      errors.push(`${q.id}: no "why" for the right answer — the review screen would be blank`);
    }
    // Two identical choices means one of them is silently unmarkable.
    const uniq = new Set(q.choices.map((c) => String(c).trim().toLowerCase()));
    if (uniq.size !== 4) errors.push(`${q.id}: two choices are the same`);
  }
  if (seenIds.size === bank.length) notes.push('every question id is unique, every answer key is sound');
}

// ---------------------------------------------------------------------------
// 4. The right answer must move around
// ---------------------------------------------------------------------------
{
  // WHAT THIS CHECK ORIGINALLY SAID, AND WHY IT NOW SAYS SOMETHING BETTER.
  //
  // The first version counted answer positions in the bank and failed the build
  // when one position held more than 35%. It failed: writing sixty-five
  // questions by hand had put the answer at B twenty-three times and at D three.
  //
  // Hand-balancing the bank would have made this check pass and would have
  // fixed almost nothing. A fixed position per question means that after
  // meeting a question in three warm-ups she can answer it from the shape of the
  // screen without reading a word — and spaced review is built entirely on
  // meeting the same question again and again. The check was measuring the
  // right worry with the wrong instrument.
  //
  // So the position is now dealt per attempt, and per day for a warm-up. What
  // this checks is that the shuffle is honest: that it moves things, that it
  // never loses the right answer, and that feedback follows its own choice.
  const { presentQuestion } = await import(pathToFileURL(resolve(ROOT, 'src/lib/assessmentEngine.js')).href);

  const positions = [0, 0, 0, 0];
  let movedForSomeSeed = 0;
  for (const q of bank) {
    const seen = new Set();
    for (const seed of ['2026-09-01', '2026-09-08', 'unit|attempt1', 'unit|attempt2']) {
      const p = presentQuestion(q, seed);
      // The right answer must survive the shuffle.
      if (p.choices[p.answer] !== q.choices[q.answer]) {
        errors.push(`${q.id}: the shuffle moved the right answer to the wrong slot`);
      }
      // Feedback must travel with its own choice, or a wrong answer gets
      // somebody else's explanation — which is worse than none.
      for (let i = 0; i < 4; i++) {
        const orig = p.origIndex[i];
        if (p.feedback[i] !== q.feedback[orig]) {
          errors.push(`${q.id}: the shuffle detached feedback from its choice`);
          break;
        }
      }
      if (new Set(p.origIndex).size !== 4) errors.push(`${q.id}: the shuffle dropped or doubled a choice`);
      seen.add(p.answer);
      positions[p.answer]++;
    }
    if (seen.size > 1) movedForSomeSeed++;
  }
  const worst = Math.max(...positions) / positions.reduce((a, b) => a + b, 0);
  if (worst > 0.32) {
    errors.push(
      `across four deals the right answer still lands at one position ${(worst * 100).toFixed(0)}% ` +
        `of the time (cap 32%) — the shuffle is not spreading`
    );
  }
  if (movedForSomeSeed < bank.length * 0.9) {
    errors.push(
      `${bank.length - movedForSomeSeed} questions land in the same position on every deal — ` +
        `they are effectively not shuffled at all`
    );
  }
  notes.push(
    `choices are dealt fresh per attempt and per day; across four deals positions land ` +
      `A ${positions[0]}, B ${positions[1]}, C ${positions[2]}, D ${positions[3]}`
  );
}

// ---------------------------------------------------------------------------
// 5. THE SAFETY CHECK
// ---------------------------------------------------------------------------
{
  // The one rule with no exceptions in this whole app: no dosing, no "take this
  // for that", no self-treatment. She is nine and she wants to be a herbalist,
  // which is exactly the combination that makes this worth enforcing in code
  // rather than trusting to whoever writes the next quarter's questions.
  //
  // Matched on phrases, not single words, so that legitimate content survives:
  // lesson 12 is ABOUT safety and must be allowed to use the word "safe", and
  // Quarter 4 is about how a plant becomes a medicine.
  const BANNED = [
    /\b(cures?|curing)\b/i,
    /\btreats?\s+(a|an|the|your|her|his|their)?\s*\w*\s*(ache|pain|cold|flu|cough|fever|burn|cut|rash|wound|illness|sickness)/i,
    /\bgood\s+for\s+(a|an|the|your|her|his|their)?\s*\w*\s*(ache|pain|cold|flu|cough|fever|burn|cut|rash|stomach|throat|head)/i,
    /\b(take|drink|eat|swallow|chew)\s+(this|it|that|some)\s+(for|when|if)\b/i,
    /\bhow\s+much\s+\w+\s+(should|do|would)\s+(you|she|he|they)\s+(take|drink|eat|use)/i,
    /\b(dose|dosage|doses)\b/i,
    /\b(remedy|remedies)\s+for\b/i,
    /\bhelps?\s+(with\s+)?(a\s+)?(headache|stomach\s*ache|sore\s+throat|cough|cold|fever)/i,
    /\bmakes?\s+you\s+feel\s+better\b/i
  ];
  const texts = bank.flatMap((q) => [
    { id: q.id, where: 'prompt', text: q.prompt },
    ...q.choices.map((c, i) => ({ id: q.id, where: `choice ${'ABCD'[i]}`, text: c })),
    ...q.feedback.map((f, i) => ({ id: q.id, where: `feedback ${'ABCD'[i]}`, text: f || '' })),
    { id: q.id, where: 'why', text: q.why }
  ]);
  let hits = 0;
  for (const t of texts) {
    for (const re of BANNED) {
      if (re.test(t.text)) {
        hits++;
        errors.push(
          `SAFETY — ${t.id} ${t.where}: "${String(t.text).slice(0, 70)}" reads as dosing or ` +
            `treatment advice. No question may suggest a plant treats anything.`
        );
        break;
      }
    }
  }
  if (!hits) notes.push(`${texts.length} strings checked for dosing and treatment language — none found`);

  // ---- 5b. THE BODY-IMAGE FENCE, AND WHY IT IS A CHECK AND NOT A NOTE ----
  //
  // The Human Body has carried one rule from Gigi since Module 1: no weight, no
  // body composition, no appearance, and nothing that teaches her to diagnose
  // herself. It has been enforced for sixteen modules by me reading what I wrote,
  // which is not enforcement — and at v3.53 a HAND-RUN scan found the word
  // "weight" inside Module 14, the growing module, in a wrong-answer feedback
  // line. It was harmless in isolation and it was still the word arriving on the
  // screen of a nine-year-old girl in the one lesson about her own body changing.
  //
  // A rule she must act on is a CHECK, not a warning. So it is one.
  //
  // ---- WHY THE FENCE IS TIGHTEST AROUND ONE MODULE ----
  //
  // Elsewhere in the app "heavy" is a fair distractor about a grain of rice or a
  // drop of oil, and banning the word outright would push whoever writes the next
  // module into reaching for a worse wrong answer. The DERIVED rule is: the
  // vocabulary of weight and appearance is banned everywhere in The Human Body
  // when it is applied to a PERSON, and banned outright in the growing module,
  // where the subject is her own body and there is no innocent reading.
  const BODY_IMAGE_ANYWHERE = [
    /\b(obese|obesity|overweight|underweight)\b/i,
    /\bhow\s+(much\s+)?(you|she|he|they)\s+weigh/i,
    /\byour\s+weight\b/i,
    /\b(body\s*mass|BMI|body\s+fat)\b/i,
    /\b(diet|dieting)\s+(plan|to\s+lose|for\s+losing)/i,
    // ---- THIS PATTERN WAS WRITTEN TOO WIDE AND FAILED TWENTY CORRECT ITEMS ----
    //
    // The first draft read /\b(too|so)\s+(fat|thin|skinny|big|small)\b/i and it
    // immediately failed "Far too small", "Ten times too big" and "Undissolved
    // bits are too big for the holes" — every one of which is maths feedback
    // about a NUMBER or a piece of soil, in a course whose whole point is
    // measuring things and getting the units right.
    //
    // A check that fails correct content teaches whoever hits it to reach for the
    // check rather than the content, which is the failure this file has now made
    // four times (v3.43 twice, v3.44, and here). So the rule is stated the way it
    // is actually meant: WEIGHT AND APPEARANCE WORDS ATTACHED TO A PERSON. "big"
    // and "small" are out of the pattern entirely — they are dimension words and
    // this course cannot function without them.
    /\b(you|she|he|they|somebody|anybody|a\s+person|your\s+body|her\s+body|his\s+body)\s+(is|are|was|were|looks?|seems?)\s+(too\s+|very\s+|a\s+bit\s+)?(fat|thin|skinny|chubby|heavy|overweight)\b/i,
    /\bshould\s+(weigh|look)\b/i
  ];
  // Module 14 only. The subject is her own growing body, so the words do not get
  // an innocent reading here even when they are attached to a cell or a bean.
  const GROWING_MODULE_ONLY = [/\bweigh(t|s|ed|ing)?\b/i, /\bpuberty\b/i, /\bcalorie/i, /\bappearance\b/i];

  const bodyTexts = texts.filter((t) => /^t-body/.test(t.id));
  const growingTexts = texts.filter((t) => /^t-bodym14/.test(t.id));
  let bodyHits = 0;
  for (const t of bodyTexts) {
    for (const re of BODY_IMAGE_ANYWHERE) {
      if (re.test(t.text)) {
        bodyHits++;
        errors.push(
          `BODY IMAGE — ${t.id} ${t.where}: "${String(t.text).slice(0, 70)}" applies weight or ` +
            `appearance language to a person. The Human Body carries no weight, no body ` +
            `composition and no appearance, anywhere, on Gigi's standing rule.`
        );
        break;
      }
    }
  }
  for (const t of growingTexts) {
    for (const re of GROWING_MODULE_ONLY) {
      if (re.test(t.text)) {
        bodyHits++;
        errors.push(
          `BODY IMAGE — ${t.id} ${t.where}: "${String(t.text).slice(0, 70)}" uses weight, ` +
            `puberty or appearance vocabulary inside MODULE 14. That module is about her own ` +
            `growing body and the fence there is absolute — reword the content, never the check.`
        );
        break;
      }
    }
  }
  if (!bodyHits) {
    notes.push(
      `${bodyTexts.length} Human Body strings carry no weight, body-composition or appearance ` +
        `language, and the ${growingTexts.length} in the growing module carry none of that vocabulary at all`
    );
  }
  if (!growingTexts.length) {
    errors.push(
      'UNRUN: the growing-module fence found no Module 14 questions to test. An assertion with ' +
        'nothing to run on is not a passing assertion.'
    );
  }

  // And the positive form: the safety lesson must actually be tested. A rule
  // taught once in lesson 12 and never asked about again is a rule she will not
  // have in June.
  const safetyQs = itemsForLesson('hb-1-12').length;
  if (safetyQs < 5) {
    errors.push(`the first rule of the field (lesson 12) has only ${safetyQs} questions — it needs at least 5`);
  } else {
    notes.push(`the first rule of the field is tested ${safetyQs} ways, and it is in the cumulative quarter test`);
  }
}

// ---------------------------------------------------------------------------
// 6. Can she read it?
// ---------------------------------------------------------------------------
{
  // The same bar the lessons are held to. Her reading is the constraint, not her
  // age — ten of her thirteen reading questions in the Check-In were read aloud
  // to her, so her measured reading number is really a listening number and her
  // independent reading sits below it.
  //
  // A test question she cannot read measures her reading, silently, and files
  // the result under Herbalism.
  // Words whose difficulty the SYLLABLE COUNTER gets wrong, not words that are
  // hard. "Every", "useful" and "likely" are two-syllable words that a vowel-
  // group counter reads as three, which is the known weakness the Dale-Chall
  // formula exists to work around. Kept short and boring on purpose — this list
  // is not a place to hide a genuinely hard word.
  // ---- PEOPLE'S NAMES ARE NOT READING DIFFICULTY (v3.9) ----
  //
  // Module 15 is six lessons about six named women, and Module 13 is the history
  // of six drugs and the people who found them. The long-word rule was failing
  // those questions for containing "Canady" and "Paracelsus" — which measures
  // nothing about how hard the sentence is to read.
  //
  // A name is a name. It is exempt because it is a proper noun, NOT because a
  // lesson is teaching it as vocabulary, which is why it is its own set rather
  // than being buried in SUBJECT. Every entry is a real person named in a lesson.
  const PEOPLE = new Set([
    'paracelsus', 'pelletier', 'caventou', 'hofmann', 'sertuerner', 'withering',
    'rebecca', 'crumpler', 'susan', 'mckinney', 'steward', 'marie', 'maynard', 'daly',
    'cooke', 'wright', 'alexa', 'canady', 'kizzmekia', 'corbett', 'beronda', 'montgomery',
    'patricia', 'julian', 'percy', 'warren', 'marshall', 'semmelweis', 'youyou',
    'coley', 'wallace', 'nikole', 'alexis', 'twitty', 'finley', 'mcneil', 'bervell'
  ]);

  const COMMON = new Set([
    'another', 'together', 'everything', 'anything', 'family', 'remember', 'different',
    'favourite', 'favorite', 'usually', 'probably', 'understand', 'important', 'underneath',
    'definitely', 'yourself', 'somebody', 'everybody', 'beautiful',
    'every', 'useful', 'likely', 'really', 'easier', 'quickly',

    // ---- v3.9 ----
    // The long-word rule exists to catch hard VOCABULARY. It was catching place
    // names, month names and ordinary adverbs instead — "Atlanta" is the city she
    // lives in and "tomorrow" is not a difficult word for a ten-year-old. These are
    // COMMON, not SUBJECT: they are exempt because they are easy, not because a
    // lesson is teaching them.
    'atlanta', 'georgia', 'alabama', 'america', 'american', 'africa', 'african', 'carolina',
    'january', 'february', 'april', 'july', 'september', 'october', 'november', 'december',
    'tomorrow', 'yesterday', 'exactly', 'actually', 'activity', 'activities', 'timeline',
    'maturity', 'hardening', 'satellites', 'satellite', 'meteorologists', 'endofyear',
    'anybody', 'everywhere', 'somewhere', 'afterwards', 'carefully', 'suddenly', 'slowly',
    'finally', 'already', 'over', 'into',
    'something', 'nobody', 'anybody', 'gardeners', 'gardener', 'tomatoes', 'tomato',
    'medical', 'hospital', 'identical', 'quietly', 'containers', 'container',
    'difference', 'differences', 'society', 'everyone', 'someone', 'because',
    'careful', 'carefully', 'separates', 'separate', 'opinion', 'opinions'
  ]);
  // Words that ARE the content. Exempting "families" is the same allowance
  // check-readability already makes for "photosynthesis": you cannot teach plant
  // families in words shorter than "families".
  const SUBJECT = new Set([
    'herbalist', 'herbalism', 'alternate', 'opposite', 'rosemary', 'lavender', 'chamomile',
    'dandelion', 'medicine', 'medicinal', 'germinate', 'photosynthesis', 'pollen', 'petals',
    'related', 'unusual', 'harvesting', 'apothecary',
    // Module 1's vocabulary. These five words ARE lesson 1 — the video teaches
    // them by name and the bank tests one question per word. Teaching around
    // "endosperm" would leave her with a fuzzy idea and no word for it, which
    // is worse for a child than a long word she is meant to be learning.
    'embryo', 'endosperm', 'germination', 'germinate', 'germinates', 'dormant',
    'temperature', 'kernels', 'sprouted',
    'family', 'families', 'lookalike', 'lookalikes', 'herbalists',

    // ---- v3.8 · the vocabulary of Modules 2 to 8 ----
    //
    // Same principle as "endosperm" above, applied eight times. Each of these
    // is a word a lesson exists to teach, every one carries a glossary entry
    // with a plain meaning, and every one is in the read-aloud text. Teaching
    // around "transpiration" in a lesson about transpiration leaves her with a
    // fuzzy idea and no word for it.
    //
    // This list is the ONLY place the long-word rule is relaxed, and it is
    // relaxed by name. A long word that is not lesson vocabulary still fails.

    // Module 1 · what hb-m1-04 exists to teach
    'annual', 'annuals', 'perennial', 'perennials', 'biennial',
    // Module 2 · roots, shoots and soil
    'taproot', 'taproots', 'fibrous', 'nutrient', 'nutrients', 'compost', 'organic',
    // Module 3 · the ecosystem — S4L1
    'producer', 'producers', 'consumer', 'consumers', 'decomposer', 'decomposers',
    'ecosystem', 'ecosystems', 'energy', 'pollinator', 'pollinators', 'scavenger',
    // Module 4 · adaptations — S3L2
    'adaptation', 'adaptations', 'trichome', 'trichomes', 'aromatic', 'volatile',
    'tropism', 'tropisms', 'phototropism', 'gravitropism', 'thigmotropism', 'tendril', 'tendrils',
    // Module 5 · water — S4E3
    'evaporation', 'evaporate', 'evaporates', 'condensation', 'condense', 'condenses',
    'precipitation', 'transpiration', 'transpire', 'stomata', 'xylem', 'drainage', 'absorb',
    // Module 6 · pollination and partnership
    'pollination', 'pollinate', 'pollinated', 'stamen', 'stamens', 'anther', 'anthers',
    'pistil', 'stigma', 'ovary', 'ovule', 'ovules', 'sepal', 'sepals', 'nectar',
    'mycorrhiza', 'mycorrhizae', 'fungus', 'fungi', 'mycelium',
    // Module 7 · herbs in history
    'midwife', 'midwives', 'remedy', 'remedies', 'preserve', 'preserving', 'sorghum',
    'generation', 'generations', 'tradition', 'traditions', 'history', 'historian',
    // Module 8 · the plant detective
    'extraction', 'infusion', 'observation', 'observations', 'interval', 'intervals',
    'evidence', 'conclusion', 'variable', 'variables', 'measurement', 'measurements',
    'dichotomous', 'specimen', 'specimens', 'journal',

    // ---- v3.9 · the vocabulary of Modules 9 to 16 (Quarters 3 and 4) ----
    // Same principle, eight more times. Every word here is one a lesson exists to
    // teach, every one carries a glossary card, every one is in the read-aloud.
    // M9/M10 · weather
    'thermometer', 'barometer', 'anemometer', 'hygrometer', 'meteorologist', 'atmosphere',
    'humidity', 'forecast', 'cirrus', 'stratus', 'cumulus', 'cumulonimbus', 'pattern',
    'degrees', 'gauge', 'pressure', 'climate', 'seasonal', 'average', 'instrument',
    // M11 · the apothecary
    'infusion', 'decoction', 'maceration', 'extraction', 'volume', 'container',
    'contamination', 'preserve', 'preservation', 'moisture', 'accurate', 'accuracy',
    // M12 · the growing year
    'seedling', 'seedlings', 'transplant', 'transplanting', 'succession', 'companion',
    'germinating', 'rhizome', 'rhizomes', 'harvest', 'calendar', 'schedule',
    // M13 · plant to medicine
    'chemical', 'chemicals', 'compound', 'compounds', 'salicin', 'aspirin', 'digitalis',
    'quinine', 'isolate', 'isolated', 'standardise', 'standardised', 'poison', 'poisonous',
    'medicine', 'pharmacist', 'laboratory', 'concentration', 'purified',
    // M14 · how a claim gets tested
    'evidence', 'anecdote', 'variable', 'variables', 'variation', 'coincidence', 'prediction',
    'placebo', 'blinded', 'expectation', 'comparison', 'baseline', 'randomise', 'consensus',
    'bacterium', 'bacteria', 'ingredient', 'ingredients', 'checkable', 'condition',
    // M15 · Black women in medicine and botany
    'physician', 'surgeon', 'neurosurgeon', 'immunologist', 'chemistry', 'chemist',
    'residency', 'institution', 'segregation', 'diploma', 'histones', 'cholesterol',
    'chemotherapy', 'ophthalmologist', 'discourses', 'valedictorian',
    // M16 · the herbalist's year
    'phenology', 'hindsight', 'protocol', 'referral', 'uncertainty', 'limitation',
    'replicate', 'investigation', 'presentation', 'herbarium',
    // stragglers surfaced by the first full-course run
    'oxygen', 'periwinkle', 'vincristine', 'vinblastine', 'paclitaxel', 'artemisinin',
    'dispensary', 'neurosurgery', 'neurosurgeon', 'clinical', 'oncology', 'immunology',
    'salicylic', 'cinchona', 'foxglove', 'wormwood',
    // The four plants actually in her containers. Naming her own garden should
    // never cost a question a readability failure.
    'turmeric', 'garlic', 'ginger', 'rosemary', 'peppermint', 'hibiscus'
  ]);

  function syllables(word) {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    const endsConsonantLe = /[^aeiouy]le$/.test(w);
    const stripped = w.replace(/(?:es|ed|e)$/, '').replace(/^y/, '');
    const groups = stripped.match(/[aeiouy]{1,2}/g);
    let count = groups ? groups.length : 1;
    if (endsConsonantLe) count += 1;
    return Math.max(1, count);
  }

  // ---- THE SCIENCE LAB'S VOCABULARY IS DERIVED, NOT LISTED (v3.25) ----
  //
  // SUBJECT above is a hand-written list of Herbalism words. Extending it by
  // hand for a second course is how a check quietly stops meaning anything:
  // the failing word gets pasted in and the failure goes away, whether or not
  // the lesson teaches it.
  //
  // So a long word is exempt on a Science Lab question ONLY if some Science Lab
  // lesson teaches it by name — it is in that course's own `words` list or its
  // glossary. The exemption cannot be widened without writing the word into a
  // lesson and teaching it, which is the point. "friction", "unbalanced" and
  // "direction" pass because they ARE the content, the same allowance
  // check-readability makes for "photosynthesis". "wheelbarrow" and "properly"
  // do not pass, and were reworded rather than exempted.
  // v3.34: DERIVED PER COURSE, not per hard-coded prefix. The v3.25 version
  // built one set from The Science Lab's lessons and handed it out on the "sl-"
  // prefix. Social Studies arrived with "loyalist" and "liberty" taught by name
  // in its own lessons and got no exemption at all, because this function had
  // never heard of it. The rule was right; its reach was one course wide.
  //
  // The rule itself does not move: a long word is forgiven ONLY where a lesson
  // in that same course teaches it by name, in `words` or the glossary. A word
  // that is merely convenient still fails. "colonist" and "remembered" failed
  // here and were REWORDED, not added to anything.
  const COURSE_PREFIX = { 'sl-': 'sciencelab', 'hb-': 'herbalism', 'ss-': 'social' };
  const VOCAB_BY_COURSE = {};
  for (const courseId of new Set(ALL_LESSONS.map((l) => l.course))) {
    VOCAB_BY_COURSE[courseId] = new Set(
      ALL_LESSONS.filter((l) => l.course === courseId)
        .flatMap((l) => [...(l.words || []), ...(l.glossary || []).map((g) => g.word)])
        .flatMap((w) => String(w).toLowerCase().split(/\s+/))
        .filter(Boolean)
    );
  }
  /** The extra exemption a question earns from its OWN course, and no other. */
  function vocabFor(q) {
    const lesson = String(q?.lesson || '');
    for (const [prefix, courseId] of Object.entries(COURSE_PREFIX)) {
      if (lesson.startsWith(prefix)) return VOCAB_BY_COURSE[courseId] || null;
    }
    return null;
  }

  function analyse(text, extra = null) {
    const clean = String(text || '').replace(/[“”‘’]/g, "'").replace(/\s+/g, ' ').trim();
    if (!clean) return { meanSentence: 0, hardRate: 0, hardWords: [] };
    const sentences =
      clean.split(/[.!?;:—](?:\s|$)/).filter((s) => s.trim().split(/\s+/).length > 1).length || 1;
    const words = clean.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
    if (!words.length) return { meanSentence: 0, hardRate: 0, hardWords: [] };
    const hard = [];
    for (const raw of words) {
      const w = raw.toLowerCase().replace(/[^a-z']/g, '');
      if (
        syllables(w) >= 3 &&
        !COMMON.has(w) &&
        !SUBJECT.has(w) &&
        !PEOPLE.has(w) &&
        !(extra && extra.has(w))
      ) {
        hard.push(w);
      }
    }
    return {
      meanSentence: words.length / sentences,
      hardRate: hard.length / words.length,
      hardCount: hard.length,
      words: words.length,
      hardWords: [...new Set(hard)]
    };
  }

  // ---- CAPS RISE BY QUARTER (v3.9) ----
  //
  // Until v3.9 there was one cap for the whole course — eleven words a sentence,
  // 6% long words — and the comment said "deliberately no wriggle room by level,
  // every question in this bank is for the same child."
  //
  // That was true when the bank was one quarter long. It is not true across a
  // year. Gigi's call, Aug 15: Azianna will have had a year of instruction by
  // Quarter 3, and writing her at a first-grade sentence level in March holds her
  // back and starts to feel babyish, which is its own way of losing a child.
  //
  // Q1 and Q2 were MEASURED on disk after they were built: Flesch-Kincaid 1.3,
  // 6.2 words a sentence, 3.4% long words. The ramp is set from that real number,
  // not from a guess.
  //
  // THIS CHECK NOW FAILS IN BOTH DIRECTIONS. A Quarter 4 question written at
  // Quarter 1's level is not "safe" — it is a question that stopped teaching her
  // anything, and the floor below catches it. The temptation when Q3/Q4 questions
  // trip the old cap is to simplify them until they pass. That is the failure this
  // rewrite exists to prevent.
  const QUARTER_CAPS = {
    1: { sentence: 11, hard: 0.06, choiceWords: 12, floorSentence: 0 },
    2: { sentence: 12, hard: 0.07, choiceWords: 13, floorSentence: 0 },
    3: { sentence: 14, hard: 0.10, choiceWords: 15, floorSentence: 6.5 },
    4: { sentence: 16, hard: 0.10, choiceWords: 15, floorSentence: 7.5 }
  };

  /** Which quarter a question belongs to, via the lesson it tests. */
  const QUARTER_OF_LESSON = new Map(ALL_LESSONS.map((l) => [l.id, l.quarter || 1]));
  function capsFor(q) {
    return QUARTER_CAPS[QUARTER_OF_LESSON.get(q.lesson) || 1] || QUARTER_CAPS[1];
  }

  // Per-quarter means for the floor rule — a single short question is not
  // evidence that a whole quarter was written too easy, but a quarter's mean is.
  const perQuarter = {};
  for (const q of bank) {
    const qn = QUARTER_OF_LESSON.get(q.lesson) || 1;
    (perQuarter[qn] ||= []).push(analyse(q.prompt, vocabFor(q)).meanSentence);
  }
  // ---- AND PER COURSE, v3.29 ----
  //
  // Found by a negative test: every one of Module 5's sixty Quarter 3 prompts
  // was replaced with "What is it?" and the floor rule did not fire. Quarter 3
  // also holds four Herbalism modules, so sixty questions written far too easy
  // were absorbed by four hundred written correctly and the mean barely moved.
  //
  // The floor exists to stop a course being written down to an earlier
  // quarter's level. A quarter-wide average cannot see that happening to one
  // course, which is the same shape as the answer-spread rule needing to be
  // measured per module as well as per course.
  {
    const perCourseQuarter = {};
    for (const q of bank) {
      const qn = QUARTER_OF_LESSON.get(q.lesson) || 1;
      const course = String(q.lesson).startsWith('sl-') ? 'sciencelab' : 'herbalism';
      (perCourseQuarter[`${course}|${qn}`] ||= []).push(analyse(q.prompt, vocabFor(q)).meanSentence);
    }
    for (const [key, means] of Object.entries(perCourseQuarter)) {
      const [course, qn] = key.split('|');
      const floor = QUARTER_CAPS[qn]?.floorSentence || 0;
      if (!floor || means.length < 20) continue;
      const mean = means.reduce((a, b) => a + b, 0) / means.length;
      if (mean < floor) {
        errors.push(
          `${course} Quarter ${qn} questions average ${mean.toFixed(1)} words a sentence, below the floor ` +
            `of ${floor}. A whole course written down to an earlier quarter's level is invisible in the ` +
            `quarter-wide average, which is exactly why this is measured per course.`
        );
      } else {
        notes.push(`${course} Q${qn}: ${means.length} questions averaging ${mean.toFixed(1)} words a sentence (floor ${floor})`);
      }
    }
  }

  for (const [qn, means] of Object.entries(perQuarter)) {
    const floor = QUARTER_CAPS[qn]?.floorSentence || 0;
    if (!floor) continue;
    const mean = means.reduce((a, b) => a + b, 0) / means.length;
    if (mean < floor) {
      errors.push(
        `Quarter ${qn} questions average ${mean.toFixed(1)} words a sentence, below the floor of ` +
          `${floor}. Quarters 3 and 4 are supposed to be HARDER than Quarter 1. A question written ` +
          `down to an earlier quarter's level is a question that stopped teaching her anything.`
      );
    } else {
      notes.push(`Quarter ${qn} bank averages ${mean.toFixed(1)} words a sentence (floor ${floor})`);
    }
  }

  let worstSentence = 0;
  let worstHard = 0;
  for (const q of bank) {
    const { sentence: CAP_SENTENCE, hard: CAP_HARD, choiceWords: CAP_CHOICE_WORDS } = capsFor(q);
    const p = analyse(q.prompt, vocabFor(q));
    worstSentence = Math.max(worstSentence, p.meanSentence);
    worstHard = Math.max(worstHard, p.hardRate);
    if (p.meanSentence > CAP_SENTENCE) {
      errors.push(
        `${q.id}: prompt averages ${p.meanSentence.toFixed(1)} words a sentence (cap ${CAP_SENTENCE})`
      );
    }
    // A RATE is the wrong tool on a five-word prompt. "Which part makes the
    // seeds?" with one three-syllable word in it scores 20% and looks like a
    // wall of text; the first run of this check failed four perfectly readable
    // questions for exactly that reason. Below a dozen words the honest question
    // is not what proportion are long, it is how MANY are — and one is fine.
    // A RATE is the wrong tool on a short prompt, so below a dozen words the
    // honest question is how MANY long words there are, not what proportion.
    // v3.9: that allowance scales with the quarter for the same reason the caps
    // do — one hard word in a short Q1 prompt is a wall, and in Q4 it is the
    // lesson. Q1/Q2 allow one, Q3/Q4 allow two.
    const shortAllowance = CAP_SENTENCE >= 14 ? 2 : 1;
    const overRate = p.hardRate > CAP_HARD;
    const tooMany = p.words < 12 ? p.hardCount > shortAllowance : overRate;
    if (tooMany) {
      errors.push(
        `${q.id}: ${p.hardCount} long word${p.hardCount === 1 ? '' : 's'} in ${p.words} ` +
          `(${(p.hardRate * 100).toFixed(0)}%, cap ${CAP_HARD * 100}%): ${p.hardWords.join(', ')}`
      );
    }
    const longest = Math.max(...q.choices.map((c) => String(c).split(/\s+/).length));
    if (longest > CAP_CHOICE_WORDS) {
      errors.push(`${q.id}: longest answer choice is ${longest} words (cap ${CAP_CHOICE_WORDS})`);
    }
  }
  notes.push(
    `reading load: worst prompt ${worstSentence.toFixed(1)} words/sentence, ` +
      `worst long-word rate ${(worstHard * 100).toFixed(0)}%`
  );
}

// ---------------------------------------------------------------------------
// 7 & 8. Every form is the right length, and covers only taught material
// ---------------------------------------------------------------------------
{
  const weeks = allWeeks();
  for (const week of weeks) {
    for (const attempt of [1, 2, 3]) {
      const form = buildWeeklyTest(week.id, { attempt });
      if (!form) {
        errors.push(`${week.id}: no form could be built at all`);
        continue;
      }
      // PER COURSE (v3.34). Every re-take of a two-day course was reported as a
      // short paper here, three times over, because this read the global eight.
      // "A short paper quietly changes what the percentage means" is still the
      // rule — it is just that five IS this course's paper.
      const want = planFor(week.course).testSize;
      if (form.questionIds.length !== want) {
        errors.push(
          `${week.id} attempt ${attempt}: ${form.questionIds.length} questions, expected ${want}. ` +
            `A short paper quietly changes what the percentage means.`
        );
      }
      if (new Set(form.questionIds).size !== form.questionIds.length) {
        errors.push(`${week.id} attempt ${attempt}: the same question appears twice on one paper`);
      }
      // Nothing from a lesson taught AFTER this week.
      //
      // PER COURSE, v3.25. This used to slice the global week list, which was
      // the same thing as "this course" while there was only one course. With
      // The Science Lab registered it stopped being the same thing: its first
      // week sits at index 32 of the global list, so every Herbalism week
      // counted as "already taught" for a science paper and the science course
      // counted as taught for late Herbalism ones. The engine was always right
      // — weeksBefore() filters by course — so this only ever mismeasured.
      const courseWeeks = weeks.filter((w) => w.course === week.course);
      const here = courseWeeks.findIndex((w) => w.id === week.id);
      const allowed = new Set(courseWeeks.slice(0, here + 1).flatMap((w) => w.lessons));
      for (const qid of form.questionIds) {
        const q = bankItemById(qid);
        if (!allowed.has(q.lesson)) {
          errors.push(
            `${week.id} attempt ${attempt}: asks ${qid}, from ${q.lesson}, which is taught LATER. ` +
              `That is a test on material she has not been given.`
          );
        }
      }
      // Interleaving: every week after the first OF ITS OWN COURSE must reach
      // backwards. A course's first week has nothing behind it and correctly
      // sits eight questions from itself.
      if (here > 0) {
        const currentLessons = new Set(week.lessons);
        const older = form.questionIds.filter((qid) => !currentLessons.has(bankItemById(qid).lesson));

        // ---- THE RULE, NOT THE ENGINE'S ARITHMETIC (v3.34) ----
        //
        // This demanded exactly WEEKLY_TEST.fromEarlierWeeks — a hard two. On a
        // five-question paper the engine correctly reaches back once, and this
        // reported it as a fault three times over.
        //
        // Copying the engine's formula here would make the check agree with the
        // engine by construction and test nothing. So it asserts the two things
        // that actually matter and are true of any paper size:
        //
        //   AT LEAST ONE  — a week that reaches back nowhere is not interleaved,
        //                   and interleaving is why she still knows week 1 in March.
        //   AT MOST A QUARTER — beyond that, the score filed as this week's
        //                   grade mostly is not this week's work.
        if (older.length < 1) {
          errors.push(
            `${week.id} attempt ${attempt}: no questions from earlier weeks at all. ` +
              `Interleaving is why she still knows week 1 in March.`
          );
        }
        if (older.length * 4 > form.questionIds.length) {
          errors.push(
            `${week.id} attempt ${attempt}: ${older.length} of ${form.questionIds.length} questions ` +
              `come from earlier weeks — over a quarter of a paper filed as this week's grade`
          );
        }
      }
    }
  }

  for (const quarterId of ['herbalism-q1', 'herbalism-q2']) {
    const form = buildQuarterTest(quarterId, { attempt: 1 });
    if (!form) {
      errors.push(`${quarterId}: no quarter form could be built`);
      continue;
    }
    if (form.questionIds.length !== QUARTER_TEST.total) {
      errors.push(
        `${quarterId}: quarter test has ${form.questionIds.length} questions, expected ${QUARTER_TEST.total}`
      );
    }
    if (new Set(form.questionIds).size !== form.questionIds.length) {
      errors.push(`${quarterId}: the quarter test repeats a question`);
    }
    // It must genuinely span the quarter, not just the last week. Twenty-four
    // questions cannot touch all eight weeks AND stay random, so the bar is the
    // MODULE: an exam that misses a whole module is not cumulative.
    const q = Number(quarterId.slice(-1));
    const modulesThisQuarter = HERBALISM_MODULES.filter((m) => m.quarter === q);
    const modulesHit = new Set(
      form.questionIds.map((qid) => {
        const lesson = bankItemById(qid).lesson;
        return modulesThisQuarter.find((m) => m.lessons.includes(lesson))?.n;
      }).filter((x) => x != null)
    );
    if (modulesHit.size !== modulesThisQuarter.length) {
      errors.push(
        `${quarterId}: the quarter exam only reaches ${modulesHit.size} of ` +
          `${modulesThisQuarter.length} modules. It is supposed to be cumulative.`
      );
    }
  }
  notes.push('every weekly and quarter form is the right length and never asks about untaught lessons');
}

// ---------------------------------------------------------------------------
// 8b. No screen still tells her about a unit test
//
// Written because of a real one. My Courses was hand-typed HTML that said
// "52 lessons across the year" and "4 unit tests + a quarter test" long after
// the course became 96 lessons a year and the weekly test replaced the unit
// test. Every automated check passed. The data was right and the screen was
// lying, because nothing connected them.
//
// The engine-level rule (no lesson in a WEEK and a UNIT) cannot catch this —
// there is no lesson involved, just stale words on a page a nine-year-old reads.
//
// Comments are stripped first, on purpose. The history of why units existed is
// worth keeping in the source; what must not survive is copy she can SEE.
//
// ---- ⚠️ KHAN'S UNIT TEST IS A DIFFERENT INSTRUMENT WITH THE SAME NAME ----
//
// Added v3.95, and it is the SIXTH time a check in this project has failed
// correct content. v3.94 put Khan's own links on the grading screen and matched
// Khan's wording deliberately — Khan calls them unit tests, on the page Gigi is
// copying a score off. This rule was written about THIS APP's unit test, which
// the weekly test replaced at v3.8, and it does not know the difference.
//
// ⚠️ AND IT HAD ALREADY COST A DEPLOY. v3.94 was red from the day it was built
// and nobody ran this check — its own run status says 11 of 39. netlify.toml
// runs `npm run check && npm run build`, so the deploy failed and the live site
// correctly stayed on v3.93. The guard worked; nothing read the reason.
//
// ⚠️ SO THE EXEMPTION IS ENUMERATED BY NAME AND SCOPED TO ONE FILE — the same
// discipline check-publish-safety uses, and for the reason v3.76 gives: a guard
// that holds by luck is not a guard. A heuristic ("allow it near the word
// Khan") would quietly re-admit the stale app copy this rule exists to catch.
//
// ⚠️ AND IT IS A RATCHET, like KNOWN_OVER in check-lesson-prose. Each line below
// must still be ON SCREEN. Reword one and this FAILS until its line is deleted,
// so an exemption cannot outlive the thing it was granted for.
// ---------------------------------------------------------------------------
const KHAN_UNIT_TEST_COPY = [
  {
    file: 'ParentDashboard.jsx',
    text: 'unit test ↗',
    why: "the link to Khan's unit test on the grading screen — v3.94, Khan's own wording"
  },
  {
    file: 'ParentDashboard.jsx',
    text: 'no unit test on Khan',
    why: 'said out loud where Khan built no test, rather than left as an absence — v3.94'
  }
];

{
  const { readFileSync, readdirSync, statSync } = await import('node:fs');
  const files = [];
  (function walk(dir) {
    for (const e of readdirSync(dir)) {
      const full = resolve(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (e.endsWith('.jsx')) files.push(full);
    }
  })(resolve(ROOT, 'src/components'));

  for (const f of files) {
    let src = readFileSync(f, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
      .replace(/^\s*\/\/.*$/gm, '');       // whole-line comments

    // Khan's instrument, enumerated above. Removed before the search so every
    // OTHER use of the phrase in this file still fails.
    for (const ok of KHAN_UNIT_TEST_COPY) {
      if (f.endsWith(ok.file)) src = src.split(ok.text).join('');
    }

    const hit = /unit tests?/i.exec(src);
    if (hit) {
      const short = f.slice(f.indexOf('src'));
      errors.push(
        `${short} still shows the words "${hit[0]}" to her. The weekly test replaced the unit ` +
          `test at v3.8. A screen that describes a test the app no longer has is a screen nobody ` +
          `reconnected to the data.`
      );
    }
  }
  if (!errors.length) {
    notes.push(`${files.length} screens checked: none still mention a unit test`);
  }

  // ---- THE RATCHET ----
  //
  // Every exemption must still be on screen. Reword one and this fails until
  // its line is deleted — so the list cannot quietly outlive its reason, which
  // is how five earlier exemptions in this app survived the thing they were for.
  for (const ok of KHAN_UNIT_TEST_COPY) {
    const target = files.find((f) => f.endsWith(ok.file));
    if (!target) {
      errors.push(
        `check-assessment exempts "${ok.text}" in ${ok.file} and that file no longer exists. ` +
          `Delete the exemption.`
      );
      continue;
    }
    if (!readFileSync(target, 'utf8').includes(ok.text)) {
      errors.push(
        `check-assessment still exempts "${ok.text}" in ${ok.file}, and that text is no longer ` +
          `there — ${ok.why}. An exemption that outlives its reason is how the phrase creeps ` +
          `back. Delete the exemption.`
      );
    }
  }

}

// ---------------------------------------------------------------------------
// 9. A re-take must be a different paper
// ---------------------------------------------------------------------------
{
  for (const week of allWeeks()) {
    const first = buildWeeklyTest(week.id, { attempt: 1 });
    const second = buildWeeklyTest(week.id, {
      attempt: 2,
      alreadyAsked: first.questionIds
    });
    const overlap = second.questionIds.filter((id) => first.questionIds.includes(id));
    if (overlap.length > RETAKE.maxRepeatedQuestions) {
      errors.push(
        `${week.id}: a re-take repeats ${overlap.length} of ${planFor(week.course).testSize} questions ` +
          `(cap ${RETAKE.maxRepeatedQuestions}). She would be showing she remembers the paper, ` +
          `not the material.`
      );
    }
  }
  notes.push(`a re-take repeats at most ${RETAKE.maxRepeatedQuestions} questions of ${WEEKLY_TEST.total}`);
}

// ---------------------------------------------------------------------------
// 10. The same attempt always builds the same paper
// ---------------------------------------------------------------------------
{
  // Without this, refreshing the page mid-test would deal her a fresh set of
  // questions and silently throw away everything she had answered.
  for (const week of allWeeks()) {
    const a = buildWeeklyTest(week.id, { attempt: 1 }).questionIds.join(',');
    const b = buildWeeklyTest(week.id, { attempt: 1 }).questionIds.join(',');
    if (a !== b) {
      errors.push(`${week.id}: building the same attempt twice gave two different papers`);
    }
  }
  const q1 = buildQuarterTest('herbalism-q1', { attempt: 1 }).questionIds.join(',');
  const q2 = buildQuarterTest('herbalism-q1', { attempt: 1 }).questionIds.join(',');
  if (q1 !== q2) errors.push('the quarter test is not reproducible across two builds');
  else notes.push('every paper rebuilds identically — a page refresh cannot lose her answers');
}

// ---------------------------------------------------------------------------
// 10b. Grading, banding and unlocking
// ---------------------------------------------------------------------------
{
  const unit = allWeeks()[0];
  const form = buildWeeklyTest(unit.id, { attempt: 1 });

  // All right → Got it.
  const perfect = {};
  for (const qid of form.questionIds) perfect[qid] = bankItemById(qid).answer;
  const g1 = gradeTest(form, perfect);
  if (g1.percent !== 100 || g1.band.id !== 'got-it') {
    errors.push(`a perfect paper graded ${g1.percent}% / ${g1.band.id}`);
  }
  if (g1.revisit.length) errors.push('a perfect paper still sent her back to lessons');

  // All wrong → Let's go back, and every lesson in the unit named.
  const awful = {};
  for (const qid of form.questionIds) awful[qid] = (bankItemById(qid).answer + 1) % 4;
  const g2 = gradeTest(form, awful);
  if (g2.percent !== 0 || g2.band.id !== 'go-back') {
    errors.push(`a paper with nothing right graded ${g2.percent}% / ${g2.band.id}`);
  }
  if (!g2.revisit.length) errors.push('a failed paper named no lessons to go back to — a dead end');

  // Unanswered counts as wrong AND is flagged as skipped, so "ran out of time"
  // and "did not know it" stay distinguishable in the record.
  const partial = { [form.questionIds[0]]: bankItemById(form.questionIds[0]).answer };
  const g3 = gradeTest(form, partial);
  if (g3.rows.filter((r) => r.skipped).length !== form.questionIds.length - 1) {
    errors.push('skipped questions are not being flagged as skipped');
  }

  // Band boundaries, exactly where config says they are.
  if (bandFor(0.9).id !== 'got-it') errors.push('90% is not Got it');
  if (bandFor(0.89).id !== 'nearly') errors.push('89% is not Nearly there');
  if (bandFor(0.7).id !== 'nearly') errors.push('70% is not Nearly there');
  if (bandFor(0.69).id !== 'go-back') errors.push("69% is not Let's go back");

  // A weekly test must not open before its lessons are read.
  const none = weekTestReady(unit, []);
  if (none.ready) errors.push(`${unit.id}: the test opened with none of its lessons read`);
  const all = weekTestReady(unit, unit.lessons);
  if (!all.ready) errors.push(`${unit.id}: the test stayed shut with every lesson read`);
  const partialRead = weekTestReady(unit, unit.lessons.slice(0, 1));
  if (partialRead.ready) errors.push(`${unit.id}: the test opened with only one lesson read`);

  // The quarter exam must not open before every weekly test in that quarter.
  for (const qref of ['herbalism-q1', 'herbalism-q2']) {
    const qn = Number(qref.slice(-1));
    if (quarterTestReady(qref, {}).ready) {
      errors.push(`${qref}: the quarter exam opened with no weekly tests sat`);
    }
    const qAll = {};
    for (const w of allWeeks().filter((w) => w.quarter === qn)) {
      qAll[w.id] = [{ fraction: 0.5, dayKey: '2026-01-01' }];
    }
    if (!quarterTestReady(qref, qAll).ready) {
      errors.push(`${qref}: the quarter exam stayed shut with all eight weekly tests sat`);
    }
    // And it must not open on the OTHER quarter's tests.
    const otherQ = qn === 1 ? 2 : 1;
    const qOther = {};
    for (const w of allWeeks().filter((w) => w.quarter === otherQ)) {
      qOther[w.id] = [{ fraction: 0.5, dayKey: '2026-01-01' }];
    }
    if (quarterTestReady(qref, qOther).ready) {
      errors.push(`${qref}: the quarter exam opened on another quarter's weekly tests`);
    }
  }

  // Re-takes wait two days.
  const today = '2026-09-10';
  const sameDay = retakeStatus([{ fraction: 0.4, dayKey: today }], today);
  if (sameDay.allowed) {
    errors.push(
      'a failed test could be re-taken the same day. That measures short-term memory and files it as knowledge.'
    );
  }
  const twoDays = retakeStatus([{ fraction: 0.4, dayKey: '2026-09-08' }], today);
  if (!twoDays.allowed) errors.push('a re-take was still blocked after two full days');
  const passedWell = retakeStatus([{ fraction: 0.95, dayKey: '2026-09-01' }], today);
  if (passedWell.allowed) errors.push('a test passed at 95% still offered a re-take');
  const tooMany = retakeStatus(
    [
      { fraction: 0.4, dayKey: '2026-09-01' },
      { fraction: 0.5, dayKey: '2026-09-04' },
      { fraction: 0.6, dayKey: '2026-09-07' }
    ],
    today
  );
  if (tooMany.allowed) errors.push(`a fourth attempt was allowed (cap ${RETAKE.maxAttempts})`);

  notes.push('grading, bands, unlocking and the two-day re-take rule all behave as written');
}

// ---------------------------------------------------------------------------
// 11. The review boxes
// ---------------------------------------------------------------------------
{
  const start = '2026-09-01';
  let item = newReviewItem('t-hb101a', 'lesson', start);
  if (item.dueOn !== addDays(start, 1)) {
    errors.push('a brand new question is not due tomorrow — same-day repetition is not spacing');
  }

  // Six correct answers must walk it all the way up, and the gaps must grow.
  let day = start;
  const gaps = [];
  for (let i = 0; i < REVIEW_INTERVALS.length; i++) {
    day = item.dueOn;
    const before = item.box;
    item = applyReviewAnswer(item, true, day);
    if (item.box !== Math.min(REVIEW_INTERVALS.length - 1, before + 1)) {
      errors.push(`a correct answer did not move box ${before} up`);
    }
    gaps.push(REVIEW_INTERVALS[item.box]);
  }
  for (let i = 1; i < gaps.length; i++) {
    if (gaps[i] < gaps[i - 1]) {
      errors.push(`the review gaps do not expand: ${gaps.join(', ')}`);
      break;
    }
  }
  if (item.box !== REVIEW_INTERVALS.length - 1) {
    errors.push(`six correct answers left the question in box ${item.box}, not the top box`);
  }

  // One miss resets it all the way.
  const missed = applyReviewAnswer(item, false, '2026-12-01');
  if (missed.box !== 0) errors.push('a missed question did not reset to box 0');
  if (missed.dueOn !== addDays('2026-12-01', 1)) {
    errors.push('a missed question is not due back tomorrow');
  }
  if (missed.missed !== 1) errors.push('the miss was not counted');

  // A warm-up must never reach for a lesson she has not read.
  const readLessons = ['hb-1-01', 'hb-1-02'];
  const eligible = itemsForLessons(readLessons).map((q) => q.id);
  const picked = pickWarmUp({}, dayKeyOf(), eligible, 3);
  if (picked.length !== 3) errors.push(`warm-up picked ${picked.length} questions, expected 3`);
  for (const id of picked) {
    if (!eligible.includes(id)) {
      errors.push(
        `warm-up offered ${id}, from a lesson she has not read. That is an ambush, not spaced review.`
      );
    }
  }
  // And with nothing read, it must offer nothing rather than falling back to
  // the whole bank.
  if (pickWarmUp({}, dayKeyOf(), [], 3).length !== 0) {
    errors.push('warm-up produced questions when she has read no lessons at all');
  }

  // Merging two machines: the LOWER box wins.
  const laptop = { questionId: 'x', box: 4, dueOn: '2026-11-01', seen: 5, missed: 1, lastSeen: '2026-09-27' };
  const gigis = { questionId: 'x', box: 0, dueOn: '2026-09-28', seen: 6, missed: 3, lastSeen: '2026-09-28' };
  const merged = pickReviewItem(laptop, gigis);
  if (merged.box !== 0 || merged.dueOn !== '2026-09-28') {
    errors.push(
      'merging two machines kept the HIGHER box. That quietly retires a question she has actually lost.'
    );
  }
  if (merged.seen !== 6 || merged.missed !== 3) {
    errors.push('merging double-counted or lost the seen/missed history');
  }

  notes.push(
    `review boxes expand ${REVIEW_INTERVALS.join(' → ')} days, a miss resets to box 0, ` +
      `and a merge keeps the more cautious of two machines`
  );
}

// ---------------------------------------------------------------------------
// 12. The practice gate and the exit ticket (v3.1)
// ---------------------------------------------------------------------------
{
  const { practiceGateResult, PRACTICE_GATE, EXIT_TICKET } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
  const { pickLessonRead } = await import(pathToFileURL(resolve(ROOT, 'src/lib/mergeBackup.js')).href);

  const ok = (n) => Array.from({ length: n }, () => ({ correct: true }));
  const mix = (right, wrong) => [...ok(right), ...Array.from({ length: wrong }, () => ({ correct: false }))];

  // On a 3-question check: 3/3 and 2/3 pass, 1/3 and 0/3 do not. That is the
  // same bar his 80% produces, stated in whole questions because a percentage
  // over three items is noise dressed as a measurement.
  if (!practiceGateResult(mix(3, 0)).passed) errors.push('practice gate: 3 of 3 did not pass');
  if (!practiceGateResult(mix(2, 1)).passed) errors.push('practice gate: 2 of 3 did not pass');
  if (practiceGateResult(mix(1, 2)).passed) errors.push('practice gate: 1 of 3 passed — it should not');
  if (practiceGateResult(mix(0, 3)).passed) errors.push('practice gate: 0 of 3 passed — it should not');

  // A lesson with no check questions must not be treated as a failure. Several
  // of hers could legitimately end without one.
  if (!practiceGateResult([]).passed) errors.push('practice gate: a lesson with no check was failed');

  // The extra practice must be capped, and the cap must be reachable from the
  // bank — five questions per lesson against a 3-question check means 6 allowed
  // and only 5 available, which is fine; 0 available would not be.
  const g = practiceGateResult(mix(0, 3));
  if (g.extraAllowed !== 3 * PRACTICE_GATE.extraMultiple) {
    errors.push(`practice gate: extra cap is ${g.extraAllowed}, expected ${3 * PRACTICE_GATE.extraMultiple}`);
  }
  for (const l of ALL_LESSONS) {
    if (itemsForLesson(l.id).length === 0) {
      errors.push(`${l.id}: the practice gate has no bank questions to serve as extra practice`);
    }
  }

  // -------------------------------------------------------------------------
  // EVERY LESSON MUST OWN ENOUGH QUESTIONS FOR THE SPLIT GIGI CHOSE.
  //
  // Written because thirteen lessons carried FIVE bank questions each while the
  // other 243 carried ten, for twenty-one versions, and nothing counted them.
  // Both the master plan and the build log called hb-1-01..13 "still flat
  // cards" and meant the PROSE. Half a bank was never mentioned by either.
  //
  // The bar is DERIVED from LESSON_TEST, never typed. If the split ever moves
  // from 6+4, this assertion moves with it and cannot quietly fall behind — the
  // exact drift that has cost this project something four separate times.
  //
  // Negative test: drop one question from any lesson and this goes red.
  // -------------------------------------------------------------------------
  const { LESSON_TEST, LESSON_BANK_MINIMUM } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
  if (LESSON_BANK_MINIMUM !== LESSON_TEST.practice + LESSON_TEST.scored) {
    errors.push(
      `LESSON_BANK_MINIMUM is ${LESSON_BANK_MINIMUM} but the split needs ` +
        `${LESSON_TEST.practice + LESSON_TEST.scored} — a hand-typed minimum is a minimum that drifts`
    );
  }
  const thin = ALL_LESSONS.filter((l) => itemsForLesson(l.id).length < LESSON_BANK_MINIMUM).map(
    (l) => `${l.id} (${itemsForLesson(l.id).length})`
  );
  if (thin.length) {
    errors.push(
      `${thin.length} lesson(s) own fewer than ${LESSON_BANK_MINIMUM} bank questions, so ` +
        `${LESSON_TEST.practice} practice + ${LESSON_TEST.scored} scored cannot be dealt from them: ` +
        thin.join(', ')
    );
  } else {
    notes.push(
      `every one of the ${ALL_LESSONS.length} lessons owns at least ${LESSON_BANK_MINIMUM} bank ` +
        `questions — enough for ${LESSON_TEST.practice} practice inside the lesson and ` +
        `${LESSON_TEST.scored} scored at the end, with the bar derived from the split, not typed`
    );
  }

  // The gate must not lock the door.
  if (PRACTICE_GATE.blocking) {
    errors.push(
      'the practice gate is set to block. A nine-year-old behind a wall she cannot pass stops ' +
        'opening the app, and then nothing else in here matters.'
    );
  }

  // The exit ticket must stay out of the record and out of the review boxes.
  if (EXIT_TICKET.scored) {
    errors.push('the exit ticket is scored — the test is already graded and filed');
  }
  if (EXIT_TICKET.movesReviewBoxes) {
    errors.push(
      'the exit ticket moves the review boxes. She read the answer thirty seconds earlier; ' +
        'counting that as a retrieval pushes a question she does not know into a longer interval.'
    );
  }
  if (EXIT_TICKET.maxQuestions < 1 || EXIT_TICKET.maxQuestions > 3) {
    errors.push(`exit ticket length is ${EXIT_TICKET.maxQuestions} — 1 to 3 is the sane range`);
  }

  // Merging two machines must keep the LATEST practice result, not the best —
  // otherwise a lesson she has since fumbled quietly loses its flag.
  const sept = { lessonId: 'hb-1-01', lastReadAt: '2026-09-01T10:00:00Z', reads: 1, practice: { passed: true } };
  const march = { lessonId: 'hb-1-01', lastReadAt: '2027-03-01T10:00:00Z', reads: 1, practice: { passed: false } };
  if (pickLessonRead(sept, march).practice.passed !== false) {
    errors.push('merging two machines kept the BEST practice result, hiding a lesson she has since fumbled');
  }
  if (pickLessonRead(march, sept).practice.passed !== false) {
    errors.push('the practice merge is not symmetric — it depends which machine is called local');
  }

  notes.push(
    `practice gate: more than ${PRACTICE_GATE.maxMisses} miss serves up to ${PRACTICE_GATE.extraMultiple}× ` +
      `extra practice, never blocks, and every lesson has bank questions to serve`
  );
  notes.push(
    `exit ticket: ${EXIT_TICKET.maxQuestions} questions, unscored, and deliberately does not move the review boxes`
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// THE RIGHT ANSWER MOVES AROUND — IN EVERY COURSE, NOT JUST ONE — v3.46
//
// ---- THE RULE, AND WHERE IT HAS ACTUALLY BEEN LIVING ----
//
// At v3.24 a first draft of a bank had 42 of 60 answers in slot B and none in
// slot D. A child who spots that scores 70% knowing nothing. The rule written
// then: no slot over 40%, no slot unused, per module AND per course.
//
// ⚠️ THAT RULE HAS ONLY EVER BEEN ENFORCED ON THE SCIENCE LAB.
//
// It lives in `check-sciencelab.mjs`, which imports SCIENCELAB_COURSE_BANK and
// SCIENCELAB_BANKS and nothing else. Herbalism's 895 questions, Social Studies'
// 480 and The Human Body's 80 have never been measured by it.
//
// A FILE NAMED AFTER ONE COURSE NEVER STANDS IN FOR THE WHOLE APP — v3.25's
// rule, which was applied to `check-standards` at v3.27 when it imported
// ALL_HERBALISM_LESSONS and called it "every lesson in the app". This is the
// same fault, in a different check, found the same way: by adding a course.
//
// ---- HOW IT WAS FOUND ----
//
// The Human Body's Module 2 bank landed at A16 B35 C23 D6 — 44%, over the bar —
// and every one of the twenty-six checks went green. The number was only seen
// because it was printed by hand while wiring the course up.
//
// Herbalism reads 35% at its worst, which is inside the bar and nowhere near
// the even spread the other courses hold. It was never checked either.
// ---------------------------------------------------------------------------
{
  const { APP_COURSES: DATA_COURSES } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/appCourses.js')).href);
  const { ALL_BANK_ITEMS: EVERY_Q, BANKS: EVERY_BANK } = await import(pathToFileURL(resolve(ROOT, 'src/data/assessments/appBank.js')).href);
  const LETTER = ['A', 'B', 'C', 'D'];
  const spreadOf = (qs) => {
    const s = [0, 0, 0, 0];
    for (const q of qs) if (typeof q.answer === 'number' && q.answer >= 0 && q.answer < 4) s[q.answer]++;
    return s;
  };

  for (const course of DATA_COURSES) {
    const ids = new Set(course.lessons.map((l) => l.id));
    const qs = EVERY_Q.filter((q) => ids.has(q.lesson));
    if (!qs.length) continue;
    const s = spreadOf(qs);
    const worst = Math.max(...s);
    const share = worst / qs.length;
    if (s.includes(0)) {
      errors.push(
        `${course.id}: no correct answer is ever in slot ${LETTER[s.indexOf(0)]} across all ` +
          `${qs.length} questions. A slot she never needs is a slot she learns to skip.`
      );
    }
    if (share > 0.4) {
      errors.push(
        `${course.id}: ${worst} of ${qs.length} answers sit in slot ${LETTER[s.indexOf(worst)]} ` +
          `(${Math.round(share * 100)}%). Over 40% and guessing one letter beats knowing nothing ` +
          `by too much. Spread: ${s.join('/')}.`
      );
    }
    notes.push(`${course.id}: answer spread ${s.join('/')} — one letter throughout scores ${Math.round(share * 100)}%`);
  }

  // PER MODULE TOO. A course can look even while one module is all slot A —
  // averaging hides exactly the thing the rule was written about.
  for (const [key, bank] of Object.entries(EVERY_BANK)) {
    if (!Array.isArray(bank) || !bank.length) continue;
    const s = spreadOf(bank);
    const worst = Math.max(...s);
    const share = worst / bank.length;
    if (s.includes(0)) {
      errors.push(`${key}: no correct answer is ever in slot ${LETTER[s.indexOf(0)]} across ${bank.length} questions`);
    }
    if (share > 0.4) {
      errors.push(
        `${key}: ${worst} of ${bank.length} answers sit in slot ${LETTER[s.indexOf(worst)]} ` +
          `(${Math.round(share * 100)}%) — over 40% inside a single module`
      );
    }
  }
}

// Report
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// BATCH A — EVIDENCE SEPARATION. Added v3.56.
//
// ---- THE RULE THIS ENFORCES ----
//
// BLUEPRINT_A_LOCAL_FIRST §3.10.6, and it is the whole reason the field exists:
//
//   "skillMastery is computed from instruction, practice, review only.
//    A WRONG ANSWER ON UNTAUGHT MATERIAL IS INFORMATION, NOT A GRADE."
//
// The Check-In asks Azianna things nobody has taught her, deliberately — that
// is how a placement instrument finds a ceiling. Nine of her seventy-four
// answers were wrong on purpose. If those ever land in the same number as a
// lesson she has been taught, the app reports a deficit IT CREATED, and then
// serves her material to fix a gap that was never there.
//
// Until v3.56 the separation was an ACCIDENT OF STORAGE — diagnostic answers
// happened to live in their own table. That stops being true the moment
// somebody adds a table, which is exactly what v8 did.
// ---------------------------------------------------------------------------
{
  const { readFileSync } = await import('node:fs');
  const {
    EVIDENCE_SOURCES, EVIDENCE_SOURCE_IDS, MASTERY_EVIDENCE,
    isEvidenceSource, countsTowardMastery, ATTEMPT_STATE_IDS, attemptStateOf
  } = await import(pathToFileURL(resolve(ROOT, 'src/config/evidence.js')).href);

  // ---- 1. The standard's six must all exist. `test` is the declared extension. ----
  const REQUIRED = ['instruction', 'practice', 'review', 'diagnostic', 'benchmark', 'external'];
  for (const id of REQUIRED) {
    if (!isEvidenceSource(id)) {
      errors.push(`EVIDENCE_SOURCES is missing "${id}", which §3.4 names explicitly`);
    }
  }
  const extras = EVIDENCE_SOURCE_IDS.filter((id) => !REQUIRED.includes(id));
  if (extras.length > 1 || (extras.length === 1 && extras[0] !== 'test')) {
    errors.push(
      `EVIDENCE_SOURCES has undeclared extensions: ${extras.join(', ')}. The standard's list is six ` +
        `and "test" is the one extension this app declares, in the header of that file. Adding a ` +
        `seventh silently is how a vocabulary stops meaning anything.`
    );
  }

  // ---- 2. THE RULE ITSELF. Diagnostic evidence may never count. ----
  if (countsTowardMastery('diagnostic')) {
    errors.push(
      'EVIDENCE_SOURCES says diagnostic answers count toward mastery. The Check-In asks her things ' +
        'nobody has taught her, on purpose — §3.10.6: "a wrong answer on untaught material is ' +
        'information, not a grade." This is anti-pattern 15, and it makes the app report a deficit ' +
        'it created.'
    );
  }
  if (countsTowardMastery('benchmark') || countsTowardMastery('external')) {
    errors.push(
      'a benchmark or external result is counted toward mastery. §3.10.5: external results are ' +
        'evidence for placement and growth only, and never write skillMastery directly.'
    );
  }
  for (const id of ['instruction', 'practice', 'review']) {
    if (!MASTERY_EVIDENCE.includes(id)) {
      errors.push(`"${id}" does not count toward mastery, and §3.10.6 names it as one of the three that must`);
    }
  }
  // Derived, never typed: the list and the flags cannot disagree.
  const recomputed = EVIDENCE_SOURCE_IDS.filter((id) => EVIDENCE_SOURCES[id].countsTowardMastery);
  if (recomputed.join('|') !== MASTERY_EVIDENCE.join('|')) {
    errors.push('MASTERY_EVIDENCE disagrees with the countsTowardMastery flags it is derived from');
  }

  // ---- 3. attemptState, and the three rows already sitting in her backup. ----
  for (const id of ['complete', 'abandoned', 'expired']) {
    if (!ATTEMPT_STATE_IDS.includes(id)) {
      errors.push(`ATTEMPT_STATES is missing "${id}" (anti-pattern 19)`);
    }
  }
  const abandoned = attemptStateOf({ endedAt: null, answered: 0 });
  const finished = attemptStateOf({ endedAt: 123, answered: 8 });
  const stamped = attemptStateOf({ endedAt: null, answered: 0, attemptState: 'expired' });
  if (abandoned !== 'abandoned') {
    errors.push(
      `a sitting she opened and left reads as "${abandoned}", not "abandoned". Her own backup holds ` +
        `THREE of these — endedAt null, answered 0 — and "an abandoned attempt is not a failed ` +
        `assessment."`
    );
  }
  if (finished !== 'complete') errors.push(`a finished sitting reads as "${finished}", not "complete"`);
  if (stamped !== 'expired') errors.push('attemptStateOf overrides a state that was actually stored');

  // ---- 4. EVERY ANSWER PATH MUST SAY WHERE IT CAME FROM. ----
  //
  // Asserted by reading the source, because a path that forgets to record is
  // invisible from the data — there is simply nothing there, and nothing is
  // what it looked like before this existed.
  const PATHS = [
    ['src/store/useAppStore.js', 'recordWarmUp', "'review'", 'the morning warm-up'],
    ['src/store/useAppStore.js', 'recordAttempt', "'test'", 'a unit or quarter test'],
    ['src/store/useAppStore.js', 'submitAnswer', "'diagnostic'", 'the Check-In'],
    ['src/components/Lessons/LessonReader.jsx', 'function finish', "'instruction'", "the lesson's Quick check"],
    ['src/components/Lessons/LessonReader.jsx', 'function answerExtra', "'practice'", "the practice gate's extra round"]
  ];
  for (const [file, fnName, source, human] of PATHS) {
    const src = readFileSync(resolve(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
    const at = src.indexOf(fnName);
    if (at < 0) {
      errors.push(`${file}: ${fnName} is gone, and it is the path that records ${human}`);
      continue;
    }
    const body = src.slice(at, at + 2600);
    if (!/recordItemEvents\(/.test(body)) {
      errors.push(
        `${human} does not record an item event. Every answer she gives has to say where it came ` +
          `from, or the separation between a taught lesson and an untaught Check-In question is ` +
          `back to being an accident of which table it landed in.`
      );
    } else if (!body.includes(source)) {
      errors.push(`${human} records an item event without evidenceSource: ${source}`);
    }
  }

  // ---- 5. A BASELINE MAY NEVER BE OVERWRITTEN. ----
  const dbSrc = readFileSync(resolve(ROOT, 'src/db/db.js'), 'utf8');
  const capture = dbSrc.slice(dbSrc.indexOf('export async function captureBaselineOnce'));
  if (!/if \(existing\) return existing;/.test(capture.slice(0, 400))) {
    errors.push(
      'captureBaselineOnce will overwrite an existing baseline. A baseline that can move is not a ' +
        'baseline — §3.4: "a baseline cannot be reconstructed after the fact."'
    );
  }
  const { pickBaseline } = await import(pathToFileURL(resolve(ROOT, 'src/lib/mergeBackup.js')).href);
  const early = { trackId: 'herbalism', capturedOn: '2026-08-14T10:00:00.000Z' };
  const late = { trackId: 'herbalism', capturedOn: '2026-09-01T10:00:00.000Z' };
  if (pickBaseline(late, early) !== early || pickBaseline(early, late) !== early) {
    errors.push(
      'merging two machines does not keep the EARLIER baseline. Taking the later one moves the ' +
        'starting line forward and understates everything measured from it — every other merge rule ' +
        'in this app prefers the newer side, and this is the one that must not.'
    );
  }
  if (pickBaseline(null, late) !== late || pickBaseline(early, null) !== early) {
    errors.push('pickBaseline drops a baseline when only one machine has it');
  }

  notes.push(
    `evidence separation: ${EVIDENCE_SOURCE_IDS.length} sources, ${MASTERY_EVIDENCE.length} count ` +
      `toward mastery — the Check-In is not one of them; all five answer paths record where they came from`
  );
  notes.push('a baseline is written once and the earlier one wins a merge');
}

// ---------------------------------------------------------------------------
// THE RETRIEVE BEAT — §3.2's LADDER OPENER, ADDED v3.61.
//
// The ladder is retrieve → teach → check → teach → check → practice → apply →
// test. This app started at `teach` for its whole life.
//
// Gigi, Aug 19, on being offered beat TIMING instead of beat TYPES: "Isn't this
// the beat that will assist with retention and learning? I don't want any short
// cuts. I want my grandbaby to learn and improve." beat.entered/beat.completed
// measures her; the ladder teaches her. She was right and the order changed.
//
// THE RULE THAT MATTERS MOST HERE IS THE OLDEST ONE IN THE PROJECT: a lesson
// may only ask for what it gave her. That does not lapse because the asking
// happens at the TOP of the page instead of the bottom.
// ---------------------------------------------------------------------------
{
  const { pickLessonRetrieve } = await import(pathToFileURL(resolve(ROOT, 'src/lib/reviewQueue.js')).href);
  const { LESSON_RETRIEVE } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
  const { isEvidenceSource } = await import(pathToFileURL(resolve(ROOT, 'src/config/evidence.js')).href);
  const { readFileSync } = await import('node:fs');

  const DAY = '2026-08-19';
  const boxes = (ids, over = {}) =>
    Object.fromEntries(
      ids.map((id) => [
        id,
        { questionId: id, box: 1, seen: 1, dueOn: '2026-01-01', lastSeen: '2026-08-01', ...over }
      ])
    );

  // ---- 1. IT MAY NEVER ASK ABOUT THE LESSON IT OPENS. ----
  //
  // ⚠️ THE FIRST VERSION OF THIS FIXTURE DID NOT BITE, AND A TARGETED NEGATIVE
  // TEST SAID SO. Every id was given the same box, seen and due date, so when
  // the exclusion was deleted the picker still happened to reach for the TAUGHT
  // questions first and the leak never appeared. THE ASSERTION PASSED ON BROKEN
  // CODE, and it only came to light because assertion 4 was removed to see
  // whether this one could speak for itself. It could not.
  //
  // The fixture is now stacked AGAINST the rule: this lesson's own questions are
  // the overdue, never-seen, most-attractive ones and the taught pool is not due
  // at all. Delete the exclusion and they are the only thing the picker wants.
  const taught = ['hb-m1-01-q1', 'hb-m1-01-q2', 'hb-m1-02-q1'];
  const thisLesson = ['hb-m1-03-q1', 'hb-m1-03-q2'];
  const got = pickLessonRetrieve(
    {
      ...boxes(taught, { dueOn: '2099-01-01', seen: 9, box: 5 }),
      ...boxes(thisLesson, { dueOn: '2026-01-01', seen: 0, box: 0 })
    },
    DAY,
    [...taught, ...thisLesson],
    thisLesson,
    2,
    2
  );
  const leaked = got.filter((id) => thisLesson.includes(id));
  if (leaked.length) {
    errors.push(
      `the retrieve beat offered ${leaked.join(', ')} — questions from the lesson it is opening. ` +
        `Nobody has taught her that yet. "A lesson may only ask for what it gave her" does not ` +
        `lapse because the asking moved to the top of the page.`
    );
  }
  if (got.length !== 2) {
    errors.push(`the retrieve beat returned ${got.length} questions from a pool of 3 taught ones.`);
  }

  // ---- 2. FIRST LESSON OF A COURSE: NOTHING TAUGHT, NOTHING SHOWN. ----
  if (pickLessonRetrieve({}, DAY, [], [], 2, 2).length !== 0) {
    errors.push(
      'the retrieve beat produced questions on the first lesson of a course, where nothing has ' +
        'been taught to pull back.'
    );
  }

  // ---- 3. ALL OR NOTHING. A doorway with one question is a routine. ----
  const thin = pickLessonRetrieve(boxes(['hb-m1-01-q1']), DAY, ['hb-m1-01-q1'], [], 2, 2);
  if (thin.length !== 0) {
    errors.push(
      `a pool of one produced ${thin.length} question(s). Below the minimum the beat renders ` +
        `nothing — an app that performs the routine whether or not it has anything to ask is an ` +
        `app talking about itself, and a nine-year-old reads that faster than an adult does.`
    );
  }

  // ---- 4. IT MUST NOT REHEARSE HER FOR THIS AFTERNOON'S TEST. ----
  const today = ['hb-m1-01-q1'];
  const afterToday = pickLessonRetrieve(
    boxes(['hb-m1-01-q1', 'hb-m1-02-q1', 'hb-m1-02-q2']),
    DAY,
    ['hb-m1-01-q1', 'hb-m1-02-q1', 'hb-m1-02-q2'],
    today,
    2,
    2
  );
  if (afterToday.includes('hb-m1-01-q1')) {
    errors.push(
      'the retrieve beat served a question she has already answered today. The same guard that ' +
        'stops the morning warm-up leaking into an afternoon test applies here — otherwise the ' +
        'doorway rehearses her for a score that goes in the record.'
    );
  }

  // ---- 5. IT IS NOT A GATE. ----
  if (LESSON_RETRIEVE.blocking !== false) {
    errors.push(
      'LESSON_RETRIEVE.blocking is true. "What do you remember?" must never become "prove you ' +
        'deserve the lesson" — §3.6: the failure threshold is a WELLBEING parameter, not a tuning ' +
        'parameter. If this is ever changed deliberately, INVERT this assertion with the reason ' +
        'and the date, the way check-yearplan was inverted at v3.23.'
    );
  }
  if (!isEvidenceSource('review')) {
    errors.push('the retrieve beat records as `review` and that is not a declared evidence source.');
  }

  // ---- 6. AND IT HAS TO BE ON THE SCREEN, ABOVE THE TEACHING. ----
  //      Rule 21: what RENDERS. A component defined and never placed is the
  //      failure this project has now recorded four times.
  const reader = readFileSync(resolve(ROOT, 'src/components/Lessons/LessonReader.jsx'), 'utf8');
  const tag = reader.indexOf('<RetrieveBeat');
  // ---- ANCHOR ON THE JSX TAG, NOT THE FIELD NAME. ----
  // The first draft of this compared against `lesson.hook.text` and went red on
  // correct code: that string's FIRST appearance is inside lessonChunks(), the
  // read-aloud function near the top of the file, hundreds of lines above any
  // JSX. It was measuring "is the tag below a function definition", which is
  // not a question about the screen. Rule 21, caught by the assertion's own
  // first run — an assertion satisfied by a NAME rather than a USE, for the
  // fourth time in this project, and this one was mine.
  const hook = reader.indexOf('<MarigoldMessage text={lesson.hook.text}');
  if (tag === -1) {
    errors.push('RetrieveBeat is never rendered. §3.2 opens the ladder with it.');
  } else if (hook !== -1 && tag > hook) {
    errors.push(
      'RetrieveBeat renders BELOW the hook. A retrieve beat after the teaching has started is ' +
        'not a retrieve beat.'
    );
  }
  if (!/if \(questions\.length === 0\) return null;/.test(reader)) {
    errors.push('the retrieve beat renders a panel even when it has nothing to ask.');
  }
  if (!/recordReview\(/.test(reader)) {
    errors.push(
      'the retrieve beat asks questions and records nothing. Retrieval that does not move the ' +
        'review boxes is the warm-up hole again, on a different screen.'
    );
  }
  // ---- IT MUST SAY WHICH LESSON THE QUESTIONS CAME FROM. ----
  //
  // Gigi, Aug 19, looking at Social Studies lesson 2: "Why would there be
  // questions about something she hasn't learned yet?"
  //
  // She HAD learned it — ss-m1-01-q1 belongs to Lesson 1, which she read on
  // Aug 17 and whose first beat says "Britain and France fought for years over
  // land in America." THE BEAT WAS RIGHT AND THE SCREEN WAS UNREADABLE. It said
  // "2 quick ones from earlier in this course", which is vague enough that the
  // one adult who can audit this had no way to check it, and her first reading
  // was that a nine-year-old was being tested on material nobody had taught her.
  //
  // The fix was a sentence. WITHOUT THIS CHECK THE FIX IS A HABIT, NOT A RULE:
  // rewrite it back to the vague wording and the app runs, renders, and passes
  // all 26. That is how the body-image rule survived sixteen modules unenforced.
  if (!/\{sourceLine\}/.test(reader)) {
    errors.push(
      'the retrieve panel no longer names the lesson its questions came from. "From Lesson 1" ' +
        'went back to "from earlier in this course" — the exact wording that read, to the adult ' +
        'responsible for her record, like the app testing a child on untaught material.'
    );
  }
  // DERIVED FROM THE QUESTIONS, NEVER TYPED. A hard-coded "Lesson 1" would
  // satisfy the assertion above and be wrong on every other lesson in the app.
  if (!/const sourceLine = \[\.\.\.new Set\(\s*questions\.map/.test(reader)) {
    errors.push(
      'the retrieve panel names a lesson that is not derived from the questions it is showing. ' +
        'Rule 20 — a hand-typed lesson name is right once and wrong 255 times.'
    );
  }

  // HER READING 3.46 IS A LISTENING SCORE, so a retrieval question she cannot
  // read is a retrieval she does not get. The lesson's own read-aloud walks
  // lessonChunks() and knows nothing about this panel.
  if (!/chunksForItem\(q\)/.test(reader)) {
    errors.push(
      'the retrieve beat has no read-aloud. Ten of her thirteen Check-In reading questions were ' +
        'read to her, and the lesson read-aloud does not cover this panel.'
    );
  }

  // The v3.56 lie, kept out by name: this panel IS recorded and may not say
  // otherwise. It has to say so plainly instead.
  if (!/Gigi can see these/.test(reader)) {
    errors.push(
      'the retrieve beat does not tell her it is kept. It moves her review boxes and writes an ' +
        'itemEvent — a screen may not let a child believe otherwise, which check-delivery has ' +
        'failed the build over since v3.56.'
    );
  }

  notes.push(
    `the retrieve beat opens every lesson that has ${LESSON_RETRIEVE.minimumPool}+ questions to ` +
      `pull back, never asks about the lesson it opens, never blocks, and renders nothing when ` +
      `there is nothing to ask`
  );
}

console.log('\nPetal & Pestle — assessment check\n');
for (const n of notes) console.log(`  · ${n}`);

if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors.slice(0, 15)) console.error(`  ✗ ${e}`);
  if (errors.length > 15) console.error(`  ...and ${errors.length - 15} more`);
  process.exit(1);
}
console.log('\nEvery test is sound, readable, safe, and never asks about a lesson she has not had.\n');
