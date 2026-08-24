// ---------------------------------------------------------------------------
// Local persistence. Dexie over IndexedDB, exactly as Mission Control does it,
// so the same computer runs both apps with no server and no account.
//
// SEPARATE DATABASE NAME, DELIBERATELY. Mission Control's database is called
// 'MissionControlDB'. This one is 'PetalPestleDB'. Two databases on one
// browser profile never see each other, which is the entire safety story for
// running a sibling's app on the same machine: there is no shared table for
// one app to write into by accident.
//
// EVERY ANSWER IS STORED, not just the score. The Grown-Up Corner's history is
// built from the `answers` table, so what a parent reads is what happened,
// question by question — not a summary the app computed and then lost the
// working for.
// ---------------------------------------------------------------------------

import Dexie from 'dexie';
import {
  answerKey,
  sittingKey,
  pickStrand,
  isInProgress,
  pickJournal,
  pickMessage,
  mergeScheduleDay,
  pickReviewItem,
  pickLessonRead,
  pickProject,
  pickKhanGrade,
  pickWritingMark,
  pickBaseline,
  pickItemEvent,
  pickGoal,
  pickJournalMark
} from '../lib/mergeBackup.js';

export const db = new Dexie('PetalPestleDB');

db.version(1).stores({
  // Single-row settings keyed by name: profile, parent passcode, streak data.
  meta: 'key',
  // One row per strand, keyed by strand id. Replaced wholesale after each answer.
  strandStates: 'strandId',
  // Append-only. Never updated, never deleted by the app.
  answers: '++id, itemId, strandId, at',
  // One row per sitting, so "how long did she work" is answerable.
  sittings: '++id, startedAt'
});

/**
 * v2 — the Petal & Golden Seed economy.
 *
 * `ledger` is keyed by entryId, NOT by an auto-increment. That is the whole
 * reason two computers can merge: entryId is a UUID, so combining two ledgers
 * is a union of two lists and cannot collide. An auto-increment would make her
 * entry #12 and a grown-up's entry #12 look like the same row and silently
 * destroy one of them.
 *
 * `requests` holds seed purchases waiting on a grown-up. Kept separate from the
 * ledger on purpose: a request is not money that has moved. Nothing leaves her
 * balance until it is approved, so a request that is declined or forgotten
 * costs her nothing.
 *
 * Dexie carries v1 data forward automatically — the two new tables simply start
 * empty, and every earned balance is derived from effort counters that already
 * exist. Nobody loses a Petal by upgrading, because no Petal was ever stored.
 */
db.version(2).stores({
  meta: 'key',
  strandStates: 'strandId',
  answers: '++id, itemId, strandId, at',
  sittings: '++id, startedAt',
  ledger: 'entryId, currency, at',
  requests: 'requestId, status, at'
});

/**
 * v3 — Phase 2: the Journal, Messages, and the Daily Schedule.
 *
 * `journal` is keyed by entryId (a UUID) for the same reason the ledger is: her
 * writing is the one thing in this app that cannot be regenerated. If she writes
 * on her laptop and on her grandmother's, merging the two must be a union of two
 * lists, and an auto-increment id would make her entry #4 and a different entry
 * #4 collide and silently destroy one of them. A lost maths answer is an
 * inconvenience; a lost page of her own writing is not.
 *
 * `messages` are keyed the same way and for the same reason — a note written on
 * one computer has to survive being merged with notes written on another.
 *
 * `scheduleDays` is keyed by the LOCAL date string, one row per day, holding
 * which blocks she ticked off. Keyed by day rather than appended per tick so
 * that un-ticking is possible: a nine-year-old who taps the wrong block needs to
 * be able to take it back without an apology from the software.
 *
 * The schedule TEMPLATE itself lives in meta, not here — it is a setting a
 * grown-up edits, not a record of something that happened.
 *
 * Dexie carries v1 and v2 data forward automatically; the three new tables start
 * empty.
 */
db.version(3).stores({
  meta: 'key',
  strandStates: 'strandId',
  answers: '++id, itemId, strandId, at',
  sittings: '++id, startedAt',
  ledger: 'entryId, currency, at',
  requests: 'requestId, status, at',
  journal: 'entryId, at, kind',
  messages: 'messageId, at, from, readAt',
  scheduleDays: 'dayKey'
});

/**
 * v4 — lessons read, tests taken, and the spaced-review boxes.
 *
 * `attempts` is keyed by attemptId, a UUID, for the reason the ledger and the
 * journal already are: this is a record of something that HAPPENED, and two
 * machines must be able to merge without one attempt destroying another. An
 * auto-increment id would make her unit-1 attempt on her laptop and a different
 * attempt on her grandmother's collide and silently lose one — and a test result
 * that vanishes is worse than one that was never recorded, because the gradebook
 * still looks complete.
 *
 * `reviewItems` is keyed by questionId. One row per question, holding which
 * Leitner box it is in and when it is next due. Merging two machines takes the
 * LOWER box and the EARLIER due date, which is the cautious direction: if one
 * computer says she has this cold and the other says she missed it yesterday,
 * the honest answer is that she missed it yesterday.
 *
 * `lessonReads` is keyed by lessonId — when she first opened a lesson and how
 * many times since. It is what unlocks a unit test, and it is why the app can
 * say "this test covers four lessons and she has read three".
 *
 * Dexie carries v1 to v3 forward automatically; the three new tables start
 * empty, which is exactly right — nobody has taken a test yet.
 */
db.version(4).stores({
  meta: 'key',
  strandStates: 'strandId',
  answers: '++id, itemId, strandId, at',
  sittings: '++id, startedAt',
  ledger: 'entryId, currency, at',
  requests: 'requestId, status, at',
  journal: 'entryId, at, kind',
  messages: 'messageId, at, from, readAt',
  scheduleDays: 'dayKey',
  attempts: 'attemptId, testId, dayKey, at',
  reviewItems: 'questionId, dueOn, box',
  lessonReads: 'lessonId, lastReadAt'
});

