# Petal & Pestle Academy — v1 delivered (Aug 12, 2026)

Delivered as `petal-pestle-academy.zip`. Unzip into `C:\Users\pknot\Downloads\`, double-click `START-PETAL-PESTLE.bat`.

## Locked settings

| Setting | Value |
|---|---|
| Sitting length | 12 questions (~15–20 min) |
| Range | 2.0 – 6.5 (through 6th grade) |
| Herb Library | included in v1 |
| Folder | `C:\Users\pknot\Downloads\petal-pestle-academy` |
| Port | 5180 (Mission Control uses 5173 — no collision) |
| Database | `PetalPestleDB` (Mission Control's is `MissionControlDB` — separate) |

## What shipped

- 12 strands across Math / ELA / Science
- 189 questions (Math generated from 35 templates; ELA + Science hand-written)
- 24 herb cards
- Adaptive staircase engine, action plan mapped to Khan Academy courses + units
- Passcode-gated Grown-Up Corner: decimals, confidence ratings, full answer history, printable one-page report, JSON backup, reset
- Three built-in checks: `npm run check`

## Engine finding worth remembering

The first version of the adaptive engine read **every student high**, worst for the weakest ones (+0.57 of a grade at level 2.8). Cause: a symmetric up/down staircase over 4-choice questions settles where the student gets 50% right, and 50% on 4-choice items is luck plus a third real knowledge — which sits above her true level.

Fix: up-steps are 0.6× down-steps (`UP_STEP_RATIO` in `src/engine/diagnosticEngine.js`). That settles the staircase at 62.5% observed, which is 50% real knowledge once guessing is removed. Bias is now near zero at every level.

**Do not "tidy" that constant.** Re-run `npm run check:engine` if it is ever touched.

## Known limitation

Built in an environment with no npm registry access, so the JSX was never compiled before hand-off. Import paths, named exports, brackets, the question bank and the engine are all checked by scripts that did run. A syntax error inside a JSX expression would still surface on the first `npm run dev`.

## Next decisions

1. Does she take the diagnostic before the lesson build starts? (That was the plan.)
2. Phase 2 = Khan progress tracking, or go straight to Phase 3 = the Herbalism & Botany course?
3. Any strands to add, cut, or rename once real results come in?
