// ---------------------------------------------------------------------------
// Run with: node scripts/check-curriculum-volume.mjs
//
// THE PROBLEM THIS EXISTS TO CATCH — and it would have caught it in March.
//
// The schedule was built as a real school day: three app-taught courses, four
// days a week, thirty-six weeks. The curriculum was sized as a sample: 130
// lessons planned, 14 written, against 288 the schedule actually demands.
//
// Two documents describing the same year, disagreeing by a factor of twenty,
// and every one of the seventeen checks passing the whole time. `check-schedule`
// proved the day added up. `check-assessment` proved the questions were sound.
// NOTHING compared the number of school days to the number of lessons.
//
// That is the exact shape of the failure the parent named as "it feels all over
// the place." It is arithmetic, and arithmetic is what a script is for.
//
// ---- WHAT IT ASSERTS ----
//
// 1. The week adds up: new-lesson days + the review day = the school week.
// 2. The quarter adds up: teaching weeks x lessons per week = lessons per
//    quarter, and the exam week is the week after the last teaching week.
// 3. The year adds up: quarters x weeks = 36, and a course running all four
//    quarters needs exactly YEAR.lessonsPerCoursePerYear lessons.
// 4. Every app course names a real block on the real schedule.
// 5. Two courses sharing a block must not share a quarter. The 2:10 block runs
//    The Science Lab in Q1 and Q3 and The Human Body in Q2 and Q4; if both ever
//    claimed the same quarter, one of them would silently never be taught.
// 6. Every quarter of every block is spoken for. A block with an empty quarter
//    is a thirty-minute hole in January, which is exactly what happened to
//    Technology and Social Studies in her brother's app.
// 7. `lessonsWritten` on each course matches the lessons actually in the data.
//    A hand-typed count is a count that drifts.
// 8. A course marked 'complete' actually has its full year of lessons.
//
// ---- WHY IT DOES NOT FAIL ON AN UNFINISHED COURSE ----
//
// Same reasoning as check-standards. A build that is red for six months is a
// build nobody reads. So the shortfall is PRINTED IN FULL on every run — course
// by course, with the real number — and fails only when a course claims to be
// complete and is not.
//
// The number cannot hide. It just cannot stop the build while it is honest
// about itself.
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const { WEEK, QUARTER, YEAR, APP_COURSES, lessonsRequired } = await import(pathToFileURL(resolve(ROOT, 'src/config/curriculumPlan.js')).href);
const { DEFAULT_SCHEDULE } = await import(pathToFileURL(resolve(ROOT, 'src/config/schedule.js')).href);
const {
  isRotatingBlock,
  rotatingCourseIds,
  daysPerWeekFor,
  BLOCK_ROTATION,
  ROTATION_COURSE_IDS,
  ROTATION_ENDS,
  ROTATION_LABELS,
  hasRunOut,
  courseFinished,
  blockLabelOnDay
} = await import(pathToFileURL(resolve(ROOT, 'src/lib/rotatingBlock.js')).href);
const { WEEKS: REGISTERED_WEEKS } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
const { readFileSync } = await import('node:fs');
// v3.8 — ONE SOURCE. Counting two arrays was how the count drifted: new module
// files landed and the counter could not see them. Restored after a stale copy
// of this script briefly clobbered the fix on Aug 16.
const { ALL_HERBALISM_LESSONS } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/herbalismCourse.js')).href);

const { ALL_SCIENCELAB_LESSONS } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/sciencelabCourse.js')).href);

// v3.34. `social: 0` was a hard-coded zero here, and it was correct for exactly
// as long as the course had nothing in it. The moment Module 1 landed, this
// check reported "claims 4 lessons written; the data has 0" — which is the
// right failure for the wrong reason: the DATA had four, the CHECK had a
// literal. Counting from the course file is the same fix v3.8 made for
// Herbalism after two arrays drifted apart.
const { ALL_SOCIAL_LESSONS } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/socialCourse.js')).href);

// ---------------------------------------------------------------------------
// ⚠️ THIS HELD `humanbody: 0` AS A LITERAL UNTIL v3.46, AND IT IS THE THIRD
// TIME THE SAME LINE HAS BEEN WRONG IN THE SAME FILE.
//
// At v3.34 it held `social: 0` while Social Studies was being written, and the
// note then was exact: *"Right failure, wrong reason. A NUMBER THAT HAPPENS TO
// BE CORRECT TODAY IS NOT A MEASUREMENT."* The literal was changed to
// ALL_SOCIAL_LESSONS.length — and a fresh `humanbody: 0` was written on the
// line below it. So the fix was applied to the instance and not to the shape.
//
// The moment The Human Body's Module 1 landed, this check reported "claims 4
// lessons written; the data has 0" — blaming curriculumPlan for a number that
// was correct, because the check was holding a zero it had typed itself.
//
// Derived from the app-wide door now. Course five needs no edit here, and a
// course that exists in the data cannot be invisible to this check again. Same
// reason `check-standards` stopped importing ALL_HERBALISM_LESSONS at v3.27 and
// the reading exemption stopped being a list at v3.25: a hand-kept list of
// courses is a list that goes stale one course at a time.
//
// The three single-course imports above are kept ONLY as a cross-check: if the
// app-wide door and a course's own file disagree about how many lessons exist,
// that is the v3.25 failure and it is worth failing on.
// ---------------------------------------------------------------------------
const { APP_COURSES: DATA_COURSES } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/appCourses.js')).href);