// Two failures that are otherwise completely silent, surfaced as window events
// the app listens for. Copied from Mission Control, where both were found the
// hard way: 'blocked' fires when the app is open in a second tab holding the
// old schema, 'versionchange' when another tab upgrades underneath this one.
/**
 * v5 — PROJECTS.
 *
 * One row per project she has started or finished. Written because there was
 * nowhere in the app for the fortnightly piece of work at all, and because
 * Friday needs something to ask "is this done yet".
 *
 * Dexie carries v1-v4 forward untouched; the new table starts empty, which is
 * correct — nobody has finished a project yet.
 */
db.version(5).stores({
  meta: 'key',
  strandStates: 'strandId',
  answers: '++id, itemId, strandId, at',
  sittings: '++id, startedAt',
  ledger: 'entryId, currency, at',
  requests: 'requestId, status, at',
  journal: 'entryId, at, kind',
  messages: 'messageId, at, from, readAt',
  scheduleDays: 'dayKey',
  attempts: 'attemptId, testId, dayKey, at',
  reviewItems: 'questionId, dueOn, box',
  lessonReads: 'lessonId, lastReadAt',
  projects: 'projectId, doneAt'
});

/**
 * v6 — Khan grades.
 *
 * Gigi, backlog §4.1: "No place to enter Khan Academy grades. Four of her
 * subjects are taught by Khan and none of that reaches the record. Without it
 * the report card is a quarter of her year."
 *
 * Keyed by `gradeId`, a UUID, for the same reason the ledger and the journal
 * are: two computers must be able to merge without her entry #7 and a
 * grown-up's entry #7 looking like the same row.
 *
 * NOTHING HERE IS EVER SHOWN TO HER AS A PERCENTAGE. The number is the record;
 * her screen gets a band, same rule as every other score in this app.
 */
db.version(6).stores({
  meta: 'key',
  strandStates: 'strandId',
  answers: '++id, itemId, strandId, at',
  sittings: '++id, startedAt',
  ledger: 'entryId, currency, at',
  requests: 'requestId, status, at',
  journal: 'entryId, at, kind',
  messages: 'messageId, at, from, readAt',
  scheduleDays: 'dayKey',
  attempts: 'attemptId, testId, dayKey, at',
  reviewItems: 'questionId, dueOn, box',
  lessonReads: 'lessonId, lastReadAt',
  projects: 'projectId, doneAt',
  khanGrades: 'gradeId, subject, at'
});

/**
 * v7 — MARKS ON HER GRADED WRITING.
 *
 * Gigi: "She needs help with grammar and writing and I wanted her journals to
 * assist with that."
 *
 * The Journal itself is never graded and never will be — that is locked, and a
 * check reads the screen as text to keep it locked. THIS TABLE IS THE OTHER
 * HALF: four book reports and two research papers a year, each marked against a
 * rubric she saw before she started.
 *
 * Keyed by `markId`, a UUID, for the same reason the Khan grades are: two
 * machines must be able to merge without one grown-up's entry and another's
 * looking like the same row.
 *
 * WHAT IS STORED IS THE MARKS, NOT THE PERCENTAGE. One integer 1-4 per rubric
 * row. The percent and the letter are computed from those by gradePiece(), so a
 * stored total can never quietly disagree with the rubric it came from — the
 * same rule as the v3.20 `exact` flag, which was computed from something other
 * than the thing it described.
 */
db.version(7).stores({
  meta: 'key',
  strandStates: 'strandId',
  answers: '++id, itemId, strandId, at',
  sittings: '++id, startedAt',
  ledger: 'entryId, currency, at',
  requests: 'requestId, status, at',
  journal: 'entryId, at, kind',
  messages: 'messageId, at, from, readAt',
  scheduleDays: 'dayKey',
  attempts: 'attemptId, testId, dayKey, at',
  reviewItems: 'questionId, dueOn, box',
  lessonReads: 'lessonId, lastReadAt',
  projects: 'projectId, doneAt',
  khanGrades: 'gradeId, subject, at',
  writingMarks: 'markId, pieceId, at'
});

/* ---------------------------------------------------------------------------
 * EXPORT_TABLE_POLICY — WHAT TRAVELS IN A BACKUP, AND WHAT DOES NOT.
 *
 * ---- WHY THIS SITS HERE, TOUCHING THE SCHEMA ----
 *
 * It lives directly beneath stores({}) on purpose. A table is added THERE, so
 * the decision about whether it belongs in her backup has to be made THERE, in
 * the same edit, by the same person, on the same afternoon. Put this list in
 * another file and it becomes a thing to remember. Nobody remembers.
 *
 * ---- WHAT WENT WRONG THE FIRST TIME ----
 *
 * `projects` shipped at v3.10 and was in NONE of exportAll, importBackup or
 * previewImport for three versions. Sixteen fortnights of her work a year — the
 * field guide, the weather station, the oral history with Gigi — thrown away
 * the first time she changed machines. Silently. No error.
 *
 * check-import caught that, from ONE side: it reads the export and proves the
 * import handles every key. That is export → import. A table added to
 * db.version(8) and forgotten in exportAll passes it without a murmur, because
 * a key that was never exported is a key the check never looks for.
 *
 * The standard (BLUEPRINT_A_LOCAL_FIRST §3.9, rule 10) asks for the direction
 * this file was missing:
 *
 *   "Every table declared in the persistence schema must appear in the export
 *    routine OR ON AN EXPLICIT EXCLUSION LIST WITH A WRITTEN REASON. Enforced
 *    by a test that reads the schema and fails on any unlisted table."
 *
 * ---- HOW TO WRITE AN ENTRY ----
 *
 *   true      this table travels in the backup.
 *   'reason'  it does not, and this is why — in a sentence a person can argue
 *             with a year from now. An exclusion nobody can argue with is a
 *             hole with a lid on it.
 *
 * TODAY EVERY TABLE TRAVELS. Fifteen `true`s look like a pointless list, and on
 * the day it was written it is one. It is not written for today. It is written
 * for the afternoon somebody adds a sixteenth table, and check-import stops
 * them until they have said out loud whether her work is in the backup or not.
 * ------------------------------------------------------------------------ */
