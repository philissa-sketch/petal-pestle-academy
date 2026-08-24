// ---------------------------------------------------------------------------
// Run with: node scripts/simulate-diagnostic.mjs
//
// DOES THE STAIRCASE ACTUALLY FIND THE RIGHT LEVEL?
//
// The engine's rules are easy to state and easy to get wrong. This runs
// simulated students of known ability through the real engine — the same
// pickNextStrand, chooseItem and applyAnswer the app calls — and checks the
// level it lands on is close to the level it was given.
//
// The simulated student answers correctly with a probability that depends on
// how far the question sits above or below her true level (a logistic curve),
// so she is not a perfect step function: she sometimes gets an easy one wrong
// and sometimes guesses a hard one right, exactly like a real child. If the
// staircase only worked against a noiseless student it would not be worth
// shipping.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { STRAND_IDS } from '../src/config/strands.js';
import {
  initialStrandState,
  applyAnswer,
  pickNextStrand,
  chooseItem,
  diagnosticProgress,
  isFloorBounded,
  confidenceFor,
  reopenStrandState,
  isPinnedAtFloor,
  MAX_ITEMS_PER_STRAND,
  MIN_LEVEL,
  START_LEVEL
} from '../src/engine/diagnosticEngine.js';
import { itemsForStrand } from '../src/data/diagnostic/index.js';

