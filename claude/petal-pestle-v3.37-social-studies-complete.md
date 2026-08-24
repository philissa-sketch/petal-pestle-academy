# Social Studies is finished — v3.31 to v3.37

**Aug 17 2026. 25 automated checks, all passing on Gigi's disk.**

---

## Every Georgia fourth-grade standard this app owes is now taught

```
SCIENCE:        25 of 25 units have a lesson behind them.
SOCIAL STUDIES: 36 of 36 units have a lesson behind them.
TOTAL:          61 of 61 Georgia units have a lesson behind them.
```

**Three courses marked complete**, and each claim is tested by the same check that fails on a false one.

| | Before | After |
|---|---|---|
| Social Studies lessons | 0 | **48** |
| Social Studies questions | 0 | **480** |
| Verified videos | 0 | **48** |
| Georgia units taught | 0 of 37 | **36 of 36** *(SS4E2 declared out)* |
| Whole app | 144 of 272 | **192 of 256** |
| Questions in the bank | 1,375 | **1,855** |
| Weeks she can sit a test in | 48 | **72** |

---

## ⭐ The standing requirement, finally answered

**The Science Lab: 0 of 48 across 33 searches. Social Studies Quarter 1: 0 of 16 across 18 searches.**

**Quarter 3 found four.**

| Lesson | Channel |
|---|---|
| **33 · Frederick Douglass** | **Seed of Melanin Kids!** |
| **34 · Harriet Tubman** | **The Magic In Me TV — Black History Series For Kids** |
| **46 · Taking the vote back** | **Black History Files** |
| **48 · How long Jim Crow lasted** | **The Blk History Channel** |

**Recorded as LIKELY, not confirmed.** Identity is judged from name and presentation only, and **unknown is recorded as unknown, never as a gap closed.** TED-Ed's Tubman lesson, held as an alternate, is **authored by Janell Hobson** — a named scholar, which is a stronger attribution than a channel name.

**39 searches across the course, every one written down**, including the two that found nothing.

---

## ⭐ Five lessons taught by Georgia Public Broadcasting

Her own state's educational broadcaster:

- **21 · Trail of Tears** — GPB's own *Tragedy in Georgia*
- **31 · The cotton gin and the railroad**
- **43 · The 13th, 14th and 15th Amendments**
- **47 · Jim Crow laws**
- **13 · Federal, state and shared powers**

**And two lessons happened where she lives.** Cherokee removal began in this state. Sherman's Atlanta Campaign came through it. She can point at both from a car window.

---

## Where the ten spare lessons went

**48 lessons for 36 units.** The blueprint gave Quarter 3 six of the twelve spare, and this is why:

| Element | Lessons | Why |
|---|---|---|
| **SS4H4a — abolition and suffrage** | **3** | Georgia names five people in one line. One lesson makes them a list to recite. Douglass gets his own; Tubman and Truth share one; Anthony and Stanton share one — **including the moment the two movements split**, which is part of the honest story. |
| **SS4H6c — sharecropping** | **2** | Replacing slavery and taking the vote back are different machines. One lesson works a year of debt on paper until the number goes below zero. |
| **SS4H6d — Jim Crow** | **2** | The laws, and the practices. Georgia names both. |
| SS4H1a, SS4H1c, SS4H3b, SS4H3c, SS4H5c, SS4H5d, SS4E1f | 2 each | Multi-part elements with two videos that teach different halves |

---

## The lessons that will be remembered

**Lesson 11 asks her who "We the People" left out** — and does not tell her. Lesson 10 has just taught her the framers counted enslaved people as three fifths. She answers it herself.

**Lesson 23 is Cherokee removal from Georgia.** The Supreme Court said it was unlawful and it happened anyway. Her activity is measuring north Georgia to Oklahoma on a real map and working out the days at ten miles a day.

**Lesson 32 is the cotton gin.** A machine that saved labour made slavery **larger**, because every other step was still done by hand. She writes the six steps of growing cotton, circles the one the gin touched, and underlines the five it did not.

**Lesson 45 runs one sharecropping year on paper.** Harvest of a hundred, landowner takes half, thirty for credit at his store. Then a second year with a harvest of seventy. **It ends below zero, and that is the point of the lesson.**

**Lesson 46 takes apart three rules** — poll tax, literacy test, grandfather clause — **that kept Black men from voting without ever mentioning race.** She invents a fair-sounding rule of her own and finds the way it always favours one person.

**Lesson 48 sends her to talk to somebody.** Jim Crow did not end in a history book; it ended inside living memory. The last activity of forty-eight is a conversation with an older person, arranged by a grown-up, asking what school was like when they were nine. **The final ledger entry in the whole course is a sentence she collected herself.**

