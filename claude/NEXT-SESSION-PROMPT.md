# NEXT SESSION — start here
*Rewritten Aug 24 2026, end of the Khan / GitHub / annual-report session. Everything below the line is for Claude.*

**Where things stand:** the app is at **v3.78**, **all 32 checks green**, live at **https://unrivaled-caramel-e28469.netlify.app/**, and it now **deploys itself from GitHub**. Azianna is on an Acer Chromebook and it holds the only live copy of her data.

**Three things worth knowing before the new session starts:**

1. **The previous version of this file was wrong about the biggest thing in it**, and a session acted on it. See "What the last handoff got wrong".
2. **Her data moved and then moved again.** The Chromebook is the live copy. The old laptop is frozen history.
3. **Azianna sat her second Check-In on Aug 24.** Nobody has read the results yet. That is the first job.

---

## THE PROMPT — copy everything below

I am Gigi. I am building **Petal & Pestle Academy**, a homeschool app for my nine-year-old granddaughter **Azianna**, who wants to be a doctor and a herbalist. It is modelled on **Mission Control Homeschool Academy**, the aerospace app I built for my son Lamar.

**Read these first, in this order, before you do anything else:**

1. `claude/petal-pestle-master-plan.md` — the plan. **§37 to §40 are from Aug 24.**
2. `claude/petal-pestle-build-log.md` — every version, every bug, all 32 checks
3. `claude/azianna-diagnostic-results.md` — **her measured levels. These govern every lesson you write.** ⚠️ **This file is NOT in the GitHub repo** — it is a full assessment of a named child and is excluded deliberately. It only exists on my machine.
4. `claude/BLUEPRINT_A_LOCAL_FIRST.md` — the standard above this document

**The app is at v3.78, installed at `C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy`, runs on `localhost:5180` (strictPort), database `PetalPestleDB` at v8, published at `https://unrivaled-caramel-e28469.netlify.app/`, and deploys from `github.com/philissa-sketch/petal-pestle-academy`.**

---

### HOW I WANT YOU TO WORK — these are not suggestions

1. **Ask me before building.** Tell me the scope you intend and wait.
2. **Run all the checks on my machine after every change** — `npm run check`, in batches. **Not in your sandbox. Mine.**
3. **Every fix gets a check that would have caught it, and you negative-test it by reintroducing the bug.**
4. **A check must never claim more than it tests** — and a check that pressures you to falsify the data is worse than no check.
5. **A rule I have to act on is a CHECK, not a warning.**
6. **When I repeat a complaint, check the CHECK before you check the content.**
7. **A contradiction in what I asked for is a question, not a judgement call.**
8. **Never invent or guess a URL** — and **never put a placeholder in a command you give me.** I will paste it exactly as written. A session did this on Aug 24 and I ended up with a git remote pointing at a repository called `YOUR-REPO-NAME`.
9. **Verify against the disk, not against what I tell you** — not against the app's own comments, **and not against a document describing an app.** See "A document about an app is not the app" below.
10. **Restart the dev server after every update** — I do this, you can't. Remind me.
11. **A rule the app must follow lives in the ENGINE or a lib, where a check can test it.**
12. **Do not copy files from your uploads folder over files on my disk. Edit in place.**
13. **You cannot delete on my machine** — `mv` into `_to_delete/` and tell me what you moved. **You cannot move a folder either**, because moving is copy-then-remove. Tell me the command and let me run it.
14. **⚠️ DO NOT RUN `git` COMMANDS AGAINST MY FOLDER.** Even read-only ones like `git status` write `.git/index.lock`, you cannot remove it, and **GitHub Desktop then refuses to commit** — I had to delete it from an administrator Command Prompt. Read files directly instead. **I use GitHub Desktop, not the command line.** When you change files they appear in its Changes tab on their own; I commit and push. **You never need to give me `git add` or `git commit` commands.**
15. **Update the master plan and the build log when you finish a version**, and bump `src/config/buildStamp.js`.
16. **Use a curly apostrophe in JSX text.** A straight one breaks check-jsx's parser.
17. **Never put a quote character inside a regex character class in `src/`.** `check-sources` blanks strings before counting brackets and has no concept of a regex, so it reports a phantom unbalanced bracket. Write `\u0027` and `\u0022`. Known, not fixed.
18. **Explain things to me plainly.** I am not a developer. When I say I do not understand, repeat it in plain words rather than adding detail.

### THREE RULES ABOUT TESTING, ALL LEARNED THE HARD WAY ON AUG 24

