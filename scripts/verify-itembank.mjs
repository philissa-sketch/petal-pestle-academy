// ---------------------------------------------------------------------------
// Run with: npm run verify
//
// Three classes of defect this catches, all of which are silent at runtime:
//
//  1. A strand with fewer items than the diagnostic can ask (MAX_ITEMS_PER_
//     STRAND). The engine would quietly start repeating questions and the level
//     it reported would be built partly on answers she had already seen.
//  2. A malformed item — wrong answer index, a choiceFeedback array that does
//     not line up with the choices, or a distractor with no feedback. Every one
//     of these shows up as a confusing screen rather than an error.
//  3. Banned medical phrasing anywhere in the herb library or the science bank.
//     This is the content rule the whole app is built around and it is the one
//     most likely to be broken accidentally by a future edit.
// ---------------------------------------------------------------------------

import { STRANDS, STRAND_IDS } from '../src/config/strands.js';
import { itemsForStrand, allItems, bankSummary } from '../src/data/diagnostic/index.js';
import { MAX_ITEMS_PER_STRAND, MIN_LEVEL, MAX_LEVEL } from '../src/engine/diagnosticEngine.js';
import { herbs, SAFETY_LINE } from '../src/data/herbs/herbLibrary.js';
import { KHAN_MAP, khanFor } from '../src/data/khan/khanMap.js';

const errors = [];
const warnings = [];

// ---- 1. Coverage -----------------------------------------------------------
for (const strand of STRANDS) {
  const items = itemsForStrand(strand.id);
  if (items.length < MAX_ITEMS_PER_STRAND) {
    errors.push(
      `${strand.id}: only ${items.length} items, but the diagnostic can ask up to ${MAX_ITEMS_PER_STRAND}`
    );
  }
  // A RE-TAKE NEEDS A WHOLE SECOND PAPER, and this used to be a warning.
  //
  // From v3.14 reopenStrand() carries seenItemIds forward, so a re-take draws
  // only from questions she has not been asked. That promise is kept by the
  // BANK, not by the engine: a strand holding fewer than two full sittings
  // cannot supply a second paper, and chooseItem() then falls back to repeats
  // rather than crashing — quietly, which is the worst way for it to happen.
  //
  // At v3.13 all four ELA strands held 15 against a sitting of 8. That left
  // seven questions for a re-take, and this line, set at 1.5x, said nothing
  // about it: a warning is not a check, and 15 cleared 12 anyway.
  // The bar is now two full sittings, and it is an error.
  if (items.length < MAX_ITEMS_PER_STRAND * 2) {
    errors.push(
      `${strand.id}: ${items.length} items cannot supply a re-take. A sitting asks up to ` +
        `${MAX_ITEMS_PER_STRAND}, and a re-take may not repeat a question, so a strand needs ` +
        `at least ${MAX_ITEMS_PER_STRAND * 2}.`
    );
  }
  if (items.length < MAX_ITEMS_PER_STRAND * 3) {
    warnings.push(
      `${strand.id}: ${items.length} items is two clean papers, not three (want ${MAX_ITEMS_PER_STRAND * 3}+ before a third re-take)`
    );
  }
  const levels = items.map((i) => i.level);
  const lo = Math.min(...levels);
  const hi = Math.max(...levels);
  if (lo > 3.0) errors.push(`${strand.id}: lowest item is level ${lo} — cannot measure below that`);
  if (hi < 5.5) errors.push(`${strand.id}: highest item is level ${hi} — cannot measure above that`);
  for (const l of levels) {
    if (l < MIN_LEVEL || l > MAX_LEVEL) {
      errors.push(`${strand.id}: item level ${l} is outside the reportable range`);
    }
  }
}

