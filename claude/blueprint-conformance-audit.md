# Petal & Pestle Academy — Blueprint Conformance Audit

**Measured against:** `BLUEPRINT_A_LOCAL_FIRST.md` — *Learning Platform Blueprint Framework*, Edition A (Local-First / Offline), **Version 1.1**, 68 pages.
**App audited:** Petal & Pestle Academy **v3.54**, read off `C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy` on **Aug 18 2026**.
**Method:** every claim below is derived from the code on disk. Nothing is taken from a comment, a document, or the app's own description of itself. File and line are given where the finding is specific.

> The blueprint says of itself, on page 1: *"This is a template, not a plan for one app… Do not edit this document to match what got built. **It is the target, not a tracker.**"*
>
> **This app was built to Mission Control, not to this framework, and it predates it.** Non-conformance is therefore a gap register, not a list of failures. What follows is the distance between here and the target, in the order the blueprint itself says to close it.

---

---

## ⚠️ READ THIS BEFORE QUOTING ANY NUMBER BELOW — RE-READ AGAINST v3.60, Aug 19

**The body of this document is the audit AS TAKEN AT v3.54. The app is at v3.60.** The counts in the one-page summary were quoted as current in a session prompt on Aug 19 and they are not — **at least twelve rows have closed since.** They are listed here rather than edited into the tables below, because an audit silently updated is an audit nobody can date.

| Row | Was, at v3.54 | On disk at v3.60 |
|---|---|---|
| AP 15 · diagnostic answers in the same mastery number | ❌ | ✅ `evidenceSource`, v3.57 |
| AP 17 · placement set once, never revisited | ❌ | ✅ v3.55, and the anti-pattern conflict is closed |
| AP 19 · abandoned attempt as a failed assessment | ❌ | ✅ `attemptState`, v3.57 |
| AP 20 · goals with no baseline | ❌ | ✅ baseline mandatory, v3.58 |
| AP 21 · every goal an effort goal | ❌ | ✅ growth goals per strand, v3.58 |
| AP 22 · goals on a screen nobody opens | ❌ | ✅ today-surface line, v3.59 |
| AP 25 · new table added without updating export | ◐ | ✅ four-way guard, v3.56 |
| §3.4 · `evidenceSource` · `attemptState` · `baseline.captured` | ❌ | ✅ v3.57 |
| §3.6 · rubric `scoreMapping` | ❌ | ✅ v3.56 |
| §3.9 r9 · `previewImport` reads `version` | ◐ | ✅ v3.56 |
| §3.9 r10 · export-completeness guard | ◐ | ✅ v3.56 — **this document's own "single highest-value fix"** |
| §3.11 · goals engine | ❌ absent entirely | ✅ v3.58–3.59 |
| §3.12.1 · term calendar as data | — | ✅ v3.58 |

**And one row was not stale but WRONG in a way that mattered:** §3.9's merge rules were not audited at all, and `pickStrand` would have reverted all four of her in-progress re-measures. Found and fixed Aug 19 — see master plan §32.7a. **The audit looked at whether tables travel and never at whether the rules that combine them are safe.**

**Everything below this line is as it read at v3.54 unless marked.**

---

## THE ONE-PAGE SUMMARY

*⚠️ These counts are v3.54's. See the table above for the twelve that have moved.*

| | Count |
|---|---|
| Blueprint anti-patterns audited (§1.4) | **28** |
| — Conformant | **7** |
| — Partial | **5** |
| — Not conformant | **16** |
| Architecture requirements audited (§3) | **34** |
| — Conformant | **11** |
| — Partial | **6** |
| — Not conformant | **17** |
| Existing automated checks | **26** |
| — That map to a blueprint requirement | **14** |
| — Blueprint requirements with **no** check behind them | **most of §3.4, §3.9, §3.10, §3.11, §3.13, §4** |

### The three findings that overrule decisions already taken