/**
 * v8 — WHERE EVERY ANSWER CAME FROM, AND WHERE SHE STARTED.
 *
 * ---- itemEvents ----
 *
 * One row per answer, from EVERY surface, carrying `evidenceSource` (§3.4).
 *
 * The tests already kept their working — an attempt row holds every question,
 * what she picked and whether it was right, and has since v3.4. The audit said
 * otherwise and Batch A was sized on that; reading the code corrected it.
 *
 * THE WARM-UP IS THE ONE THAT KEPT NOTHING. Three questions every morning, 260
 * mornings a year, and the only trace was a Leitner box moving. Which question,
 * what she picked, whether she needed a second go — none of it was written
 * down anywhere. That is the single largest hole in her record and it is the
 * strongest evidence in the app, because a warm-up is spaced retrieval days
 * after the lesson and a lesson check is recognition ten minutes after it.
 *
 * Kept in its OWN table rather than added to `answers`, deliberately. `answers`
 * is the Check-In's table; the Grown-Up Corner's strand tables and the
 * read-aloud summary are computed straight off it. Pouring warm-up rows in
 * there would have changed every one of those numbers silently — which is
 * anti-pattern 15 wearing a different hat.
 *
 * Keyed by `eventId`, a UUID, for the reason the ledger and the journal are:
 * two machines must merge without her answer #12 and a different answer #12
 * destroying one another.
 *
 * ---- baselines ----
 *
 * One row per track, written ONCE, the first time she does anything in it.
 *
 * §3.4: "A baseline cannot be reconstructed after the fact… the data is free on
 * day one and impossible on day two hundred. Ship baseline capture before or
 * alongside the first learning-science change you intend to evaluate."
 *
 * Every change made today — the finish screen, the rubric, the gate — is a
 * change somebody will want to evaluate. Without this table the only honest
 * answer to "did that help?" a year from now is "we don't know."
 *
 * A baseline is never overwritten. That is the entire contract, and the merge
 * rule follows it: on two machines, the EARLIER capture wins.
 */
db.version(8).stores({
  meta: 'key',
  strandStates: 'strandId',
  answers: '++id, itemId, strandId, at',
  sittings: '++id, startedAt',
  ledger: 'entryId, currency, at',
  requests: 'requestId, status, at',
  journal: 'entryId, at, kind',
  messages: 'messageId, at, from, readAt',
  scheduleDays: 'dayKey',
  attempts: 'attemptId, testId, dayKey, at',
  reviewItems: 'questionId, dueOn, box',
  lessonReads: 'lessonId, lastReadAt',
  projects: 'projectId, doneAt',
  khanGrades: 'gradeId, subject, at',
  writingMarks: 'markId, pieceId, at',
  itemEvents: 'eventId, questionId, evidenceSource, dayKey',
  baselines: 'trackId'
});

/**
 * v9 — GOALS. §3.11.
 *
 * Gigi: "Some of Azianna's skills are in the lower grade but I want her caught
 * up to 5th grade by the end of the school year." Then, which changed the
 * answer: "What if the goal is before the beginning of the next school year?"
 *
 * One row per goal, keyed by `goalId`, a UUID, for the reason everything else
 * that RECORDS SOMETHING is: two machines must merge without one goal
 * destroying another.
 *
 * The app had Dream Goals before this and they work — but a savings target is
 * not a learning goal, and §3.11.2 names what an app without one reports: "a
 * perfect year in which nothing was learned."
 *
 * A goal carries its BASELINE inside it, copied at creation and never
 * recomputed. §3.11.3 fails creation without one. If the baseline were read
 * live from the strand it would move every time she answered a question, and a
 * goal whose starting line moves cannot be missed OR met — it can only ever
 * report whatever just happened.
 */
db.version(9).stores({
  meta: 'key',
  strandStates: 'strandId',
  answers: '++id, itemId, strandId, at',
  sittings: '++id, startedAt',
  ledger: 'entryId, currency, at',
  requests: 'requestId, status, at',
  journal: 'entryId, at, kind',
  messages: 'messageId, at, from, readAt',
  scheduleDays: 'dayKey',
  attempts: 'attemptId, testId, dayKey, at',
  reviewItems: 'questionId, dueOn, box',
  lessonReads: 'lessonId, lastReadAt',
  projects: 'projectId, doneAt',
  khanGrades: 'gradeId, subject, at',
  writingMarks: 'markId, pieceId, at',
  itemEvents: 'eventId, questionId, evidenceSource, dayKey',
  baselines: 'trackId',
  goals: 'goalId, strandId, status, termId'
});

/**
 * v10 — THE DAILY JOURNAL IS MARKED.
 *
 * Gigi, Aug 19 2026, overturning her own locked rule. Asked whether a separate
 * graded daily piece would be better than marking the journal:
 *
 *     "she isn't going to want to do the daily writing and the journal."
 *
 * ---- THE MARK IS ITS OWN TABLE, KEYED BY entryId, ON PURPOSE ----
 *
 * Not a field on the journal row. Her writing is the one thing in this database
 * that cannot be regenerated, and a mark written INTO that row is one bad merge
 * away from touching the text beside it. Kept apart, the worst a bad merge can
 * do to a mark is lose a mark.
 *
 * It also means an unmarked entry has NO ROW rather than a null field — and
 * §3.13.1 is exactly that distinction: "a missing grade and a zero are opposite
 * facts."
 */
db.version(10).stores({
  meta: 'key',
  strandStates: 'strandId',
  answers: '++id, itemId, strandId, at',
  sittings: '++id, startedAt',
  ledger: 'entryId, currency, at',
  requests: 'requestId, status, at',
  journal: 'entryId, at, kind',
  messages: 'messageId, at, from, readAt',
  scheduleDays: 'dayKey',
  attempts: 'attemptId, testId, dayKey, at',
  reviewItems: 'questionId, dueOn, box',
  lessonReads: 'lessonId, lastReadAt',
  projects: 'projectId, doneAt',
  khanGrades: 'gradeId, subject, at',
  writingMarks: 'markId, pieceId, at',
  itemEvents: 'eventId, questionId, evidenceSource, dayKey',
  baselines: 'trackId',
  goals: 'goalId, strandId, status, termId',
  journalMarks: 'entryId, dayKey, at'
});

