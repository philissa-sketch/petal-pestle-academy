// ---------------------------------------------------------------------------
// Run with: node scripts/verify-economy.mjs
//
// Money is the part of a children's app where a bug is least forgivable. A
// balance that quietly drifts, a saved-up total that vanishes, a reward that
// clears without anyone being asked — each of those breaks a promise made to a
// nine-year-old, and she will remember it long after the bug is fixed.
//
// So the invariants are asserted rather than assumed:
//
//   1. Reserving seeds toward a goal does not DESTROY seeds.
//   2. Merging a ledger with itself changes nothing (imports are idempotent).
//   3. Merging two machines' ledgers is a union, and balances add.
//   4. A pending request costs her nothing until it is approved.
//   5. Approval rules hold: price gate, weekly cap, and the judgement flag.
//   6. A grown-up deduction larger than the balance cannot go negative.
//   7. The catalogues are priced against what the diagnostic actually pays.
//   8. Nothing in the earning rules is keyed on being CORRECT.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  EARN_RATES,
  LEGACY_EARN_RATES,
  DIAGNOSTIC_COMPLETE_BONUS,
  legacyTopUp,
  earnedFromEffort,
  balanceFor,
  makeEntry,
  mergeLedgers,
  reservedSeeds,
  seedMatchFor,
  seedPurchaseApproval,
  projectedEarnings,
  SEED_AUTO_APPROVE_MAX,
  SEED_AUTO_APPROVE_WEEKLY_CAP,
  SEED_MATCH_RATE
} from '../src/lib/economy.js';
import {
  ALL_PETAL_ITEMS,
  CHEAPEST_PETAL_ITEM,
  CATALOGUE_TOTAL,
  KEYSTONE_FLOOR,
  BACKGROUND_ITEMS
} from '../src/data/rewards/petalCatalog.js';
import {
  DEFAULT_SEED_REWARDS,
  SEED_TIERS,
  resolveRewards,
  rewardRequiresGrownUp
} from '../src/data/rewards/seedRewards.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const notes = [];

