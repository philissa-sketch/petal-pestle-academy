# START-HERE PROMPT — Khan Academy units & grades

**Copy everything below the line into a new Cowork conversation.**

---

You are building one thing for **Petal & Pestle Academy**, my 9-year-old granddaughter Azianna's homeschool app. I am Gigi.

Read these before you touch anything:

- `claude/petal-pestle-master-plan.md` — the plan, currently **v3.19**
- `claude/petal-pestle-build-log.md` — every version, every bug, the 22 checks, the locked decisions
- `claude/post-build-backlog-gigi.md` — my list, in my words

**App:** `C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy` · runs on `localhost:5180`, `strictPort` on · database `PetalPestleDB` · **22 automated checks, all passing.**

**Lamar's app is at `C:\Users\pknot\Downloads\petal-pestle-academy\master plan lamars app` and is READ-ONLY.** Read it for comparison. Never write to it.

---

## THE JOB

**Khan Academy grades should be by UNIT COMPLETED**, the way my son Lamar's app does it.

1. **Every unit, Unit 1 through the last unit of each course she is in**, with the correct, verified Khan link for that unit — not just a link to the course front page.
2. **She is graded by the unit test at the end of the week**, and by the **Course Challenge** when she finishes all the units in a course.
3. **I enter the score as a fraction** — 9 out of 10. **The app converts it to a percentage and a letter grade.** Just like Lamar's Master Plan.

---

## WHAT ALREADY EXISTS, AND WHAT IS WRONG WITH IT

v3.19 shipped a Khan grades screen at **Grown-Up Corner → Gradebook → Khan grades**. It works, but it is **not what I asked for** and needs rebuilding:

| Built at v3.19 | What it should be |
|---|---|
| I type the unit name as free text | A **list of real units**, Unit 1 → last, that I tick off |
| I type a mastery percentage | I type a **fraction** (9/10) and the app works out % and letter |
| Links to the course front page | Links to **the unit itself** |
| No Course Challenge | **Course Challenge** graded when all units are done |

The data layer is already right and should be kept: table `khanGrades` (DB v6), keyed by a UUID, in the export, in the import, with `pickKhanGrade` in `src/lib/mergeBackup.js`. **All 13 exported tables are read back by the import — do not break that.**

---

## THE FOUR COURSES SHE IS ACTUALLY IN

From her Check-In results. These are the only ones that need units right now.

| Course | Khan URL | Why |
|---|---|---|
| **2nd Grade Math** | `https://www.khanacademy.org/math/cc-second-grade-math` | Geometry 2.00, Measurement & Data 2.00, Patterns 2.98 |
| **3rd Grade Math** | `https://www.khanacademy.org/math/cc-third-grade-math` | Numbers & Operations 3.48, Fractions & Decimals 3.89 |
| **Grammar** | `https://www.khanacademy.org/humanities/grammar` | Grammar & Usage 2.15 |
| **3rd Grade Reading & Vocabulary** | `https://www.khanacademy.org/ela/cc-3rd-reading-vocab` | Reading 3.46, Vocabulary 2.91, Writing 2.45 |

The other 13 courses in `src/data/khan/khanMap.js` can wait until she reaches them.

---

## HOW TO GET THE UNIT LISTS — this is the part that will trip you up

**A plain page fetch of a Khan course returns only metadata.** Khan is a JavaScript app; `WebFetch` gets the title and nothing else. Do not conclude from that that it cannot be done.

**Lamar's app did it, and his log says exactly how** (`master plan lamars app/PROJECT_LOG.md`, around line 3663):

> *"Verified 6 real Khan Academy 7th-grade math units by searching for each one independently and confirming it against Khan Academy's own domain (not guessed, not trusted from any single secondary source)."*

So: **search for each unit, confirm it against khanacademy.org itself, and record the URL you confirmed.** One unit at a time. If a unit cannot be confirmed, **write down that it could not** — do not invent it and do not soften it. That is the same standing rule as the videos.

My browser is also available if you need it, but ask me first and tell me why.

**Khan renames and reorganises units.** `src/data/khan/khanMap.js` says so in its own header, and the 63 unit names already in that file were written down months ago. Treat them as a starting point to check, not as truth.

---

## THE GRADING — and one question I have to answer first

I enter a fraction. The app turns it into a percentage and a letter.

**Ask me which scale before you write it**, because the two candidates disagree about my granddaughter's transcript:

- **Standard school scale** — 90–100 = A · 80–89 = B · 70–79 = C · 60–69 = D · under 60 = F
- **Lamar's Khan table** — Mastered = A · Proficient = A-/B+ · Familiar 90–99% = B · Familiar 70–89% = C · under 70% = D

Lamar's table describes Khan's **mastery labels**, not a test score. On it, 9 out of 10 is a **B**. On the standard scale it is an **A**. **Do not pick for me.**

---

## LOCKED DECISIONS FROM LAMAR'S APP — carry these across

From his `PROJECT_LOG.md`, and they were learned the hard way:

- **A unit is completed by THE PARENT ENTERING THE KHAN SCORE**, or by an import carrying that same event. A daily checkbox records **the day** and must **never** advance a unit. His log points at `scripts/verify-khan-unit-completion.mjs` — *"that file asserted the opposite for two days and the whole arc is written into it."*
- **No reward is payable twice for the same work.** Every earning path carries a receipt or a first-time guard.
- **Khan Academy Grades gets its OWN dedicated tab, not nested in a dropdown** — *"an earlier version was found to be practically invisible this way."* Mine is currently nested under Gradebook. **Ask me whether to pull it out**, because my §3 asked for fewer tabs and these two rules disagree.

---

## LOCKED DECISIONS FROM MY OWN APP — do not reopen

- **The app never invents a Khan grade.** Khan has no public API; a generated number would look exactly like one I typed and end up on a transcript. A check already fails the build if anything but the Grown-Up Corner form writes one.
- **Azianna never sees a percentage or a letter.** She sees a band. A check already fails the build if a percentage reaches a screen she can open. **The letter grade is for the record, not for her.**
- Petals pay for **effort, never accuracy**.
- The **practice gate never blocks**, and **nothing in the Journal is graded**.

---

## HOW I WANT YOU TO WORK — these are not suggestions

1. **Ask me before building.** Tell me the scope you intend and wait. Do not surprise me with 40 files.
2. **Run all the checks on my machine after every change** — `for s in scripts/*.mjs; do node $s; done` via the device bridge. Not in your sandbox. Mine.
3. **Every fix gets a check that would have caught it, and you negative-test it by reintroducing the bug.** No exceptions. That rule is why this app works.
4. **A check must never claim more than it tests.**
5. **A rule I have to act on is a CHECK, not a warning.**
6. **When I repeat a complaint, check the CHECK before you check the content.**
7. **A contradiction in what I asked for is a question, not a judgement call.**
8. **A new assertion goes ABOVE the line that prints the report.** Two rules at v3.19 pushed errors into the void because they sat below it.
9. **Never invent or guess a URL** — Khan or YouTube. Confirm it against the real domain, and **write down every failed search.**
10. **Verify against the disk, not against what I tell you.**
11. **Restart the dev server after every update** — I do this, you can't. Remind me.
12. **A rule the app must follow lives in the ENGINE or a lib, where a check can test it.** `useAppStore.js` cannot run under node, and three separate bugs were hiding inline in it.
13. **A new table has to be in every backup path** — the schema, `exportAll`, `importBackup`, and `mergeBackup`. `check-import` fails the build if it isn't.
14. **Use a curly apostrophe (’) in JSX text.** A straight one opens a string in `check-jsx`'s parser and it reports a phantom unclosed tag. Known limitation, not fixed.
15. **Do not copy files from your uploads folder over files on my disk.** That clobbered two good files in one session. **Edit in place.**
16. **You cannot delete on my machine** — `mv` into `_to_delete/` and tell me what you moved.
17. **Update the master plan and the build log when you finish a version**, and bump the version stamp in `src/config/buildStamp.js`.

---

## WHAT I EXPECT AT THE END

- Every unit of those four courses, in order, with a **confirmed** link — and a written list of anything that could not be confirmed.
- I open one screen, see the units, and enter **9/10**. It shows **90%** and the letter, on whichever scale I chose.
- A **Course Challenge** entry that only becomes available once every unit in that course has a grade.
- It all goes in the export and comes back on the import, **and the parity check still passes**.
- Checks written and negative-tested, the version stamped, the master plan and build log updated.

---

## ALSO STILL OPEN — not this job, don't get pulled into it

Gradebook tabs per app-taught course by quarter · My Levels holding her grades · a browsable projects area · §4.2 journal feedback (needs my answer) · §4.3 export child → parent · §4.4 weekly spelling and vocabulary · 192 lessons still to write · a generated `STATUS.md` · check #23 lesson-prose readability · **Azianna's laptop is still on v2.8** · my five diagnostic re-takes.
