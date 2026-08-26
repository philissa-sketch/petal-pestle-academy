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
//   · Anything in §1b. That is the Aug 13 baseline, it is FROZEN by design, and
//     a check that forced it to match today's record would destroy the only
//     thing a growth delta can be measured from.
//   · Anything in §1c, §2, §3, §4, §5. §3 is known to be stale as this is
//     written — it still prints 2.50 and 2.82 and an argument v3.81 overturned.
//     A check that quietly covered it would make that staleness invisible.
//     ⚠️ IF §3 IS EVER CORRECTED, WIDEN THIS CHECK TO IT. Do not leave the gap
//     because the heading here says the gap is known.
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

const SEC1_START = /\n##\s*1\.\s/;
const SEC1_END = /\n##\s*1[a-z]\.\s/;

const startM = doc.match(SEC1_START);
let section1 = null;
if (!startM) {
  fail(
    'doc-has-section-1',
    `could not find the "## 1." heading in ${DOC_REL}. If it was renamed, this check has ` +
      `stopped asserting anything — fix the pattern rather than deleting the assertion.`
  );
} else {
  const from = startM.index + startM[0].length;
  const rest = doc.slice(from);
  const endM = rest.match(SEC1_END);
  section1 = endM ? rest.slice(0, endM.index) : rest;
}

if (section1) {
  // Rows look like:  | Grammar & Usage | **2.35** | ✓ | ... |
  const rowRx = /^\|\s*(?:\*\*)?([^|*]+?)(?:\*\*)?\s*\|\s*(?:\*\*)?(\d\.\d{2})(?:\*\*)?\s*\|/gm;
  const found = new Map();
  let m;
  while ((m = rowRx.exec(section1)) !== null) {
    found.set(m[1].trim(), m[2]);
  }

  if (found.size === 0) {
    fail(
      'section-1-table-parses',
      `§1 of ${DOC_REL} has no rows this check can read. The table shape changed, and a check ` +
        `that silently matches nothing is the thing this file exists to prevent.`
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
        'every-strand-has-a-row',
        `§1 has no row labelled "${strand.label}", but her record holds it at ${expected}. ` +
          `A strand missing from the table is a strand this check cannot guard — an omission ` +
          `must never exempt itself.`
      );
      continue;
    }

    compared += 1;
    if (printed !== expected) {
      fail(
        'section-1-level-matches-record',
        `§1 says ${strand.label} is ${printed}. Her record says ${expected}. This document ` +
          `governs the reading level of every lesson in the app — master plan §30.`
      );
    }
  }

  // ⚠️ THE FLOOR. A parser that matched nothing would otherwise report nine
  // silent successes and exit green — "0 of 0 passed", the most dangerous shape
  // a check can have. run-all-checks has the same floor for the same reason.
  if (compared === 0 && found.size > 0) {
    fail(
      'something-was-actually-compared',
      `§1 has ${found.size} readable rows and NOT ONE of them matched a strand label from ` +
        `src/config/strands.js. The labels have drifted apart, so this check is reading a ` +
        `table it cannot understand and would pass whatever the numbers said.`
    );
  } else if (compared > 0) {
    notes.push(`§1: ${compared} of ${STRANDS.length} strand levels compared against her record`);
  }
}

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
  '\n  NOT TESTED HERE: §1b (the Aug 13 baseline, frozen on purpose), §1c, and\n' +
    '  §3 — which is KNOWN to be stale and must not be made invisible by a check\n' +
    '  that quietly covers it. Widen this to §3 when §3 is corrected.\n'
);

if (failures.length === 0) {
  console.log('Her document and her record agree.\n');
  process.exit(0);
}

console.error(`FAILED — ${failures.length}\n`);
for (const f of failures) console.error(`  [${f.rule}] ${f.detail}`);
console.error('');
process.exit(1);
