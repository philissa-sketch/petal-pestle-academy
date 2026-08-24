// ---------------------------------------------------------------------------
// Run with: node scripts/check-yearplan.mjs
//
// The year plan has one job that matters more than being complete: it must
// never invent a year for a level nobody measured.
//
// Five of Azianna's nine strands produced a ceiling rather than a measurement —
// the test never asked her anything easier than where it placed her, so it
// never found her floor. Filling those in anyway would look like a finished
// plan and would quietly aim thirty-six weeks of work at the wrong difficulty.
//
// A plan with a stated gap gets fixed in fifteen minutes. A plan that guesses
// cannot be fixed, because nothing about it looks wrong.
//
// So this checks:
//   1. A strand whose easiest served question sits at or above its result is
//      REFUSED, with a reason and a fix.
//   2. A strand with a genuine measurement gets four quarters, no gaps.
//   3. Every quarter names a course that exists and links to a real Khan URL.
//   4. A year that runs off the end of a course rolls into the next one, rather
//      than stopping in March.
//   5. Every course a level can land in actually has a four-quarter scope.
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { quartersForStrand, ceilingNote, mustStartAtBeginning, buildYearPlan } = await import(pathToFileURL(resolve(ROOT, 'src/lib/yearPlan.js')).href);
const { KHAN_COURSES, KHAN_MAP, khanFor } = await import(pathToFileURL(resolve(ROOT, 'src/data/khan/khanMap.js')).href);
const { scopeFor } = await import(pathToFileURL(resolve(ROOT, 'src/data/khan/khanScope.js')).href);
const { STRAND_IDS } = await import(pathToFileURL(resolve(ROOT, 'src/config/strands.js')).href);
const { itemsForStrand } = await import(pathToFileURL(resolve(ROOT, 'src/data/diagnostic/index.js')).href);

const errors = [];
const notes = [];

/** A state that looks like a real sitting: served items spanning her level. */
function honestState(strandId, level) {
  const items = itemsForStrand(strandId);
  // Everything at or below her level, plus a couple above — a test that
  // actually probed downward.
  const seen = items
    .filter((i) => i.level <= level)
    .slice(0, 4)
    .map((i) => i.id);
  const above = items.filter((i) => i.level > level).slice(0, 3).map((i) => i.id);
  return {
    strandId,
    level,
    asked: 8,
    correct: 5,
    settled: true,
    levelHistory: [3.5, level, level, level],
    seenItemIds: [...seen, ...above],
    easyAsked: 2,
    easyMissed: 0
  };
}

/** A state like hers: the test never went below where it landed. */
function ceilingState(strandId, level) {
  const items = itemsForStrand(strandId).filter((i) => i.level >= level).slice(0, 7);
  return {
    strandId,
    level,
    asked: 8,
    correct: 2,
    settled: true,
    levelHistory: [3.5, level, level, level],
    seenItemIds: items.map((i) => i.id),
    easyAsked: 0,
    easyMissed: 0
  };
}