/**
 * The version stamped on every backup this app writes, and the one it checks
 * on every backup it reads.
 *
 * It was typed twice — `db.version(7)` in the ladder above and a literal `7` in
 * exportAll's return block — with nothing holding them together. Every
 * hand-typed number in this project has drifted; check-import now asserts this
 * constant equals the highest db.version on disk, so the next one cannot.
 */
export const BACKUP_VERSION = 10;

export const EXPORT_TABLE_POLICY = {
  meta: true,
  strandStates: true,
  answers: true,
  sittings: true,
  ledger: true,
  requests: true,
  journal: true,
  messages: true,
  scheduleDays: true,
  attempts: true,
  reviewItems: true,
  lessonReads: true,
  projects: true,
  khanGrades: true,
  writingMarks: true,
  // Added at v8 — and the guard written at v3.56 caught both of these the
  // moment the schema changed and the policy had not. First real use, on the
  // first schema change after it was written.
  itemEvents: true,
  baselines: true,
  // Added v9.
  goals: true,
  // Added v10. Her daily journal mark — six graded pieces a year were never
  // going to measure daily writing, and this is the record that does.
  journalMarks: true
};

db.on('blocked', () => window.dispatchEvent(new CustomEvent('pp-db-blocked')));
db.on('versionchange', () => window.dispatchEvent(new CustomEvent('pp-db-versionchange')));

export async function readMeta(key, fallback = null) {
  const row = await db.meta.get(key);
  return row === undefined ? fallback : row.value;
}

export async function writeMeta(key, value) {
  await db.meta.put({ key, value });
}

export async function readAllStrandStates() {
  return db.strandStates.toArray();
}

export async function writeStrandState(state) {
  await db.strandStates.put(state);
}

export async function appendAnswer(record) {
  await db.answers.add(record);
}

export async function readAnswers() {
  return db.answers.orderBy('at').toArray();
}

export async function startSitting(at) {
  return db.sittings.add({ startedAt: at, endedAt: null, answered: 0 });
}

export async function endSitting(id, at, answered) {
  await db.sittings.update(id, { endedAt: at, answered });
}

export async function readSittings() {
  return db.sittings.orderBy('startedAt').toArray();
}

// ---------------------------------------------------------------------------
// Economy
// ---------------------------------------------------------------------------

export async function readLedger() {
  return db.ledger.orderBy('at').toArray();
}

export async function appendLedgerEntry(entry) {
  // put, not add: entryId is a UUID, so a re-import of the same entry should be
  // idempotent rather than throwing. That is what makes a merge safe to re-run.
  await db.ledger.put(entry);
}

export async function readRequests() {
  return db.requests.orderBy('at').toArray();
}

export async function putRequest(request) {
  await db.requests.put(request);
}

// ---------------------------------------------------------------------------
// Journal, Messages, Schedule (Phase 2)
// ---------------------------------------------------------------------------

export async function readJournal() {
  return db.journal.orderBy('at').toArray();
}

export async function putJournalEntry(entry) {
  // put, not add — entryId is a UUID, so re-importing the same entry is
  // idempotent rather than a crash. Same rule as the ledger.
  await db.journal.put(entry);
}

export async function deleteJournalEntry(entryId) {
  await db.journal.delete(entryId);
}

export async function readMessages() {
  return db.messages.orderBy('at').toArray();
}

export async function putMessage(message) {
  await db.messages.put(message);
}

export async function deleteMessage(messageId) {
  await db.messages.delete(messageId);
}

export async function readScheduleDays() {
  return db.scheduleDays.toArray();
}

export async function putScheduleDay(row) {
  await db.scheduleDays.put(row);
}

// ---------------------------------------------------------------------------
// LESSONS, TESTS AND THE REVIEW BOXES
// ---------------------------------------------------------------------------

export async function readLessonReads() {
  return db.lessonReads.toArray();
}

export async function putLessonRead(row) {
  await db.lessonReads.put(row);
}

export async function readAttempts() {
  return db.attempts.toArray();
}

export async function putAttempt(attempt) {
  await db.attempts.put(attempt);
}

export async function readReviewItems() {
  return db.reviewItems.toArray();
}

export async function putReviewItems(items) {
  // bulkPut rather than a loop: a warm-up moves three boxes at once and a
  // quarter test moves twenty-four. One write, one transaction.
  await db.reviewItems.bulkPut(items);
}

/**
 * Wipe everything and start over.
 *
 * Gated behind the Grown-Up Corner and a typed confirmation, because there is
 * no undo and no backup on another machine. A child clicking around must not
 * be able to reach this.
 *
 * ---- WHAT RESET DOES NOT TOUCH ----
 *
 * Her journal, her messages, her attendance, her test results, her lessons read
 * and her review boxes all survive a reset, deliberately.
 *
 * This button exists so the diagnostic can be retaken. It is not "delete the
 * child's work". Her writing cannot be regenerated by taking a test again, and
 * neither can a note her grandmother wrote her — wiping those as a side effect
 * of redoing an assessment would be destroying the only irreplaceable things in
 * the database to fix the most replaceable one.
 *
 * The same argument covers her school record. This button exists to redo the
 * placement Check-In. A unit test she sat in October is a fact about a day that
 * happened, and a transcript is not something to clear as a side effect of
 * re-measuring her reading level.
 *
 * The Grown-Up Corner says so in the confirmation, so the person pressing it
 * knows exactly what stays.
 */
export async function resetEverything() {
  await db.transaction('rw', db.meta, db.strandStates, db.answers, db.sittings, db.ledger, db.requests, async () => {
    await db.strandStates.clear();
    await db.answers.clear();
    await db.sittings.clear();
    // The ledger and her shelf go too. Resetting the diagnostic zeroes the
    // effort counters that the earned half of every balance is derived from, so
    // leaving purchases and grants behind would hand her a negative balance and
    // a shelf of things she can no longer explain owning.
    await db.ledger.clear();
    await db.requests.clear();
    await db.meta.delete('unlockedItems');
    await db.meta.delete('equippedGear');
    await db.meta.delete('dreamGoalId');
    // meta survives on purpose: her name and the parent passcode are settings,
    // not results. Clearing them would lock the parent out of the app she just
    // reset.
    await db.meta.delete('diagnosticStartedAt');
    await db.meta.delete('diagnosticCompletedAt');
  });
}

