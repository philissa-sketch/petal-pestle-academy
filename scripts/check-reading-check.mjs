// ---------------------------------------------------------------------------
// CHECK — THE READING CHECK MEASURES READING, AND SAYS WHICH KIND.
//
// Run with: node scripts/check-reading-check.mjs
//
// ---- WHY THIS EXISTS ----
//
// Gigi, Aug 25 2026: "There are no unit tests. How can we test her."
//
// She was right and this app already knew: khanUnits.js records that Khan's
// elementary ELA has ZERO assessments — 77 links on the rendered page, none of
// them a test — and `ela2` carries `graded: 'parent'` because the grade was
// always meant to come from her by hand.
//
// ---- ⚠️ THE THING THIS CHECK REALLY GUARDS ----
//
// `unaidedPercent`, and specifically that it is NULL and never 0.
//
// 63% of everything Azianna has answered was read aloud to her. Her diagnostic
// file has said since Aug 13 that Reading 3.46 and Vocabulary 2.91 are
// LISTENING scores and that her independent reading has never been measured.
// This instrument exists to measure it.
//
// So a sitting where she was read every word must report "no independent
// reading measured", not "0%". Number(null) is 0 and 0 is finite — that exact
// trap has been found in THREE files in two days at v3.75 and a fourth at
// v3.76, and here it would print a nine-year-old a zero for a paper she got
// every question right on.
//
// ---- AND A READING CHECK IS NOT A KHAN GRADE ----
//
// v3.76 keeps a unit test and a Course Challenge apart in both directions. This
// is a third kind: a paper this app wrote, about a Khan unit, sat here. Writing
// it into khanGrades would put a number Khan never produced onto what becomes a
// transcript AND advance her Khan unit on a test Khan has never seen.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// v3.73: Windows rejects a bare path here. pathToFileURL, every time.
const load = (p) => import(pathToFileURL(resolve(ROOT, p)).href);

const { READING_UNITS, readingUnitFor } = await load('src/data/reading/ela2Unit1.js');
const { currentReadingCheck, buildReadingCheck, gradeReadingCheck, isFullyUnaided } =
  await load('src/lib/readingCheck.js');
const { analyse } = await load('src/lib/readingLoad.js');
const { READING_CAPS } = await load('src/lib/readingCaps.js');
const { khanFor } = await load('src/data/khan/khanMap.js');
const { nextUnitFor } = await load('src/data/khan/khanUnits.js');

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

if (!READING_UNITS.length) {
  fail('at-least-one-unit', 'no reading checks are written at all');
}

