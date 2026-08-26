// ---------------------------------------------------------------------------
// CHECK — THE WORD LISTS ARE HERS, AND THEY STILL TRACE TO HER LESSONS.
//
// Run with: node scripts/check-word-study.mjs
//
// ---- WHY THIS EXISTS ----
//
// The 320 spelling words and 320 vocabulary terms were DERIVED from the 256
// lessons and then FROZEN into a data file, on purpose: a list that recomputed
// at render would reshuffle her words mid-year the first time somebody reworded
// a lesson, and a child who has learned eight of ten should not find that two
// of them changed overnight.
//
// A freeze is only safe if something watches it. This is that something.
//
// ---- WHAT IT ASSERTS ----
//
//   1. Thirty-two weeks, ten spelling and ten vocabulary in every one of them.
//      320 and 320, counted, never taken on trust.
//   2. ⚠️ EVERY WORD STILL TRACES TO A LESSON THAT IS SCHEDULED IN ITS OWN
//      WEEK. This is the whole point of the freeze. If a lesson moves week, or
//      is renamed, or the word is edited out of its prose, the list stops being
//      "what she is reading this week" and nothing else would notice.
//   3. No word is used twice — not inside a week, not across the year, and not
//      once in each list. Two lists teaching one word is a wasted slot.
//   4. Every spelling word obeys her measured level: 4-9 letters, at most two
//      syllables, and not a proper noun.
//   5. The week count matches the week table, so this cannot quietly describe a
//      year the schedule does not have.
//
// ---- WHAT IT DOES NOT ASSERT, so it never claims more than it tests ----
//
//   · That these are the RIGHT words. Whether "bean" earns a spelling slot is
//     a judgement for Gigi, and a check that pretended to make it would be
//     dressing an opinion as a measurement.
//   · That she can spell them. Nothing here has been in front of her.
//   · ⚠️ THAT SHE CAN REACH THEM. THERE IS NO SCREEN. This check going green
//     means the DATA is sound and nothing more — the words are still paper.
//     Said here because "correct and unreachable" is this project's most
//     repeated failure, and a green check is exactly how it hides.
//
// NOTE ON REGEXES BELOW: no quote character appears inside a character class —
// see the header of check-version-stamp.mjs.
// ---------------------------------------------------------------------------

import { proseOf, properNounsIn, syllablesIn as syllables } from '../src/lib/lessonProse.js';
import { WORD_STUDY_WEEKS, WORDS_PER_WEEK, WORD_STUDY_WEEK_COUNT } from '../src/data/words/wordStudy.js';
import { WEEKS } from '../src/config/assessment.js';
import { ALL_LESSONS } from '../src/data/lessons/appCourses.js';

const failures = [];
const fail = (rule, detail) => failures.push({ rule, detail });
const notes = [];

const BY_ID = new Map(ALL_LESSONS.map((l) => [l.id, l]));


/** Which lesson ids the week table schedules in one (quarter, n). */
function lessonsScheduledIn(quarter, n) {
  const ids = [];
  for (const ws of Object.values(WEEKS)) {
    for (const w of ws) if (w.quarter === quarter && w.n === n) ids.push(...w.lessons);
  }
  return ids;
}

// ---- 1. shape and counts ---------------------------------------------------

if (WORD_STUDY_WEEKS.length !== WORD_STUDY_WEEK_COUNT) {
  fail(
    'week-count-matches-its-own-constant',
    `WORD_STUDY_WEEK_COUNT says ${WORD_STUDY_WEEK_COUNT}, the list has ${WORD_STUDY_WEEKS.length}`
  );
}

const scheduleWeeks = new Set();
for (const ws of Object.values(WEEKS)) for (const w of ws) scheduleWeeks.add(`${w.quarter}-${w.n}`);

if (WORD_STUDY_WEEKS.length !== scheduleWeeks.size) {
  fail(
    'week-count-matches-the-schedule',
    `the word lists cover ${WORD_STUDY_WEEKS.length} weeks, the week table has ${scheduleWeeks.size}. ` +
      `A word list for a week her schedule does not have is a list she never reaches — and one ` +
      `MISSING is a week with no words at all. Her year is 32 weeks; Lamar's is 36, and that ` +
      `number has been copied across once already.`
  );
}

let spellTotal = 0;
let vocabTotal = 0;

for (const w of WORD_STUDY_WEEKS) {
  const where = `Q${w.quarter} week ${w.n}`;
  spellTotal += w.spelling.length;
  vocabTotal += w.vocabulary.length;

  if (!scheduleWeeks.has(`${w.quarter}-${w.n}`)) {
    fail('every-word-week-is-a-real-week', `${where} has words but the week table has no such week`);
  }
  if (w.spelling.length !== WORDS_PER_WEEK) {
    fail('ten-spelling-words-a-week', `${where} has ${w.spelling.length} spelling words, expected ${WORDS_PER_WEEK}`);
  }
  if (w.vocabulary.length !== WORDS_PER_WEEK) {
    fail('ten-vocabulary-words-a-week', `${where} has ${w.vocabulary.length} vocabulary terms, expected ${WORDS_PER_WEEK}`);
  }
}

// ---- 2. ⚠️ EVERY WORD STILL TRACES TO A LESSON IN ITS OWN WEEK -------------

let traced = 0;