/** Everything, as one JSON object, for the Grown-Up Corner's export button.
 *  A local-only app with no cloud backup needs a way to get the data OUT. */

// ---------------------------------------------------------------------------
// LOADING A BACKUP BACK IN
//
// WHY THIS EXISTS. The export button said "Download backup" and there was no
// way to put one back, which meant it was not a backup — it was a snapshot you
// could read and never restore. That was a real flaw sitting behind a
// reassuring label.
//
// The immediate need is different and more practical: the app is BUILT on one
// computer and USED on another. Reviewing what needs changing means being able
// to see the real thing — her actual levels, her actual journal, her actual
// day — on the machine where the work happens.
//
// ---- THE ONE THING THAT MAKES THIS DANGEROUS ----
//
// `answers` and `sittings` are keyed by an AUTO-INCREMENT id. Her answer #12 on
// one computer and a different answer #12 on another are not the same event,
// and a naive import keyed on id would silently destroy one of them. So the
// incoming id is thrown away and rows are matched on what they actually are:
// an answer is (itemId, at); a sitting is (startedAt).
//
// This is the exact hazard the ledger was designed around from the start — its
// entryId is a UUID precisely so two machines can merge. The diagnostic tables
// predate that decision, which is why they need the workaround.
//
// ---- MERGE, NOT REPLACE ----
//
// Nothing is deleted. Every table takes the union, and where a row exists on
// both sides the rule is written down below rather than being whatever the
// last write happened to be. Importing the same file twice changes nothing the
// second time, which is what makes it safe to press again if you are not sure
// it worked.
// ---------------------------------------------------------------------------

// The rules themselves live in lib/mergeBackup.js as pure functions, because
// Dexie cannot run outside a browser and a merge rule nobody can test is a
// merge rule nobody should trust with a child's only copy of her writing.
// scripts/check-import.mjs tests them against a real two-machine collision.

/**
 * What WOULD change, without changing anything.
 *
 * Shown before the button is pressed, because "import" is the kind of word that
 * makes people hesitate — reasonably. Seeing "adds 61 answers, 0 already here"
 * turns it from a leap into a decision.
 */
