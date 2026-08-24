# Petal & Pestle Academy

An adaptive learning diagnostic for a nine-year-old who wants to be a doctor and
a herbalist. Modelled on IXL's Real-Time Diagnostic, pointed at Khan Academy.

Sibling project to **Mission Control Homeschool** (aerospace, 7th grade). Same
stack, same architectural habits, completely separate data.

## Run it

```bash
npm install
npm run dev
```

Or on Windows, double-click `START-PETAL-PESTLE.bat`, which does both.

## What it is

The app **does not teach**. Math, English Language Arts and Science are taught
on Khan Academy. This app measures where she actually is in twelve strands and
produces an ordered list of exactly which Khan course and unit to open first.

Its own lesson track — Herbalism & Botany — is deliberately not in version 1.
That content gets built after the diagnostic has run, shaped by what it finds.

## The diagnostic

| Mechanic | Value | Where |
|---|---|---|
| Reportable range | 2.0 – 6.5 | `engine/diagnosticEngine.js` |
| Starting estimate | 3.5, every strand | same |
| Down-steps | 2.0, 1.2, 0.8, 0.5, 0.3, 0.2, 0.15, 0.15 | same |
| Up-steps | 0.6 × the down-step | same — **read the comment on `UP_STEP_RATIO`** |
| Questions per strand | 6–8 | same |
| Questions per sitting | 12 | same |
| Full run | ~80 questions | measured, not estimated |

The asymmetric step is the one non-obvious decision. A symmetric staircase over
four-choice items settles about 0.4 of a grade **above** the student's real
level, because a 25% guessing floor makes 50%-correct happen on questions that
are too hard. The simulation caught it; the ratio fixes it. Do not "tidy" that
constant without re-running `npm run check:engine`.

## The economy

Two currencies, an append-only ledger, balances folded from the ledger and never
stored — structurally her brother's `lib/economy.js`. One thing differs, and it
is the important thing:

**Nothing pays for being right.** His app pays for XP, and XP comes from correct
answers; that is right for a teaching app. Here the main activity is a
*diagnostic*. If correct answers paid, a bright nine-year-old would work out
inside one sitting that hard questions cost her money, and the rational response
— guess safe, skip the hard strands — makes the assessment measure her strategy
instead of her knowledge. Every earning rule in `EARN_RATES` counts effort:
questions answered, strands finished, sittings completed, days returned.
`check:economy` greps the file and fails if the word `correct` appears in it.

| | 🌸 Petals | 🌟 Golden Seeds |
|---|---|---|
| Per question answered | 3 | 1 |
| Per strand finished | 25 | 8 |
| Per sitting completed | 15 | 5 |
| Per day active | 10 | 3 |
| Full diagnostic | ~715 | ~232 |
| Spent on | 32 in-app items | real-world rewards |
| Approval | never | over 25, or any tier flagged `requiresGrownUp` |

Seeds do not leave her balance when she asks for something — only when a
grown-up approves. Reserving seeds toward the Dream Reward makes them
unspendable without destroying them (`sumEntries` skips `reserve`/`unreserve`),
and the grown-ups match 1 for every 4 saved.

When the Herbalism lessons land in Phase 3, accuracy-based earning belongs
*there*. Do not add it to the diagnostic.

## Reading load

The parent asked: *"wouldn't you have to know her reading level before you
create it?"* She was right, and the danger is worst inside the diagnostic. To
measure a child you have to write questions, and every question in every subject
is made of words. A 6th-grade geometry item written in 6th-grade prose, put in
front of a 3rd-grade reader, gets marked wrong — and the app files it under
*weak at geometry*. That is construct-irrelevant variance, and it is invisible
unless you look.

Two fixes, both shipped:

