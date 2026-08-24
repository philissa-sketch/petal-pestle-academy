// ---------------------------------------------------------------------------
// Run with: node scripts/check-readability.mjs
//
// THE PROBLEM THIS EXISTS TO CATCH, in the parent's words: "wouldn't you have
// to know her reading level before you create it?"
//
// She is right, and it bites hardest INSIDE the diagnostic. To measure a child
// you have to write questions, and every question in every subject is made of
// words. If a 6th-grade geometry question is written in 6th-grade prose and she
// reads at a 3rd-grade level, she gets it wrong because she could not READ it —
// and the app files that under "weak at geometry". The strand it damages is the
// one that had nothing to do with reading.
//
// Assessment people call this construct-irrelevant variance. It is the most
// common flaw in cross-subject assessments and it is completely invisible
// unless you go looking.
//
// The first version of elaItems.js CLAIMED every passage sat at or below the
// grade it tested. That claim was asserted in a comment, never measured, and
// said nothing at all about maths or science. This script measures it.
//
// ---- WHY NOT JUST FLESCH-KINCAID ----
//
// The first version of this script gated on FK and failed 62 of 189 items,
// which is a number that means "your metric is wrong" at least as loudly as it
// means "your items are wrong". FK is a regression fitted to long prose. On a
// nine-word question with four two-word answers it is close to noise — it
// scored the whole maths bank at a median grade of 0.0, which is not a fact
// about the maths bank.
//
// So this gates on FK's two honest ingredients instead, measured separately:
//
//   SENTENCE LENGTH — how much she has to hold in her head at once. This is the
//   single biggest driver of reading difficulty for a child and the easiest
//   thing to fix: split the sentence.
//
//   HARD-WORD RATE — the share of words with three or more syllables. Also
//   fixable: choose a shorter word.
//
// Both are interpretable and both tell you what to DO, which "FK 8.4" does not.
// FK is still computed and printed, as a familiar cross-check. It is not a gate.
//
// ---- THE SUBJECT-TERM ALLOWANCE ----
//
// "Photosynthesis" is four syllables and it is also the entire point of the
// question. Penalising a science item for naming its own subject would push the
// bank toward vagueness, which is worse for a child than a long word she is
// meant to be learning. Words in SUBJECT_TERMS are exempt from the hard-word
// count. That list is deliberately short and specific — it is an allowance for
// content vocabulary, not a loophole for adult prose.
// ---------------------------------------------------------------------------

import { allItems } from '../src/data/diagnostic/index.js';
import { getStrand } from '../src/config/strands.js';
import { analyse } from '../src/lib/readingLoad.js';

// The metric itself now lives in src/lib/readingLoad.js, so that this check and
// check-lesson-prose.mjs measure with ONE implementation. Two copies of "how hard
// is this to read" drift, and the day they disagree you have two numbers that
// cannot be compared and no way to tell which one moved.
//
// Extracted at v3.54, VERBATIM. This script's output was captured before and
// after and compared byte for byte. Note that analyse() takes an options object
// now; this check passes none, so proper nouns are counted here exactly as they
// always were. Whether the ITEM BANK should also exempt them is a separate
// decision and has deliberately not been made.

/**
 * Caps, by subject.
 *
 * MATHS IS FIXED AND STRICT. A 6th-grade fractions question must still be
 * readable by a 3rd-grade reader, because the difficulty is supposed to live in
 * the fractions. This is the cap that protects the four maths strands from
 * being quietly turned into reading tests.
 *
 * SCIENCE AND READING scale with the item's own level, because a 6th-grade
 * comprehension item genuinely has to present 6th-grade prose — that IS the
 * thing being measured. What it must not do is read HARDER than the level it
 * claims to test.
 */
function capsFor(subject, level) {
  if (subject === 'math') return { meanSentence: 14, hardRate: 0.1 };
  return { meanSentence: 9 + level, hardRate: 0.05 + 0.022 * level };
}

const failures = [];
const rows = [];

for (const item of allItems) {
  const strand = getStrand(item.strand);
  const subject = strand?.subject;
  // Prose only. Answer choices are measured separately below — a four-word
  // option is not a sentence and running sentence statistics over it is how the
  // first version of this script talked itself into nonsense.
  const prose = analyse([item.passage || '', item.prompt].join(' '));
  const caps = capsFor(subject, item.level);

  const problems = [];
  if (prose.meanSentence > caps.meanSentence) {
    problems.push(
      `sentences average ${prose.meanSentence.toFixed(1)} words (cap ${caps.meanSentence.toFixed(1)})`
    );
  }
  if (prose.hardRate > caps.hardRate) {
    problems.push(
      `${(prose.hardRate * 100).toFixed(0)}% long words (cap ${(caps.hardRate * 100).toFixed(0)}%): ${prose.hardWords.slice(0, 5).join(', ')}`
    );
  }
  // A single very long answer choice is its own kind of reading load.
  const longestChoice = Math.max(
    0,
    ...(item.choices || []).map((c) => String(c).split(/\s+/).length)
  );
  const choiceCap = subject === 'math' ? 14 : 16;
  if (longestChoice > choiceCap) {
    problems.push(`longest answer is ${longestChoice} words (cap ${choiceCap})`);
  }

  rows.push({ subject, fk: prose.fk, meanSentence: prose.meanSentence, hardRate: prose.hardRate });
  if (problems.length) failures.push({ id: item.id, subject, level: item.level, problems });
}

// ---- Report ---------------------------------------------------------------
const bySubject = {};
for (const r of rows) (bySubject[r.subject] ||= []).push(r);

const round = (n) => Math.round(n * 10) / 10;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

console.log('\nPetal & Pestle — reading-load check');
console.log('Can she READ the question, whatever subject it is testing?\n');

console.table(
  Object.entries(bySubject).map(([subject, list]) => ({
    subject,
    items: list.length,
    'median words/sentence': round(median(list.map((r) => r.meanSentence))),
    'median long-word %': round(median(list.map((r) => r.hardRate)) * 100),
    'median FK (cross-check)': round(median(list.map((r) => r.fk)))
  }))
);

if (failures.length) {
  console.log(`Items that read harder than they test (${failures.length}):\n`);
  for (const f of failures.slice(0, 30)) {
    console.log(`  ${f.id.padEnd(18)} ${f.subject.padEnd(8)} tests ${f.level.toFixed(1)}`);
    for (const p of f.problems) console.log(`      · ${p}`);
  }
  if (failures.length > 30) console.log(`  … and ${failures.length - 30} more`);
  console.log('');
  console.error(
    `FAILED — ${failures.length} item${failures.length === 1 ? '' : 's'} demand more reading than they test.\n`
  );
  process.exit(1);
}

console.log('Every item reads at or below the level it tests.\n');