---

## What the checks caught, and what caught the checks

**Four checks failed on Module 1's first run and three of them were the check, not the course.**

- `check-curriculum-volume` carried a literal `social: 0` where the data had four
- `check-assessment` measured a two-day course with a **three-day ruler**
- Same file demanded an **8-question test** from a course declaring 5
- The **derived reading exemption was one course wide** — Social Studies got nothing for *liberty* and *loyalist*, words its own lessons teach

Those numbers had been per-course in `curriculumPlan.js` since **v3.22**. Nothing propagated them, and nothing fired until a two-day course existed. **An assumption that is true of every course in the app is still an assumption.**

### ⚠️ And the engine was handing her the wrong paper

`buildWeeklyTest` used the global eight for every course. The first two-day week got an **eight-question test drawn from two lessons** — more than three questions per lesson taught, **the exact thing `check-curriculum-volume` forbids one file away.**

It tested the *declaration*. Nothing tested whether the engine obeyed it.

> **A rule enforced on the number in the config, and not on the paper the child is handed, is half a rule.**

### One negative test missed and earned a new assertion

Removing the clamp that scales the earlier-weeks share left the paper five questions long, so the length check stayed green while the mix went from one old question to two. **A five-question test with two old questions is a three-question test of this week's work.** The engine's own comment already said so — **a rule stated in a comment and not tested is a rule nobody is keeping.**

### simulate-year found the last one, and it was its own

Social Studies week 1 **never became sittable in 170 school days**. The simulation walked weeks in order, one test a day, so a re-take of week 3 beat the first sitting of week 33 every time — and a first sitting is offered only on the day its last lesson is read.

**The real week is not ambiguous: Thursday is this week's test, Friday is catch-up.** Never-sat units go first now. Then the run was extended from 170 days to **260** rather than lowering the bar from 2.0 retrievals — *the whole course plus a real tail*.

---

## Roughly twenty prompts reworded, none exempted

*Benedict · remembered · Madison · governments · newspaper · president · colonist · Oregon · California · Sequoyah · Cherokee · Gettysburg · Appalachian · Cumberland · travelling* — none is taught by name in this course, so none earned the derived exemption. **Proper nouns moved into the choices, which are not measured.**

**One word did earn it: `telegraph`.** Georgia's SS4E1f names it, beat 2 teaches it, and it is defined in the lesson's glossary — the same allowance made for *friction* and *refraction* in The Science Lab. **The judgement is written into the file so the difference is visible.**

---

## Sources deliberately not used

**PragerU / PragerU Kids appeared in at least nine searches across the course.** Learn Liberty and the Foundation for Economic Education appeared in the economics searches. **None is used anywhere.**

They are advocacy organisations with a stated political position, not neutral educational publishers. **The exclusion is written into each lesson file with a verified alternate beside it**, rather than quietly applied.

**It cost two lessons their video.** Specialization and voluntary exchange folded into the trade lesson — where Georgia's own wording puts them anyway: SS4E1 asks for these concepts *"to illustrate historical events"*, not to stand alone. **The cost is stated rather than hidden, and Gigi can overrule it.**

---

## What is left in the app

| | |
|---|---|
| **The Human Body, 64 lessons** | Enrichment. **No Georgia element.** Written last on purpose. The only course left. |
| The Khan grades screen | Fraction → % → letter on Lamar's +/− ladder |
| Writing & grammar in the Journal | **3 questions need Gigi's answer** — and the programme is scoped |
| The Annual Progress Report | Georgia wants one per core subject per year. The app holds every input and cannot print it. |
| Weekly spelling & vocabulary · Gradebook tabs · a browsable projects area | |
| **Check #26 — lesson-prose readability** | Bank questions are measured on every course; **the lesson prose still is not** |
| Generated `STATUS.md` | Would have prevented three count-drift bugs and two false claims |
| **Azianna's laptop** | Still on **v2.8** |

**64 lessons still to write, 192 of 256 done.**

---

## Still needing Gigi

1. **`Lh8wC-qoqgw`** — the 3/5 Compromise video in lesson 10. Five minutes, squarely about slavery and the Constitution. **She should watch it before it plays.**
2. **The advocacy exclusion** — PragerU, Learn Liberty, FEE. It cost two lessons their own video.
3. **A Black-scientists module for The Science Lab** — two real finds from v3.30 that fit no lesson there.
4. **The Ubongo / Super Sema question** from Science Lab lesson 23.
