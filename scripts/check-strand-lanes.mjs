// ---------------------------------------------------------------------------
// CHECK — EACH STRAND WALKS ITS OWN UNITS, AND NOTHING SKIPS.
//
// Run with: node scripts/check-strand-lanes.mjs
//
// ---- WHY THIS EXISTS ----
//
// Her three maths strands all route to 2nd Grade Math, and until v3.81 every
// one of them was offered Unit 1 — because units ran in order and her record
// holds no grades.
//
//     Measurement & Data  2.50  — her LOWEST strand — is Unit 6
//     Geometry            2.82  — her second lowest — is Unit 8
//     Unit 1 is "Add and subtract within 20", which teaches
//     Numbers & Operations — 3.48, her second STRONGEST strand
//
// So the unit-order rule was spending her weakest strands' half hour on her
// strongest one, for months. Gigi chose one lane per strand: "B", Aug 25 2026.
//
// ---- ⚠️ AND THE THING THIS CHECK REALLY GUARDS IS THE v3.20 BUG ----
//
// Gigi, Aug 16 2026: "math just skips to unit 6 instead of starting at unit 1."
// One strand chose the course AND the unit, so Measurement 2.00 landed her on
// Unit 6 with Units 1-5 never opened and the Course Challenge unreachable for
// ever.
//
// LANES ARE NOT THAT, AND THE DIFFERENCE HAS TO BE ENFORCED RATHER THAN
// DESCRIBED. Each lane starts at its own first unit and runs in order; every
// unit belongs to exactly one lane; and the Course Challenge still asks the
// whole course. Break any one of those and this is v3.20 again wearing a new
// coat — which is how the "correct and unreachable" family of bugs keeps
// arriving here.
//
// ---- AND THE LANES ARE AN INFERENCE ----
//
// "Unit 6 · Measurement" teaches Measurement & Data. Plainly true from the
// title, and NOT observed inside the unit, because this app cannot see inside a
// Khan unit. So the unit name each lane was read off is recorded beside it and
// asserted here. A guess that stops announcing itself becomes a fact (v3.75).
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// v3.73: Windows rejects a bare path here. pathToFileURL, every time.
const load = (p) => import(pathToFileURL(resolve(ROOT, p)).href);

const {
  KHAN_UNIT_COURSES,
  STRAND_LANES,
  laneFor,
  hasLanes,
  nextUnitFor,
  nextUnitForStrand
} = await load('src/data/khan/khanUnits.js');
const { STRAND_IDS } = await load('src/config/strands.js');
const { resolveBlockTarget } = await load('src/lib/blockLinks.js');
const { unitForStrand } = await load('src/data/khan/khanMap.js');
const { buildActionPlan } = await load('src/lib/actionPlan.js');

const errors = [];
const notes = [];
const fail = (rule, msg) => errors.push(`[${rule}] ${msg}`);

