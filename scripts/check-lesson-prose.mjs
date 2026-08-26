// ---------------------------------------------------------------------------
// CHECK — LESSON PROSE READING LOAD.
//
// Run with: node scripts/check-lesson-prose.mjs
//
// ---- THE PROBLEM THIS EXISTS TO CATCH ----
//
// `check-readability.mjs` asks whether she can read a diagnostic ITEM. Nothing
// asked whether she can read a LESSON, and the lessons are what she spends the
// year inside.
//
// At v3.40 a whole writing programme was found pitched years above her, by
// Gigi, by reading it. The mini-lessons were measured after that. The 256
// course lessons were not — and their caps were written into seven module
// header comments and never tested. Same failure, one layer down.
//
// ---- WHAT IT MEASURES ----
//
// The prose she reads: checkIn.text, checkIn.question, and every beat's hook,
// teachingText and example.
//
// NOT the questions. applyIt prompts, choices and feedback are questions, and
// check-readability.mjs already argues why running sentence statistics over a
// four-word answer choice is nonsense. Measuring them here would repeat that
// mistake with a different bank.
//
// ---- WHAT IT DOES NOT MEASURE, so it never claims more than it tests ----
//
//   · Whether she UNDERSTANDS it. Sentence length and syllable counts are
//     proxies. A short sentence can carry a hard idea.
//   · Whether the reading level is RIGHT for her. That is a Check-In question,
//     and the caps in readingCaps.js are a judgement made from one sitting on
//     Aug 13 2026.
//   · ⭐ THE 13 FLAT CARDS ARE MEASURED NOW — v3.88. They used to carry no
//     quarter, so there was no cap to apply, and they sat on UNCAPPABLE for
//     eighty versions. They now carry course, module, quarter, week, day and
//     standards, all derived from WEEKS, and `proseOf` reads their shape.
//     ⚠️ TWO THINGS HAD TO BE TRUE BEFORE ONE SENTENCE OF THEIRS WAS READ: a
//     cap to measure against, AND a reader that understood `hook`/`core`.
//     Fixing only the first would have measured an empty string thirteen
//     times and passed. UNCAPPABLE is now empty and kept, because this file
//     asserts it in BOTH directions.
//   · Whether `core` on the other 243 lessons is any good. It is not rendered
//     and is not measured. See the beats-or-core note in proseOf.
//
// ---- WHY IT PASSES TODAY WITH KNOWN BREACHES ----
//
// Eighteen Herbalism Q4 lessons are over the cap and have been since v3.9. A
// check that fails eighteen times on the day it lands blocks every other job
// and trains you to run the batch with one red line you have learned to ignore.
//
// So the known breaches live in KNOWN_OVER as dated, reasoned debt, and the
// check asserts that list is EXACTLY right in both directions — a new breach
// fails, and a fixed lesson that is still listed also fails. The debt can only
// go down, and it cannot grow quietly. That is a ratchet, not a warning.
// ---------------------------------------------------------------------------

import { ALL_LESSONS, courseOfLesson } from '../src/data/lessons/appCourses.js';
import { analyse, longestSentences } from '../src/lib/readingLoad.js';
import { proseOf } from '../src/lib/lessonProse.js';
import { READING_CAPS, capsForQuarter, KNOWN_OVER, UNCAPPABLE } from '../src/lib/readingCaps.js';

const failures = [];
const fail = (rule, detail) => failures.push({ rule, detail });

// proseOf and the proper-noun rule now live in src/lib/lessonProse.js.
// ⚠️ THEY USED TO BE COPIED HERE AND IN THE WORD-STUDY GENERATOR, AND THE
// SECOND COPY WAS WRONG — see that file's header. One definition, imported.

const round = (n) => Math.round(n * 10) / 10;
const pct = (n) => `${Math.round(n * 1000) / 10}%`;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return 0;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// ---- measure ---------------------------------------------------------------

const knownSet = new Set(KNOWN_OVER.map((k) => k.id));
const uncappableSet = new Set(UNCAPPABLE);

const rows = [];
const uncappableSeen = [];

