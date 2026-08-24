// ---------------------------------------------------------------------------
// THE READING CAPS — out of the comments and into a file a check can read.
//
// ---- WHY THIS FILE EXISTS ----
//
// The caps were real, they were deliberate, and they were written in SEVEN
// module header comments across fifty-six lesson files:
//
//   humanbodyM1.js:33   "Quarter 1 cap: 11 words per sentence."
//   socialM5.js:8       "Cap goes from eleven words a sentence to TWELVE, and
//                        the long-word cap from 6% to 7%."
//   socialM9.js:29      "Cap 14 words a sentence, FLOOR 6.5, long-word cap 10%."
//
// Nothing measured them. That is the same failure `check-readability.mjs` was
// written for — its own header says the first elaItems.js "CLAIMED every
// passage sat at or below the grade it tested. That claim was asserted in a
// comment, never measured." The claim moved into the lesson files and stayed a
// comment.
//
// A rule the app must follow lives where a check can test it. So it lives here.
//
// ---- WHY A RAMP AT ALL ----
//
// socialM5.js: "Small steps on purpose: by November she has had a term of
// instruction, not a year of it." socialM9.js adds a FLOOR, and the floor is
// the half that is easy to forget: prose written too easy is as wrong as prose
// written too hard.
// ---------------------------------------------------------------------------

/**
 * Words per sentence and long-word rate, by quarter.
 *
 * `source` is where the number came from. A cap with no provenance is a number
 * somebody typed, and six months from now nobody can tell those apart.
 */
export const READING_CAPS = {
  1: { meanSentence: 11, hardRate: 0.06, floor: null, source: 'humanbodyM1.js:33, humanbodyM2/M4' },
  2: { meanSentence: 12, hardRate: 0.07, floor: null, source: 'socialM5.js:8, humanbodyM7/M8' },
  3: { meanSentence: 14, hardRate: 0.10, floor: 6.5, source: 'socialM9.js:29' },

  /**
   * QUARTER 4 — HELD AT 14. This is a decision, not a measurement.
   *
   * NOTHING ON DISK EVER STATED A Q4 CAP. The ramp runs 11 → 12 → 14 → and then
   * stops, because Q4 Herbalism was written at v3.9, before the ramp policy
   * existed. By the time the rule was written down that content was already on
   * disk, and nobody went back to extend the line.
   *
   * ---- WHY 14 AND NOT 15 OR 16 ----
   *
   * A ramp is a PREDICTION about growth. §3.10.8: "growth is a delta on ONE
   * INSTRUMENT'S SCALE, and nothing else" — and this app has exactly one
   * instrument, the Check-In. Her baseline came off it on Aug 13 2026 and no
   * second sitting has been scheduled, so there is no evidence for or against
   * the prediction yet.
   *
   * Holding at 14 is the reversible choice. Setting 16 now bets on a year of
   * reading growth from a child who started below grade, and you would find out
   * in May, after the lessons were written. She does not reach Q4 Herbalism
   * until roughly April, so a Check-In re-take at the end of Q2 or Q3 lands
   * months ahead of it.
   *
   * ⚠️ REVIEW THIS NUMBER AFTER THE NEXT CHECK-IN, and write what moved.
   * Her Reading 3.46 and Vocabulary 2.91 are LISTENING scores — 10 of her 13
   * reading questions were read aloud. The app records read-aloud per answer,
   * so a re-take is what tells you what her INDEPENDENT reading is doing.
   *
   * NOTE: the quarterly and weekly tests cannot answer this. They carry
   * evidenceSource 'test' and draw from the course banks, which have no strand.
   * Strand levels move only on evidenceSource 'diagnostic', and §3.10.6 keeps
   * that wall up on purpose.
   */
  4: { meanSentence: 14, hardRate: 0.10, floor: 6.5, source: 'HELD — see note. Not stated on disk.' }
};

export function capsForQuarter(q) {
  return READING_CAPS[q] || null;
}

/**
 * ---------------------------------------------------------------------------
 * ACCEPTED DEBT — lessons over a cap, known, dated, and RATCHETED.
 *
 * The check does not merely warn about these. It asserts the list is EXACTLY
 * right in both directions:
 *
 *   · a lesson over a cap that is NOT on this list  → FAIL (new breach)
 *   · a lesson on this list that is no longer over  → FAIL (stale entry)
 *
 * So the number can only go down, and fixing a lesson forces its line to be
 * deleted. That is the difference between recorded debt and a warning nobody
 * reads. A check that fails on the day it arrives trains you to ignore it; a
 * check that lets the debt grow silently is not a check at all.
 *
 * ---- WHAT IS ON IT, AND WHY ----
 *
 * Measured Aug 23 2026 across all 256 lessons. Herbalism Modules 13, 14 and 15
 * are eighteen for eighteen — every lesson in all three modules is over, at
 * 16 to 19.6 words a sentence against a cap of 14. That is not drift across a
 * year of writing; that is one writing session held to a different standard,
 * and it is the oldest content in the app.
 *
 * DECISION: split the sentences, do not raise the cap. To let M13-M15 stand you
 * would have to set Q4 at TWENTY words a sentence, which is adult prose, and you
 * would be lowering a standard the other 240 lessons already meet in order to
 * accommodate 18. It is a sentence-SPLITTING job, not a rewrite of what is
 * taught — the content is not wrong, the sentences are long.
 *
 * NOT URGENT. Q4 is April. Queued behind the tagging job.
 * ---------------------------------------------------------------------------
 */