const WRITTEN = Object.fromEntries(DATA_COURSES.map((c) => [c.id, c.lessons.length]));

// The cross-check that uses these lives further down, AFTER `errors` exists.
// ⚠️ It was written here first, and it would have CRASHED rather than reported:
// `const errors = []` is declared below this point, so `errors.push` inside a
// branch up here throws "Cannot access 'errors' before initialization". It
// passed every run only because the three counts agreed and the branch never
// ran — a check that cannot fire is indistinguishable from a check that works,
// right up until the day it is needed. Found by forcing it to fire.
const OWN_COUNTS = {
  herbalism: ALL_HERBALISM_LESSONS.length,
  sciencelab: ALL_SCIENCELAB_LESSONS.length,
  social: ALL_SOCIAL_LESSONS.length
};

/**
 * Quarters where a block is deliberately open, with the reason.
 *
 * Anything NOT on this list that has no course is a hole, not a decision —
 * the same shape as check-links' DELIBERATELY_UNLINKED. A reason has to be
 * written here, in code, rather than remembered.
 */
const DECLARED_EMPTY = {
  'blk-science': {
    quarters: [2, 4],
    why: 'The Human Body moved to the rotating 2:45 block at v3.22, so this half hour goes back to the garden and her projects. The Science Lab keeps Q1 and Q3.'
  },
  // v3.31. A ROTATING block can now be open on SOME DAYS of a quarter rather
  // than all of them, which is why `days` exists. Social Studies runs Q1-Q3, so
  // in Q4 Monday and Wednesday have no course while Tuesday and Thursday still
  // hold The Human Body. Omitting `days` means the whole block, every day —
  // which is what blk-science above means.
  'blk-social': {
    quarters: [4],
    days: [1, 3],
    why: 'Social Studies runs Q1-Q3 — 48 lessons for roughly 37 Georgia elements, where two quarters would have given 32 and taught fewer lessons than there are elements. In Q4 its Monday and Wednesday go back to the garden and her projects. The Human Body keeps Tue and Thu all year.'
  }
};

/**
 * Is this block declared open on this quarter and weekday?
 *
 * A declaration with no `days` covers every day. This is the ONE place that
 * question is answered, so the rotating and non-rotating branches cannot drift
 * apart on what "declared" means.
 */
function isDeclaredOpen(blockId, q, dow = null) {
  const d = DECLARED_EMPTY[blockId];
  if (!d || !d.quarters.includes(q)) return false;
  if (!d.days) return true;
  return dow === null ? false : d.days.includes(dow);
}

/** course id -> rotation key. The forward map lives in rotatingBlock.js. */
const ROTATION_KEY_OF = Object.fromEntries(
  Object.entries(ROTATION_COURSE_IDS).map(([key, courseId]) => [courseId, key])
);

const errors = [];
const notes = [];

// A COURSE'S OWN FILE AND THE APP-WIDE DOOR MUST AGREE ABOUT ITS SIZE.
//
// Two arrays that disagree about a course is the v3.25 failure — one of them is
// what a screen actually reads, and it is not always the one being counted.
for (const [id, own] of Object.entries(OWN_COUNTS)) {
  if (WRITTEN[id] !== own) {
    errors.push(
      `${id}: its own course file holds ${own} lessons and the app-wide door holds ${WRITTEN[id]}. ` +
        `Every screen reads the door, so the door is the number that matters — and the two ` +
        `drifting apart is how a whole course shipped unreachable at v3.25.`
    );
  }
}