// ---- 1. EVERY UNIT IN EXACTLY ONE LANE ------------------------------------
//
// A unit in no lane can never be reached by any strand, and the Course
// Challenge can then never unlock — the v3.20 harm, arriving by omission
// instead of by skipping. A unit in two lanes means two strands claim the same
// work and one of them will be told it is theirs when it is not.
for (const [courseId, lanes] of Object.entries(STRAND_LANES)) {
  const course = KHAN_UNIT_COURSES[courseId];
  if (!course) {
    fail('lane-course-exists', `STRAND_LANES has "${courseId}", which is not a unit course`);
    continue;
  }

  const seen = new Map();
  for (const [strandId, lane] of Object.entries(lanes)) {
    if (!STRAND_IDS.includes(strandId)) {
      fail('lane-strand-exists', `${courseId} has a lane for "${strandId}", which is not a strand`);
    }
    if (!lane.units?.length) {
      fail('lane-has-units', `${courseId}/${strandId} has an empty lane. A strand with no units must be ABSENT, not empty — absent falls back honestly, empty is a dead end.`);
      continue;
    }
    for (const n of lane.units) {
      if (!course.units.some((u) => u.n === n)) {
        fail('lane-unit-exists', `${courseId}/${strandId} claims unit ${n}, which this course does not have`);
      }
      if (seen.has(n)) {
        fail(
          'one-lane-per-unit',
          `${courseId} unit ${n} is in both ${seen.get(n)} and ${strandId}. Two strands claiming one unit means one of them is told it is hers when it is not.`
        );
      }
      seen.set(n, strandId);
    }

    // ---- THE LANE IS IN ORDER, OR IT SKIPS INSIDE ITSELF ----
    const sorted = [...lane.units].sort((a, b) => a - b);
    if (JSON.stringify(sorted) !== JSON.stringify(lane.units)) {
      fail(
        'lane-written-in-order',
        `${courseId}/${strandId} lists units ${lane.units.join(', ')} out of order. The one thing lanes promise is that nothing skips inside them.`
      );
    }

    // ---- ⚠️ THE INFERENCE IS CHECKED, NOT TRUSTED ----
    if (!lane.why || lane.why.length !== lane.units.length) {
      fail(
        'lane-records-what-it-read',
        `${courseId}/${strandId} has ${lane.why?.length ?? 0} recorded unit names for ${lane.units.length} units. The lane was read off Khan's unit TITLES, never observed inside the unit — an inference that stops saying so becomes a fact.`
      );
      continue;
    }
    lane.units.forEach((n, i) => {
      const real = course.units.find((u) => u.n === n);
      if (real && real.name !== lane.why[i]) {
        fail(
          'lane-still-matches-the-unit-name',
          `${courseId} unit ${n} is now called "${real.name}" but its lane was read off "${lane.why[i]}". Khan renamed the unit underneath the inference — re-read it before trusting the lane.`
        );
      }
    });
  }

  // ---- EVERY UNIT COVERED ----
  const uncovered = course.units.filter((u) => !seen.has(u.n));
  if (uncovered.length) {
    fail(
      'every-unit-is-in-a-lane',
      `${courseId}: unit(s) ${uncovered.map((u) => u.n).join(', ')} are in no lane. No strand can reach them, so they can never be graded and the Course Challenge can never unlock.`
    );
  } else {
    notes.push(`${courseId}: all ${course.units.length} units covered, one lane each`);
  }
}

// ---- 2. A STRAND WITH NO LANE FALLS BACK — IT IS NOT GIVEN ONE ------------
//
// ⚠️ PATTERNS & ALGEBRA ROUTES TO 2nd GRADE MATH AND NOT ONE OF ITS EIGHT
// UNITS TEACHES IT. Folding it into Place Value to make the table look complete
// would aim her weakest-strand time at something that does not teach the
// strand — §35's mistake, where `scale` was tagged Measurement and turned out
// to mean scale MODEL.
{
  if (laneFor('math2', 'patterns-algebra')) {
    fail(
      'no-invented-lane',
      'patterns-algebra has been given a lane in math2. Khan 2nd Grade Math has no patterns or algebra unit; a lane here would aim her at units that do not teach it.'
    );
  }
  const fellBack = nextUnitForStrand('math2', 'patterns-algebra', []);
  if (!fellBack) {
    fail('fallback-still-opens-something', 'patterns-algebra opens nothing at all in math2');
  } else if (fellBack.lane !== false) {
    fail(
      'fallback-says-it-is-a-fallback',
      'patterns-algebra reported lane: true. The caller must be able to tell "this is your Measurement unit" from "this is the next unit of the course" — only one is a claim about her strand.'
    );
  } else {
    notes.push('patterns-algebra has no lane in math2 and says so rather than inventing one');
  }

  // Reading has no lanes at all: its units are THEMES.
  if (hasLanes('ela2') || hasLanes('ela3')) {
    fail(
      'no-lanes-on-themed-units',
      'a reading course has been given lanes. ela2 is Fairy Tales Retold, The Moon, Rural/Suburban/Urban — themes, each teaching vocabulary and comprehension together. Splitting them is a claim about the inside of a unit nobody has seen.'
    );
  }
}

// ---- 3. A LANE STARTS AT ITS FIRST UNIT AND WALKS IN ORDER ----------------
for (const [courseId, lanes] of Object.entries(STRAND_LANES)) {
  for (const [strandId, lane] of Object.entries(lanes)) {
    const grades = [];
    for (const expected of [...lane.units].sort((a, b) => a - b)) {
      const got = nextUnitForStrand(courseId, strandId, grades);
      if (!got || !got.lane) {
        fail(
          'lane-walks-to-the-end',
          `${courseId}/${strandId} left its lane at unit ${expected} with units still ungraded`
        );
        break;
      }
      if (got.unit.n !== expected) {
        fail(
          'lane-never-skips',
          `${courseId}/${strandId} offered unit ${got.unit.n} when unit ${expected} was the next ungraded one in the lane. THIS IS THE v3.20 BUG — a unit she never sat, marked passed by being jumped over.`
        );
        break;
      }
      grades.push({ courseId, unitN: expected, correct: 8, total: 10 });
    }
  }
}
if (!errors.length) notes.push('every lane starts at its first unit and walks in order, skipping nothing');

