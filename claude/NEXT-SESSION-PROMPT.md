# NEXT SESSION — start here

*Rewritten Aug 26 2026, end of the reading-check / book-report / grading session.*

**Where things stand:** the app is at **v3.85**, **all 36 checks green**, live at **https://unrivaled-caramel-e28469.netlify.app/**, deploying itself from **github.com/philissa-sketch/petal-pestle-academy**. Azianna works on an Acer Chromebook and it holds the live copy of her data.

**Three things before you start:**

1. **⚠️ There is uncommitted work on disk.** v3.79 through v3.85 were all built today and may not be pushed yet. Ask.
2. **⚠️ Her Backup folder was one commit from going public today.** The repository is PUBLIC. See "the thing that nearly happened".
3. **All nine strands are settled for the first time.** The re-measure finished Aug 25.

---

## THE PROMPT — copy everything below

I am Gigi. I am building **Petal & Pestle Academy**, a homeschool app for my nine-year-old granddaughter **Azianna**, who wants to be a doctor and a herbalist. It is modelled on **Mission Control Homeschool Academy**, the aerospace app I built for my son Lamar.

**Read these first, in this order:**

1. `claude/petal-pestle-master-plan.md` — the plan. **§41 to §47 are from Aug 25–26.**
2. `claude/petal-pestle-build-log.md` — every version, every bug, all 36 checks
3. `claude/azianna-diagnostic-results.md` — **her measured levels. These govern every lesson you write.** ⚠️ **NOT in the GitHub repo** — a full assessment of a named child, excluded deliberately. **And §1c of it is out of date — see the first job.**
4. `claude/BLUEPRINT_A_LOCAL_FIRST.md` — the standard above this document

**The app is at v3.85, installed at `C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy`, runs on `localhost:5180` (strictPort), database `PetalPestleDB` at v11.**

---

### HOW I WANT YOU TO WORK — these are not suggestions

1. **Ask me before building.** Tell me the scope you intend and wait.
2. **Run the checks on my machine after every change.** ⚠️ **I do not use the command line.** Double-click **`RUN-THE-CHECKS.bat`** in the project folder. It runs all 36 and tells me in words whether it is safe to commit.
3. **Every fix gets a check that would have caught it, and you negative-test it by reintroducing the bug.**
4. **A check must never claim more than it tests** — and it must never *print* a claim it has stopped testing. Both happened this week.
5. **A rule I have to act on is a CHECK, not a warning.**
6. **When I repeat a complaint, check the CHECK before you check the content.**
7. **A contradiction in what I asked for is a question, not a judgement call.**
8. **Never invent or guess a URL, and never put a placeholder in a command you give me.** I will paste it exactly as written.
9. **Verify against the disk, not against what I tell you** — not against the app's own comments, and **not against a document describing an app.**
10. **Restart the dev server after every update** — I do this, you cannot. Remind me.
11. **A rule the app must follow lives in the ENGINE or a lib, where a check can test it.**
12. **Do not copy files from your uploads folder over files on my disk. Edit in place.**
13. **You cannot delete on my machine.** `mv` a FILE into `_to_delete/` and tell me what you moved. **You cannot move a FOLDER** — moving is copy-then-remove. Give me the command.
14. **⚠️ DO NOT RUN `git` COMMANDS AGAINST MY FOLDER.** Even `git status` writes `.git/index.lock`, you cannot remove it, and **GitHub Desktop then refuses to commit**. Read files directly. **I use GitHub Desktop.** Your changes appear in its Changes tab on their own; I commit and push.
15. **Update the master plan and the build log when you finish a version**, and bump `src/config/buildStamp.js`.
16. **Use a curly apostrophe in JSX text.** A straight one breaks check-jsx's parser.
17. **Never put a quote character inside a regex character class in `src/`.** Write `\u0027` and `\u0022`. Known, not fixed.
18. **Explain things to me plainly.** I am not a developer. When I say I do not understand, repeat it in plain words rather than adding detail.
19. **⚠️ Ask questions as TEXT, never as a picker widget.** The widget disappears when I scroll up to re-read, and then I cannot see what you asked.

### FOUR RULES ABOUT CHECKS, ALL LEARNED THE HARD WAY

- **A negative test must prove its own mutation landed** — and that it hit **a rule and not a comment**. *"A mutation that did not mutate."*
- **⚠️ An assertion satisfied by something ADJACENT to the rule is not testing the rule.** This has now happened **seven times in six versions**: `disabled={!open}` matched inside `aria-disabled={!open}` · the word "unaided" matched inside `isFullyUnaided` · a flag required at one of its two write sites · `parseScore` matched in a different function · two inputs counted "within 200 characters" when they sit hundreds of lines apart · a rule with no test at all · **and a fixture that omitted a field, which exempts it.**
- **⚠️ A check whose yardstick is the thing being measured is not measuring.** One read `OPENS_AT_WEEK_IN_QUARTER` to decide what to expect, so when the mutation moved that constant the expectation moved with it.
- **A check that fails a SAFER change is broken** — and the fix people reach for is to weaken it. Seven times now. Widen it to what its own heading always promised instead.

### THE CONTENT RULES