export async function previewImport(data) {
  if (!data || data.app !== 'Petal & Pestle Academy') {
    throw new Error('That file is not a Petal & Pestle backup.');
  }

  // ---- THE VERSION GATE ----
  //
  // exportAll has always stamped a version, and the comment beside it says why
  // it matters: "an export that calls itself v6 while carrying v7 data is a
  // file that lies about itself." THE READER NEVER LOOKED. This function gated
  // on data.app alone, for seven versions.
  //
  // Old into new is safe and must stay safe — her Aug 13 file says version 2
  // and still holds real work. Every field the merge wants is either there or
  // absent, and absent means "nothing to merge".
  //
  // NEW INTO OLD IS NOT SAFE. A v8 file carrying a table this build has never
  // heard of would merge everything it recognised and drop the rest without a
  // word, and the only sign would be a count looking wrong weeks later. On a
  // household running two machines that update at different times, that is not
  // hypothetical — it is what a Tuesday looks like.
  const fileVersion = Number(data.version) || 0;
  if (fileVersion > BACKUP_VERSION) {
    throw new Error(
      `That backup was made by a newer version of Petal & Pestle (file v${fileVersion}, this app ` +
        `v${BACKUP_VERSION}). Loading it here would quietly drop anything this version does not ` +
        `know about. Update this computer first, then load it.`
    );
  }

  const [
    answers, strandStates, journal, messages, ledger, sittings, scheduleDays, attempts,
    lessonReads, projects, khanGrades, writingMarks, requests, itemEvents, baselines, goals,
    journalMarks
  ] = await Promise.all([
      db.answers.toArray(),
      db.strandStates.toArray(),
      db.journal.toArray(),
      db.messages.toArray(),
      db.ledger.toArray(),
      db.sittings.toArray(),
      db.scheduleDays.toArray(),
      db.attempts.toArray(),
      db.lessonReads.toArray(),
      db.projects.toArray(),
      db.khanGrades.toArray(),
      db.writingMarks.toArray(),
      db.requests.toArray(),
      db.itemEvents.toArray(),
      db.baselines.toArray(),
      db.goals.toArray(),
      db.journalMarks.toArray()
    ]);
  const haveAttempts = new Set(attempts.map((a) => a.attemptId));
  const haveLessons = new Set(lessonReads.map((l) => l.lessonId));

  const haveAnswers = new Set(answers.map(answerKey));
  const haveSittings = new Set(sittings.map(sittingKey));
  const haveJournal = new Set(journal.map((j) => j.entryId));
  const haveMessages = new Set(messages.map((m) => m.messageId));
  const haveLedger = new Set(ledger.map((e) => e.entryId));
  const haveDays = new Set(scheduleDays.map((d) => d.dayKey));
  const haveProjects = new Set(projects.map((p) => p.projectId));
  const haveKhan = new Set(khanGrades.map((g) => g.gradeId));
  const haveMarks = new Set(writingMarks.map((w) => w.markId));
  const haveRequests = new Set(requests.map((r) => r.requestId));
  const haveEvents = new Set(itemEvents.map((e) => e.eventId));
  const haveBaselines = new Set(baselines.map((b) => b.trackId));
  const haveGoals = new Set(goals.map((g) => g.goalId));
  const haveJournalMarks = new Set(journalMarks.map((m) => m.entryId));
  const localStrands = new Map(strandStates.map((s) => [s.strandId, s]));

  const inAnswers = data.answers || [];
  const inStrands = data.strandStates || [];
  const name = (data.meta || []).find((m) => m.key === 'learnerName')?.value || null;

  // Computed once and used twice — in the answers row and in `freshness` below.
  // Two places counting the same thing is how the preview came to describe
  // eleven tables while the import merged fifteen.
  const newAnswers = inAnswers.filter((a) => !haveAnswers.has(answerKey(a))).length;
  const newestAt = (rows) => rows.reduce((m, a) => Math.max(m, a.at || 0), 0);

  return {
    learnerName: name,
    answers: { incoming: inAnswers.length, new: newAnswers },
    strands: {
      incoming: inStrands.length,
      // A strand is taken when the incoming side did MORE of it. Whichever
      // machine actually sat the test is the authority for that strand.
      willReplace: inStrands.filter((s) => pickStrand(localStrands.get(s.strandId), s) === s).length,

      // ---- THE STRANDS THE MERGE RULE REFUSED TO GO BACKWARDS ON ----
      //
      // Named rather than counted, because "3 strand results replaced" and
      // "geometry went from 2.70 back to 2.00" are not the same sentence to the
      // person holding the mouse. These are the rows where the incoming file
      // holds a FINISHED older reading and this machine is mid-re-measure —
      // pickStrand keeps the local one, and the screen says so instead of
      // asking her to trust that it did.
      // ⚠️ ASKS pickStrand, NEVER RE-IMPLEMENTS ITS RULE. The first version
      // duplicated the in-progress test here, and when pickStrand was corrected
      // on Aug 19 evening this copy would have gone on reporting the old answer
      // — a preview that disagrees with the merge it is previewing.
      protectedInProgress: inStrands
        .filter((s) => {
          const local = localStrands.get(s.strandId);
          return !!local && pickStrand(local, s) === local && (s.asked || 0) > (local.asked || 0);
        })
        .map((s) => {
          const local = localStrands.get(s.strandId);
          return {
            strandId: s.strandId,
            keptLevel: local.level,
            keptAsked: local.asked || 0,
            fileLevel: s.level,
            fileAsked: s.asked || 0
          };
        })
    },
    journal: { incoming: (data.journal || []).length, new: (data.journal || []).filter((j) => !haveJournal.has(j.entryId)).length },
    messages: { incoming: (data.messages || []).length, new: (data.messages || []).filter((m) => !haveMessages.has(m.messageId)).length },
    ledger: { incoming: (data.ledger || []).length, new: (data.ledger || []).filter((e) => !haveLedger.has(e.entryId)).length },
    sittings: { incoming: (data.sittings || []).length, new: (data.sittings || []).filter((s) => !haveSittings.has(sittingKey(s))).length },
    scheduleDays: { incoming: (data.scheduleDays || []).length, new: (data.scheduleDays || []).filter((d) => !haveDays.has(d.dayKey)).length },
    attempts: {
      incoming: (data.attempts || []).length,
      new: (data.attempts || []).filter((a) => !haveAttempts.has(a.attemptId)).length
    },
    lessonReads: {
      incoming: (data.lessonReads || []).length,
      new: (data.lessonReads || []).filter((l) => !haveLessons.has(l.lessonId)).length
    },
    reviewItems: { incoming: (data.reviewItems || []).length },

    // ---- FOUR TABLES THE PREVIEW NEVER MENTIONED ----
    //
    // importBackup merges fifteen tables. This function described eleven. Three
    // of the four missing ones are her SCHOOL RECORD — sixteen projects a year,
    // every Khan grade a grown-up typed, and all six pieces of graded writing —
    // and they were merged on the strength of a summary that did not list them.
    //
    // A diffing import whose diff is incomplete is worse than no diff: it looks
    // like a full account of what is about to happen, and a grown-up reads it
    // as one before pressing the button.
    projects: {
      incoming: (data.projects || []).length,
      new: (data.projects || []).filter((p) => !haveProjects.has(p.projectId)).length
    },
    khanGrades: {
      incoming: (data.khanGrades || []).length,
      new: (data.khanGrades || []).filter((g) => !haveKhan.has(g.gradeId)).length
    },
    writingMarks: {
      incoming: (data.writingMarks || []).length,
      new: (data.writingMarks || []).filter((w) => !haveMarks.has(w.markId)).length
    },
    requests: {
      incoming: (data.requests || []).length,
      new: (data.requests || []).filter((r) => !haveRequests.has(r.requestId)).length
    },
    itemEvents: {
      incoming: (data.itemEvents || []).length,
      new: (data.itemEvents || []).filter((e) => !haveEvents.has(e.eventId)).length
    },
    baselines: {
      incoming: (data.baselines || []).length,
      new: (data.baselines || []).filter((b) => !haveBaselines.has(b.trackId)).length
    },
    goals: {
      incoming: (data.goals || []).length,
      new: (data.goals || []).filter((g) => !haveGoals.has(g.goalId)).length
    },
    journalMarks: {
      incoming: (data.journalMarks || []).length,
      new: (data.journalMarks || []).filter((m) => !haveJournalMarks.has(m.entryId)).length
    },

    // ---- HOW OLD IS THIS FILE, RELATIVE TO WHAT IS ALREADY HERE ----
    //
    // §32.7, in Gigi's words: the green button "does not say how old its file is
    // relative to her live data." A date on its own cannot answer that. Aug 13
    // is not old if this machine is empty, and it is very old if this machine
    // already holds Aug 18.
    //
    // So both sides are reported and the SCREEN does the comparing. No `incoming`
    // key here on purpose — the row builder walks entries that have one, and this
    // is not a table of hers.
    freshness: {
      newestInFile: newestAt(inAnswers),
      newestHere: newestAt(answers),
      newAnswers
    }
  };
}