1. **The rubric mapping is a named failure mode, not a preference.** `gradePiece()` divides a 4-level rubric by 4. All 3s = 75% = **C**. §3.6 names this exact arithmetic and says it *"teaches the learner that meeting the standard is failure."* **This is a defect to fix, not a call for Gigi to make.**
2. **A single pass/fail cutoff is forbidden.** §3.6: *"Never use a single binary cutoff."* The standard's gate is a two-tier mastery model with **`requiresSeparateSessions: 2` — a lesson cannot be mastered the day it is taught.** The 3-of-4 pass bar scoped on Aug 18 is the wrong shape.
3. **An end-of-lesson test is not a retention measure.** §3.6: *"An end-of-lesson check on material taught ten minutes earlier measures **recognition, not retention.** Schedule the real retrieval for tomorrow."* The scored lesson test may be **evidence**, but the course grade cannot rest on it alone.

### The single highest-value fix

~~**The export-completeness guard is one link short of the standard, and the bug it was written for can still recur.** ~30 minutes. See §D1.~~ — **DONE at v3.56.** `EXPORT_TABLE_POLICY` sits beneath the schema and `check-import` asserts schema → policy → export → import in both directions at every link, finding the latest `db.version(n)` rather than assuming it. It caught the two new tables at v3.57 and the goals table at v3.58 on their first schema change.

**The highest-value fix as of v3.60 was one this audit never looked for:** the merge RULES, as opposed to which tables travel. `pickStrand` would have reverted all four of her in-progress re-measures and re-flagged them settled. See master plan §32.7a.

---

## §A — THE 28 ANTI-PATTERNS (§1.4)

| # | Anti-pattern | Status | Evidence |
|---|---|---|---|
| 1 | Content order = array position | ✅ | every lesson carries `n`; **256 of 256** |
| 2 | Curriculum structure in code comments | ◐ | structure is in data, but `WEEKS`/`DECLARED_OMISSIONS` live in `config/assessment.js` as code |
| 3 | Load-everything hydration | ❌ | `useAppStore` hydrate loads every table at launch; **no hot/cold split** |
| 4 | Positional array destructuring of table loads | ❌ | `db.js:478` — `const [answers, strandStates, journal, messages, ledger, sittings, scheduleDays, attempts, lessonReads] = await Promise.all([...])` |
| 5 | Seeds re-running every launch | ✅ | Dexie version ladder v1→v7, each guarded |
| 6 | Zero error handling in the data layer | ❌ | **0 `try {` blocks in `db.js`.** No error state, no retry, no user-visible failure |
| 7 | UTC date keys on a local-time product | ✅ | `dayKeyOf()` uses `getFullYear/getMonth/getDate` — local |
| 8 | Global tier gating per-subject content | ✅ | warm-up pool derives from lessons she has read |
| 9 | One static explanation for every wrong answer | ✅ | **per-choice `feedback` on all 2,560 items** — a real strength |
| 10 | Motivation welded to content mechanics | ◐ | Petals/Seeds read progress events, but paid inline from the store |
| 11 | Dashboard showing everything at once | ✅ | 6 tabs, down from 12; Today-first |
| 12 | Accessibility deferred to a "polish phase" | ❌ | no `a11y.config`, **0 files with `reduceMotion`**, no dyslexia/contrast/font-scale settings |
| 13 | Timestamp-based record IDs | ◐ | `ledger`/`journal`/`attempts` use UUIDs; **`answers` and `sittings` use `++id` auto-increment** — named as the hazard in `mergeBackup.js` itself |
| 14 | Full-database synchronous export | ❌ | `exportAll()` is one synchronous `Promise.all` of 14 unbounded `toArray()` calls |
| 15 | Diagnostic answers scored into the same mastery number | ❌ | **no `evidenceSource` anywhere** |
| 16 | Placement extrapolated above what was demonstrated | ✅ | Check-In reports a ceiling and says so; `check-yearplan` enforces it |
| 17 | Placement set once and never revisited | ❌ | **no `expiresOn`, no re-diagnostic trigger.** "No more diagnostic re-takes" is settled policy — the standard calls that the anti-pattern |
| 18 | Growth measured across different instruments | ❌ | no `instrumentId`, no benchmark forms |
| 19 | Abandoned attempt recorded as a failed assessment | ❌ | **no `attemptState`** |
| 20 | Goals created with no baseline | ❌ | **no goals engine** |
| 21 | Every goal is an effort goal | ❌ | n/a — no goals |
| 22 | Goals stored on a screen nobody opens | ❌ | n/a — no goals |
| 23 | A missing grade averaged as a zero | ❌ | `ungraded` is not a modelled state; no `ungradedInAverage` policy |
| 24 | Content deleted rather than archived | ◐ | `_to_delete/` convention is real and disciplined, but **0 of 256 lessons carry a `status` field** |
| 25 | New table added without updating export | ◐ | guard exists but reads the **export**, not the **schema** — see §D1 |
| 26 | Calendar pushing past an unmet mastery gate | ✅ | rotating block reads her progress; *"unwritten is not finished"* |
| 27 | Rewards entirely retrospective | ❌ | Petals/Seeds are paid for what happened; no daily target, challenge or named next milestone |
| 28 | A learner with zero choices | ◐ | course switcher in My Lessons is one real choice; **no agency budget declared**, no pick-what's-next, no pick-the-depth |