function check(label, condition, detail = '') {
  if (!condition) errors.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

// A student mid-way through: 40 questions, 6 strands, 3 sittings, 4 days.
const counters = { questionsAnswered: 40, strandsSettled: 6, sittingsCompleted: 3, daysActive: 4 };

// ---- 1. Reserving does not destroy seeds ----------------------------------
{
  const base = [];
  const earned = earnedFromEffort(counters, 'seed');
  const spendableBefore = balanceFor(base, 'seed', counters) - reservedSeeds(base);

  const withReserve = [
    makeEntry({ currency: 'seed', amount: 30, kind: 'reserve', source: 'goal', note: 'saving' })
  ];
  const totalAfter = balanceFor(withReserve, 'seed', counters);
  const spendableAfter = totalAfter - reservedSeeds(withReserve);

  check('reserve keeps the total intact', totalAfter === earned, `${totalAfter} vs ${earned}`);
  check(
    'reserve reduces spendable by exactly the reserved amount',
    spendableBefore - spendableAfter === 30,
    `${spendableBefore} → ${spendableAfter}`
  );

  const withUnreserve = [
    ...withReserve,
    makeEntry({ currency: 'seed', amount: 30, kind: 'unreserve', source: 'goal', note: 'changed mind' })
  ];
  check(
    'unreserving gives the seeds back',
    balanceFor(withUnreserve, 'seed', counters) - reservedSeeds(withUnreserve) === spendableBefore
  );
}

// ---- 2 & 3. Merging ------------------------------------------------------
{
  const a = [
    makeEntry({ currency: 'petal', amount: -50, kind: 'spend', note: 'jar' }),
    makeEntry({ currency: 'seed', amount: 20, kind: 'grant', note: 'bonus' })
  ];
  const selfMerged = mergeLedgers(a, a);
  check('merging a ledger with itself is idempotent', selfMerged.length === a.length,
    `${a.length} → ${selfMerged.length}`);
  check(
    'self-merge leaves the balance unchanged',
    balanceFor(selfMerged, 'petal', counters) === balanceFor(a, 'petal', counters)
  );

  const b = [makeEntry({ currency: 'petal', amount: -30, kind: 'spend', note: 'stool' })];
  const merged = mergeLedgers(a, b);
  check('merging two machines is a union', merged.length === 3, `got ${merged.length}`);
  check(
    'merged balance is the sum of both sides',
    balanceFor(merged, 'petal', counters) ===
      earnedFromEffort(counters, 'petal') - 80
  );
}

// ---- 4. A pending request costs nothing -----------------------------------
// Requests live in their own table and never touch the ledger until approved,
// so this is verified structurally: no code path in the request flow creates a
// ledger entry. Asserted by grepping the store rather than by simulating React.
{
  const store = readFileSync(resolve(ROOT, 'src/store/useAppStore.js'), 'utf8');
  const requestFn = store.slice(
    store.indexOf('async requestSeedReward'),
    store.indexOf('async cancelRequest')
  );
  const autoBranch = requestFn.slice(0, requestFn.indexOf('const request ='));
  const pendingBranch = requestFn.slice(requestFn.indexOf('const request ='));
  check(
    'the auto-approve branch does move money',
    autoBranch.includes('addLedgerEntry'),
    'an instantly-cleared reward must be recorded'
  );
  check(
    'the pending branch does NOT move money',
    !pendingBranch.includes('addLedgerEntry'),
    'seeds must not leave her balance while she waits for a yes'
  );
}

// ---- 5. Approval rules ----------------------------------------------------
{
  const privilege = DEFAULT_SEED_REWARDS.find((r) => r.tier === 'privilege');
  const treat = DEFAULT_SEED_REWARDS.find((r) => r.tier === 'treat');

  check(
    'a small privilege clears on its own',
    seedPurchaseApproval(privilege.seeds, [], { requiresGrownUp: rewardRequiresGrownUp(privilege) }).auto
  );
  check(
    'a treat needs a grown-up even though it is cheap',
    !seedPurchaseApproval(treat.seeds, [], { requiresGrownUp: rewardRequiresGrownUp(treat) }).auto
  );
  check(
    'anything over the price gate needs a grown-up',
    !seedPurchaseApproval(SEED_AUTO_APPROVE_MAX + 1, []).auto
  );

  // Weekly cap: fill it with auto-approved spends dated today.
  const now = new Date().toISOString();
  const week = [];
  let spent = 0;
  while (spent + SEED_AUTO_APPROVE_MAX <= SEED_AUTO_APPROVE_WEEKLY_CAP) {
    week.push(
      makeEntry({ currency: 'seed', amount: -SEED_AUTO_APPROVE_MAX, kind: 'spend', source: 'auto', at: now })
    );
    spent += SEED_AUTO_APPROVE_MAX;
  }
  check(
    'the weekly instant-approval cap holds',
    !seedPurchaseApproval(SEED_AUTO_APPROVE_MAX, week).auto,
    `after ${spent} auto-approved seeds this week`
  );

  // And an old spend must not count against this week.
  const old = [
    makeEntry({
      currency: 'seed',
      amount: -SEED_AUTO_APPROVE_MAX,
      kind: 'spend',
      source: 'auto',
      at: new Date(Date.now() - 30 * 864e5).toISOString()
    })
  ];
  check('last month does not count against this week', seedPurchaseApproval(10, old).auto);
}

// ---- 6. No negative balance ----------------------------------------------
{
  const huge = [makeEntry({ currency: 'petal', amount: -999999, kind: 'deduct', note: 'oops' })];
  check('a balance cannot go negative', balanceFor(huge, 'petal', counters) === 0);
}

// ---- 7. Pricing against real earnings ------------------------------------
{
  const full = projectedEarnings();
  const petalTotal = ALL_PETAL_ITEMS.reduce((a, i) => a + i.cost, 0);

  // v3.12: repointed from "one diagnostic sitting" to "her first week of school".
  // The Market is no longer meant to be funded by the placement test — that was
  // the whole problem. The bar is unchanged in spirit and stricter in practice:
  // SCHOOL has to put something on the shelf, and quickly.
  {
    const { PETALS: P } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
    const firstWeek = 3 * P.lessonRead + 5 * P.warmUp + P.unitTest;
    check(
      'the cheapest Petal item is reachable in her first week of school',
      CHEAPEST_PETAL_ITEM <= firstWeek,
      `${CHEAPEST_PETAL_ITEM} vs ${firstWeek} earned in a first week (3 lessons, 5 warm-ups, 1 test)`
    );
  }
  check(
    'a full diagnostic cannot buy the whole Petal Market',
    full.petal < petalTotal,
    `earns ${full.petal}, shop costs ${petalTotal}`
  );
  check(
    'a full diagnostic buys a meaningful number of Petal items',
    full.petal >= CHEAPEST_PETAL_ITEM * 6,
    `earns ${full.petal}`
  );

  // ---- IS THERE ANYTHING WORTH SAVING FOR? — new at v3.15 ----------------
  //
  // Gigi, after the v3.12 rebalance left her with far fewer Petals: the shop
  // has to be "deep enough and expensive enough that saving up is a real thing
  // she does". At v3.14 it was not. Thirty-two items, 2,785 Petals for all of
  // them, and the dearest single thing in the app cost 200 — about three weeks
  // of school against a year that pays roughly 2,126. Every purchase was an
  // impulse and none of them was a decision.
  //
  // Two assertions, and the second one is the one that matters. A shop can be
  // large and still have nothing to aim at.
  {
    const { PETALS: P } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
    // One course, one year: 96 lessons, 32 weekly tests, 4 quarter tests, 16
    // projects, and a warm-up on each of the ~170 school days. Derived from the
    // rates rather than typed, so a rate change moves this number with it.
    const yearPetals =
      96 * P.lessonRead + 32 * P.unitTest + 4 * P.quarterTest + 16 * P.project + 170 * P.warmUp;

    check(
      'a whole year of school cannot buy the whole shop',
      yearPetals < CATALOGUE_TOTAL,
      `a year earns ${yearPetals}, the shop costs ${CATALOGUE_TOTAL} — a shop that empties has nothing left to want`
    );

    // THE KEYSTONE RULE. Without this the shop can be made deep by adding
    // twenty more 40-Petal trinkets, which is more things to buy and still
    // nothing to save for. Something has to cost enough that she has to decide.
    const keystones = ALL_PETAL_ITEMS.filter((i) => i.cost >= KEYSTONE_FLOOR);
    check(
      'something in the shop is worth saving for',
      keystones.length >= 3,
      `${keystones.length} item(s) at or above ${KEYSTONE_FLOOR} Petals: ${keystones.map((k) => `${k.id} ${k.cost}`).join(', ') || 'none'}`
    );
    const dearest = Math.max(...ALL_PETAL_ITEMS.map((i) => i.cost));
    check(
      'the dearest thing takes real time to reach',
      dearest >= yearPetals / 8,
      `dearest is ${dearest}, a year earns ${yearPetals} — under an eighth of a year is an impulse, not a goal`
    );

    // Gigi asked that every "spend what you earned" path also change how
    // something LOOKS. Room looks are the category that changes the whole
    // screen, and they did not exist before v3.15.
    check(
      'buying can change how the whole room looks',
      BACKGROUND_ITEMS.length >= 3,
      `${BACKGROUND_ITEMS.length} room look(s)`
    );
  }

  const rewards = resolveRewards(null);
  const realTier = SEED_TIERS.find((t) => t.id === 'real');
  const dreamTier = SEED_TIERS.find((t) => t.id === 'dream');
  // v3.12: the promise CHANGED, deliberately, and this assertion changed with it.
  //
  // It used to be "finish the Check-In and you have earned one real reward" —
  // 260 seeds on day one. That is precisely what Gigi caught: the placement test
  // was worth more than the entire school year, and school itself earned no seeds
  // at all.
  //
  // The new promise: finishing the Check-In earns a TREAT, and the real rewards
  // are earned by doing school. So the tier this must reach is 'treat', and the
  // 'real' tier is checked below against a term's work instead.
  {
    const treatTier = SEED_TIERS.find((t) => t.id === 'treat');
    check(
      'finishing the whole Check-In reaches the "a treat" tier',
      full.seed + DIAGNOSTIC_COMPLETE_BONUS.seed >= treatTier.seeds,
      `earns ${full.seed + DIAGNOSTIC_COMPLETE_BONUS.seed}, tier is ${treatTier.seeds}`
    );
    const { SEEDS: SD } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
    const oneQuarter = 8 * SD.weeklyTest + SD.quarterTest + 4 * SD.project;
    check(
      'one quarter of school reaches the "something real" tier',
      oneQuarter >= realTier.seeds,
      `a quarter earns ${oneQuarter}, tier is ${realTier.seeds}`
    );
    const fullYear = 32 * SD.weeklyTest + 4 * SD.quarterTest + 16 * SD.project;
    check(
      'a school year reaches the Dream Reward',
      fullYear >= dreamTier.seeds,
      `a year earns ${fullYear}, Dream is ${dreamTier.seeds}`
    );
  }
  check(
    'the Dream Reward is NOT reachable from the diagnostic alone',
    full.seed + seedMatchFor(full.seed) < dreamTier.seeds,
    `earns ${full.seed} + ${seedMatchFor(full.seed)} match vs ${dreamTier.seeds} — it should stay something to save toward`
  );

  const tierIds = SEED_TIERS.map((t) => t.id);
  for (const r of rewards) {
    check(`reward ${r.id} has a real tier`, tierIds.includes(r.tier), r.tier);
    check(`reward ${r.id} has a cost`, Number(r.seeds) > 0);
    check(`reward ${r.id} has a name`, !!r.name);
  }
  const ids = new Set();
  for (const r of [...rewards, ...ALL_PETAL_ITEMS]) {
    check(`id ${r.id} is unique`, !ids.has(r.id));
    ids.add(r.id);
  }

  notes.push(`Full diagnostic pays 🌸 ${full.petal} and 🌟 ${full.seed}.`);
  notes.push(`Petal Market: ${ALL_PETAL_ITEMS.length} items, ${petalTotal} Petals to own everything.`);
  notes.push(
    `Dream Reward ${dreamTier.seeds}: she saves ${Math.round(dreamTier.seeds * (1 - SEED_MATCH_RATE / (1 + SEED_MATCH_RATE)))}ish, the match covers the rest.`
  );
}

// ---- 8. Nothing pays for being right --------------------------------------
{
  const src = readFileSync(resolve(ROOT, 'src/lib/economy.js'), 'utf8');
  // Strip comments — the header talks about correctness at length, on purpose.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  check(
    'no earning rule reads a correctness flag',
    !/\bcorrect\b/i.test(code),
    'found "correct" in economy code — earning must not depend on right answers'
  );
  const rateKeys = Object.keys(EARN_RATES);
  check(
    'the earning rules are exactly the four effort counters',
    rateKeys.length === 4 &&
      rateKeys.every((k) =>
        ['perQuestion', 'perStrandSettled', 'perSitting', 'perDayActive'].includes(k)
      ),
    rateKeys.join(', ')
  );
}

