# START-HERE PROMPT — The Science Lab, Quarter 3

**Copy everything below the line into a new Cowork conversation.**

**⚠️ This file was the Quarter 1 prompt until Aug 16 2026. Quarter 1 is finished — v3.28, 24 lessons, 240 questions, 24 verified videos, all six of its Georgia elements. This is now the Quarter 3 prompt.**

---

You are writing lessons for **Petal & Pestle Academy**, my 9-year-old granddaughter Azianna's homeschool app. I am Gigi.

**App:** `C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy` · `localhost:5180`, `strictPort` on · database `PetalPestleDB` · **currently v3.28 · 25 automated checks, all passing.**

**Lamar's app is at `C:\Users\pknot\Downloads\mission-control-homeschool-school-start-gate\mission-control-homeschool` and is READ-ONLY.** Read the **code** for what his app does; read his `docs/` for why. Never write to it.

> ⚠️ **Updated Aug 26 2026.** This line used to point at `Lamar DOC\docs`, which held documents and no code. Gigi deleted that folder on Aug 26 after it caused two wrong answers in three days — a grading scale read out of a stale log, and a whole book report feature built from notes while his running app sat unopened. **Do not go looking for it.**

Read these first:

- `claude/petal-pestle-build-log.md` — **every version, every bug, and the rules that came out of them.** *(The per-version delivery notes this line used to point at were moved to `_to_delete/` on Aug 26 2026 — the build log supersedes all of them.)*
- `claude/science-lab-q1-videos-verified.md` — the 24 Quarter 1 videos, all re-verified Aug 16
- `claude/petal-pestle-master-plan.md` and `claude/petal-pestle-build-log.md` — the plan, the history, the locked decisions
- `claude/post-build-backlog-gigi.md` — my list, in my words

---

## THE JOB

**Quarter 3 of The Science Lab. Modules 5 to 8, 24 lessons, 240 bank questions, and the nine Georgia elements nobody has touched.**

| Element | What it is |
|---|---|
| **S4P2a** | Sound — rubber bands, rulers and jars of water. Strength and speed of vibration. |
| **S4P2b** | Build a thing that sends a message across the yard. |
| **S4E1a** | From the naked eye to Galileo to James Webb. |
| **S4E1b** | Why the sun looks bigger than every other star. |
| **S4E1c** | Stars burn. Planets do not. |
| **S4E1d** | Build a scale solar system and find out what the model gets wrong. |
| **S4E2a** | Why the light lasts longer in June — and why that matters to a gardener. |
| **S4E2b** | Draw the moon every night for a month. |
| **S4E2c** | The tilt. Why Georgia has a first and last frost date at all. |

Those vehicle sentences are already in `STANDARD_OWNERS` in `curriculumPlan.js` and have been since v3.5. Use them.

### THERE IS NO BLUEPRINT AND NO VIDEO HAS BEEN FOUND

**Do the blueprint first and wait for my approval on it**, the way Quarter 1 was done. That stage is what caught a lesson called *"the pulley and the screw"* carrying a video titled *Types of Levers* — **before a word of prose had been written, so nothing was wasted.**

The blueprint needs, for each of the 24 lessons: a distinct topic, its Georgia element, and **the video that teaches it, already verified.** Not a title I hope exists. A confirmed id.

### Then each module ships on its own

Bank → course index → `SCIENCELAB_BANKS` → weeks in `WEEKS` → `curriculumPlan.js` count → all 25 checks on my machine → bump `buildStamp.js` → tell me the number to look for in the nav bar.

**`check-delivery` will fail the build if you forget any of those**, which is the point of it.

---

## THE THINGS I HAVE ALREADY CAUGHT — do not make me say them again

**1. THE VIDEO MUST TEACH THE LESSON.** Every lesson must be a genuinely different topic. **If no video exists that teaches a lesson, the lesson is not distinct enough.** That is not permission to reach for something adjacent. `check-sciencelab` tests it, and a real exception needs a written `coverageNote` — **which the check also fails once it stops being needed.** That fired for real at v3.26.

**2. THE RIGHT ANSWER HAS TO MOVE AROUND.** My first bank had 42 of 60 answers in slot B and none in slot D. The check fails the build if any slot holds more than 40% or is never used — **per module as well as across the course**, because six even modules will average a lopsided seventh back into range. Aim for even quarters.

**3. A WRITTEN LESSON IS A LESSON SHE CAN REACH.** Module 1 of this course shipped at v3.24 with six lessons, sixty questions and 24 green checks, and **no screen in the app could open a single one of them.** `check-delivery` exists because of that. Do not let it be the thing that catches you.

**4. THE READING CAP APPLIES, AND THE EXEMPTION IS EARNED.** A long word is forgiven only if a lesson teaches it by name in its own `words` list or glossary. **Fifteen prompts across Quarter 1 came in over the cap and every one was rewritten rather than exempted.** Expect the same. "vibration" and "orbit" will pass. "instrument" and "telescope" will not unless you teach them.