- **EVERY LESSON IS WRITTEN AT HER MEASURED LEVEL, NOT HER AGE.**
- **A LESSON MAY ONLY ASK FOR WHAT IT GAVE HER.**
- **THE VIDEO MUST TEACH THE LESSON**, picked and watched **before** the lesson is written.
- **THE RIGHT ANSWER HAS TO MOVE AROUND** — no answer slot over 40%.
- **Every video verified at `youtube.com/oembed`.** Never noembed.com.
- **Black American educators actively sought, every failed search written down.**
- **The Journal is never graded and never corrected.** (The daily *mark* is a separate row — v3.68.)
- **Safety:** no dosing, no self-treatment, no weight or appearance language attached to a person.
- **Proper nouns are exempt from the long-word count.**
- **⚠️ Nothing on her screen says *behind*, *weakest*, *catch up*, *overdue* or *late*.** The order carries the meaning.

---

## ⚠️ LAMAR'S APP — READ THE CODE, NOT THE NOTES

| `C:\Users\pknot\Downloads\mission-control-homeschool-school-start-gate\mission-control-homeschool` | **His running app.** Source, data, checks, and his docs. |
|---|---|

**Read it directly. READ-ONLY — never write to it.**

**`Lamar DOC` is gone.** I deleted it Aug 26. It held documents and no code and it caused two wrong answers in three days:

- **Aug 24:** a session read his `PROJECT_LOG.md`, found *"A 90-100, B 80-89, C 70-79, D 60-69, F below 60"*, and stated it as his grading scale. I sent a screenshot of what his app actually renders — **A+ 99%, A 93%, B 86%, B- 82%.** A+ and B- cannot exist on a five-band scale.
- **Aug 25, v3.82:** a session built the whole book report feature from that folder **while his running app sat mounted and unopened**. Wrong step 2, missed all sixteen of his report formats, two writing boxes where his has three. Rebuilt at v3.83 from his actual code.

**If a comment still names `Lamar DOC`, it is history. Do not go looking for it.**

⚠️ **Two write-probes were left in folders that turned out not to be read-only** — one Aug 24, one Aug 26, by different sessions. **A rule already written down does not need testing. It needs obeying.**

### ⚠️ And what fits him does not always fit her

Four things did **not** transfer, each for a stated reason:

- **His dates.** His milestones count backward from a due date. **This app has no calendar and refuses one** — §7.1: *"a quarter is a sequence, not a set of dates."* Translated to pace on her progress.
- **His 350–500 word reports.** That is a twelve-year-old. Hers are 80–150.
- **All sixteen formats.** Engineering Analysis and Scientific Review are aerospace-shaped. Six were taken.
- **His rubric curve.** `suggestedGradeFromRubric` uses a seven-band curve that disagrees with his own thirteen-band scale. **Hers already does his idea properly.**

**Copying a mechanism out of an app that has something this one does not is the same error as copying a fact out of a stale document.**

---

## ⚠️ THE THING THAT NEARLY HAPPENED TODAY

I made a **`Backup folder`** in the project to keep my exports in. The file I put there was called **`petal-pestle-backup-2026-08-26.json`** — 93KB, 99 rows of her record, her name, her nine levels, her journal in her own words.

**None of the four `.gitignore` patterns matched that name.** They look for `her-backup`, `her-latest-export`, `her-*`. Mine said `petal-pestle-backup`.

**The repository is PUBLIC. A public commit cannot be taken back.**

`check-publish-safety` caught it, because it walks every JSON on disk and identifies an export **structurally** rather than by name. The whole **folder** is excluded now, not a filename pattern — a rule that depends on what I name a file fails the first time I name it something else.

**Run `RUN-THE-CHECKS.bat` before every commit. That is what it is for.**

---

## FIRST JOB — HER DIAGNOSTIC FILE IS OUT OF DATE

**She finished the re-measure on Aug 25 and all nine strands are settled — the first time that has ever been true.** `azianna-diagnostic-results.md` §1c still describes three of them as *"still re-measuring, not final"*, which was correct when written this morning and is not now.

**The final numbers, read off `Backup folder/petal-pestle-backup-2026-08-26.json`:**

| Strand | Level | | Strand | Level |
|---|---|---|---|---|
| Grammar & Usage | **2.35** | | Patterns & Algebra | 2.98 |
| **Measurement & Data** | **2.44** ⚠️ lowest | | Reading Comprehension | 3.46 |
| Geometry | **2.67** | | Numbers & Operations | 3.48 |
| Writing Strategies | **2.67** | | **Fractions & Decimals** | **3.89** |
| Vocabulary | 2.91 | | | |

**⚠️ All three finished LOWER than the mid-re-measure numbers**: Measurement 2.50→2.44, Geometry 2.82→2.67, Writing 2.82→2.67.

**DO NOT OVERWRITE §1b** — the Aug 13 baseline, and what the growth delta is measured from.

⚠️ **And the Geometry and Measurement deltas from Aug 13 are NOT growth.** Their baseline numbers were **floors** — the item bank could not read below 2.00. Most of that movement is the instrument improving, not the child. **Grammar and Writing are the only honest deltas.**