// ---------------------------------------------------------------------------
// 1-3. The shape adds up
// ---------------------------------------------------------------------------
{
  // v3.10: the school week is teaching days + a review-and-test day + a catch-up
  // day. It was newLessonDays + 1 while the app modelled only four days.
  if (WEEK.newLessonDays + 1 + (WEEK.catchUpDay ? 1 : 0) !== WEEK.schoolDays) {
    errors.push(
      `the week does not add up: ${WEEK.newLessonDays} lesson days + 1 review day is not ${WEEK.schoolDays} school days`
    );
  }
  // v3.10: the review-and-test day closes the TEACHING week; the catch-up day
  // closes the school week. Before Friday existed those were the same day, and
  // this assertion said "it has to be the last one". Now it has to be the last
  // TEACHING one — straight after the three lessons, with nothing taught between.
  if (WEEK.reviewDay !== WEEK.newLessonDays + 1) {
    errors.push(
      `the review day is day ${WEEK.reviewDay} but the three lessons end on day ` +
        `${WEEK.newLessonDays} — the test has to come straight after them`
    );
  }
  if (WEEK.catchUpDay && WEEK.catchUpDay !== WEEK.schoolDays) {
    errors.push(
      `the catch-up day is day ${WEEK.catchUpDay} of a ${WEEK.schoolDays}-day week — ` +
        `Friday has to be the last one`
    );
  }
  if (WEEK.interleavedFromEarlier >= WEEK.weeklyTestQuestions) {
    errors.push('the weekly test is entirely interleaved questions and tests nothing from this week');
  }

  const perQuarter = QUARTER.teachingWeeks * WEEK.newLessonDays;
  if (perQuarter !== QUARTER.lessonsPerQuarter) {
    errors.push(
      `the quarter does not add up: ${QUARTER.teachingWeeks} teaching weeks x ${WEEK.newLessonDays} lessons is ${perQuarter}, not ${QUARTER.lessonsPerQuarter}`
    );
  }
  if (QUARTER.teachingWeeks + 1 !== QUARTER.weeks) {
    errors.push(`the quarter is ${QUARTER.weeks} weeks but only ${QUARTER.teachingWeeks} teach and one examines`);
  }
  if (QUARTER.examWeek !== QUARTER.weeks) {
    errors.push('the exam week is not the last week of the quarter');
  }
  if (QUARTER.weeklyTestsPerQuarter !== QUARTER.teachingWeeks) {
    errors.push('every teaching week gets a weekly test — those two numbers have to match');
  }

  if (YEAR.quarters * QUARTER.weeks !== YEAR.weeks) {
    errors.push(`${YEAR.quarters} quarters x ${QUARTER.weeks} weeks is not a ${YEAR.weeks}-week year`);
  }
  if (YEAR.quarters * QUARTER.lessonsPerQuarter !== YEAR.lessonsPerCoursePerYear) {
    errors.push('lessons per year does not equal quarters x lessons per quarter');
  }
  if (YEAR.quarters * QUARTER.weeklyTestsPerQuarter !== YEAR.weeklyTestsPerCoursePerYear) {
    errors.push('weekly tests per year does not equal quarters x weekly tests per quarter');
  }

  if (!errors.length) {
    notes.push(
      `the week, the quarter and the year all add up: ${WEEK.newLessonDays} lessons + a test day` +
      `${WEEK.catchUpDay ? ' + a catch-up day' : ''}, ` +
        `${QUARTER.teachingWeeks} teaching weeks + an exam week, ${YEAR.quarters} quarters = ${YEAR.weeks} weeks`
    );
  }
}

