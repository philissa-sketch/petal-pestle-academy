# v3.20 — the schedule opens the unit, and three link bugs are gone

**Aug 16 2026. 23 checks, all passing on Gigi's disk.** Stamped in `buildStamp.js`; the nav bar should read **v3.20**.

First slice of Quarter 1 — the link work: *"the correct links linked to the schedule in the app as done in Lamar's Doc"*.

---

## THE RENDER PASS — 28 addresses opened in a browser

**Gigi's challenge, and it was the right one:** *"You verified a browser to use why are you not using it?"*

The first pass confirmed unit **slugs** off Khan's course pages and then described re-checking as "a browser job for a human". That was a gap: **reading a slug off a list is not the same as opening the address the file builds.** A slug can be right and the URL still dead — stale base, bad join, a rename. That is exactly how `cc-second-grade-math` survived for months.

So every assembled URL was opened, one at a time:

| | Opened | Result |
|---|---|---|
| Units | **16** | every `h1` matched its name exactly — *"Unit 6: Measurement"* |
| Unit tests | **10** | every title matched — *"Measurement: Unit test"* |
| Course challenges | **2** | both live |
| | **28** | **nothing returned "Oops!" — nothing to write down as unconfirmed** |

**Two claims now live in the data, and they are different claims:**

| field | means |
|---|---|
| `confirmedOn` | the name, number and slug were read off Khan's rendered course page |
| `renderedOn` | **the URL this file builds was opened and came back with the matching heading** |

The check requires both, and fails if `renderedOn` is older than `confirmedOn` — units re-confirmed after anyone last opened them is drift waiting to happen.

---

## What shipped

### 1. Her schedule opens the unit, not a page of units

`resolveBlockTarget()` handed back `khan.courseUrl` — a course index of eight to fourteen units. First thing Gigi listed as wrong with v3.19: *"Links to the course front page"* → should be *"the unit itself"*.

At her real measured levels:

| Block | Opens |
|---|---|
| Mathematics | `/math/cc-2nd-grade-math/cc-2nd-measurement-data` — **Unit 6, Measurement** |
| Reading | `/ela/cc-2nd-reading-vocab/…fairy-tales-retold` — **Unit 1, Fairy Tales Retold** |
| Language Arts & Writing | `/humanities/grammar/parts-of-speech-the-noun` — **Unit 1, the noun** |

`unitUrl` is non-null only where confirmed. Unconfirmed quarters fall back to `courseUrl` — degrade, never guess.

### 2. The 2nd grade maths link was dead

`math2` pointed at `/math/cc-second-grade-math`. Rendered twice: **"Oops! Page not found"**. Live: `/math/cc-2nd-grade-math`. Her Geometry (2.00) and Measurement (2.00) both route there — the course her plan opened most, opening an error page.

### 3. Eight unit names in the app do not exist on Khan

| Band | Said | Khan calls it |
|---|---|---|
| `fractions-decimals` ≤2.99 | Equal parts of circles and rectangles | **Geometry** (2nd grade has no fractions unit) |
| `measurement-data` ≤2.99 | Measurement and data | **Measurement** (Data is a separate Unit 7) |
| `reading-comprehension` ≤3.99 | Reading informational text | **Pets** |
| `vocabulary` ≤3.99 | Vocabulary | **Pets** |
| `writing-strategies` ≤3.4 | Reading informational text (writing…) | **Pets** |
| `reading-comprehension` ≤2.99 | Reading for understanding | **Fairy Tales Retold** |
| `vocabulary` ≤2.99 | Building vocabulary | **Fairy Tales Retold** |
| `writing-strategies` ≤2.99 | Writing about what you read | **Fairy Tales Retold** |

**The links resolved, so the wrong label was invisible.** All three ELA strands point at Unit 1, and the file says why: Khan's elementary reading units are a **sequence**, not skills to map a strand onto. A mapping would read as precise and be arbitrary.

### 4. `src/data/khan/khanUnits.js` — new

| Course | Units | Unit tests | Course Challenge |
|---|---|---|---|
| 2nd Grade Math | 8 | 8/8 | ✅ |
| 2nd Grade Reading & Vocabulary | 3 | **0/3** | ❌ |
| 3rd Grade Reading & Vocabulary | 3 | **0/3** | ❌ |
| Grammar (Units 1–2 only) | 2 | 2/2 | ✅ |

**Quarter 1 scope on purpose.** 3rd grade maths arrives when Q2 is built, 4th when Q3 is. Writing a link down months before use is how a file fills with unit names that were true once.

Helpers: `courseUrl` · `unitUrl` · `unitTestUrl` · `courseChallengeUrl` · `unitFor` · `unitByName` · `KHAN_UNIT_COUNT`.

---

## Check #23 — `scripts/check-khan-units.mjs`

Provenance (`confirmedOn` **and** `renderedOn` real dates, in order) · units 1..n, no gaps, no duplicate slugs · **a unit link is never its own course front page** · every `unitCourse`/`unitN` resolves · **every unit name matches Khan's own** · a band never links a unit of another course · **the three Khan blocks open an exact unit at her real recorded levels**.

**Ten negative tests, all ten caught.** Files restored byte-for-byte, check re-run clean.

### A negative test found a fault in the new code before it shipped

`exact` was `Boolean(khan.unitUrl)` — computed from whether a unit link *existed*, not the URL actually returned. The course-front-page bug could be restored with the flag still reading "exact". **A flag that can disagree with the thing beside it will eventually be believed.** Now `exact = Boolean(khan.unitUrl) && url === khan.unitUrl`.

### What the check still cannot do

It cannot tell you the pages are **still** live today. Khan answers HTTP 200 for a dead course and renders the error in JavaScript; a dead course's `<title>` is byte-identical to a live one; the public API is gone (`410 API removed`). Only a rendering browser knows — which is why `renderedOn` exists and why the check prints its own blind spot on every run. **A check must never claim more than it tests.**

---

## Files touched

`src/data/khan/khanUnits.js` **new** · `src/data/khan/khanMap.js` (dead URL, 8 wrong names, bands bound, `khanFor()` returns `unitUrl`) · `src/lib/blockLinks.js` (opens the unit; honest `exact`) · `scripts/check-khan-units.mjs` **new, #23** · `src/config/buildStamp.js` v3.19 → **v3.20**.

Every change made in place. Nothing copied over an existing file.

---

## Still owed

- **Restart the dev server** — the nav bar must read **v3.20** or it did not land.
- Master plan and build log still need the **v3.18 · v3.19 · v3.20** merge.
- **Azianna's laptop is still on v2.8.**
- Next in Q1: **The Science Lab blueprint** and **Social Studies blueprint** (24 lessons each against the real Georgia elements), then the **240 spelling and vocabulary words**.
- The Khan **grades** screen — fraction entry on Lamar's +/− ladder, own Grown-Up Corner tab, Course Challenge gating. `khanUnits.js` is its data layer.
