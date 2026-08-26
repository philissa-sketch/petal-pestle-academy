// ---------------------------------------------------------------------------
// CHECK — THE BOOK REPORT IS SCHEDULED, STEPPED, AND ACTUALLY WRITTEN.
//
// Run with: node scripts/check-book-report.mjs
//
// ---- WHY THIS EXISTS ----
//
// Gigi, Aug 25 2026: "Azianna is also supposed to have book reports but I don't
// see them anywhere. Also, do the book report like Lamar's. Structured so she
// will know what to do."
//
// They existed. Four a year, one per quarter, with a four-part frame and a
// four-row rubric, sitting at the bottom of the Journal since v3.38.
//
// ⚠️ AND NOTHING EVER SAID IT WAS TIME TO DO ONE. No schedule, no block, no
// prompt, no date. Her record holds ZERO writing marks. The inverse of the
// Singing & Movement bug at v3.64 — that was a tick-box with no door; this was
// a door nothing ever knocked on. Both are the same family, and this app has
// now built six of them.
//
// ---- THE THREE RULES THIS GUARDS, ALL THREE FROM LAMAR'S OWN LOG ----
//
// 1. ⚠️ A CHECKBOX IS NOT AN ARTIFACT (his log, Aug 15 2026):
//
//      "A book report ticked but not written leaves the app recording that work
//       happened while holding no evidence of it. For a homeschool portfolio
//       that is backwards — the artifact IS the record."
//
//    Georgia asks for the portfolio (§40), not the tick.
//
// 2. TWO BOXES, NEVER ONE: "collapsing notes and draft would quietly delete the
//    planning week the milestone exists to protect." Step 2 marks two places in
//    the book; step 3 writes the draft. One box means 3 eats 2.
//
// 3. ONE FACT, ONE PLACE: "Do not add a dueDate field to writingPrompts... those
//    describe what the work IS. One fact, one place; this codebase has been
//    bitten four separate times."
//
// ---- AND ONE RULE THAT IS THIS APP'S ALONE ----
//
// ⚠️ NO DATES. His steps count backward from a real due date. THIS APP HAS NO
// CALENDAR AND REFUSES ONE, in five files. Everything paces on her progress. A
// due date appearing anywhere in this feature is a mechanism lifted out of an
// app that has something this one deliberately does not — §38 in a new form.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// v3.73: Windows rejects a bare path here. pathToFileURL, every time.
const load = (p) => import(pathToFileURL(resolve(ROOT, p)).href);

const { BOOK_REPORT, WRITING_FINAL_STEP, piecesForYear } = await load(
  'src/data/writing/writingPieces.js'
);
const {
  bookReportNow,
  spineWeek,
  quarterOfWeek,
  weekWithinQuarter,
  OPENS_AT_WEEK_IN_QUARTER,
  WEEKS_PER_QUARTER,
  SPINE_COURSE
} = await load('src/lib/bookReportSchedule.js');
const { WEEKS } = await load('src/config/assessment.js');
const { BOOK_REPORT_FORMATS, formatById, REPORT_SIZE, DEFAULT_FORMAT_ID } = await load(
  'src/data/writing/reportFormats.js'
);
const { analyse } = await load('src/lib/readingLoad.js');
const { READING_CAPS } = await load('src/lib/readingCaps.js');
const { pickWritingDraft } = await load('src/lib/mergeBackup.js');

const errors = [];
const notes = [];
const fail = (rule, msg) => errors.push(`[${rule}] ${msg}`);

/** Comments stripped, so an assertion cannot be satisfied by prose. v3.62. */
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((line) => {
      const i = line.indexOf('//');
      return i === -1 ? line : line.slice(0, i);
    })
    .join('\n');
}

