# v3.8 — Quarters 1 and 2 of Herbalism & Botany are built

**Aug 14 2026 · 48 lessons · 8 modules · 16 weeks · 20 checks passing on Gigi's disk**

---

## 1. What changed

| | v3.7 | v3.8 |
|---|---|---|
| Herbalism lessons | 14 | **48** |
| Bank questions | 140 | **415** |
| Weekly tests wired | 1 (of 3 lessons) | **16, all complete** |
| Quarterly exams | 0 | **2** |
| Lessons with a verified video | 14 | **48** |
| Automated checks | 20 | 20 (three rewritten, three negative-tested) |
| Georgia elements with a lesson behind them | **0 of 25** | **6 of 25** |
| Course total | 14 of 288 (5%) | **48 of 288 (17%)** |

The units are gone. The weekly test replaced the unit test, as decided at v3.6 — the migration just could never be partial, because `check-assessment`'s replacement rule fails any lesson sitting in both.

---

## 2. The eight modules

### Quarter 1

| M | Weeks | Title | Lessons |
|---|---|---|---|
| 1 | 1–2 | The Plant Life Cycle | Inside a seed · The circle · Seeds that travel · Annuals and perennials · What a plant needs · Look-alikes |
| 2 | 3–4 | Roots, Shoots and Soil | Parts of a plant · What roots do · The Root Race · What the stem does · What leaves do · Soil is alive |
| 3 | 5–6 | **The Garden Is an Ecosystem** | Producers, consumers, decomposers · Build the compost bin · The food web starts at the sun · Draw your bucket's food web · Change one thing · When the pollinators stop coming |
| 4 | 7–8 | Adaptations and Protection | Leaf shapes · The edge of a leaf · How leaves sit · Thorns, fuzz and thick skin · Why plants smell strong · Climbing and reaching |

### Quarter 2

| M | Weeks | Title | Lessons |
|---|---|---|---|
| 5 | 1–2 | **Water — the Cycle and the Plant** | Where rain comes from · Ice, water, vapour in a jar · A bag on a leaf · Root to top leaf · The Drainage Investigation · Reading a thirsty plant |
| 6 | 3–4 | Pollination and Partnership | What a flower is for · Inside a flower · Bees, butterflies, birds and wind · Making a pollinator patch · Fruit is a seed's ride · Partners underground |
| 7 | 5–6 | Herbs in History | Before grocery stores · Kitchen physic · Drying and storing · **The granny midwives and the root doctors** · Plants that crossed the ocean · Build a flower press |
| 8 | 7–8 | The Plant Detective | Plant families · Keying out a plant · Keeping a field journal · **The Solar Tea Lab** · Measuring change over time · Making a claim and testing it |

---

## 3. The first Georgia standards behind actual lessons

Six of Herbalism's ten elements now have a lesson. Before this, **zero of twenty-five** did across the whole app.

| Element | Lesson | How it is taught |
|---|---|---|
| S4L1a | M3 L13, L14 | Producers, consumers and decomposers in her own compost bin |
| S4L1b | M3 L15, L16 | The food web of her containers, starting at sunlight |
| S4L1c | M3 L17 | Change one thing in the garden and predict what follows |
| S4L1d | M3 L18 | What happens when the pollinators stop coming |
| S4E3a | M5 L25, L26 | Ice, water and vapour in a jar on the windowsill |
| S4E3b | M5 L27, L28 | A bag tied over a living leaf — transpiration she can see |

The remaining four (S4E4a–d, weather) are Quarter 3, as the crosswalk always said.

`S3L2` was added to `TAUGHT_OFF_GRADE` for Module 4 — adaptations are a third-grade standard and the record says so rather than counting them as fourth-grade coverage.

---

## 4. The Black-American-educator gap — first real movement

It has been open since v3.4 and stood at **0 of 20**. It is now **4 of 48**, and every one of the other 44 carries a `sourceGap` string naming the exact searches that came back empty.

| Lesson | Source | Note |
|---|---|---|
| M7 L40 · The granny midwives | **GPB Education**, *Midwife Saint: Mary Francis Hill Coley \| Georgia Stories* | Georgia's own public broadcaster, on a Black Georgian midwife from Albany — about ninety minutes from where Azianna lives. Coley delivered 3,000+ babies; *All My Babies* (1952) is in the National Film Registry. |
| M7 L37 · Before grocery stores | **Alexis Nikole Nelson** (Black Forager), CBS Mornings | Black American plant educator |
| M7 L41 · Plants that crossed the ocean | **Michael W. Twitty**, with Townsends | Black American culinary historian. Recorded honestly: Twitty is the guest, the channel is not Black-owned. |
| M5 L30 · Reading a thirsty plant | **Ron Finley**, TODAY | Black American gardener. Recorded honestly: the host channel is a general news channel. |

**Leads found and written down for later:** Dr Tanisha Williams (founder of Black Botanists Week — the right person for M8's herbarium lesson, no verifiable video found), Amirah Mitchell of Sistah Seeds, Dr Rae Wynn-Grant, Garden Marcus (@gardenmarcuskids — real, Black-led, children's gardening, but pitched younger than nine and no episode matched).

