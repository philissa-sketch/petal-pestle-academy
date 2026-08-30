# Petal & Pestle — Gigi's post-build backlog

**Captured Aug 14 2026, from Gigi's own words.**

**Progress as of Aug 16, v3.19:** §1.1 ✅ · §1.2 ✅ · §1.3 ✅ · §1.4 ✅ · §2 ✅ · §3 ✅ · §5 ✅ · §6 ✅ · **§4 in progress**
**→ §4.1 is half done. The Khan half is being rebuilt in its own conversation — `claude/KHAN-BUILD-PROMPT.md`.**

---

## 1. BUGS — things that are wrong, not missing · **ALL FOUR DONE**

### 1.1 She was paid for doing nothing · ✅ **v3.12**
> *"she seems to have received awards for not doing anything. She only completed 1 full day of school and there was already over 500 petals and 216 golden seeds."*

The Check-In alone paid **715 petals and 260 golden seeds** before a single lesson, while a whole school year paid 1,520 petals and **zero golden seeds** — nothing in the curriculum minted a seed at all. Rates cut ~4× to one flat completion bonus; **golden seeds now come from schoolwork**.

**Gigi's call, recorded:** rebalance and reset, **but Azianna keeps what she already bought.**

### 1.2 A message written on Gigi's computer did not survive the export · ✅ **v3.13**

**Every link in the chain was correct** and I said so rather than shipping a guess. The hunt instead found `check-import` claiming more than it tested, and **projects in none of the backup paths** for three versions.

**Locked decision:** *a check must never claim more than it tests.*

### 1.3 A diagnostic re-take can serve the same questions again · ✅ **v3.14. Two bugs.**
> *"For the tests that she has to take over in the checkin does it have different questions in it?"*

`reopenStrand()` cleared `seenItemIds`. Fixed with `reopenStrandState(prev)`. **The second bug:** all four ELA strands held 15 items against a sitting of 8, so **60 new hand-written items** took every strand to 30.

**Her five re-takes are unblocked.**

### 1.4 "Load her data" is not understandable · ✅ **v3.17**
> *"I don't understand the 'load her data' tab."*

The old copy opened with a **correction** and never said what the screen was **for**. Rewritten as **"Bring her work onto this computer"** — what the file is, where it comes from, what happens after. **Two rules exist purely to stop a future tidy-up cutting the last two.**

---

## 2. FRIDAY · ✅ **v3.10, v3.11 and v3.17**

> *"I always stated the week was mon - fri so I felt that the 3 learning days and test was mon-thurs and if she didnt finish everything she will have to make it up friday."*

**Friday is an addition, not a redefinition.** `catchUp.js` answers "what am I behind on" **without a calendar**. Three states and no fourth; never counts how late she is; never blocks. **16 projects** delivered here too.

**The leftover closed at v3.17:** Friday is now the second half of the Today tab, so the catch-up day sits inside the week it belongs to.

---

## 3. NAVIGATION · ✅ **v3.17**

| Merge | Into | |
|---|---|---|
| My Plan · My Courses · My Lessons | one tab | ✅ **My Learning** |
| Today · Check-In | one tab | ✅ **Today** (+ Friday) |
| My Greenhouse · Market | one tab | ✅ **My Greenhouse** |
| Everything about the diagnostic | its own tab | ✅ **Check-In** |
| Import · Export · Backup | all under Settings | ✅ **Grown-Up Corner → Settings** |

**Her nav: 12 tabs → 6. The Grown-Up Corner: 11 panels → 6.**

**Her list contained one contradiction and she settled it** — the Check-In that belongs on Today is her **daily** one, the morning warm-up. **Asking cost one message; guessing would have cost a rebuild.**

**Why nothing broke:** every section is named after the tab it replaces, so all 22 navigate calls still work untouched. A check reads every one and fails the build if a button points somewhere the nav no longer reaches.

---

## 4. MISSING — **IN PROGRESS**

### 4.1 Records and grades · **HALF DONE**

