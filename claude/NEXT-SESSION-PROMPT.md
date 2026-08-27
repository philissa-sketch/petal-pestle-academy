# NEXT SESSION — start here
*Rewritten Aug 26 2026, end of the word-study / two-definitions / broken-screen session.*

**Where things stand:** the app on disk is at **v3.93**, **all 39 checks green**, repo at **github.com/philissa-sketch/petal-pestle-academy**. Azianna works on an Acer Chromebook and it holds the live copy of her data.

**Three things before you start:**

1. **⚠️ THE LIVE SITE IS AT v3.92 AND ITS GROWN-UP CORNER IS BROKEN.** v3.93 fixes it and is **on disk, not deployed**. See the first job.
2. **⚠️ I HAVE NO NETLIFY BUILD MINUTES UNTIL THE END OF SEPTEMBER.** Do not tell me to push. See "how we ship right now".
3. **Committing is free. Only pushing costs.** I can commit locally as often as you like.

---

## THE PROMPT — copy everything below

I am Gigi. I am building **Petal & Pestle Academy**, a homeschool app for my nine-year-old granddaughter **Azianna**, who wants to be a doctor and a herbalist. It is modelled on **Mission Control Homeschool Academy**, the aerospace app I built for my son Lamar.

**Read these first, in this order:**

1. `claude/petal-pestle-master-plan.md` — the plan. **§47 to §55 are from Aug 26.**
2. `claude/petal-pestle-build-log.md` — every version, every bug, all 39 checks
3. `claude/azianna-diagnostic-results.md` — **her measured levels. These govern every lesson you write.** ⚠️ **NOT in the GitHub repo** — a full assessment of a named child, excluded deliberately. **It is CURRENT as of Aug 26** — §1, §1c, §1d and §3 were all rebuilt from her record.
4. `claude/BLUEPRINT_A_LOCAL_FIRST.md` — the standard above this document
5. `claude/year-plans-audit-2026-08-26.md` — which of my nine printed year plans are still true

**The app is at v3.93, installed at `C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy`, runs on `localhost:5180` (strictPort), database `PetalPestleDB` at v12.**

---

### ⚠️ HOW WE SHIP RIGHT NOW — READ THIS BEFORE YOU SUGGEST ANYTHING

**I am out of Netlify build minutes until the end of September.** Every push triggers a build and I cannot afford one.

- **Committing in GitHub Desktop is FREE.** It is local. Do that as often as it helps.
- **Pushing is what costs.** One push, in October, for everything.
- **⭐ EXCEPT: uploading an already-built folder costs nothing.** Netlify only charges for builds it runs. `BUILD-FOR-NETLIFY.bat` runs the checks, refuses to build if any is red, builds on my computer, and tells me to drag `dist` onto the Deploys page. **That is how v3.93 reaches the live site.**
- ⚠️ **Deploying that way SKIPS the checks Netlify would normally run.** The local run is the only pair of eyes. Never suggest skipping it.

---

### HOW I WANT YOU TO WORK — these are not suggestions

1. **Ask me before building.** Tell me the scope you intend and wait.
2. **Run the checks on my machine after every change.** ⚠️ **I do not use the command line.** Double-click **`RUN-THE-CHECKS.bat`** in the project folder. It runs all 39 and tells me in words whether it is safe to commit.
3. **Every fix gets a check that would have caught it, and you negative-test it by reintroducing the bug.**
4. **A check must never claim more than it tests** — and it must never *print* a claim it has stopped testing.
5. **A rule I have to act on is a CHECK, not a warning.**
6. **⭐ A rule that was never TESTED needs testing once.** New Aug 26, and it is not the same sentence as rule 5. Two standing rules in this document turned out to be false — *"you cannot move a folder"* and *"the repository being private is the second guard"*. **Both had been obeyed for months. Neither had ever been checked.** A rule with a scar behind it — a date, a bug, a screenshot, a sentence from me — is a rule to obey. A rule with nothing behind it but a plausible explanation is a rule to test, once.
7. **When I repeat a complaint, check the CHECK before you check the content.**
8. **A contradiction in what I asked for is a question, not a judgement call.**
9. **Never invent or guess a URL, and never put a placeholder in a command you give me.** I will paste it exactly as written.
10. **Verify against the disk, not against what I tell you** — not against the app's own comments, and **not against a document describing an app.** ⚠️ **And check what is actually mounted before saying you cannot see something.** A session told me it had no access to Lamar's folder while it was mounted the whole time.
11. **Restart the dev server after every update** — I do this, you cannot. Remind me.
12. **A rule the app must follow lives in the ENGINE or a lib, where a check can test it.**
13. **Do not copy files from your uploads folder over files on my disk. Edit in place.**
14. **You cannot DELETE on my machine, and that is the only limit.** `mv` anything into `_to_delete/` and tell me what you moved. **You CAN move folders and you CAN create them** — moving inside one drive is a rename. The old rule said otherwise and was wrong for months.
15. **⚠️ DO NOT RUN `git` COMMANDS AGAINST MY FOLDER.** Even `git status` writes `.git/index.lock`, you cannot remove it, and **GitHub Desktop then refuses to commit**. Read files directly. **I use GitHub Desktop.**
16. **Update the master plan and the build log when you finish a version**, and bump `src/config/buildStamp.js`.
17. **Use a curly apostrophe in JSX text.** A straight one breaks check-jsx's parser.
18. **Never put a quote character inside a regex character class in `src/`** — and not a `)` either. Write `\u0027`, `\u0022`, `\u0029`. Known, not fixed. ⚠️ A file broke this **in the version carrying a header note about it.**
19. **Explain things to me plainly.** I am not a developer. When I say I do not understand, repeat it in plain words rather than adding detail.
20. **⚠️ Ask questions as TEXT, never as a picker widget.** The widget disappears when I scroll up to re-read, and then I cannot see what you asked.

