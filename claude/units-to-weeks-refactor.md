# Remove the old units — the exact refactor

**Requested by Gigi, Aug 14 2026.** Not started. Nothing on her disk has changed.
Read this with `claude/herbalism-q1-q2-blueprint.md`, which is approved.

---

## Why it is all-or-nothing

`check-assessment.mjs` line ~171 holds **the replacement rule**:

> `lesson ${lid} is in a WEEK and in a UNIT. The weekly test replaces the unit test`

So the thirteen lessons cannot be moved a few at a time. Either every lesson is in a week and `UNITS` is gone, or the build is red. That is correct design and it should not be loosened to make a partial migration pass — a check that is quietly loosened passes forever and proves nothing.

**Decision recorded:** the thirteen lessons are **re-homed, not deleted.** Deleting them takes the app from 14 readable lessons to 1. Their ids (`hb-1-01` … `hb-1-13`) **do not change**, so her existing lesson and practice records survive. Only the four unit-test records (`hb-q1-u1`…`u4`) are orphaned, and she has not sat them.

---

## The six files

### 1. `src/config/assessment.js`

**Delete** `UNITS`, `allUnits`, `unitById`, `unitForLesson`, `unitsBefore`, `UNIT_TEST`.

**Replace `WEEKS.herbalism`** with the seven weeks that contain at least one written lesson. Weeks with nothing written yet do **not** go here — `WEEKS` is things that can produce a test; the full 16-week plan lives in `curriculumPlan.js`.

```js
export const WEEKS = {
  herbalism: [
    // ---- QUARTER 1 ----
    { id: 'herbalism-q1-w1', course: 'herbalism', quarter: 1, n: 1, module: 1,
      title: 'Seeds',
      lessons: ['hb-m1-01', 'hb-1-09'], planned: 3,
      blurb: 'What a seed is made of, what wakes it up, and how seeds travel.' },

    { id: 'herbalism-q1-w2', course: 'herbalism', quarter: 1, n: 2, module: 1,
      title: 'Coming back, and coming up',
      lessons: ['hb-1-12'], planned: 3,
      blurb: 'Which herbs return, what a plant needs, and the first rule of the field.' },

    { id: 'herbalism-q1-w3', course: 'herbalism', quarter: 1, n: 3, module: 2,
      title: 'Roots and what they do',
      lessons: ['hb-1-01', 'hb-1-02'], planned: 3,
      blurb: 'The parts of a plant, what roots do, and how root shapes differ.' },

    { id: 'herbalism-q1-w4', course: 'herbalism', quarter: 1, n: 4, module: 2,
      title: 'Stems, leaves and soil',
      lessons: ['hb-1-03', 'hb-1-04'], planned: 3,
      blurb: 'What holds a plant up, what makes its food, and what soil actually is.' },

    { id: 'herbalism-q1-w7', course: 'herbalism', quarter: 1, n: 7, module: 4,
      title: 'Reading a leaf',
      lessons: ['hb-1-05', 'hb-1-06', 'hb-1-07'], planned: 3,   // COMPLETE
      blurb: 'Shape, edge, and how leaves sit on the stem.' },

    // ---- QUARTER 2 ----
    { id: 'herbalism-q2-w3', course: 'herbalism', quarter: 2, n: 3, module: 6,
      title: 'What a flower is for',
      lessons: ['hb-1-08'], planned: 3,
      blurb: 'Why a flower exists, what is inside one, and who comes to visit.' },

    { id: 'herbalism-q2-w7', course: 'herbalism', quarter: 2, n: 7, module: 8,
      title: 'Naming and keying',
      lessons: ['hb-1-10', 'hb-1-11', 'hb-1-13'], planned: 3,   // COMPLETE
      blurb: 'Plant families, keying out a specimen, and keeping a field journal.' }
  ]
};
```

**Two weeks are complete on day one** — `q1-w7` and `q2-w7`. Their weekly tests can run the moment this lands, which is the first real proof of the Day-4 flow and it costs no new lesson writing.

### 2. `src/lib/assessmentEngine.js`