1. **`npm run check:reading`** measures mean sentence length and long-word rate
   on every item and fails the build if any item reads harder than it tests.
   Maths is capped flat at 14 words/sentence and 10% long words whatever the
   difficulty — a 6th-grade fractions question must still be readable by a
   3rd-grade reader, because the difficulty belongs in the fractions. The first
   run failed 62 of 189; 24 of those were real and were rewritten, and the rest
   exposed two bugs in the metric itself (a syllable counter that scored "angle"
   as three syllables, and Flesch-Kincaid applied to four-word answer options).
2. **Read-aloud** (`lib/speech.js`). The browser's own speech synthesis, no
   network. Removes the reading load from maths and science entirely. Every
   answer records whether it was used, and the parent report distinguishes a
   reading level from a listening one rather than quietly conflating them.

## Checks

```bash
npm run check          # all five
npm run check:sources  # imports resolve, named exports exist, brackets balance
npm run check:items    # bank coverage, item shape, banned medical phrasing
npm run check:reading  # can she READ the question, whatever it tests?
npm run check:engine   # 240 simulated students; does the staircase converge?
npm run check:economy  # ledger invariants, approval rules, catalogue pricing
```

`check:items` is the content guard. It greps every question and every herb card
for phrasing that would turn botany into medical advice aimed at a child, and
fails the build if it finds any. The regexes are tuned, not blunt — the rule is
*instruction to the reader*, not the vocabulary of medicine. A passage may
explain what a dose is; nothing may tell her to take one.

`check:engine` is not a unit test. It runs simulated students of known ability
through the real engine and asserts the level it lands on is within one grade of
the truth, with near-zero bias, across six ability profiles including a hidden
single-strand gap.

## Layout

```
src/
  App.jsx                        view routing
  config/strands.js              the 12 strands and 3 subjects
  engine/diagnosticEngine.js     ALL adaptive logic. Pure functions.
  data/diagnostic/
    mathItems.js                 5 strands, generated from templates
    elaItems.js                  4 strands, hand-written
    scienceItems.js              3 strands, hand-written
    itemHelpers.js               deterministic PRNG, choice builder
  data/khan/khanMap.js           level → Khan course + unit. EDIT THIS when
                                 Khan renames a unit.
  data/herbs/herbLibrary.js      24 cards
  data/rewards/petalCatalog.js   32 in-app items
  data/rewards/seedRewards.js    real-world ladder + defaults (grown-ups can
                                 edit these live from the app)
  lib/actionPlan.js              12 levels → an ordered plan
  lib/economy.js                 ALL money logic. Pure functions.
  lib/ranks.js                   7 tiers, earned by showing up, not by scoring
  db/db.js                       Dexie/IndexedDB. Database name: PetalPestleDB
  store/useAppStore.js           Zustand. Nothing else touches the db.
  components/                    Navigation, Home, Diagnostic, Levels, Plan,
                                 Rewards, Herbs, Parent
scripts/                         the three checks
```

## Known limitation

This was assembled in an environment with no access to the npm registry, so the
JSX was never compiled before hand-off. `npm run check:sources` catches broken
import paths, missing named exports and unbalanced brackets, and all the pure
logic is tested by the other two checks — but a syntax error inside a JSX
expression would still reach the first `npm run dev`. That command is the real
check and takes one minute.

## Deliberate refusals

- **No score shown during the diagnostic.** No level, no running total, no
  signal that a question got easier. A child who can see the difficulty moving
  learns within four questions that a wrong answer makes the next one easier, at
  which point the test measures strategy instead of knowledge.
- **Ranks are not earned by scoring well**, and neither are coins. Every child
  who finishes reaches the top tier, whatever it found. The measurement has to be
  safe to fail, and a currency that punishes a wrong answer makes it unsafe.
- **Balances are never shown during the diagnostic.** The Check-In replaces the
  whole layout, nav bar included, so she never watches a counter tick while
  deciding an answer.
- **The decimal level is parent-facing only.** She sees a garden. He sees 4.2 and
  a confidence rating.
- **No lessons in v1.** Requested explicitly: build the lessons after the
  diagnostic, not before.