// ---- 1. A CEILING IS PLANNED — BUT ONLY FROM THE BEGINNING (inverted v3.23) ----
//
// THIS ASSERTION USED TO SAY THE OPPOSITE, and the whole arc belongs here rather
// than in a commit message, because the reversal is the most useful thing in the
// file.
//
// Until v3.23 it required a ceiling to be REFUSED a year plan. That was correct
// at the time: a year was built by walking forward from wherever her number sat,
// so a number the test never probed below would aim thirty-six weeks at a level
// nobody had found.
//
// v3.21 changed what a plan IS. Her level now chooses only the COURSE; the
// course starts at Unit 1 and walks 1, 2, 3 in order. A Geometry ceiling of 2.00
// and a true level of 1.4 both land on the first unit of 2nd Grade Math. The
// ceiling can no longer put her anywhere wrong.
//
// Gigi then asked for the "Not planned yet" panel to come off My Learning,
// because she is not re-taking the Check-In. Five red panels telling her five of
// her nine subjects have nothing planned, for a re-take that will not happen, is
// not a warning — it is a wall.
//
// So the guard was INVERTED rather than deleted, and it is now strictly the
// harder one to satisfy: a ceiling must get its year, AND that year must begin
// at the start of its course. Skipping ahead on a number nobody measured is the
// thing that was always actually dangerous.
{
  let planned = 0;
  for (const id of STRAND_IDS) {
    const st = ceilingState(id, 2.6);
    const plan = quartersForStrand(id, st);

    if (plan.blocked) {
      errors.push(
        `${id}: a ceiling was refused a year plan. Since v3.21 the plan starts at Unit 1 whatever ` +
          `the number is, so refusing leaves her with nothing to do and protects her from nothing.`
      );
      continue;
    }
    if (!plan.quarters.length) {
      errors.push(`${id}: a ceiling produced no quarters at all`);
      continue;
    }
    planned++;

    // The fact must survive the block being removed.
    const note = ceilingNote(st, id);
    if (!note || !note.why) {
      errors.push(
        `${id}: the number is a ceiling and nothing says so any more. The block was meant to go, ` +
          `not the honesty — My Levels and the record both read this.`
      );
    }
    if (!mustStartAtBeginning(st, id)) {
      errors.push(`${id}: a ceiling is not being pinned to the start of its course`);
    }
  }
  if (planned === STRAND_IDS.length) {
    notes.push(
      `all ${planned} strands plan a full year from a ceiling — and every one still reports the ` +
        `number as an upper bound rather than a measurement`
    );
  }
}

// ---- 2 & 3 & 4. a real measurement gets four sound quarters ----
{
  let planned = 0;
  for (const id of STRAND_IDS) {
    for (const level of [2.3, 3.1, 3.9, 4.6, 5.4]) {
      const plan = quartersForStrand(id, honestState(id, level));
      if (plan.blocked) continue; // some low levels legitimately refuse
      planned++;
      if (plan.quarters.length !== 4) {
        errors.push(
          `${id} at ${level}: got ${plan.quarters.length} quarters, not 4 — a year that stops in March`
        );
        continue;
      }
      const seenQ = plan.quarters.map((q) => q.quarter).join(',');
      if (seenQ !== '1,2,3,4') errors.push(`${id} at ${level}: quarters numbered ${seenQ}`);
      for (const q of plan.quarters) {
        if (!q.courseLabel) errors.push(`${id} at ${level} Q${q.quarter}: no course named`);
        if (!/^https:\/\/www\.khanacademy\.org\//.test(q.courseUrl || '')) {
          errors.push(`${id} at ${level} Q${q.quarter}: bad Khan link "${q.courseUrl}"`);
        }
        if (!q.units && !q.focus) {
          errors.push(`${id} at ${level} Q${q.quarter}: empty — no units and no focus`);
        }
        if (q.units && q.units.some((u) => !u || !u.trim())) {
          errors.push(`${id} at ${level} Q${q.quarter}: a blank unit name`);
        }
      }
    }
  }
  if (planned === 0) errors.push('no strand at any level produced a plan — something is wired wrong');
  else notes.push(`${planned} strand/level combinations each produced four sound quarters`);
}

// ---- 5. every reachable course has a scope ----
{
  const missing = new Set();
  for (const strandId of STRAND_IDS) {
    for (let l = 1.2; l <= 6.5001; l += 0.1) {
      const level = Math.round(l * 10) / 10;
      const bands = KHAN_MAP[strandId] || [];
      const band = bands.find((b) => level <= b.upTo) || bands[bands.length - 1];
      if (!band) continue;
      if (!scopeFor(band.course)) missing.add(band.course);
      if (!KHAN_COURSES[band.course]) missing.add(`${band.course} (not a course at all)`);
    }
  }
  if (missing.size) {
    errors.push(
      `${missing.size} course(s) a real level can land in have no four-quarter plan: ${[...missing].join(', ')}`
    );
  } else {
    notes.push('every course a level can land in has all four quarters written');
  }
}

