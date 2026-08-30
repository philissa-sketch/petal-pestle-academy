# NEXT SESSION — start here

*Written Aug 29 2026, after v3.95 went live. This file replaces a version that was stale at v3.40 for fifty-five versions — which is itself a cleaning job, and it is why it is the first one listed.*

**Where things stand: v3.95 is on disk AND live.** Both read `V3.95` — the nav bar on `localhost:5180` and the nav bar at `https://unrivaled-caramel-e28469.netlify.app/`. Nothing is stuck. All 40 checks were run and all 40 were green.

Before you start the new session:

1. **Nothing is owed.** No uncommitted work, no failed deploy, no red check. This is the first clean handoff in a while — do not let the new session start by fixing something.
2. **Take a backup** before any cleaning session. Grown-Up Corner → export. Cleaning is the category of work most likely to move something that mattered.

---

# THE PROMPT — copy everything below

I am Gigi. I am building Petal & Pestle Academy, a homeschool app for my nine-year-old granddaughter Azianna, who wants to be a doctor and a herbalist. It is modelled on Mission Control Homeschool Academy, the app I built for my son Lamar.

Read these first, in this order:

1. `claude/petal-pestle-master-plan.md` — §57 is the newest.
2. `claude/petal-pestle-build-log.md` — every version, every bug, all 40 checks. §6 Open items is where your job is.
3. `claude/azianna-diagnostic-results.md` — her measured levels. These govern everything.
4. `claude/post-build-backlog-gigi.md` — §7 is new.

The app is **v3.95 on disk and v3.95 live**, at `C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy`, runs on `localhost:5180`, database `PetalPestleDB` at v12, **40 checks**. Live at `https://unrivaled-caramel-e28469.netlify.app/`.

Lamar's app is at `C:\Users\pknot\Downloads\mission-control-homeschool-school-start-gate\mission-control-homeschool` and is READ-ONLY. Read his code, not just his docs. `Lamar DOC` was deleted on Aug 26 — do not go looking for it.

## HOW I WANT YOU TO WORK — these are not suggestions

1. **Ask me before building. Then wait.** Do not surprise me with 40 files.
2. Ask me questions **as text**. Never as a picker widget.
3. **I do not use the command line.** I double-click `RUN-THE-CHECKS.bat`, `START-PETAL-PESTLE.bat` and `BUILD-FOR-NETLIFY.bat`. Never tell me to type a command.
4. **Never run `git` against my folder.** I use GitHub Desktop.
5. **⚠️ RUN EVERY CHECK YOURSELF BEFORE YOU TELL ME SOMETHING IS READY TO COMMIT.** All 40, in batches if the whole suite times out as one command — it takes about three minutes that way. **v3.95 was pushed with a red check in it because 7 were run and the failure was in the other 33.** "The rest are yours to run" is not a report, it is a guess. Mine is still the run that counts; yours is what stops me finding out from Netlify.
6. Every fix gets a check that would have caught it, and you **negative-test it by reintroducing the bug**.
7. **A green check is not a working app.** 38 were green while the Grown-Up Corner was down. 39 were green while Grammar carried 2 of its 10 units.
8. **A check must never claim more than it tests.** Do not report checks you did not run.
9. **Verify against the disk** — not against what I tell you, and not against the app's own comments. A comment explaining why something is fine is not a check. This has now caused four bugs.
10. A rule I have to act on is a **CHECK**, not a warning.
11. When I repeat a complaint, **check the CHECK before you check the content**.
12. **A contradiction in what I asked for is a question, not a judgement call.**
13. **Never invent or guess a URL.** Open it in my browser and read the title off the rendered page.
14. **You have my browser. Use it.** Do not describe verification as something I should do later.
15. **Restart the dev server after every update** — I do this, you cannot. Remind me.
16. Use a **curly apostrophe (’)** in JSX text. A straight one breaks check-jsx's parser.
17. **You cannot delete on my machine** — move into `_to_delete/` and tell me what you moved.
18. Update the master plan, the build log and `src/config/buildStamp.js` when you finish a version.
19. **Anything countable is generated, never hand-typed.** Every hand-typed number in this project has drifted.
20. **Sizing rule, from Lamar's locked decisions:** content is built for a FULL SCHOOL YEAR. Anything shorter is an incomplete build, not a phase to revisit.

---

## THE JOB — clean and organise the app

**This is a cleaning session, not a feature session.** ⚠️ **I want a plan before you move a single file.** Cleaning is the work most likely to break something quietly, and everything below is already working today.

**Take a backup first and tell me you have reminded me.**

### What I already know is untidy — all confirmed on disk Aug 29

**1. `_to_delete/` is 6.5 MB and 52 files.**
It holds a whole stale `dist/` (one 3.4 MB bundle), **eleven old release zips** (`pp-v20` through `pp-v28`), four `.fuse_hidden*` files, and about eight `_*-tmp.mjs` scratch scripts from v3.86. Also `_archive-test`, `_movetest`, `_movetest2` and `.pp-drop` — empty folders left from earlier attempts to move things. **⚠️ It is excluded from git, so none of this is published — this is disk tidiness, not a safety problem.** It is my folder and my deletion; tell me exactly what to delete and I will do it.

