// ---------------------------------------------------------------------------
// Run with: node scripts/check-import.mjs
//
// WHY THIS EXISTS.
//
// The app is built on one computer and used on another, so a backup taken on
// hers has to be loadable on this one. That is a merge, and a merge is the one
// operation in this app that can quietly destroy something irreplaceable — her
// journal, her answers, the notes her grandmother wrote her.
//
// The specific hazard is not hypothetical. `answers` and `sittings` are keyed
// by an AUTO-INCREMENT id. Both computers start at 1. Her answer #12 and a
// different answer #12 are not the same event, and any merge that trusts that
// id treats them as one row and loses one — silently, with no error, and the
// loss only becomes visible weeks later when a count looks wrong.
//
// So this script builds exactly that collision and proves the rules survive it.
//
// It runs against SYNTHETIC data rather than a real backup, deliberately: the
// check has to work on any machine, forever, including long after any
// particular child's file has been moved or deleted.
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const {
  answerKey, sittingKey, pickStrand, pickJournal, pickMessage, mergeScheduleDay, newRows,
  pickProject
} =
  await import(pathToFileURL(resolve(ROOT, 'src/lib/mergeBackup.js')).href);

const errors = [];
const notes = [];

/* -------------------------------------------------------------------------
 * 1. THE COLLISION. Two machines, both numbering from 1, different answers.
 * ---------------------------------------------------------------------- */
{
  const hers = [
    { id: 1, itemId: 'ge-sides-v0', at: 1786627606643, correct: false },
    { id: 2, itemId: 'ge-perim-v1', at: 1786633921181, correct: false },
    { id: 3, itemId: 'fd-compare-v0', at: 1786633839906, correct: true }
  ];
  const mine = [
    { id: 1, itemId: 'no-mult1-v0', at: 1786700000000, correct: true },
    { id: 2, itemId: 'vo-03', at: 1786700111111, correct: true }
  ];

  const fresh = newRows(mine, hers, answerKey);
  if (fresh.length !== 3) {
    errors.push(
      `answers: expected all 3 of hers to be new despite ids 1-3 already existing here, got ${fresh.length}. ` +
        `The merge is keying on the auto-increment id and is losing answers.`
    );
  } else {
    notes.push('3 answers with colliding ids (1,2,3) all survive the merge');
  }

  // And the reverse: the SAME answer must not be added twice.
  const again = newRows([...mine, ...fresh], hers, answerKey);
  if (again.length !== 0) {
    errors.push(`answers: re-importing the same file added ${again.length} duplicate(s)`);
  } else {
    notes.push('importing the same file twice adds nothing the second time');
  }
}

/* -------------------------------------------------------------------------
 * 2. Sittings — same hazard, different key.
 * ---------------------------------------------------------------------- */
{
  const hers = [{ id: 1, startedAt: 1786626439106 }, { id: 2, startedAt: 1786632626120 }];
  const mine = [{ id: 1, startedAt: 1786700000000 }];
  const fresh = newRows(mine, hers, sittingKey);
  if (fresh.length !== 2) errors.push(`sittings: expected 2 new, got ${fresh.length}`);
  else notes.push('2 sittings with colliding ids both survive');
}

/* -------------------------------------------------------------------------
 * 3. Strand results — the side that actually sat the test wins.
 * ---------------------------------------------------------------------- */
{
  const untouched = { strandId: 'geometry', asked: 0, level: 3.5 };
  const real = { strandId: 'geometry', asked: 8, level: 2.0 };
  if (pickStrand(untouched, real) !== real) {
    errors.push('strands: a real 8-question result lost to an untouched one');
  }
  if (pickStrand(real, untouched) !== real) {
    errors.push('strands: an untouched result overwrote a real one — her test would be erased');
  }
  if (pickStrand(null, real) !== real) errors.push('strands: nothing local, incoming should be taken');
  notes.push('strand results: whichever machine answered more is kept, in both directions');
}

/* -------------------------------------------------------------------------
 * 4. Journal — her writing. The newer edit wins; nothing is ever dropped.
 * ---------------------------------------------------------------------- */
{
  const older = { entryId: 'j1', text: 'first go', at: '2026-08-13T09:00:00Z' };
  const newer = { entryId: 'j1', text: 'she fixed it', at: '2026-08-13T09:00:00Z', editedAt: '2026-08-13T11:00:00Z' };
  if (pickJournal(older, newer) !== newer) errors.push('journal: the newer edit lost');
  if (pickJournal(newer, older) !== newer) errors.push('journal: an older copy overwrote a newer edit');
  if (pickJournal(null, older) !== older) errors.push('journal: a new entry was not taken');
  notes.push('journal: the most recent edit is kept whichever side it arrives from');
}

/* -------------------------------------------------------------------------
 * 5. Messages — read must never go back to unread.
 * ---------------------------------------------------------------------- */
{
  const unread = { messageId: 'm1', text: 'proud of you', readAt: null };
  const read = { messageId: 'm1', text: 'proud of you', readAt: '2026-08-13T10:00:00Z' };
  if (pickMessage(unread, read).readAt !== read.readAt) {
    errors.push('messages: a note she had read went back to looking new');
  }
  if (pickMessage(read, unread).readAt !== read.readAt) {
    errors.push('messages: a stale unread copy erased the fact she had read it');
  }
  notes.push('messages: once read, always read');
}

