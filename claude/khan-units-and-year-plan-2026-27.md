# Khan units confirmed + the 2026–27 year plan

**Aug 16 2026.** Everything here was read off Khan's own rendered pages in Gigi's browser, or off her disk. Nothing was guessed from a search result. **No code was written in this session** — this is the research and the decisions that came out of it.

---

## 1. TWO LIVE BUGS FOUND IN THE SHIPPED APP — both still unfixed

### 1.1 The 2nd grade maths link is dead

`src/data/khan/khanMap.js` line 30:

```js
math2: { label: '2nd Grade Math', url: 'https://www.khanacademy.org/math/cc-second-grade-math' }
```

Rendered twice in a real browser. Both times: **"Oops! — Page not found | Khan Academy"**.

**The live address is `https://www.khanacademy.org/math/cc-2nd-grade-math`.** Not "second". `2nd`.

Her Geometry (2.00) and Measurement & Data (2.00) both route to this course, so it is the course her plan sends her to most, and the Maths block opens an error page.

**Why nothing caught it, and why nothing ever will automatically:**

- Khan serves **HTTP 200** for the dead URL and renders "Page not found" client-side. The served HTML's `<title>` is byte-identical to a working course.
- Khan's public API is **gone** — `GET /api/v1/topic/<slug>` returns `410 API removed`.
- **Therefore no node check can verify a Khan URL is alive.** Any check written must assert *shape* (a unit URL is never a bare course front page; every entry carries a verification date) and must say plainly that it cannot verify liveness. A check must never claim more than it tests.

### 1.2 Two 3rd-grade ELA unit names do not exist

`khanMap.js` calls the 3rd grade reading units **"Reading informational text"** and **"Vocabulary"**. Khan's real units are **Pets · Homes · Extreme Environments**. The link resolved, so the wrong label was never caught.

---

## 2. THE COURSE CATALOGUE — what actually exists at her grades

Read from Khan's `/math` index (139 course links), the Essentials collection, the Pre-K–8 collection (33 courses) and Khan's own search.

**2nd grade: exactly one course.** No *2nd grade foundations*, no *2nd grade Eureka*, no *2nd grade essentials* (Essentials starts at 3rd), no *Get ready for 2nd grade* (Get ready starts at 3rd). The Eureka/EngageNY family starts at 3rd.

**3rd grade: nine.** `cc-third-grade-math` · `cc-third-grade-math-essentials` · `3rd-grade-foundations-engageny` · `3rd-engage-ny` · `3rd-grade-illustrative-mathematics` · `grade-3-fl-best` · `grade-3-tx-teks` · `3rd-grade-math-eureka-squared-aligned` · `3rd-grade-math-ny-next-gen`. The last five are the same maths re-cut to another state's standards; Georgia is not among them. **Not profiled on purpose.**

---

## 3. CONFIRMED UNITS — 36 maths + 10 grammar + 7 reading

All rendered and read Aug 16 2026. Every unit also carries a unit-test URL of the form `{unitSlug}/{lastLessonSlug}/test/{unitSlug}-unit-test`; the middle segment varies and **cannot be guessed**.

### 2nd grade math — `/math/cc-2nd-grade-math` — 8 units · 75 skills · Course Challenge ✅

| # | Unit | Slug |
|---|---|---|
| 1 | Add and subtract within 20 | `x3184e0ec:add-and-subtract-within-20` |
| 2 | Place value | `cc-2nd-place-value` |
| 3 | Add and subtract within 100 | `cc-2nd-add-subtract-100` |
| 4 | Add and subtract within 1,000 | `cc-2nd-add-subtract-1000` |
| 5 | Money and time | `x3184e0ec:money-and-time` |
| 6 | Measurement | `cc-2nd-measurement-data` |
| 7 | Data | `x3184e0ec:data` |
| 8 | Geometry | `x3184e0ec:geometry` |

Course Challenge: `test/x3184e0ec:course-challenge`

### 3rd grade math — `/math/cc-third-grade-math` — 14 units · 142 skills · Course Challenge ✅

| # | Unit | Slug |
|---|---|---|
| 1 | Intro to multiplication | `intro-to-multiplication` |
| 2 | 1-digit multiplication | `3rd-basic-multiplication` |
| 3 | Addition, subtraction, and estimation | `imp-addition-and-subtraction` |
| 4 | Intro to division | `intro-to-division` |
| 5 | Understand fractions | `imp-fractions` |
| 6 | Equivalent fractions and comparing fractions | `equivalent-fractions-and-comparing-fractions` |
| 7 | More with multiplication and division | `imp-multiplication-and-division` |
| 8 | Arithmetic patterns and problem solving | `arithmetic-patterns-and-problem-solving` |
| 9 | Quadrilaterals | `quadrilaterals-3rd` |
| 10 | Area | `imp-geometry` |
| 11 | Perimeter | `3rd-perimeter` |
| 12 | Time | `time` |
| 13 | Measurement | `imp-measurement-and-data` |
| 14 | Represent and interpret data | `represent-and-interpret-data` |