// ---- 1. A QUESTION MAY ONLY ASK WHAT ITS PASSAGE GAVE HER -----------------
//
// The content rule, and in a RETELLING unit it has a specific trap: the
// tempting question is "what happened in the real fairy tale", which asks for a
// story this app never gave her.
for (const u of READING_UNITS) {
  const pids = new Set(u.passages.map((p) => p.id));
  if (!u.passages.length) fail('unit-has-passages', `${u.id} has no passages`);
  if (!u.questions.length) fail('unit-has-questions', `${u.id} has no questions`);

  for (const q of u.questions) {
    if (!pids.has(q.passage)) {
      fail(
        'every-question-has-its-passage',
        `${q.id} is asked about "${q.passage}", which is not a passage in ${u.id}. ` +
          `A question whose passage is not on screen is a memory test.`
      );
    }
    if (!Array.isArray(q.choices) || q.choices.length < 3) {
      fail('enough-choices', `${q.id} has fewer than three choices`);
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.choices || []).length) {
      fail('answer-is-a-real-choice', `${q.id} has answer ${q.answer}, which is not one of its choices`);
    }
    if (!q.why) {
      fail('every-question-shows-its-working', `${q.id} has no "why" — she is told she was wrong and not why`);
    }
    if ((q.feedback || []).length !== (q.choices || []).length) {
      fail('feedback-matches-choices', `${q.id} has ${(q.feedback || []).length} feedback lines for ${(q.choices || []).length} choices`);
    }
    if (q.feedback && q.feedback[q.answer] !== null) {
      fail(
        'right-answer-carries-no-correction',
        `${q.id} has feedback on its RIGHT answer. Feedback is for a wrong turn; on the right one it reads as a rebuke.`
      );
    }
    (q.feedback || []).forEach((f, i) => {
      if (i !== q.answer && !f) {
        fail('every-wrong-answer-is-answered', `${q.id} choice ${i} is wrong and says nothing back`);
      }
    });
  }

  // ---- 2. THE RIGHT ANSWER MOVES AROUND ----
  // §3.6, and the Science Lab bug that produced it: 42 of 60 in one slot.
  const counts = {};
  for (const q of u.questions) counts[q.answer] = (counts[q.answer] || 0) + 1;
  const worst = Math.max(...Object.values(counts));
  const share = worst / u.questions.length;
  if (share > 0.4) {
    fail(
      'the-answer-moves-around',
      `${u.id}: one answer slot holds ${worst} of ${u.questions.length} (${Math.round(share * 100)}%), over the 40% ceiling`
    );
  } else {
    notes.push(`${u.id}: answer key spread, worst slot ${Math.round(share * 100)}%`);
  }

  // ---- 3. SHE CAN READ IT. MEASURED, NOT CLAIMED. ----
  //
  // The same analyse() check-lesson-prose uses. A reading test she cannot read
  // measures nothing except that it was too hard, and this is the FIRST time
  // anyone measures what she reads alone.
  const cap = READING_CAPS[1];
  for (const p of u.passages) {
    const a = analyse(p.text, { exemptProperNouns: true });
    if (a.meanSentence > cap.meanSentence) {
      fail(
        'passage-within-the-reading-cap',
        `${p.id} runs ${a.meanSentence.toFixed(1)} words a sentence against a Quarter 1 cap of ${cap.meanSentence}`
      );
    }
    if (a.hardRate > cap.hardRate) {
      fail(
        'passage-within-the-long-word-cap',
        `${p.id} is ${(a.hardRate * 100).toFixed(1)}% long words against a cap of ${(cap.hardRate * 100).toFixed(0)}%`
      );
    }
    notes.push(
      `${p.id}: ${a.meanSentence.toFixed(1)} words a sentence, ${(a.hardRate * 100).toFixed(1)}% long words`
    );
  }
}

// ---- 4. ⚠️ UNAIDED IS NULL, NEVER ZERO -----------------------------------
{
  const u = READING_UNITS[0];
  const form = buildReadingCheck(u.id);

  const all = (readAloud) =>
    Object.fromEntries(form.questions.map((q) => [q.id, { chosen: q.answer, readAloud }]));

  const aloud = gradeReadingCheck(form, all(true));
  if (aloud.unaidedPercent !== null) {
    fail(
      'unaided-is-null-when-nothing-was-unaided',
      `every question was read to her and unaidedPercent came back ${JSON.stringify(aloud.unaidedPercent)}. ` +
        `It must be null. A measurement not taken and a measurement of zero are opposite facts, and ` +
        `she answered every one correctly.`
    );
  }
  if (aloud.percent !== 100) {
    fail('overall-still-counts', `all eight right came back as ${aloud.percent}% overall`);
  }
  if (isFullyUnaided(aloud)) {
    fail('read-to-is-not-independent', 'a sitting read entirely aloud reported as fully unaided');
  }

  const alone = gradeReadingCheck(form, all(false));
  if (alone.unaidedPercent !== 100 || alone.unaidedCount !== form.questions.length) {
    fail(
      'unaided-counts-what-she-read',
      `read alone and all correct gave unaided ${alone.unaidedPercent}% over ${alone.unaidedCount}`
    );
  }
  if (!isFullyUnaided(alone)) {
    fail('a-clean-sitting-is-recognised', 'every question answered alone and it did not report as fully unaided');
  }

  // A skipped question is not a wrong one, and not an unaided one either.
  const partial = { [form.questions[0].id]: { chosen: form.questions[0].answer, readAloud: false } };
  const p = gradeReadingCheck(form, partial);
  if (p.skipped !== form.questions.length - 1) {
    fail('unreached-is-not-wrong', `seven unanswered questions reported ${p.skipped} skipped`);
  }
  if (p.unaidedCount !== 1) {
    fail('skipped-is-not-unaided', `only one question was answered but unaidedCount is ${p.unaidedCount}`);
  }
  if (isFullyUnaided(p)) {
    fail('an-abandoned-paper-is-not-a-clean-reading', 'a paper with seven skipped reported as fully unaided');
  }
  notes.push('unaided is null when she was read to, and a skipped question is neither wrong nor unaided');
}