for (const lesson of ALL_LESSONS) {
  const course = lesson.course || courseOfLesson(lesson.id) || 'unknown';
  const text = proseOf(lesson);

  if (lesson.quarter === undefined || lesson.quarter === null) {
    uncappableSeen.push(lesson.id);
    continue;
  }
  if (!text.trim()) {
    fail('lesson-has-prose', `${lesson.id} has no prose to measure`);
    continue;
  }

  const caps = capsForQuarter(lesson.quarter);
  if (!caps) {
    fail('quarter-has-a-cap', `${lesson.id} is in quarter ${lesson.quarter}, which has no cap`);
    continue;
  }

  // Proper nouns exempt. Gigi, Aug 23 2026: "It doesn't make any sense to learn
  // about a person without their name." See readingLoad.js for the evidence.
  const a = analyse(text, { exemptProperNouns: true });

  const problems = [];
  if (a.meanSentence > caps.meanSentence) {
    problems.push(
      `sentences average ${round(a.meanSentence)} words (cap ${caps.meanSentence})`
    );
  }
  if (a.hardRate > caps.hardRate) {
    problems.push(
      `${pct(a.hardRate)} long words (cap ${pct(caps.hardRate)}): ${a.hardWords.slice(0, 5).join(', ')}`
    );
  }
  // The floor. Prose written too easy is as wrong as prose written too hard —
  // socialM9.js. Only applies where a floor was actually set.
  if (caps.floor && a.meanSentence < caps.floor) {
    problems.push(`sentences average ${round(a.meanSentence)} words (FLOOR ${caps.floor})`);
  }

  rows.push({ id: lesson.id, course, quarter: lesson.quarter, ...a, caps, problems });
}

// ---- 0. THE READER ITSELF, ASKED DIRECTLY --------------------------------
//
// ⚠️ WHY THIS EXISTS: A RULE WHOSE FAILURE CANNOT BE OBSERVED IS A RULE
// NOTHING IS PROTECTING — the sentence check-khan-units learned at v3.76.
//
// Closing an unterminated part before joining is a real rule: without it a
// heading glues onto the paragraph below it and invents a sentence that is on
// no screen. When it was missing it turned nineteen lessons red.
//
// But it is now UNOBSERVABLE through the lesson data. Only the thirteen flat
// cards go through `core`, and their headings are short enough that gluing
// them still leaves every card under its cap. So the negative test for it came
// back GREEN — "a mutation that did not mutate" — and the honest response is
// not to shrug, it is to ask the rule directly.
//
// These fixtures are deliberately NOT real lessons. A real lesson could start
// passing for reasons that have nothing to do with this rule.

{
  const glueCase = proseOf({
    hook: { text: 'One.', question: 'Two?' },
    core: [{ heading: 'A heading with no full stop', text: 'And the sentence under it.' }]
  });

  if (!/no full stop\.\s/.test(glueCase)) {
    fail(
      'headings-are-closed-before-joining',
      `proseOf joined a heading straight onto the text below it, producing: "${glueCase}". ` +
        `That fabricates a sentence nobody reads and inflates the sentence average — it turned ` +
        `nineteen lessons red when it happened. Close each part before joining.`
    );
  }

  // And the branch itself: a lesson with beats must NOT contribute its core.
  const bothShapes = proseOf({
    beats: [{ n: 1, teachingText: 'The beat text.' }],
    core: [{ heading: 'Dead heading', text: 'Dead core text that is not rendered.' }]
  });
  if (/Dead/.test(bothShapes)) {
    fail(
      'core-is-ignored-when-beats-render',
      `proseOf read \`core\` on a lesson that has \`beats\`. LessonReader renders one or the ` +
        `other and never both, so this measures text that is on no screen — across 243 lessons.`
    );
  }
  // ...and a lesson WITHOUT beats must contribute it, or the thirteen go quiet.
  const flatOnly = proseOf({ core: [{ heading: 'Live heading', text: 'Live core text.' }] });
  if (!/Live core text/.test(flatOnly)) {
    fail(
      'core-is-read-when-nothing-else-renders',
      'proseOf ignored `core` on a lesson with no `beats`. That is the shape of all thirteen ' +
        'flat cards, and it would measure them as empty and pass.'
    );
  }
}

// ---- 1. UNCAPPABLE is exactly right ---------------------------------------