Course Challenge: `test/x95ab04602940c446:course-challenge`

### 4th grade math — `/math/cc-fourth-grade-math` — 14 units · 154 skills

Place value · Addition, subtraction, and estimation · Multiply by 1-digit numbers · Multiply by 2-digit numbers · Division · Factors, multiples and patterns · Equivalent fractions and comparing fractions · Add and subtract fractions · Multiply fractions · Understand decimals · Plane figures · Measuring angles · Area and perimeter · Units of measurement

*(Unit slugs still to be pulled — only the ordered names and counts were captured.)*

### Grammar — `/humanities/grammar` — 10 units, all with unit tests · Course Challenge ✅

1 the noun `parts-of-speech-the-noun` · 2 the verb · 3 the pronoun · 4 the modifier · 5 the preposition and the conjunction · 6 Punctuation: comma and apostrophe · 7 Punctuation: colon, semicolon and more · 8 Syntax: sentences and clauses · 9 Syntax: conventions of standard English · 10 Usage and style

Course Challenge: `test/x00307e86:course-challenge`. **Units 8–10 are middle-school syntax — not part of a 4th grade finish.**

### The ELA hole, and how the 4th grade target closes it

| Course | Units | Unit tests |
|---|---|---|
| `/ela/cc-2nd-reading-vocab` | 3 — Fairy Tales Retold · The Moon · Rural, Suburban, Urban | **0** |
| `/ela/cc-3rd-reading-vocab` | 3 — Pets · Homes · Extreme Environments | **0** |
| `/ela/4th-grade-reading-and-vocab` | **7** | **4 + Course Challenge** ✅ |

The 3rd grade page carries 77 links: 49 videos, 15 exercises, 6 articles, **0 assessments**. Khan's gradeable ELA starts at exactly 4th grade. **Khan's graded grammar courses are 5th–6th, 7th–8th, 9th–10th — there is no elementary one.**

---

## 4. LOCKED DECISIONS FROM THIS SESSION

### 4.1 The grading scale — Lamar's real +/− ladder

Gigi first chose "Lamar's Khan mastery table" (*Mastered=A · Proficient=A-/B+ · Familiar 90-99%=B · Familiar 70-89%=C · under 70%=D*). **It cannot be implemented as a score converter and that was worth a second question:**

- "Mastered" and "Proficient" are Khan's **labels**, not scores. Strip them and the numbered bands stop at B — **no fraction could ever produce an A.**
- **100% matches no band at all.** Familiar tops out at 99.

**And his app does not use it for scores.** Three real grades in his `PROJECT_LOG.md`: **9/11 → 82% → B−** (Decimal Place Value, Aug 10), **96% → A**, **100% → A**. Under the table 82% is a C and 96% is a B. He enters fractions, exactly as Gigi wants to.

**Chosen ladder — no A+, because his 100% is a plain A:**

| A | A− | B+ | B | B− | C+ | C | C− | D+ | D | D− | F |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 93–100 | 90–92 | 87–89 | 83–86 | 80–82 | 77–79 | 73–76 | 70–72 | 67–69 | 63–66 | 60–62 | <60 |

**9/10 = 90% = A−.** Rounding is `Math.round` (9/11 = 81.8 → 82 → B− ✓).

**Honest limit, to be written into the lib header:** his read-only folder holds markdown and no source. The band edges are **inferred from three real grades**, not read from his code. The three rule out both other candidates and fit this ladder exactly.

### 4.2 Other decisions

| Decision | Answer |
|---|---|
| Khan grades screen | **Its own Grown-Up Corner tab** — 6 groups → 7. `check-links.mjs:322` currently errors above 6 and must be updated *with the reason recorded in it*, not silently widened. |
| Sequencing | **Khan units now** → spelling & vocabulary next → Reading course last |
| Diagnostic re-take | **Not happening.** Geometry, Measurement, Patterns, Grammar and Writing stay recorded as *"at or below 2.0"* floors, not measurements, and the re-measure flag stays lit. That is honest, not a bug. |
| Screen organisation | By **course**, not subject — "Unit 1" is ambiguous across two maths courses |
| Data layer | Keep `khanGrades` (DB v6), the UUID key, `pickKhanGrade`, and all 13 tables in the import parity check |

---

## 5. THE YEAR — Clayton County Public Schools 2026–27

The same calendar Lamar's app uses, handed over by the parent and computed from, not estimated.

| Period | Dates | Days | ~Weeks |
|---|---|---|---|
| Q1 | Aug 3 – Oct 31 | 58 | ~12 |
| Q2 | Nov 1 – Dec 31 | **38** | ~8 |
| Q3 | Jan 1 – Mar 31 | 56 | ~11 |
| Q4 | Apr 1 – **May 26** | **38** | ~8 |
| Summer | Jun 1 – Jul 31, **3 days/week** | 26 | ~5 |
| **Year** | | **216** | **~44** |