---

## §B — ARCHITECTURE (§3)

### The rule the blueprint calls the most important

> *"Content, audience configuration, and presentation are data. The engines that consume them are code. **Code never contains a subject noun, a grade level, an age, or a theme string.**"*

**❌ Not conformant.** `herbalism`, `sciencelab`, `humanbody` and `social` appear as literals throughout `src/config/assessment.js`, `src/lib/`, and all 26 check scripts. This is the framework's central test — *"if you can't switch the app from a phonics game to a forklift certification course by editing JSON, the separation has failed"* — and it is the deepest structural gap here.

**In fairness:** this app was never intended to be re-pointed at another subject. The cost of this gap is not portability — it is that content rules and engine rules are interleaved, which is why a curriculum change can turn a check red.

### §3.4 — Event schema

| Requirement | Status |
|---|---|
| Append-only event log; all state derived | ❌ mutable tables; `strandStates` *"replaced wholesale after each answer"* |
| `evidenceSource` on every item event | ❌ absent |
| `attemptState: complete\|abandoned\|expired` | ❌ absent |
| `hintsUsed`, `responseMs`, `attemptNumber`, `sessionId` | ❌ absent |
| `beat.entered` / `beat.completed` duration data | ❌ absent — *"time-on-task cannot be reconstructed later"* |
| `baseline.captured` per track | ❌ absent — *"a baseline cannot be reconstructed after the fact"* |
| `dateKey` from `localDateKey()` | ✅ `dayKeyOf()` |

**⚠️ CORRECTED v3.56 — THIS AUDIT WAS WRONG ABOUT THE ATTEMPT RECORD, AND IT IS THE ONE CLAIM BATCH A WAS SCOPED ON.**

This section used to read: *"Attempt record today (`useAppStore.js:1222`): `attemptId` (UUID) · `testId` · `dayKey` · `fraction`. Four fields where the standard specifies fourteen."*

**Read off `useAppStore.js:1224` on Aug 18, an attempt holds fourteen fields AND a per-question array:**

`attemptId` · `testId` · `kind` · `title` · `attempt` · `dayKey` · `at` · `right` · `total` · `fraction` · `percent` · `bandId` · `revisit` · **`rows[]`**

…and every row carries `questionId` · `lesson` · `chosen` · `answer` · `correct` · `skipped`. The comment above it has said so since it was written: *"The attempt row holds every question, what she picked, and whether it was right — not just the score."*

**So the per-item record the standard asks for mostly EXISTS for tests.** What is missing from it is the metadata, not the answers:

