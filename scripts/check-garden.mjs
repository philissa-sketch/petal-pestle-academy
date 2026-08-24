// ---------------------------------------------------------------------------
// Run with: node scripts/check-garden.mjs
//
// THE GARDEN HAS TO SHOW REAL CHANGE, AND IT MUST NEVER SHOW HER A RANKING.
//
// Gigi: "'Your Garden' I prefer it comes from seed and grow to a flower so that
// she can see real change."
//
// The old screen could not do that and the reason is worth writing down. It drew
// one stem per Check-In strand and the stem's HEIGHT was her measured level. So
// it moved only when the Check-In moved — twice a year — and nine stems sorted
// short to tall is a ranking of a child's own skills, drawn in plants. Her two
// weakest strands were the two shortest stems on the screen.
//
// From v3.15 a plant grows on the DAYS SHE WORKED that subject. Same rule as
// Petals: effort, never accuracy. This script guards the four properties that
// make that true, and the third one is the one that would catch a regression
// back to the old design.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  STAGES,
  GARDEN_PLANTS,
  DAYS_PER_EXTRA_BLOOM,
  MAX_BLOOMS,
  stageFor,
  daysWorked,
  gardenFor
} from '../src/lib/garden.js';
import { DEFAULT_SCHEDULE } from '../src/config/schedule.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const notes = [];

// ---- 1. seed to flower, in order, starting at nothing ---------------------
{
  const ids = STAGES.map((s) => s.id);
  const wanted = ['seed', 'sprout', 'leaf', 'bud', 'flower'];
  if (ids.join(',') !== wanted.join(',')) {
    errors.push(`stages are ${ids.join(' → ')}, and Gigi asked for ${wanted.join(' → ')}`);
  }
  if (STAGES[0].at !== 0) errors.push('the first stage does not start at zero days');
  for (let i = 1; i < STAGES.length; i++) {
    if (STAGES[i].at <= STAGES[i - 1].at) {
      errors.push(`${STAGES[i].id} is reached at ${STAGES[i].at} days, no later than ${STAGES[i - 1].id}`);
    }
  }
  // A child who works a whole day and sees nothing change does not come back.
  if (STAGES[1].at > 1) {
    errors.push(`the first visible change takes ${STAGES[1].at} days — one day of work must move it`);
  }
  notes.push(`stages: ${STAGES.map((s) => `${s.label} @${s.at}d`).join(' · ')}`);
}

// ---- 2. it never stops changing, and never runs away ----------------------
{
  const flowerAt = STAGES[STAGES.length - 1].at;
  const atFlower = stageFor(flowerAt);
  if (!atFlower.flowering || atFlower.blooms !== 1) {
    errors.push('reaching the last stage does not open a first bloom');
  }
  const later = stageFor(flowerAt + DAYS_PER_EXTRA_BLOOM);
  if (later.blooms <= atFlower.blooms) {
    errors.push('the plant stops changing once it flowers — the rest of the year shows nothing');
  }
  // A full school year is about 170 days. The cap should be reached AT the end
  // of a year of work, not in November.
  const capAt = flowerAt + (MAX_BLOOMS - 1) * DAYS_PER_EXTRA_BLOOM;
  if (capAt < 100) {
    errors.push(`every bloom is open after only ${capAt} days — there is nothing left to work toward`);
  }
  if (stageFor(400).blooms > MAX_BLOOMS) errors.push('blooms grow without limit');
  notes.push(`flowers at ${flowerAt} days · all ${MAX_BLOOMS} blooms at ${capAt} days`);
}

// ---- 3. GROWTH IS EFFORT, NOT MEASUREMENT --------------------------------
//
// The assertion that would have caught the old design, and the one that stops
// it coming back. The garden library must not know what a diagnostic level is,
// and the screen must not compute a plant from one.
{
  const lib = readFileSync(resolve(ROOT, 'src/lib/garden.js'), 'utf8');
  const view = readFileSync(resolve(ROOT, 'src/components/Levels/LevelsView.jsx'), 'utf8');

  if (/diagnosticEngine|MIN_LEVEL|MAX_LEVEL|\.level\b/.test(lib)) {
    errors.push(
      'lib/garden.js reads a measured level. Growth would come from how she SCORED, ' +
        'which is the v3.14 design: it moves twice a year and it draws her weakest subject as a stunted plant.'
    );
  }
  const plantFn = view.slice(view.indexOf('function Plant('), view.indexOf('function GardenPlot('));
  if (!plantFn) {
    errors.push('LevelsView.jsx has no Plant component');
  } else if (/state\.level|describeLevel|stemHeight|pct/.test(plantFn)) {
    errors.push('the Plant drawing is computed from her measured level again, not from her work');
  }
  if (!view.includes('gardenFor')) {
    errors.push('LevelsView.jsx does not use the garden library, so the rules above guard nothing');
  }
  // And the level must still be ON the screen — in words. Removing it entirely
  // would be a different kind of dishonest.
  if (!view.includes('describeLevel')) {
    errors.push('the Check-In result has vanished from the screen entirely');
  }
}

// ---- 4. every plant can actually grow ------------------------------------
//
// A plant whose subject has no block on her timetable is a seed for ever, and
// nothing on screen would say why.
{
  const subjects = new Set(DEFAULT_SCHEDULE.map((b) => b.subject).filter(Boolean));
  for (const p of GARDEN_PLANTS) {
    if (!subjects.has(p.subject)) {
      errors.push(
        `${p.label} has a plant but no block on the school day, so it can never leave the seed stage`
      );
    }
  }
  notes.push(`${GARDEN_PLANTS.length} plants, one per subject she studies`);
}

// ---- 5. a day counts once, however many blocks --------------------------
{
  const blocks = [
    { id: 'a', subject: 'math' },
    { id: 'b', subject: 'math' },
    { id: 'c', subject: 'reading' }
  ];
  const oneDayBothBlocks = { d1: { done: { a: true, b: true } } };
  if (daysWorked(oneDayBothBlocks, blocks, 'math') !== 1) {
    errors.push(
      'two maths blocks ticked on one day count as two days — splitting a block in the ' +
        'Grown-Up Corner would double her garden'
    );
  }
  const twoDays = { d1: { done: { a: true } }, d2: { done: { b: true } } };
  if (daysWorked(twoDays, blocks, 'math') !== 2) errors.push('two days of maths do not count as two');
  if (daysWorked(twoDays, blocks, 'reading') !== 0) {
    errors.push('a maths day is growing the reading plant');
  }
  // An untouched day must not count. Un-ticking everything has to take it back.
  if (daysWorked({ d1: { done: {} } }, blocks, 'math') !== 0) {
    errors.push('a day with nothing ticked still counts as a day worked');
  }
}

// ---- 6. nothing is ever stunted -----------------------------------------
//
// A subject she has not started is a SEED — a beginning — and never a short or
// withered version of a flower. This is the whole reason the old screen was
// wrong, expressed as a property.
{
  const fresh = gardenFor({ scheduleDays: {}, blocks: DEFAULT_SCHEDULE });
  for (const p of fresh) {
    if (p.stage.id !== 'seed') errors.push(`${p.label} does not start as a seed`);
    if (!p.next) errors.push(`${p.label} starts with nothing to work toward`);
  }
  notes.push('an unworked subject is a seed, not a short flower');
}

// ---- Report --------------------------------------------------------------
console.log('\nPetal & Pestle — garden check');
console.log('Does it show real change, and does it show it for the right reason?\n');
for (const n of notes) console.log(`  · ${n}`);

if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\nSeed to flower, driven by the days she works. Nothing is stunted.\n');