// ---- 2. Item shape ---------------------------------------------------------
const seenIds = new Set();
for (const item of allItems) {
  const where = `item ${item.id}`;
  if (seenIds.has(item.id)) errors.push(`${where}: duplicate id`);
  seenIds.add(item.id);
  if (!STRAND_IDS.includes(item.strand)) errors.push(`${where}: unknown strand ${item.strand}`);
  if (!Array.isArray(item.choices) || item.choices.length < 3) {
    errors.push(`${where}: needs at least 3 choices`);
    continue;
  }
  if (typeof item.answer !== 'number' || item.answer < 0 || item.answer >= item.choices.length) {
    errors.push(`${where}: answer index ${item.answer} is not a valid choice`);
  }
  if (!Array.isArray(item.choiceFeedback) || item.choiceFeedback.length !== item.choices.length) {
    errors.push(`${where}: choiceFeedback must have one entry per choice`);
    continue;
  }
  item.choiceFeedback.forEach((fb, i) => {
    if (i === item.answer && fb !== null) {
      errors.push(`${where}: choiceFeedback[${i}] is the correct answer and must be null`);
    }
    if (i !== item.answer && (!fb || String(fb).trim().length < 10)) {
      errors.push(`${where}: choice ${i} has no real wrong-answer feedback`);
    }
  });
  // Case- and punctuation-SENSITIVE on purpose. The grammar strand asks her to
  // pick between "the mint smells fresh" and "The mint smells fresh." — those
  // differ only in case and a full stop, and a case-insensitive check would
  // call the whole capitalisation question a duplicate and delete it.
  const uniqueChoices = new Set(item.choices.map((c) => String(c).trim()));
  if (uniqueChoices.size !== item.choices.length) {
    errors.push(`${where}: two choices are identical`);
  }
  if (!item.explanation || item.explanation.length < 10) {
    errors.push(`${where}: missing explanation`);
  }
}