// Deterministic PRNG so a failure is reproducible.
function rng(seed) {
  let s = ((seed + 1) * 48271) % 2147483647;
  return () => {
    s = (s * 48271) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Probability a student of `ability` answers an item of `difficulty`.
 *  SLOPE 1.7 is a conventional discrimination value; GUESS 0.25 is the floor
 *  from four multiple-choice options, which matters — without it the model
 *  would say a child has a 2% chance on a hard item when in reality she has a
 *  one-in-four shot at guessing it. */
function pCorrect(ability, difficulty) {
  const SLOPE = 1.7;
  const GUESS = 0.25;
  const p = 1 / (1 + Math.exp(-SLOPE * (ability - difficulty)));
  return GUESS + (1 - GUESS) * p;
}

function runOne(trueLevels, seed) {
  const r = rng(seed);
  const strands = {};
  for (const id of STRAND_IDS) strands[id] = initialStrandState(id);

  let last = null;
  let counter = seed;
  let asked = 0;
  const HARD_STOP = STRAND_IDS.length * MAX_ITEMS_PER_STRAND + 5;

  while (asked < HARD_STOP) {
    const strandId = pickNextStrand(strands, last, counter);
    if (!strandId) break;
    const state = strands[strandId];
    const item = chooseItem(itemsForStrand(strandId), state.level, state.seenItemIds, counter);
    if (!item) break;
    const correct = r() < pCorrect(trueLevels[strandId], item.level);
    strands[strandId] = applyAnswer(
      { ...state, seenItemIds: [...state.seenItemIds, item.id] },
      correct,
      item.level
    );
    last = strandId;
    counter++;
    asked++;
  }

  return { strands, asked, progress: diagnosticProgress(strands) };
}

// ---- Scenarios -------------------------------------------------------------
const SCENARIOS = [
  { name: 'On level throughout (4.0)', level: () => 4.0 },
  { name: 'Working below level (2.8)', level: () => 2.8 },
  // THE SCENARIO THAT WAS MISSING, and the reason four of a real child's nine
  // strands came back meaningless. Before the easy band existed, a student at
  // 1.8 could not be measured at all: the bank bottomed out at 2.3–2.5, her
  // estimate fell to the floor, the easy items ran out, and the engine then
  // served her HARDER ones because they were the nearest that existed.
  //
  // Every scenario above passed the whole time. None of them modelled a child
  // below the bank. A test suite only covers the children you thought of.
  { name: 'Well below level (1.8) — the floor case', level: () => 1.8 },
  // A child sitting ON the lowest level the app can report cannot be measured
  // as a NUMBER — see FLOOR_BAND in the engine for why the bias is structural
  // rather than a tuning problem. So this scenario asserts the honest thing
  // instead: the app must RECOGNISE her as a floor case and refuse to print a
  // false-precise level. Changing what is claimed is legitimate. Loosening the
  // bar until a wrong claim passes would not be.
  { name: 'Right at the floor (1.3) — must be reported as a bound', level: () => 1.3, expectBounded: true },
  { name: 'Working above level (5.8)', level: () => 5.8 },
  // At the top of the scale the estimate is expected to read slightly LOW: the
  // bank has no items above 6.5, so a child beyond that cannot be distinguished
  // from one exactly at it. describeLevel() reports this band as "6th grade or
  // above" rather than as a number, which is the honest version of the same
  // limitation.
  { name: 'At the ceiling (6.3)', level: () => 6.3 },
  {
    name: 'Uneven — strong reading, weak maths',
    level: (id) => (id.startsWith('reading') || id === 'vocabulary' || id === 'grammar-usage' ? 5.6 : 3.0)
  },
  {
    name: 'One hidden gap (fractions 2.5, rest 4.5)',
    level: (id) => (id === 'fractions-decimals' ? 2.5 : 4.5)
  }
];

// 120 rather than 40. At 40 runs a scenario sitting near the bar flickered
// across it between builds — 74% one run, 76% the next — which is noise being
// read as a regression. More students, less flicker, and the numbers below can
// be trusted to two figures.
const RUNS = 120;
let failures = 0;

console.log('\nPetal & Pestle — diagnostic convergence check');
console.log(`${RUNS} simulated students per scenario, ${SCENARIOS.length} scenarios\n`);

for (const scenario of SCENARIOS) {
  const trueLevels = {};
  for (const id of STRAND_IDS) trueLevels[id] = scenario.level(id);

  const errorsPerStrand = {};
  let totalAsked = 0;
  let allSettled = true;
  let boundedMisses = 0;

  for (let run = 0; run < RUNS; run++) {
    const { strands, asked, progress } = runOne(trueLevels, run * 977 + 13);
    totalAsked += asked;
    if (!progress.complete) allSettled = false;
    for (const id of STRAND_IDS) {
      const err = strands[id].level - trueLevels[id];
      (errorsPerStrand[id] ||= []).push(err);
      // THE CLAIM BEING TESTED, and why it is this one.
      //
      // A child sitting at the bottom of the scale cannot be pinned to a number
      // by eight four-choice questions. Roughly a third of them will guess well
      // enough to land an estimate a grade high, and no amount of extra easy
      // items changes that — it is the guess floor, not the bank.
      //
      // So this does NOT assert "always reported as a bound", which is not
      // achievable. It asserts the thing that actually protects a parent: a
      // floor child is never handed a number AND told it is Confident. Either
      // the app says "at or below", or it says "treat as approximate". What it
      // may never do is sound sure while being a grade out.
      const st = strands[id];
      if (!isFloorBounded(st) && confidenceFor(st) === 'high') boundedMisses++;
    }
  }

  // Floor cases are judged on whether the app admits it cannot measure them.
  if (scenario.expectBounded) {
    const missed = boundedMisses;
    const total = RUNS * STRAND_IDS.length;

    // ---- WHY THE BAR IS NOT 100% ----
    //
    // A child at 1.3 answering eight four-choice questions around 2.2 gets each
    // one right about 30% of the time by guessing. Binomially, roughly one in
    // five of them will land four or more correct — an answer pattern
    // indistinguishable from a real 2.3 child's. There is no signal left to
    // find. No test of this length can separate those two children, and a
    // checker that demanded it would be demanding the impossible and would
    // eventually be "fixed" by weakening something real.
    //
    // So the bar is 70%: comfortably below the ~80% the maths allows, high
    // enough that any genuine regression in the floor detection fails the
    // build. The remainder is a stated limit of the instrument, and the
    // Grown-Up Corner tells parents about it rather than hiding it.
    const CAUGHT_BAR = 0.7;
    const caught = (total - missed) / total;
    const ok = caught >= CAUGHT_BAR;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${scenario.name}`);
    console.log(
      `      ${total - missed}/${total} (${(caught * 100).toFixed(0)}%) avoided a confident-sounding wrong number · bar ${CAUGHT_BAR * 100}%`
    );
    console.log('');
    if (!ok) failures++;
    continue;
  }

  const allErrors = Object.values(errorsPerStrand).flat();
  const meanAbsErr = allErrors.reduce((a, e) => a + Math.abs(e), 0) / allErrors.length;
  const bias = allErrors.reduce((a, e) => a + e, 0) / allErrors.length;
  const within1 = allErrors.filter((e) => Math.abs(e) <= 1.0).length / allErrors.length;
  const avgAsked = totalAsked / RUNS;

  // The bar: a diagnostic whose job is "which grade's unit should she open" is
  // useful if it lands inside one grade level most of the time. It does NOT
  // need to be accurate to a tenth — nothing downstream can act on a tenth.
  const pass = meanAbsErr <= 0.85 && within1 >= 0.75 && Math.abs(bias) <= 0.5 && allSettled;
  if (!pass) failures++;

  console.log(`${pass ? 'PASS' : 'FAIL'}  ${scenario.name}`);
  console.log(`      mean error ${meanAbsErr.toFixed(2)} grades · bias ${bias >= 0 ? '+' : ''}${bias.toFixed(2)}`);
  console.log(`      within 1 grade: ${(within1 * 100).toFixed(0)}% · avg questions asked: ${avgAsked.toFixed(0)}`);
  if (!allSettled) console.log('      ⚠ some runs did not settle every strand');

  // The hidden-gap scenario is the one that matters most: an assessment that
  // averages a single low strand away is worse than no assessment, because it
  // tells a parent to keep going.
  if (scenario.name.startsWith('One hidden gap')) {
    const gapErrs = errorsPerStrand['fractions-decimals'];
    const gapMean =
      gapErrs.reduce((a, e) => a + e, 0) / gapErrs.length + 2.5;
    const otherIds = STRAND_IDS.filter((id) => id !== 'fractions-decimals');
    const otherMean =
      otherIds
        .flatMap((id) => errorsPerStrand[id])
        .reduce((a, e) => a + e, 0) /
        (otherIds.length * RUNS) +
      4.5;
    const separated = otherMean - gapMean > 1.0;
    console.log(
      `      gap strand measured ${gapMean.toFixed(2)} vs others ${otherMean.toFixed(2)} — ${
        separated ? 'gap detected' : 'GAP MISSED'
      }`
    );
    if (!separated) failures++;
  }
  console.log('');
}


// ---------------------------------------------------------------------------
// A RE-TAKE MUST BE A DIFFERENT PAPER.
//
// The bug this exists to catch, in Gigi's words: "For the tests that she has to
// take over in the checkin does it have different questions in it?" It did not.
// chooseItem() filters out anything in seenItemIds, so nothing repeated WITHIN
// one sitting — but reopenStrand() called initialStrandState(), which sets
// seenItemIds to [], so re-opening a strand wiped the memory of what she had
// already been asked and the re-take could hand her the same questions back.
//
// The locked rule is that a re-take is a different paper, otherwise she is
// showing she remembers the paper and not the material. It matters MOST in the
// diagnostic, because the whole year plan is built on that measurement.
//
// Four things are asserted, and only these four:
//   1. Re-opening keeps the seen-items list.
//   2. Re-opening throws away the MEASUREMENT — level, counts, settled.
//   3. A second sitting never serves an item from the first WHILE the strand
//      still has unseen items. (Not "never" full stop: chooseItem falls back to
//      repeats rather than crashing once a bank is exhausted, and no engine
//      change can conjure a question that does not exist. Bank depth is
//      verify-itembank.mjs's job, and it now fails below 2x MAX_ITEMS_PER_STRAND.)
//   4. Carrying the list forward does NOT cost a struggling child the easy
//      band. This is the reason the list was cleared in the first place — at
//      v2.2 the 81 foundation items had just landed and a settled strand would
//      never have walked down to reach them. Resetting the level to
//      START_LEVEL does that job on its own, and this measures whether it does.
// ---------------------------------------------------------------------------
{
  const RETAKE_RUNS = 40;
  const EASY_BAND = MIN_LEVEL + 1.0;
  const problems = [];

  /** One sitting in one strand, from whatever state it is handed. */
  function sitOne(strandId, startState, trueLevel, seed) {
    const r = rng(seed);
    const items = itemsForStrand(strandId);
    const served = [];
    let st = startState;
    let counter = seed;
    let repeatsWithStockLeft = 0;

    while (!st.settled && st.asked < MAX_ITEMS_PER_STRAND) {
      const carried = new Set(st.seenItemIds);
      const unseenLeft = items.filter((i) => !carried.has(i.id)).length;
      const item = chooseItem(items, st.level, st.seenItemIds, counter);
      if (!item) break;
      // The claim is narrow on purpose: a repeat is only a defect while there
      // was still something unseen to serve instead.
      if (unseenLeft > 0 && carried.has(item.id)) repeatsWithStockLeft++;
      served.push(item);
      const correct = r() < pCorrect(trueLevel, item.level);
      st = applyAnswer({ ...st, seenItemIds: [...st.seenItemIds, item.id] }, correct, item.level);
      counter++;
    }
    return { state: st, served, repeatsWithStockLeft };
  }

  let firstReachedEasy = 0;
  let retakeReachedEasy = 0;
  let overlaps = 0;
  let sittings = 0;

  for (const strandId of STRAND_IDS) {
    for (let run = 0; run < RETAKE_RUNS; run++) {
      // A below-level child, because she is the one who gets re-opened.
      const trueLevel = 1.8 + (run % 5) * 0.4;
      const seed = run * 613 + strandId.length * 31 + 7;

      const first = sitOne(strandId, initialStrandState(strandId), trueLevel, seed);
      const reopened = reopenStrandState(first.state);

      // ---- 1. the memory survives
      if (reopened.seenItemIds.length !== first.state.seenItemIds.length) {
        problems.push(
          `${strandId}: re-opening dropped the seen-items list ` +
            `(${first.state.seenItemIds.length} in, ${reopened.seenItemIds.length} out)`
        );
      }
      for (const id of first.state.seenItemIds) {
        if (!reopened.seenItemIds.includes(id)) {
          problems.push(`${strandId}: re-opening forgot item ${id}`);
        }
      }

      // ---- 2. the measurement does not
      if (reopened.level !== START_LEVEL) {
        problems.push(`${strandId}: re-opened at level ${reopened.level}, expected ${START_LEVEL}`);
      }
      if (reopened.asked !== 0 || reopened.correct !== 0 || reopened.settled) {
        problems.push(`${strandId}: re-opened carrying the old measurement forward`);
      }

      const second = sitOne(strandId, reopened, trueLevel, seed + 50021);
      sittings++;

      // ---- 3. no repeat while there was still stock
      if (second.repeatsWithStockLeft > 0) {
        problems.push(
          `${strandId}: re-take served ${second.repeatsWithStockLeft} question(s) she had already ` +
            `been asked, while unseen questions were still available`
        );
      }
      const firstIds = new Set(first.served.map((i) => i.id));
      const repeated = second.served.filter((i) => firstIds.has(i.id));
      if (repeated.length) overlaps++;

      // ---- 4. the easy band is still reachable on a re-take
      if (first.served.some((i) => i.level <= EASY_BAND)) firstReachedEasy++;
      if (second.served.some((i) => i.level <= EASY_BAND)) retakeReachedEasy++;
    }
  }

  const firstRate = firstReachedEasy / sittings;
  const retakeRate = retakeReachedEasy / sittings;
  // Comparative, not absolute. The question is not "does a re-take reach the
  // easy items", it is "does carrying the seen list forward COST her the easy
  // items" — and the honest comparison is against her first sitting, run at the
  // same abilities with the same engine. A small margin is allowed because the
  // two sittings draw on different halves of the bank.
  const easyBandHeld = retakeRate >= firstRate - 0.1;

  console.log('Re-takes — is it a different paper?');
  console.log(`      ${sittings} re-takes across ${STRAND_IDS.length} strands`);
  console.log(
    `      questions repeated from the first sitting: ${overlaps} (while unseen questions remained: ` +
      `${problems.filter((p) => p.includes('already')).length})`
  );
  console.log(
    `      reached the easy band (<= ${EASY_BAND.toFixed(1)}): first sitting ` +
      `${(firstRate * 100).toFixed(0)}% · re-take ${(retakeRate * 100).toFixed(0)}%` +
      `${easyBandHeld ? '' : '  ⚠ the re-take cannot reach down as far as the first sitting'}`
  );

  if (!easyBandHeld) {
    problems.push(
      `carrying the seen list forward cost the easy band: first sittings reached it ` +
        `${(firstRate * 100).toFixed(0)}% of the time, re-takes only ${(retakeRate * 100).toFixed(0)}%`
    );
  }
  if (overlaps > 0) {
    problems.push(`${overlaps} re-take(s) served a question from the first sitting`);
  }

  if (problems.length) {
    console.log('');
    console.error(`FAILED — the re-take is not a different paper (${problems.length}):`);
    for (const p of [...new Set(problems)].slice(0, 12)) console.error(`  ✗ ${p}`);
    failures++;
  }
  console.log('');
}


// ---------------------------------------------------------------------------
// "NEEDS RE-MEASURING" MUST MEAN THE TEST NEVER LOOKED BELOW HER.
//
// The Grown-Up Corner warns when a strand's result is a ceiling rather than a
// measurement. Until v3.14 that warning was computed from a variable called
// `easiestSeen` that was not the easiest question she had SEEN — it was the
// easiest question that EXISTS in the strand. Once the 81 foundation items
// landed at 1.2 that made the guard `easiestSeen <= 1.6` permanently true, and
// what was left flagged any strand that was simply low and struggling. Nothing
// crashed. Every check passed. The warning just stopped meaning what it said.
//
// Both directions are asserted, because only the second one fails under the old
// code and a check that tests only the obvious direction is how this survived.
// ---------------------------------------------------------------------------
{
  const problems = [];
  const strandId = 'geometry';
  const items = itemsForStrand(strandId);
  const sorted = [...items].sort((a, b) => a.level - b.level);
  const easiest = sorted[0];
  const aboveHer = sorted.filter((i) => i.level >= 2.4).slice(0, 7);

  // Settled at the bottom of the scale, mostly wrong — Azianna's geometry.
  const base = { ...initialStrandState(strandId), level: 2.0, asked: 7, correct: 1, settled: true };

  // 1. Never asked anything below 2.4, placed at 2.00. That is a ceiling.
  const neverProbed = { ...base, seenItemIds: aboveHer.map((i) => i.id) };
  if (!isPinnedAtFloor(neverProbed, items)) {
    problems.push(
      'a strand placed at 2.00 whose easiest question was 2.4 is NOT being flagged — ' +
        'a grown-up would read that number as a measurement'
    );
  }

  // 2. Re-measured against the easy band: she was served a 1.2 and still landed
  //    at 2.00. That IS a measurement and must not be flagged. This is the
  //    assertion the old whole-bank code fails.
  const probedProperly = {
    ...base,
    seenItemIds: [easiest.id, ...aboveHer.slice(0, 6).map((i) => i.id)]
  };
  if (isPinnedAtFloor(probedProperly, items)) {
    problems.push(
      `a strand that WAS asked a question at ${easiest.level.toFixed(1)} is still being flagged as ` +
        'unmeasurable — the rule is reading the whole bank instead of the questions she was asked, ' +
        'so re-measuring her would never clear the warning'
    );
  }

  // 3. A strand nobody has answered yet is not a failed measurement.
  if (isPinnedAtFloor(initialStrandState(strandId), items)) {
    problems.push('an unanswered strand is being flagged as pinned at the floor');
  }

  console.log('Floor warning — does it mean what it says?');
  if (problems.length) {
    console.error('      FAILED:');
    for (const p of problems) console.error(`  ✗ ${p}`);
    failures++;
  } else {
    console.log('      flags a ceiling, clears once she is asked something easier. ✓');
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// AND THE APP MUST ACTUALLY USE IT.
//
// Everything above tests the ENGINE. The engine is not what re-opens a strand
// when Gigi taps the button — useAppStore.js is, and it cannot be imported
// here: it pulls in zustand and an IndexedDB layer that have no meaning under
// node. Without this block the engine could be perfectly correct while the app
// went on calling initialStrandState() and shipping the original bug, and every
// check in the project would still pass.
//
// So the store is read as text. This is the same technique check-import.mjs
// uses to prove exportAll and importBackup agree about the tables, added in
// v3.13 after a missing table hid for three versions. A structural rule that
// closes the whole class beats one more assertion about one more instance.
// ---------------------------------------------------------------------------
{
  const storePath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src/store/useAppStore.js');
  const src = readFileSync(storePath, 'utf8');
  const problems = [];

  const start = src.indexOf('async reopenStrand(');
  if (start === -1) {
    problems.push('useAppStore.js has no reopenStrand() at all');
  } else {
    // The function body, up to the next store method at the same indent.
    const rest = src.slice(start);
    const end = rest.indexOf('\n  },');
    const body = end === -1 ? rest : rest.slice(0, end);

    if (!/reopenStrandState\s*\(/.test(body)) {
      problems.push(
        'reopenStrand() never calls reopenStrandState(). The engine keeps the seen-items ' +
          'list, but the app is not asking it to — so a re-take can still serve the same paper.'
      );
    }
    if (/const\s+fresh\s*=\s*initialStrandState\s*\(/.test(body)) {
      problems.push(
        'reopenStrand() builds its new state with initialStrandState(), which clears ' +
          'seenItemIds. That is the exact bug from backlog 1.3, put back.'
      );
    }
    if (!/reopenStrandState/.test(src.slice(0, src.indexOf('export')))) {
      // Imported at the top, not defined locally under the same name.
      if (!/^\s*reopenStrandState,$/m.test(src)) {
        problems.push('reopenStrandState is not imported from the engine');
      }
    }
  }

  const pinnedStart = src.indexOf('strandsPinnedAtFloor() {');
  if (pinnedStart === -1) {
    problems.push('useAppStore.js has no strandsPinnedAtFloor()');
  } else {
    const rest2 = src.slice(pinnedStart);
    const end2 = rest2.indexOf('\n  },');
    const body2 = end2 === -1 ? rest2 : rest2.slice(0, end2);
    if (!/isPinnedAtFloor\s*\(/.test(body2)) {
      problems.push(
        'strandsPinnedAtFloor() does not call isPinnedAtFloor(). The rule has been reinlined ' +
          'in the store, which is where it went wrong the first time and where nothing can test it.'
      );
    }
    if (/Math\.min\([^)]*itemsForStrand/.test(body2.replace(/\s+/g, ' '))) {
      problems.push(
        'strandsPinnedAtFloor() is taking a minimum over the whole strand bank again. That is the ' +
          'v3.13 bug: the easiest question that EXISTS is not the easiest question she was asked.'
      );
    }
  }

  console.log('The store — does the app use the engine rules?');
  if (problems.length) {
    console.error('      FAILED:');
    for (const p of problems) console.error(`  ✗ ${p}`);
    failures++;
  } else {
    console.log('      reopenStrand() → reopenStrandState(), strandsPinnedAtFloor() → isPinnedAtFloor(). ✓');
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// INCONCLUSIVE IS NOT A SCORE, AND THE RE-DIAGNOSTIC TRIGGER MUST BE ABLE TO
// FIRE — v3.55
//
// Written because Geometry 2.00 and Measurement 2.00 were printed as numbers for
// five days. isPinnedAtFloor() always knew they were the floor of the item bank
// and ceilingNote() always said so in prose, but the FIGURE beside the prose
// still read "2.0" — and a number wins an argument with a caveat.
//
// And because Gigi's Aug 13 decision not to re-sit the Check-In went into the
// plan under "Settled and not to be reopened". The decision was right; recording
// it as permanent was this project's own tenth bug — a correct decision nobody
// revisited when the thing it was about changed. An exemption that cannot expire
// is a hole, so the way back is asserted here rather than trusted.
// ---------------------------------------------------------------------------
{
  console.log('Inconclusive vs measured, and the way back');
  const problems = [];
  const { strandReading, RE_DIAGNOSTIC, reDiagnosticDue } = await import(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)), '../src/engine/diagnosticEngine.js')).href);
  const { HUMANBODY_MODULES } = await import(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/lessons/humanbodyCourse.js')).href);

  // ---- a floored strand reads INCONCLUSIVE and never prints a number ----
  const floored = {
    strandId: 'geometry',
    settled: true,
    asked: 8,
    correct: 1,
    level: 2.0,
    seenItemIds: itemsForStrand('geometry')
      .filter((i) => i.level >= 2.0)
      .slice(0, 8)
      .map((i) => i.id)
  };
  const fr = strandReading(floored, itemsForStrand('geometry'));
  if (fr.kind !== 'inconclusive') {
    problems.push(`a strand pinned at the floor read "${fr.kind}", not inconclusive`);
  }
  if (/\d/.test(fr.display)) {
    problems.push(
      `inconclusive rendered as "${fr.display}" — it contains a digit, so a grown-up reads it as a score`
    );
  }

  // ---- a genuinely measured strand still shows its number ----
  const measured = {
    strandId: 'geometry',
    settled: true,
    asked: 8,
    correct: 5,
    level: 3.4,
    seenItemIds: itemsForStrand('geometry')
      .filter((i) => i.level <= 2.0)
      .slice(0, 4)
      .map((i) => i.id)
  };
  const mr = strandReading(measured, itemsForStrand('geometry'));
  if (mr.kind !== 'measured') problems.push(`a properly measured strand read "${mr.kind}"`);
  if (mr.display !== '3.40') problems.push(`a measured strand lost its number: "${mr.display}"`);

  // ---- every module the trigger names must exist and hold lessons ----
  // A trigger pointing at a module that is not there is a trigger that can never
  // fire, which is indistinguishable from the permanent decision it replaced.
  const allLessons = [];
  for (const t of RE_DIAGNOSTIC.triggers) {
    if (!STRAND_IDS.includes(t.strandId)) problems.push(`trigger names unknown strand ${t.strandId}`);
    for (const n of t.afterModules) {
      const mod = HUMANBODY_MODULES.find((m) => m.module === n && m.courseId === t.courseId);
      if (!mod) {
        problems.push(`trigger for ${t.strandId} names ${t.courseId} module ${n}, which does not exist`);
        continue;
      }
      if (!(mod.lessons || []).length) {
        problems.push(`${t.courseId} module ${n} has no lessons, so the trigger can never fire`);
      }
      allLessons.push(...(mod.lessons || []));
    }
    if (!t.why || t.why.length < 40) problems.push(`trigger for ${t.strandId} has no written reason`);
  }
  if (!RE_DIAGNOSTIC.decidedBy || !RE_DIAGNOSTIC.decidedOn || !RE_DIAGNOSTIC.reason) {
    problems.push('the paused decision has no person, date or reason on it');
  }

  // ---- it must NOT fire before the teaching, and MUST after ----
  const geoTrigger = RE_DIAGNOSTIC.triggers.find((t) => t.strandId === 'geometry');
  const geoLessons = [];
  for (const n of geoTrigger.afterModules) {
    const mod = HUMANBODY_MODULES.find((m) => m.module === n && m.courseId === 'humanbody');
    geoLessons.push(...(mod.lessons || []));
  }
  const early = reDiagnosticDue('geometry', floored, itemsForStrand('geometry'), geoLessons.slice(0, -1), HUMANBODY_MODULES);
  if (!early || early.due) {
    problems.push('the trigger fired with a lesson still unread — a re-take before the teaching is a punishment');
  }
  const ready = reDiagnosticDue('geometry', floored, itemsForStrand('geometry'), geoLessons, HUMANBODY_MODULES);
  if (!ready || !ready.due) {
    problems.push('every lesson read and the trigger still did not fire — the decision is permanent again');
  }
  // A strand that was measured properly must never be dragged back for a re-take.
  const noNeed = reDiagnosticDue('geometry', measured, itemsForStrand('geometry'), geoLessons, HUMANBODY_MODULES);
  if (noNeed) problems.push('a properly measured strand was offered a re-take it does not need');

  if (problems.length) {
    console.error('      FAILED:');
    for (const p of problems) console.error(`  ✗ ${p}`);
    failures++;
  } else {
    console.log(
      `      a floored strand reads "${fr.display}" with no digit in it; a measured one still reads ${mr.display}`
    );
    console.log(
      `      ${RE_DIAGNOSTIC.triggers.length} paused strands have a way back, gated on ${new Set(allLessons).size} real lessons —`
    );
    console.log('      silent before the teaching, fires after it, and never bothers a measured strand. ✓');
  }
  console.log('');
}

if (failures > 0) {
  console.error(`FAILED — ${failures} scenario check${failures === 1 ? '' : 's'} did not meet the bar.\n`);
  process.exit(1);
}
console.log('All scenarios passed.\n');
