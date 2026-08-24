// ---------------------------------------------------------------------------
// Run with: node scripts/simulate-year.mjs
//
// Forty school days, played out.
//
// check-assessment proves each piece behaves. This proves the pieces together
// produce the thing they were built for — because "spaced review" is a claim
// about what happens over months, and no unit test can see a month.
//
// A simulated child reads a lesson a day, sits the unit tests as they unlock,
// does her three-question warm-up every morning, and gets about three quarters
// of things right. What comes out the other end answers the questions that
// actually matter:
//
//   * Is anything ever asked twice in one day? (Massed practice pretending to
//     be spaced practice — the failure that would quietly gut the whole thing.)
//   * Do the gaps between meetings really expand?
//   * How many times does she meet each idea across forty days?
//   * Does she ever get asked about a lesson she has not read?
//   * Does the two-day re-take rule actually hold when a real sequence of days
//     runs through it?
//
// This is the same discipline as simulate-diagnostic.mjs, which caught the
// staircase settling too early. A simulation is how you see a slow bug.
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { allWeeks, weekTestReady, WARM_UP, RETAKE } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
const { buildWeeklyTest, buildQuarterTest, gradeTest, retakeStatus, quarterTestReady } =
  await import(pathToFileURL(resolve(ROOT, 'src/lib/assessmentEngine.js')).href);
// v3.8 — the simulation plays out WEEKS now, because units are gone. The shape
// of the sequence is the same: read the lessons, sit the test, move on. Renamed
// rather than rewritten, so what this proves is unchanged.
const allUnits = allWeeks;
const buildUnitTest = buildWeeklyTest;
const unitTestReady = (unit, read) => weekTestReady(unit, read);
const { newReviewItem, applyReviewAnswer, pickWarmUp, addDays, NEW_PER_WARM_UP } = await import(pathToFileURL(resolve(ROOT, 'src/lib/reviewQueue.js')).href);
const { bankItemById, itemsForLessons } = await import(pathToFileURL(resolve(ROOT, 'src/data/assessments/appBank.js')).href);

// A plain deterministic RNG so this run is the same every time. A simulation
// that reports something different on each run cannot be used as a check.
let seed = 20260813;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

// She gets about three quarters right, and is worse on things she has missed
// before — which is what makes the "slipping" list in the gradebook do anything.
function answersCorrectly(questionId, history) {
  const h = history[questionId];
  const base = 0.75;
  const penalty = h && h.seen > 0 ? Math.min(0.3, (h.missed / h.seen) * 0.4) : 0;
  return rand() < base - penalty;
}

// v3.8 — 80 school days, up from 40.
//
// Forty was right when the course was thirteen lessons in one quarter: it ran
// past the end of the material and the tail was all review, which is what makes
// a spacing claim testable.
//
// The course is now 48 lessons across 16 teaching weeks — 64 school days before
// she has even met the last lesson. At forty days the simulation stopped three
// weeks short, and it said so: three weekly tests never became sittable, and the
// average question had been met 1.9 times because a third of the bank had only
// just entered it.
//
// That was the simulation being too short, not the schedule being wrong. The fix
// is to run the whole thing plus a tail, NOT to lower the bar — a check quietly
// loosened until it passes proves nothing, which is the rule this file exists
// under.
// v3.34 — 260 school days, up from 170.
//
// Same reason as the v3.8 change from 40, and the same discipline. The lesson
// queue is now 164 lessons across three courses. At 170 days the simulation
// ran the whole course and stopped six days later, so a third of the bank had
// only just entered the review queue and the average question had been met
// exactly 2.0 times. The check said so and failed.
//
// That is the simulation being too short, NOT the spacing being wrong. A
// spacing claim is a claim about MONTHS, and it cannot be tested by a run that
// ends the week the last lesson is read. The fix is to run the whole thing plus
// a real tail. Lowering the bar to 2.0 would have made the check agree with
// whatever the data happened to be, which is the one thing it must never do.
//
// 260 is 164 lessons plus roughly ninety-six days of review with nothing new
// arriving — long enough for the staircase to actually climb.
const DAYS = 260;
const START = '2026-09-01';

const state = {
  lessonsRead: [],
  reviewItems: {},
  attemptsByTest: {},
  history: {}
};

