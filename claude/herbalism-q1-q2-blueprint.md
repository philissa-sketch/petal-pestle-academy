# Herbalism & Botany — Quarter 1 and Quarter 2 Blueprint

**48 lessons · 16 weekly tests · 2 quarterly exams · 18 weeks**
For approval before any lesson prose is written. Aug 14 2026.

---

## 1. The honest arithmetic

| | Count |
|---|---|
| Lessons Q1 + Q2 owes (24 × 2) | **48** |
| Written to the §10 beats spec today | **1** (Inside a Seed) |
| Written to the old flat-card shape, **video already verified** | **13** |
| Genuinely new lessons to write | **34** |
| New videos to find and oEmbed-verify | **34** |
| Bank questions owed (10 × 48) | **480** — 140 exist, 340 to write |
| Weekly tests | **16** |
| Quarterly exams | **2** (24 questions each, cumulative within the quarter) |

**Correction to the record:** master plan §11.5 says Herbalism has 1 of 52 videos. It is wrong — all 13 Quarter 1 lessons carry a verified video id, and `check-videos.mjs` (#18) would fail the build otherwise. That table needs regenerating, not re-typing. It is exactly the drift the generated `STATUS.md` is meant to stop.

---

## 2. The structural change I am asking you to approve

§6 of the master plan lays out **five modules**. Those five modules cannot carry Quarter 1 and Quarter 2, and here is why:

`STANDARD_OWNERS` gives Herbalism **six Georgia elements in these two quarters** —

| Element | Quarter | What it is |
|---|---|---|
| S4L1a | Q1 | Producers, consumers, decomposers |
| S4L1b | Q1 | Food webs starting at the sun |
| S4L1c | Q1 | Change one thing, predict what follows |
| S4L1d | Q1 | What happens when pollinators stop coming |
| S4E3a | Q2 | Ice, water and vapour — the water cycle |
| S4E3b | Q2 | Transpiration |

The five modules are life cycle, roots and soil, adaptations, pollination, herbs in history. **Ecosystems and the water cycle have nowhere to live in that shape.** Four of the six elements would end up bolted onto a pollination lesson, which is the exact "convenience over honesty" the Science Lab split was created to avoid.

**Proposed: eight modules of six lessons.** Each module is two weeks, six lessons, two weekly tests. Four modules per quarter, exactly 24 lessons, no module split across a quarter boundary — so each quarterly exam covers four whole modules.

This is regular enough that the shape itself becomes predictable for her: every two weeks a new module opens, every fourth day is a test, every ninth week is an exam.

---

## 3. Quarter 1 — Weeks 1–9

### Module 1 · The Plant Life Cycle *(W1–2)* — off-grade S2L1, recorded

| # | Lesson | Source |
|---|---|---|
| 1 | **Inside a seed** | ✅ written to spec |
| 2 | The circle — seed to seed | new · hook is the Day-5 bean results |
| 3 | Seeds that travel | rebuild `hb-1-09` |
| 4 | Annuals and perennials — which herbs come back | new |
| 5 | What a plant needs | new |
| 6 | Look-alikes, and the first rule of the field | rebuild `hb-1-12` · safety, early on purpose |

### Module 2 · Roots, Shoots and Soil *(W3–4)* — off-grade S3L1

| # | Lesson | Source |
|---|---|---|
| 7 | The parts of a plant | rebuild `hb-1-01` |
| 8 | What roots do | rebuild `hb-1-02` |
| 9 | Taproots and fibrous roots — **The Root Race** | new |
| 10 | What the stem does | rebuild `hb-1-03` |
| 11 | What leaves do — making food from light | rebuild `hb-1-04` |
| 12 | Soil is alive | new |

### Module 3 · The Garden Is an Ecosystem *(W5–6)* — **S4L1a–d · Q1's four Georgia elements**

| # | Lesson | Element |
|---|---|---|
| 13 | Producers, consumers, decomposers | S4L1a |
| 14 | Build the compost bin — decomposers at work | S4L1a |
| 15 | The food web starts at the sun | S4L1b |
| 16 | Draw your bucket's food web | S4L1b |
| 17 | Change one thing — what follows | S4L1c |
| 18 | When the pollinators stop coming | S4L1d |

### Module 4 · Adaptations and Protection *(W7–8)* — off-grade S3L2

| # | Lesson | Source |
|---|---|---|
| 19 | Leaf shapes | rebuild `hb-1-05` |
| 20 | The edge of a leaf | rebuild `hb-1-06` |
| 21 | How leaves sit on the stem | rebuild `hb-1-07` |
| 22 | Thorns, fuzz and thick skin | new |
| 23 | Why plants smell strong | new |
| 24 | Climbing, creeping, reaching for light | new |

**Week 9 — Quarter 1 Exam.** Study guide → review game → 24 questions, cumulative across Modules 1–4 and nothing beyond.

---

## 4. Quarter 2 — Weeks 10–18

### Module 5 · Water — the Cycle and the Plant *(W10–11)* — **S4E3a–b · Q2's two Georgia elements**

| # | Lesson | Element |
|---|---|---|
| 25 | Where rain comes from | S4E3a |
| 26 | Ice, water, vapour in a jar on the windowsill | S4E3a |
| 27 | A bag on a leaf — transpiration you can see | S4E3b |
| 28 | From the root to the top leaf | S4E3b |
| 29 | **The Drainage Investigation** — why roots need air | — |
| 30 | Too much and too little — reading a thirsty plant | — |

### Module 6 · Pollination and Partnership *(W12–13)*

| # | Lesson | Source |
|---|---|---|
| 31 | What a flower is for | rebuild `hb-1-08` |
| 32 | Inside a flower — dissect and sort the parts | new |
| 33 | Bees, butterflies, birds and wind | new |
| 34 | Making a pollinator patch | new |
| 35 | Fruit is a seed's ride | new |
| 36 | Partners underground — roots and fungi | new |

### Module 7 · Herbs in History *(W14–15)*

| # | Lesson | Note |
|---|---|---|
| 37 | Before grocery stores and pharmacies | new |
| 38 | Kitchen physic — what is already in Gigi's kitchen | new |
| 39 | Drying and storing for winter | new |
| 40 | **Black American herbalism — the granny midwives and the root doctors** | new · the strongest place in either quarter to close the educator-source gap, and it should be a Black American voice teaching it |
| 41 | Plants that crossed the ocean — okra, sorghum, black-eyed peas | new |
| 42 | Build a flower press | new |

### Module 8 · The Plant Detective *(W16–17)* — the practice of science

| # | Lesson | Source |
|---|---|---|
| 43 | Plant families | rebuild `hb-1-10` |
| 44 | How to key out a plant | rebuild `hb-1-11` |
| 45 | Keeping a field journal | rebuild `hb-1-13` |
| 46 | **The Solar Tea Lab** — extraction with the sun | new · §10.5 signature project |
| 47 | Measuring change over time — the Growth Chart | new |
| 48 | Making a claim and testing it | new |

**Week 18 — Quarter 2 Exam.** 24 questions, cumulative across Modules 5–8.

---

## 5. Every one of the 13 existing lessons is placed

| Old id | Old title | Lands at |
|---|---|---|
| `hb-1-01` | The parts of a plant | M2 · L7 |
| `hb-1-02` | What roots do | M2 · L8 |
| `hb-1-03` | What the stem does | M2 · L10 |
| `hb-1-04` | What leaves do | M2 · L11 |
| `hb-1-05` | Leaf shapes | M4 · L19 |
| `hb-1-06` | The edge of a leaf | M4 · L20 |
| `hb-1-07` | How leaves sit on the stem | M4 · L21 |
| `hb-1-08` | What a flower is for | M6 · L31 |
| `hb-1-09` | Seeds | M1 · L3 |
| `hb-1-10` | Plant families | M8 · L43 |
| `hb-1-11` | How to key out a plant | M8 · L44 |
| `hb-1-12` | Look-alikes, and the first rule | M1 · L6 |
| `hb-1-13` | Keeping a field journal | M8 · L45 |

Nothing is thrown away and nothing is stranded. A rebuild keeps the verified video and the teaching content, and adds: two beats with Apply-Its, a glossary card, and the bank taken from 5 questions to 10.

---

## 6. How it gets delivered

**One module at a time — six lessons, two weeks, two weekly tests.** After each module: all 20 checks run on your machine, dev server restarted, version bumped, and I tell you the number to look for in the nav bar.

Building a module means, in order:

1. **Find and verify six videos first** (§10.7). oEmbed each id, record the title YouTube returns. Black American educators actively sought; every failed search written down.
2. Write the six lessons to what those videos actually say.
3. Ten bank questions each, per-choice feedback, every wrong choice a real candidate.
4. Register the two weeks in `WEEKS`; confirm no lesson sits in both a `WEEK` and a `UNIT`.
5. Run all 20. Negative-test anything new.

**Pace, stated plainly so you can plan against it:** one to two modules per working session at the quality of *Inside a Seed*. Eight modules is therefore **five to eight sessions**, not one. I would rather tell you that now than deliver six good lessons and forty-two thin ones and call Quarter 1 done.

**Order I propose:** Module 1 first — it finishes Week 1, which unblocks the Day-4 review-and-test screen, and that screen has to exist before fifteen more weekly tests are worth building.

---

## 7. What this blueprint changes in the record

- `curriculumPlan.js` gains a `HERBALISM_MODULES` map — 8 modules, 48 lessons, their weeks, their quarters and their element codes — so `check-curriculum-volume` and `check-standards` are measuring against a real plan instead of a total.
- Master plan §6 gets rewritten from five modules to eight.
- §11.5's video count gets regenerated rather than re-typed.
- `TAUGHT_OFF_GRADE` gains S3L2 for Module 4.
