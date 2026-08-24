# The Science Lab · Module 1 — six verified videos

**Aug 16 2026.** Found, and each one confirmed against **YouTube's own oEmbed endpoint** — every title below is the string YouTube returned, character for character, not a title read off a search result page.

`check-videos` (#18) fails the build outright for a lesson with no video, a missing verification date, an 11-character id that does not match its url, a placeholder title, or an unexplained duplicate. **These are the gating item for Module 1, which is why they were done before a line of lesson prose.**

---

## The six

| Lesson | id | Channel | Title, exactly as YouTube returns it |
|---|---|---|---|
| **1 · Every push and every pull** | `ZLDUrPaLQWE` | Homeschool Pop | Push and Pull for Kids \| Forces in Science |
| **2 · Two forces, one seed tray** | `rnlHxAYwCbg` | GenerationGenius | Forces for Kids \| Balanced and Unbalanced \| Science Lesson for Grades 3-5 \| Mini-Clip |
| **3 · Tug of war with string and weights** | `MCr-C-QaDGA` | Teach Engineering | Physics Tug of War |
| **4 · When nothing moves, is nothing pushing?** | `_-yzCNniwuw` | MightyOwl | Balanced and Unbalanced Forces \| MightyOwl Science \| 3rd Grade |
| **5 · Unbalanced — and which way it goes** | `1R6MxJpEjfs` | Little School | Force and Motion \| Science for Kids |
| **6 · Predict it first** | `Se_e5h9vtms` | Twinkl Teaching Resources - United States | Forces for Kids \| Push and Pull Forces \| Twinkl USA |

All six carry `verified: '2026-08-16'`. No two lessons share a video.

---

## The Black-American-educator requirement: 0 of 6, and here is the search

The standing rule, from Lamar's log and carried into this project: *"actively seek out Black American educators as video sources"*, and **every video that is not from one carries a written record of what was searched for.** Assertion 8 of `check-videos` enforces the record, not the outcome.

**Five distinct searches ran, all in a real browser on YouTube:**

| Search | What came back |
|---|---|
| `Black science teacher forces and motion elementary students` | Little School · Kids Academy — neither identifiable as a Black American educator |
| `African American educator physical science kids channel` | Rock 'N Learn — animated, no identifiable educator |
| `STEM with a Black teacher forces push pull elementary lesson` | Homeschool Pop · ClairbournSchool — neither |
| `push and pull forces for kids science` | Homeschool Pop · Twinkl |
| `balanced and unbalanced forces for kids` | GenerationGenius · MightyOwl |

**Result: 0 of 6.** Same outcome as Herbalism Module 1, which came up 0 of 14 across about a dozen angles.

**The honest reading, repeated from the Herbalism record:** the gap is not in Black expertise. It is that Black-made elementary *physical science* video barely exists as a category on YouTube — the field is dominated by a handful of large animation-led channels. Every lesson below therefore carries a `sourceGap` sentence naming what was searched for, so the next person can see it was tried and pick up rather than start again.

**One caveat worth stating rather than hiding:** channel identity was judged from channel name and presentation only. A channel is not marked as a Black American educator on the strength of a guess.

---

## A note on how these were found

YouTube's results pane returned only **two videos per search** in this browser session — a real limit, not a thorough sweep. Six good candidates were still found across five searches, but **this was not an exhaustive survey of what exists**, and a later pass with a working results page may well find better, and may find the Black-educator source that these five searches did not.

---

## Next

Module 1's six lessons, written to the `Inside a Seed` reference shape — check-in, two beats with Apply-Its answered on the spot, a 3-question check, ~2.5 reading level, 30 minutes for `blk-science` — plus **60 bank questions** in `src/data/assessments/sciencelabM1Bank.js`, a new `sciencelabCourse.js`, and the two weeks registered in `WEEKS`.