**2. `src/config/buildStamp.js` is 328 KB and it ships to the browser.**
109 changelog entries, and `ParentDashboard.jsx` line 285 renders every one of them in the Grown-Up Corner. **That is a third of a megabyte of build history downloaded by a nine-year-old's Chromebook on every visit.** ⚠️ It also carries her first name 17 times and it renders on a public URL — that was decided and accepted at v3.87, do not re-open it, but the SIZE is a separate question nobody has asked. Options I want costed: keep the newest N on screen and move the rest to a file that is not imported; or split the changelog out of the module the app boots with.

**3. `TestView.jsx` imports `HERBALISM_Q1` directly.**
Found while rebuilding the Gradebook at v3.95 and deliberately not fixed there. It is the same bug the Gradebook had in four places — a screen that knows one course of four — and **this one Azianna sees.** `appCourses.js` has exported `ALL_LESSONS` and `lessonById` across all four courses since v3.25. `check-gradebook` does **not** cover it; that check asserts the Gradebook panel only.

**4. Nothing asserts that every course has a place on the timetable.**
`check-schedule` asserts a block exists for **Herbalism only** — "the signature course". A course could fall off the schedule entirely and all 40 checks would stay green. I was offered this check on Aug 29 and did not answer. ⚠️ **And there is a real number behind it: The Human Body has 64 lessons and exactly 64 slots a year** — two a week on the rotating 2:45 block, 32 teaching weeks. **Zero slack.** Social Studies has 16 spare. Herbalism has 64.

**5. Dead and duplicated code.**
221 files, ~111,000 lines in `src/`. I want to know what is not reachable — exports nobody imports, components nothing renders, config nothing reads. Do not guess at this; the app has been bitten repeatedly by things that LOOK unused. **Prove it with the parser, the way `check-undefined` does, not with a text search.**

**6. `check-sources` cannot see a regex literal.**
Known, worked around in `readingLoad.js` with `\u0027`/`\u0022` escapes. Recorded, not urgent.

### How I want the cleaning done

- **One thing at a time, and a check for each** where a check makes sense. A cleaning session with no checks is how something quietly stops working.
- **⚠️ Nothing that changes what is on Azianna's screen** without asking me first. Tidying is not a reason to reword her app.
- **Run all 40 after every step**, not at the end. If a step goes red, I want to know which step.
- Anything you cannot delete, **move to `_to_delete/` and list it for me.**

---

## OPEN, AND WAITING ON MY ANSWER

1. **⚠️ The "undo" button on a recorded Khan grade.** One click, no confirmation, no actual undo — it deletes a Georgia record permanently and leaves no trace. Resetting all her data makes me type `RESET`; erasing a grade takes one click on a five-letter link that everywhere else means "put it back". Three options were put to me and I have not chosen: confirm before delete · mark deleted rather than erase, with a real undo · both, and rename the link.
2. **v3.96 — the two Reading & Vocabulary courses off the Khan grades screen.** My call, Option B. ⚠️ Not a deletion: the `Mark complete` button there is the only thing that advances her reading unit, and removing the rows gives the v3.74 bug back. **Still needed before it can start: WHICH SCREEN the "finished this unit" control moves to.** Asked, not answered.
3. **Reading as its own subject.** ⚠️ **The blocker is now cleared** — I said "after the grading work" and the grading work shipped at v3.95. Her two reading checks (`read-ela2-u1`, 25% then 75%) still reach no subject grade and the Language Arts card says so. Lamar's `reading7.js` is 3,835 lines; mine covers one unit. `readAloud` per answer and a null `unaidedPercent` must survive it, and it may never write a Khan grade.
4. **`Lh8wC-qoqgw`** — the 3/5 Compromise video, Social Studies lesson 10. 5:13 and squarely about slavery. **I should watch it before it plays.**
5. The advocacy exclusion, the Black-scientists module for The Science Lab, and the Ubongo / Super Sema question for Science Lab lesson 23.
6. **Herbalism M13–M15 prose — 18 lessons to split.** Recorded debt, not urgent, Q4 is April.
7. **The 13 flat cards** — `hb-1-01`–`hb-1-13` carry no `course`, `quarter`, `week` or `standards`, so they cannot be filtered, capped or reported to Georgia. They DO carry `words:`. **Fix before the skill-tagging pass, not after.**

## THINGS FOUND RECENTLY THAT YOU SHOULD KNOW

- **v3.94 was red from the day it was built and that is why the site sat on v3.93 for six days.** `check-assessment` forbids the words "unit test" on any screen; v3.94 put **Khan's** links on the grading screen in **Khan's** wording. The deploy was refused, the old site correctly stayed up, and **nobody read the reason** — v3.94's run status says 11 of 39. Fixed at v3.95 with an exemption enumerated by name, scoped to one file, and ratcheted so it cannot outlive its reason. **Sixth time a check here has failed correct content.**
- **My app is local-first and the live site does not share data between devices.** Work entered on Azianna's machine is not on mine, at the same address. `netlify.toml` says it: "her work lives in the browser, filed under the exact address."
- **The v11→v12 schema upgrade was proven safe on real data, twice.** 21 tables, nothing lost.
- **My Backup folder works.** Keep exporting before anything risky.
- **Azianna's test load is the thing to watch, not her scores.** Aug 26: four assessments, 75/63/60/50 falling through the day. Aug 28: three, all 38%. Every re-take she sat on a light day went UP. The Gradebook now shows "How much was asked of her" per day, and her best beside her latest.

**Start by confirming back to me: the version on disk, the version on the live site, the check count, and what you intend to do first.**
