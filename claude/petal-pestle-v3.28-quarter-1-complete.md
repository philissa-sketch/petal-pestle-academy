# The Science Lab · Quarter 1 complete — v3.25 to v3.28

**Aug 16 2026. Four versions, shipped one module at a time, every one checked on Gigi's disk.**
**25 automated checks, all passing at v3.28.**

---

## What Gigi asked for, and what she got

> *"Finish The Science Lab. 48 lessons across Quarter 1 and Quarter 3. Six are done."*

**Quarter 1 is finished: 24 lessons, 240 bank questions, 24 verified videos, all six of its Georgia elements.** Quarter 3 — Modules 5 to 8, the remaining nine elements — is not started and has no blueprint.

| | Before | After |
|---|---|---|
| Science Lab lessons | 6 | **24** |
| Science Lab questions | 60 | **240** |
| Georgia elements with a lesson | 11 of 25 | **16 of 25** |
| Weeks she can sit a test in | 32 | **40** |
| Automated checks | 24 | **25** |
| **Science Lab lessons she could actually open** | **0** | **24** |

That last row is the whole story of v3.25.

---

## v3.25 — The Science Lab was written and she could not reach it

**Module 1 shipped at v3.24 with six lessons, sixty questions, a verified video on each, its own check passing, and a line in the build log saying it was wired in.**

**Nothing in the app imported it. Not one file.**

| Consumer | Read | Could reach The Science Lab |
|---|---|---|
| `LessonsView.jsx` — the screen she reads lessons on | `herbalismCourse.js` | **no** |
| `assessmentEngine.js` — weekly tests, quarter exams | `herbalismCourseBank.js` | **no** |
| `WarmUpCard.jsx` — her three questions every morning | `herbalismQ1Bank.js` | **no** |
| `GradebookPanel.jsx` — the record a transcript is built from | `herbalismCourseBank.js` | **no** |
| `catchUp.js` — Friday | `herbalismCourse.js` | **no** |
| `WEEKS` in `config/assessment.js` | one key: `herbalism` | **no** |

The only trace of the course anywhere in `src/components` was a microscope emoji printed beside its name on the year plan.

### Twenty-four checks were green the whole time

`check-sciencelab.mjs` imported the data files directly with node and asked whether the **data** was well-formed. **It never once asked whether a screen could reach any of it.** That is the ninth time a check in this project has claimed more than it tested, and it is the same shape as the Unit 6 bug at v3.21: testing what an answer *looks like* instead of what it *is*.

### And this exact failure was fixed once before, at v3.3

A lesson written, delivered, and imported nowhere. What came out of it was a sentence in the build log — **"placed is not shipped"**. A sentence in a log is not a rule. Twenty-one versions later the identical thing happened to a whole course instead of one lesson.

### Check #25 · `check-delivery.mjs`

**A lesson that is written is a lesson she can reach.** It asserts:

1. Every course with written lessons is in the app-wide course index.
2. Every course the app teaches has weeks registered, or it can never produce a test.
3. **The reachability triple** — every written lesson sits in exactly one week, has bank questions behind it, and is findable by the app-wide lookup.
4. Every screen and lib reads the app-wide door, **asserted by reading the source as text**, because an import can be right in the data layer while a screen carries on calling the old one.
5. **Herbalism is undisturbed** — its 895 questions come through the new door identical, by id.
6. Every Science Lab module has a bank behind it.
7. No raw course id ever reaches her screen *(added v3.28)*.
8. A quarter exam waits for its quarter to be built, not just sat *(added v3.28)*.

**Six negative tests at v3.25, all six catching** — including the original bug put back, and one that fails the build if widening the door ever drops a single Herbalism question.

### Four more real bugs the widened door exposed

**Friday judged both courses against one marker.** Reading a Herbalism lesson in week 5 would have put Science Lab weeks on her catch-up list as debt she never incurred — the one thing `catchUp.js`'s own header forbids. **Catch-up is per course now**, and a course she has not started produces nothing.

**The Science Lab quarter exam would have unlocked after two weekly tests of a planned eight**, drawn twenty-four questions from six lessons, and called itself a quarter exam. It now waits for the quarter to be *built* as well as sat, and the screen says which it is waiting for.

**The interleaving rule counted the Science Lab's first week as the 33rd week of Herbalism.** The engine was always right — `weeksBefore()` filters by course — so only the check mismeasured.

**Sixty Science Lab questions had never been measured for reading load**, because `check-assessment` only ever read Herbalism's bank. Seven prompts were over the line. **All seven were reworded, not exempted.**

### The reading exemption is derived, not listed