- **A negative test must prove its own mutation landed** — and that it hit **a rule and not a comment**. Four of mine passed for the most boring reason available: the string existed only in explanatory prose, so nothing was mutated at all. That is *"a mutation that did not mutate"*, #27 in the build log, arriving for the fifth and sixth time.
- **A redundant guard is not a tested guard.** Deleting either of two overlapping guards changed nothing observable, so the check was green because the rule *could not be seen either way* — not because it held. Rule 11's answer: export the predicate and ask it directly.
- **A check that fails a SAFER change is broken.** Mine went red when a rule was broadened to protect *more*. That is this project's most repeated sin — six times now — and the fix people reach for is to weaken the check.

### THE CONTENT RULES

- **EVERY LESSON IS WRITTEN AT HER MEASURED LEVEL, NOT HER AGE.** ⚠️ **Her levels changed on Aug 24 and nobody has read the new ones yet.**
- **A LESSON MAY ONLY ASK FOR WHAT IT GAVE HER.**
- **THE VIDEO MUST TEACH THE LESSON**, and it is picked and watched **before** the lesson is written.
- **THE RIGHT ANSWER HAS TO MOVE AROUND** — no answer slot over 40%.
- **Every video verified at `youtube.com/oembed`.** Never noembed.com.
- **Black American educators actively sought, every failed search written down. Unknown is recorded as unknown.**
- **The Journal is never graded and never corrected.**
- **Safety:** no dosing, no self-treatment, no weight or appearance language attached to a person.
- **Proper nouns are exempt from the long-word count.** You cannot shorten a name.

---

## ⚠️ WHAT THE LAST HANDOFF GOT WRONG — READ THIS BEFORE TRUSTING ANY OLD NOTE

**The Aug 23 version of this file said the Khan advancement problem was *"not a bug — it is a missing manual step nobody knew was load-bearing."***

**It was a bug.** `addKhanGrade` stored `{ subject, unit, percent, at, note }` and `nextUnitFor` counts a unit as done only when the row carries **`courseId` and `unitN`**. Neither was ever written by any code path in the app. **Recording a grade never advanced her and never had.** The planned "smallest fix" — a hint telling me to record a grade — would have told me to do something that does not work.

**Her record holding zero Khan grades is what hid it.** With nothing entered, a broken writer and a working one produce the same screen.

**And `check-khan-units` §6c passed green for four versions while it was broken**, because it pushed grade objects **it built itself** in a shape the app had never produced — then printed *"advance one unit per grade"*, which is a claim about the app. That file's own comment, eight lines higher, confesses to the identical mistake.

**The general lesson, and it is now a standing rule: a fixture is a claim about what the app produces, and nothing was checking that claim.**

---

## ⚠️ LAMAR'S APP — READ THE CODE, NOT THE NOTES

**Rewritten Aug 26 2026, because the old version of this section caused the mistake it was written to prevent.**

There are **two** folders and they are not the same thing:

| `...\petal-pestle-academy\Lamar DOC` | **Documents only. No code.** Newest file **Aug 16.** |
|---|---|
| `...\mission-control-homeschool-school-start-gate\mission-control-homeschool` | **His running app.** Source, data, checks, and docs updated **Aug 25.** |

**READ THE SECOND ONE.** Gigi's instruction, Aug 26 2026: read his app directly.

**Both are READ-ONLY. Never write to either.** ⚠️ On Aug 26 a session ran a write test to *confirm* `Lamar DOC` was read-only. It was not — the file was created and then could not be deleted, and Gigi had to remove it by hand. **A rule that is already written down does not need testing. It needs obeying.**

### Why this section changed

**Aug 24:** a session read `Lamar DOC/PROJECT_LOG.md`, found *"A 90-100, B 80-89, C 70-79, D 60-69, F below 60"*, and stated it in a build log as his grading scale. Gigi sent a screenshot of the report card his app actually renders — **A+ 99%, A 93%, B 86%, B- 82%.** A+ and B- cannot exist on a five-band scale.

**Aug 25, v3.82:** a session built her whole book report feature out of `Lamar DOC`, **while his running app sat mounted and unopened.** It got his step 2 wrong, missed all sixteen of his report formats, and built two writing boxes where his has three. Fixed at v3.83 by reading `src/data/academicSuccessCenter/reportFormats.js` and `assignmentMilestones.js` — the actual files.

**The same mistake, twice, eight days apart, in a project whose §38 is named after it.**

### The rule now

**Read his code for what his app does. Read his docs for why.** His `PROJECT_LOG.md` is the best reasoning in either project and it is still worth reading — it is where *"a checkbox is not an artifact"* and *"one fact, one place"* come from. It is simply not evidence about what his app currently renders.

⚠️ **And what fits him does not always fit her.** Three things did not transfer at v3.83, each for a stated reason:

- **His dates.** His milestones count backward from a due date; **this app has no calendar and refuses one.** Translated to pace on her progress.
- **His 350–500 word reports.** That is a twelve-year-old. Hers are 80–150.
- **All sixteen formats.** Engineering Analysis and Scientific Review are aerospace-shaped. Six were taken; the rest would be a table that looks complete and aims at the wrong child.