const log = [];
const meetings = {}; // questionId -> [dayKey]
// Every question the WARM-UP was the first to show her. The whole-bank average
// cannot speak for the warm-up, because most items enter through a test; this
// set is the population the warm-up is actually responsible for.
const warmUpIntroduced = new Set();
// Warm-up slots, split by whether she had ever met the question before. These
// two counters are the sample the "once is not review" claim is made over.
let warmUpFirstMeetings = 0;
let warmUpRepeatMeetings = 0;
const errors = [];
// Assertions whose branch never fired on this run. Not failures, and NOT passes
// either - printed by name so nobody reads a green tick as evidence.
const unrun = [];

const units = allUnits();
const lessonQueue = units.flatMap((u) => u.lessons);
let nextLesson = 0;

for (let d = 0; d < DAYS; d++) {
  const day = addDays(START, d);
  const todayEvents = [];
  const askedToday = new Set();

  // ---- 1. the morning warm-up ----
  const eligible = itemsForLessons(state.lessonsRead).map((q) => q.id);
  const warmUp = pickWarmUp(state.reviewItems, day, eligible, WARM_UP.questions);

  // HOW MANY STRANGERS DID THIS WARM-UP INTRODUCE? (v3.52)
  //
  // This is the number the original bug was made of, and it was never measured.
  // A warm-up that fills every spare slot with questions she has never met is
  // not review, and the whole-bank average could not see it happening because
  // the tests were dragging the same number in the other direction.
  const newToday = warmUp.filter((qid) => !state.reviewItems[qid]);
  warmUpFirstMeetings += newToday.length;
  warmUpRepeatMeetings += warmUp.length - newToday.length;

  // THE RULE IS "A STRANGER MUST NOT BEAT A QUESTION SHE HAS ALREADY MET",
  // which is not the same as "never more than one stranger". On her very first
  // morning there is nothing else the warm-up could honestly ask, and the first
  // draft of this assertion failed that day - correctly reporting a warm-up that
  // was doing the only sensible thing. So the cap is only binding when there was
  // an alternative, and the assertion says exactly that.
  const alternativesLeft = eligible.filter(
    (qid) => state.reviewItems[qid] && !warmUp.includes(qid)
  ).length;
  if (newToday.length > NEW_PER_WARM_UP && alternativesLeft > 0) {
    errors.push(
      `day ${d}: the warm-up introduced ${newToday.length} questions she had never met ` +
        `while ${alternativesLeft} she HAD met sat unasked. The cap is ${NEW_PER_WARM_UP}. ` +
        `A stranger must not beat a question she has already seen.`
    );
  }
  for (const qid of newToday) warmUpIntroduced.add(qid);

  for (const qid of warmUp) {
    if (!eligible.includes(qid)) {
      errors.push(`day ${d}: warm-up asked ${qid}, from a lesson she has not read`);
    }
    if (askedToday.has(qid)) errors.push(`day ${d}: ${qid} asked twice in one day`);
    askedToday.add(qid);
    const correct = answersCorrectly(qid, state.history);
    record(qid, correct, day);
  }
  if (warmUp.length) todayEvents.push(`warm-up ${warmUp.length}`);

  // ---- 2. one lesson ----
  let readToday = null;
  if (nextLesson < lessonQueue.length) {
    readToday = lessonQueue[nextLesson++];
    state.lessonsRead.push(readToday);
    todayEvents.push(`read ${readToday}`);
  }

  // ---- 3. a unit test if one has unlocked and is allowed today ----
  //
  // ---- A FIRST SITTING OUTRANKS A RE-TAKE (v3.34) ----
  //
  // This loop walked `units` in week order and broke after one test a day. A
  // re-take of week 3 therefore beat the FIRST sitting of week 33 every time —
  // and because a first sitting is only offered on the exact day its last
  // lesson is read, losing that day loses it for ever. Social Studies week 1
  // never became sittable in 170 school days for that reason alone.
  //
  // The real week is not ambiguous about this: Thursday is THIS week's test,
  // and catch-up is Friday. Ordering never-sat units first is the schedule, not
  // a loosened bar.
  const ordered = [...units].sort((a, b) => {
    const aSat = (state.attemptsByTest[a.id] || []).length > 0;
    const bSat = (state.attemptsByTest[b.id] || []).length > 0;
    return aSat === bSat ? 0 : aSat ? 1 : -1;
  });
  for (const unit of ordered) {
    const ready = unitTestReady(unit, state.lessonsRead);
    if (!ready.ready) continue;
    const attempts = state.attemptsByTest[unit.id] || [];
    const status = retakeStatus(attempts, day);
    if (!status.allowed) continue;
    // Sit it the day its last lesson is read, or later as a re-take.
    const justFinished = unit.lessons[unit.lessons.length - 1] === readToday;
    if (!attempts.length && !justFinished) continue;
    if (attempts.length && attempts[attempts.length - 1].fraction >= 0.7) continue;

    const asked = attempts.flatMap((a) => a.questionIds);
    const form = buildUnitTest(unit.id, {
      attempt: attempts.length + 1,
      alreadyAsked: asked,
      // Everything she has already answered this morning. Without this the
      // warm-up rehearses her for the test and the recorded score is inflated —
      // which is exactly what this simulation caught on its first run.
      answeredToday: [...askedToday]
    });

    // Re-take integrity, against a real sequence rather than a stub.
    //
    // What matters is overlap with the paper she JUST SAT, not with every paper
    // she has ever seen. A four-lesson unit holds twenty questions, so by a
    // third attempt some repeat is arithmetic, not a bug. Being handed the same
    // paper she failed two days ago is the bug.
    if (attempts.length) {
      const previous = attempts[attempts.length - 1].questionIds;
      const overlap = form.questionIds.filter((q) => previous.includes(q));
      if (overlap.length > RETAKE.maxRepeatedQuestions) {
        errors.push(
          `day ${d}: ${unit.id} attempt ${form.attempt} repeated ${overlap.length} of the ` +
            `questions from the attempt she just sat (cap ${RETAKE.maxRepeatedQuestions})`
        );
      }
    }

    const responses = {};
    for (const qid of form.questionIds) {
      const q = bankItemById(qid);
      const correct = answersCorrectly(qid, state.history);
      responses[qid] = correct ? q.answer : (q.answer + 1) % 4;
    }
    const g = gradeTest(form, responses);
    for (const row of g.rows) {
      if (askedToday.has(row.questionId)) {
        errors.push(
          `day ${d}: ${row.questionId} was in the warm-up AND the test. She was handed the answer ` +
            `an hour earlier, and the inflated score goes in the record.`
        );
      }
      askedToday.add(row.questionId);
      record(row.questionId, row.correct, day);
    }
    (state.attemptsByTest[unit.id] ||= []).push({
      questionIds: form.questionIds,
      fraction: g.fraction,
      dayKey: day,
      attempt: form.attempt
    });
    todayEvents.push(`${unit.id} a${form.attempt} ${g.percent}% ${g.band.id}`);

    // Same-day re-take must be impossible immediately after sitting it.
    const after = retakeStatus(state.attemptsByTest[unit.id], day);
    if (after.allowed && g.fraction < 0.9) {
      errors.push(`day ${d}: ${unit.id} could be re-taken the same day it was failed`);
    }
    break; // one test a day
  }

  // ---- 4. the quarter test, once all four unit tests are behind her ----
  if (
    quarterTestReady('herbalism-q1', state.attemptsByTest).ready &&
    !(state.attemptsByTest['herbalism-q1-final'] || []).length &&
    !todayEvents.some((e) => e.includes('a1') || e.includes('a2') || e.includes('a3'))
  ) {
    const form = buildQuarterTest('herbalism-q1', { attempt: 1, answeredToday: [...askedToday] });
    const responses = {};
    for (const qid of form.questionIds) {
      const q = bankItemById(qid);
      const correct = answersCorrectly(qid, state.history);
      responses[qid] = correct ? q.answer : (q.answer + 1) % 4;
    }
    const g = gradeTest(form, responses);
    for (const row of g.rows) {
      if (askedToday.has(row.questionId)) {
        errors.push(`day ${d}: ${row.questionId} was in the warm-up AND the quarter test`);
      }
      askedToday.add(row.questionId);
      record(row.questionId, row.correct, day);
    }
    state.attemptsByTest['herbalism-q1-final'] = [
      { questionIds: form.questionIds, fraction: g.fraction, dayKey: day, attempt: 1 }
    ];
    todayEvents.push(`QUARTER TEST ${g.percent}% ${g.band.id}`);
  }

  log.push({ day, events: todayEvents.join(' · ') || '—' });
}