// ---------------------------------------------------------------------------
// 4-6. Blocks and quarters
// ---------------------------------------------------------------------------
{
  const blockIds = new Set(DEFAULT_SCHEDULE.map((b) => b.id));
  const byBlock = new Map();

  for (const c of APP_COURSES) {
    if (!blockIds.has(c.block)) {
      errors.push(`${c.title} names block "${c.block}", which is not on the schedule`);
      continue;
    }
    if (!c.quarters.length) {
      errors.push(`${c.title} runs in no quarters at all`);
    }
    for (const q of c.quarters) {
      if (q < 1 || q > YEAR.quarters) errors.push(`${c.title} claims quarter ${q}`);
    }
    if (!byBlock.has(c.block)) byBlock.set(c.block, []);
    byBlock.get(c.block).push(c);
  }

  for (const [blockId, courses] of byBlock) {
    const block = DEFAULT_SCHEDULE.find((b) => b.id === blockId);

    // ---- A BLOCK MAY NOW SHARE A QUARTER, IF IT ROTATES BY DAY (v3.22) ----
    //
    // Gigi: "social studies and the human body to be 2 days a week. They can
    // rotate." So blk-social holds Social Studies on Mon/Wed and The Human Body
    // on Tue/Thu, every quarter. Two courses in one quarter is no longer a bug
    // there — but it IS still a bug anywhere the rotation does not actually
    // cover them, which is what this now tests instead of just allowing it.
    if (isRotatingBlock(blockId)) {
      const rota = BLOCK_ROTATION[blockId];
      const inRota = new Set(rotatingCourseIds());
      for (const c of courses) {
        const key = ROTATION_KEY_OF[c.id] || c.id;
        if (!inRota.has(key)) {
          errors.push(
            `${c.title} sits in the rotating block ${block.label} but no day of the week gives it to them — ` +
              `it would be on the timetable and never taught`
          );
          continue;
        }
        const days = daysPerWeekFor(key);
        const declared = c.lessonDaysPerWeek;
        if (days !== declared) {
          errors.push(
            `${c.title} declares ${declared} lesson days a week but the rotation gives it ${days} — ` +
              `every lesson count in the plan is computed from the declared number`
          );
        }
      }
      // ---- AND THE REVERSE, which the negative test caught me missing ----
      //
      // The check above walks the courses ASSIGNED to this block and asks
      // whether the rotation gives them days. It never asked the other way
      // round. Moving Social Studies to a different block left `blk-social`
      // still handing Monday and Wednesday to a course that was no longer
      // there — two empty half-hours a week — and every assertion passed.
      //
      // A rotation naming a course that does not live in this block is a
      // timetable promising a lesson nobody owns.
      const here = new Set(courses.map((c) => ROTATION_KEY_OF[c.id] || c.id));
      for (const named of new Set(Object.values(rota))) {
        if (!here.has(named)) {
          errors.push(
            `${block.label} gives days to "${named}", but no course in this block is ${named} — ` +
              `a hole in her week that every other assertion would call full`
          );
        }
      }

      // ---- NOTHING LEFT ON THE FLOOR, QUARTER BY QUARTER (v3.31) ----
      //
      // This loop used to ask only "does every weekday have a course?" and it
      // was right until a rotating course stopped running the whole year.
      // Social Studies now ends after Q3, so `rota` still names it on Monday
      // and Wednesday and it is simply NOT THERE for the last eight weeks —
      // a hole this check could not see, because it never looked at quarters.
      //
      // A day with no course is a hole UNLESS it is declared, with a reason.
      for (let q = 1; q <= YEAR.quarters; q += 1) {
        for (const dow of [1, 2, 3, 4]) {
          const key = rota[dow];
          if (!key) {
            if (isDeclaredOpen(blockId, q, dow)) continue;
            errors.push(
              `${block.label} has no course on day ${dow} — a ${block.minutes}-minute hole in her week`
            );
            continue;
          }
          const owner = courses.find((c) => (ROTATION_KEY_OF[c.id] || c.id) === key);
          if (owner && owner.quarters.includes(q)) continue;
          if (isDeclaredOpen(blockId, q, dow)) continue;
          errors.push(
            `${block.label} gives day ${dow} of quarter ${q} to ${owner ? owner.title : key}, ` +
              `which does not run in quarter ${q} — a ${block.minutes}-minute hole on her timetable ` +
              `with a subject name sitting on top of it. Declare it in DECLARED_EMPTY with a reason ` +
              `or give the day to a course that is actually there.`
          );
        }
      }

      // ---- A ROTATING COURSE THAT ENDS EARLY MUST SAY SO, IN THE LIB ----
      //
      // The timetable has no calendar and must not grow one (see catchUp.js).
      // What opens the slot at render time is her progress, and the rule for
      // WHICH courses can run out lives in rotatingBlock.js where a check can
      // reach it. If that table and curriculumPlan.js disagree about how long a
      // course runs, one of them is lying to her screen.
      for (const c of courses) {
        const key = ROTATION_KEY_OF[c.id] || c.id;
        const spansYear = c.quarters.length === YEAR.quarters;
        const ends = ROTATION_ENDS[key];
        if (!spansYear && !ends) {
          errors.push(
            `${c.title} runs only Q${c.quarters.join('/Q')} but is not in ROTATION_ENDS — ` +
              `its days would keep its name on the timetable in a quarter it does not run`
          );
        }
        if (spansYear && ends) {
          errors.push(
            `${c.title} runs all ${YEAR.quarters} quarters but ROTATION_ENDS says it stops after ` +
              `Q${ends.lastQuarter} — a full-year course that the app will switch off early`
          );
        }
        if (ends && Math.max(...c.quarters) !== ends.lastQuarter) {
          errors.push(
            `ROTATION_ENDS says ${c.title} stops after Q${ends.lastQuarter}, but curriculumPlan.js ` +
              `runs it to Q${Math.max(...c.quarters)}. The lib and the plan disagree.`
          );
        }
        if (ends && !ends.why) {
          errors.push(`ROTATION_ENDS.${key} has no reason written down`);
        }
      }

      // ---- AND HER TIMETABLE MUST ACTUALLY APPLY THE RULE ----
      //
      // `lessonsRead` is an optional argument, and omitting it restores the
      // pre-v3.31 behaviour exactly — the course keeps its days forever and
      // nothing anywhere goes red. An optional argument that must always be
      // passed is a rule nobody enforces, so this reads the screen's SOURCE and
      // fails if it stopped passing it. Same shape as check-delivery asserting
      // every screen reads the app-wide bank.
      if (Object.keys(ROTATION_ENDS).length) {
        const src = readFileSync(resolve(ROOT, 'src/components/Schedule/TodayView.jsx'), 'utf8');
        // A regex cannot do this. The first draft used `fn\\([^)]*\\)`, which
        // stops at the first close paren — so `blockLabelOnDay(b, new Date(),
        // undefined, lessonsRead)` was read as ending at `new Date()` and every
        // correct call was reported as a bare one. The check was wrong, not the
        // screen. Match the parentheses properly instead of weakening the rule.
        const callsOf = (name) => {
          const out = [];
          let i = src.indexOf(name);
          while (i !== -1) {
            let j = i + name.length;
            while (j < src.length && /\s/.test(src[j])) j += 1;
            if (src[j] === '(') {
              let depth = 0;
              let k = j;
              for (; k < src.length; k += 1) {
                if (src[k] === '(') depth += 1;
                else if (src[k] === ')') {
                  depth -= 1;
                  if (depth === 0) break;
                }
              }
              out.push(src.slice(i, k + 1));
            }
            i = src.indexOf(name, i + name.length);
          }
          // The import line names the function with no call after it.
          return out.filter((c) => c.includes('('));
        };
        for (const fn of ['blockLabelOnDay', 'blockIconOnDay']) {
          const calls = callsOf(fn);
          if (!calls.length) {
            errors.push(`TodayView no longer calls ${fn} — the rotating block would not render at all`);
            continue;
          }
          const bare = calls.filter((c) => !c.includes('lessonsRead'));
          if (bare.length) {
            errors.push(
              `TodayView calls ${fn} without lessonsRead ${bare.length} time(s) — ` +
                `the run-out rule silently does not apply and Social Studies keeps Mon/Wed forever`
            );
          }
        }
      }
      const shape = Object.entries(rota)
        .map(([d, c]) => ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][d] + ' ' + c)
        .join(' · ');
      notes.push(
        `${block.label} rotates by day: ${shape} — ` +
          courses.map((c) => `${c.title} Q${c.quarters.join('/Q')}`).join(' and ') +
          `, ${courses[0].lessonDaysPerWeek} days a week each`
      );
      // The declaration is printed for a rotating block too, or the one place
      // the decision is written down is the one place nobody reads.
      if (DECLARED_EMPTY[blockId]) {
        const d = DECLARED_EMPTY[blockId];
        const dayNames = (d.days || [1, 2, 3, 4])
          .map((n) => ['', 'Mon', 'Tue', 'Wed', 'Thu'][n])
          .join(' and ');
        notes.push(
          `${block.label} is deliberately open on ${dayNames} in Q${d.quarters.join(' and Q')}: ${d.why}`
        );
      }
      continue;
    }

    const claimed = new Map();
    for (const c of courses) {
      for (const q of c.quarters) {
        if (claimed.has(q)) {
          errors.push(
            `${block.label} has two courses in quarter ${q}: ${claimed.get(q)} and ${c.title}. ` +
              `One of them would never be taught, and nothing on screen would say which.`
          );
        }
        claimed.set(q, c.title);
      }
    }
    for (let q = 1; q <= YEAR.quarters; q += 1) {
      if (!claimed.has(q)) {
        // A quarter with no course is a hole UNLESS it is declared as one, with
        // a reason. blk-science is empty in Q2 and Q4 by decision, not oversight:
        // The Human Body moved to the rotating block, and that half hour goes
        // back to the garden and her projects. A hole nobody chose is still a bug.
        const declared = DECLARED_EMPTY[blockId];
        if (declared && declared.quarters.includes(q)) continue;
        errors.push(
          `${block.label} has nothing in quarter ${q} — a ${block.minutes}-minute hole in her day, ` +
            `on the calendar, with no course behind it.`
        );
      }
    }
    if (DECLARED_EMPTY[blockId]) {
      notes.push(
        `${block.label} is deliberately open in Q${DECLARED_EMPTY[blockId].quarters.join(' and Q')}: ${DECLARED_EMPTY[blockId].why}`
      );
    }
    if (courses.length > 1) {
      const shape = courses.map((c) => `${c.title} Q${c.quarters.join('/Q')}`).join(' · ');
      notes.push(`${block.label} alternates by quarter: ${shape}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 6b. EVERY COURSE'S LESSON COUNT MATCHES ITS OWN DAYS A WEEK
//
// Found by this check's own negative test, which is the only reason it exists.
//
// v3.22 made lessons-per-week a PER-COURSE number so Social Studies and The
// Human Body could run two days a week. The negative test put the old
// one-size-fits-all line back — `quarters.length * 24` — and the check passed,
// green, while Social Studies silently went from needing 64 lessons to 96.
//
// It passed because nothing here ever asserted the arithmetic; it only reported
// the gap, and a bigger gap is not an error. A number that can be wrong without
// failing is a number nobody should plan against — and 176 lessons is the
// figure this whole project is planned against.
// ---------------------------------------------------------------------------
for (const c of APP_COURSES) {
  const days = c.lessonDaysPerWeek ?? WEEK.newLessonDays;
  const expected = c.quarters.length * QUARTER.teachingWeeks * days;
  const actual = lessonsRequired(c);
  if (actual !== expected) {
    errors.push(
      `${c.title} runs ${days} day(s) a week for ${c.quarters.length} quarter(s), which is ${expected} lessons — ` +
        `but lessonsRequired() says ${actual}. The plan and the arithmetic disagree.`
    );
  }
  if (!Number.isInteger(days) || days < 1 || days > WEEK.newLessonDays) {
    errors.push(
      `${c.title} claims ${days} lesson days a week — the teaching week only has ${WEEK.newLessonDays}`
    );
  }
  // ---- A FINISHED COURSE MAY NOT CALL ITSELF 'building' (v3.31) ----
  //
  // Herbalism had all 96 lessons it owes and said `state: 'building'` for
  // twenty-one versions, with a comment explaining that the flag meant "the
  // whole app's curriculum claim". No check ever read it that way.
  // check-standards only HARD-FAILS on an element with no lesson when the
  // owning course says 'complete' — so that one word switched the guard off
  // over 96 lessons and 10 Georgia elements, while the report printed a
  // confident "10/10 taught · BUILDING". A state that understates is not the
  // safe direction; it is the direction that stops a check from running.
  if (c.lessonsWritten >= expected && expected > 0 && c.state !== 'complete') {
    errors.push(
      `${c.title} has written all ${expected} lessons it owes but is marked '${c.state}' — ` +
        `check-standards only enforces element coverage on a course marked 'complete', ` +
        `so those lessons and their Georgia elements are unguarded`
    );
  }
  if (c.lessonsWritten < expected && c.state === 'complete') {
    errors.push(
      `${c.title} is marked 'complete' with ${c.lessonsWritten} of ${expected} lessons written`
    );
  }

  const q = c.weeklyTestQuestions ?? WEEK.weeklyTestQuestions;
  if (q > days * 3) {
    errors.push(
      `${c.title} sits a ${q}-question weekly test on ${days} lesson(s) a week — ` +
        `more than three questions per lesson taught is a test measuring what was never covered`
    );
  }
}
if (!errors.length) {
  notes.push(
    APP_COURSES.map((c) => `${c.title.split(' ')[0]} ${c.lessonDaysPerWeek ?? WEEK.newLessonDays}d/wk`).join(' · ') +
      ' — every lesson count computed from the course\u2019s own days, not a shared constant'
  );
}

// ---------------------------------------------------------------------------
// 7-8. What is actually written
// ---------------------------------------------------------------------------
const rows = [];
{
  for (const c of APP_COURSES) {
    const required = lessonsRequired(c);
    const written = WRITTEN[c.id] ?? 0;

    if (c.lessonsWritten !== written) {
      errors.push(
        `${c.title} claims ${c.lessonsWritten} lessons written; the data has ${written}. ` +
          `A hand-typed count is a count that drifts — fix the number in curriculumPlan.js.`
      );
    }
    if (c.state === 'complete' && written < required) {
      errors.push(
        `${c.title} is marked COMPLETE with ${written} of ${required} lessons. That is not complete.`
      );
    }
    rows.push({ c, required, written });
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// THE GARDEN & PROJECTS HAND-OVER, DRIVEN ON HER REAL DATA — v3.43
//
// ---- WHAT THE CAVEAT SAID, AND WHAT WAS ACTUALLY TRUE ----
//
// Since v3.31 both the master plan and the build log have carried this line:
//
//   "⚠️ The Garden & Projects label has still never been observed on her real
//    data. Tested against synthetic weeks; every case passes. Not claimed to
//    have been seen."
//
// The first sentence was true. The second was worse than it sounded. Searched
// at v3.43: `hasRunOut` and `courseForBlockOnDay` ARE NOT CALLED BY ANY OF THE
// TWENTY-SIX SCRIPTS. The synthetic-week testing happened once, by hand, while
// v3.31 was being written, and was never committed as anything that runs. So
// for twelve versions the honest statement was not "tested but unobserved" —
// it was "tested once, by hand, and never again".
//
// A SENTENCE IN A DOCUMENT IS NOT A TEST, which is v3.25's rule about logs
// wearing a different hat.
//
// ---- WHAT THIS ASSERTS, AND ON WHAT ----
//
// Her REAL registered weeks and their REAL lesson ids — not made-up week
// objects. Four states per rotation course:
//
//   1. nothing read            → the block is the course
//   2. every lesson but one    → still the course. The boundary is where an
//                                off-by-one lives, and "she finished 47 of 48"
//                                must not read as finished.
//   3. every lesson read       → "Garden & Projects" on the days it owns
//   4. a full-year course      → never hands over, however much she reads
//
// ---- WHAT IT STILL DOES NOT PROVE ----
//
// That the label appears on AZIANNA'S screen from AZIANNA'S saved progress.
// Only her finishing 24 weeks of Social Studies does that. This runs the real
// functions over the real week table; it does not read her IndexedDB. The
// caveat is narrowed, not deleted — and narrowing it honestly is the point.
// ---------------------------------------------------------------------------
{
  // ---- THE TWO RULES, ASSERTED DIRECTLY ----
  //
  // ⚠️ TWO NEGATIVE TESTS MISSED BEFORE THIS BLOCK EXISTED, FOR ONE REASON.
  //
  // Everything below drives the rules THROUGH hasRunOut, and hasRunOut opens
  // with `if (!ROTATION_ENDS[key]) return false;`. That early return shields
  // everything after it. So:
  //
  //   · deleting the full-year guard changed nothing, because the only
  //     full-year rotation course is The Human Body and it has no weeks, so it
  //     was already false for the OTHER reason;
  //   · inverting "unwritten is not finished" changed nothing, because the
  //     early return meant courseFinished was never reached at all.
  //
  // Both mutations were real and both passed. A rule reached only through a
  // function that short-circuits before it is a rule nothing tests — so each is
  // now asserted on its own terms, where it can fail.
  if (courseFinished('humanbody', ['hb-1-01', 'anything'])) {
    errors.push(
      'courseFinished says a course with no registered weeks is finished. UNWRITTEN IS NOT ' +
        'FINISHED (v3.31) — this is what stops a course with nothing in it handing its days to ' +
        'the garden before a single lesson exists.'
    );
  }
  if (courseFinished('a-course-that-does-not-exist', ['x', 'y'])) {
    errors.push('courseFinished says a course that does not exist is finished');
  }
  {
    // A key that is deliberately NOT in ROTATION_ENDS, with everything read.
    const anyKey = rotatingCourseIds().find((k) => !ROTATION_ENDS[k]);
    if (anyKey) {
      const cid = ROTATION_COURSE_IDS[anyKey];
      // ⚠️ A MADE-UP WEEK TABLE, AND THIS IS THE WHOLE POINT OF PASSING ONE.
      //
      // The only full-year rotation course is The Human Body, which has no
      // weeks yet. Asked about the real table, deleting the full-year guard
      // STILL returned false — because the "no weeks written" guard underneath
      // it caught the same case for a different reason. Two guards overlapped,
      // and the mutation was invisible: a negative test that CANNOT FAIL is not
      // a passing negative test (v3.28).
      //
      // hasRunOut takes its week table as an argument precisely so a check can
      // hand it a world that does not exist yet. Given one finished week, the
      // full-year guard is the ONLY thing left standing between this and true —
      // so removing it fails here, today, instead of the day Job Two ships.
      const pretendFinished = { [cid]: [{ n: 1, quarter: 1, lessons: ['made-up-lesson-1'] }] };
      if (hasRunOut(anyKey, ['made-up-lesson-1'], pretendFinished)) {
        errors.push(
          `"${anyKey}" is not in ROTATION_ENDS — it runs the whole year — and hasRunOut still ` +
            `reports it as run out. A full-year course never hands its days over, however much ` +
            `of it she has read.`
        );
      }
    }
    // And a course that DOES end must actually be capable of ending, or the
    // assertion above is guarding nothing.
    const ending = rotatingCourseIds().find((k) => ROTATION_ENDS[k]);
    if (ending) {
      const all = (REGISTERED_WEEKS[ROTATION_COURSE_IDS[ending]] || []).flatMap((w) => w.lessons || []);
      if (all.length && !hasRunOut(ending, all)) {
        errors.push(`"${ending}" is declared to end in ROTATION_ENDS but never reports running out`);
      }
      if (all.length && hasRunOut(ending, all.slice(0, -1))) {
        errors.push(
          `"${ending}" reports running out with ${all.length - 1} of ${all.length} lessons read`
        );
      }
    }
  }

  let checked = 0;
  for (const key of rotatingCourseIds()) {
    const courseId = ROTATION_COURSE_IDS[key];
    const weeks = REGISTERED_WEEKS[courseId] || [];
    const everyLesson = weeks.flatMap((w) => w.lessons || []);
    const ends = !!ROTATION_ENDS[key];
    const blockId = Object.keys(BLOCK_ROTATION).find((b) =>
      Object.values(BLOCK_ROTATION[b]).includes(key)
    );
    const block = DEFAULT_SCHEDULE.find((b) => b.id === blockId);
    if (!block) continue;

    // The weekdays this course owns in the rotation.
    const ownDays = Object.entries(BLOCK_ROTATION[blockId])
      .filter(([, v]) => v === key)
      .map(([d]) => Number(d));

    if (!everyLesson.length) {
      // Unwritten. It must NOT hand over — unwritten is not finished (v3.31).
      if (hasRunOut(key, ['anything', 'at', 'all'])) {
        errors.push(
          `"${key}" has no written weeks and still reports having run out. Unwritten is not ` +
            `finished — a course with nothing in it must never hand its days to the garden.`
        );
      }
      notes.push(`"${key}": 0 weeks written, correctly never runs out`);
      continue;
    }

    // 2026-08-17 is a Monday, so +0..+4 walks Mon to Fri.
    const dateFor = (dow) => new Date(`2026-08-${16 + dow}T14:45:00`);

    for (const dow of ownDays) {
      const date = dateFor(dow);
      const dayName = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][dow];

      // 1. nothing read
      const fresh = blockLabelOnDay(block, date, undefined, []);
      if (fresh !== ROTATION_LABELS[key]) {
        errors.push(
          `${dayName} with nothing read shows "${fresh}", not "${ROTATION_LABELS[key]}"`
        );
      }

      // 2. all but one — the boundary
      const allButOne = everyLesson.slice(0, -1);
      const nearly = blockLabelOnDay(block, date, undefined, allButOne);
      if (nearly !== ROTATION_LABELS[key]) {
        errors.push(
          `${dayName} with ${allButOne.length} of ${everyLesson.length} lessons read already shows ` +
            `"${nearly}". She has not finished ${courseId} and the block has already given her ` +
            `time away — an off-by-one here costs her a fortnight of the course.`
        );
      }

      // 3. every lesson read
      const done = blockLabelOnDay(block, date, undefined, everyLesson);
      if (ends && done !== 'Garden & Projects') {
        errors.push(
          `${dayName} with all ${everyLesson.length} ${courseId} lessons read still shows "${done}". ` +
            `${ROTATION_ENDS[key].why}`
        );
      }
      if (!ends && done !== ROTATION_LABELS[key]) {
        errors.push(
          `${dayName}: "${key}" runs the whole year and is not in ROTATION_ENDS, but reading every ` +
            `lesson changed its block to "${done}". A full-year course never hands its days over.`
        );
      }
      checked++;
    }
  }
  if (checked) {
    notes.push(
      `the Garden & Projects hand-over is driven on the REAL week table across ${checked} ` +
        `block-days — nothing read, all-but-one read, and everything read. ⚠️ STILL NOT OBSERVED ` +
        `ON AZIANNA'S OWN SAVED PROGRESS: that needs her to finish 24 Social Studies weeks.`
    );
  }
}