// ---- 5. IT OFFERS A CHECK FOR THE UNIT SHE IS ACTUALLY IN -----------------
//
// currentReadingCheck must reach the same unit the reading block reaches, by
// the same route. Two answers to "which unit is she on" drift, and the day they
// disagree the Planner offers a check on something she is not reading.
{
  const strands = {
    'reading-comprehension': { strandId: 'reading-comprehension', level: 3.46, asked: 6 },
    vocabulary: { strandId: 'vocabulary', level: 2.91, asked: 7 }
  };
  const got = currentReadingCheck(strands, []);
  const khan = khanFor('vocabulary', 2.91);
  const unit = nextUnitFor(khan.unitCourse, []);
  const expected = readingUnitFor(khan.unitCourse, unit.n);
  if (got?.id !== expected?.id) {
    fail(
      'offers-the-unit-she-is-in',
      `the block opens ${khan.unitCourse} unit ${unit.n} and the reading check offered ${got?.id ?? 'nothing'}`
    );
  } else {
    notes.push(`her lowest reading strand picks ${khan.unitCourse} unit ${unit.n} — and that is the check offered`);
  }

  // Nothing measured yet → no check. A button with nothing behind it is the
  // dead end this app has built five times.
  if (currentReadingCheck({}, []) !== null) {
    fail('no-check-before-a-check-in', 'a reading check was offered for a child with no measured strands');
  }
}

// ---- 6. ⚠️ READING THE PASSAGE ALOUD MARKS EVERY QUESTION ON IT -----------
//
// The cautious direction, and it must be. If the passage was read to her, no
// answer drawn from it is independent reading — including the questions where
// she pressed nothing. Marking only the question in focus would let listened-to
// answers into the one number this whole feature exists to produce.
{
  const VIEW = codeOnly(
    readFileSync(resolve(ROOT, 'src/components/Assess/ReadingCheckView.jsx'), 'utf8')
  );
  if (!/for \(const q of form\.questions\)[\s\S]{0,220}q\.passage !== passage\.id[\s\S]{0,220}readAloud: true/.test(VIEW)) {
    fail(
      'passage-aloud-marks-all-its-questions',
      'readPassage no longer marks every question on that passage as read aloud. Answers she got ' +
        'by listening would then count toward her independent reading score.'
    );
  }
  if (!/passages\.map/.test(VIEW) || !/p\.text\.split/.test(VIEW)) {
    fail(
      'the-passage-stays-on-screen',
      'ReadingCheckView no longer renders the passage text beside the questions. A question about a ' +
        'passage she cannot see is a memory test.'
    );
  }
  // She is never told off for using it.
  //
  // ⚠️ THIS ASSERTION WAS WRONG ON ITS FIRST RUN AND FAILED CORRECT CODE. It
  // searched for the word anywhere after a ">" — and `isFullyUnaided(grade)`
  // CONTAINS "unaided", with an arrow function's ">" earlier on the line. It
  // was reading the identifier that implements the rule and calling it a
  // message to a nine-year-old.
  //
  // Same family as v3.79's `aria-disabled={!open}` swallowing `disabled={!open}`
  // and v3.72's guard assertions matching the comments that explained them: an
  // assertion satisfied by something ADJACENT to the rule is not testing the
  // rule. The lookarounds pin it to the standalone word, so `unaidedPercent`
  // and `isFullyUnaided` are identifiers again and only prose bites.
  for (const word of ['needed help', 'without help', 'unaided', 'you needed', 'on your own']) {
    if (new RegExp(`(?<![A-Za-z])${word}(?![A-Za-z])`, 'i').test(VIEW)) {
      fail(
        'she-is-not-told-off-for-the-button',
        `the screen shows her the words "${word}". Read-aloud is recorded for a grown-up, never ` +
          `reported to her as a deduction. §32's rule, one room over.`
      );
    }
  }
}