---

## HOW EVERY LESSON IS BUILT

Read `src/data/lessons/sciencelabM4.js` — it is the newest and cleanest — and `src/data/assessments/sciencelabM4Bank.js`.

| | |
|---|---|
| Shape | Check-In → **two beats**, each with a hook, teaching, a worked example and an **Apply-It answered on the spot** → a 3-question check |
| Length | **30 minutes** for The Science Lab (`blk-science`). Herbalism is 45. |
| Reading level | **~2.5.** Her reading is the constraint, not her age. |
| Video | one verified video, with `teaches`, `verified`, and a `sourceGap` sentence |
| Bank | **10 questions per lesson**, four choices, **exactly one null in `feedback` and it sits on the right answer**, every wrong choice its own sentence, a `why` on every question |
| Setting | her greenhouse, her garden, her kitchen |
| Activity | hands-on, away from the screen, **with a safety line** |
| Ledger | in her own words, with an **"if she is stuck"** |

**Quarter 3 has a real safety burden and you must not soften it.** Do not have her look at the sun for the seasons lessons or the star lessons — **not for a second, not through anything, not through a telescope, not through a pinhole she is looking into.** Sun work is done by projection onto paper with the sun behind her, or it is not done. Say so in every activity where it could come up.

**Every video is verified against YouTube's oEmbed endpoint** — `https://www.youtube.com/oembed?url=...&format=json` — and the title stored is the string it returns, character for character. **DO NOT USE noembed.com**; at v3.9 it "verified" a deliberately fake id. A Quarter 1 candidate returned **HTTP 401** (embedding disabled) and was recorded rather than quietly swapped.

**Black American educators are actively sought and every failed search is written down.** **Quarter 1 came up 0 of 24 across 28 searches, all recorded.** Channel identity is judged from name and presentation only — **unknown is recorded as unknown, never as a gap closed.** Two Quarter 1 findings are recorded as what they are rather than counted: `STEM with Mr N` (identity not established) and `Ubongo Kids English` / `Super Sema` (**African productions — Tanzanian and Kenyan — which is not the same thing as a Black American educator; my call, still open**).

---

## HOW I WANT YOU TO WORK — these are not suggestions

1. **Ask me before building.** Tell me the scope you intend and wait. Do not surprise me with 40 files.
2. **Run all the checks on my machine after every change** — `for s in scripts/*.mjs; do node $s; done` via the device bridge. Not in your sandbox. Mine.
3. **Every fix gets a check that would have caught it, and you negative-test it by reintroducing the bug.** No exceptions.
4. **A check must never claim more than it tests.**
5. **A rule I have to act on is a CHECK, not a warning.**
6. **When I repeat a complaint, check the CHECK before you check the content.**
7. **A contradiction in what I asked for is a question, not a judgement call.**
8. **Never invent or guess a URL.** Confirm it against the real domain, in a browser, and **write down every failed search.**
9. **Verify against the disk, not against what I tell you** — and not against the app's own comments or its own docs either. **At v3.25 the build log said a course was wired in and no screen could reach it.**
10. **Restart the dev server after every update** — I do this, you can't. Remind me.
11. **A rule the app must follow lives in the ENGINE or a lib, where a check can test it.**
12. **Do not copy files from your uploads folder over files on my disk. Edit in place.**
13. **You cannot delete on my machine** — `mv` into `_to_delete/` and tell me what you moved.
14. **Update the master plan and the build log when you finish a version**, and bump `src/config/buildStamp.js`.
15. **Use a curly apostrophe (’) in JSX text.** A straight one opens a string in `check-jsx`'s parser and it reports a phantom unclosed tag at the wrong line. Known, not fixed.
16. **If a negative test cannot fail, say so.** Do not record it as passing. Either rewrite the assertion to test the rule instead of today's data, or run it again when the data can tell the difference. **Both happened in Quarter 1 and both are written down.**

**You have my browser.** Use it — do not describe verification as something a human should do later.

---

## STILL OPEN AFTER THIS — not this job

- **Social Studies, 64 lessons** — and its Georgia standards **do not exist on my disk**, whatever `curriculumPlan.js` claims. Transcribe from the GaDOE document first, the way the science ones were, and extend `check-standards` to cover both.
- **The Human Body, 64 lessons** — enrichment, no Georgia element, written last on purpose.
- **Writing & grammar in the Journal**, plus book reports and research papers — `claude/writing-programme-notes.md`. **Three questions in there need my answer first.**
- Weekly spelling and vocabulary · the Khan grades screen · Gradebook tabs per course by quarter · a browsable projects area · **a generated `STATUS.md`** · **check #26, lesson-prose readability** — bank questions are measured now, the lesson prose itself still is not.
- **Azianna's laptop is still on v2.8.**