// ---- 1. EVERY STEP CARRIES A REAL INSTRUCTION, NOT A LABEL ----------------
//
// His log: "Steps carry real instructions, not labels... The verification
// enforces a minimum instruction length so a future step can't ship as a bare
// label." "Rough draft" tells a nine-year-old nothing.
{
  const steps = BOOK_REPORT.steps || [];
  if (steps.length < 3) {
    fail('the-report-has-steps', `the book report has ${steps.length} steps. It is a multi-week piece of work or it is a bad weekend.`);
  }
  const ns = steps.map((s) => s.n);
  if (JSON.stringify(ns) !== JSON.stringify([...ns].sort((a, b) => a - b))) {
    fail('steps-are-in-order', `book report steps are numbered ${ns.join(', ')} — out of order`);
  }
  if (new Set(ns).size !== ns.length) {
    fail('steps-are-unique', 'two book report steps share a number');
  }
  const MIN = 60;
  for (const s of steps) {
    if (!s.step || !s.ask) {
      fail('step-says-what-to-do', `step ${s.n} has no instruction at all`);
      continue;
    }
    if (String(s.ask).length < MIN) {
      fail(
        'no-step-ships-as-a-bare-label',
        `step ${s.n} ("${s.step}") has a ${String(s.ask).length}-character instruction, under ${MIN}. ` +
          `"Rough draft" is a label; "one short paragraph a day, and none of it has to be good yet" ` +
          `is an instruction. She has to know what TOMORROW is.`
      );
    }
  }
  if (!errors.length) notes.push(`${steps.length} steps, every one carrying a real instruction`);
}

// ---- 2. ⚠️ NO DUE DATE LIVES ON THE THING THAT DESCRIBES THE WORK ---------
{
  const stringified = JSON.stringify(BOOK_REPORT);
  for (const banned of ['dueDate', 'dueOn', 'startDate', 'weekNumber', 'opensOn']) {
    if (stringified.includes(banned)) {
      fail(
        'one-fact-one-place',
        `BOOK_REPORT carries "${banned}". That file describes what the work IS; when it happens is ` +
          `derived in bookReportSchedule.js from her lesson reads. Lamar's codebase "has been bitten ` +
          `four separate times" by exactly this.`
      );
    }
  }

  // ⚠️ AND NO CALENDAR ANYWHERE IN THE SCHEDULING. Read as code, not prose —
  // the header of the schedule file discusses dates at length on purpose.
  const SCHED = codeOnly(readFileSync(resolve(ROOT, 'src/lib/bookReportSchedule.js'), 'utf8'));
  for (const banned of ['new Date', 'Date.now', 'toISOString', 'getMonth', 'dayKey']) {
    if (SCHED.includes(banned)) {
      fail(
        'the-schedule-reads-no-clock',
        `bookReportSchedule.js uses ${banned}. This app has no calendar and refuses one — "a quarter ` +
          `is a sequence, not a set of dates. Anyone who treats these as deadlines has turned a plan ` +
          `into a stick." The pacing is her progress, or it is a deadline she can miss.`
      );
    }
  }
  notes.push('nothing in the scheduling reads a clock: it paces on her lesson reads');
}

