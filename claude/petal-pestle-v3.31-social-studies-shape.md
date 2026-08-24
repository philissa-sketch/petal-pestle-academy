# v3.31 — Social Studies drops to three quarters, and a guard that had been off since v3.9

**Aug 17 2026. 25 automated checks, all passing on Gigi's disk. No lessons written this version — this is the shape, locked in code before anything is built on it.**

---

## What Gigi asked for

> *"I would prefer the human body to have full year courses. Social Studies can have 2 qtrs or 1 if it doesn't really matter."*

Then, given the arithmetic: **"I choose B."** And on how to build it: **"I choose B1."**

---

## Why two quarters could not hold it

The 2:45 block has **four lesson days** — Mon to Thu. Friday is catch-up and introduces nothing new. That is **128 lesson slots for the year**, split between two courses.

| | Slots |
|---|---|
| The Human Body, full year, 2 days a week | 64 |
| Left for Social Studies | **64**, spread over four quarters at 2 a week |

To spend all 64 inside **two** quarters, Social Studies would need four days a week in those quarters — and The Human Body is sitting on two of them. So *full-year Human Body* and *two-quarter Social Studies* together means **32 lessons for roughly 37 Georgia elements.**

**Fewer lessons than elements is a survey, not a course.** And the elements that thin out first are the ones Gigi has already said are not negotiable: **SS4H4 abolition and suffrage · SS4H6c sharecropping · SS4H6d Jim Crow.**

**Three quarters gives 48 lessons — about 1.3 per element.** Quarter 4's Monday and Wednesday go back to the garden and her projects.

| Shape | Social Studies | Human Body | |
|---|---|---|---|
| A — alternate by quarter | Q1+Q3, 4 days = 64 | Q2+Q4, 4 days = 64 | Human Body not full-year |
| **B — chosen** | **Q1–Q3, 2 days = 48** | **all year, 2 days = 64** | Q4 Mon/Wed open |
| C — as literally asked | 2 quarters = 32 | all year = 64 | 0.9 lessons per element |
| D — Human Body absorbs | Q1+Q3 = 32 | 96 | biggest course carries no Georgia element |

---

## The hard part: the timetable has no calendar, and must not grow one

To say *"Monday is open in Quarter 4"* the app has to know which quarter today is in. **There is no date-to-quarter function anywhere in `src/`, on purpose.** `catchUp.js` states the reason:

> *The app does not map curriculum week 1 onto a date, and it should not: she is homeschooled, weeks get moved, and a schedule that scolds her for a family trip is a schedule she stops opening.*

So the rotating block does not learn about the calendar. **It uses the marker the app already trusts everywhere else — her own progress.**

Monday and Wednesday hand to Social Studies for as long as it has a week she has not finished. When she has read every lesson of its last week, those two half-hours read **Garden & Projects**.

**Self-correcting in both directions.** Run long and the days stay hers until she is actually done. Race ahead and the garden time arrives early, because she earned it. **Nothing needs a date to be right.**

### And unwritten is not finished

Social Studies has zero lessons today, so `WEEKS.social` does not exist. Treating "no weeks" as "done" would have **quietly deleted the course from her timetable before a word of it was written.** A course runs out only when it **has** weeks and she has read every lesson in all of them.

---

## The guard that had been switched off since v3.9

`curriculumPlan.js` said Herbalism was `state: 'building'` with **all 96 lessons written**, and carried a comment explaining why:

> *"The course still is not marked 'complete': that flag means the whole app's curriculum claim, and three other courses have nothing."*

**No check ever read it that way.** `check-standards.mjs`, line 205:

```js
if (c.state === 'complete' && missing.length) { errors.push(...) }
```

The hard failure on a Georgia element with no lesson fires **only for a course marked complete**. So one word switched the guard off over **96 lessons and 10 Georgia elements for twenty-one versions** — while the report printed a confident `10/10 elements taught · BUILDING`.

**A state that understates is not the safe direction. It is the direction that stops a check from running.**

The Science Lab was marked complete at v3.30 with three other courses still empty, so the per-course meaning had already won in practice. Herbalism was the last holdout on a meaning nothing implemented.

---

## Four new rules in `check-curriculum-volume`, seven negative tests, all seven catching

| # | The bug put back | Caught |
|---|---|---|
| 1 | `blk-social` declaration removed → Q4 Mon/Wed is a hole | ✅ |
| 2 | Herbalism flipped back to `'building'` | ✅ |
| 3 | TodayView stops passing `lessonsRead` | ✅ |
| 4 | `ROTATION_ENDS.social` deleted | ✅ |
| 5 | `ROTATION_ENDS` disagrees with the plan about when the course stops | ✅ |
| 6 | Social Studies quietly put back to four quarters | ✅ |
| 7 | A course marked `'complete'` with lessons missing | ✅ |

**What the rules are:**

- The rotating block is walked **quarter by quarter**, not only weekday by weekday. A day whose course does not run in that quarter is a hole.
- `DECLARED_EMPTY` gained a **per-day** field, so *blk-social Mon/Wed in Q4* is declared with a reason instead of discovered.
- A rotating course that ends early must **say so in the lib** and agree with the plan about when.
- A course that has written **every lesson it owes** may not call itself `'building'`.

Plus twelve behaviour tests on the run-out rule itself — unwritten, partly read, fully read, full-year course, Friday, Saturday, and the no-progress-passed fallback.

---

## The check was wrong before the screen was

Its first draft matched TodayView's calls with `fn\([^)]*\)`. That regex **stops at the first close paren** — so `blockLabelOnDay(b, new Date(), undefined, lessonsRead)` was read as ending at `new Date()`, and **every correct call was reported as a bare one.**

**Rule six: when a complaint repeats, check the CHECK before the content.** Replaced with a real parenthesis scan rather than weakened.

## And the summary line stopped overclaiming

It used to end *"every block is covered all four quarters"*. That stopped being true this version. It now names the number of block-days deliberately left open — **ten** — and prints the reason for each.

**A check must never claim more than it tests, least of all in the one sentence a reader remembers.**

---

## ⚠️ Stated plainly: one thing is not yet observable

**The Garden & Projects label cannot appear on her screen until Social Studies has weeks to finish, and it has none.** The rule is tested against synthetic weeks and every case passes. **It has not been seen on her real data, and is not claimed to have been.**

---

## Where the counts landed

| | Before | After |
|---|---|---|
| Lessons owed, whole app | 272 | **256** |
| Lessons written | 144 (53%) | **144 (56%)** |
| Social Studies owed | 64 | **48** |
| Courses marked complete | 1 | **2** |
| Georgia science elements guarded by a hard failure | 15 | **25** |

---

## What comes next, and in this order

1. **Transcribe Georgia's 4th-grade Social Studies standards verbatim from the GaDOE document** into `src/data/standards/georgiaSS4.js`. Extend `check-standards` to both subjects. Correct the comment in `georgiaScience4.js` that claims that file already exists.
2. **Settle 12-vs-13 standards and 35-vs-37 elements from the primary source.** A county reproduction counts 12 and 35; the gap is probably SS4CG2 and SS4E2, which carry no letters. Not settled from a secondary source.
3. **Blueprint 48 lessons**, videos found and verified before any prose.
4. **⚠️ Needs Gigi:** whether SS4E2 (personal budget — income, spending, saving, credit) stays if 48 lessons gets tight.