console.log('\nPetal & Pestle — curriculum volume check\n');
console.log(
  `  The shape: ${WEEK.newLessonDays} lessons then a review-and-test day · ` +
    `${QUARTER.teachingWeeks} teaching weeks then an exam week · ${YEAR.quarters} quarters · ${YEAR.weeks} weeks\n`
);

let totalReq = 0;
let totalWri = 0;
for (const { c, required, written } of rows) {
  totalReq += required;
  totalWri += written;
  const pct = required ? Math.round((written / required) * 100) : 100;
  const gap = required - written;
  console.log(
    `  ${c.title.padEnd(22)} Q${c.quarters.join('/')}  ${String(written).padStart(3)} / ${String(required).padEnd(3)} lessons  ${String(pct).padStart(3)}%  ${gap > 0 ? `· ${gap} still to write` : '· complete'}`
  );
}

console.log(`\n  TOTAL: ${totalWri} of ${totalReq} lessons written — ${Math.round((totalWri / totalReq) * 100)}%.`);
console.log(`  ${totalReq - totalWri} lessons still to write, plus ${YEAR.weeklyTestsPerCoursePerYear * APP_COURSES.length} weekly tests and ${YEAR.quarterExamsPerCoursePerYear * APP_COURSES.length} quarterly exams.`);
console.log(
  `\n  Printed in full on every run. Nothing here fails the build while the courses honestly\n` +
    `  say they are still being built — but the number cannot hide, and marking a course\n` +
    `  complete is a claim this script tests.`
);

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

// The old wording here was "every block is covered all four quarters". That
// stopped being true at v3.31 and would have been a check claiming more than it
// tests — in the sentence a reader actually remembers. Two blocks are now open
// by decision, and the summary says so and counts them.
{
  const openCount = Object.values(DECLARED_EMPTY).reduce(
    (n, d) => n + d.quarters.length * (d.days ? d.days.length : 4),
    0
  );
  console.log(
    `\nThe plan is internally coherent, every block is covered in every quarter except the ` +
      `${openCount} block-days declared open above, and the gap is stated.\n`
  );
}
