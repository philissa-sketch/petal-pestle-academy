// ---------------------------------------------------------------------------
// CHECK — THE SKILL CATALOG.
//
// Run with: node scripts/check-skills.mjs
//
// ---- WHY THIS EXISTS ----
//
// §3.2: "Skills — not lessons — are what get mastered, reviewed, remediated and
// reported on." The catalog is the layer that makes that sentence true, and it
// is what Phase 2 tags 2,560 questions against.
//
// It was cut on Aug 23 2026 from 156 candidates derived off the `words:` lists
// — 1,024 entries, 801 unique — down to 20 committed, 3 held and 7 retired.
// A wrong entry here does not fail loudly. It produces a remediation set aimed
// at the wrong thing, months later, and nothing on any screen says so.
//
// ---- WHAT IT ASSERTS ----
//
//   1. Ids are present, unique, and lowercase kebab-case. Stored mastery rows
//      will point at these, so an id that drifts orphans her record.
//   2. Every skill is fully described — display name, known group, courses,
//      and at least one source term. A skill with no source term is a skill
//      nothing can ever tag to.
//   3. A source term belongs to EXACTLY ONE skill. Two skills claiming one word
//      makes tagging ambiguous, and the ambiguity would only ever surface as a
//      wrong remediation set.
//   4. A skill recurs. lessonCount is an integer >= 2, or null WITH a written
//      reason. An unexplained blank is how a number nobody can defend ends up
//      printed on a report to Georgia.
//   5. Strands are known, and no strand silently has zero skills behind it —
//      a score-targeted game drawing from nothing.
//   6. Held and retired terms are not also live. The failure this prevents:
//      a term is held pending a check, somebody adds it to the catalog, and
//      the check is never run.
//   7. skillForTerm() agrees with the table, and still rejects vocabulary.
//
// ---- WHAT IT DOES NOT ASSERT, so it never claims more than it tests ----
//
//   · It does NOT verify lessonCount against the lessons on disk. Nothing here
//     has read a lesson. Re-deriving the counts is Phase 2 and wants its own
//     check.
//   · It does NOT verify that a source term appears in any lesson's `words:`
//     list. Same reason.
//   · It does NOT adjudicate meaning. It cannot tell you whether `volume`
//     means millilitres or loudness. Only reading the lesson does that, which
//     is exactly why three terms are HELD rather than guessed in.
//
// Every rule below FAILS. None warn. A rule that has to be acted on is a check.
// ---------------------------------------------------------------------------

import {
  SKILLS,
  EXCLUDED_PENDING,
  RETIRED,
  GROUPS,
  STRANDS,
  CATALOG_VERSION,
  FROZEN_ON,
  skillForTerm
} from '../src/data/skillsCatalog.js';

const failures = [];
const fail = (rule, detail) => failures.push({ rule, detail });

// ---- 0. shape --------------------------------------------------------------

if (!Array.isArray(SKILLS) || SKILLS.length === 0) {
  fail('catalog-exists', 'SKILLS is missing or empty');
}
if (!Number.isInteger(CATALOG_VERSION)) {
  fail('version-is-integer', `CATALOG_VERSION is ${CATALOG_VERSION}`);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(String(FROZEN_ON))) {
  fail('frozen-on-is-a-date', `FROZEN_ON is ${FROZEN_ON}`);
}

// ---- 1. ids ----------------------------------------------------------------

const seenIds = new Set();
for (const s of SKILLS) {
  if (!s.id) {
    fail('id-present', `a skill named "${s.displayName}" has no id`);
    continue;
  }
  if (seenIds.has(s.id)) fail('id-unique', `duplicate id "${s.id}"`);
  seenIds.add(s.id);
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(s.id)) {
    fail('id-kebab-case', `"${s.id}" is not lowercase kebab-case`);
  }
}

// ---- 2. every skill is fully described -------------------------------------

for (const s of SKILLS) {
  if (!s.displayName) fail('has-display-name', `${s.id}`);
  if (!s.group) {
    fail('has-group', `${s.id}`);
  } else if (!Object.keys(GROUPS).includes(s.group)) {
    fail('group-is-known', `${s.id} has group "${s.group}"`);
  }
  if (!Array.isArray(s.sourceTerms) || s.sourceTerms.length === 0) {
    fail('has-source-terms', `${s.id} — with no source terms nothing can tag to it`);
  }
  if (!Array.isArray(s.courses) || s.courses.length === 0) {
    fail('has-courses', `${s.id}`);
  }
}

// ---- 3. a source term belongs to exactly one skill -------------------------

const termOwner = new Map();
for (const s of SKILLS) {
  for (const raw of s.sourceTerms || []) {
    const t = String(raw).trim().toLowerCase();
    if (t !== raw) {
      fail('source-term-normalised', `${s.id} has "${raw}" — stray case or padding`);
    }
    if (termOwner.has(t)) {
      fail(
        'source-term-owned-once',
        `"${t}" is claimed by both ${termOwner.get(t)} and ${s.id}`
      );
    }
    termOwner.set(t, s.id);
  }
}