A long word is forgiven on a Science Lab question **only if a Science Lab lesson teaches it by name**, in its own `words` list or glossary. So *friction*, *unbalanced*, *refraction* and *translucent* pass because they **are** the content — the same allowance made for *photosynthesis*. **"wheelbarrow" and "properly" did not**, and those questions were rewritten.

Pasting a failing word into a list until the failure goes away is how a check quietly stops meaning anything. **The exemption cannot be widened without actually teaching the word.**

---

## v3.26 — Module 2 · Gravity, and Which Way Is Down

Weeks 3–4, **S4P3b**. The lessons had been sitting on disk since before v3.24 with nothing importing them. This version gave them their sixty questions, put them in the course index, registered weeks 3 and 4, and corrected the plan from 6 lessons written to 12.

The pull that never switches off · why a stone and a pebble land together · **the root that grows down whichever way the seed lay** · mass against weight · what she would weigh on six worlds · why the moon has been falling toward us for four and a half billion years without arriving.

**Lesson 9 is the one that justifies this course existing.** `STANDARD_OWNERS` has carried that vehicle for S4P3b since v3.5, written before there was a lesson to put it in. Physical science taught through her own bean jar.

**The last lesson is the standard itself.** Georgia does not ask her to *know* about gravity — it asks her to **construct an argument**. So the five lessons before it exist to give her something to argue from, and the sixth is her building the case out of her own four experiments.

### The negative test I said I could not run

At v3.25 I recorded plainly that reverting `check-sciencelab` to read a single module's bank **did not fail**, because with one module written those were the same sixty questions, and that I would run it again the moment there was a second.

**Put back at v3.26 it fails on the first line:** `sl-m2-01: 0 bank questions, not 10`.

### And the checks caught two real things on the way in

A prompt was a word over the cap — *"A full can is harder to lift than an empty one. Why?"*, twelve words against eleven. Rewritten.

**Lesson 12 was carrying an exemption it no longer needed.** Its `coverageNote` said the video does not teach the word "evidence" — true when the module was drafted alone. Now the rule reads the whole course, the video covers three of the lesson's four words, and **the build failed for carrying a waiver it did not need**, which is exactly what that rule is for. The exemption came out; the reason stayed as a note in the file.

---

## v3.27 — Module 3 · Six Simple Machines in the Garden Shed

Weeks 5–6, **S4P3c**. **One machine per lesson**, because Georgia names exactly six and each is a genuinely different thing.

| Lesson | In her shed |
|---|---|
| The lever | the trowel under the pot |
| The wheel and axle | the barrow wheel |
| The pulley | the hanging basket |
| The inclined plane | the plank up to the raised bed |
| The wedge | the spade going into the soil |
| The screw | the jar lid |

**This is the module that proved the blueprint wrong the first time.** The original draft bundled the six into three lessons and then went hunting videos — which is precisely how a lesson called *"the pulley and the screw"* ended up carrying a video titled *Types of Levers*.

**Four of its videos had never been found.** The blueprint named them by title and channel and no id existed anywhere. All four searched in a real browser and all six verified against oEmbed.

**Safety, stated rather than assumed:** the wedge lesson uses **a butter knife and clay — no pruners and no axe** — and a grown-up hands the knife over and takes it back.

### `check-standards` was doing what the app did at v3.24

It imported Herbalism's lessons and called the result *"every lesson in the app"*. So The Science Lab's fifteen Georgia elements printed as **"still owed" on every run** no matter how many lessons were written. Eighteen lessons carrying S4P3a, S4P3b and S4P3c existed and the report said none of them were taught.

**A gap printed too large looks like honesty and is not.** It buried real work — and the one thing that check actually *fails* on, a course claiming to be complete with holes in it, could never have been judged correctly for that course either.

It reads every course now, and **it asserts that it can see every course that owns elements**, so narrowing it back fails immediately.

---

## v3.28 — Module 4 · Light, and What It Meets

Weeks 7–8, and the only Quarter 1 module carrying more than one element: **S4P1a, S4P1b and S4P1c**, two lessons each.

**Her greenhouse is a building made of this module** — glass light goes straight through, staging it cannot pass at all, and a milky roof in between, all within arm's reach at once.

Transparent, translucent and opaque · **the shadow an opaque thing throws** · light travelling in straight lines with dust to prove it · the mirror and the angle · the pencil that is not really broken · a water drop working as a lens.

**Lesson 20 pays off twice.** A shadow is not a thing, it is a **place light could not reach** — and she will use that sentence again in Quarter 3 when the moon puts the Earth's shadow on itself.