for (const w of WORD_STUDY_WEEKS) {
  const where = `Q${w.quarter} week ${w.n}`;
  const scheduled = new Set(lessonsScheduledIn(w.quarter, w.n));

  for (const entry of w.spelling) {
    const lesson = BY_ID.get(entry.from);
    if (!lesson) {
      fail('spelling-word-names-a-real-lesson', `${where}: "${entry.word}" cites ${entry.from}, which is not a lesson`);
      continue;
    }
    if (!scheduled.has(entry.from)) {
      fail(
        'spelling-word-is-from-this-week',
        `${where}: "${entry.word}" cites ${entry.from}, which the week table schedules somewhere ELSE. ` +
          `The whole design is that she spells what she is reading THAT WEEK.`
      );
      continue;
    }
    const rx = new RegExp(`\\b${entry.word}`, 'i');
    if (!rx.test(proseOf(lesson))) {
      fail(
        'spelling-word-is-still-in-the-prose',
        `${where}: "${entry.word}" is no longer in ${entry.from}. The lesson was reworded and the ` +
          `frozen list did not follow — which is exactly what a freeze needs watching for.`
      );
      continue;
    }
    traced += 1;
  }

  for (const entry of w.vocabulary) {
    const lesson = BY_ID.get(entry.from);
    if (!lesson) {
      fail('vocabulary-term-names-a-real-lesson', `${where}: "${entry.word}" cites ${entry.from}, which is not a lesson`);
      continue;
    }
    if (!scheduled.has(entry.from)) {
      fail('vocabulary-term-is-from-this-week', `${where}: "${entry.word}" cites ${entry.from}, scheduled in another week`);
      continue;
    }
    const declared = (lesson.words || []).map((x) => String(x).toLowerCase());
    if (!declared.includes(entry.word.toLowerCase())) {
      fail(
        'vocabulary-term-is-still-declared',
        `${where}: ${entry.from} no longer declares "${entry.word}" in its words: array`
      );
      continue;
    }
    traced += 1;
  }
}

// ⚠️ THE FLOOR. A loop that traced nothing would report no failures and exit
// green — "0 of 0 passed", the shape run-all-checks refuses for the same reason.
if (traced === 0) {
  fail(
    'something-was-actually-traced',
    'not one word was traced back to a lesson. The lists, the week table or the lesson ids have ' +
      'drifted apart, and this check is reading data it cannot understand.'
  );
}

// ---- 3. nothing is taught twice -------------------------------------------

const seen = new Map();
for (const w of WORD_STUDY_WEEKS) {
  for (const [list, entries] of [['spelling', w.spelling], ['vocabulary', w.vocabulary]]) {
    for (const e of entries) {
      const k = e.word.toLowerCase();
      const prior = seen.get(k);
      if (prior) {
        fail(
          'no-word-is-used-twice',
          `"${e.word}" is in ${list} at Q${w.quarter} week ${w.n} and already in ${prior}. ` +
            `A repeated word is a slot that taught her nothing.`
        );
      } else {
        seen.set(k, `${list} at Q${w.quarter} week ${w.n}`);
      }
    }
  }
}

// ---- 4. the spelling words sit at her measured level -----------------------
//
// Proper nouns are found the way the generator found them — capitalised
// mid-sentence somewhere in the corpus — and never from a hand-typed list of
// names, which would go stale the first time a lesson named someone new.

const properNouns = properNounsIn(ALL_LESSONS);

for (const w of WORD_STUDY_WEEKS) {
  for (const e of w.spelling) {
    const where = `Q${w.quarter} week ${w.n}`;
    if (e.word.length < 4 || e.word.length > 9) {
      fail('spelling-word-length', `${where}: "${e.word}" is ${e.word.length} letters, outside 4-9`);
    }
    if (syllables(e.word) > 2) {
      fail(
        'spelling-word-syllables',
        `${where}: "${e.word}" is ${syllables(e.word)} syllables. Her Grammar & Usage is 2.35 and ` +
          `her Vocabulary 2.91 — a word she cannot decode is not a spelling test, it is a bad week.`
      );
    }
    if (properNouns.has(e.word.toLowerCase())) {
      fail(
        'spelling-word-is-not-a-proper-noun',
        `${where}: "${e.word}" is capitalised mid-sentence elsewhere in the lessons, so it is a name. ` +
          `Proper nouns are exempt from the long-word count and have no business on a spelling list.`
      );
    }
  }
}

// ---- report ----------------------------------------------------------------

console.log('\nPetal & Pestle — word study check');
console.log('Are her spelling and vocabulary words really hers?\n');
console.log(`  weeks                  ${WORD_STUDY_WEEKS.length}  (the week table has ${scheduleWeeks.size})`);
console.log(`  spelling words         ${spellTotal}`);
console.log(`  vocabulary terms       ${vocabTotal}`);
console.log(`  traced to a lesson     ${traced} of ${spellTotal + vocabTotal}, each in its own week`);
console.log(`  distinct words         ${seen.size}`);
for (const n of notes) console.log(`  ${n}`);
console.log(
  '\n  NOT TESTED HERE: whether these are the RIGHT words — that is Gigi’s\n' +
    '  judgement, not a measurement — or whether she can spell them.\n' +
    '  ⚠️ AND NOT THAT SHE CAN REACH THEM. THERE IS NO SCREEN YET. Green here\n' +
    '  means the data is sound; the words are still paper.\n'
);

if (failures.length === 0) {
  console.log('Every word traces to a lesson she reads that week.\n');
  process.exit(0);
}

console.error(`FAILED — ${failures.length}\n`);
for (const f of failures.slice(0, 40)) console.error(`  [${f.rule}] ${f.detail}`);
if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
console.error('');
process.exit(1);