// ---- 4. ⚠️ FINISHING A LANE IS NOT FINISHING THE COURSE -------------------
//
// Before lanes, "no next unit" could only mean the whole course was graded, and
// offering the Course Challenge was right. The Geometry lane is ONE unit of
// eight. Gigi at v3.76: "the course challenge is the test after all the units
// are completed."
{
  const geometryDone = [{ courseId: 'math2', unitN: 8, correct: 9, total: 10 }];
  const strands = {
    geometry: { strandId: 'geometry', level: 2.82, asked: 6 },
    'measurement-data': { strandId: 'measurement-data', level: 2.5, asked: 6 },
    'patterns-algebra': { strandId: 'patterns-algebra', level: 2.98, asked: 6 }
  };
  // Geometry is lowest here so it chooses, and its lane is done.
  const onlyGeom = { geometry: strands.geometry };
  const t = resolveBlockTarget({ id: 'blk-math', subject: 'math' }, onlyGeom, geometryDone, [], new Date());
  if (t?.challenge) {
    fail(
      'a-finished-lane-does-not-unlock-the-challenge',
      'one unit of eight was graded and the block offered the Course Challenge — the cumulative final for a course she has done an eighth of.'
    );
  }
  if (!t || t.kind !== 'khan' || !t.unitN) {
    fail(
      'a-finished-lane-moves-to-the-rest',
      'her lane was finished and the block offered no further unit. A finished lane is not a finished course; she moves to the rest of it in order.'
    );
  }
  if (t?.unitN === 8) {
    fail('a-graded-unit-is-not-offered-again', 'unit 8 was graded and was offered again');
  }

  // Everything graded -> the challenge, still.
  const allDone = KHAN_UNIT_COURSES.math2.units.map((u) => ({
    courseId: 'math2',
    unitN: u.n,
    correct: 8,
    total: 10
  }));
  const done = resolveBlockTarget({ id: 'blk-math', subject: 'math' }, onlyGeom, allDone, [], new Date());
  if (!done?.challenge) {
    fail(
      'every-unit-done-still-unlocks-the-challenge',
      'all eight units graded and the Course Challenge was not offered. The finish line Gigi asked for has to still arrive.'
    );
  }
  if (nextUnitFor('math2', allDone) !== null) {
    fail('whole-course-agrees', 'nextUnitFor still offers a unit when all eight are graded');
  }
  notes.push('a finished lane moves to the rest of the course; only a finished COURSE unlocks the challenge');
}

// ---- 5. THE BLOCK GIVES HER LOWEST STRAND ITS OWN UNIT --------------------
{
  const strands = {
    'measurement-data': { strandId: 'measurement-data', level: 2.5, asked: 6 },
    geometry: { strandId: 'geometry', level: 2.82, asked: 6 },
    'patterns-algebra': { strandId: 'patterns-algebra', level: 2.98, asked: 6 }
  };
  const t = resolveBlockTarget({ id: 'blk-math', subject: 'math' }, strands, [], [], new Date());
  const lane = laneFor('math2', 'measurement-data');
  const first = Math.min(...lane.units);
  if (t?.unitN !== first) {
    fail(
      'the-block-opens-her-lane',
      `her lowest maths strand is Measurement & Data, whose lane starts at unit ${first}, and the block opened unit ${t?.unitN}`
    );
  }
  if (!t?.onHerLane || t?.strandId !== 'measurement-data') {
    fail(
      'the-target-says-whose-lane-it-is',
      'the target does not carry onHerLane and the strand it belongs to, so nothing downstream can tell a lane unit from a fallback unit'
    );
  }
  if (t?.unitN === 1) {
    fail(
      'her-weakest-strand-is-not-sent-to-her-strongest',
      'the maths block opened Unit 1, "Add and subtract within 20" — which teaches Numbers & Operations, her 3.48 strand. That is the whole problem v3.81 exists to fix.'
    );
  } else {
    notes.push(`Measurement & Data 2.50 opens unit ${t.unitN}, not unit 1`);
  }
}