/** Do it. Returns the same shape previewImport does, describing what happened. */
export async function importBackup(data) {
  const preview = await previewImport(data);

  await db.transaction(
    'rw',
    db.meta, db.strandStates, db.answers, db.sittings, db.ledger, db.requests,
    db.journal, db.messages, db.scheduleDays,
    db.attempts, db.reviewItems, db.lessonReads, db.projects, db.khanGrades,
    db.writingMarks, db.itemEvents, db.baselines, db.goals, db.journalMarks,
    async () => {
      // ---- answers: append only what is genuinely new, id stripped ----
      const existing = new Set((await db.answers.toArray()).map(answerKey));
      for (const a of data.answers || []) {
        if (existing.has(answerKey(a))) continue;
        const { id, ...rest } = a; // eslint-disable-line no-unused-vars
        await db.answers.add(rest);
      }

      // ---- sittings: same treatment, matched on when they started ----
      const haveSit = new Set((await db.sittings.toArray()).map(sittingKey));
      for (const st of data.sittings || []) {
        if (haveSit.has(sittingKey(st))) continue;
        const { id, ...rest } = st; // eslint-disable-line no-unused-vars
        await db.sittings.add(rest);
      }

      // ---- strand states: the side that answered more wins ----
      for (const inc of data.strandStates || []) {
        const local = await db.strandStates.get(inc.strandId);
        if (pickStrand(local, inc) === inc) await db.strandStates.put(inc);
      }

      // ---- UUID-keyed tables: plain union, incoming never clobbers ----
      for (const e of data.ledger || []) {
        if (!(await db.ledger.get(e.entryId))) await db.ledger.put(e);
      }
      for (const rq of data.requests || []) {
        if (!(await db.requests.get(rq.requestId))) await db.requests.put(rq);
      }

      // ---- journal: the later edit wins, because it is her writing ----
      for (const j of data.journal || []) {
        const local = await db.journal.get(j.entryId);
        if (pickJournal(local, j) === j) await db.journal.put(j);
      }

      // ---- messages: union, and READ beats unread ----
      for (const m of data.messages || []) {
        const local = await db.messages.get(m.messageId);
        const keep = pickMessage(local, m);
        if (keep !== local) await db.messages.put(keep);
      }

      // ---- attendance: union of the blocks ticked on each day ----
      for (const d of data.scheduleDays || []) {
        const local = await db.scheduleDays.get(d.dayKey);
        await db.scheduleDays.put(mergeScheduleDay(local, d));
      }

      // ---- test attempts: union, keyed by UUID, incoming never clobbers ----
      //
      // A sat test is a historical event. There is no version of this where the
      // right answer is to overwrite one, so an attempt that already exists is
      // left exactly as it is.
      for (const at of data.attempts || []) {
        if (!(await db.attempts.get(at.attemptId))) await db.attempts.put(at);
      }

      // ---- review boxes: the LOWER box wins. See pickReviewItem. ----
      for (const ri of data.reviewItems || []) {
        const local = await db.reviewItems.get(ri.questionId);
        await db.reviewItems.put(pickReviewItem(local, ri));
      }

      // ---- lessons read: nothing can go backwards ----
      for (const lr of data.lessonReads || []) {
        const local = await db.lessonReads.get(lr.lessonId);
        await db.lessonReads.put(pickLessonRead(local, lr));
      }

      // ---- projects: finished beats unfinished, the earlier finish wins ----
      for (const pr of data.projects || []) {
        const local = await db.projects.get(pr.projectId);
        await db.projects.put(pickProject(local, pr));
      }

      // ---- Khan grades: a union, newest edit wins on a shared id ----
      //
      // Four of her six subjects are taught by Khan. A grade typed on one
      // machine and lost on the merge is the failure that sends a grown-up back
      // to a paper notebook and never brings them back.
      for (const kg of data.khanGrades || []) {
        const local = await db.khanGrades.get(kg.gradeId);
        await db.khanGrades.put(pickKhanGrade(local, kg));
      }

      // ---- writing marks: a union, newest edit wins on a shared id ----
      //
      // Six pieces a year is the whole of her graded writing. One lost on a
      // merge is a quarter of the record gone, and nothing on any screen would
      // say which machine still had it.
      for (const wm of data.writingMarks || []) {
        const local = await db.writingMarks.get(wm.markId);
        await db.writingMarks.put(pickWritingMark(local, wm));
      }

      // ---- item events: a union of two lists, never a reconciliation ----
      //
      // eventId is a UUID, so two machines combine without colliding. Loading
      // the same file twice adds nothing, because the second copy of an event
      // is the same event.
      for (const ev of data.itemEvents || []) {
        const local = await db.itemEvents.get(ev.eventId);
        await db.itemEvents.put(pickItemEvent(local, ev));
      }

      // ---- baselines: the EARLIER capture wins ----
      //
      // The one merge in this file that prefers the older side, and it has to.
      // A baseline is where she started; taking the later of two would move
      // the starting line forward and understate everything measured from it.
      for (const b of data.baselines || []) {
        const local = await db.baselines.get(b.trackId);
        await db.baselines.put(pickBaseline(local, b));
      }

      // ---- goals: the newer edit wins, because a goal has a lifecycle ----
      //
      // Unlike a baseline, a goal is MEANT to change: proposed, approved,
      // checkpointed, reviewed, met or carried. So the later edit is the true
      // one — the opposite rule to the baseline sitting two blocks above, and
      // worth reading twice before changing either.
      // A mark is meant to change — she may re-read an entry and think better of
      // it — so the later edit wins, the opposite of a baseline.
      for (const m of data.journalMarks || []) {
        const local = await db.journalMarks.get(m.entryId);
        await db.journalMarks.put(pickJournalMark(local, m));
      }

      for (const g of data.goals || []) {
        const local = await db.goals.get(g.goalId);
        await db.goals.put(pickGoal(local, g));
      }

      // ---- meta: only the keys that are safe to carry across ----
      //
      // parentPasscode is not in the export at all. scheduleBlocks is a setting
      // belonging to the machine it was typed on, so it is only taken when this
      // machine has none of its own.
      const metaIn = new Map((data.meta || []).map((m) => [m.key, m.value]));
      const takeIfEmpty = ['learnerName', 'scheduleBlocks', 'dreamGoalId'];
      for (const key of takeIfEmpty) {
        if (!metaIn.has(key)) continue;
        const local = await db.meta.get(key);
        if (local === undefined || local.value == null || local.value === '') {
          await db.meta.put({ key, value: metaIn.get(key) });
        }
      }
      for (const key of ['unlockedItems']) {
        if (!metaIn.has(key)) continue;
        const local = (await db.meta.get(key))?.value || [];
        await db.meta.put({ key, value: [...new Set([...local, ...(metaIn.get(key) || [])])] });
      }
      for (const key of ['equippedGear']) {
        if (!metaIn.has(key)) continue;
        const local = (await db.meta.get(key))?.value || {};
        await db.meta.put({ key, value: { ...local, ...(metaIn.get(key) || {}) } });
      }
      for (const key of ['diagnosticStartedAt', 'diagnosticCompletedAt', 'streak', 'lastActiveDay', 'pickCounter']) {
        if (!metaIn.has(key)) continue;
        const local = (await db.meta.get(key))?.value;
        if (local == null) await db.meta.put({ key, value: metaIn.get(key) });
      }
    }
  );

  return preview;
}