**Copying a mechanism out of an app that has something this one does not is the same error as copying a fact out of a stale document.** Ask for a screenshot when the code cannot answer it — how something *looks* on his screen is still a thing only Gigi can see.

---

## WHAT I WANT LOOKED AT FIRST — HER CHECK-IN RESULTS

**Azianna sat her second Check-In on Aug 24 2026.** This is the second reading on the only instrument this app has, and §3.10.8 says growth is a delta on one instrument's scale. **Four things follow, in order:**

1. **Ask me for a fresh export off the Chromebook.** Every count you have is from Aug 18 and is stale.
2. **Read her new levels off the export, never off a document.** `azianna-diagnostic-results.md` disagreed with her record for days and it governs all 256 lessons.
3. **Update `azianna-diagnostic-results.md` from the data — and DO NOT overwrite §1b.** That is the Aug 13 baseline, and it is what the delta is measured against.
4. **Then review the Quarter 4 reading cap.** §34 held it at 14 and said in writing: *review after the next Check-In.* This is that.

**Watch the four strands that were still `settled: false`:** Grammar & Usage 2.20, Writing Strategies 2.70, Geometry 2.70, Measurement & Data 2.70. Geometry and Measurement only came off a 2.00 floor recently.

---

## WHAT ELSE IS ACTUALLY MISSING

| Missing | What it is |
|---|---|
| **Spelling & vocabulary** | 360 + 360 words. No screen, no words on disk. **None of Lamar's 720 transfer — his are 7th grade.** |
| **A projects area she can browse** | Projects exist in the system; she has no tab to go and look at them. The "correct and unreachable" shape that has bitten this app five times. |
| **The 13 flat cards** | `hb-1-01`–`hb-1-13` carry `words:` but no `course`, `quarter`, `week` or `standards`. **They block Phase 2 tagging 2,560 questions.** Fix first. |

**The Annual Progress Report is DONE — v3.78.** Grown-Up Corner → Report → Annual report, printable, built to Lamar's shape. It prints *"Not yet graded"* against all five statute subjects today, which is correct: my record holds 0 Khan grades, 0 writing marks, 0 test attempts, 5 lesson reads and 3 school days. **It is an early-warning instrument, not a trophy.**

---

## THINGS WAITING ON MY ANSWER — do not decide these for me

1. **`balance`, `volume`, `shape`** — three held skill terms. The `weight` check, three more times: list the carrying lessons, read the titles.
2. **`model`** — the one retired skill most likely to come back.
3. **Herbalism M13–M15** — 18 lessons at 16–19.6 words a sentence against a cap of 14. Split the sentences; do not raise the cap. Not urgent, Q4 is April.
4. **The advocacy exclusion**, the **Black-scientists module**, the **Ubongo / Super Sema question**.
5. **Three questions a morning** against a 2,495-question bank.

---

## WHAT HAPPENED ON AUG 24, SO IT IS NOT REDONE

- **v3.74** — the Khan wiring bug. Row-shaping moved to `src/lib/khanGrade.js` so a check can test it. `check-khan-advance` (#31). Her diagnostic document corrected from her record — **the tenth hand-typed number in this project to drift.**
- **v3.75** — **fraction entry.** I type `8/10`, the app gives 80% and a B-. **The fraction is stored, not the percent** — `addWritingMark`'s rule. Lamar's real ladder, derived from my screenshot, with the A+ threshold **marked as an assumption** because the screenshot proves 99 earns one and not where it starts. ⚠️ **Three `Number(null)` bugs caught in one run** — `Number(null)` is 0 and 0 is finite, so an absent mark scored an F and an ungraded unit averaged in as a zero.
- **v3.76** — **the Course Challenge has its own row.** It never marks a unit done and is never averaged with the units. `Number(null)` again, in a third file.
- **v3.77** — **GitHub → Netlify.** Build command is `npm run check && npm run build`, so **a red check fails the deploy and the old site stays up.** ⚠️ **Thirteen copies of my export were in the folder and there was no `.gitignore` at all.** The repo is **PUBLIC** — my call. `claude/` is committed **except** her assessment, her backup and `local/`, mirroring Mission Control's rule: *anything that would be a problem in public does not go in at all.*
- **v3.78** — **the Annual Progress Report.** O.C.G.A. § 20-2-690(c). Coverage and hours **cannot reach a letter** — the check runs the report twice with wildly different coverage and requires every letter to be identical. That is the bug I caught in Lamar's app: *"conflating curriculum completion with performance made the platform's own unfinished state look like his failure."*

**Start by reading the four documents, then confirm back to me: the version on disk, the check count, how many Khan grades are on my record, and what you intend to do first.**
