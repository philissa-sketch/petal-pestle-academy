# NEXT SESSION — start here
*Rewritten Aug 23 2026, end of the publishing session. Everything below the line is for Claude.*

**Where things stand:** the app is at **v3.73**, all **30 checks green**, and **it is live on the internet** — Azianna is on an Acer Chromebook now, not the old laptop.

**Two things worth knowing before the new session starts:**

1. **Her data moved.** The Chromebook holds the only live copy. The old laptop is frozen history.
2. **The Khan question was diagnosed but not fixed.** The answer is at the bottom of this file. It is not a bug — it is a missing manual step nobody knew was load-bearing.

---

## THE PROMPT — copy everything below

I am Gigi. I am building **Petal & Pestle Academy**, a homeschool app for my nine-year-old granddaughter **Azianna**, who wants to be a doctor and a herbalist. It is modelled on **Mission Control Homeschool Academy**, the aerospace app I built for my son Lamar.

**Read these first, in this order, before you do anything else:**

1. `claude/petal-pestle-master-plan.md` — the plan. §34, §35 and §36 are from Aug 23.
2. `claude/petal-pestle-build-log.md` — every version, every bug, all 30 checks
3. `claude/azianna-diagnostic-results.md` — **her measured levels. These govern every lesson you write.**
4. `claude/BLUEPRINT_A_LOCAL_FIRST.md` — the standard above this document

**The app is at v3.73, installed at `C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy`, runs on `localhost:5180` (strictPort), database `PetalPestleDB` at v8, and is published at `https://unrivaled-caramel-e28469.netlify.app/`.**

### HOW I WANT YOU TO WORK — these are not suggestions

1. **Ask me before building.** Tell me the scope you intend and wait.
2. **Run all the checks on my machine after every change** — `npm run check`, in batches. **Not in your sandbox. Mine.**
3. **Every fix gets a check that would have caught it, and you negative-test it by reintroducing the bug.**
4. **A check must never claim more than it tests** — and a check that pressures you to falsify the data is worse than no check.
5. **A rule I have to act on is a CHECK, not a warning.**
6. **When I repeat a complaint, check the CHECK before you check the content.**
7. **A contradiction in what I asked for is a question, not a judgement call.**
8. **Never invent or guess a URL.** Confirm it against the real domain and **write down every failed search.**
9. **Verify against the disk, not against what I tell you** — and not against the app's own comments either.
10. **Restart the dev server after every update** — I do this, you can't. Remind me.
11. **A rule the app must follow lives in the ENGINE or a lib, where a check can test it.**
12. **Do not copy files from your uploads folder over files on my disk. Edit in place.**
13. **You cannot delete on my machine** — `mv` into `_to_delete/` and tell me what you moved.
14. **Update the master plan and the build log when you finish a version**, and bump `src/config/buildStamp.js`.
15. **Use a curly apostrophe in JSX text.** A straight one breaks check-jsx's parser.
16. **Never put a quote character inside a regex character class in `src/`.** `check-sources` blanks strings before counting brackets and has no concept of a regex, so it reports a phantom unbalanced bracket. Write `\u0027` and `\u0022`. Known, not fixed.
17. **Explain things to me plainly.** I am not a developer. When I say I do not understand, repeat it in plain words rather than adding detail.

### THE CONTENT RULES

- **EVERY LESSON IS WRITTEN AT HER MEASURED LEVEL, NOT HER AGE.** Grammar 2.20, Writing 2.70, and her Reading 3.46 is a **listening** score.
- **A LESSON MAY ONLY ASK FOR WHAT IT GAVE HER.**
- **THE VIDEO MUST TEACH THE LESSON**, and it is picked and watched **before** the lesson is written.
- **THE RIGHT ANSWER HAS TO MOVE AROUND** — no answer slot over 40%.
- **Every video verified at `youtube.com/oembed`.** Never noembed.com.
- **Black American educators actively sought, every failed search written down. Unknown is recorded as unknown.**
- **The Journal is never graded and never corrected.**
- **Safety:** no dosing, no self-treatment, no weight or appearance language attached to a person.
- **Proper nouns are exempt from the long-word count.** You cannot shorten a name.

---

## WHAT I WANT LOOKED AT FIRST — THE KHAN ACADEMY WIRING

**My complaint, Aug 23:** *"When she is in her Today's Planner it is supposed to connect her to the unit she is working on in Khan Academy, but it is a new week and the links still have the same units connected. Khan Academy grading is supposed to be connected to the unit test results and course challenges. I wanted her grading system to be like Lamar's, even for Khan."*

### The diagnosis, already done — read this before touching anything

**The advancement logic exists and is correct.** `nextUnitFor(courseId, grades)` in `src/data/khan/khanUnits.js` returns **the first unit with no grade recorded**, so units go 1, 2, 3 in order, and when every unit is graded the block offers the **Course Challenge**. `resolveBlockTarget` in `src/lib/blockLinks.js` calls it properly.

