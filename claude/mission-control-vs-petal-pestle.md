# Mission Control vs Petal & Pestle — a straight comparison

Read-only review of Lamar's app (`mission-control-homeschool-school-start-gate`)
against Azianna's, Aug 13 2026. Nothing in his folder was changed.

Sources read: `docs/STATUS.md`, `docs/PROJECT_PLAN.md`, `docs/PROJECT_LOG.md`,
`docs/MASTER_VISION.md`, `docs/MASTER_PLAN_REVIEW.md`, plus the source tree.

---

## 1. Scale

| | Mission Control (Lamar, 12, 7th) | Petal & Pestle (Azianna, 9, 4th) |
|---|---:|---:|
| Source files | 243 | 65 |
| Lines of code | 122,540 | 19,832 |
| Lessons written | 356 | 13 (78 outlined) |
| Verification scripts | 118 (27 top-level + 91 suites) | 17 |
| Database version | v31 · 38 tables | v4 · 12 tables |
| Achievement badges | 51 | 0 (Phase 3) |
| Parent dashboard sections | 30 | 10 tabs |
| School day | 5 hr 15 min | 4 hr |

His is roughly six times the app and thirty-one schema versions deep. Hers is
two days old. The gap is age and time, not ambition.

---

## 2. Where the two apps independently agree

These were arrived at separately, which is the strongest evidence they're right.

| Convention | His | Hers |
|---|---|---|
| Per-choice feedback, `null` in the correct slot | `choiceFeedback: [null, …]` | `feedback: [null, …]` |
| Never test material not yet taught | Cumulative Review + quarterly exam rule | enforced by `check-assessment` |
| A gate on retrying a failed exam | must play a Term Blitz first | must wait 2 days + re-read |
| Quarterly cumulative exams | 22 questions | 24 questions |
| Exam scores fold into the report card | `getReportCardData()` | Gradebook → Phase 4 |
| Choices must not reshuffle mid-click | memoised on the word list | seeded, deterministic |
| Scripts as a CI substitute, each written after a real failure | 118 | 17 |
| A "locked decisions — do not re-litigate" list at the top of the log | yes | yes |

---

## 3. Where they genuinely differ

| | Mission Control | Petal & Pestle |
|---|---|---|
| **Spacing** | **5-Day Study Cycle** before each quarterly exam. Day 1 study guide, Day 2 Term Blitz, Day 3 weak-spot drill, Day 4 Term Blitz, Day 5 the exam — each day gated on a real calendar day passing. | **Continuous Leitner queue** all year. Every question returns at 1, 3, 7, 16, 35, 70 days. 3 questions each morning. |
| **Between-quarter testing** | Per-lesson test at 90% mastery, then nothing until the quarterly | Unit test every 3–4 lessons |
| **Practice gate** | 80% practice accuracy before the test unlocks; below that the generator serves *more real practice*, capped at 2× | None — lesson checks are ungraded |
| **Immediate repair** | Exit tickets re-ask the exact questions missed, same sitting, ungraded | Deferred to the next morning's warm-up |

**On spacing, the honest verdict:** his is spaced *preparation* — it makes an
exam go well. Hers is spaced *retention* — it decides what's still there in May.
They solve different problems, and **each app would be better with the other's.**
A 5-day ramp before her quarter test would help her; a year-long review queue
would help him more than almost anything else on his open list.

---

## 4. Three things his app does that hers should

1. **A practice mastery gate.** His 80%-before-the-test-unlocks gate, with
   adaptive extra practice capped at 2×, is better than her ungraded lesson
   checks. As built, a child who has not understood a lesson can walk straight
   into the unit test. This is the clearest gap.
2. **Exit tickets.** Re-asking the exact missed questions in the same sitting
   catches confusion while she's still there. Deferring everything to tomorrow's
   warm-up is better for retention and worse for the moment.
3. **`STATUS.md` generated from the code, not written by hand.** His
   `generate-status.mjs` exists because a review found **13 wrong status claims**
   in the plan, four contradicting another section of the same document. Her
   build log is hand-written, so every number in it can drift — and has
   ("four strands" became five). Rule worth copying verbatim: *decisions and
   reasons are written by hand; anything countable is generated.*

---

## 5. Two things hers does that his doesn't

1. **A longitudinal simulation.** He has 118 checks and none of them plays out a
   calendar. `simulate-year.mjs` runs 40 school days and found two real bugs on
   its first run — a warm-up question reappearing in that afternoon's test, and
   a third attempt re-serving the paper she'd just failed. Neither is visible in
   a single sitting.
2. **A refusal to plan on a bad measurement.** `check-yearplan` refuses to build
   a year for a strand whose number is a ceiling rather than a measurement, and
   says why on screen. Software is usually bad at declining to produce output.

---

## 6. The rule of yours that Petal & Pestle is currently breaking

From the locked decisions at the top of his `PROJECT_LOG.md`:

> anything generative or content-based … must be sized for a FULL SCHOOL YEAR of
> use, not a sample or a "good start" … treat anything short of a full year as an
> **incomplete build**, not a phase to revisit "eventually."

Against that bar, Petal & Pestle is at **13 of 78 lessons, 65 of roughly 390
questions, 1 of 8 quarters.** It is blocked on Azianna's re-take, which is the
right reason to be blocked — but "v3.0 shipped" should not be read as done.

---

## 7. Housekeeping found while reading (his folder — not touched)

- **A stale nested duplicate** of the whole app at
  `mission-control-homeschool/mission-control-homeschool/`. 241 source files
  against the real 243, and one verification guard behind
  (`verify-daily-writing.mjs` missing). Same class of problem as the `pp-update`
  folder found in Azianna's setup — a second copy that looks authoritative.
- **`docs/STATUS.md` timestamp changed** at 01:18 UTC Aug 14. That was me: I ran
  `generate-status.mjs` to check whether it still worked, and it writes that
  file. Re-running it produces **byte-identical** output, so the contents are
  unchanged — only the modified date moved.