### FIVE RULES ABOUT CHECKS, ALL LEARNED THE HARD WAY

- **A negative test must prove its own mutation landed** — and that it hit **a rule and not a comment**. *"A mutation that did not mutate."* ⚠️ Twice on Aug 26 a mutation targeted a string that no longer existed and the test reported a pass.
- **⚠️ An assertion satisfied by something ADJACENT to the rule is not testing the rule.** Now **nine times in twelve versions**. Newest: an assertion went red against **the comment explaining the rule it was testing.**
- **⚠️ A check whose yardstick is the thing being measured is not measuring.** Asserting that two callers agree by calling one shared function twice asserts nothing.
- **A check that fails a SAFER change is broken** — widen it to what its own heading promised, never weaken it.
- **⭐ A GREEN CHECK IS NOT A WORKING APP.** New Aug 26. **Thirty-eight checks were green while the Grown-Up Corner threw on render.** Every check in this project read TEXT; not one asked whether a name existed where it was used. `check-undefined` (#39) now parses `src/` and walks the real scope chain. **When something is broken on screen and everything is green, the checks are the thing that is wrong.**

### THE CONTENT RULES

- **EVERY LESSON IS WRITTEN AT HER MEASURED LEVEL, NOT HER AGE.**
- **A LESSON MAY ONLY ASK FOR WHAT IT GAVE HER.**
- **THE VIDEO MUST TEACH THE LESSON**, picked and watched **before** the lesson is written.
- **THE RIGHT ANSWER HAS TO MOVE AROUND** — no answer slot over 40%.
- **Every video verified at `youtube.com/oembed`.** Never noembed.com. ⚠️ Some older module headers say they were verified at noembed — that is history, and it means those were never checked to the current standard.
- **Black American educators actively sought, every failed search written down.**
- **The Journal is never graded and never corrected.**
- **Safety:** no dosing, no self-treatment, no weight or appearance language attached to a person.
- **Proper nouns are exempt from the long-word count.**
- **⚠️ Nothing on her screen says *behind*, *weakest*, *catch up*, *overdue* or *late*.** The order carries the meaning.
- **⚠️ Split the sentences. Never raise the cap.**

---

## ⚠️ LAMAR'S APP — READ THE CODE, NOT THE NOTES

`C:\Users\pknot\Downloads\mission-control-homeschool-school-start-gate\mission-control-homeschool` — **his running app.** Source, data, checks, and his docs. **Read it directly. READ-ONLY — never write to it.**

`Lamar DOC` is gone. I deleted it. If a comment still names it, that is history.

### ⚠️ And what fits him does not always fit her

Things that did **not** transfer, each for a stated reason: **his dates** (this app has no calendar and refuses one — §7.1), **his 350–500 word reports** (that is a twelve-year-old; hers are 80–150), **all sixteen formats** (six were taken), **his rubric curve**, and **his 36-week year** — hers is **32**, which is why her word lists are 320 and not 360.

**Copying a NUMBER out of his app is the same error as copying a mechanism out of it.**

---

## FIRST JOB — GET v3.93 ONTO THE LIVE SITE

**The Grown-Up Corner is broken in production right now.** It throws `ReferenceError: grades is not defined` the moment it renders — the screen where I record a Khan grade, mark the journal and take a backup. v3.93 fixes it and is sitting on my disk.

**Walk me through `BUILD-FOR-NETLIFY.bat`, then the drag onto the Deploys page.** Then have me confirm the version in the top corner reads **V3.93**.

**Do not let me start anything else until that is done.**

---

## WHAT IS OPEN, IN THE ORDER I WOULD DO IT

**1. ⚠️ 32 lessons are over her reading cap.** Eighteen are Herbalism M13–M15 at 16–19.6 words a sentence against a cap of 14. **Split the sentences; do not raise the cap.** A worked sample exists in the last session — same facts, same names, same dates, ideas just stop arriving three at a time. ⚠️ **Q4 has a FLOOR of 6.5 as well as a cap of 14** — chopping too hard fails the other way. `KNOWN_OVER` in `src/lib/readingCaps.js` is a ratchet: delete each line as its lesson comes under, and the check forces it.

**2. Three of my nine year-plan PDFs are stale.** `00-master-calendar` and `01-mathematics` both call Geometry and Measurement *"at the floor"* — they are 2.67 and 2.44 now, real readings. `03-language-arts` says Grammar 2.15; it is 2.35. **The other six are fine.** ⚠️ **`year-plans/` is OUTSIDE the git repo, so this costs no build minutes at all.** Full detail in `claude/year-plans-audit-2026-08-26.md`.

**3. The 13 flat cards need Georgia codes — and I need to find the standards file first.** `hb-1-01`–`hb-1-13` now carry `course`, `module`, `quarter`, `week`, `day` and `standards: []`, all derived from `WEEKS`. **`offGrade` is deliberately blank on all thirteen.** Only the *social studies* standards are on disk; without the K-5 **science** GSE, any code would be *"a guess dressed as a citation"* — `herbalismM6.js`'s own words. **Ask me whether I found the file.**

**4. ⚠️ `offGrade` means two different things in this app.** In Herbalism it holds Georgia codes (`S2L1`, `S3L1`, `S3L2`). In Human Body it holds free-text notes about the *maths* inside the lesson. **One field, two meanings** — the family that has now bitten this project three times. Not causing a visible bug. Worth fixing before it does.

**5. A projects area she can browse.** Projects exist in the system; she has no tab to go and look at them.

**6. Still waiting on my answer:** the three held skill terms `balance`, `volume`, `shape` · the retired `model` · the advocacy exclusion · the Black-scientists module · the Ubongo / Super Sema question.

**7. One command I have to run myself:**
```
rmdir /s /q "C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy\_to_delete"
```

---

## ⚠️ HER RECORD IS STILL EMPTY IN FOUR PLACES

| | On her record |
|---|---|
| Khan grades | **0** |
| Reading checks sat | **0** |
| Journal marks | **0** |
| Writing marks | **0** |
| Spelling results | **0** |

**These are mine to fix, not yours, and they are worth more than any feature you could build.**

- **The reading check.** Today → Reading block → *"Then: reading check."* Two passages, eight questions, read-aloud recorded per answer. **63% of every answer she has ever given was read to her and her independent reading has never once been measured.** Every level on her record is caveated by this.
- **One Khan grade.** Nothing in her maths advances until one is recorded in the Grown-Up Corner — **which is the screen that is currently broken.** That is the other reason the first job is the first job.

**Remind me about these. Do not let them slide into another month.**

---

## WHAT HAPPENED Aug 26, SO IT IS NOT REDONE

- **v3.85–v3.86** — Her diagnostic document made true again, and **check #37** written so it cannot drift a fourth time. ⚠️ It can pass without testing anything off my PC and **says so in words** rather than printing PASSED.
- **v3.87** — **The repository stays public — my decision.** ⚠️ And two sentences giving the reason were **false**, copied from Lamar's private repo. **There is no second guard.** Her first name is in ~60 committed files including `buildStamp.js`, which renders on the live site.
- **v3.88** — **Thirteen lessons had never had their reading level measured. Not once.** ⚠️ Two layers had to be fixed before one sentence of theirs was read. ⚠️ And the first draft turned **nineteen good lessons red for sentences that are on no screen** — 243 of 256 lessons carry `core` that `LessonReader` never renders.
- **v3.89** — **Rule 13 was false and had never been tested.** Six `rmdir` commands a clean-up, for months, for nothing.
- **v3.90** — **320 spelling + 320 vocabulary words, every one pulled from the 256 lessons she actually reads.** ⚠️ The check found a real fault in the generator on its first run, and **a proper-noun rule calling `garlic`, `ginger` and `seeds` names** on its second.
- **v3.91** — **The words got a screen and something that knocks on it.** ⚠️ The word is never on screen while she types it; **hearing it IS the test**, so there is no unaided percentage and there must never be one. **If the device cannot speak the test refuses to run.**
- **v3.92** — ⚠️ **Two answers to "which unit is she on", disagreeing on her screen.** Found by **opening the live site and reading it**, not by a check. One function now.
- **v3.93** — ⚠️ **v3.92 broke the Grown-Up Corner and 38 checks stayed green.** **Check #39 parses `src/` and walks the real scope chain.** And `BUILD-FOR-NETLIFY.bat` exists so I can ship with no build minutes.

**Start by reading the four documents, then confirm back to me: the version on disk, the version on the LIVE SITE, the check count, how many Khan grades are on my record, and what you intend to do first.**
