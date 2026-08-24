# Herbalism video lengths — measured, and **18 need your call**

**Aug 17 2026 · all 96 Herbalism videos now measured · the build is RED on purpose**

---

## What you asked for is done

| | Before | After |
|---|---|---|
| Herbalism videos with a recorded length | **11 of 96 — 11%** | **96 of 96 — 100%** |
| The whole app | 107 of 192 — 56% | **192 of 192 — 100%** |

Every length was read from the **duration badge**, which is rendered from YouTube's own metadata and is immune to ads. **None was estimated.** 85 lengths written, and a line-by-line diff confirms **every single changed line is a `minutes:` line** — no lesson content was touched. Originals are in `_to_delete/v3.46-herbalism-backup/`.

**A note on how they were read.** All 85 came off five bulk playlists built from the video ids, twenty at a time, rather than by opening 85 pages. That matters for one reason: **the player clock lies while an ad is running** — it reported 1:00, 0:46 and 0:35 for videos that are actually 3:35, 3:08 and longer. The badge does not.

---

## And now the honest part: **the build fails, with 18 real problems**

Herbalism's ceiling is **8 minutes** — derived, not typed: a 45-minute lesson gives the System Concept 12 minutes, and that block holds the video **and two beats**.

**Eighteen of the ninety-six are over it. Two of them are over half an hour.**

I have not declared them for you. **A declaration is made by a person, with a name and a date** — that is your own rule from v3.33, and me quietly adding eighteen ids to a list on your behalf would be exactly the thing it exists to stop. So the build stays red until you say.

| Lesson | Module | Min | Channel | Video |
|---|---|---|---|---|
| `hb-m12-05` | The Growing Year | **31** | SSEHeritageFarm | Saving Seeds from Flowers and Herbs — Ira Wallace |
| `hb-m12-02` | The Growing Year | **30** | Epic Gardening | How To Start Seeds Indoors Under Lights (COMPLETE GUIDE) |
| `hb-1-11` | The Plant Detective | **17** | Black Rock Forest | Tree Identification: How to use a Dichotomous Key |
| `hb-m7-02` | Herbs in History | **16** | Maddie Moate | How Does Cinnamon Grow?! |
| `hb-m10-06` | Reading the Sky | **14** | Gardener Scott | Understanding Your First Frost Date |
| `hb-m10-01` | Reading the Sky | **13** | Lisa Spencer | Weather School 4 Kids: How to read a weather map |
| ⭐ `hb-m13-03` | From Plant to Medicine | **13** | The Lawrence Hall of Science | **The Story of: Percy L. Julian \| Black Voices** |
| `hb-m7-06` | Herbs in History | **12** | Royal Botanic Garden Edinburgh | RBGE Herbarium: Basic Plant Collecting and Pressing |
| `hb-m12-06` | The Growing Year | **12** | Huw Richards | Preparing Raised Beds for Winter |
| `hb-m3-01` | The Garden Is an Ecosystem | **11** | Homeschool Pop | The Food Chain for Kids |
| `hb-1-01` | Roots, Shoots and Soil | **11** | Homeschool Pop | Plant Parts and Functions for Kids |
| `hb-m1-04` | The Plant Life Cycle | **10** | Garden Ninja | Plant Types Explained |
| `hb-m9-04` | Weather in the Garden | **10** | Homeschool Pop | Clouds for Kids |
| `hb-m11-04` | The Apothecary | **10** | America's Test Kitchen | The Science Behind Tea |
| `hb-m7-05` | Herbs in History | **9** | Townsends | Okra Soup with Michael Twitty |
| `hb-m12-01` | The Growing Year | **9** | Organic Backyard Gardening | How To Plan A Vegetable Garden |
| ⭐ `hb-m15-03` | **Black Women in Medicine** | **9** | American Chemical Society | **Dr. Marie M. Daly: Chemistry Pioneer** |
| `hb-m16-05` | The Herbalist's Year | **9** | Miacademy & MiaPrep | Communicating Results |

### ⭐ Two of the eighteen are the ones you cannot easily replace

**`hb-m13-03` — Percy L. Julian**, from The Lawrence Hall of Science's *Black Voices* series, and **`hb-m15-03` — Dr. Marie M. Daly**, the first Black woman in America to earn a chemistry doctorate, in the module that exists to carry exactly this.

**This is the same shape as the Frederick Douglass video in Social Studies**, which you declared rather than cut. Across three courses, **73 searches have produced almost nothing** in this category. Cutting these two for length would trade the scarcest thing in the app for its newest rule.

### And two are a different order of problem

**31 minutes and 30 minutes**, both in Module 12, in a lesson whose System Concept is twelve. These are not marginally over — a thirty-minute video is longer than a whole Science Lab lesson. Whatever you decide about the other sixteen, these two are worth a separate look.

---

## The rest of Herbalism is in good shape

| Length | Lessons |
|---|---|
| ≤ 4 min | **42** |
| 5–6 min | **28** |
| 7–8 min | 8 |
| 9–12 min | 11 |
| 13+ min | 7 |

**78 of 96 are inside the ceiling, and 70 are five minutes or under.** The course's practice was always sound; it is the tail that drifted, unmeasured, because nothing read the field.

---

## Your options

1. **Declare all 18**, as you did the thirteen at v3.45 — your name, the date, the reason. Build goes green, nothing is re-cut.
2. **Declare 16, replace the two half-hour ones.** The Growing Year keeps its lessons; I find 3–6 minute videos on seed-starting and seed-saving.
3. **Declare the two Black-scientist videos and re-search the other 16.** Most protective of content, most work.
4. **Something else** — tell me and I will do that instead.

**Until you choose, `check-videos` fails and says why.** A red build telling the truth is worth more than a green one that is not.