/* -------------------------------------------------------------------------
 * 6. Attendance — union, not replacement.
 * ---------------------------------------------------------------------- */
{
  const a = { dayKey: '2026-08-13', done: { 'blk-math': 't1' } };
  const b = { dayKey: '2026-08-13', done: { 'blk-reading': 't2' } };
  const m = mergeScheduleDay(a, b);
  if (Object.keys(m.done).length !== 2) {
    errors.push('attendance: merging two days lost a ticked block');
  } else {
    notes.push('attendance: blocks ticked on either machine are both kept');
  }
}

// ---------------------------------------------------------------------------
// A NEW NOTE HAS TO ACTUALLY ARRIVE
//
// Gigi: "When I wrote her a message on my computer and sent the export, when she
// import it, the message didn't show up."
//
// This check claimed to prove that notes survive a merge. It did not. It tested
// ONE thing about messages — that a note she had already read does not go back
// to looking unread — and never once tested that a brand-new note reaches the
// other machine at all. It passed the whole time.
//
// That is the worse half of the bug: a check that covers a narrow corner of a
// feature while reading, from its own output line, as though it covers the
// feature.
// ---------------------------------------------------------------------------
{
  const fresh = { messageId: 'm-new', from: 'gigi', text: 'proud of you', at: '2026-08-16T09:00:00Z', readAt: null };

  // Onto a machine that has never seen it.
  if (pickMessage(undefined, fresh) !== fresh) {
    errors.push('messages: a brand-new note did not survive a merge onto a machine that lacked it');
  }
  // Onto a machine that has other notes but not this one.
  const others = [{ messageId: 'm-old', text: 'earlier', readAt: null }];
  const arrived = newRows(others, [...others, fresh], (m) => m.messageId);
  if (!arrived.some((m) => m.messageId === 'm-new')) {
    errors.push('messages: a new note was not counted as new against a machine that already had others');
  }
  // And it must not be silently dropped when the local copy is null rather than
  // undefined — Dexie's get() returns undefined, but a merged payload can carry
  // an explicit null.
  if (pickMessage(null, fresh) !== fresh) {
    errors.push('messages: a new note was dropped when the local copy was null');
  }
  notes.push('messages: a brand-new note reaches a machine that has never seen it');
}

// ---------------------------------------------------------------------------
// PROJECTS SURVIVE A MERGE
// ---------------------------------------------------------------------------
{
  const done = { projectId: 'pj-m1', startedAt: '2026-09-01T00:00:00Z', doneAt: '2026-09-12T00:00:00Z' };
  const openRow = { projectId: 'pj-m1', startedAt: '2026-09-01T00:00:00Z', doneAt: null };

  if (pickProject(undefined, done) !== done) errors.push('projects: a finished project did not arrive on a fresh machine');
  if (pickProject(openRow, done).doneAt !== done.doneAt) {
    errors.push('projects: a finished project lost to an unfinished copy. Finishing must never be undone by a sync.');
  }
  if (pickProject(done, openRow).doneAt !== done.doneAt) {
    errors.push('projects: a stale unfinished copy erased a finished project');
  }
  const later = { ...done, doneAt: '2026-10-01T00:00:00Z' };
  if (pickProject(done, later).doneAt !== done.doneAt) {
    errors.push('projects: a later sync rewrote the date she actually finished');
  }
  notes.push('projects: finished beats unfinished, and the earlier finish keeps its date');
}