export const KNOWN_OVER = [
  // ---- Herbalism Q4, Modules 13-15 · eighteen for eighteen ----
  // The oldest content in the app (v3.9), written before the ramp policy
  // existed. SPLIT THE SENTENCES; do not raise the cap. Q4 is April.
  //
  // ---- Herbalism Q3, Modules 10-11 · six lessons, 14.2-16.4w ----
  // Same story, one quarter earlier and milder. Same fix.
  //
  // ---- The Science Lab Q1 · eight lessons, 11.4-13.8w vs a cap of 11 ----
  // Mild and clustered in Modules 3 and 4. Worth one pass.
  //
  // ---- Three long-word breaches, all real ----
  // hb-m3-03 (energy, producer, consumer, decomposer) and ss-m4-04
  // (amendment, government) are naming the thing they teach. body-m8-04 is
  // ordinary prose and is the one genuinely worth rewording.
  //
  // `was` records the measurement on the day it was added. It is documentation,
  // not a threshold — the check re-measures and only asks whether the lesson is
  // still over its cap at all.
  { id: 'hb-m3-03', q: 1, was: '7.2% long vs 6% (energy, producer, consumer, caterpillar)' },
  { id: 'hb-m10-02', q: 3, was: '16.1w vs 14' },
  { id: 'hb-m11-01', q: 3, was: '14.8w vs 14' },
  { id: 'hb-m11-02', q: 3, was: '15.7w vs 14' },
  { id: 'hb-m11-03', q: 3, was: '16.4w vs 14' },
  { id: 'hb-m11-04', q: 3, was: '14.2w vs 14' },
  { id: 'hb-m11-05', q: 3, was: '14.2w vs 14' },
  { id: 'hb-m13-01', q: 4, was: '17.2w vs 14' },
  { id: 'hb-m13-02', q: 4, was: '19.6w vs 14' },
  { id: 'hb-m13-03', q: 4, was: '17.4w vs 14' },
  { id: 'hb-m13-04', q: 4, was: '17.4w vs 14' },
  { id: 'hb-m13-05', q: 4, was: '19.1w vs 14' },
  { id: 'hb-m13-06', q: 4, was: '17.3w vs 14' },
  { id: 'hb-m14-01', q: 4, was: '15.2w vs 14' },
  { id: 'hb-m14-02', q: 4, was: '15.2w vs 14' },
  { id: 'hb-m14-03', q: 4, was: '16w vs 14' },
  { id: 'hb-m14-04', q: 4, was: '16.3w vs 14' },
  { id: 'hb-m14-05', q: 4, was: '16w vs 14' },
  { id: 'hb-m14-06', q: 4, was: '19w vs 14' },
  { id: 'hb-m15-01', q: 4, was: '18.1w vs 14' },
  { id: 'hb-m15-02', q: 4, was: '18.1w vs 14' },
  { id: 'hb-m15-03', q: 4, was: '16.6w vs 14' },
  { id: 'hb-m15-04', q: 4, was: '18.6w vs 14' },
  { id: 'hb-m15-05', q: 4, was: '17.4w vs 14' },
  { id: 'hb-m15-06', q: 4, was: '15.8w vs 14' },
  { id: 'sl-m2-05', q: 1, was: '11.8w vs 11' },
  { id: 'sl-m3-01', q: 1, was: '11.4w vs 11' },
  { id: 'sl-m3-03', q: 1, was: '12.7w vs 11' },
  { id: 'sl-m3-04', q: 1, was: '12.9w vs 11' },
  { id: 'sl-m4-03', q: 1, was: '12.9w vs 11' },
  { id: 'sl-m4-04', q: 1, was: '13.8w vs 11' },
  { id: 'sl-m4-05', q: 1, was: '11.6w vs 11' },
  { id: 'sl-m4-06', q: 1, was: '11.7w vs 11' },
  { id: 'sl-m8-06', q: 3, was: '14.4w vs 14' },
  { id: 'ss-m4-04', q: 1, was: '8.2% long vs 6% (amendment, forgotten, newspapers, government)' },
  { id: 'body-m8-04', q: 2, was: '7.9% long vs 7.000000000000001% (actually, listening, information, anybody)' },
  { id: 'body-m16-01', q: 4, was: '16.6w vs 14' },
];

/**
 * ---------------------------------------------------------------------------
 * CANNOT BE CAPPED — the thirteen flat cards.
 *
 * hb-1-01 … hb-1-13 carry NO `course`, NO `quarter`, NO `week` and NO
 * `standards`. Only: id, video, n, title, minutes, words, hook, core, doing,
 * practice, check. They were re-homed at v3.8 rather than deleted, which was
 * right — every lesson record she already had survived — but they never gained
 * the fields the rest of the app assumes.
 *
 * With no quarter there is no cap to measure them against, so this check cannot
 * judge them and says so rather than skipping them quietly. It fails if the
 * list grows.
 *
 * ⚠️ THEY DO CARRY `words:`, so the Phase 2 skill tagging would tag thirteen
 * lessons that do not know what course they are in. Worth fixing BEFORE the
 * tagging pass, not after.
 * ---------------------------------------------------------------------------
 */
export const UNCAPPABLE = [
  'hb-1-01', 'hb-1-02', 'hb-1-03', 'hb-1-04', 'hb-1-05', 'hb-1-06', 'hb-1-07',
  'hb-1-08', 'hb-1-09', 'hb-1-10', 'hb-1-11', 'hb-1-12', 'hb-1-13'
];