// ---- 3. A STEP IS NEVER OFFERED BEFORE IT OPENS ---------------------------
//
// His rule, Aug 16: "A step is not offered before it opens." Putting step 1 in
// front of her in week 1 of the quarter is putting a paper on his board in
// August: her board is a list of what to do NOW.
{
  const spine = WEEKS[SPINE_COURSE] || [];
  if (!spine.length) fail('the-spine-course-exists', `${SPINE_COURSE} has no weeks to pace against`);

  // ---- ⚠️ THE CONSTANT IS ASSERTED BEFORE IT IS USED AS A YARDSTICK ----
  //
  // The walk below reads OPENS_AT_WEEK_IN_QUARTER to decide what to expect. So
  // when its own negative test moved that constant to 1, THE EXPECTATION MOVED
  // WITH IT and "no step before it opens" could never fire — the check drifted
  // along with the bug and went red by luck on a different rule.
  //
  // A check whose yardstick is the thing being measured is not measuring. Same
  // family as v3.79's aria-disabled and v3.80's isFullyUnaided: an assertion
  // that cannot see the change it exists to catch.
  //
  // So the constant is pinned on its own terms first: there must be a real
  // run-up before the report opens, and every step must fit inside the quarter.
  if (!(OPENS_AT_WEEK_IN_QUARTER > 1)) {
    fail(
      'the-quarter-has-a-run-up',
      `the book report opens at week ${OPENS_AT_WEEK_IN_QUARTER} of the quarter. A quarter that ` +
        `opens with the heaviest thing in it opens with the heaviest thing in it, and she gets no ` +
        `weeks of ordinary reading before being asked to write about a book.`
    );
  }
  if (OPENS_AT_WEEK_IN_QUARTER + BOOK_REPORT.steps.length - 1 > WEEKS_PER_QUARTER) {
    fail(
      'every-step-fits-in-the-quarter',
      `opening at week ${OPENS_AT_WEEK_IN_QUARTER} leaves ${WEEKS_PER_QUARTER - OPENS_AT_WEEK_IN_QUARTER + 1} ` +
        `weeks for ${BOOK_REPORT.steps.length} steps. The last step would land after the quarter ends, ` +
        `which is a deadline she cannot meet rather than a plan she can follow.`
    );
  }

  const perQuarter = {};
  for (const w of spine) perQuarter[w.quarter] = (perQuarter[w.quarter] || 0) + 1;
  for (const [q, n] of Object.entries(perQuarter)) {
    if (n !== WEEKS_PER_QUARTER) {
      fail(
        'the-spine-is-evenly-quartered',
        `${SPINE_COURSE} quarter ${q} has ${n} weeks, not ${WEEKS_PER_QUARTER}. The pacing arithmetic ` +
          `assumes even quarters and would drift.`
      );
    }
  }

  // Walk a whole quarter, week by week, out of her real week table.
  let acc = [];
  const seen = [];
  for (let w = 1; w <= WEEKS_PER_QUARTER; w += 1) {
    const r = bookReportNow(acc, {});
    const inQ = weekWithinQuarter(spineWeek(acc));
    if (inQ < OPENS_AT_WEEK_IN_QUARTER) {
      if (r.state !== 'not-yet') {
        fail(
          'no-step-before-it-opens',
          `at week ${inQ} of the quarter the app offered step ${r.stepNumber}. It opens at week ` +
            `${OPENS_AT_WEEK_IN_QUARTER}. A step shown four weeks early is a thing to do later, and a ` +
            `list of things to do later is a list she stops reading.`
        );
      }
    } else if (r.state !== 'open') {
      fail('a-step-opens-when-it-should', `at week ${inQ} of the quarter there was still no step`);
    } else {
      seen.push(r.stepNumber);
    }
    acc = acc.concat(spine[w - 1].lessons);
  }
  const wanted = BOOK_REPORT.steps.map((s) => s.n);
  if (JSON.stringify(seen) !== JSON.stringify(wanted)) {
    fail(
      'the-steps-walk-in-order',
      `across the second half of the quarter the app offered steps ${seen.join(', ')}, expected ${wanted.join(', ')}`
    );
  } else {
    notes.push(`steps ${wanted.join(' → ')} across weeks ${OPENS_AT_WEEK_IN_QUARTER}-${WEEKS_PER_QUARTER} of every quarter`);
  }

  // Four reports a year, one per quarter — the count Gigi was promised.
  const reports = piecesForYear().filter((p) => p.pieceId === 'book-report');
  if (reports.length !== BOOK_REPORT.perYear) {
    fail('four-a-year', `${reports.length} book report slots for a perYear of ${BOOK_REPORT.perYear}`);
  }
  if (quarterOfWeek(1) !== 1 || quarterOfWeek(WEEKS_PER_QUARTER * 4) !== 4) {
    fail('quarters-map-to-weeks', 'the week-to-quarter arithmetic does not cover the year');
  }
}

// ---- 4. WHAT SHE HAS TICKED BEATS WHAT THE WEEK SUGGESTS ------------------
//
// A child who read the whole book in week 5 is on step 3, not step 1. The week
// proposes; what she actually did wins.
{
  const spine = WEEKS[SPINE_COURSE] || [];
  const throughWeek4 = spine.slice(0, 4).flatMap((w) => w.lessons);
  const ahead = bookReportNow(throughWeek4, { 'book-report-q1': [1, 2] });
  if (ahead.state !== 'open' || ahead.stepNumber !== 3) {
    fail(
      'working-ahead-is-not-undone',
      `she ticked steps 1 and 2 in the first open week and the app offered step ${ahead.stepNumber}. ` +
        `Dragging her back to a step she has finished is the app telling her the week matters more ` +
        `than the work.`
    );
  } else {
    notes.push('a child who works ahead is offered the step after the one she finished');
  }
}