- Drop the `UNITS`, `UNIT_TEST`, `unitById`, `unitsBefore`, `allUnits` imports (lines 28–35).
- Delete `buildUnitTest` (~line 194).
- **`buildQuarterTest` is the real work.** It currently walks `UNITS[quarterId]` (lines 293, 331, 477). Rewrite it over `WEEKS`, filtered by `quarter`. Keep everything else identical — the seeded shuffle, the prefer-the-oldest repeat rule, the warm-up exclusion, and "nothing from a lesson taught later."
- Line 299–300's earlier-quarters logic keys off `Object.keys(UNITS)`. Re-key off week `quarter` numbers.

### 3. `src/components/Lessons/LessonsView.jsx`

Currently imports `UNITS, unitForLesson` and renders `UNITS[QUARTER_ID]` as the Quarter 1 panel (lines 8, 100, 110), with the Module 1 panel above it.

**Both panels collapse into one week-ordered list.** This is what removes the "two competing sequences on one screen" the locked-decisions table accepted as temporary. Group by module, label each week, and show `planned` vs written so a 2-of-3 week reads as in progress rather than broken.

### 4. `src/components/Parent/GradebookPanel.jsx`

Lines 3 and 67 read `UNITS['herbalism-q1']`. Swap to weekly tests from `WEEKS`. The test ids are already `<course>-q<n>-w<n>`, so the Gradebook, the re-take rule and the two-machine merge need no new plumbing.

### 5. `scripts/check-assessment.mjs`

- Delete the `LESSONS_WITHOUT_A_UNIT` map (line 77) and every unit assertion (lines 111–135, 528–565).
- **The replacement rule (line 164–171) stays** and becomes trivially true — keep it anyway; it is what stops units coming back.
- Port the unit-test assertions to weeks: blueprint adds up, no question twice on a paper, nothing from a lesson taught later, interleaving reaches backwards, two rebuilds identical.
- Add `LESSONS_WITHOUT_A_WEEK` — **empty on landing**, named and printed, failing in both directions, same pattern as the map it replaces.

### 6. `src/config/curriculumPlan.js`

Add `HERBALISM_MODULES` — the 8 modules, 48 lessons, their weeks and their element codes, from the approved blueprint. Add `S3L2` to `TAUGHT_OFF_GRADE` for Module 4. Leave `lessonsWritten: 14` alone; it is still correct.

---

## Order of work

1. `assessment.js` — weeks in, units out
2. `assessmentEngine.js` — quarter test over weeks
3. `check-assessment.mjs` — port the assertions
4. **Run all 20.** Expect red until the two UI files are done.
5. `LessonsView.jsx`, `GradebookPanel.jsx`
6. **Run all 20 again. All must pass.**
7. **Negative-test:** put `hb-1-01` back into a `UNIT` and confirm the replacement rule catches it. Then remove a lesson from a week and confirm `LESSONS_WITHOUT_A_WEEK` catches it.
8. Bump to **v3.8**, restart the dev server, confirm the nav bar reads 3.8.

---

## Videos verified this session (Module 1)

Verification note: **YouTube's own oEmbed endpoint 404s through this session's fetch tool.** `noembed.com` was used as the oEmbed transport — it returns YouTube's payload verbatim — and each title was cross-checked against an independent search result. Titles below are as returned, not as claimed. Re-verify against `youtube.com/oembed` directly when a session can reach it.

| For | Id | Title as returned | Channel |
|---|---|---|---|
| M1 L5 · What a plant needs | `TxMdMTzf2YU` | Growing Plants Without Soil! \| Squeaks Grows a Garden! \| SciShow Kids | SciShow Kids |
| M1 L2 · The circle | `2SBVz4MgeIE` | Plant Life Cycle Stages From Seed To Fruit \| Primary School Science Animation | The Pique Lab |

**Rejected:** `-jQsd1fNFA8` "The Difference Between Annuals and Perennials" — HortTube with Jim Putnam. Real and on topic, but an adult gardening channel. M1 L4 still needs a source.

**Black American educator search, Module 1 — logged, not closed.** Searched: Black educator plant life cycle elementary; Black woman gardener teaching kids botany; Black American herbalist teaching children. Surfaced Ron Finley (real, verified as a person — TED, MasterClass, the Ron Finley Project) and Black Girls With Gardens. **Both are adult-level.** Nothing Black-led at a nine-year-old's level for seeds, life cycle, annuals/perennials or what-a-plant-needs. Ron Finley belongs in **Module 7 Lesson 40**, Black American herbalism, where the blueprint already put that requirement.