| Requirement | Status, re-checked on disk |
|---|---|
| `evidenceSource` on every item event | ❌ **0 files.** Confirmed |
| `attemptState` | ❌ **0 files.** Confirmed |
| `hintsUsed` · `responseMs` · `sessionId` | ❌ **0 files.** Confirmed |
| `attemptNumber` | ◐ `attempt` exists **per test**, not per item |
| Per-question record of a test | ✅ **`rows[]`, and it was here the whole time** |
| Per-question record of a warm-up or practice | ◐ `reviewItems.source` records **where a question was FIRST met** — `practice`, `warm-up`, `unit-test`, `quarter-test` — but only once, and per question rather than per answer |
| `beat.entered` / `beat.completed` | ❌ Confirmed |
| `baseline.captured` | ❌ Confirmed — every `baseline` hit in `src/` is the CSS class `items-baseline` |

**Why this matters more than a corrected sentence:** §32's Batch A was sized on the belief that test results are a fraction with no working behind them. They are not. **The work is adding fields to records that already exist, not building the records.** The one place there genuinely is no per-answer row is the warm-up.

*This is the audit's own failure mode, recorded rather than quietly fixed: it read a line number and reported a summary of it as the whole. §7.2 — add the structural fix, not just the bug fix. The structural fix is that this document is now checked against disk before anything is scoped from it.*

### §3.6 — Assessment engine

| Requirement | Status | Evidence |
|---|---|---|
| Item `difficulty` 1–5 | ❌ | **0 of 2,560** |
| Item `skillIds` | ❌ | **0 of 2,560** |
| Item `type` | ❌ | **0 of 2,560** — all implicitly multipleChoice |
| `hintLadder`, 3 escalating steps | ❌ | **0 of 2,560** |
| `solution` — method, not just answer | ◐ | `why` exists on all 2,560; states the fact, not the method |
| Per-distractor feedback | ✅ | all 2,560 |
| **Named misconception per distractor** | ❌ | **0 of 2,560** — blueprint calls a shared string *"a validation failure"*; per-choice text clears that bar, the named misconception does not |
| Two-tier mastery + `requiresSeparateSessions` + decay | ❌ | `BANDS` is a single cutoff ladder |
| Adaptive difficulty (d±1) | ❌ | no difficulty to step |
| Intervention ladder, 6 rungs with exit conditions | ❌ | `shakyLessons()` is a nudge with no ladder |
| Rubric `scoreMapping` sanity | ❌ | **all 3s = 75% = C** |
| Leitner spaced review | ✅ | `[1,3,7,16,35,70]` vs recommended `[1,3,7,14,30,60]` |
| `poolScope: "taughtSkillsOnly"` | ✅ | warm-up pool = questions from lessons actually read |
| Retrieval spaced across days, not within a sitting | ⚠️ | weekly test ✅; **the scored lesson test scoped Aug 18 violates this** |

### §3.9 — Persistence, the ten mandatory rules

| # | Rule | Status |
|---|---|---|
| 1 | Hot/cold hydration split | ❌ |
| 2 | Windowed queries always | ❌ **40 unbounded `toArray()`, 0 windowed reads** |
| 3 | Object-keyed loading | ❌ `db.js:478` |
| 4 | Version-flagged seeds | ✅ |
| 5 | Error handling mandatory | ❌ **0 try blocks** |
| 6 | One date utility, local | ✅ |
| 7 | UUIDs, never timestamps | ◐ 12 of 14 tables |
| 8 | Writes await before state updates | ✅ |
| 9 | Export/import first-class, versioned, diffing import | ◐ versioned ✅ · diffs ✅ · **not streamed, not transactional on read** · **`previewImport` never reads `data.version`** |
| 10 | Export-completeness guard, schema-driven | ◐ see §D1 |

### §3.10–§3.13

