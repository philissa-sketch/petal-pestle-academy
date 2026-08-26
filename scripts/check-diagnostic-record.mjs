// ---------------------------------------------------------------------------
// CHECK — HER DIAGNOSTIC DOCUMENT SAYS WHAT HER RECORD SAYS.
//
// Run with: node scripts/check-diagnostic-record.mjs
//
// ---- WHY THIS EXISTS, AND IT IS THE THIRD TIME ----
//
// `claude/azianna-diagnostic-results.md` governs the reading level of all 256
// lessons — master plan §30 makes it the thing every lesson is written against.
// It is also hand-written prose, and it has now drifted from her record three
// times, each caught by a person rather than by anything:
//
//   Aug 24 — the file said Grammar 2.15, Writing 2.45, Geometry and
//            Measurement 2.00. Her record said 2.20, 2.70, 2.70, 2.70. The
//            correction note is still in the file. It called that "the tenth
//            hand-typed number in this project to drift".
//   Aug 26 — the file said Measurement 2.50, Geometry 2.82, Writing 2.82 with
//            "still re-measuring" beside them. Her record said 2.44, 2.67,
//            2.67, all settled. Gigi caught it and it was the first job of the
//            session.
//   Aug 26 — the same file, one section down: §1d said "54 of her 86 answers".
//            Her record held 90. Nobody had mentioned that one at all; it was
//            found while fixing the first.
//
// Twice is a coincidence you write a note about. Three times is a rule you have
// to act on, and a rule you have to act on is a CHECK — the same sentence that
// produced check-version-stamp, for the same reason.
//
// ---- ⚠️ THE HONEST LIMIT OF THIS CHECK, STATED BEFORE ITS ASSERTIONS ----
//
// Her export and this document are BOTH deliberately kept out of git — the
// repository is public, the document is a full educational assessment of a
// named child, and `.gitignore` line 95 excludes it on purpose.
//
// SO ON NETLIFY, NEITHER FILE EXISTS AND THIS CHECK COMPARES NOTHING.
//
// That was Gigi's call, made in words: it guards her machine, which is the only
// machine where the document can be edited, and that is enough. But a check
// that can pass without testing anything is one line away from the thing this
// build log keeps writing down, so:
//
//   IT NEVER PRINTS A CLAIM IT HAS NOT TESTED. When the files are absent it
//   says so in a sentence a person can read — "nothing was compared" — and it
//   does not print the word PASSED. A green run on Netlify says only that the
//   files were not there.
//
// ---- WHAT IT ASSERTS, when both files ARE present ----
//
//   1. §1's table has one row per strand in her record — nine of nine. A strand
//      MISSING from the table is a failure, not an exemption. (v3.83: a fixture
//      that omitted a field exempted itself. That is the seventh time an
//      assertion has been satisfied by something other than the rule.)
//   2. Every §1 level equals `level.toFixed(2)` of that strand in her record.
//      toFixed, because the record stores 2.4399999999999995 and every screen
//      in the app formats the same way — see master plan §32.8.
//   3. §1d's read-aloud sentence counts what her record counts: how many
//      answers carry readAloud, out of how many answers exist.
//
// ---- WHAT IT DOES NOT ASSERT, so it never claims more than it tests ----
//
//   4. §3's table — "What Khan assigns her, right now" — carries the same nine
//      levels. WIDENED v3.88, the moment §3 was rewritten clean.
//      ⚠️ At v3.86 this check deliberately did NOT cover §3, because §3 was
//      stale and a check that quietly covered a stale section would have made
//      the staleness invisible. The header said, in capitals, to widen it the
//      moment §3 was corrected. §3 was corrected at v3.88 and this is that
//      widening — written in the same session, not left for someone to find.
//
// ---- WHAT IT DOES NOT ASSERT, so it never claims more than it tests ----
//
//   · Anything in §1b. That is the Aug 13 baseline, it is FROZEN by design, and
//     a check that forced it to match today's record would destroy the only
//     thing a growth delta can be measured from.
//   · Anything in §1c, §2, §4, §5.
//   · WHICH KHAN UNIT §3 SAYS SHE OPENS. Only the levels. The unit column is
//     produced by khanFor/laneFor/nextUnitForStrand, and asserting it here
//     would mean reimplementing those three functions inside a check — at
//     which point the check and the app can drift apart and BOTH be self-
//     consistent. check-strand-lanes and check-khan-units own that rule.
//   · That the prose around the numbers is true.
//   · That the document was updated for any particular change.
//
// ---- ⚠️ THE YARDSTICK IS NOT THE FILE DATE ----
//
// The obvious rule — "compare against the newest export by modification time" —
// FAILS A SAFER CHANGE, which this project has now done seven times. Copying a
// file, restoring a folder, or re-saving a stale export all move an mtime, and
// any of them would point this check at `local/her-latest-export.json` (86
// answers, stale) and turn it red against a CORRECT document.
//
// So the yardstick is the answer count: her record only ever grows, so the
// export carrying the most answers is the newest reading of her, whatever the
// filesystem thinks. Ties break on mtime. The file it chose is PRINTED, every
// run, so the choice is never silent.
//
// NOTE ON REGEXES BELOW: no quote character appears inside a character class —
// see the header of check-version-stamp.mjs.
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