// ---- her real transcript, as a sanity read ----
{
  const real = {
    'measurement-data': 2.0,
    geometry: 2.0,
    'grammar-usage': 2.15,
    'writing-strategies': 2.45,
    vocabulary: 2.91,
    'patterns-algebra': 2.98,
    'reading-comprehension': 3.46,
    'numbers-operations': 3.48,
    'fractions-decimals': 3.89
  };
  const strands = {};
  for (const [id, level] of Object.entries(real)) strands[id] = honestState(id, level);
  const { ready, blocked } = buildYearPlan(strands);
  notes.push(`on a clean transcript: ${ready.length} planned, ${blocked.length} refused`);
}

// ---------------------------------------------------------------------------
// GOALS AND THE SCHOOL CALENDAR — §3.11, §3.12.1. Added v3.58.
//
// Gigi: "I want her caught up to 5th grade by the end of the school year", then
// "what if the goal is before the beginning of the next school year?"
//
// That second question moved the deadline from May 26 to Aug 1, added the
// summer term's 26 school days, and took FIVE strands from "out of reach" to
// "stretch". None of that is computable without the calendar being DATA, which
// until v3.58 it was not — the dates lived in §25 of a markdown file.
// ---------------------------------------------------------------------------
{
  const cal = await import(pathToFileURL(resolve(ROOT, 'src/config/calendar.js')).href);
  const G = await import(pathToFileURL(resolve(ROOT, 'src/lib/goals.js')).href);
  const { pickBaseline, pickGoal } = await import(pathToFileURL(resolve(ROOT, 'src/lib/mergeBackup.js')).href);

  // ---- 1. The calendar must add up to what it claims. ----
  if (cal.TOTAL_SCHOOL_DAYS !== cal.SCHOOL_YEAR.declaredSchoolDays) {
    errors.push(
      `the school year's periods sum to ${cal.TOTAL_SCHOOL_DAYS} days and it declares ` +
        `${cal.SCHOOL_YEAR.declaredSchoolDays}. Georgia's hours record is built on this number.`
    );
  }
  // The summer term is load-bearing, not a footnote.
  const summer = cal.SCHOOL_YEAR.periods.find((p) => p.id === 'summer');
  if (!summer || summer.schoolDays <= 0) {
    errors.push(
      'the summer term is gone from the calendar. It is 26 school days, it is the difference ' +
        'between a goal reading out-of-reach on five strands and reading stretch on them, and ' +
        'Gigi made it a condition: "summer is not optional".'
    );
  }
  const toMay = cal.schoolDaysRemaining('2026-08-19', cal.END_OF_CLASSES);
  const toAug = cal.schoolDaysRemaining('2026-08-19', cal.END_OF_SUMMER);
  if (toAug <= toMay) {
    errors.push(`moving the deadline past the summer term adds no days (${toMay} -> ${toAug})`);
  }

  // ---- 2. The feasibility bands ARE §3.11.4. ----
  if (G.FEASIBILITY.reachable.maxMultiple !== 1.25 || G.FEASIBILITY.stretch.maxMultiple !== 2) {
    errors.push(
      'the feasibility bands no longer match §3.11.4 — reachable at 1.25x observed, stretch at 2x. ' +
        'Widening them does not make a target more achievable; it makes the warning quieter.'
    );
  }
  const near = G.feasibility({ gap: 1.1, fromDayKey: '2026-08-19' });
  const far = G.feasibility({ gap: 2.8, fromDayKey: '2026-08-19' });
  if (near.verdict !== 'reachable') errors.push(`a +1.1 gap over a full year reads "${near.verdict}"`);
  if (far.verdict !== 'unrealistic') errors.push(`a +2.8 gap over a full year reads "${far.verdict}"`);
  // An assumption must announce itself.
  if (near.assumed !== true) {
    errors.push(
      'a verdict computed with no observed growth data does not flag itself as an assumption. She ' +
        'has three school days and no growth history; a number that hides what it rests on is how a ' +
        'caveat loses an argument.'
    );
  }
  if (G.feasibility({ gap: 1.1, fromDayKey: '2026-08-19', observedRatePerYear: 1.4 }).assumed !== false) {
    errors.push('a verdict computed from real observed growth still claims to be an assumption');
  }

  // ---- 3. NO BASELINE, NO GOAL — and no goal on a strand still being measured. ----
  const sampled = { g1: { strandId: 'g1', level: 2.2, asked: 4, settled: false } };
  const measured = { g2: { strandId: 'g2', level: 2.2, asked: 8, settled: true } };
  const [thin] = G.proposeGrowthGoals({ strands: sampled, targetLevel: 5, fromDayKey: '2026-08-19' });
  const [solid] = G.proposeGrowthGoals({ strands: measured, targetLevel: 5, fromDayKey: '2026-08-19' });
  if (!thin.blockedReason) {
    errors.push(
      `a goal was offered on a strand asked ${thin.baseline.asked} questions and not settled. ` +
        `Grammar's 2.20 rests on four; geometry moved 2.00 -> 2.70 the moment easier items existed. ` +
        `A target set from a number like that and missed next July is not a measurement, it is an ` +
        `accusation.`
    );
  }
  if (solid.blockedReason) errors.push(`a properly measured strand is blocked: ${solid.blockedReason}`);
  if (typeof solid.baseline?.value !== 'number') errors.push('a proposed goal carries no baseline value');
  if (G.MIN_ASKED_FOR_A_GOAL < 6) {
    errors.push(`MIN_ASKED_FOR_A_GOAL is ${G.MIN_ASKED_FOR_A_GOAL}; fewer than six questions is a sample, not a measurement`);
  }

  // ---- 4. One goal per strand, never one for everything. ----
  const nine = Object.fromEntries(
    ['a', 'b', 'c'].map((id, i) => [id, { strandId: id, level: 2 + i, asked: 8, settled: true }])
  );
  const proposals = G.proposeGrowthGoals({ strands: nine, targetLevel: 5, fromDayKey: '2026-08-19' });
  if (proposals.length !== 3) {
    errors.push(
      `${proposals.length} goals proposed for 3 strands. The same target is reachable in fractions ` +
        `and out of reach in grammar; one goal for everything hides exactly that.`
    );
  }
  if (new Set(proposals.map((p) => p.feasibility.verdict)).size < 2) {
    errors.push('three strands at different levels all got the same verdict — the gap is not reaching the arithmetic');
  }

  // ---- 5. THE TWO MERGE RULES ARE OPPOSITES, ON PURPOSE. ----
  const early = { trackId: 't', capturedOn: '2026-08-14T00:00:00.000Z' };
  const late = { trackId: 't', capturedOn: '2027-01-01T00:00:00.000Z' };
  if (pickBaseline(early, late) !== early) errors.push('a baseline moved forward on a merge');
  const oldGoal = { goalId: 'g', updatedAt: '2026-08-14T00:00:00.000Z' };
  const newGoal = { goalId: 'g', updatedAt: '2027-01-01T00:00:00.000Z' };
  if (pickGoal(oldGoal, newGoal) !== newGoal) {
    errors.push(
      'a goal merge kept the older edit. A baseline must never move and a goal is MEANT to — the two ' +
        'rules sit two functions apart in mergeBackup.js and are deliberately opposite.'
    );
  }

  notes.push(
    `school year: ${cal.TOTAL_SCHOOL_DAYS} days, ${toMay} left to May 26 and ${toAug} to Aug 1 — ` +
      `the summer term is ${toAug - toMay} of them`
  );
  notes.push('goals: baseline mandatory, a strand still being measured cannot carry one, one goal per strand');
}

