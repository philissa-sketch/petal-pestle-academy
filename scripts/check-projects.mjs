// ---------------------------------------------------------------------------
// CHECK #21 — PROJECTS AND THE CATCH-UP DAY
//
// Run with: node scripts/check-projects.mjs
//
// Written at v3.10, when Friday and projects were added, and written the same
// way as everything else here: every assertion is one that would have caught a
// real way this could go wrong.
//
// ---- WHAT IT PROVES ----
//
//   * every module has exactly one project, and every project has a real module
//   * a project is never due before its own lessons have been taught
//   * the catch-up engine never invents work she has not reached
//   * a fresh child is not "behind" on anything
//   * finishing everything actually produces a caught-up state
//   * moving forward is what surfaces earlier unfinished work
//   * no project text contains dosing or treatment language
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { PROJECTS, projectForModule } = await import(pathToFileURL(resolve(ROOT, 'src/config/projects.js')).href);
const { HERBALISM_MODULES } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/herbalismCourse.js')).href);
const { allWeeks, CATCH_UP_DAY, REVIEW_DAY } = await import(pathToFileURL(resolve(ROOT, 'src/config/assessment.js')).href);
const { catchUpList, furthestWeek } = await import(pathToFileURL(resolve(ROOT, 'src/lib/catchUp.js')).href);

const errors = [];
const notes = [];

// ---------------------------------------------------------------------------
// 1. One project per module, no orphans
// ---------------------------------------------------------------------------
{
  for (const m of HERBALISM_MODULES) {
    const found = PROJECTS.filter((p) => p.module === m.n);
    if (found.length === 0) {
      errors.push(`Module ${m.n} (${m.title}) has no project. Every module ends in something she made.`);
    } else if (found.length > 1) {
      errors.push(`Module ${m.n} has ${found.length} projects. A module is a fortnight; that is one project.`);
    }
  }
  const moduleNumbers = new Set(HERBALISM_MODULES.map((m) => m.n));
  for (const p of PROJECTS) {
    if (!moduleNumbers.has(p.module)) {
      errors.push(`${p.id} belongs to module ${p.module}, which does not exist`);
    }
  }
  const ids = PROJECTS.map((p) => p.id);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) errors.push(`duplicate project ids: ${[...new Set(dup)].join(', ')}`);
  if (!errors.length) notes.push(`${PROJECTS.length} projects, one per module, ids unique`);
}

// ---------------------------------------------------------------------------
// 2. A project is never due before its own lessons are taught
// ---------------------------------------------------------------------------
{
  for (const p of PROJECTS) {
    const mod = HERBALISM_MODULES.find((m) => m.n === p.module);
    if (!mod) continue;
    if (p.quarter !== mod.quarter) {
      errors.push(
        `${p.id} is due in quarter ${p.quarter} but module ${p.module} runs in quarter ${mod.quarter}`
      );
    }
    const lastWeek = Math.max(...mod.weeks);
    if (p.dueWeek !== lastWeek) {
      errors.push(
        `${p.id} is due in week ${p.dueWeek}; module ${p.module} runs weeks ${mod.weeks.join('-')}. ` +
          `A project is due on the Friday of its module's LAST week — earlier and she has not been ` +
          `taught it yet, later and it drifts into the next module's fortnight.`
      );
    }
  }
  if (!errors.length) notes.push('every project falls on the Friday of its own module’s second week');
}

// ---------------------------------------------------------------------------
// 3. Friday itself
// ---------------------------------------------------------------------------
{
  if (CATCH_UP_DAY.day <= REVIEW_DAY.day) {
    errors.push(`the catch-up day (${CATCH_UP_DAY.day}) is not after the review day (${REVIEW_DAY.day})`);
  }
  if (CATCH_UP_DAY.newLessons !== 0) {
    errors.push('the catch-up day teaches new lessons. Friday finishes the week, it does not extend it.');
  }
  if (CATCH_UP_DAY.scored !== false) {
    errors.push('the catch-up day is scored. A make-up day that costs her something is one she avoids.');
  }
  notes.push(`Friday is day ${CATCH_UP_DAY.day}, unscored, and teaches nothing new`);
}

