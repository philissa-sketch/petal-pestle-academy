# Petal & Pestle Academy — Build Plan (v2, for review before building)

**For:** granddaughter, age 9 — future doctor & herbalist
**Modeled on:** Mission Control Homeschool (her son's aerospace app), same stack and architecture
**Status:** AWAITING APPROVAL — nothing built yet

---

## 1. Safety first: her son's folder

- Nothing was written, moved, or changed in `mission-control-homeschool-school-start-gate`. Read only.
- The read-only copies pulled into the work session have been deleted.
- Petal & Pestle gets a **brand-new, separate folder**. The two apps never share a folder, a database, or a file.

---

## 2. What changed in v2

Three decisions locked since v1:

1. **Khan Academy teaches the core.** Math, ELA, and Science are taught on Khan Academy — the app does not teach them. This is the same split as Mission Control, where Khan teaches Math/ELA/Science and the app teaches Aerospace.
2. **Lessons come after the diagnostic.** No lesson content is written until she has taken the diagnostic and the results show what she actually needs.
3. **Age- and learning-appropriate is a standing rule**, applied to every question, every herb card, every word of feedback.

### What that does to the diagnostic's job

It changes it for the better. The diagnostic is no longer "figure out what lessons to build" — it's **"figure out exactly where she starts in Khan Academy."**

Result: `Fractions & Decimals — grade 3.2` becomes an action line that reads
**"Start in Khan Academy 3rd Grade Math → Unit: Understand Fractions."**

That is what IXL's diagnostic does, pointed at Khan instead of at IXL's own skill plan.

---

## 3. The app

| Item | Decision |
|---|---|
| Name | Petal & Pestle Academy |
| Theme | Herbalism / apothecary / medicine |
| Age | 9 years old |
| Stack | Vite + React + Tailwind + Zustand + Dexie — identical to Mission Control |
| Runs | Offline, double-click a `.bat` file. No internet, no accounts, no monthly fee |
| Data | Saved locally (IndexedDB), same as Mission Control |
| Teaches | Nothing yet. It **assesses**, **points to Khan**, and **tracks** |

**Palette:** blush pink · lavender · sage green · cream · soft gold

**Rank ladder (7 tiers):** Little Seed → Sprout → Bud → Blossom → Petal Keeper → Apothecary's Apprentice → Master Herbalist

---

## 4. The diagnostic — IXL mechanics

| Mechanic | How it works |
|---|---|
| Difficulty | Every question carries a grade-level number (2.0 – 6.5) |
| Start | Every strand starts at 3.5 — it finds her level, assumes nothing |
| Adapting | Right → up, wrong → down; step shrinks 1.0 → 0.6 → 0.4 → 0.25 → 0.15 |
| Next question | Always the least-settled strand, so nothing gets skipped |
| Settled | Step under 0.2, or 8 questions in that strand |
| Sitting | 12 questions (~15–20 min); saves after every single question |
| Full run | ~90 questions across 12 strands, over several sittings |
| Stays live | Re-checks every 30 days; levels can move either direction |
| Wrong answers | Feedback written for the *specific* wrong answer she picked |

### The 12 strands

| Subject | Strands |
|---|---|
| **Math** | Numbers & Operations · Fractions & Decimals · Measurement & Data · Geometry · Patterns & Early Algebra |
| **ELA** | Reading Comprehension · Vocabulary · Grammar & Usage · Writing Strategies |
| **Science** | Plants & Life Science · The Human Body · Scientific Method & Investigation |

Every question is herbalism-flavored — weighing dried chamomile, halving a salve recipe, reading a passage about willow bark, labeling parts of a plant.

---

## 5. Version 1 screens

| Screen | What's on it |
|---|---|
| **The Greenhouse** (home) | Today's card, level snapshot, streak, rank badge |
| **Diagnostic** | Intro, question session, immediate feedback, progress bar |
| **My Levels** | Her grade level per strand, drawn as a growing garden |
| **My Khan Plan** | The action plan — each strand's level mapped to the exact Khan Academy course + unit to start with, in priority order |
| **Herb Library** | 24 herb cards — name, parts used, traditional uses, safety note |
| **Grown-Up Corner** | Passcode-gated. Real numbers, question-by-question history, printable one-page report |

---

## 6. Phase order after v1

| Phase | Contents |
|---|---|
| **Phase 2** | Khan Academy progress tracking — log units completed, see the plan tick off |
| **Phase 3** | Petal & Pestle's own **Herbalism & Botany course** — the signature subject, built from what the diagnostic reveals |
| **Phase 4** | Practice sets + 80% mastery gate + quarterly exams |
| **Phase 5** | Rewards — a garden to grow, an apothecary shelf to fill, badges |
| **Phase 6** | Herbalist's Journal — writing prompts, plant observations, pressed-flower log |

---

## 7. Content safety rule (locked)

Every herb card and every science question carries the same standing line: **"Always ask a grown-up before touching, picking, or using any plant."** No dosing, no "take this for that." It teaches botany, history, and how plants are studied — never self-treatment.

---

## 8. Still open — your call

1. **Grade range** — 2.0–6.5, or raise the ceiling since she's ambitious?
2. **Sitting length** — 12 questions per sitting, or shorter for a 9-year-old?
3. **Herb Library in v1**, or hold it for Phase 3 with the rest of the herbalism content?
4. **Folder location** — `C:\Users\pknot\Downloads\petal-pestle-academy`, or somewhere else?
5. Rank names and strand list — keep as listed, or change anything?