| Section | Status |
|---|---|
| §3.10 Diagnostic purpose declared on every assessment | ❌ |
| §3.10.4 Evidence Bound rule | ✅ |
| §3.10.6 Evidence separation | ❌ |
| §3.10.7 Placement expiry / re-diagnostic triggers | ❌ |
| §3.10.8 Baseline & growth, per instrument | ❌ |
| §3.11 Goals engine (five types, mandatory baseline) | ❌ **absent entirely** |
| §3.12 Term calendar as data | ✅ |
| §3.12.3 "Today is done" defined | ✅ |
| §3.12.4 Catch-up policy | ✅ per course since v3.25 |
| §3.12.5 Calendar-vs-mastery conflict rule | ✅ |
| §3.13 Grading queue, `ungraded` first-class | ◐ `writingMarks` holds marks not percentages ✅; **no queue, no `ungraded` state, no averaging policy** |
| §3.13.3 Comment returned to the learner | ✅ Notes channel |

### §4 — Accessibility (a launch gate, not a phase)

| Requirement | Status |
|---|---|
| `a11y.config.json` | ❌ absent |
| `reduceMotion` honoured | ❌ **0 files** |
| Dyslexia / low-vision / motor profiles | ❌ absent |
| Alt text on images | ❌ **0 files with `alt=`** |
| ARIA in use | ✅ `aria-current`, `aria-expanded`, `aria-hidden`, `aria-label`, `aria-pressed` |
| Read-aloud on every screen | ✅ and checked |

**Read-aloud is the strongest accessibility feature in the app and it is genuinely well built** — it follows the screen, speaks one branch not two, and is tested. The gap is the rest of §4.

---

## §C — WHAT THIS APP DOES BETTER THAN THE BLUEPRINT ASKS

Recorded because an audit that only lists failures misrepresents the thing.

- **Per-choice wrong-answer feedback on all 2,560 items.** The blueprint calls a shared distractor string a build failure. This app has never had one.
- **Every video verified at the source endpoint**, title recorded character for character, with rejected ids and the reason kept. The blueprint's §3.5 asks for external-reference verification; this exceeds it.
- **Reading level enforced per course with a cap *and a floor*.** The blueprint asks only for a tier ceiling.
- **Safety fences as executable checks** — dosing, body composition, self-diagnosis — with negative tests. The blueprint has no equivalent requirement at all.
- **Sixteen documented instances of a check being wrong**, each with the structural rule that came out of it. This is exactly §7.2's discipline, practised before the document existed.
- **Declared omissions carry a person's name, date and words**, and a stale declaration fails the build.

---

## §D — THE 26 CHECKS, MAPPED

| Check | Blueprint section it enforces |
|---|---|
| `check-sources`, `check-imports`, `check-jsx`, `check-hooks` | §5 build integrity |
| `verify-itembank`, `check-readability` | §3.6 item quality · §2 tier ceiling |
| `check-placement`, `verify-economy`, `check-room`, `check-garden`, `check-avatar` | §3.7 motivation |
| `simulate-diagnostic` | §3.10 placement |
| `check-schedule`, `check-yearplan`, `check-links`, `check-khan-units` | §3.12 scheduling |
| `check-import` | §3.9 rule 10 (partially) |
| `check-standards`, `check-curriculum-volume`, `check-sciencelab`, `check-videos`, `check-projects` | §3.2 content · §3.5 references |
| `check-assessment`, `check-delivery`, `check-writing`, `simulate-year` | §3.6 assessment · §3.13 rubrics |

**Blueprint requirements with no check behind them:** the entire event schema (§3.4), 8 of the 10 persistence rules (§3.9), evidence separation and placement expiry (§3.10), goals (§3.11), the grading queue and `ungraded` policy (§3.13), and all of accessibility (§4).

### D1 · The export guard is one link short

`check-import.mjs:214` derives the table list from **`exportAll()`'s return block**, then asserts `importBackup` reads each one. Export → import.

**The blueprint requires schema → export:**