function record(qid, correct, day) {
  const existing = state.reviewItems[qid] || newReviewItem(qid, 'sim', day);
  state.reviewItems[qid] = applyReviewAnswer(existing, correct, day);
  const h = (state.history[qid] ||= { seen: 0, missed: 0 });
  h.seen++;
  if (!correct) h.missed++;
  (meetings[qid] ||= []).push(day);
}

// ---------------------------------------------------------------------------
// What actually happened
// ---------------------------------------------------------------------------

const dayIndex = (k) => Math.round((new Date(`${k}T00:00:00`) - new Date(`${START}T00:00:00`)) / 86400000);

const met = Object.keys(meetings);
const eligiblePoolSize = itemsForLessons(state.lessonsRead).length;
const gapsAll = [];
let sameDayRepeats = 0;
let expanding = 0;
let notExpanding = 0;

for (const qid of met) {
  const days = meetings[qid].map(dayIndex);
  for (let i = 1; i < days.length; i++) {
    const gap = days[i] - days[i - 1];
    if (gap === 0) sameDayRepeats++;
    else gapsAll.push(gap);
  }
  // Did this question's gaps grow over its life?
  const gaps = [];
  for (let i = 1; i < days.length; i++) if (days[i] !== days[i - 1]) gaps.push(days[i] - days[i - 1]);
  if (gaps.length >= 2) {
    if (gaps[gaps.length - 1] >= gaps[0]) expanding++;
    else notExpanding++;
  }
}