**Two rules do the heavy lifting:**

1. **Thanksgiving, Winter and Spring run at 3 days a week, not closed** — because she is homeschooled. Adds 11 days: Q2 30→38, Q4 35→38. Fall Break, Labor Day, MLK and the February break **are** off.
2. **Summer is a real term**, same subjects at a lighter pace. Lamar's maths finished "every quarter plus Summer".

Khan pacing target: **one unit per week of instruction** — Q1 ~12, Q2 ~8, Q3 ~11, Q4 ~8, Summer ~5 ≈ **44 units a year**. She needs 36. **8 weeks of slack, all of it in Q1.**

Deadline-excluded: Thanksgiving week · **Dec 19 – Jan 4** · May 23 onward.

**Georgia:** 216 days × 5.50 h = **1,188 h** against O.C.G.A. § 20-2-690's 180 days × 4.5 h = 810 h. 36 days of headroom.

---

## 6. GIGI'S GOAL: 4th grade finished in every subject by end of summer 2027

| Subject | Block | Source | State |
|---|---|---|---|
| Mathematics | 60 min | Khan — 36 units | ✅ confirmed, nothing to write |
| Reading | 60 min | Khan — 4th grade reading & vocab, 7 units | ✅ confirmed, nothing to write |
| Language Arts & Writing | 60 min | Khan Grammar 1–7 + **880 words** | ⚠️ words to write |
| Herbalism & Botany | 45 min | app | ✅ **96 / 96** |
| Science — The Science Lab | 30 min | app — 15 Georgia elements | ❌ **0 of 48 · Q1 RUNNING NOW** |
| Social Studies | 30 min | app — 13 standards, 37 elements | ❌ **0 of 96** |
| The Human Body | 30 min | app | ❌ 0 of 48 — **enrichment, written last** |

**Verdict: reachable, and the constraint is writing time, not her school day.** 371 maths skills over 216 days is ~35 min per skill.

**Two findings that make it reachable:**

- **The 4th grade target fixes the reading hole** rather than creating one — Khan's gradeable ELA starts at exactly 4th.
- **The Human Body is off the critical path.** `curriculumPlan.js` says it: *"ENRICHMENT, stated plainly. No Georgia fourth-grade standard covers the human body."* 192 lessons → **144**.

**Two conditions:**

- **Friday must become a real teaching day.** 216 days assumes five. At four it is ~170 and the plan fails. Lamar's maths runs 60 min every day including Friday; only his 2:15 rotating block goes quiet.
- **Summer is not optional.** Skip it and 4th grade maths loses Unit 14 and all three Course Challenges. The year ends **July 2027**, not May.

**The pressure point:** the year opened **Aug 3** and it is **Aug 16**. Social Studies and The Science Lab both run in Q1 with nothing written. Content must be built a quarter ahead of her, the way Herbalism was — not all up front.

---

## 7. LAMAR'S WEEKLY WORD SYSTEM — to be built next

360 spelling + 360 vocabulary = 36 weeks × 10 each, in two pools.

**The rotation rule:** the list rotates on a **strict 7-day calendar whether or not the quiz was passed**. Missed words carry into next week, backfilled to 10. **A quiz never taken carries the whole list forward, treated as fully missed — never silently dropped.** `weekStartDate` advances by **exactly +7 days**, never "today", so it cannot drift; a month unused catches up in one pass.

**His daily rhythm is Mon introduce · Tue/Wed practice · Thu review · Fri test.** Hers must move the test to **Thursday** — Mon introduce · Tue practice · Wed review · **Thu test** · Fri catch-up. Practice days must never touch the rotation; only the real test grades. **Missing a day never locks anything.**

**None of his 720 words transfer** — 7th grade, Greek and Latin roots, an aerospace capstone week. Hers must be written at a **2.5 reading level**, herbalism-flavoured: sentence, definition and three distractors each.

**His Reading is not Khan either** — Mission Control's own course, original prose with comprehension questions, grown 5 lessons/20 questions → 40 lessons/160 questions. Every biography is a verified Black STEM figure, a standing rule in his project.

---

## 8. DELIVERED THIS SESSION

`year-plans/` on her disk (`C:\Users\pknot\Downloads\petal-pestle-academy\year-plans\`) — **eight separate one-page printables**, master calendar plus one per class. Each verified at exactly one page by rendering to PDF and counting; the master ran to two on the first build and was trimmed. The master is also a persisted artifact, `petal-pestle-year-calendar`.

## 9. NEXT

Build the Khan units screen: `src/data/khan/khanUnits.js` + `src/lib/khanGrading.js` (the ladder in §4.1, in a lib so a check can test it) + the rebuilt panel on its own tab + checks, each negative-tested. Then bump `buildStamp.js` and update the master plan and build log.

**Still to pull:** 4th grade math unit slugs, and unit-test URLs for 4th grade math and 4th grade reading.