> *"Every table declared in the persistence schema must appear in the export routine or on an explicit exclusion list with a written reason. **Enforced by a test that reads the schema** and fails on any unlisted table."*

**As written, a table added to `db.version(8).stores({...})` and forgotten in `exportAll()` passes this check silently.** That is precisely the `projects` bug the check's own header describes — approached from the other side. The comment says *"this one cannot be forgotten"*; the code forgets in one direction.

**~30 minutes. Highest value-per-hour item in this document.**

---

## §E — RECOMMENDED ORDER, USING THE BLUEPRINT'S OWN BATCHING (§7.6)

| | Work | Why here |
|---|---|---|
| **Now** | **Export-completeness guard, schema-driven** (§D1) · **`previewImport` reads `version`** · **rubric `scoreMapping` fix** | Half a day. The guard protects everything built after it; the rubric is a named defect landing on six graded pieces a year |
| **Batch A** | `evidenceSource` + `attemptState` on every answer · `baseline.captured` per track · placement `expiresOn` | §7.6: *"Baseline capture in particular must exist before any change you intend to evaluate."* **This must precede the scored-lesson work, or there is no baseline to measure it against** |
| **Batch B** | Two-tier mastery model · `advanceGate` · **then** the scored lesson test, rebuilt as a `test` beat · grading queue + `ungraded` | The thing Gigi asked for, built to the standard rather than invented. Interlocks — building them separately means building the interfaces twice |
| **Batch C** | Intervention ladder · lesson `status` field · item `skillIds` + `difficulty` + named misconceptions | Touches content authoring — do before any further content is written |
| **Batch D** | Accessibility profiles (§4) · goals engine (§3.11) · hot/cold hydration · windowed queries · data-layer error handling | Hardening. Large, and none of it blocks Azianna today |

**Deliberately NOT recommended:** re-architecting to the five-layer separation model. The cost is a rewrite; the benefit is portability to a subject this app will never teach. **The parts of that rule worth taking are the testable ones** — content in data, explicit order, stable ids — and those are largely already true.

---

## §F — WHAT I GOT WRONG ON AUG 18, RECORDED RATHER THAN QUIETLY DROPPED

1. **I asked Gigi to decide the rubric mapping.** The standard already settles it, in the same words. A conformance defect was presented as a matter of taste.
2. **I scoped a single binary pass bar** and offered to model its threshold. §3.6 forbids the shape outright, so the modelling would have measured the wrong thing precisely.
3. **I designed the end-of-lesson scored test as the course grade**, which §3.6 says measures recognition rather than retention.
4. **I wrote 65 new items in the old shape** — no `skillIds`, no `difficulty`, no named misconception — adding to the non-conformance while fixing a real hole. The questions themselves stand; they need tagging, not rewriting.
5. **I told Gigi the version was not in the nav bar.** It is — `SHORT_STAMP`, derived from `VERSION`. I reported an incomplete grep as a fact about the code, which is the exact failure this project has recorded sixteen times.

**The rule that would have caught all five:** *read the standard before proposing work against it.* The blueprint existed the whole time.

---

## OPEN, AND STILL NEEDING GIGI

| | |
|---|---|
| ~~**A fresh export off Azianna's laptop**~~ | **CLOSED — corrected v3.60 by reading the file, not the row.** `public/her-latest-export.json` is **byte-identical** to `claude/her-backup-2026-08-18.json` (md5 `bb9db407…`) and reads `version: 7`. It was swapped on Aug 18; this row went on saying Aug 13 / `version: 2` |
| **Whether "no more diagnostic re-takes" stands** | Settled policy; the blueprint calls it anti-pattern 17. A real conflict between a decision she made and the standard she chose |
| **The advocacy exclusion · the 3/5 Compromise video · the Black-scientists module · Ubongo / Super Sema** | Unchanged from the master plan |

*Audit produced Aug 18 2026 against blueprint v1.1. Every finding is reproducible from the code on disk.*
