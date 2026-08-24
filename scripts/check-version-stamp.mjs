// ---------------------------------------------------------------------------
// CHECK — THE VERSION NUMBER SAYS THE SAME THING EVERYWHERE.
//
// Run with: node scripts/check-version-stamp.mjs
//
// ---- WHY THIS EXISTS, AND IT IS THE THIRD TIME ----
//
// The build log carries two correction notes about this exact drift, written
// into the file by hand, both after the fact:
//
//   v3.56 — "this line read v3.53 while the top row of the version table read
//            3.55. Two versions of the truth, three lines apart, in the file
//            whose job is to prevent that."
//   v3.60 — "it read v3.59 in this line and v3.55 two lines below, in the
//            sentence about which build had been run — the same drift, in the
//            file that had just been corrected for it."
//
// It happened a THIRD time at v3.70: the header said v3.69 while the table's
// top row said 3.70. Twice is a coincidence you write a note about. Three times
// is a rule you have to act on, and a rule you have to act on is a CHECK.
//
// Two notes in a file are not a check. Nothing had ever read these numbers.
//
// ---- WHAT IT ASSERTS ----
//
//   1. buildStamp.VERSION is the version of its own newest CHANGES entry.
//   2. The CHANGES list is unique and strictly descending.
//   3. All three version claims in the build log agree with buildStamp:
//      the "Current version" header, the run-status line, and the top row of
//      the §1 version table.
//   4. The script counts printed in the log header match the scripts on disk.
//   5. The §3 heading number-word and its table row count match that same
//      number — the "twenty-six checks" heading has been wrong before, and the
//      correction note about it is itself in the file.
//
// ---- WHAT IT DOES NOT ASSERT, so it never claims more than it tests ----
//
//   · That the version was BUMPED for this change. Nothing can know that.
//   · That BUILD_DATE is today, or that any date anywhere is right.
//   · Anything about the master plan. It carries section titles like
//     "v3.60 to v3.69" which are HISTORY and must not be rewritten.
//   · Whether the changelog prose is true.
//
// NOTE ON REGEXES BELOW: no quote character appears inside a character class,
// because check-sources strips strings before counting brackets and has no
// concept of a regex literal — see the header of src/lib/readingLoad.js.
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { VERSION, CHANGES } from '../src/config/buildStamp.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const LOG_PATH = resolve(ROOT, 'claude/petal-pestle-build-log.md');

const failures = [];
const fail = (rule, detail) => failures.push({ rule, detail });
const notes = [];

const log = readFileSync(LOG_PATH, 'utf8');