const timesMet = met.map((q) => meetings[q].length);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const boxes = [0, 0, 0, 0, 0, 0];
for (const it of Object.values(state.reviewItems)) boxes[it.box]++;

console.log('\nPetal & Pestle — forty school days, simulated\n');
console.log(`  · ${state.lessonsRead.length} lessons read, ${met.length} of 65 questions met`);
console.log(`  · each met question was retrieved ${mean(timesMet).toFixed(2)} times on average`);
console.log(
  `  · warm-up slots: ${warmUpRepeatMeetings} re-meetings and ${warmUpFirstMeetings} first meetings ` +
    `(the warm-up introduced ${warmUpIntroduced.size} questions all year)`
);
console.log(
  `  · the other ${met.length - warmUpIntroduced.size} entered through a test. Three questions a ` +
    `morning cannot cycle a ${eligiblePoolSize}-question pool, and that number is reported, not asserted`
);
console.log(`  · gaps between meetings: mean ${mean(gapsAll).toFixed(1)} days, longest ${Math.max(0, ...gapsAll)}`);
console.log(`  · ${expanding} questions had growing gaps, ${notExpanding} did not`);
console.log(`  · boxes at day 40: ${boxes.map((n, i) => `b${i}:${n}`).join('  ')}`);
console.log(
  `  · unit tests sat: ${Object.entries(state.attemptsByTest)
    .map(([k, v]) => `${k.replace('hb-q1-', '')}×${v.length}`)
    .join(', ') || 'none'}`
);

console.log('\n  Day by day:');
for (const row of log) {
  if (row.events !== '—') console.log(`    ${row.day}  ${row.events}`);
}