// ---- Report ---------------------------------------------------------------
console.log('\nPetal & Pestle — economy check\n');
for (const n of notes) console.log(`  · ${n}`);
console.log('');


// ---------------------------------------------------------------------------
// THE v3.12 REBALANCE — the year has to be worth more than day one
//
// Written because of a real one. Gigi: "she seems to have received awards for
// not doing anything. She only completed 1 full day of school and there was
// already over 500 petals and 216 golden seeds."
//
// It was not a runaway bug. The rates were doing exactly what they said, and
// what they said was wrong: a sixty-question placement test paid 715 petals and
// 260 seeds, a full week of actual school paid 30 petals and NO seeds, and a
// whole school year paid no seeds at all. The Check-In was 32% of every petal
// she would earn in a year and 100% of every seed.
//
// Every assertion below is one that would have caught that.
// ---------------------------------------------------------------------------
{
  const { PETALS, SEEDS } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
  const { QUARTER, YEAR } = await import(pathToFileURL(resolve(ROOT, 'src/config/curriculumPlan.js')).href);

  // A realistic completed Check-In.
  const diagCounters = { questionsAnswered: 60, strandsSettled: 9, sittingsCompleted: 5, daysActive: 5 };
  const diag = {
    petal: earnedFromEffort(diagCounters, 'petal') + DIAGNOSTIC_COMPLETE_BONUS.petal,
    seed: earnedFromEffort(diagCounters, 'seed') + DIAGNOSTIC_COMPLETE_BONUS.seed
  };

  // A full school year of ONE course: 96 lessons, 32 weekly tests, 4 exams,
  // 16 projects, and a warm-up on every teaching day.
  const lessons = YEAR.lessonsPerCoursePerYear;
  const weeklyTests = YEAR.weeklyTestsPerCoursePerYear;
  const exams = YEAR.quarterExamsPerCoursePerYear;
  const projects = 16;
  const warmUps = weeklyTests * 4;
  const year = {
    petal:
      lessons * PETALS.lessonRead +
      weeklyTests * PETALS.unitTest +
      exams * PETALS.quarterTest +
      projects * PETALS.project +
      warmUps * PETALS.warmUp,
    seed: weeklyTests * SEEDS.weeklyTest + exams * SEEDS.quarterTest + projects * SEEDS.project
  };

  // 1. Doing school must earn seeds AT ALL. This is the one that was zero.
  if (year.seed <= 0) {
    errors.push(
      'a whole school year earns ZERO golden seeds. The scarce currency has to be reachable by ' +
        'doing school, or the only way to a real reward is a placement test she sits once.'
    );
  }
  for (const [k, v] of Object.entries(SEEDS)) {
    if (!(v > 0)) errors.push(`SEEDS.${k} is ${v} — every school seed path must actually pay`);
  }

  // 2. The year must out-earn the Check-In, in BOTH currencies, comfortably.
  for (const cur of ['petal', 'seed']) {
    if (year[cur] <= diag[cur] * 2) {
      errors.push(
        `a school year earns ${year[cur]} ${cur}s against ${diag[cur]} for the Check-In. The year ` +
          `has to be worth clearly more than day one, or nothing she does after the placement ` +
          `test changes anything she can buy.`
      );
    }
  }

  // 3. Reading a lesson must pay something. It paid nothing until v3.12.
  if (!(PETALS.lessonRead > 0)) {
    errors.push('reading a lesson earns nothing. She can read all 96 and be no better off.');
  }

  // 4. No per-question seed income. That is what made the Check-In a jackpot.
  if (EARN_RATES.perQuestion.seed !== 0) {
    errors.push(
      `perQuestion pays ${EARN_RATES.perQuestion.seed} seeds. A per-question seed rate turns a long ` +
        `placement test into the biggest earning event of the year — which is exactly what happened.`
    );
  }

  // 5. The grandfathering must actually preserve the old balance.
  const owed = legacyTopUp(diagCounters);
  for (const cur of ['petal', 'seed']) {
    const before =
      diagCounters.questionsAnswered * LEGACY_EARN_RATES.perQuestion[cur] +
      diagCounters.strandsSettled * LEGACY_EARN_RATES.perStrandSettled[cur] +
      diagCounters.sittingsCompleted * LEGACY_EARN_RATES.perSitting[cur] +
      diagCounters.daysActive * LEGACY_EARN_RATES.perDayActive[cur];
    const after = earnedFromEffort(diagCounters, cur) + owed[cur];
    if (after !== before) {
      errors.push(
        `grandfathering loses ${before - after} ${cur}s. Lowering a rate must never take something ` +
          `off a child who already earned it — her balance is computed, not stored.`
      );
    }
  }
  if (Object.values(legacyTopUp({})).some((v) => v !== 0)) {
    errors.push('a child with no counters is owed a top-up. Nothing earned, nothing to preserve.');
  }

  notes.push(
    `Check-In pays ${diag.petal} petals / ${diag.seed} seeds; a school year pays ${year.petal} / ` +
      `${year.seed} — the year is ${(year.petal / diag.petal).toFixed(1)}x the petals and ` +
      `${(year.seed / diag.seed).toFixed(1)}x the seeds`
  );
  notes.push('grandfathering preserves every petal and seed earned under the old rates');
}

if (errors.length) {
  console.error(`FAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('All economy invariants hold.\n');