/** "3.70" -> 3.70 as a comparable pair, so 3.9 sorts below 3.70. */
function parts(v) {
  const m = String(v).match(/^(\d+)\.(\d+)$/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}
function isAfter(a, b) {
  const x = parts(a);
  const y = parts(b);
  if (!x || !y) return false;
  return x[0] !== y[0] ? x[0] > y[0] : x[1] > y[1];
}

// ---- 1. buildStamp agrees with itself --------------------------------------

if (!parts(VERSION)) {
  fail('version-is-well-formed', `buildStamp.VERSION is "${VERSION}", expected N.N`);
}

const newest = CHANGES && CHANGES[0] ? CHANGES[0].version : null;
if (!newest) {
  fail('changes-has-entries', 'buildStamp.CHANGES is empty or its first entry has no version');
} else if (newest !== VERSION) {
  fail(
    'version-matches-newest-change',
    `buildStamp.VERSION is ${VERSION} but the newest CHANGES entry is ${newest}. ` +
      `The number on her screen and the note explaining it must be the same release.`
  );
}

// ---- 2. the changelog is ordered and has no duplicates ---------------------

const seen = new Set();
for (let i = 0; i < CHANGES.length; i += 1) {
  const v = CHANGES[i].version;
  if (seen.has(v)) fail('changes-are-unique', `version ${v} appears twice in CHANGES`);
  seen.add(v);
  if (i > 0 && !isAfter(CHANGES[i - 1].version, v)) {
    fail(
      'changes-are-descending',
      `CHANGES goes ${CHANGES[i - 1].version} then ${v}. Newest first, strictly descending — ` +
        `an out-of-order entry is how a release note ends up under the wrong version.`
    );
  }
}

// ---- 3. the build log's three version claims -------------------------------
//
// Each is located by its own shape rather than by line number, so moving a
// paragraph does not silently disable the assertion.

const CLAIMS = [
  {
    rule: 'log-header-version',
    what: 'the "Current version" header',
    rx: /\*\*Current version:\*\*\s*v(\d+\.\d+)/,
  },
  {
    rule: 'log-run-status-version',
    what: 'the run-status line',
    rx: /\*\*v(\d+\.\d+) run status:\*\*/,
  },
  {
    rule: 'log-table-top-row',
    what: 'the top row of the §1 version table',
    rx: /\n\|\s*\*\*(\d+\.\d+)\*\*\s*\|/,
  },
];

for (const claim of CLAIMS) {
  const m = log.match(claim.rx);
  if (!m) {
    fail(
      claim.rule,
      `could not find ${claim.what} in the build log. If it was reworded, this check has stopped ` +
        `asserting it — fix the pattern rather than deleting the line.`
    );
    continue;
  }
  if (m[1] !== VERSION) {
    fail(
      claim.rule,
      `${claim.what} says v${m[1]}, buildStamp says v${VERSION}. This is the drift corrected by ` +
        `hand at v3.56 and again at v3.60.`
    );
  }
}

// ---- 4. the script counts in the log header match the disk -----------------

const scripts = readdirSync(HERE).filter((f) => /^(check|verify|simulate)-.+\.mjs$/.test(f));
const checkScripts = scripts.filter((f) => f.startsWith('check-'));
const simScripts = scripts.filter((f) => !f.startsWith('check-'));

const countRx = /\*\*(\d+) scripts in total — (\d+) `check-\*` and (\d+) `simulate-`\/`verify-`\.\*\*/;
const cm = log.match(countRx);
if (!cm) {
  fail(
    'log-states-script-counts',
    'could not find the "N scripts in total" line in the build log header'
  );
} else {
  const [, total, checks, sims] = cm.map(Number);
  if (total !== scripts.length) {
    fail(
      'script-total-matches-disk',
      `the log header says ${total} scripts, ${scripts.length} are on disk`
    );
  }
  if (checks !== checkScripts.length) {
    fail(
      'check-count-matches-disk',
      `the log header says ${checks} check-* scripts, ${checkScripts.length} are on disk`
    );
  }
  if (sims !== simScripts.length) {
    fail(
      'sim-count-matches-disk',
      `the log header says ${sims} simulate-/verify- scripts, ${simScripts.length} are on disk`
    );
  }
}

// ---- 5. the §3 heading and its table both count the same ------------------

const WORDS = {
  twenty: 20, 'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23,
  'twenty-four': 24, 'twenty-five': 25, 'twenty-six': 26, 'twenty-seven': 27,
  'twenty-eight': 28, 'twenty-nine': 29, thirty: 30, 'thirty-one': 31,
  'thirty-two': 32, 'thirty-three': 33, 'thirty-four': 34, 'thirty-five': 35,
  'thirty-six': 36, 'thirty-seven': 37, 'thirty-eight': 38, 'thirty-nine': 39,
  forty: 40,
};

const headingRx = /##\s*3\.\s*The\s+([a-z-]+)\s+checks/;
const hm = log.match(headingRx);
if (!hm) {
  fail('log-has-section-3-heading', 'could not find the §3 "The N checks" heading');
} else {
  const stated = WORDS[hm[1]];
  if (stated === undefined) {
    fail(
      'section-3-heading-is-a-number-word',
      `§3 heading reads "The ${hm[1]} checks" — not a number word this check knows. ` +
        `Add it to WORDS rather than loosening the assertion.`
    );
  } else if (stated !== scripts.length) {
    fail(
      'section-3-heading-matches-disk',
      `§3 is headed "The ${hm[1]} checks" (${stated}) but ${scripts.length} scripts are on disk. ` +
        `This heading has been wrong before; the correction note is in the file.`
    );
  }

  // The rows of that table, counted between the §3 and §4 headings.
  const start = log.indexOf(hm[0]);
  const endMarker = log.indexOf('\n## 4.', start);
  const section = log.slice(start, endMarker === -1 ? undefined : endMarker);
  const rows = section
    .split('\n')
    .filter((l) => /^\|\s*(\*\*)?`(check|verify|simulate)-/.test(l)).length;

  if (rows !== scripts.length) {
    fail(
      'section-3-table-matches-disk',
      `the §3 table has ${rows} script rows, ${scripts.length} scripts are on disk. ` +
        `A check with no row is a check nobody can find out why exists.`
    );
  } else {
    notes.push(`§3 table: ${rows} rows, one per script on disk`);
  }
}

// ---- report ----------------------------------------------------------------

console.log('\nPetal & Pestle — version stamp check');
console.log('Does the version number say the same thing everywhere?\n');
console.log(`  buildStamp.VERSION      ${VERSION}`);
console.log(`  newest CHANGES entry    ${newest || '(none)'}`);
console.log(`  changelog entries       ${CHANGES.length}`);
console.log(`  scripts on disk         ${scripts.length}  (${checkScripts.length} check-*, ${simScripts.length} simulate-/verify-)`);
for (const n of notes) console.log(`  ${n}`);
console.log(
  '\n  NOT TESTED HERE: whether the version was bumped for this change, whether any\n' +
    '  date is right, or anything in the master plan — its section titles are history.\n'
);

if (failures.length === 0) {
  console.log('Every version claim agrees.\n');
  process.exit(0);
}

console.error(`FAILED — ${failures.length}\n`);
for (const f of failures) console.error(`  [${f.rule}] ${f.detail}`);
console.error('');
process.exit(1);