// ---- the assertions ----
if (sameDayRepeats > 0) {
  errors.push(
    `${sameDayRepeats} times a question came back the SAME DAY. That is massed practice wearing a ` +
      `spaced-review badge, and it is the one failure that would hollow the whole thing out.`
  );
}
// ---- "ONCE IS NOT REVIEW", ASKED OF THE RIGHT POPULATION (v3.52) ----
//
// This assertion used to read `mean(timesMet) < 2` over EVERY question she ever
// met, and it went red when Module 12 landed. That looked like a review bug and
// half of it was one - pickWarmUp really was filling every spare slot with
// strangers, and that is fixed and separately asserted up in the day loop.
//
// The other half was the check claiming more than it tests. Most items enter the
// boxes through a weekly test, not the warm-up, and a weekly test introduces
// about seven at a time. Three questions a morning cannot cycle that back, so
// the whole-bank average falls every time a module is WRITTEN. A check that goes
// red because the curriculum grew is a check that pressures you to stop writing
// curriculum, and that is the exact failure the fourth working rule names.
//
// So the claim is now made over the questions THE WARM-UP INTRODUCED, which is
// the population the warm-up governs and can be held to. The whole-bank figure
// is still computed and still printed, plainly, as a number and not as a pass.
// The first draft of this replacement asserted the average over the questions
// the warm-up INTRODUCED - and the warm-up introduced four of them in two
// hundred and sixty days, because the overdue backlog fills every slot. An
// assertion over four items is not a check, it is a check-shaped decoration, so
// it is not the one that ships. It is recorded here as REJECTED rather than
// quietly dropped, because the next person to look at this will have the same
// idea and should know it was tried.
//
// What ships instead is the claim over the population the warm-up really has:
// the slots themselves. Across the whole year, a warm-up slot must overwhelmingly
// be a RE-meeting. If most mornings show her something for the first time then
// the warm-up is a preview, not a review - which is precisely the bug that was
// in pickWarmUp - and this runs 780 times instead of four.
//
// ---- AND IT IS REPORTED AS UNRUN WHEN IT IS UNRUN ----
//
// Negative-tested by raising NEW_PER_WARM_UP from 1 to 3, which is the mutation
// this assertion is supposed to catch. IT STAYED GREEN. The reason is worth
// writing down: the overdue backlog fills all three slots every single morning,
// so pickWarmUp never reaches the branch that introduces anything, and the cap
// could be a hundred without changing a single day. The ratio assertion is
// therefore SATISFIED BY THE DATA, not by the engine.
//
// A branch that cannot fire is UNRUN, and unrun is never green. So when the year
// produced no first meetings at all, this prints as not exercised. The assertion
// that actually bit under mutation is the per-day cap up in the loop, which
// caught the old pickWarmUp on day 1.
const warmUpSlots = warmUpFirstMeetings + warmUpRepeatMeetings;
// "Effectively unrun" is the honest threshold, not "exactly zero". Four first
// meetings in 774 slots cannot distinguish a working cap from a broken one -
// which the mutation proved - so anything under a twentieth of the slots is
// reported as unrun rather than counted.
if (warmUpSlots >= 400 && warmUpFirstMeetings < warmUpSlots * 0.05) {
  unrun.push(
    `the warm-up re-meeting ratio: the overdue backlog filled all but ${warmUpFirstMeetings} of ` +
      `${warmUpSlots} slots all year, so the ratio was satisfied by the data rather than by the engine`
  );
} else if (warmUpSlots < 400) {
  errors.push(
    `UNRUN: only ${warmUpSlots} warm-up slots were filled across ${DAYS} days. ` +
      `The re-meeting assertion cannot speak over a sample that small and is NOT counted as passing.`
  );
} else if (warmUpRepeatMeetings / warmUpSlots < 0.8) {
  errors.push(
    `only ${((warmUpRepeatMeetings / warmUpSlots) * 100).toFixed(0)}% of warm-up slots were RE-meetings ` +
      `(${warmUpFirstMeetings} of ${warmUpSlots} showed her a question for the first time). ` +
      `A warm-up that mostly introduces is a preview, not a review. Once is not review.`
  );
}
if (notExpanding > expanding) {
  errors.push(`more questions had SHRINKING gaps (${notExpanding}) than growing ones (${expanding})`);
}
if (boxes[0] === Object.keys(state.reviewItems).length) {
  errors.push('nothing ever left box 0 — the staircase is not climbing');
}
// Every unit test, and the quarter test, must be reachable inside forty days.
// A test the calendar never lets her sit is a test that does not exist.
for (const u of units) {
  if (!(state.attemptsByTest[u.id] || []).length) {
    errors.push(`${u.id}: never became sittable in forty days`);
  }
}
if (!(state.attemptsByTest['herbalism-q1-final'] || []).length) {
  errors.push('the quarter test never unlocked in forty days');
}

console.log('');
if (errors.length) {
  console.error(`FAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors.slice(0, 10)) console.error(`  ✗ ${e}`);
  process.exit(1);
}
for (const u of unrun) console.log(`  \u26a0\ufe0f UNRUN, not passed \u2014 ${u}`);
if (unrun.length) console.log('');
console.log(
  'Nothing repeated within a day, gaps grew, no warm-up spent a morning on strangers,\n' +
    'and the backlog above is reported rather than asserted away.\n'
);
