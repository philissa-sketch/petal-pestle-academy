# v3.34 — Social Studies has lessons, and the app was handing her the wrong paper

**Aug 17 2026. 25 automated checks, all passing on Gigi's disk. 148 of 256 lessons.**

---

## Module 1 · The Road to Revolution

**Weeks 1–2 of Quarter 1. Mondays and Wednesdays. 4 lessons, 40 bank questions, 4 verified videos.**

| # | Lesson | Georgia | Video |
|---|---|---|---|
| 1 | **The war that came with a bill** | SS4H1a | *The French & Indian War* — Bow Tie Guy and Wife, 3:25 |
| 2 | **The people who refused** | SS4H1a | *Sons and Daughters of Liberty* — Academy 4 Social Civics, 4:28 |
| 3 | **Who was on which side** | SS4H1b | *Figures of the American Revolution* — Bow Tie Guy and Wife, 3:21 |
| 4 | **The morning the shooting started** | SS4H1c | *Battles of Lexington and Concord* — Pursuit of History, 3:48 |

**Answer spread 10/10/10/10**, and per lesson 3/3/2/2 · 2/2/3/3 · 3/2/3/2 · 2/3/2/3. The first draft came out 3/3/4/0 for lesson 3 — **slot D unused, which is the exact failure Gigi caught in The Science Lab's first bank** — and was rebalanced by reordering choices so the `null` stayed on the answer.

**Delivered in the same version it was written.** Door, weeks and bank entry all land together, because at v3.24 The Science Lab shipped a module that nothing in the app imported and twenty-four checks stayed green.

---

## The video search changed a lesson before a word was written

**The first sweep for lesson 2 returned twelve results and not one mentioned the Daughters of Liberty**, whom Georgia names by name. Everything findable was Boston Tea Party.

A dedicated second search found a video covering **both Sons and Daughters** — which is the element exactly. **Eighteen searches across the quarter, every one written down, including the one that found nothing.**

---

## Four checks failed on the first run. Three were the check, not the course.

| Failure | What was actually wrong |
|---|---|
| *"Social Studies claims 4 lessons written; the data has 0"* | `check-curriculum-volume` carried a literal `social: 0`. Right failure, wrong reason — **the data had four, the check had a hard-coded zero.** |
| *"plans 2 lessons; the week shape is 3"* | `check-assessment` measured a two-day course with a three-day ruler. |
| *"an 8-question test needs at least 11"* | Same file, same cause — it read the global eight. |
| Long words over the Q1 cap | **This one was the course**, and it was reworded. |

**Both those numbers have been per-course in `curriculumPlan.js` since v3.22.** Nothing propagated them. Until v3.34 every registered week belonged to a three-day course, so nothing fired.

**The same shape as the reading floor at v3.29: an assumption that is true of every course in the app is still an assumption.**

### And the derived reading exemption was one course wide

It built one vocabulary set from The Science Lab's lessons and handed it out on the `sl-` prefix. **Social Studies got no exemption at all** for *liberty* and *loyalist* — words its own lessons teach by name in `words` and the glossary.

**Derived per course now. The rule itself did not move.** *colonist*, *Benedict* and *remembered* are **not** taught by name and were **reworded, not added to anything.** One prompt — *"Benedict Arnold is remembered because he:"* — carried two long words in six, 33% against a 6% cap. The name moved into the choices, where it belongs.

---

## ⚠️ The engine was handing a nine-year-old the wrong paper

`buildWeeklyTest` used the **global eight for every course.** So the first two-day week in the app got an **eight-question test drawn from two lessons.**

That is more than three questions per lesson taught — **the exact thing `check-curriculum-volume` forbids, one file away.** It tested the *declaration*. Nothing tested whether the engine obeyed it.

> **A rule enforced on the number in the config, and not on the paper the child is handed, is half a rule.**

Fixed in the engine, where a check can reach it, and asserted in `check-assessment` against the declared number. The earlier-weeks share now scales with the paper too — **two of eight is a quarter; two of five is nearly half, and a five-question test with two old questions is a three-question test of this week's work.**

---

## simulate-year found the last one, and it was its own

**Social Studies week 1 never became sittable in 170 school days.**

The simulation walked the weeks in order and sat one test a day. So a **re-take of week 3 beat the first sitting of week 33, every time** — and a first sitting is only offered on the day its last lesson is read. **Losing that day loses it for ever.**

**The real week is not ambiguous about this.** Thursday is *this* week's test; catch-up is Friday. Never-sat units go first now. That is the schedule, not a loosened bar.

---

## One negative test missed, and earned a new assertion

Removing the clamp that scales the earlier-weeks share **left the paper five questions long**, so the length assertion stayed green while the mix went from one old question to two.

**A five-question test with two old questions is a three-question test of this week's work**, and Thursday's score is filed as this week's grade either way.

**The engine's own comment already said that.** A rule stated in a comment and not tested is a rule nobody is keeping. The check now asserts the rule directly — at least one question from earlier, at most a quarter of the paper — rather than copying the engine's arithmetic, which would make it agree by construction and test nothing.

**Two negative tests on the engine, both catching after the second was rewritten.**

---

## Where it stands

| | |
|---|---|
| **Lessons written** | **148 of 256** (58%) |
| Herbalism | 96 / 96 · complete |
| The Science Lab | 48 / 48 · complete |
| **Social Studies** | **4 / 48 · building** |
| The Human Body | 0 / 64 · planned |
| Questions in the bank | **1,415** |
| Weeks she can sit a test in | **50** |

---

## Still open on this course

1. **Lesson 6, natural rights (SS4CG1a)** — folded into lesson 5, the Declaration, because four searches found no video that is both usable for a nine-year-old and neutral. **The freed slot went to splitting SS4H2b**, so the Great Compromise and the Three-Fifths Compromise each get their own lesson and their own verified video.
2. **`Lh8wC-qoqgw` — the 3/5 Compromise video.** Verified, 5:13. **Gigi should watch it before it ships.**
3. **PragerU and Tuttle Twins are excluded** as advocacy sources rather than neutral publishers. Written down, not quietly applied.
4. **Modules 2–4 of Quarter 1** — 12 lessons, videos already found and verified.
5. **No chosen video is from a channel identifiable as Black-led.** Three real finds on the Black soldiers of the Revolution exist and are recorded; Gigi chose to leave the cut as it was, so they are unused. **Q3 is where the requirement bites hardest** — Douglass, Truth, Tubman, sharecropping, Jim Crow.