// ---------------------------------------------------------------------------
// A GOAL SHE CANNOT SEE IS NOT A GOAL. §3.11.6. Added v3.58.
//
//   "A goal appears as ONE LINE on the today surface — metric, current, target,
//    days left — OR IT DOES NOT EXIST. A goals screen the learner never opens
//    is a database row, not a goal."
//
// This app has shipped a whole course nobody could reach (v3.24), rubrics no
// screen rendered (v3.38), and a per-strand read-aloud breakdown with zero
// consumers (found v3.56). Three times, the same shape: written, correct,
// invisible. An engine with no screen would be the fourth.
// ---------------------------------------------------------------------------
{
  const { readFileSync } = await import('node:fs');
  const read = (f) => readFileSync(resolve(ROOT, f), 'utf8');
  const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

  const home = strip(read('src/components/Home/HomeDashboard.jsx'));
  const line = strip(read('src/components/Home/GoalLine.jsx'));
  const parent = strip(read('src/components/Parent/ParentDashboard.jsx'));
  const panel = strip(read('src/components/Parent/GoalsPanel.jsx'));
  const nav = read('src/config/navigation.js');

  // ---- HER side ----
  if (!home.includes('<GoalLine')) {
    errors.push(
      'HomeDashboard does not render GoalLine. §3.11.6 — a goal on the today surface or it does ' +
        'not exist. An engine with no screen is the v3.24 failure again.'
    );
  }
  if (!line.includes('goalStatus()')) {
    errors.push('GoalLine does not read goalStatus() — it renders something other than her real goals');
  }
  // The verdict is a PLANNING word for a grown-up. "Out of reach" on a child's
  // home screen every morning tells her the year is lost before it starts.
  if (/Out of reach|unrealistic|FEASIBILITY\[/.test(line)) {
    errors.push(
      'GoalLine shows the feasibility verdict. "Out of reach" is a word for the adult deciding what ' +
        'to commit to, not for a nine-year-old reading her home screen every morning.'
    );
  }

  // ---- THE GROWN-UP side ----
  if (!parent.includes('<GoalsPanel')) errors.push('the Grown-Up Corner never renders GoalsPanel');
  if (!nav.includes("id: 'goals'")) errors.push("PARENT_NAV has no 'goals' section, so the panel cannot be opened");

  // §3.11.4 — the verdict is rendered BEFORE the adult saves, not after.
  // ⚠️ SEARCHED FOR THE USE, NOT THE NAME. The first version looked for
  // "VerdictPill" and found its own DEFINITION forty lines above — so deleting
  // every place it renders left the check green. That is the v3.39 failure
  // (an assertion satisfied by a parameter name) for the third time in three
  // versions, and it is why every one of these now points at a JSX tag.
  const verdictAt = panel.indexOf('<VerdictPill');
  const saveAt = panel.indexOf('Set it');
  if (verdictAt < 0 || saveAt < 0 || verdictAt > saveAt) {
    errors.push(
      'the feasibility verdict is not rendered before the button that saves the goal. §3.11.4: ' +
        '"render the verdict before the adult saves" — it is what stops a target being set that her ' +
        'actual pace never had a chance of reaching, and then reported as her failure.'
    );
  }
  if (!/assumption, not a measurement/i.test(panel)) {
    errors.push(
      'the goals panel no longer says the verdicts rest on an assumption. She has no growth history ' +
        'yet, and a number that hides what it rests on is how a caveat loses an argument.'
    );
  }
  // Likewise: `blockedReason` appears in two filters at the top of the file, so
  // "does the word occur" passes even when nothing renders it. This asks
  // whether the REASON reaches the screen.
  if (!panel.includes('{p.blockedReason}')) {
    errors.push(
      'the goals panel does not show which strands are refused a target, or why. Hiding them makes ' +
        'the plan look complete while four of nine strands wait on a re-measure.'
    );
  }

  notes.push(
    'goals are reachable: one line on her Today surface, a panel in the Grown-Up Corner, and the ' +
      'verdict is rendered before the save'
  );
}

console.log('\nPetal & Pestle — year plan check\n');
for (const n of notes) console.log(`  · ${n}`);
if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors.slice(0, 12)) console.error(`  ✗ ${e}`);
  if (errors.length > 12) console.error(`  ...and ${errors.length - 12} more`);
  process.exit(1);
}
console.log('\nEvery planned year is built on a real measurement. Every unmeasured one says so.\n');