**The honest finding, unchanged:** the gap is in Black-made *elementary-age botany video*, not in Black expertise. Module 7 was where it could be closed, and it was.

---

## 5. What is thin — stated plainly

1. **Video run times are `null` on most new lessons.** oEmbed returns title, author and thumbnail, not duration, and youtube.com itself 429'd every fetch. The ids, titles and channels are hard facts; the durations were not guessed.
2. **YouTube's own oEmbed endpoint was unreachable** through this session's fetch tool. `noembed.com` — which returns YouTube's payload verbatim — was the transport, and every title was cross-checked against an independent search result. Re-verify directly when a session can reach it.
3. **Four videos are title-verified but content-unwatched**: `nP9msHiGkBU` (tropisms — confirm thigmotropism is actually in it, or M4 L24's beat 2 needs a rewrite), `nsXhfpE5NCY` (solar oven), `sgMnb2KgiU4` (bee habitat), `hLq2datPo5M` (FreeSchool food chains).
4. **`hb-m1-04` uses a fallback video** — Garden Ninja, an adult gardening channel. Ten searches across two passes found no children's video anywhere on annuals versus perennials. Per the locked decision the lesson ships and the gap is written into the file in full. The beats and the container sort carry the payload; the video is a look-up, not the spine.
5. **The thirteen re-homed lessons are still flat-card**, with five bank questions rather than ten and `core` cards rather than beats. They render correctly — the beats block is guarded — and they are listed by name in `FLAT_CARD_LESSONS` so the number is countable. Rebuilding them is the next content job.
6. **M4 L23 uses a TED-Ed video** that reads above 2.5. It was chosen because it is the only verified source that teaches the actual thesis — that the smell of a herb is its chemistry doing a job. A lighter verified fallback is recorded in the file.

---

## 6. Checks

All 20 pass on Gigi's disk. Three were rewritten and **three new assertions were negative-tested, each catching its bug**:

- reintroduce a `UNITS` export → *"exports UNITS again. The weekly test REPLACED the unit test at v3.8"* ✓
- drop a lesson out of its week → *"lesson hb-m3-03 is in no week — no test will ever cover it"* ✓
- leave a stale entry in the allowance map → *"is in a week now, but LESSONS_WITHOUT_A_WEEK still excuses it"* ✓

**The replacement rule got stronger, not weaker.** It used to walk `UNITS` and fail a lesson in two places. `UNITS` is gone, so it now fails if the export itself ever comes back.

**`simulate-year` went from 40 school days to 80.** Forty was right for a thirteen-lesson quarter; against 48 lessons over 16 weeks it stopped three weeks short and reported it honestly — three weekly tests never became sittable and the average question had been met 1.9 times. That was the simulation being too short, not the schedule being wrong, and the fix was to run the whole thing rather than lower the bar.

**`check-curriculum-volume` caught a real drift**: it failed when `lessonsWritten` said 48 and the data still said 14, because it was counting two arrays and could not see the new module files. It now counts from one source.

**4,150 strings scanned for dosing and treatment language — none found.**

---

## 6b. My Courses was lying, and now it cannot

**Gigi found this one.** The new courses were not showing on My Courses because that screen was **never wired to the data.** It was hand-typed HTML, and it said:

- *"52 lessons across the year"* — the course is 96
- *"✓ 13 lessons written"* — there are 48
- *"✓ 4 unit tests + a quarter test"* — units were deleted at v3.8
- Quarters 2, 3 and 4 all marked *"Outlined — lessons not written yet"* — Quarter 2 was fully built

Every one of the 20 checks passed while that screen was on the wrong side of the truth. The data was right; nothing connected it to the page.

**Rewritten to read `APP_COURSES`, `HERBALISM_MODULES` and `WEEKS`.** It now shows all four app-taught courses with real counts, and Herbalism's eight modules with their weeks:

```
  Herbalism & Botany       48 of 96  (50%)
  The Science Lab           0 of 48  (0%)
  The Human Body            0 of 48  (0%)
  Social Studies            0 of 96  (0%)
```

**And a new check, #8b, so this class of bug fails the build.** It strips comments from every `.jsx` in `src/components` and fails if any *rendered* copy still says "unit test". Comments keep the history; the screen may not keep the lie.

Negative-tested — putting "4 unit tests" back on My Courses produced:

> ✗ `src/components/Plan/YearPlanView.jsx` still shows the words "unit tests" to her. The weekly test replaced the unit test at v3.8. A screen that describes a test the app no longer has is a screen nobody reconnected to the data.

This is the third face of the same bug: `check-curriculum-volume` caught a hand-typed count in config, this catches hand-typed counts in the UI, and the generated `STATUS.md` — still open — catches them in the documentation. **All 20 checks pass.**

---

## 7. What to do next

1. **Restart your dev server** and confirm the nav bar reads **3.8**. If it does not, the update did not land.
2. Look at **My Lessons** — it is one screen now, eight modules with a quarter toggle, not two competing panels.
3. Next build: **Quarters 3 and 4** (48 more lessons, S4E4a–d), then the thirteen flat-card rebuilds, then The Science Lab and Social Studies.
4. Still open: the Day-4 review screen on **Today**, her learner name is still **PrettyGlow**, and the five re-take strands.