import { STRANDS } from '../src/config/strands.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DOC_REL = 'claude/azianna-diagnostic-results.md';
const DOC = resolve(ROOT, DOC_REL);

const failures = [];
const fail = (rule, detail) => failures.push({ rule, detail });
const notes = [];

const SKIP = new Set(['node_modules', '.git', 'dist', '_to_delete', '_archive-test']);

/** Every .json under the project, minus the folders that hold copies and builds. */
function walkJson(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkJson(full, out);
    else if (name.toLowerCase().endsWith('.json') && st.size < 2_000_000) out.push(full);
  }
  return out;
}

/**
 * An export is recognised STRUCTURALLY, never by its name — the same rule
 * check-publish-safety uses, and for the same reason. Gigi's own backup was
 * called `petal-pestle-backup-2026-08-26.json` and matched none of the four
 * name patterns that were supposed to find it.
 */
function asRecord(file) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  if (data.app !== 'Petal & Pestle Academy') return null;
  if (!Array.isArray(data.strandStates) || !Array.isArray(data.answers)) return null;
  if (!data.strandStates.length) return null;
  return data;
}

// ---- find her record ------------------------------------------------------

const candidates = [];
for (const file of walkJson(ROOT)) {
  const data = asRecord(file);
  if (!data) continue;
  let mtime = 0;
  try {
    mtime = statSync(file).mtimeMs;
  } catch {
    mtime = 0;
  }
  candidates.push({ file, data, answers: data.answers.length, mtime });
}

candidates.sort((a, b) => (b.answers - a.answers) || (b.mtime - a.mtime));

const record = candidates[0] || null;
const docExists = existsSync(DOC);

// ---- the skip, said in words ----------------------------------------------

if (!record || !docExists) {
  console.log('\nPetal & Pestle — diagnostic record check');
  console.log('Does her diagnostic document say what her record says?\n');

  if (!record) {
    console.log('  NOTHING WAS COMPARED. No export of her record is on this computer.');
    console.log('  That is expected anywhere but Gigi’s PC and the Chromebook: her');
    console.log('  export is kept out of git on purpose, because this repository is public.');
  }
  if (!docExists) {
    console.log(`  NOTHING WAS COMPARED. ${DOC_REL} is not on this computer.`);
    console.log('  That is expected off her PC: .gitignore line 95 excludes it on purpose,');
    console.log('  because it is a full educational assessment of a named child.');
  }

  console.log(
    '\n  So this run tested NOTHING and is green only because there was nothing\n' +
      '  here to test. On Gigi’s computer both files exist and it compares them.\n'
  );
  process.exit(0);
}

const doc = readFileSync(DOC, 'utf8');
notes.push(
  `read her record from ${relative(ROOT, record.file)} — ${record.answers} answers, ` +
    `${record.data.strandStates.length} strands`
);
if (candidates.length > 1) {
  notes.push(
    `${candidates.length} exports on disk; the one with the most answers governs ` +
      `(${candidates.map((c) => `${relative(ROOT, c.file)}:${c.answers}`).join(', ')})`
  );
}

// ---- §1, sliced by its own headings ---------------------------------------
//
// Sliced, not searched. A level matched anywhere in a 300-line document would
// be satisfied by §1b, §1c or §3 — all of which legitimately carry OTHER
// numbers for the same strand, and two of which are frozen history. That is the
// adjacency trap this project has hit seven times, and slicing is the fix.

/** The text between one heading and the next, or null when the heading is gone. */
function slice(name, startRx, endRx, missingRule) {
  const startM = doc.match(startRx);
  if (!startM) {
    fail(
      missingRule,
      `could not find the ${name} heading in ${DOC_REL}. If it was renamed, this check has ` +
        `stopped asserting it — fix the pattern rather than deleting the assertion.`
    );
    return null;
  }
  const from = startM.index + startM[0].length;
  const rest = doc.slice(from);
  const endM = rest.match(endRx);
  return endM ? rest.slice(0, endM.index) : rest;
}