export async function exportAll() {
  const [
    meta, strandStates, answers, sittings, ledger, requests, journal, messages, scheduleDays,
    attempts, reviewItems, lessonReads, projects, khanGrades, writingMarks,
    itemEvents, baselines, goals, journalMarks
  ] = await Promise.all([
      db.meta.toArray(),
      db.strandStates.toArray(),
      db.answers.toArray(),
      db.sittings.toArray(),
      db.ledger.toArray(),
      db.requests.toArray(),
      db.journal.toArray(),
      db.messages.toArray(),
      db.scheduleDays.toArray(),
      db.attempts.toArray(),
      db.reviewItems.toArray(),
      db.lessonReads.toArray(),
      db.projects.toArray(),
      db.khanGrades.toArray(),
      db.writingMarks.toArray(),
      db.itemEvents.toArray(),
      db.baselines.toArray(),
      db.goals.toArray(),
      db.journalMarks.toArray()
    ]);
  // The passcode is a household convenience, not a secret worth exporting.
  const safeMeta = meta.filter((m) => m.key !== 'parentPasscode');
  return {
    app: 'Petal & Pestle Academy',
    // An export that calls itself v6 while carrying v7 data is a file that
    // lies about itself — and until v3.56 the READER never looked. It does
    // now, in previewImport, against this same constant.
    version: BACKUP_VERSION,
    meta: safeMeta,
    strandStates,
    answers,
    sittings,
    ledger,
    requests,
    // Her writing is in here. This file IS the backup of it — there is no cloud
    // copy and no server. Worth saying out loud in the Grown-Up Corner.
    journal,
    messages,
    scheduleDays,
    // Her school record. Every test she has sat, question by question, plus the
    // spaced-review boxes and which lessons she has read. This is what a report
    // card and a transcript are built from, so it must survive a laptop dying.
    attempts,
    reviewItems,
    lessonReads,
    // Her projects. Sixteen fortnights of work across the year — the field
    // guide, the weather station, the oral history with Gigi. Missing from the
    // backup entirely from v3.10 to v3.12, which would have thrown all of it
    // away the first time she changed machines.
    projects,
    // Four of her six subjects are taught by Khan. Without these the report
    // card is a quarter of her year, so they travel with everything else.
    khanGrades,
    // Her graded writing — four book reports and two research papers a year,
    // marked against a rubric she saw first. Six rows is the entire evidence of
    // written work in the record, so it travels too.
    writingMarks,
    // Where every answer came from, and where each track started. Added v8.
    // The warm-up kept NOTHING before this — three questions a morning, 260
    // mornings a year, and only a Leitner box moving. A baseline in particular
    // cannot be reconstructed after the fact, so losing this table on a move
    // between machines would lose the only answer to "did that change help?"
    itemEvents,
    baselines,
    // What she is aiming at, and where she started when it was set.
    goals,
    // Added v10. Her DAILY journal mark. Six graded pieces a year were never
    // going to measure daily writing, and Gigi overturned the journal lock to
    // get one that does — so this is now the densest written-work evidence in
    // the record, and it travels with everything else. Kept apart from the
    // entry it grades: a bad merge can lose a mark, never a word she wrote.
    journalMarks
  };
}

/** Every project row she has. */
export async function readProjects() {
  return db.projects.toArray();
}

export async function putProject(row) {
  await db.projects.put(row);
}

/** Every Khan grade a grown-up has entered. */
export async function readKhanGrades() {
  return db.khanGrades.toArray();
}

export async function putKhanGrade(row) {
  await db.khanGrades.put(row);
}

export async function deleteKhanGrade(gradeId) {
  await db.khanGrades.delete(gradeId);
}

/** Every mark a grown-up has given on a book report or research paper. */
export async function readWritingMarks() {
  return db.writingMarks.toArray();
}

export async function putWritingMark(row) {
  await db.writingMarks.put(row);
}

export async function deleteWritingMark(markId) {
  await db.writingMarks.delete(markId);
}

/** Every answer she has given, from every surface. Added v8. */
export async function readItemEvents() {
  return db.itemEvents.toArray();
}

export async function appendItemEvents(rows) {
  if (rows?.length) await db.itemEvents.bulkPut(rows);
}

/** Every goal, at every stage of its life. Added v9. */
export async function readGoals() {
  return db.goals.toArray();
}

export async function putGoal(row) {
  await db.goals.put(row);
}

/** Every journal mark. One row per graded entry, keyed by entryId. Added v10. */
export async function readJournalMarks() {
  return db.journalMarks.toArray();
}

/**
 * Mark one journal entry.
 *
 * ⚠️ NOTHING HERE READS OR WRITES THE ENTRY. It is keyed by entryId and lives in
 * its own table, so marking an entry cannot alter a character of what she wrote.
 * That was the condition on overturning the journal lock.
 */
export async function putJournalMark(row) {
  await db.journalMarks.put(row);
}

/** Un-mark. An entry with no row is UNMARKED, which is not the same as zero. */
export async function clearJournalMark(entryId) {
  await db.journalMarks.delete(entryId);
}

/** Where each track started. One row per track, written once. Added v8. */
export async function readBaselines() {
  return db.baselines.toArray();
}

/**
 * Write a baseline ONLY if the track has never had one.
 *
 * A baseline that can be overwritten is not a baseline. Guarded here, at the
 * boundary, rather than in the caller — a caller can be added tomorrow.
 */
export async function captureBaselineOnce(row) {
  const existing = await db.baselines.get(row.trackId);
  if (existing) return existing;
  await db.baselines.put(row);
  return row;
}