// ---- 7. IT NEVER WRITES A KHAN GRADE, AND NEVER RESTATES THE LADDER ------
{
  const STORE = codeOnly(readFileSync(resolve(ROOT, 'src/store/useAppStore.js'), 'utf8'));
  const start = STORE.indexOf('async recordReadingCheck');
  const end = STORE.indexOf('async recordAttempt', start);
  const body = start === -1 ? '' : STORE.slice(start, end === -1 ? start + 4000 : end);
  if (!body) {
    fail('the-recorder-exists', 'recordReadingCheck is not in the store');
  } else {
    if (/khanGrades|addKhanGrade|khanGradeRow/.test(body)) {
      fail(
        'a-reading-check-is-not-a-khan-grade',
        'recordReadingCheck touches khanGrades. Khan has never seen this paper — filing it there ' +
          'puts a number Khan did not produce on a transcript AND advances her Khan unit on it.'
      );
    }
    // ⚠️ THE FLAG IS WRITTEN IN TWO PLACES AND BOTH MATTER, and this assertion
    // originally required only one. Its negative test stripped the flag from
    // the itemEvents rows — the copy the Gradebook and every report read — and
    // the check STAYED GREEN, because the copy on the attempt row was still
    // there and satisfied the regex.
    //
    // A rule enforced at one of its two sites is a rule that holds by luck.
    // v3.76's whole lesson, and v3.79's `aria-disabled` twin. Both are named.
    const flagSites = (body.match(/readAloud: r\.readAloud/g) || []).length;
    if (flagSites < 2) {
      fail(
        'the-flag-is-written-down',
        `recordReadingCheck writes readAloud on ${flagSites} of its two row shapes. It must be on ` +
          `BOTH the attempt row and the itemEvents row — the attempt is what the Grown-Up Corner ` +
          `reads, the itemEvents are what every report and the Gradebook read. Without it this ` +
          `produces one more listening score wearing a reading score name.`
      );
    }
    if (!/rows: grade\.rows\.map/.test(body) || !/recordItemEvents/.test(body)) {
      fail('both-row-shapes-exist', 'recordReadingCheck no longer writes both an attempt row and itemEvents');
    }
    if (!/evidenceSource: 'test'/.test(body)) {
      fail('evidence-source-is-test', "recordReadingCheck no longer records evidenceSource 'test'");
    }
  }

  const LIB = codeOnly(readFileSync(resolve(ROOT, 'src/lib/readingCheck.js'), 'utf8'));
  if (!/import \{ letterForPercent \}/.test(LIB)) {
    fail(
      'one-ladder-one-implementation',
      'readingCheck.js no longer imports letterForPercent. A second letter ladder means the same ' +
        'percentage can mean two grades — v3.78 fails the build for exactly this.'
    );
  }
  if (/KHAN_LETTER_BANDS\s*=|const BANDS\s*=/.test(LIB)) {
    fail('no-second-ladder', 'readingCheck.js declares its own letter bands');
  }
}

// ---- 8. IT HAS A DOOR ----------------------------------------------------
//
// The sixth time would be the charm. Correct and unreachable: the Science Lab
// course at v3.24, the rubrics at v3.38, the read-aloud breakdown at v3.56, the
// goals engine at v3.58, Singing & Movement at v3.64.
{
  const TODAY = codeOnly(readFileSync(resolve(ROOT, 'src/components/Schedule/TodayView.jsx'), 'utf8'));
  if (!/currentReadingCheck\(/.test(TODAY)) {
    fail('today-asks-whether-there-is-one', 'TodayView no longer asks currentReadingCheck');
  }
  if (!/onNavigate\?\.\('reading'\)/.test(TODAY)) {
    fail('today-opens-it', 'TodayView has no button that navigates to the reading check');
  }
  if (!/readingCheck && \(/.test(TODAY)) {
    fail(
      'no-button-without-a-check',
      'TodayView renders the reading-check button unconditionally. Two of the three ela2 units have ' +
        'nothing written for them; a button with nothing behind it is a dead end with a friendly label.'
    );
  }

  const APP = codeOnly(readFileSync(resolve(ROOT, 'src/App.jsx'), 'utf8'));
  if (!/view === 'reading' &&/.test(APP)) {
    fail('the-app-routes-it', "App does not render anything for view 'reading'");
  }
  if (!/unitId=\{readingUnitId\}/.test(APP)) {
    fail('the-app-hands-it-the-unit', 'App does not pass a unit to ReadingCheckView');
  }
}

// ---- report ---------------------------------------------------------------
console.log('\nPetal & Pestle — does the reading check measure reading?\n');
if (errors.length) {
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(`\n${errors.length} problem${errors.length === 1 ? '' : 's'}.\n`);
  process.exit(1);
}
for (const n of notes) console.log('  · ' + n);
console.log('  · read-aloud is offered, recorded per answer, and never shown to her as a deduction');
console.log('  · a reading check is never a Khan grade and never moves a Khan unit');
console.log(
  '\nNOT TESTED HERE: whether she can actually read it. That is what the first sitting is for.\n'
);
process.exit(0);