// ---- 7. ⚠️ HER PLAN AND HER BLOCK NAME THE SAME UNIT — v3.92 -------------
//
// ---- HOW THIS WAS FOUND, WHICH IS THE UNCOMFORTABLE PART ----
//
// By OPENING THE LIVE SITE AND READING IT. Not by a check. All 38 were green
// while her Home dashboard said "2nd Grade Math → Measurement" and the
// Mathematics block on Today opened "Unit 5 · Money and time".
//
// Home asked `khanFor`, whose `unit` is a static label written into KHAN_MAP in
// the v3.20 era, when a strand had exactly one unit. The block asked
// `nextUnitForStrand`, which walks the lane v3.81 gave her.
//
// ⚠️ AND GEOMETRY AGREED IN BOTH — lane [8], map unitN 8. Measurement is the
// only strand with a MULTI-UNIT lane, so it is the only place the two could
// diverge. Two implementations of one metric agreeing everywhere anyone looked
// and disagreeing in one place is v3.78, v3.84, and now this. THIRD TIME.
//
// There is one function now, `unitForStrand`, and both callers use it. This
// asserts that — through the two REAL entry points, not by calling the shared
// function twice and watching it agree with itself, which would assert nothing.

{
  // A record with every strand measured and NO Khan grades: her actual state,
  // and the state in which a lane is at its first unit.
  const strands = {};
  for (const id of STRAND_IDS) {
    strands[id] = { strandId: id, level: 2.44, asked: 6, correct: 3, settled: true };
  }
  // Spread the levels so each strand lands in a different band rather than all
  // nine resolving identically — a fixture where everything is the same value
  // can agree for reasons that have nothing to do with the rule.
  const spread = [2.35, 2.44, 2.67, 2.67, 2.91, 2.98, 3.46, 3.48, 3.89];
  STRAND_IDS.forEach((id, i) => { strands[id].level = spread[i % spread.length]; });

  const plan = buildActionPlan(strands, []);
  const buckets = [...plan.focus, ...plan.steady, ...plan.stretch];

  if (buckets.length === 0) {
    fail(
      'the-plan-produced-strands-to-compare',
      'buildActionPlan returned no measured strands, so this assertion compared nothing. A check ' +
        'that silently matches nothing is the shape run-all-checks refuses.'
    );
  }

  let compared = 0;
  for (const row of buckets) {
    const direct = unitForStrand(row.strand.id, row.level, []);
    if (!direct || !row.khan) continue;
    compared += 1;

    if (row.khan.unit !== direct.unit) {
      fail(
        'the-plan-names-the-unit-the-lane-gives-her',
        `the action plan says ${row.strand.label} opens "${row.khan.unit}" and unitForStrand says ` +
          `"${direct.unit}". Home, My Plan and the Grown-Up Corner all render this field. This is ` +
          `the v3.92 bug: a static KHAN_MAP label disagreeing with the lane she actually walks.`
      );
    }
    if (row.khan.unitN !== direct.unitN) {
      fail(
        'the-plan-names-the-unit-NUMBER-the-lane-gives-her',
        `${row.strand.label}: the plan carries unit ${row.khan.unitN}, the lane gives ${direct.unitN}. ` +
          `Measurement & Data is the strand this diverges on — KHAN_MAP says 6 because Unit 6 is ` +
          `CALLED Measurement, and the lane [5,6,7] starts at 5, "Money and time".`
      );
    }
  }

  if (compared === 0) {
    fail(
      'something-was-actually-compared',
      'not one strand in the action plan could be compared against unitForStrand. The shapes have ' +
        'drifted apart and this assertion is reading data it cannot understand.'
    );
  } else {
    notes.push(`plan vs lane: ${compared} strands, same unit and same unit number`);
  }
}

// ---- report ---------------------------------------------------------------
console.log('\nPetal & Pestle — does each strand walk its own units?\n');
if (errors.length) {
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(`\n${errors.length} problem${errors.length === 1 ? '' : 's'}.\n`);
  process.exit(1);
}
for (const n of notes) console.log('  · ' + n);
console.log('  · no grade row in this check was built by hand from a shape the app cannot produce');
console.log(
  '\nNOT TESTED HERE: whether a Khan unit really teaches the strand its title says. ' +
    'That is read off the title and cannot be seen from here.\n'
);
process.exit(0);