// ---- 5. ⚠️ A CHECKBOX IS NOT AN ARTIFACT ----------------------------------
{
  const STORE = codeOnly(readFileSync(resolve(ROOT, 'src/store/useAppStore.js'), 'utf8'));
  const start = STORE.indexOf('async toggleWritingStep');
  const body = start === -1 ? '' : STORE.slice(start, start + 1200);
  // ⚠️ THIS ASSERTION WAS TOO LOOSE ON ITS FIRST WRITING AND ITS NEGATIVE TEST
  // SAID SO. It required the words WRITING_FINAL_STEP and "draft" to appear
  // somewhere in the function — and both still appeared after the guard was
  // deleted, because `const finalStep = WRITING_FINAL_STEP` and `row.draft` sit
  // outside it. The check stayed green on a store that would happily tick a
  // finished book report holding nothing she wrote.
  //
  // It asserts the REFUSAL now: the guard must compare against the final step,
  // test the draft for content, and return a failure. Three parts, in one
  // expression, so no single surviving line can satisfy it.
  // ⚠️ v3.83 — IT GUARDS `final`, NOT `draft`, AND THAT MOVE MATTERS.
  //
  // v3.82 refused the last step on an empty DRAFT. But "Edit and finish" is the
  // week she revises: with only two boxes, ticking it on last week's unrevised
  // rough draft passed the guard while proving nothing was finished. The
  // checkbox-without-an-artifact bug had moved one box along rather than been
  // fixed. His writer has three boxes for exactly this reason.
  const refusal =
    /n === finalStep[\s\S]{0,80}String\(row\.final \|\| ''\)\.trim\(\)[\s\S]{0,140}return \{ ok: false/;
  if (!body) {
    fail('the-tick-exists', 'toggleWritingStep is not in the store');
  } else if (!refusal.test(body)) {
    fail(
      'the-last-step-needs-writing',
      'toggleWritingStep no longer REFUSES the final step on an empty draft. A ticked book report ' +
        'holding no writing puts completed work on a Georgia portfolio with no evidence behind it — ' +
        'the artifact IS the record, and a checkbox is not an artifact.'
    );
  }
  if (typeof WRITING_FINAL_STEP !== 'number' || WRITING_FINAL_STEP !== BOOK_REPORT.steps.length) {
    fail(
      'the-final-step-is-derived',
      `WRITING_FINAL_STEP is ${WRITING_FINAL_STEP} for ${BOOK_REPORT.steps.length} steps. It must be ` +
        `computed from the steps, never typed — every hand-typed number in this project has drifted.`
    );
  }

  const VIEW = codeOnly(readFileSync(resolve(ROOT, 'src/components/Journal/JournalView.jsx'), 'utf8'));
  const notesBox = /saveWritingDraft\([^)]*\{\s*notes:/.test(VIEW);
  const draftBox = /saveWritingDraft\([^)]*\{\s*draft:/.test(VIEW);
  if (!notesBox || !draftBox) {
    fail(
      'two-boxes-never-one',
      `the Journal screen offers ${[notesBox && 'notes', draftBox && 'draft'].filter(Boolean).join(' and ') || 'neither box'}. ` +
        `Week 2 marks two places in the book and week 3 writes the draft — one box means week 3 ` +
        `overwrites week 2 and the milestone protects nothing.`
    );
  } else {
    notes.push('three boxes on screen — the plan, the rough draft and the finished one, kept apart');
  }

  // The outline helper may never eat her work.
  if (/Start from the four headings/.test(VIEW) && !/disabled=\{Boolean\(String\(draft\.draft/.test(VIEW)) {
    fail(
      'the-outline-never-eats-her-work',
      'the "start from the headings" button is offered on a draft that already has writing in it.'
    );
  }
}

// ---- 6. THE MERGE MAY NEVER LOSE A WORD SHE WROTE -------------------------
//
// Every other merge in mergeBackup takes the newer row. That is right for a
// mark and wrong for prose: a stale export is newer and shorter, and "newer
// wins" silently deletes a paragraph. db.js, v3: "A lost maths answer is an
// inconvenience; a lost page of her own writing is not."
{
  // ⚠️ THE FIXTURE CARRIES EVERY TEXT FIELD, NOT THE TWO IT USED TO. v3.83's
  // negative test deleted the `final` merge rule and this check STAYED GREEN,
  // because the fixture had no `final` in it — the rule was unprotected and the
  // test could not see it. A fixture that omits a field is a fixture that
  // exempts it, which is #27's cousin: a mutation with nothing to mutate.
  const older = {
    slotId: 'book-report-q1',
    draft: 'A long paragraph she actually wrote about the book and how it ended.',
    final: 'The finished version, tidied up, the one she means to hand in.',
    notes: 'page 40 and page 82',
    bookTitle: 'The one about the seeds',
    steps: [1, 2],
    updatedAt: '2026-08-01T00:00:00.000Z'
  };
  const newerEmpty = {
    slotId: 'book-report-q1',
    draft: '',
    final: '',
    notes: '',
    bookTitle: '',
    steps: [3],
    updatedAt: '2026-08-20T00:00:00.000Z'
  };
  const merged = pickWritingDraft(older, newerEmpty);
  if (merged.draft !== older.draft) {
    fail(
      'a-newer-empty-file-never-erases-her-writing',
      'merging a newer, empty draft over an older one with writing in it lost the writing. ' +
        'That is a page of her own work deleted by loading a backup.'
    );
  }
  if (merged.final !== older.final) {
    fail(
      'a-newer-empty-file-never-erases-her-writing',
      'merging a newer, empty FINISHED piece over one with writing in it lost the finished report — ' +
        'the artifact the whole portfolio is made of.'
    );
  }
  if (merged.notes !== older.notes) {
    fail('the-notes-survive-too', 'the marked-places box was erased by a newer empty one');
  }
  if (merged.bookTitle !== older.bookTitle) {
    fail('the-book-title-survives', 'the book title was erased by a newer empty one');
  }
  if (JSON.stringify(merged.steps) !== JSON.stringify([1, 2, 3])) {
    fail(
      'ticked-steps-take-the-union',
      `merged steps came back ${JSON.stringify(merged.steps)}, expected [1,2,3]. A step ticked on ` +
        `either machine happened on one of them; un-ticking is something she does deliberately.`
    );
  }
  notes.push('a merge keeps the longer text per field and the union of ticked steps');
}

// ---- 7. IT HAS A DOOR, AND THE DOOR KNOCKS -------------------------------
{
  const TODAY = codeOnly(readFileSync(resolve(ROOT, 'src/components/Schedule/TodayView.jsx'), 'utf8'));
  if (!/bookReportNow\(/.test(TODAY)) {
    fail(
      'today-knows-about-it',
      "Today's Planner no longer asks bookReportNow. Four book reports a year with nothing that says " +
        'it is time is what produced a record holding zero writing marks.'
    );
  }
  if (!/bookStep\.step\.step/.test(TODAY)) {
    fail(
      'today-leads-with-the-step',
      "Today's Planner does not show the STEP. Leading with a report being due, rather than with " +
        "this week being pick-your-book, invites doing nothing until the last week."
    );
  }
  // §32 — never in words she can read.
  for (const word of ['behind', 'overdue', 'late', 'catch up']) {
    if (new RegExp(`>[^<{]*\\b${word}\\b`, 'i').test(TODAY)) {
      fail('no-judgement-words-on-her-screen', `Today's Planner shows her the word "${word}"`);
    }
  }
}

// ---- 8. SIX FORMATS, AND EVERY WORD OF THEM AT HER LEVEL ------------------
//
// v3.83. His file: "SAME SHAPE FIVE TIMES IS HOW A BOOK REPORT BECOMES A
// CHORE." Hers were four identical ones.
//
// ⚠️ AND HIS PROSE IS PITCHED AT A TWELVE-YEAR-OLD. Copying his sections and
// checklists verbatim would put seventh-grade sentences in front of a child
// whose Grammar & Usage is 2.35 — the v3.40 failure, where a whole writing
// programme was caught pitched years above her BY READING IT.
{
  if (BOOK_REPORT_FORMATS.length < 3) {
    fail('more-than-one-shape', `${BOOK_REPORT_FORMATS.length} format(s). Four identical reports a year is the chore this exists to prevent.`);
  }
  const ids = BOOK_REPORT_FORMATS.map((f) => f.id);
  if (new Set(ids).size !== ids.length) fail('format-ids-are-unique', 'two formats share an id');
  if (!formatById(DEFAULT_FORMAT_ID)) {
    fail('the-default-format-exists', `DEFAULT_FORMAT_ID is "${DEFAULT_FORMAT_ID}", which is not a format`);
  }

  const cap = READING_CAPS[1];
  let worst = 0;
  for (const f of BOOK_REPORT_FORMATS) {
    if (!f.sections?.length) fail('a-format-says-what-it-needs', `${f.id} has no sections — nothing to write against`);
    if (!f.checklist?.length) fail('a-format-has-a-checklist', `${f.id} has no checklist`);
    if (!['written', 'made', 'spoken'].includes(f.kind)) {
      fail('a-format-declares-its-kind', `${f.id} has kind "${f.kind}"`);
    }
    for (const line of [f.bestFor, ...(f.sections || []), ...(f.checklist || [])]) {
      const a = analyse(line, { exemptProperNouns: true });
      worst = Math.max(worst, a.meanSentence);
      if (a.meanSentence > cap.meanSentence) {
        fail(
          'every-format-line-at-her-level',
          `${f.id}: "${line}" runs ${a.meanSentence.toFixed(1)} words a sentence against a cap of ` +
            `${cap.meanSentence}. His formats are written for a twelve-year-old; none of that prose ` +
            `may be copied into something she reads.`
        );
      }
    }
  }
  if (!errors.length) {
    notes.push(
      `${BOOK_REPORT_FORMATS.length} formats, every section and checklist line under her cap ` +
        `(worst ${worst.toFixed(1)} of ${cap.meanSentence} words a sentence)`
    );
  }

  // ⚠️ THE SIZE IS HERS. His written formats run 350-500 words.
  if (REPORT_SIZE.words[1] > 250) {
    fail(
      'the-length-is-hers-not-his',
      `the report asks for up to ${REPORT_SIZE.words[1]} words. His run 350-500 and that is a ` +
        `twelve-year-old's report. Her longest journal entry to date is eleven words; a target she ` +
        `cannot reach is not a standard, it is a wall.`
    );
  }
}

// ---- 9. THREE BOXES, AND THE SCREEN OFFERS THE FORMATS -------------------
{
  const VIEW = codeOnly(readFileSync(resolve(ROOT, 'src/components/Journal/JournalView.jsx'), 'utf8'));
  const boxes = ['notes', 'draft', 'final'].filter((b) =>
    new RegExp(`saveWritingDraft\\([^)]*\\{\\s*${b}:`).test(VIEW)
  );
  if (boxes.length !== 3) {
    fail(
      'three-boxes-not-two',
      `the screen offers ${boxes.length} of the three writing boxes (${boxes.join(', ') || 'none'}). ` +
        `Notes is the plan, draft is the rough writing, final is the finished piece. v3.82 built two ` +
        `because it read his notes instead of his code, and the polish week then had nowhere to land.`
    );
  }
  if (!/BOOK_REPORT_FORMATS\.map/.test(VIEW)) {
    fail('the-screen-offers-the-formats', 'the Journal screen no longer lets her choose a format');
  }
  if (!/fmt\.sections\.map/.test(VIEW)) {
    fail(
      'the-outline-is-on-screen',
      "the format's sections are not shown while she writes. They ARE the outline; a child holding " +
        'the structure in her head is a child writing without one.'
    );
  }
  if (!/fmt\.checklist\.map/.test(VIEW)) {
    fail('the-checklist-is-tickable', 'the checklist is not rendered as something she works through');
  }
  if (!/now\.stepNumber === BOOK_REPORT\.steps\.length &&/.test(VIEW)) {
    fail(
      'the-checklist-waits-for-the-last-step',
      'the checklist is shown before the Edit and finish step. On day one it is a wall of rules; on ' +
        'the last step it is a job.'
    );
  }
}

// ---- report ---------------------------------------------------------------
console.log('\nPetal & Pestle — is the book report scheduled, stepped and written?\n');
if (errors.length) {
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(`\n${errors.length} problem${errors.length === 1 ? '' : 's'}.\n`);
  process.exit(1);
}
for (const n of notes) console.log('  · ' + n);
console.log('  · the last step cannot be ticked without a FINISHED piece — the artifact is the record');
console.log(
  '\nNOT TESTED HERE: whether she has actually written one. Her record holds zero writing ' +
    'marks today, and that is a fact about August, not a failure.\n'
);
process.exit(0);