**What it deliberately does not teach:** colour, and that white light is made of colours. Both are wonderful and neither is in Georgia's fourth-grade standards. **The prism stays in the drawer.**

**The safety rule of the module:** never look at the sun, and never point a mirror or a lens at it or at anybody's eyes. Written into every activity rather than said once.

### The exam titled itself "sciencelab, Quarter 1"

The course-name lookup was a ternary with one course hard-coded and **the course id as the fallback** — so the first quarter exam a second course could sit put a database id in front of a nine-year-old. Small, and exactly the kind of thing that ships: it could only appear on a paper that could not be opened until the whole quarter existed. Fixed, and a check now fails the build if any exam title contains a course id.

### The negative test that could not fail, made to fail

Putting the quarter-exam bug back changed nothing, **because every registered quarter happened to be complete** — `built` and `planned` were the same number, so the mutation was invisible.

Rather than record it as passing, the assertion was rewritten to test the **rule** instead of today's data: *a quarter is eight teaching weeks because the quarter shape says so, never because eight weeks happen to exist.* The Science Lab's empty Quarter 3 distinguishes the two immediately, and **it now catches.**

---

## Quarter 1, finished

| Module | Lessons | Weeks | Element | Spread |
|---|---|---|---|---|
| 1 · Push, Pull, and What Wins | 6 | 1–2 | S4P3a | 15/15/15/15 |
| 2 · Gravity, and Which Way Is Down | 6 | 3–4 | S4P3b | 15/15/15/15 |
| 3 · Six Simple Machines in the Garden Shed | 6 | 5–6 | S4P3c | 15/15/15/15 |
| 4 · Light, and What It Meets | 6 | 7–8 | S4P1a · S4P1b · S4P1c | 15/15/15/15 |
| | **24** | **8** | **6 of 6** | **60/60/60/60** |

**The Quarter 1 exam opens** — eight weeks registered, twenty-four questions across all four modules, and it refused to open until the whole quarter existed.

**Eight prompts across Modules 3 and 4 came in over the reading cap. Every one was rewritten rather than exempted.**

---

## The Black-American-educator requirement: 0 of 24

**Twenty-eight searches across Quarter 1, every one written into the lessons.** Two findings recorded as what they are rather than as gaps closed:

- **`STEM with Mr N`** — an individual creator on the pulley search. **Identity not established; recorded as unknown.** Its video is an activity rather than a lesson on what a pulley is.
- **`Ubongo Kids English` and `Super Sema`** — both have a *Refraction Of Light In Water* video that maps well onto Lesson 23. **Both are African productions — Ubongo is Tanzanian, Super Sema is Kenyan-set.** That is Black-led educational media and it is **not** the same thing as a Black American educator, which is what the standing requirement says. **Recorded as a real find, described accurately, and flagged to Gigi as hers to decide.**

Full record in `claude/science-lab-q1-videos-verified.md`, which was **rewritten at v3.28 because the version standing until then was the rejected v1 list** and claimed everything was verified.

---

## What is still owed

| | |
|---|---|
| **The Science Lab, Quarter 3** | **24 lessons, Modules 5–8** — sound, stars and planets, the moon. **Nine Georgia elements. No blueprint and no videos found.** |
| Social Studies | 64 lessons — **and its Georgia standards do not exist on disk**, whatever `curriculumPlan.js` claims |
| The Human Body | 64 lessons, enrichment, written last on purpose |
| The Khan grades screen | fraction → % → letter on Lamar's +/− ladder |
| Writing & grammar in the Journal | **3 questions need Gigi's answer** |
| Weekly spelling and vocabulary | 360 + 360 words |
| Gradebook tabs per course by quarter · a browsable projects area | |
| Generated `STATUS.md` | **would have prevented the stale videos doc as well as three count-drift bugs** |
| **Azianna's laptop** | still on **v2.8** |

**146 lessons still to write, 126 of 272 done.**

---

## The rules this run added to the record

- **A lesson that is written is a lesson she can reach — and that is a CHECK, not a sentence in a log.** *(v3.25)*
- **A file named after one course must never stand in for the whole app.** *(v3.25)*
- **An exemption from a reading rule is DERIVED from what is actually taught, never a list a failing word can be pasted into.** *(v3.25)*
- **A gap printed too large is not honesty. It hides real work and it breaks the one thing the check fails on.** *(v3.27)*
- **A negative test that cannot fail is not a passing negative test. Say so, and either rewrite the assertion to test the rule instead of today's data, or run it again when the data can tell the difference.** *(v3.25, v3.26, v3.28)*
- **A raw id must never reach her screen.** *(v3.28)*