// ---------------------------------------------------------------------------
// SCHEMA → POLICY → EXPORT → IMPORT. THE WHOLE CHAIN, IN THAT ORDER.
//
// ---- WHAT THIS USED TO DO, AND WHY IT WAS HALF A CHECK ----
//
// The `projects` table shipped at v3.10 and was in NONE of exportAll,
// importBackup or previewImport for three versions. Sixteen fortnights of her
// work a year, thrown away the first time she changed machines, silently.
//
// The check written after that read the EXPORT and proved the IMPORT handled
// every key. Export → import. It was right, and it was pointed the wrong way
// round: a key that was never exported is a key it never looks for. A table
// added to db.version(8) and forgotten in exportAll passed it without a
// murmur — which is the projects bug again, approached from the side the check
// could not see. The header said "this one cannot be forgotten". The code
// forgot in one direction.
//
// BLUEPRINT_A_LOCAL_FIRST §3.9, rule 10, is the direction it was missing:
//
//   "Every table declared in the persistence schema must appear in the export
//    routine OR ON AN EXPLICIT EXCLUSION LIST WITH A WRITTEN REASON. Enforced
//    by a test that reads the schema and fails on any unlisted table."
//
// ---- THE CHAIN ----
//
//   stores({})            what the app actually keeps       ← the source of truth
//   EXPORT_TABLE_POLICY   a decision, written down, per table
//   exportAll()           what the backup file carries
//   importBackup()        what gets read back on the other machine
//
// Every link is asserted in BOTH directions, so nothing can be added at one end
// and quietly dropped at the other.
//
// ---- ONE RULE ABOUT THE PARSER ----
//
// This reads db.js as TEXT, which is brittle by nature. A parser that finds
// nothing must FAIL, never pass — a silent zero looks exactly like a clean bill
// of health. That is what the floors at the bottom of this block are for, and
// why they are numbers derived from the schema rather than typed in.
// ---------------------------------------------------------------------------
{
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(resolve(ROOT, 'src/db/db.js'), 'utf8');

  // ---- 1. THE SCHEMA. The LATEST version block, found rather than assumed. ----
  // Hard-coding db.version(7) here would break on the exact afternoon this
  // check exists for: the one where somebody writes db.version(8).
  const versionBlocks = [...src.matchAll(/db\.version\((\d+)\)\.stores\(\{([\s\S]*?)\}\)/g)].map(
    (m) => ({ v: Number(m[1]), body: m[2] })
  );
  const latest = versionBlocks.sort((a, b) => b.v - a.v)[0];

  if (!latest) {
    errors.push(
      'no db.version(n).stores({...}) block could be parsed out of src/db/db.js. The export ' +
        'guard has no source of truth to work from, so it is reporting nothing rather than green.'
    );
  }

  const schemaTables = latest
    ? [...latest.body.matchAll(/^\s*([a-zA-Z][a-zA-Z0-9]*)\s*:/gm)].map((m) => m[1])
    : [];

  // ---- 2. THE POLICY. Every table, decided, next to the schema. ----
  const policyBlock = (src.match(/export const EXPORT_TABLE_POLICY = \{([\s\S]*?)\n\};/) || [])[1];

  if (policyBlock === undefined) {
    errors.push(
      'EXPORT_TABLE_POLICY is missing from src/db/db.js. It is the list that says, per table, ' +
        'whether her work travels in a backup — without it a new table can be added and forgotten ' +
        'exactly the way projects was.'
    );
  }

  const policy = new Map(
    [...(policyBlock || '').matchAll(/^\s*([a-zA-Z][a-zA-Z0-9]*)\s*:\s*(true|'([^']*)')/gm)].map(
      (m) => [m[1], m[2] === 'true' ? true : m[3]]
    )
  );

  // ---- 3. THE PAYLOAD. What exportAll's return block actually ships. ----
  // Catches both shorthand (`strandStates,`) and named (`meta: safeMeta`) keys —
  // the old parser only saw shorthand, so `meta` was invisible to it.
  const exportBody = src.slice(src.indexOf('export async function exportAll'));
  const returnBlock = exportBody.slice(exportBody.indexOf('return {'), exportBody.indexOf('\n}'));
  const importBody = src.slice(
    src.indexOf('export async function importBackup'),
    src.indexOf('export async function exportAll')
  );

  const ENVELOPE = new Set(['app', 'version']); // not tables — the file's own header
  const shipped = [
    ...returnBlock.matchAll(/^\s{4}([a-zA-Z][a-zA-Z0-9]*)\s*(?::\s*[^,\n]+)?,?\s*$/gm)
  ]
    .map((m) => m[1])
    .filter((k) => !ENVELOPE.has(k));

  const shippedSet = new Set(shipped);

  // ---- A. Every table in the schema has been DECIDED about. ----
  for (const t of schemaTables) {
    if (!policy.has(t)) {
      errors.push(
        `db.version(${latest.v}) declares the table "${t}" and EXPORT_TABLE_POLICY says nothing ` +
          `about it. Add it to the policy as true, or as a sentence saying why her work in it does ` +
          `not need to survive a change of laptop. This is the projects bug, caught before it lands.`
      );
    }
  }

  // ---- B. The policy holds no ghosts. ----
  for (const t of policy.keys()) {
    if (!schemaTables.includes(t)) {
      errors.push(
        `EXPORT_TABLE_POLICY names "${t}" and db.version(${latest.v}) has no such table. A stale ` +
          `policy entry is a decision about something that no longer exists, and it makes the list ` +
          `look more complete than it is.`
      );
    }
  }

  // ---- C. Declared to travel, and it actually does. ----
  for (const [t, decision] of policy) {
    if (decision === true && !shippedSet.has(t)) {
      errors.push(
        `EXPORT_TABLE_POLICY says "${t}" travels in the backup and exportAll never puts it in the ` +
          `file. That is the whole failure this check exists for: the decision was made and the ` +
          `code does not honour it.`
      );
    }
  }

  // ---- D. Declared NOT to travel, and it stays out. ----
  for (const t of shipped) {
    const decision = policy.get(t);
    if (typeof decision === 'string') {
      errors.push(
        `exportAll ships "${t}" but EXPORT_TABLE_POLICY excludes it — "${decision}". Either the ` +
          `reason is out of date or the export is leaking something that was deliberately kept out.`
      );
    }
  }

  // ---- E. Everything in the file is read back on the other machine. ----
  //         The original assertion. Kept, unchanged in meaning.
  //         Matched on a word boundary rather than with .includes(). A plain
  //         substring test passes on `data.writingMarksXX`, because the old name
  //         is still inside the new one — found while negative-testing this
  //         block, when the mutation that was supposed to break it did not.
  for (const key of shipped) {
    if (!new RegExp(`data\\.${key}\\b`).test(importBody)) {
      errors.push(
        `exportAll ships "${key}" but importBackup never reads data.${key}. Anything in the backup ` +
          `that the import ignores is data she loses the first time she changes machines.`
      );
    }
  }

  // ---- F. An exclusion must be arguable a year from now. ----
  const PLACEHOLDER = /^(n\/?a|tbd|todo|none|no|-+|\.*)$/i;
  for (const [t, decision] of policy) {
    if (typeof decision !== 'string') continue;
    if (decision.trim().length < 20 || PLACEHOLDER.test(decision.trim())) {
      errors.push(
        `EXPORT_TABLE_POLICY excludes "${t}" with the reason "${decision}", which is not a reason ` +
          `anyone can disagree with later. An exclusion that cannot be argued with is a hole with a ` +
          `lid on it. Write the sentence.`
      );
    }
  }

  // ---- G. The passcode is stripped, and the stripped copy is the one shipped. ----
  //         Nothing tested this until v3.56. Delete one .filter() and the
  //         household passcode rides along in every backup file she hands
  //         anyone, and every other check stays green.
  //         Asserted by NAME-FOLLOWING, not by looking for the word: at v3.39 an
  //         assertion in this project was satisfied by a parameter name.
  //         The window is [\s\S]{0,120}? and NOT [^)]* — the predicate itself
  //         contains parentheses, `meta.filter((m) => ...)`, so a no-paren scan
  //         stops at the arrow argument and reports the strip as missing. That
  //         mistake was made writing this block and caught by running it.
  let passcodeStripped = false;
  const strip = exportBody.match(/const\s+([a-zA-Z][a-zA-Z0-9]*)\s*=\s*meta\.filter\([\s\S]{0,120}?parentPasscode/);
  if (!strip) {
    errors.push(
      'exportAll no longer strips parentPasscode out of meta. The household passcode would ride ' +
        'along in every backup file, and it is the one thing in this database that is not hers to share.'
    );
  } else if (!new RegExp(`^\\s{4}meta:\\s*${strip[1]}\\s*,?\\s*$`, 'm').test(returnBlock)) {
    errors.push(
      `exportAll computes a passcode-stripped copy of meta as "${strip[1]}" and then ships something ` +
        `else under the meta key. The filter runs and its result is thrown away, which is worse than ` +
        `not having it — it reads as protection and is not.`
    );
  } else {
    passcodeStripped = true;
  }

  // ---- H. The file must not lie about its own version, and the reader must look. ----
  //
  // ⚠️ THIS ASSERTION BROKE ITSELF AT v3.56 AND SAID NOTHING. It parsed a
  // literal out of `version: 7`. The moment that literal became the constant
  // `version: BACKUP_VERSION` — the fix that stops the two numbers drifting —
  // the regex matched nothing, `declared` came back undefined, and the whole
  // assertion was skipped. Green, on a change it was written to supervise.
  //
  // That is the third time in one version. An assertion that can be switched
  // off by an improvement is not a check; it is a tripwire pointing the wrong
  // way. It now follows the constant.
  const declaredConst = (src.match(/export const BACKUP_VERSION = (\d+)/) || [])[1];
  if (declaredConst === undefined) {
    errors.push(
      'BACKUP_VERSION is missing from db.js. It is the one number that says which app wrote a ' +
        'backup, and the version gate in previewImport has nothing to compare against without it.'
    );
  } else if (latest && Number(declaredConst) !== latest.v) {
    errors.push(
      `BACKUP_VERSION is ${declaredConst} and the schema is at db.version(${latest.v}). An export ` +
        `that calls itself v${declaredConst} while carrying v${latest.v} data is a file that lies ` +
        `about itself, and the machine reading it has nothing else to go on.`
    );
  }
  if (!/^\s{4}version:\s*BACKUP_VERSION\s*,?\s*$/m.test(returnBlock)) {
    errors.push(
      'exportAll stamps a hand-typed version rather than BACKUP_VERSION. Two numbers that must ' +
        'agree, typed in two places, is how every count in this project has drifted.'
    );
  }

  // ---- I. THE READER MUST ACTUALLY LOOK AT IT. ----
  //
  // exportAll has stamped a version since v3.20 and the comment beside it said
  // why it mattered. previewImport gated on data.app alone for seven versions.
  // A stamp nobody reads is decoration.
  const previewBody = src.slice(src.indexOf('export async function previewImport'), src.indexOf('export async function importBackup'));
  if (!/data\.version/.test(previewBody)) {
    errors.push(
      'previewImport never reads data.version. Old-into-new is safe; NEW-INTO-OLD is not — a backup ' +
        'from a newer build would merge what this version recognises and drop the rest in silence, ' +
        'and the only sign would be a count looking wrong weeks later.'
    );
  }
  // Asserted on the COMPARISON, not on the word. The first version of this
  // looked for `BACKUP_VERSION` anywhere in previewImport — and the constant
  // also appears in the error message inside the very block being tested, so
  // swapping the comparison for a hand-typed 7 left the check green. That is
  // the same failure as the v3.39 assertion satisfied by a parameter name.
  if (!/>\s*BACKUP_VERSION/.test(previewBody)) {
    errors.push(
      'previewImport does not compare the incoming file against BACKUP_VERSION. A hand-typed ' +
        'number here is a second copy of the version, and the whole point of the constant is that ' +
        'there is only one.'
    );
  }

  // ---- J. THE PREVIEW MUST DESCRIBE EVERY TABLE THE IMPORT WILL MERGE. ----
  //
  // importBackup merged fifteen tables while previewImport described eleven.
  // Three of the four missing were her SCHOOL RECORD — projects, khanGrades,
  // writingMarks — merged on the strength of a summary that never named them.
  // A diffing import whose diff is incomplete is worse than none: it reads like
  // a full account of what is about to happen, and a grown-up presses the
  // button on the strength of it.
  // Asserted on what previewImport RETURNS, not on what it mentions. Reading a
  // table and then not reporting it is the same outcome for the person holding
  // the mouse, and a "does the name appear anywhere" test passes on it — both
  // negative tests written for the first version of this walked straight
  // through, because the table name still appeared on a neighbouring line.
  const previewReturn = previewBody.slice(previewBody.indexOf('return {'));
  const reported = new Set(
    [...previewReturn.matchAll(/^\s{4}([a-zA-Z][a-zA-Z0-9]*)\s*:/gm)].map((m) => m[1])
  );
  const merged = [...importBody.matchAll(/data\.([a-zA-Z][a-zA-Z0-9]*)/g)].map((m) => m[1]);
  const ENVELOPE_KEYS = new Set(['app', 'version', 'meta']);
  const ALIASES = { strandStates: 'strands' }; // reported under a friendlier name
  for (const t of new Set(merged)) {
    if (ENVELOPE_KEYS.has(t)) continue;
    if (!reported.has(ALIASES[t] || t)) {
      errors.push(
        `importBackup merges data.${t} and previewImport does not report it. The grown-up is shown a ` +
          `summary of what the button is about to do, and "${t}" is not in it — which is worse than ` +
          `no summary, because an incomplete one reads like a complete one.`
      );
    }
  }
  if (reported.size < 10) {
    errors.push(
      `only ${reported.size} keys were parsed out of previewImport's return block — the parser has ` +
        `drifted, and it would report nothing rather than green.`
    );
  } else {
    notes.push(
      `the import preview reports all ${reported.size} tables the merge will touch, including her ` +
        `projects, Khan grades and graded writing`
    );
  }

  // ---- FLOORS. A parser that finds nothing must fail, not pass. ----
  //      Both numbers are derived from the schema, never typed.
  if (latest && schemaTables.length < 8) {
    errors.push(
      `only ${schemaTables.length} tables were parsed out of db.version(${latest.v}) — the schema ` +
        `parser has drifted. Fix the parser rather than trusting it; a silent zero here looks exactly ` +
        `like a clean bill of health.`
    );
  }
  if (latest && shipped.length < schemaTables.length - policyExclusionCount(policy)) {
    errors.push(
      `the export ships ${shipped.length} tables and the policy expects ` +
        `${schemaTables.length - policyExclusionCount(policy)} — the payload parser has drifted.`
    );
  }

  if (latest && policyBlock !== undefined) {
    const excluded = [...policy].filter(([, d]) => typeof d === 'string');
    notes.push(
      `backup chain intact at db.version(${latest.v}): ${schemaTables.length} tables in the schema, ` +
        `${policy.size} decided in EXPORT_TABLE_POLICY, ${shipped.length} shipped by exportAll, ` +
        `all read back by importBackup` +
        (excluded.length
          ? ` · ${excluded.length} deliberately excluded: ${excluded.map(([t]) => t).join(', ')}`
          : ' · nothing is excluded')
    );
  }

  // A note may only be printed by an assertion that actually passed. The first
  // draft of this block printed "the passcode is stripped" from a bare `if
  // (policy parsed)`, while the assertion beside it was failing — a note that
  // says more than its assertion tested is the same class of lie as a check
  // that overstates, and this file has recorded that one before.
  if (passcodeStripped) {
    notes.push('the parent passcode is stripped from meta, and the stripped copy is what ships');
  }
}

/** How many tables the policy deliberately keeps out of the backup. */
function policyExclusionCount(policy) {
  return [...policy.values()].filter((d) => typeof d === 'string').length;
}

// ---------------------------------------------------------------------------
// KHAN GRADES MUST NEVER BE LOST ON A MERGE.
//
// Four subjects were taught by Khan and none of it reached the record — Gigi's
// §4.1. Now a grown-up types them in, and this is the one table in the app
// where "I typed it and it vanished" would send somebody back to a paper
// notebook and never bring them back.
//
// Nothing here is generated, so there is no clever reconciliation to do: two
// machines' entries are two different UUIDs and the record needs both. The only
// tie-break is a shared id, where the newer edit wins.
// ---------------------------------------------------------------------------
{
  const { pickKhanGrade } = await import(pathToFileURL(resolve(ROOT, 'src/lib/mergeBackup.js')).href);

  const a = { gradeId: 'g1', subject: 'math', unit: 'Intro to multiplication', percent: 80, at: '2026-09-01', editedAt: 100 };
  const b = { gradeId: 'g1', subject: 'math', unit: 'Intro to multiplication', percent: 95, at: '2026-09-01', editedAt: 200 };

  if (pickKhanGrade(null, b) !== b) errors.push('khan grades: an incoming grade did not arrive');
  if (pickKhanGrade(a, null) !== a) errors.push('khan grades: a local grade was dropped');
  if (pickKhanGrade(a, b).percent !== 95) errors.push('khan grades: the newer edit lost');
  if (pickKhanGrade(b, a).percent !== 95) errors.push('khan grades: an older copy overwrote a newer edit');

  // The property that actually matters: a union never shrinks.
  const local = [a, { gradeId: 'g2', percent: 50, editedAt: 1 }];
  const incoming = [b, { gradeId: 'g3', percent: 60, editedAt: 1 }];
  const merged = new Map(local.map((r) => [r.gradeId, r]));
  for (const r of incoming) merged.set(r.gradeId, pickKhanGrade(merged.get(r.gradeId), r));
  if (merged.size !== 3) {
    errors.push(
      `khan grades: merging two machines kept ${merged.size} of 3 — a typed grade vanished, ` +
        `which is the failure that sends a grown-up back to a paper notebook`
    );
  } else {
    notes.push('khan grades: two machines merge without losing one a grown-up typed');
  }
}

// ---------------------------------------------------------------------------
// A READING STILL BEING TAKEN MAY NOT BE OVERWRITTEN BY A FINISHED OLDER ONE.
//
// FOUND Aug 19, in her real data, and this is the check that would have caught
// it. pickStrand kept whichever side had the higher `asked`. A RE-MEASURE
// STARTS THE COUNT OVER, so while one is running the higher count belongs to
// the OLD reading and the rule hands the merge to the file that knows less.
//
// Her two real files on the day it was found — reproduced synthetically below,
// because this check must keep working long after any one child's file is gone:
//
//   geometry           Aug 13: asked 8, settled, 2.00 | Aug 18: asked 3, running, 2.70
//   measurement-data   Aug 13: asked 7, settled, 2.00 | Aug 18: asked 3, running, 2.70
//   writing-strategies Aug 13: asked 7, settled, 2.45 | Aug 18: asked 3, running, 2.70
//   grammar-usage      Aug 13: asked 7, settled, 2.15 | Aug 18: asked 4, running, 2.20
//
// All four would have reverted AND been re-flagged settled — which would also
// have let the goals engine set year targets on numbers just thrown away.
// Geometry and Measurement would have gone back to 2.00, the item-bank floor
// that was never a measurement of her.
// ---------------------------------------------------------------------------
{
  const { isInProgress } = await import(pathToFileURL(resolve(ROOT, 'src/lib/mergeBackup.js')).href);

  const running = { strandId: 'geometry', level: 2.7, asked: 3, settled: false };
  const finished = { strandId: 'geometry', level: 2.0, asked: 8, settled: true };

  if (pickStrand(running, finished) !== running) {
    errors.push(
      'a FINISHED older reading (asked 8, settled, 2.00) overwrote a re-measure still being taken ' +
        '(asked 3, running, 2.70). This is the Aug 19 bug: a re-measure restarts the count, so ' +
        '"more answers wins" hands the merge to the side that knows less.'
    );
  }
  if (pickStrand(finished, running) !== running) {
    errors.push(
      'the rule is not symmetric: a re-measure in progress must win whichever side of the merge ' +
        'it arrives on, or the same loss happens in the other direction.'
    );
  }

  // ---- THE HOLE INSIDE THE FIX. ----
  // "In progress" alone is not enough. A re-measure that has been STARTED and
  // not yet answered is an empty row, and an empty row beating a real
  // measurement would be this bug again with the sides swapped.
  const startedEmpty = { strandId: 'geometry', level: 0, asked: 0, settled: false };
  if (pickStrand(startedEmpty, finished) !== finished) {
    errors.push(
      'an EMPTY re-measure (asked 0) beat a real settled measurement. An unanswered row is not ' +
        'evidence, and treating it as evidence throws away the only reading anyone actually took.'
    );
  }
  if (isInProgress(startedEmpty)) {
    errors.push('isInProgress() called an unanswered row a measurement in progress.');
  }

  // ---- ⚠️ AND THE FIX ITSELF HAD TO BE FIXED, TWELVE HOURS LATER. ----
  //
  // Gigi, Aug 19 evening: "she worked today." Azianna FINISHED the re-measure on
  // her laptop — so the incoming reading is asked 12 and SETTLED, and the local
  // copy is still the half-done asked-3 stub. The morning's rule ("in progress
  // beats finished") then KEPT THE STUB AND DISCARDED THE COMPLETED
  // MEASUREMENT: the exact loss it was written to prevent, running backwards.
  //
  // "In progress" was only ever a proxy for "more recent". seenItemIds is the
  // real signal: a reading that has asked everything the other asked AND MORE
  // is not a rival, it is the same reading carried further.
  const stub = {
    strandId: 'geometry', level: 2.7, asked: 3, settled: false,
    seenItemIds: ['ge-area-v1', 'fo-nameshape-v2', 'fo-sameshape-v0']
  };
  const finishedToday = {
    strandId: 'geometry', level: 3.4, asked: 12, settled: true,
    seenItemIds: ['ge-area-v1', 'fo-nameshape-v2', 'fo-sameshape-v0', 'ge-sides-v1',
      'ge-perim-v0', 'ge-area-v0', 'fo-count-v1', 'ge-sides-v2', 'ge-perim-v1',
      'fo-shape-v3', 'ge-area-v3', 'ge-perim-v2']
  };
  if (pickStrand(stub, finishedToday) !== finishedToday) {
    errors.push(
      'a COMPLETED re-measure (asked 12, settled) lost to the half-finished local stub it grew ' +
        'out of (asked 3, running). Her laptop did the work and this machine kept the stub \u2014 ' +
        'which is the Aug 19 evening bug, and it throws away the measurement the whole re-measure ' +
        'was for.'
    );
  }
  if (pickStrand(finishedToday, stub) !== finishedToday) {
    errors.push('the continuation rule is not symmetric: the finished reading must win either way.');
  }
  // The old file shares NOT ONE item with the re-measure, so it is a different
  // reading and must still lose. Both rules have to hold at once.
  const oldSettled = {
    strandId: 'geometry', level: 2.0, asked: 8, settled: true,
    seenItemIds: ['ge-area-v2', 'ge-sides-v1', 'ge-sides-v0', 'ge-sides-v2',
      'ge-perim-v2', 'ge-perim-v0', 'ge-perim-v1', 'ge-area-v0']
  };
  if (pickStrand(stub, oldSettled) !== stub) {
    errors.push(
      'the Aug 13 file beat the in-progress re-measure again. Fixing the evening bug must not ' +
        'undo the morning one \u2014 both directions have to hold at the same time.'
    );
  }
  // ---- THE EMPTY-seenItemIds GUARD, WITH A FIXTURE THAT ACTUALLY BITES. ----
  //
  // ⚠️ The first version of this assertion was worthless and its own negative
  // test said so: removing the guard left it GREEN, because the fixture was a
  // bare row with asked 1 losing to a 12-item reading — which is the right
  // answer with or without the guard.
  //
  // The harm only appears when the bare row holds MORE work: an empty
  // seenItemIds list is vacuously a subset of everything, so without the guard
  // a 2-question reading counts as a "continuation" of a 20-question one and
  // takes it. That is a real shape — any strand row written before seenItemIds
  // existed has no item history at all.
  const noHistory = { strandId: 'vocabulary', level: 3.5, asked: 20, settled: true };
  const tiny = {
    strandId: 'vocabulary', level: 1.4, asked: 2, settled: true,
    seenItemIds: ['vo-01', 'vo-02']
  };
  if (pickStrand(noHistory, tiny) !== noHistory) {
    errors.push(
      'a 2-question reading was treated as a CONTINUATION of a 20-question one, because the ' +
        'older row has no seenItemIds and an empty list is a subset of everything. Twenty ' +
        'questions of her work replaced by two.'
    );
  }

  // ---- AND THE ORIGINAL RULE MUST SURVIVE. ----
  // Everything above is a special case. When both sides are the same KIND of
  // reading, the count still decides — that rule was right and is not repealed.
  const settledLow = { strandId: 'vocabulary', level: 2.9, asked: 3, settled: true };
  const settledHigh = { strandId: 'vocabulary', level: 3.4, asked: 7, settled: true };
  if (pickStrand(settledLow, settledHigh) !== settledHigh) {
    errors.push('two settled readings: the side that answered more no longer wins.');
  }
  const runLow = { strandId: 'vocabulary', level: 2.9, asked: 2, settled: false };
  const runHigh = { strandId: 'vocabulary', level: 3.4, asked: 6, settled: false };
  if (pickStrand(runLow, runHigh) !== runHigh) {
    errors.push('two re-measures in progress: the side that answered more no longer wins.');
  }
  if (pickStrand(null, finished) !== finished || pickStrand(finished, null) !== finished) {
    errors.push('a strand present on only one side was dropped.');
  }

  if (!errors.length) {
    notes.push(
      'a re-measure still being taken survives a merge with the finished older reading, and an ' +
        'unanswered row still loses to a real one'
    );
  }
}

// ---------------------------------------------------------------------------
// THE LOAD GUARD — CALLED, NOT GREPPED.
//
// §32.7: the green button "does not say how old its file is relative to her
// live data." Gigi's call, Aug 19: REFUSE THE BUTTON, WARN THE PICKER.
//
// importVerdict is a pure function for the reason v3.56 recorded — an assertion
// that greps a component for a substring was satisfied by the same string two
// lines further down in a different expression. So it is CALLED here with real
// preview shapes.
// ---------------------------------------------------------------------------
{
  const { importVerdict } = await import(pathToFileURL(resolve(ROOT, 'src/lib/importGuard.js')).href);

  const AUG13 = Date.parse('2026-08-13T12:00:00Z');
  const AUG18 = Date.parse('2026-08-18T12:00:00Z');

  // ⚠️ `answers.new` and `freshness.newAnswers` are THE SAME NUMBER in a real
  // preview — previewImport computes it once and uses it in both places. The
  // first version of this fixture set only the second, and when staleness moved
  // from "no new answers" to "adds no rows at all" it started describing a file
  // that cannot exist: 14 new answers, and no new rows. A fixture that could
  // never happen tests nothing and fails for the wrong reason.
  const base = (over = {}) => {
    const n = over.freshness?.newAnswers ?? 0;
    return {
      strands: { incoming: 9, willReplace: 0, protectedInProgress: [], ...(over.strands || {}) },
      answers: { incoming: 74, new: n, ...(over.answers || {}) },
      messages: { incoming: 2, new: 0, ...(over.messages || {}) },
      freshness: { newestInFile: AUG13, newestHere: AUG18, newAnswers: 0, ...(over.freshness || {}) }
    };
  };

  // 1. The exact file that was sitting behind the green button on Aug 18.
  const stale = importVerdict(base());
  if (!stale.blocked) {
    errors.push(
      'the load guard did not block a file that is older than the work already here and brings ' +
        'no answers this computer has not got. That is the file the green button was offering.'
    );
  }

  // 2. Older, but it carries work this machine has never seen. MUST NOT block —
  //    a date alone is not a reason to refuse a file with new answers in it.
  const olderButUseful = importVerdict(base({ freshness: { newAnswers: 14 } }));
  if (olderButUseful.blocked) {
    errors.push(
      'the load guard blocked an older file that holds 14 answers this computer has never seen. ' +
        'Refusing that loses real work, which is the opposite of what the guard is for.'
    );
  }

  // 3. A newer file off her laptop — the ordinary Monday case. Must sail through.
  const newer = importVerdict(
    base({ freshness: { newestInFile: AUG18, newestHere: AUG13, newAnswers: 22 } })
  );
  if (newer.blocked || newer.headline) {
    errors.push('the load guard warned about a NEWER file. The ordinary case must be silent.');
  }

  // 4. A fresh machine has no work to be older than. An Aug 13 file is not
  //    stale there — it is everything she has.
  const emptyMachine = importVerdict(
    base({ freshness: { newestHere: 0, newAnswers: 61 } })
  );
  if (emptyMachine.blocked) {
    errors.push('the load guard blocked the only file a brand-new machine had.');
  }

  // 5. The re-measure case, named rather than counted.
  const protects = importVerdict(
    base({
      strands: {
        protectedInProgress: [
          { strandId: 'geometry', keptLevel: 2.7, keptAsked: 3, fileLevel: 2.0, fileAsked: 8 }
        ]
      },
      freshness: { newAnswers: 5 }
    })
  );
  if (!protects.blocked) {
    errors.push(
      'a file holding the finished older reading for a strand mid-re-measure was not blocked, ' +
        'even though it brings new answers. This is the case Gigi asked to refuse.'
    );
  }
  if (!protects.reason.includes('geometry')) {
    errors.push(
      'the guard blocked without naming the strand. "3 strand results replaced" and "geometry ' +
        'went back to 2.00" are not the same sentence to the person holding the mouse.'
    );
  }

  if (!stale.reason || !protects.headline) {
    errors.push('the guard blocked a file without saying what it was or why.');
  }

  // ---- ⚠️ TWO-WAY: A FILE CARRYING ONLY A NOTE MUST NOT BE CALLED STALE. ----
  //
  // Gigi, Aug 19: "I left a message on her journals. Where would she see them?"
  // Nowhere — and the reason was this guard. A file she exports from HER machine
  // to send Azianna a note is, from the laptop's side, older AND brings no new
  // ANSWERS. The staleness test counted answers only, so the note was refused
  // inside the file that was carrying it.
  const noteOnly = importVerdict({
    strands: { incoming: 9, willReplace: 0, protectedInProgress: [] },
    answers: { incoming: 74, new: 0 },
    messages: { incoming: 2, new: 1 },
    journal: { incoming: 2, new: 0 },
    freshness: { newestInFile: AUG13, newestHere: AUG18, newAnswers: 0 }
  });
  if (noteOnly.blocked) {
    errors.push(
      'a backup carrying ONE new note and no new answers was refused as stale. That is the only ' +
        'way a note reaches her laptop, and the guard was eating it.'
    );
  }
  // Same shape, but it genuinely adds nothing at all — that one IS stale.
  const trulyEmpty = importVerdict({
    strands: { incoming: 9, willReplace: 0, protectedInProgress: [] },
    answers: { incoming: 74, new: 0 },
    messages: { incoming: 2, new: 0 },
    journal: { incoming: 2, new: 0 },
    freshness: { newestInFile: AUG13, newestHere: AUG18, newAnswers: 0 }
  });
  if (!trulyEmpty.blocked) {
    errors.push('a file that adds nothing at all is no longer refused — the guard has been widened too far.');
  }
  // And the count must walk EVERY table, not a named few, or a table added
  // tomorrow silently stops counting.
  const { countNewRows } = await import(pathToFileURL(resolve(ROOT, 'src/lib/importGuard.js')).href);
  const walked = countNewRows({
    answers: { incoming: 1, new: 2 }, journal: { incoming: 1, new: 3 },
    projects: { incoming: 1, new: 5 }, strands: { incoming: 9, willReplace: 4 },
    freshness: { newAnswers: 99 }
  });
  if (walked !== 14) {
    errors.push(
      `countNewRows walked the preview and got ${walked}, expected 14 (2+3+5 rows + 4 strand ` +
        `replacements). It is not counting every table the preview reports.`
    );
  }

  notes.push('two-way: a backup carrying only a note reaches her, and one carrying nothing does not');
  notes.push('the load guard is called on five real preview shapes, not grepped for');
}

// ---------------------------------------------------------------------------
// AND THE SCREEN HAS TO ACTUALLY SHOW IT.
//
// Rule 21, learned three versions running: A CHECK ON A SCREEN ASKS WHAT
// RENDERS — a JSX tag, a rendered expression — NEVER WHAT THE FILE MENTIONS.
// Every assertion below matches a `{...}` interpolation or an attribute, so
// importing the guard and never rendering it fails here.
// ---------------------------------------------------------------------------
{
  const { readFileSync } = await import('node:fs');
  const dash = readFileSync(resolve(ROOT, 'src/components/Parent/ParentDashboard.jsx'), 'utf8');

  const renders = [
    [/\{refusal\.headline\}/, 'the refusal panel never renders the reason the file was refused'],
    [/\{refusal\.reason\}/, 'the refusal panel never renders the explanation'],
    [/\{verdict\.reason\}/, 'the picker warning never renders the explanation'],
    [/\{verdict\.confirmLabel\}/, 'the confirm control never renders what is being agreed to'],
    [
      /refusal\.protectedStrands\.map/,
      'the refused panel never lists the strands it was protecting'
    ]
  ];
  for (const [re, why] of renders) {
    if (!re.test(dash)) errors.push(`load guard: ${why}.`);
  }

  // The button that applies the merge must be gated on her agreement.
  if (!/disabled=\{busy \|\| \(verdict\?\.blocked && !agreed\)\}/.test(dash)) {
    errors.push(
      'the "Load it in" button is not gated on the confirmation. A warning nobody has to answer ' +
        'is decoration, and this project has shipped a decorative gate before.'
    );
  }

  // The green button must REFUSE rather than preview. Following the name: the
  // early return has to be there, not just the word "blocked".
  if (!/if \(v\.blocked\) \{[\s\S]{0,200}?return;/.test(dash)) {
    errors.push(
      'loadDropped computes a verdict and carries on regardless. Gigi chose: the green button ' +
        'refuses. A verdict that never stops anything is a comment.'
    );
  }

  // §32.7's actual complaint: the word she searched for was not on the screen.
  if (!/⬇ Export \/ download backup/.test(dash)) {
    errors.push(
      'the button that MAKES the backup does not say "export". That is the §32.7 finding — six ' +
        'exchanges to locate a control, because the panel that makes the file and the panel that ' +
        'reads one used different words for it.'
    );
  }

  notes.push('the refusal, the warning and the confirm gate all render, and the export button says export');
}

console.log('\nPetal & Pestle — backup merge check\n');
for (const n of notes) console.log(`  · ${n}`);


if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log('\nTwo machines can be merged without losing an answer, an entry or a note.\n');
