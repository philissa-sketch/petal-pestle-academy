# NEXT SESSION — start here

**Paste everything below the line as your first message in the new conversation.**

**Where things stand:** the app is **v3.94 on disk**, the live site is **v3.93**. Two jobs are agreed and specified and neither has been started: **v3.95** (the two Reading courses off the Khan grades screen) and **the Gradebook rebuild** (subject cards, quarter rows).

**Before you start the new session:**

1. **Run `RUN-THE-CHECKS.bat`** if you have not since v3.94 landed. Only 13 of the 39 were run on Aug 29, and yours is the run that counts.
2. **Commit in GitHub Desktop.** Do not push — pushing spends Netlify build minutes you do not have until the end of September.
3. **The live site is still v3.93.** v3.94 is only on your computer. Deploy with `BUILD-FOR-NETLIFY.bat` and drag `dist` onto the Deploys page when you want it live.

---

## THE PROMPT — copy everything below

I am Gigi. I am building **Petal & Pestle Academy**, a homeschool app for my nine-year-old granddaughter **Azianna**, who wants to be a doctor and a herbalist. It is modelled on **Mission Control Homeschool Academy**, the app I built for my son Lamar.

**Read these first, in this order:**

1. `claude/petal-pestle-master-plan.md` — **§56 is the newest.**
2. `claude/petal-pestle-build-log.md` — every version, every bug, all 39 checks. **§6 Open items is where your job is.**
3. `claude/azianna-diagnostic-results.md` — **her measured levels. These govern everything.**
4. `claude/post-build-backlog-gigi.md` — **§7 is new.**

**The app is v3.94 on disk, at `C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy`, runs on `localhost:5180`, database `PetalPestleDB` at v12, 39 checks.**

**Lamar's app is at `C:\Users\pknot\Downloads\mission-control-homeschool-school-start-gate\mission-control-homeschool` and is READ-ONLY.** Read his **code**, not just his docs. `Lamar DOC` was deleted on Aug 26 — do not go looking for it.

### HOW I WANT YOU TO WORK — these are not suggestions

1. **Ask me before building. Then wait.** Do not surprise me with 40 files.
2. **Ask me questions as text. Never as a picker widget.**
3. **I do not use the command line.** I double-click `RUN-THE-CHECKS.bat`, `START-PETAL-PESTLE.bat` and `BUILD-FOR-NETLIFY.bat`. Never tell me to type a command.
4. **Never run `git` against my folder.** I use GitHub Desktop.
5. **⚠️ No Netlify build minutes until the end of September. Do not tell me to push.** Committing is free. `BUILD-FOR-NETLIFY.bat` builds on my computer so I can drag `dist` onto Netlify's Deploys page, which uses no minutes.
6. **Every fix gets a check that would have caught it, and you negative-test it by reintroducing the bug.**
7. **A green check is not a working app.** 38 were green while the Grown-Up Corner was down. **39 were green while Grammar carried 2 of its 10 units.**
8. **A check must never claim more than it tests.** Do not report checks you did not run.
9. **Verify against the disk — not against what I tell you, and not against the app's own comments.** A comment explaining why something is fine is not a check. This has now caused three bugs.
10. **A rule I have to act on is a CHECK, not a warning.** A rule that is only written down gets broken again.
11. **When I repeat a complaint, check the CHECK before you check the content.**
12. **A contradiction in what I asked for is a question, not a judgement call.**
13. **Never invent or guess a URL.** Open it in my browser and read the title off the rendered page. Write down every failed search.
14. **You have my browser. Use it.** Do not describe verification as something I should do later.
15. **Restart the dev server after every update — I do this, you cannot. Remind me.**
16. **Use a curly apostrophe (’) in JSX text.** A straight one breaks check-jsx's parser.
17. **You cannot delete on my machine** — move into `_to_delete/` and tell me what you moved.
18. **Update the master plan, the build log and `src/config/buildStamp.js` when you finish a version.**
19. **Anything countable is generated, never hand-typed.** Every hand-typed number in this project has drifted.
20. **Sizing rule, from Lamar's locked decisions:** content is built for a **FULL SCHOOL YEAR**. Anything shorter is an **incomplete build**, not a phase to revisit. **v3.94 is what happens when this is forgotten.**

---

## JOB 1 — v3.95 · the two Reading courses off the Khan grades screen

**My call, Aug 29, and I chose Option B.** Khan built no unit tests and no Course Challenge for 2nd or 3rd Grade Reading & Vocabulary, so they do not belong on a screen for recording Khan results.

**⚠️ This is not a deletion.** The `Mark complete` button on those rows is the **only** thing that advances her reading unit. `readingCheck.js` may never write a Khan grade — deliberate, in its own header — but it calls `nextUnitFor(courseId, grades)` to know where she is. Remove the rows and the Planner offers Unit 1 for ever: **the v3.74 bug exactly.**

**Option B:** the two courses come off the Khan screen, and a small **"finished this unit"** control moves into a reading section, so nothing is stranded and no reading grade is invented that Khan never gave.

`check-khan-advance` asserts that panel offers the whole catalogue and has to move with it.

---

## JOB 2 — the Gradebook · Tests tab

**My complaint:** *"The long list of randomness in the Test tab under Gradebook is confusing."* I want to open one place and see how she is doing in each subject.