const section1 = slice('"## 1."', /\n##\s*1\.\s/, /\n##\s*1[a-z]\.\s/, 'doc-has-section-1');
const section3 = slice('"## 3."', /\n##\s*3\.\s/, /\n##\s*4\.\s/, 'doc-has-section-3');

/**
 * Compare one section's level table against her record.
 *
 * ⚠️ ONE FUNCTION, CALLED TWICE, RATHER THAN A COPY. §1 and §3 print the same
 * nine numbers, and this project has already had two implementations of one
 * metric drift apart while both looked right — v3.78 and v3.84, the second of
 * which put two different letter grades on one Georgia record. A copied
 * assertion with the same contents today is two assertions tomorrow.
 */
function compareLevels(section, name) {
  if (!section) return;

  // Rows look like:  | Grammar & Usage | **2.35** | ✓ | ... |
  // The label and the level are the FIRST TWO cells, so a table that gains a
  // column on the right — as §3 did when the lane column arrived — still reads.
  const rowRx = /^\|\s*(?:\*\*)?([^|*]+?)(?:\*\*)?\s*\|\s*(?:\*\*)?(\d\.\d{2})(?:\*\*)?\s*\|/gm;
  const found = new Map();
  let m;
  while ((m = rowRx.exec(section)) !== null) {
    found.set(m[1].trim(), m[2]);
  }

  if (found.size === 0) {
    fail(
      `${name}-table-parses`,
      `${name} of ${DOC_REL} has no rows this check can read. The table shape changed, and a ` +
        `check that silently matches nothing is the thing this file exists to prevent.`
    );
  }

  let compared = 0;
  for (const strand of STRANDS) {
    const state = record.data.strandStates.find((s) => s.strandId === strand.id);
    if (!state) {
      notes.push(`${strand.label} is not in this export — nothing to compare`);
      continue;
    }
    const expected = Number(state.level).toFixed(2);
    const printed = found.get(strand.label);

    if (printed === undefined) {
      fail(
        `${name}-every-strand-has-a-row`,
        `${name} has no row labelled "${strand.label}", but her record holds it at ${expected}. ` +
          `A strand missing from the table is a strand this check cannot guard — an omission ` +
          `must never exempt itself.`
      );
      continue;
    }

    compared += 1;
    if (printed !== expected) {
      fail(
        `${name}-level-matches-record`,
        `${name} says ${strand.label} is ${printed}. Her record says ${expected}. This document ` +
          `governs the reading level of every lesson in the app — master plan §30.`
      );
    }
  }

  // ⚠️ THE FLOOR. A parser that matched nothing would otherwise report nine
  // silent successes and exit green — "0 of 0 passed", the most dangerous shape
  // a check can have. run-all-checks has the same floor for the same reason.
  if (compared === 0 && found.size > 0) {
    fail(
      `${name}-something-was-actually-compared`,
      `${name} has ${found.size} readable rows and NOT ONE of them matched a strand label from ` +
        `src/config/strands.js. The labels have drifted apart, so this check is reading a ` +
        `table it cannot understand and would pass whatever the numbers said.`
    );
  } else if (compared > 0) {
    notes.push(`${name}: ${compared} of ${STRANDS.length} strand levels compared against her record`);
  }
}

compareLevels(section1, '§1');
compareLevels(section3, '§3');

// ---- §1d, the read-aloud count --------------------------------------------

const aloudActual = record.data.answers.filter((a) => a && a.readAloud).length;
const answersActual = record.data.answers.length;

const aloudRx = /\*\*(\d+)\s+of\s+her\s+(\d+)\s+answers\s+were\s+read\s+to\s+her/;
const am = doc.match(aloudRx);

if (!am) {
  fail(
    'doc-states-read-aloud-count',
    `could not find the "N of her N answers were read to her" sentence in ${DOC_REL}. ` +
      `It is the only place her read-aloud share is written down, and it drifted on Aug 26.`
  );
} else {
  const [, statedAloud, statedTotal] = am.map(Number);
  if (statedAloud !== aloudActual || statedTotal !== answersActual) {
    fail(
      'read-aloud-count-matches-record',
      `§1d says ${statedAloud} of ${statedTotal} answers were read aloud. Her record says ` +
        `${aloudActual} of ${answersActual}. Her independent reading has never been measured, ` +
        `so this fraction is the caveat on every level in §1 — it has to be right.`
    );
  } else {
    notes.push(`§1d: ${aloudActual} of ${answersActual} read aloud, matching her record`);
  }
}

// ---- report ----------------------------------------------------------------

console.log('\nPetal & Pestle — diagnostic record check');
console.log('Does her diagnostic document say what her record says?\n');
for (const n of notes) console.log(`  ${n}`);
console.log(
  '\n  NOT TESTED HERE: §1b — the Aug 13 baseline, frozen on purpose, because a\n' +
    '  check that forced it to match today would destroy the growth delta. Nor\n' +
    '  WHICH KHAN UNIT §3 says she opens: that comes from khanFor, laneFor and\n' +
    '  nextUnitForStrand, and reimplementing those here would let the check and\n' +
    '  the app drift apart while both stayed self-consistent. check-strand-lanes\n' +
    '  and check-khan-units own that rule.\n'
);

if (failures.length === 0) {
  console.log('Her document and her record agree.\n');
  process.exit(0);
}

console.error(`FAILED — ${failures.length}\n`);
for (const f of failures) console.error(`  [${f.rule}] ${f.detail}`);
console.error('');
process.exit(1);
