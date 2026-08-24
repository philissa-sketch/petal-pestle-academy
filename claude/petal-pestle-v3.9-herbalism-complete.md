# v3.9 — Herbalism & Botany is a complete school year

**Aug 16 2026 · 96 lessons · 16 modules · 32 weeks · all 20 checks passing on Gigi's disk**

Restart the dev server and confirm the nav bar reads **3.9**.

---

## 1. Where it stands

| | v3.8 | **v3.9** |
|---|---|---|
| Herbalism lessons | 48 | **96 — the whole year** |
| Modules | 8 | **16** |
| Weeks wired | 16 | **32** |
| Weekly tests | 16 | **32** |
| Quarterly exams | 2 | **4** |
| Bank questions | 415 | **895** |
| Lessons with a verified video | 48 | **96** |
| **Georgia elements with a lesson** | 6 of 25 | **10 of 25 — Herbalism 10/10** |
| Course total | 48 of 288 (17%) | **96 of 288 (33%)** |

`check-curriculum-volume` now prints **Herbalism & Botany · 96 / 96 lessons · 100% · complete.**
The other three courses still read 0. That is the honest picture: one course of four is finished.

---

## 2. Quarters 3 and 4

| M | Q | Weeks | Title |
|---|---|---|---|
| 9 | 3 | 1–2 | Weather in the Garden — **S4E4a, S4E4c** |
| 10 | 3 | 3–4 | Reading the Sky and the Map — **S4E4b, S4E4d** |
| 11 | 3 | 5–6 | The Apothecary |
| 12 | 3 | 7–8 | The Growing Year |
| 13 | 4 | 1–2 | From Plant to Medicine |
| 14 | 4 | 3–4 | How a Claim Gets Tested |
| 15 | 4 | 5–6 | **Black Women in Medicine and Botany** |
| 16 | 4 | 7–8 | The Herbalist's Year |

**Modules 9 and 10 close out Herbalism's Georgia obligation** — all ten elements the crosswalk
assigns it now have lessons behind them. The remaining fifteen belong to The Science Lab, which has
not been built.

**Module 15** had been in the master plan's mapping table since day one, as this app's answer to
Lamar's Black STEM Trailblazers section, and had never been built. Rebecca Lee Crumpler, Rebecca
Cole, Susan McKinney Steward, Marie Maynard Daly, Jane Cooke Wright, Alexa Canady, Kizzmekia
Corbett, Beronda Montgomery. Every fact was checked against primary sources and **six facts were
dropped rather than asserted** — a disputed graduation year, a hospital founding date, a
widely-repeated claim about ASCO's founders. The detail worth keeping: Daly's 1947 Columbia
dissertation was on **corn starch**, and Azianna grows corn.

---

## 3. The reading level rises, and the check now enforces it in both directions

Gigi's call: Azianna will have had a year of instruction by Quarter 3, and writing her at a
first-grade sentence level in March holds her back.

| | Flesch-Kincaid | words/sentence | long words |
|---|---|---|---|
| Q1 + Q2 (measured) | 1.3 | 6.2 | 3.4% |
| Q3 + Q4 (measured) | **~3.0–4.3** | **8.5–10.4** | **5.3–8.0%** |
| Whole course now | **2.9** | 8.4 | 5.2% |

`check-assessment` previously had **one cap for the whole course**, with a comment saying
"deliberately no wriggle room by level." True for one quarter, wrong across a year. It now carries
**per-quarter caps** — Q1 11 words a sentence, Q2 12, Q3 14, Q4 16 — keyed off each question's own
lesson.

**And it fails in both directions.** Quarters 3 and 4 have a *floor*: if a quarter's questions
average below it, the build fails saying so. The temptation when a Q4 question trips a cap is to
simplify it until it passes; that floor is what stops it. Negative-tested — raising Q4's floor
produced:

> ✗ Quarter 4 questions average 8.8 words a sentence, below the floor of 30. Quarters 3 and 4 are
> supposed to be HARDER than Quarter 1. A question written down to an earlier quarter's level is a
> question that stopped teaching her anything.

**A people-names exemption was added.** The long-word rule was failing questions for containing
"Canady" and "Paracelsus," which measures nothing about how hard a sentence is to read. Names are
exempt as proper nouns, in their own named set — not buried in the subject-vocabulary list, because
they are not vocabulary. Her own garden plants are exempt too: naming turmeric should never cost a
question a readability failure.

---

## 4. What the checks caught during this build

Three real bugs, all found by the checks rather than by reading:

1. **`check-standards` was blind to fourteen files.** It read two lesson arrays and so reported
   **"0 of 25 elements have a lesson"** while ten elements had lessons declaring their codes. Same
   drift `check-curriculum-volume` was caught by on the 14th, in a different file, for the same
   reason: a counter that knows the file layout instead of asking the course. Now reads the
   aggregator. **This is the third face of that bug** — config counts, screen copy, and now a
   standards report. The generated `STATUS.md` is still the fix that closes the class.
2. **The safety scan fired on Paracelsus.** *"Only the dose makes the poison"* tripped the dosing
   regex on the very lesson designed to make her more cautious. The check was right and the fix was
   **not** to loosen it — the prompt was reworded to "the amount," which is better writing anyway,
   since the correct answer already said "amount."
3. **`simulate-year` stopped six weeks short.** Eighty school days cannot reach a 96-lesson course
   (128 school days), and it said so plainly rather than passing. Horizon raised to 170 days. The
   bar was not lowered.

---

## 5. Negative tests — all four caught their bug

| Reintroduced | Caught |
|---|---|
| A whole quarter written too easy | *"Quarter 4 questions average 8.8 words a sentence, below the floor"* |
| A `UNITS` export | *"exports UNITS again. The weekly test REPLACED the unit test"* |
| A lesson dropped from its week | *"lesson hb-m16-06 is in no week — no test will ever cover it"* |
| A false lesson count | *"claims 120 lessons written; the data has 96"* |

---

## 6. Still owed on this course

- **The thirteen flat-card lessons.** Re-homed and working, but they carry `core` cards instead of
  two beats and five bank questions instead of ten. They measure FK 0.2 against the course's 2.9 and
  average ~250 words against ~965. Named in `FLAT_CARD_LESSONS` so the number stays countable.
- **Check #21, lesson-prose readability.** The bank is gated per quarter; the lesson text still is
  not checked by anything. Measurement script at `_to_delete/measure-reading.mjs`.
- **Two videos need Gigi's eye** — real, correct, on-topic, but judgement calls for a child:
  `TvcbIXvWl_k` "How Much Water Can Kill You?" (Reactions/ACS) on the dose lesson, and `HP6Zf1ff7Sw`
  (SciShow, not SciShow Kids) on Marshall's ulcer.
- **Everything in `claude/post-build-backlog-gigi.md`** — the 500-petal economy bug, the message that
  vanished on import, the diagnostic re-take serving repeat questions, the Mon–Thu week change, the
  navigation rebuild. That list is the priority now that the course exists.

---

## 7. The educator gap

Zero in August. Now **ten named Black American figures** across the course, each with its caveat
recorded, and every other lesson carrying a `sourceGap` string naming the searches that came back
empty:

Mary Francis Hill Coley (GPB Education, *Georgia Stories*) · Chesley McNeil (11Alive Atlanta) ·
Ira Wallace (Southern Exposure) · Alexis Nikole Nelson · Michael W. Twitty · Ron Finley ·
Percy L. Julian and Patricia Bath (*Black Voices in STEAM*) · and the six women of Module 15.

The standing finding is unchanged and worth keeping: the gap is in Black-made *elementary-age botany
video*, not in Black expertise.