**`local/her-latest-export.json` is the Aug 25 file and is now stale.** The Aug 26 one in `Backup folder/` is newer — 90 answers vs 86, 17 lessons vs 14. Ask me before replacing it.

---

## WHAT ELSE IS OPEN

**1. ⚠️ The repository is PUBLIC and the reasoning beside that decision assumes it is private.**
`.gitignore` and `check-publish-safety` both say *"the repository being private is the SECOND guard"* — copied from Lamar's repo, which **is** private. Mine is not. **"Azianna" appears 18 times in the build log and 16 in the master plan**, beside her measured levels. Her export uses "PrettyGlow", so it is a first name, not a full one. **My call, still unmade.** Three options: flip to private · leave public and rewrite the two false sentences · pull the two documents out.

**2. Folders I have to remove myself** — you cannot move folders:

```
rmdir /s /q "C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy\_to_delete"
rmdir /s /q "C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy\dist"
rmdir "C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy\_archive-test"
rmdir /s /q "C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy\.pp-drop"
rmdir "C:\Users\pknot\Downloads\petal-pestle-academy\Lamar DOC"
rmdir /s /q "C:\Users\pknot\Downloads\petal-pestle-academy\pp-update"
rmdir /s /q "C:\Users\pknot\Downloads\petal-pestle-academy\_to_delete"
```

**3. `year-plans/` and `lesson-materials/` may be stale paper.** Nine year-plan PDFs and a printable, all made around **v3.28**. The app is at **v3.84**. They predate the Khan strand lanes, the reading check and the book report steps. **Worth checking which pages are still true.**

**4. Her record still holds ZERO Khan grades, ZERO writing marks, ZERO journal marks.** The annual report prints "Not yet graded" against most subjects, which is correct and is the argument for having built it in August. **Recording one Khan grade is what advances her maths unit.**

---

## THINGS WAITING ON MY ANSWER — do not decide these for me

1. **`balance`, `volume`, `shape`** — three held skill terms. List the carrying lessons, read the titles.
2. **`model`** — the one retired skill most likely to come back.
3. **Herbalism M13–M15** — 18 lessons at 16–19.6 words a sentence against a cap of 14. Split the sentences; do not raise the cap. Not urgent, Q4 is April.
4. **The advocacy exclusion**, the **Black-scientists module**, the **Ubongo / Super Sema question**.
5. **Spelling and vocabulary** — 360 + 360 words. No screen, no words on disk. **None of Lamar's 720 transfer — his are 7th grade.**
6. **A projects area she can browse.** Projects exist in the system; she has no tab to go and look at them.
7. **The 13 flat cards** `hb-1-01`–`hb-1-13` carry `words:` but no `course`, `quarter`, `week` or `standards`. **They block Phase 2 tagging 2,560 questions.**

---

## WHAT HAPPENED Aug 25–26, SO IT IS NOT REDONE

- **v3.79** — **Today's Planner opens ONE lesson, not a menu of ninety-six.** The road ahead is visible and locked. ⚠️ A comment had claimed this since v2.0 and it was never true. ⚠️ `db.js` called a finished lesson an *opened* one.
- **v3.80** — **The reading check Khan does not build.** Khan's elementary ELA has **zero assessments** — 77 links, none of them a test. Two passages, eight questions, **read-aloud offered and recorded per answer**. ⚠️ `unaidedPercent` is **null, never 0**. **63% of every answer she has given was read aloud; her independent reading has never been measured.**
- **v3.81** — **Each maths strand walks its own Khan units.** Measurement 2.44 is Unit 6, Geometry 2.67 is Unit 8, and all three strands were being handed **Unit 1, addition** — which teaches Numbers & Operations, 3.48. ⚠️ Not the v3.20 bug: every unit is in exactly one lane and nothing skips.
- **v3.82** — **Book reports on her schedule, four weekly steps.** They had existed since v3.38 with **nothing that ever said it was time.** ⚠️ Built from his notes — see v3.83.
- **v3.83** — **Rebuilt from his code.** His real four steps, six formats, **three writing boxes**, tickable checklist. ⚠️ **A checkbox is not an artifact** — there had been nowhere for her to type a word.
- **v3.84** — **One grading ladder, one entry box.** ⚠️ **This app had TWO ladders and they disagreed above 97%** — a perfect book report was an A, a perfect Khan unit an A+. Now one table, and **a perfect report is an A+ (my call)**. ⚠️ **The A+ threshold is CONFIRMED against his code, not assumed.** The Khan box takes **`8/10` or `82%`** in one field, like his.
- **v3.85** — **The near-miss, and the clean-up.** ⚠️ **My Backup folder was one commit from a public repo** — none of the four ignore patterns matched the filename. The **folder** is excluded now, not a name. **17 files to `_to_delete/`, `claude/` 43 → 28.** ⚠️ A **second write-probe** was found, from an Aug 24 session. `RUN-THE-CHECKS.bat` and the **Q4 cap review** logged at last. ⭐⭐ **All nine strands settled.**

**Start by reading the four documents, then confirm back to me: the version on disk, the check count, how many Khan grades are on my record, and what you intend to do first.**
