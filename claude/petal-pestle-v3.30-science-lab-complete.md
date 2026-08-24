# The Science Lab is finished — v3.25 to v3.30

**Aug 16 2026. 25 automated checks, all passing on Gigi's disk.**

---

## Where it started and where it ended

> *"Finish The Science Lab. 48 lessons across Quarter 1 and Quarter 3. Six are done."*

| | Before | After |
|---|---|---|
| Science Lab lessons | 6 | **48** |
| Science Lab questions | 60 | **480** |
| Verified videos | 6 in use | **48** |
| **Georgia elements with a lesson** | 11 of 25 | **25 of 25** |
| Weeks she can sit a test in | 32 | **48** |
| Automated checks | 24 | **25** |
| **Science Lab lessons she could actually open** | **0** | **48** |

That last row is why this run took six versions instead of four.

---

## v3.25 — the course was written and she could not reach it

Module 1 shipped at v3.24 with six lessons, sixty questions, a verified video on each, its own check passing, and a build-log line saying it was wired in. **Nothing in the app imported it.**

`LessonsView` read Herbalism. `assessmentEngine` read Herbalism. `WarmUpCard` read Herbalism. `GradebookPanel` read Herbalism. `catchUp` read Herbalism. `WEEKS` had one key. The only trace of the course anywhere in `src/components` was a microscope emoji beside its name on the year plan.

**Twenty-four checks were green**, because `check-sciencelab` asked whether the DATA was well-formed and never whether a SCREEN could reach it. Ninth time a check in this project claimed more than it tested.

**And v3.3 had already fixed this exact failure** — a lesson written, delivered, imported nowhere — and recorded the lesson as a sentence in the log: *"placed is not shipped."* **A sentence in a log is not a rule.** Twenty-one versions later it took a whole course.

**Check #25, `check-delivery`.** Six negative tests, all six catching. It also exposed four more real bugs: Friday judging both courses against one marker, the quarter exam unlocking on two weeks of a planned eight, the interleaving rule miscounting across courses, and sixty questions never once measured for reading load.

---

## v3.26 to v3.28 — Quarter 1 finished

| Module | Weeks | Element |
|---|---|---|
| 2 · Gravity, and Which Way Is Down | 3–4 | S4P3b |
| 3 · Six Simple Machines in the Garden Shed | 5–6 | S4P3c |
| 4 · Light, and What It Meets | 7–8 | S4P1a · S4P1b · S4P1c |

**Four of Module 3's videos had never been found** — the blueprint named them by title and no id existed anywhere. **And `check-standards` had the same blindness the app did**, printing all fifteen Science Lab elements as "still owed" however many lessons existed. *A gap printed too large is not honesty.*

**The quarter exam titled itself "sciencelab, Quarter 1"** the first time it could be built — a database id in front of a nine-year-old.

---

## v3.29 to v3.30 — Quarter 3, and the course complete

| Module | Weeks | Element |
|---|---|---|
| 5 · Sound in the Greenhouse | 1–2 | S4P2a · S4P2b |
| 6 · The Sun and the Stars | 3–4 | S4E1a · S4E1b · S4E1c |
| 7 · The Solar System, and What a Model Gets Wrong | 5–6 | S4E1d · S4E1a |
| 8 · The Moon, the Day and the Year | 7–8 | S4E2a · S4E2b · S4E2c |

**Quarter 3 got a blueprint first**, topics before videos, because that stage is what caught *Types of Levers* sitting on a lesson about pulleys.

### Three design decisions worth keeping

**Loud and high are two lessons.** Georgia's S4P2a says *strength* **or** *speed*. They are the pair every child merges, and a merged child answers wrongly in both directions while still saying "vibration" on cue. Lesson 26 holds the note still; Lesson 27 holds the loudness still.

**Module 7 is built backwards from every other version of this topic.** Georgia does not ask her to build a solar system model — it asks her to **evaluate** one, strengths *and limitations*. So she builds a size model where Earth is a grain of salt beside a dinner-plate sun, then a distance model where Earth is one sheet of forty, and then Lesson 41 puts her own two models side by side and asks why they disagree. **They cannot both be right, and finding that out herself is the standard.**