// ---- 3. Content safety -----------------------------------------------------
// Phrases that would turn a botany card into medical advice aimed at a child.
// Deliberately blunt: a false positive costs one rewritten sentence, a false
// negative ships medical advice to a nine-year-old.
//
// TUNED, not loosened. The first draft banned the bare word "dose" and the
// bare phrase "take 2". Both fired on content that is exactly what this app is
// for: a reading passage explaining that "a purified, measured dose is not the
// same as a handful of leaves" is the most useful paragraph in the bank, and a
// fractions question saying "take 2 of the 3 parts" is arithmetic.
//
// The line is INSTRUCTION TO THE READER, not the vocabulary of medicine. A
// child should be able to read the word "dose" in a passage about how trials
// work. She should never read a sentence telling her to take one.
const BANNED = [
  /\b(treats?|cures?|heals?|remedies)\s+(your|a|an|the)?\s*\w*(ache|pain|cold|flu|infection|anxiety|insomnia|nausea|fever)/i,
  /\bgood for (your |a |an |the )?\w*(stomach|sleep|skin|throat|cough|nerves|anxiety|immunity)/i,
  // An imperative aimed at the reader, with an amount and a medicinal unit.
  /\b(take|drink|swallow|apply|rub|brew)\s+\d+\s*(drops?|teaspoons?|tablespoons?|capsules?|cups?|ml\b|mg\b|grams? of)/i,
  /\b\d+\s*(drops?|teaspoons?|tablespoons?|capsules?)\s+(a|per|each)\s+day\b/i,
  // "your dose", "the recommended dosage" — a dose presented AS a prescription.
  /\b(your|the recommended|the correct|the proper|a safe|the right)\s+dos(e|age)\b/i,
  /\bwill (help|cure|heal|fix) (you|your)\b/i,
  // An ASSERTION that a thing is safe to consume — "chamomile is safe to
  // drink". Narrowed from a bare /safe to (take|drink|eat)/, which fired on the
  // vocabulary item defining the word "edible" and on a reading item whose
  // WRONG answer is "cooking makes all plants safe to eat" — a distractor the
  // item exists to refute. Teaching what "edible" means, and correcting the
  // belief that cooking makes anything safe, are both squarely the point.
  /\b(is|are|it's|its)\s+safe to (take|drink|eat)\b/i
];

function scanText(label, text) {
  for (const rx of BANNED) {
    if (rx.test(text)) errors.push(`${label}: banned medical phrasing matched ${rx}`);
  }
}

for (const herb of herbs) {
  const blob = [herb.grows, herb.lookFor, herb.traditionalUse, herb.fact].join(' ');
  scanText(`herb ${herb.id}`, blob);
  for (const field of ['name', 'latin', 'partsUsed', 'grows', 'lookFor', 'traditionalUse', 'fact']) {
    if (!herb[field] || String(herb[field]).trim() === '') {
      errors.push(`herb ${herb.id}: missing ${field}`);
    }
  }
}
if (!SAFETY_LINE || SAFETY_LINE.length < 20) errors.push('SAFETY_LINE is missing or too short');

for (const item of allItems) {
  scanText(`item ${item.id}`, [item.prompt, item.passage || '', item.explanation, ...item.choices].join(' '));
}

// ---- 4. Khan map completeness ---------------------------------------------
for (const id of STRAND_IDS) {
  if (!KHAN_MAP[id]) {
    errors.push(`khanMap: no bands for strand ${id}`);
    continue;
  }
  for (const level of [2.0, 3.0, 4.0, 5.0, 6.0, 6.5]) {
    if (!khanFor(id, level)) errors.push(`khanMap: ${id} has no course at level ${level}`);
  }
}

// ---- Report ----------------------------------------------------------------

// ---------------------------------------------------------------------------
// THE BANK MUST REACH THE ENGINE'S FLOOR.
//
// This check exists because of the single most consequential bug in the app,
// and it was invisible to every other check for a week.
//
// The engine's floor was 2.0. The easiest question in the bank was 2.3 to 2.5.
// Nothing was broken — every item was valid, every strand had 21 of them, the
// simulation passed. But a child below 2.3 could not be measured: her estimate
// fell to the floor, the easy items ran out, and the engine then served her
// HARDER ones because they were the nearest that existed. Four of Azianna's
// nine strands pinned at 2.00 and the number meant nothing.
//
// A floor is only honest when there is something underneath it. So: every
// strand's easiest item must sit at or below MIN_LEVEL, and there must be
// enough of them that a struggling child is not walked back uphill.
// ---------------------------------------------------------------------------
{
  const NEEDED_BELOW = 3; // enough to keep serving downward, not just touch the floor
  for (const s of bankSummary()) {
    const items = itemsForStrand(s.strand);
    if (s.minLevel > MIN_LEVEL) {
      errors.push(
        `${s.strand}: easiest question is ${s.minLevel.toFixed(1)} but the engine floor is ` +
          `${MIN_LEVEL.toFixed(1)} — a child below ${s.minLevel.toFixed(1)} cannot be measured, ` +
          `and the engine will serve her HARDER items once the easy ones run out`
      );
    }
        // "Near the floor" means within a grade level of it. Narrower than that
    // and the window stops describing anything real about how the staircase
    // behaves down here.
    const easy = items.filter((i) => i.level <= MIN_LEVEL + 1.0).length;
    if (easy < NEEDED_BELOW) {
      errors.push(
        `${s.strand}: only ${easy} question(s) at or near the floor. A struggling child needs at ` +
          `least ${NEEDED_BELOW} or the test runs out of easy ones and starts climbing.`
      );
    }
  }
}

console.log('\nPetal & Pestle — item bank check\n');
console.table(
  bankSummary().map((s) => ({
    strand: s.strand,
    items: s.count,
    lowest: s.minLevel,
    highest: s.maxLevel
  }))
);
console.log(`Total items: ${allItems.length}`);
console.log(`Herb cards:  ${herbs.length}\n`);

if (warnings.length) {
  console.log('Warnings:');
  for (const w of warnings) console.log(`  · ${w}`);
  console.log('');
}

if (errors.length) {
  console.error(`FAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log('All checks passed.\n');