// ---- 4. a skill recurs. that is the whole definition -----------------------

for (const s of SKILLS) {
  if (s.lessonCount === null || s.lessonCount === undefined) {
    if (!s.countPendingReason) {
      fail(
        'null-count-has-reason',
        `${s.id} has no lessonCount and no countPendingReason to explain it`
      );
    }
    continue;
  }
  if (!Number.isInteger(s.lessonCount)) {
    fail('count-is-integer', `${s.id} has lessonCount ${s.lessonCount}`);
  } else if (s.lessonCount < 2) {
    fail(
      'skill-recurs',
      `${s.id} sits on ${s.lessonCount} lesson(s). A skill is a thing that recurs.`
    );
  }
}

// ---- 5. strands ------------------------------------------------------------

for (const s of SKILLS) {
  if (s.strand !== null && s.strand !== undefined && !STRANDS.includes(s.strand)) {
    fail('strand-is-known', `${s.id} has strand "${s.strand}"`);
  }
}
for (const strand of STRANDS) {
  const n = SKILLS.filter((s) => s.strand === strand).length;
  if (n === 0) {
    fail(
      'strand-has-a-skill',
      `no skill bridges to "${strand}" — a score-targeted game for it would silently ` +
        `have nothing to draw from`
    );
  }
}

// ---- 6. held and retired terms are not also live ---------------------------

const liveTerms = new Set(termOwner.keys());

for (const h of EXCLUDED_PENDING || []) {
  const t = String(h.term).trim().toLowerCase();
  if (liveTerms.has(t)) {
    fail(
      'held-term-not-live',
      `"${t}" is in EXCLUDED_PENDING but is also a live source term on ${termOwner.get(t)}. ` +
        `Run its check and remove it from the held list, or take it back out of the catalog.`
    );
  }
  if (!h.checkToRun) fail('held-term-has-a-check', `"${t}" is held with no check written down`);
  if (!h.risk) fail('held-term-has-a-risk', `"${t}" is held with no reason written down`);
}

for (const r of RETIRED || []) {
  const t = String(r.term).trim().toLowerCase();
  if (!r.reason) {
    fail('retired-has-reason', `"${t}" was retired with no reason`);
  }
  if (t.startsWith('__')) continue; // a bulk category, not a single term
  if (liveTerms.has(t)) {
    fail(
      'retired-term-not-live',
      `"${t}" is RETIRED but is also a live source term on ${termOwner.get(t)}`
    );
  }
}

// ---- 7. the lookup agrees with the table -----------------------------------

if (typeof skillForTerm === 'function') {
  for (const [term, owner] of termOwner) {
    if (skillForTerm(term) !== owner) {
      fail('lookup-agrees', `skillForTerm("${term}") is not "${owner}"`);
    }
  }
  if (skillForTerm('pollen') !== null) {
    fail(
      'lookup-rejects-vocabulary',
      'skillForTerm("pollen") should be null — a word taught once is vocabulary, not a skill'
    );
  }
}

// ---- report ----------------------------------------------------------------

const byGroup = {};
for (const s of SKILLS) (byGroup[s.group] ||= []).push(s);

console.log('\nPetal & Pestle — skill catalog check');
console.log(`Catalog v${CATALOG_VERSION}, frozen ${FROZEN_ON}\n`);

console.table(
  Object.entries(byGroup).map(([group, list]) => ({
    group,
    label: GROUPS[group] || '(unknown)',
    skills: list.length,
    'source terms': list.reduce((n, s) => n + (s.sourceTerms || []).length, 0),
    'counts pending': list.filter((s) => s.lessonCount == null).length
  }))
);

console.log(`  ${SKILLS.length} skills · ${termOwner.size} source terms`);
console.log(
  `  ${(EXCLUDED_PENDING || []).length} held pending a check · ` +
    `${(RETIRED || []).length} retired with a reason`
);
for (const strand of STRANDS) {
  const list = SKILLS.filter((s) => s.strand === strand);
  console.log(`  ${strand}: ${list.length} skill(s) — ${list.map((s) => s.id).join(', ')}`);
}
if ((EXCLUDED_PENDING || []).length) {
  console.log('\n  HELD, waiting on Gigi to read the carrying lessons:');
  for (const h of EXCLUDED_PENDING) console.log(`    ${h.term} — ${h.checkToRun}`);
}
console.log(
  '\n  NOT TESTED HERE: lesson counts against disk, whether a source term appears in\n' +
    '  any lesson, or what any term MEANS. Phase 2, and the three held terms.\n'
);

if (failures.length === 0) {
  console.log('The catalog is internally consistent.\n');
  process.exit(0);
}

console.error(`FAILED — ${failures.length}\n`);
for (const f of failures) console.error(`  [${f.rule}] ${f.detail}`);
console.error('');
process.exit(1);