### What is wrong now — all confirmed on disk

- The Tests table calls `allWeeks()`, which returns **104 weeks across four courses**, and renders every one of them under a heading that says **"Herbalism · Quarter 1"**. No column says which course a row belongs to, so two courses both print "Q1 Week 1". **She has sat 11 tests. I scroll 104 rows to find them.**
- **Lessons and the practice gate** filters `HERBALISM_Q1` only. She has read **23** lessons; it can only ever show the Herbalism ones.
- **`lessonLabel()`** searches `HERBALISM_Q1` only, so every Science Lab, Social Studies and Human Body question prints a raw id like `sl-m2-04`.
- The **Quarter 1 / Quarter 2 Exam** rows are hardcoded to `herbalism-q*-final`. The other three courses have no exam row.

**It is one bug repeated four times: this screen was written for Herbalism and three courses were added around it.**

### The shape I agreed

**Above everything, unchanged: "What is sticking."** Solid · Settling · Slipping, and the *worth sitting down with her about* list. ⚠️ **Keep it. Do not move it, shrink it, or soften a single number.** That screen's own header: *"A test score says how one morning went. That list says what is not sticking"* and *"the kindness is in where the number is shown, not in whether it is true."* **This screen is only ever seen by me.**

**Then one card per subject — FIVE cards:**

**Herbalism · The Science Lab · Social Studies · The Human Body · Language Arts & Writing**

**⚠️ NO MATHEMATICS CARD. Maths lives on the Khan grades tab and stays there.**

Each card:

- **Subject, letter grade, percentage** — and beneath it, what the number is made of: *"6 tests sat · 3 Khan units graded · 2 writing pieces marked"*
- **A row per quarter — Q1 Q2 Q3 Q4** — each with its own letter, its own percentage, and *"3 of 8 sat"*. A quarter she has not reached is greyed and says so. Never a blank, never a zero.
- **Click a quarter** → the weeks inside it. **Click a week** → the per-question detail, as it works today.

Khan grades, writing pieces and spelling results **fold into this screen**. Language Arts & Writing draws on Khan grammar, writing marks and spelling.

### Lamar's four rules — take all four, they are in his code

1. **Equal weight per assessment.** One Khan unit = one weekly test. His reason: *"any other weighting is a judgement someone has to defend to a reviewer."*
2. **Report each source separately as well as blended** — *"so the blend is never something she has to take on trust."*
3. **Omit what has not been started** — *"a wall of blank rows on day one reads as failure."* **This is what kills the 93 empty rows.**
4. **Show the breakdown, not just a headline letter** — *"far more likely to work on it than one handed a single blended letter that never seems to budge."*

**And read this before you build:** his parent said on Aug 10, *"The grades from Kahn Academy arent being saved anywhere."* They were saved — **nothing read them back.** Same complaint I made on Aug 29, in the same place. His `getReportCardData()` in `src/store/useAppStore.js` is the fix. **Read it.**

### The check

Fails if **any course is missing from any section of this screen**, or if a subject's card omits a quarter that has work in it. **Negative-test it by deleting a course from each section.** That is the bug, and it has happened four times in one file.

---

## OPEN, AND WAITING ON MY ANSWER

1. **⚠️ The "undo" button on a recorded Khan grade.** One click, no confirmation, and no actual undo — it deletes a Georgia record permanently and leaves no trace. Resetting all her data makes me type `RESET`; erasing a grade takes one click on a five-letter link that everywhere else in the world means "put it back". **It did not cause the Aug 29 scare, but it is still live.** Three options were put to me and I have not chosen: confirm before delete · mark deleted rather than erase, with a real undo · both, and rename the link.
2. **Reading as its own subject, like Mission Control's.** Recorded in `post-build-backlog-gigi.md` §7. His `reading7.js` is 3,835 lines of original passages with comprehension questions and verified book recommendations. Mine covers **one unit**. **Blocked until the grading work is done — my instruction.** ⚠️ `readAloud` per answer and a null `unaidedPercent` must survive it, and it may never write a Khan grade.
3. **`Lh8wC-qoqgw`** — the 3/5 Compromise video, Social Studies lesson 10. 5:13 and squarely about slavery. **I should watch it before it plays.**
4. **The advocacy exclusion**, the **Black-scientists module** for The Science Lab, and the **Ubongo / Super Sema** question for Science Lab lesson 23.
5. **Herbalism M13–M15 prose** — 18 lessons to split. Recorded debt, not urgent, Q4 is April.

---

## THINGS FOUND ON Aug 29 THAT YOU SHOULD KNOW

- **I have two databases and they had drifted.** The app is local-first: **the live site does not share data between devices.** Work entered on Azianna's machine is not on mine, at the same address. Three Khan grades I entered were never lost — they were in a backup file on my disk and imported back. **`netlify.toml` says it: "her work lives in the browser, filed under the exact address."**
- **The v11→v12 schema upgrade was proven safe on real data**, twice — the live record and an old localhost record from Aug 20. 21 tables, nothing lost. It is no longer a theory.
- **My Backup folder works.** Keep exporting before anything risky.

**Start by confirming back to me: the version on disk, the version on the live site, the check count, and what you intend to do first.**