// ---------------------------------------------------------------------------
// 4. The catch-up engine
// ---------------------------------------------------------------------------
{
  const weeks = [...allWeeks()].sort((a, b) => a.quarter - b.quarter || a.n - b.n);

  // 4a. A child on day one is behind on nothing.
  const fresh = catchUpList({ lessonsRead: [], attemptsByTest: {}, projectStatus: {} });
  if (fresh.started) errors.push('a child who has read nothing is reported as started');
  if (fresh.total !== 0) {
    errors.push(
      `a child who has read nothing is ${fresh.total} items behind. Friday must not open with a ` +
        `list of work she was never going to have done.`
    );
  }
  if (furthestWeek([]) !== null) errors.push('furthestWeek() invented a week for a child with no reads');

  // 4b. Reading one lesson of week 1 surfaces the rest of week 1 and nothing later.
  const w1 = weeks[0];
  const one = catchUpList({ lessonsRead: [w1.lessons[0]], attemptsByTest: {}, projectStatus: {} });
  if (one.lessons.length !== w1.lessons.length - 1) {
    errors.push(
      `after one lesson of week 1, ${one.lessons.length} lessons are listed; expected ` +
        `${w1.lessons.length - 1} (the rest of that week and nothing beyond it)`
    );
  }
  if (one.tests.length !== 0) {
    errors.push('a test was offered for a week whose lessons are not all read — that is a trick question');
  }

  // 4c. Finishing a whole week offers exactly that week's test.
  const allW1 = catchUpList({ lessonsRead: [...w1.lessons], attemptsByTest: {}, projectStatus: {} });
  if (allW1.lessons.length !== 0) errors.push('a fully read week still lists unread lessons');
  if (allW1.tests.length !== 1 || allW1.tests[0].testId !== w1.id) {
    errors.push(`finishing week 1 should offer exactly its own test; got ${allW1.tests.length}`);
  }

  // 4d. Jumping ahead surfaces the skipped week. This is the whole point.
  const w2 = weeks[1];
  const skipped = catchUpList({
    lessonsRead: [...w1.lessons.slice(0, 2), ...w2.lessons],
    attemptsByTest: {},
    projectStatus: {}
  });
  const skippedIds = skipped.lessons.map((l) => l.lessonId);
  if (!skippedIds.includes(w1.lessons[2])) {
    errors.push(
      'moving into week 2 did not surface the unread lesson from week 1. Going forward is what ' +
        'is supposed to reveal the debt — otherwise it is never seen at all.'
    );
  }

  // 4e. Everything done, everything sat, every project finished -> caught up.
  const everyLesson = weeks.flatMap((w) => w.lessons);
  const everyTest = {};
  for (const w of weeks) everyTest[w.id] = [{ fraction: 1, dayKey: '2026-01-01' }];
  const everyProject = {};
  for (const p of PROJECTS) everyProject[p.id] = { projectId: p.id, doneAt: '2026-01-01' };
  const done = catchUpList({
    lessonsRead: everyLesson,
    attemptsByTest: everyTest,
    projectStatus: everyProject
  });
  if (done.total !== 0) {
    errors.push(
      `with every lesson read, every test sat and every project finished, Friday still lists ` +
        `${done.total} items (${done.lessons.length} lessons, ${done.tests.length} tests, ` +
        `${done.projects.length} projects). Being finished has to be reachable.`
    );
  }

  // 4f. An unfinished project at a reached week must appear.
  const someProjects = {};
  for (const p of PROJECTS.slice(1)) someProjects[p.id] = { projectId: p.id, doneAt: '2026-01-01' };
  const oneOpen = catchUpList({
    lessonsRead: everyLesson,
    attemptsByTest: everyTest,
    projectStatus: someProjects
  });
  if (!oneOpen.projects.some((p) => p.id === PROJECTS[0].id)) {
    errors.push(`an unfinished project (${PROJECTS[0].id}) did not appear on Friday`);
  }

  if (!errors.length) {
    notes.push(
      'the catch-up engine: nothing for a fresh child, the rest of the week after one lesson, ' +
        'a test only when the week is complete, the skipped lesson surfaced by moving on, and ' +
        'finishing everything actually reaching zero'
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Safety — a project is hands in dirt, never a preparation for a body
// ---------------------------------------------------------------------------
{
  const BANNED = [
    /\b(cures?|curing)\b/i,
    /\b(dose|dosage|doses)\b/i,
    /\b(remedy|remedies)\s+for\b/i,
    /\bgood\s+for\s+(a|an|the|your)?\s*\w*\s*(ache|pain|cold|flu|cough|fever|burn|cut|rash|stomach|throat|head)/i,
    /\b(take|drink|eat|swallow|chew)\s+(this|it|that|some)\s+(for|when|if)\b/i,
    /\bmakes?\s+you\s+feel\s+better\b/i
  ];
  let scanned = 0;
  for (const p of PROJECTS) {
    const strings = [p.title, p.what, p.runs, p.done, p.note || '', ...p.needs, ...p.steps];
    for (const text of strings) {
      scanned++;
      for (const re of BANNED) {
        if (re.test(text)) {
          errors.push(`SAFETY — ${p.id}: "${text}" reads as dosing or treatment language`);
        }
      }
    }
  }
  if (!errors.some((e) => e.startsWith('SAFETY'))) {
    notes.push(`${scanned} project strings scanned for dosing language — none found`);
  }
}

// ---------------------------------------------------------------------------

console.log('\nPetal & Pestle — projects and the catch-up day\n');
for (const n of notes) console.log(`  · ${n}`);
console.log('');
if (errors.length) {
  console.log(`FAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`PASSED — ${PROJECTS.length} projects, one per module, and Friday behaves.\n`);