| | |
|---|---|
| **Georgia hours ledger** | ✅ **v3.18** — see below |
| **Khan grade entry** | ⚠️ **v3.19 built it, and Gigi redirected it.** Being rebuilt **by unit completed** |
| **Gradebook tabs per app-taught course, sectioned by quarter** | **OPEN** |
| **My Levels should hold her grades** | **OPEN** |
| ~~Where do her projects live?~~ | ✅ v3.10 — **but they still need a browsable area of their own**, not just Friday |

**✅ The hours ledger — v3.18.**
> *"Where are the hours counted for the Georgia standards? There is no hours ledger anywhere in the app. For a homeschool record in Georgia this is not optional."*

**Grown-Up Corner → Report → Hours (Georgia).** The requirement was **looked up, not remembered** — O.C.G.A. § 20-2-690 via HSLDA and the Georgia Home Education Association, Aug 16 2026: **180 days, each at least 4½ hours**, covering the five named subjects; attendance **kept privately, not submitted**. Her full day is **5.5 hours against Georgia's 4.5**.

It counts **the same ticks the garden grows on** — one source, with a check that fails the build if the two ever disagree. **A short day is school without being a qualifying day**, and both numbers show. **It says out loud what it cannot see.** And **ticking lunch was adding twenty minutes to a legal record** until its own negative test found it.

**⚠️ Khan grades — redirected.**

v3.19 shipped free-text unit names and a mastery percentage. **Gigi:**

> *"The grades for Khan Academy should be by unit completed. Look at Lamar's master plan regarding how his Khan Academy is graded."*
> *"You are able to look up each unit and add the correct links from Unit 1 through whatever Unit the lesson ends. Azianna will be graded by the unit test at the end of the week and the course challenge when she completes all the units. I will manually put in the fraction grade and the app should change it to a percentage and letter grade. Just like in Lamar's Master Plan."*

**The data layer is right and survives** — `khanGrades` at DB v6, UUID-keyed, in the export and the import, merging as a union. **The screen and the grading do not.** Full brief in `claude/KHAN-BUILD-PROMPT.md`, **and it needs her answer on the grade scale** — on the standard school scale 9/10 is an A; on Lamar's Khan table it is a B, because that table describes Khan's *mastery labels* rather than a test score.

### 4.2 The Journal · **OPEN — needs Gigi's decision, not a build**
> *"Her journal is entered but there isn't a way to grade it or give feedback."*

The locked decisions say **nothing in the Journal is graded or corrected**. Feedback is not the same as grading, so the likely answer is **a private note from Gigi that is not a grade and does not score** — but it is her decision.

### 4.3 Export in both directions · **OPEN**
> *"There isn't an export to export what she does on her computer so I can import it onto mine."*

Today's export runs parent → child. `check-import` already has the parity rule to build the round trip on.

### 4.4 Weekly spelling and vocabulary · **OPEN**
> *"create weekly spelling and vocabulary with daily puzzles, and learning, before the test."*

A weekly word list, a daily puzzle, a test at the end of the week. Fits the Thursday test day directly.

---

## 5. THE ECONOMY AND THE ROOMS · ✅ **v3.15 and v3.16. Both diagnoses were backwards.**

**v3.15 — *"Greenhouse items have nowhere to go"*, and she named the windows.** `check-placement` was **right** — every item had a place. **The room had built surfaces and nothing for sale ever went on any of them.** For eleven versions **21 of 22 purchasables stood on the floor**. Ten new things went onto the sill, shelves and bench · four keystone pieces at 300–450 · **Room Looks**, a category that did not exist.

**v3.16 — *"there isn't anything on the walls or ceiling everything is jammed in the same area"*.** `check-room` printed *"left 7 · back 6 · right 6"* and passed, because it counted an item's **`u`** — so a shelf on the **floor** beside the left wall counted as the wall being used. **That rule was written after her v2.1 note. It let the identical problem come straight back.**

| | v3.15 | v3.16 |
|---|---|---|
| Items in one 120px band | **13 of 22 (59%)** | **10 of 30 (33%)** |
| In the top third | **2**, both at x 800 | **6** |
| Mounted high on a side wall | **nothing** | left 2 · right 5 |