**THE UNIT DOES NOT ADVANCE WITH THE CALENDAR. IT ADVANCES WHEN A GRADE IS RECORDED.**

Grades are entered **by hand**, by me, in Grown-Up Corner → **Khan grades** (`addKhanGrade({ subject, unit, percent, at, note })`).

**Her record holds ZERO Khan grades.** So `nextUnitFor` returns Unit 1 every time, for ever. The app is doing exactly what it was built to do, and **nothing on Today's Planner says that recording a grade is what moves her on.** That is the whole "new week, same unit" problem.

### So there are three jobs here, and they are separate

| # | Job | What is actually missing |
|---|---|---|
| **1** | **Tell me the step exists** | Today's Planner shows the unit and no hint that it advances only when I record a grade. A parent cannot follow a rule nobody told her about. This is the smallest fix and it unblocks everything else. |
| **2** | **Lamar's grading ladder for Khan** | `addKhanGrade` stores a raw `percent`. **No letter, no ladder.** My writing rubric already uses Lamar's ladder — 1→60, 2→73, 3→87, 4→100, giving A · B+ · C · D- (v3.56). **Khan does not use it. I want it to.** |
| **3** | **Unit test vs Course Challenge** | `addKhanGrade` has **no field for which kind of assessment it was**, and `nextUnitFor` treats any grade as "unit done". A Course Challenge result has nowhere to live. **Both should be recorded, and they are not the same thing.** |

**Lamar's app is at `C:\Users\pknot\Downloads\petal-pestle-academy\Lamar DOC\docs` and is READ-ONLY. Read it for the ladder. Never write to it.**

---

## WHAT ELSE IS ACTUALLY MISSING

I said the app "seems like it is still missing a lot." Most of that is **unused, not unbuilt** — as of the Aug 13 export she had read **5 of 256 lessons** and sat **0 tests**, so every progress screen looks bare. *(She has since completed one Herbalism test, which is not in that export — get a fresh one before trusting any count.)*

**Genuinely not built:**

| Missing | What it is |
|---|---|
| **Spelling & vocabulary** | 360 + 360 words. No screen, no words. **None of Lamar's 720 transfer — his are 7th grade.** |
| **A projects area she can browse** | Projects exist in the system; she has no tab to go and look at them |
| **The Annual Progress Report** | Georgia wants one per core subject per year. The app holds every input and **cannot print it.** It would also have prevented three count-drift bugs and a standards claim that was never true |

---

## THE TAGGING JOB — Phase 1 is frozen, Phase 2 is next

`src/data/skillsCatalog.js`, catalog v1, guarded by `check-skills`. **156 candidates cut to 20 committed**, 3 held, `scale` retired on evidence. See master plan §35.

**Before Phase 2 tags 2,560 questions:** the 13 flat cards (`hb-1-01`–`hb-1-13`) carry `words:` but **no `course`, `quarter`, `week` or `standards`** — they would be tagged without knowing what course they are in. **Fix first.**

---

## THINGS WAITING ON MY ANSWER — do not decide these for me

1. **`balance`, `volume`, `shape`** — three held skill terms. The `weight` check, three more times: list the carrying lessons, read the titles.
2. **`model`** — the one retired skill most likely to come back.
3. **A Check-In re-take has no date.** §3.10.8 says growth is a delta on one instrument, and this app has one. My baseline is Aug 13; **no second sitting is scheduled.** It gates the Quarter 4 reading cap. Suggested: baseline, mid-year, year-end — not quarterly.
4. **Herbalism M13–M15** — 18 lessons at 16–19.6 words a sentence against a cap of 14. Split the sentences; do not raise the cap. Not urgent, Q4 is April.
5. **`Lh8wC-qoqgw`** — the 3/5 Compromise video. I should watch it before it plays.
6. **The changelog is published.** `buildStamp.js` compiles into the site and quotes Azianna's name and her measured levels. I said it does not matter for now. **It is recorded here so it is not rediscovered as news.**

---

## WHAT HAPPENED ON AUG 23, SO IT IS NOT REDONE

- **v3.70** — all 256 lessons' prose measured for the first time. 37 over their own cap, recorded as a ratcheted debt list. `check-lesson-prose`.
- **v3.71** — the skill catalog frozen and on disk. `check-skills`.
- **v3.72** — **her data was one upload away from being public.** `public/her-latest-export.json` moved to `local/`, served dev-only. `check-publish-safety`.
- **v3.73** — **the Windows run finally happened and 18 of 30 checks had never worked there.** Seventeen scripts used `await import(resolve(...))`, which Windows rejects. All fixed with `pathToFileURL`.
- **Published to Netlify, opened on the Chromebook, backup imported, everything restored.**

**Start by reading the four documents, then confirm back to me: the version on disk, the check count, how many Khan grades are on her record, and what you intend to do first.**