for (const id of uncappableSeen) {
  if (!uncappableSet.has(id)) {
    fail(
      'no-new-uncappable-lessons',
      `${id} carries no quarter, so no cap can be applied to it, and it is not in UNCAPPABLE. ` +
        `Give it a quarter, or add it to the list with a reason.`
    );
  }
}
for (const id of uncappableSet) {
  if (!uncappableSeen.includes(id)) {
    fail(
      'uncappable-list-is-current',
      `${id} is listed as UNCAPPABLE but now has a quarter. Remove it from the list — it is measurable.`
    );
  }
}

// ---- 2. the debt ratchet ---------------------------------------------------

const over = rows.filter((r) => r.problems.length);
const overSet = new Set(over.map((r) => r.id));

for (const r of over) {
  if (!knownSet.has(r.id)) {
    fail(
      'no-new-breaches',
      `${r.id} (${r.course}, Q${r.quarter}) — ${r.problems.join('; ')}`
    );
  }
}
for (const k of KNOWN_OVER) {
  if (!overSet.has(k.id)) {
    fail(
      'known-list-is-current',
      `${k.id} is in KNOWN_OVER but now meets its cap. Delete its line — the debt went down and the ` +
        `list must say so.`
    );
  }
}

// ---- report ----------------------------------------------------------------

console.log('\nPetal & Pestle — lesson prose reading load');
console.log('Can she READ the lesson, whatever it is teaching?\n');

const byCourse = {};
for (const r of rows) (byCourse[r.course] ||= []).push(r);

console.table(
  Object.entries(byCourse).map(([course, list]) => ({
    course,
    lessons: list.length,
    'median words/sentence': round(median(list.map((r) => r.meanSentence))),
    'median long-word %': round(median(list.map((r) => r.hardRate)) * 100),
    over: list.filter((r) => r.problems.length).length
  }))
);

console.table(
  Object.keys(READING_CAPS).map((q) => {
    const list = rows.filter((r) => String(r.quarter) === String(q));
    return {
      quarter: `Q${q}`,
      lessons: list.length,
      cap: `${READING_CAPS[q].meanSentence}w / ${pct(READING_CAPS[q].hardRate)}`,
      'median words/sentence': round(median(list.map((r) => r.meanSentence))),
      over: list.filter((r) => r.problems.length).length
    };
  })
);

if (uncappableSeen.length) {
  console.log(
    `Not measured — ${uncappableSeen.length} lesson(s) carry no quarter, so no cap applies:`
  );
  console.log(`  ${uncappableSeen.join(' ')}`);
  console.log('  These also carry `words:`, so the skill tagging would tag them anyway.\n');
}

if (over.length) {
  console.log(`Over a cap — ${over.length}, of which ${over.filter((r) => knownSet.has(r.id)).length} are recorded debt:\n`);
  for (const r of [...over].sort((a, b) => b.meanSentence - a.meanSentence).slice(0, 12)) {
    const tag = knownSet.has(r.id) ? 'known' : 'NEW';
    console.log(`  ${r.id.padEnd(14)} ${r.course.padEnd(11)} Q${r.quarter}  [${tag}]`);
    for (const p of r.problems) console.log(`      · ${p}`);
    const worst = longestSentences(proseOf(ALL_LESSONS.find((l) => l.id === r.id)), 1)[0];
    if (worst && worst.words > r.caps.meanSentence) {
      console.log(`      · longest sentence, ${worst.words} words: "${worst.sentence.slice(0, 96)}${worst.sentence.length > 96 ? '…' : ''}"`);
    }
  }
  if (over.length > 12) console.log(`  … and ${over.length - 12} more`);
  console.log('');
}

console.log(
  'NOT TESTED HERE: whether she understands it, whether the caps are the right ' +
    'caps, or `core` on the 243 lessons that render `beats` instead. See the header.\n'
);

if (failures.length === 0) {
  console.log(`PASS — ${rows.length} lessons measured, ${over.length} on the recorded debt list.\n`);
  process.exit(0);
}

console.log(`FAILED — ${failures.length}\n`);
for (const f of failures) console.log(`  [${f.rule}] ${f.detail}`);
console.log('');
process.exit(1);