**The locked decision from this section, and it is the important one:**
> **When Gigi repeats a complaint, check the CHECK before checking the content.**

---

## 6. THE GARDEN · ✅ **v3.15**

> *"'Your Garden' I prefer it comes from seed and grow to a flower so that she can see real change."*

**The old screen could not have done that** — one stem per strand, height set by her measured level, moving twice a year, with her two weakest strands drawn as the two shortest plants.

**Now: one plant per subject, growing on the days she worked it.** Seed → sprout → leafy → bud → flowering at 0 · 1 · 5 · 15 · 30 days, then a bloom every 20 days to 8 — **all eight at 170 days, a full school year.**

**Effort, never accuracy. Nothing is ever stunted.**

---

## 7. How this list should be worked

1. ~~§1 bugs~~ ✅ all four.
2. ~~§2 the week shape~~ ✅ settled, built, leftover closed.
3. ~~§3 navigation~~ ✅ one pass, with §1.4 inside it.
4. **§4 is what remains.** The hours ledger is done; **the Khan half is being rebuilt by unit in its own conversation.** Then the Gradebook tabs, My Levels holding her grades, and a browsable projects area. **§4.2 needs her answer first.**
5. ~~§5 and §6~~ ✅ both done.

Every item gets the same treatment: **a check that would have caught it, negative-tested by reintroducing the bug** — a check that never claims more than it tests, a rule she must act on is a **check** rather than a warning, **when she says the same thing twice the guard is the first suspect**, **a contradiction in what she asked for is a question**, and **a legal figure is looked up, never remembered**.

---

## 7. READING AS ITS OWN SUBJECT, LIKE MISSION CONTROL'S

**Gigi's instruction, Aug 29 2026:** *"Add for later after the grading is fixed, that the reading check should be created for reading like Lamar's in the mission control homeschool."*

**⚠️ BLOCKED UNTIL THE GRADING WORK IS FINISHED.** Her words, and the order matters — v3.94 and v3.95 come first.

### What she is asking for, read off his disk rather than guessed

`mission-control-homeschool/src/data/lessons/reading7.js` — **3,835 lines.** His reading is **not a Khan course at all.** It is:

- **original passages** written for the curriculum, so there is no copyright question
- comprehension questions on each — main idea, vocabulary in context, inference
- **real, published, verified book recommendations** shown on the debrief, with publisher-stated reading ages
- per his parent instruction, history and biography passages about **Black Americans in aerospace**

Reading is a subject that grades itself. Khan is not involved.

### Why hers needs it

Khan built **zero** assessments for elementary ELA — counted on the rendered page: 77 links, none of them a test. So `ela2` and `ela3` carry `graded: 'parent'` and the mark was always meant to come from Gigi by hand.

`src/lib/readingCheck.js` is the first step of this and already exists — **it was built in direct response to Gigi on Aug 25**, quoted in its own header:

> *"There are no unit tests. How can we test her. In Lamar's app we have passages that he has to read and is tested on it."*

**It covers one unit.** `src/data/reading/ela2Unit1.js`, and `READING_UNITS` has a single entry. His covers a year.

### ⚠️ The two rules that already exist and must survive the build

1. **`readAloud` is recorded per answer, and `unaidedPercent` is null when everything was read to her.** 54 of her 86 recorded answers were read aloud — 63% — and 5 of her 6 Reading Comprehension answers. **Her independent reading has never been measured by anything.** A reading check that does not record whether she was read to produces one more listening score wearing a reading score's name, which is worse than no score because it looks like the blank was filled.
2. **It may never write a Khan grade.** A paper this app wrote must not advance a Khan unit Khan has never seen.

### The sizing rule this must be built against

`mission-control-vs-petal-pestle.md` §6, quoting Lamar: content is sized for a **FULL SCHOOL YEAR**, and anything short of one is an **incomplete build**. **v3.94 is what happens when that is forgotten** — a Khan course carrying two of its ten units for thirteen days, green the whole time. One reading unit out of a year is the same shape. **Blueprint the whole year before writing passage one.**