**Lesson 48 closes the course back into her garden.** The tilt is why Georgia has a first and last frost date at all — the number she already counts backwards from in Herbalism to pick a sowing day. Forty-eight lessons of physical science, and the last one explains a line printed on a seed packet.

### Two negative tests failed to fail, and each found a real hole

**Flipping every Q3 lesson to say "quarter 1" changed nothing anywhere.** Nothing compared a lesson's own quarter against the module listing it — and a lesson's quarter is what picks its reading caps, so a mislabelled lesson is measured against the wrong ruler entirely. It fails the build now.

**Then the reading floor.** All sixty of Module 5's prompts were replaced with *"What is it?"* and the floor stayed green — Quarter 3 also holds four Herbalism modules, and sixty questions written far too easy were absorbed by four hundred written correctly. **The floor is measured per course now**, the same shape as the answer-spread rule needing to be per module.

### Lesson 41 nearly failed the distinctness test

Three searches for a video about the *limitations* of solar-system models found nothing usable for a child — which under this project's own rule means the lesson is not distinct enough and the module gets re-cut. The fourth found **`To Scale: THE SOLAR SYSTEM`**, a short film of a group building a model seven miles across in a desert, made for exactly that reason.

**Two caveats in the file rather than buried:** made for a general audience, and about seven minutes against a thirty-minute block. **It closes the lesson; the beats do the teaching.**

### The safety scan fired on an astronomy question

A feedback line contained the word *"cure"*. A false positive on a lesson about starlight — and the v3.10 call stands: **reword the question rather than loosen a check that exists to keep treatment language out of a herbalism app.**

---

## The Black-American-educator record: 0 of 48

**Thirty-three searches across both quarters, every one written into the lessons.** Quarter 1 came up empty across a field dominated by a few large animation channels.

**Astronomy went differently, and it exposed a gap in the blueprint rather than in what exists.** Two real finds:

- **`Coco & Shea Butter Kids` — *BLACK HEROES OF SPACE I BLACK ASTRONAUTS*** (`US-1I-z8SHo`)
- **National Geographic — Katherine Johnson** (`E4j_LpKzcZQ`)

**Neither fits any of the 48 lessons, because both are biographical and every lesson is about a phenomenon.** Identity is still recorded as unknown, never as a gap closed.

**⚠️ NEEDS GIGI'S CALL.** Herbalism has Module 15, *Black Women in Medicine and Botany* — six women and the science each did. **The Science Lab has no equivalent and could have one.** It carries no Georgia element, so it would sit as enrichment or a project rather than replacing a lesson. **Not built, and not without her word.**

---

## The rules this run added

- **A lesson that is written is a lesson she can reach — and it is a CHECK, not a sentence in a log.** *(v3.25)*
- **A file named after one course never stands in for the whole app.** *(v3.25)*
- **A reading exemption is DERIVED from what is taught, never a list a failing word can be pasted into.** *(v3.25)*
- **Catch-up is per course.** *(v3.25)*
- **A quarter exam waits for its quarter to be BUILT, not just sat.** *(v3.25)*
- **A gap printed too large is not honesty.** *(v3.27)*
- **A raw id never reaches her screen.** *(v3.28)*
- **A negative test that cannot fail is not a passing negative test** — say so, then rewrite the assertion to test the rule instead of today's data. *(v3.28, v3.29)*
- **A lesson must agree with its module about which quarter it is in**, because that is what picks its reading caps. *(v3.29)*
- **The reading floor is measured per course**, or one course written too easy hides inside another's average. *(v3.29)*

---

## What is left in the app

| | |
|---|---|
| **Social Studies, 64 lessons** | **and its Georgia standards do not exist on disk**, whatever `curriculumPlan.js` claims. Transcribe from GaDOE first. |
| **The Human Body, 64 lessons** | enrichment, no Georgia element, written last on purpose |
| The Khan grades screen | fraction → % → letter on Lamar's +/− ladder |
| Writing & grammar in the Journal | **3 questions need Gigi's answer** |
| Weekly spelling and vocabulary · Gradebook tabs · a browsable projects area | |
| **Check #26 — lesson-prose readability** | bank questions are measured on every course now; **the lesson prose itself still is not** |
| Generated `STATUS.md` | would have prevented the stale videos doc and three count-drift bugs |
| **Azianna's laptop** | still on **v2.8** |

**128 lessons still to write, 144 of 272 done.**
