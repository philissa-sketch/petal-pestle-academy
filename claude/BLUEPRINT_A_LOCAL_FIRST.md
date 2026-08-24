# BLUEPRINT_A_LOCAL_FIRST

**Learning Platform Blueprint Framework — Edition A (Local-First / Offline)**
**Version 1.1 · Reusable template · Companion: BLUEPRINT_B_CONNECTED_AI.md**

---

## ⚠️ ABOUT THIS FILE — READ BEFORE QUOTING IT

**This is a TEXT EXTRACTION of the 68-page PDF, not the original document.**

| | |
|---|---|
| Extracted from | `blueprint-a-scorecard`-era upload: **`BLUEPRINT_A_LOCAL_FIRST.md (1).pdf`** |
| Source SHA-256 (first 16) | `d44df70f1f1d34b6` |
| Pages | 68 |
| Extracted on | 2026-08-18 |
| Extracted by | pypdf text layer |

**What survived:** every sentence of prose, every directive, every schema block, in original order.

**What did NOT survive:** the PDF's tables were flattened into running text. A table
row that read `| hook | Activate interest | Optional |` now reads
`hook Activate interest / prior knowledge Optional`. **The columns are gone.**
**The five that get quoted most are REBUILT AS PROPER TABLES immediately below** —
§1.4 anti-patterns, §2.1 age tiers, §3.6 intervention ladder, §3.10.1 assessment
purposes, §4.3 accessibility parameters. For any OTHER table, go back to the PDF.

**THE PDF IS AUTHORITATIVE. THIS FILE IS FOR SEARCH AND FOR RULE 1.**

It exists so that no future session has to propose work against a standard it
cannot read. It is the target, not a tracker — per §0 rule 5, **do not edit this
file to match what got built.**

**Page markers are preserved as `<!-- p.N -->` so any quote can be traced back.**

---


## 📋 THE TABLES, REBUILT — read these here, not in the running text below

**The extraction below flattens every PDF table into running prose.** These five are the ones that get quoted most, so they are rebuilt here by hand from the PDF, page by page. **Everything else in this file is the faithful text, in order, with page markers.**

*Rebuilt v3.59. If one of these ever disagrees with the PDF, the PDF wins.*

---

### §1.4 — The 28 anti-patterns *(p.4–6)*

| # | Anti-pattern | Structural fix |
|---|---|---|
| 1 | Content order = position in a JavaScript array | Explicit order fields + units metadata layer (§3.2) |
| 2 | Curriculum structure living in code comments | Promote to data files (§3.2) |
| 3 | Load-everything hydration (all tables, unbounded) | Hot/cold split + windowed queries (§3.9) |
| 4 | Positional array destructuring of table loads | Object-keyed loader (§3.9) |
| 5 | Seed/migration passes re-running on every launch | Version-flagged seeds (§3.9) |
| 6 | Zero error handling in the data layer | Mandatory error boundary + retry state (§3.9) |
| 7 | Date keys computed in UTC on a local-time product | Single `localDateKey()` utility, used everywhere (§3.9) |
| 8 | Global progress tier gating per-subject content | Per-track progression only (§3.6) |
| 9 | One static explanation for every wrong answer | Per-distractor diagnosis contract (§3.6) |
| 10 | Motivation mechanics welded to content mechanics | Progression engine reads events only (§3.7) |
| 11 | Dashboard showing everything at once | Today-first surface, depth one level away (§4.6) |
| 12 | Accessibility deferred to a "polish phase" | **Accessibility is a launch gate, not a phase (§4)** |
| 13 | Timestamp-based record IDs | UUID generation at the persistence boundary (§3.9) |
| 14 | Full-database synchronous export | Streamed, transactional, versioned export (§3.9) |
| 15 | Diagnostic answers scored into the same mastery number as taught practice | `evidenceSource` on every item event; mastery excludes diagnostic evidence (§3.10.6) |
| 16 | Placement extrapolated above what the learner actually demonstrated | Evidence Bound rule — no extrapolation, ever (§3.10.4) |
| 17 | Placement set once at onboarding and never revisited | `expiresOn` + named re-diagnostic triggers (§3.10.7) |
| 18 | Growth "measured" by comparing two different instruments | Benchmark events carry `instrumentId` + form; deltas only within an instrument (§3.10.8) |
| 19 | An abandoned attempt recorded as a failed assessment | `attemptState: complete\|abandoned\|expired`; only `complete` is evidence (§3.10.6) |
| 20 | Goals created with no baseline | Baseline mandatory; goal creation fails validation without one (§3.11.3) |
| 21 | Every goal is an effort goal — the year looks great with zero learning | At least one mastery or growth goal required per learner (§3.11.2) |
| 22 | Goals stored on a settings screen nobody opens | Goal line renders on the today surface or the goal does not exist (§3.11.6) |
| 23 | A missing grade averaged as a zero | `ungraded` is a first-class state everywhere it appears (§3.13) |
| 24 | Content deleted rather than archived, orphaning records | `status: draft\|active\|archived\|retired`; content is never deleted (§3.2, §3.5) |
| 25 | A new table added without updating export | Export-completeness guard: schema-driven test fails on any unlisted table (§3.9 rule 10) |
| 26 | Calendar pushing a learner past an unmet mastery gate | Mastery wins; the calendar reports variance (§3.12) |
| 27 | Rewards that are entirely retrospective | Progression must also hand the learner something to go do (§3.7.4) |
| 28 | A learner with zero choices anywhere in the product | Agency budget: at least one real selection per session (§3.7.3) |

---

### §2.1 — Age tiers *(p.7–8)* · **Azianna is A2**

| Param | A0 (3–5) | A1 (6–8) | **A2 (9–11)** | A3 (12–17) | A4 (18–24) | A5 (adult) |
|---|---|---|---|---|---|---|
| Session target | 5–8 min | 10–15 min | **15–25 min** | 25–45 min | 45–90 min | 20–40 min |
| Items per session | 4–6 | 6–10 | **8–14** | 10–20 | 15–30 | 10–20 |
| Reading level of UI | Pre-reader | Grade 1–2 | **Grade 3–5** | Grade 6–9 | Adult | Adult, plain |
| Primary input | Tap / drag | Tap, tracing, short type | **Type, drag, select** | Full keyboard | Full keyboard | Keyboard, mobile-first |
| Text-to-speech | Required, always on | Required, default on | **Available, default on** | Available, default off | Available | Available |
| Instruction delivery | Audio + demo only | Audio + short text | **Short text + example** | Text + worked example | Reference-dense | Task-first |
| Gamification | High (sensory) | High | **Medium-high** | Medium | Low | Low / opt-in |
| **Failure handling** | No wrong states | Gentle retry, no score | **Retry + hint ladder** | Retry + diagnosis + score | Score + rationale | + relevance |
| Autonomy | Adult-driven | Adult-guided | **Guided choice** | Learner-chosen | Self-directed | Fully self-directed |
| Guardian layer | Required, primary | Required | **Required** | Optional | None | None |
| Session limits | Hard cap | Prompted | **Prompted** | Optional | Off | Off |
| Data sensitivity | Highest, no PII | Highest | **High** | High | Standard | Standard |

---

### §3.6 — The intervention ladder *(p.26)* · six rungs, each with an exit

| Rung | Trigger | Action | Exit condition |
|---|---|---|---|
| 1 | 2 consecutive incorrect at difficulty *d* | Drop to *d−1* | 2 correct at *d−1* → return to *d* |
| 2 | At difficulty floor and still failing | Insert micro-teach on the named misconception | 2 correct on the misconception's items |
| 3 | Micro-teach failed, or same misconception ×[n] | Back-step to the prerequisite skill | Prerequisite reaches `proficient` |
| 4 | Prerequisite back-step ×[n] in one track | Back-step to the prerequisite **unit**; pause forward progress | Unit completed at `advanceGate` |
| 5 | Rung 4 reached, or plateau over [n] sessions | Adult notification naming the skill, the evidence, the suggested step | Adult acknowledges and chooses |
| 6 | Rung 5 unresolved after [n] days, or return after long absence | Re-diagnostic trigger (§3.10.7) | New placement written and approved |

> *"A rung without an exit condition makes the engine loop."* And: state the **maximum consecutive failures** before rung 2 fires — **"this is a wellbeing parameter, not a tuning parameter."**

---

### §3.10.1 — The four assessment purposes *(p.34–35)*

| Purpose | Question it answers | When | Item source | Feeds mastery? | May authorize | May NOT authorize |
|---|---|---|---|---|---|---|
| **Placement** | Where does this learner start? | Track entry, re-entry, on expiry | Probe set spanning courses above and below | **No** | `startCourseId`; skipping units with direct positive evidence | Marking skills mastered · credit · any grade of record |
| **Formative** | Did that just land? | Inside a lesson | The lesson's own items | **Yes**, practice-weighted | Adaptivity, hints, requeue | Grades of record |
| **Benchmark** | Is this learner actually growing? | Term start / mid / end | A stable, versioned form on a fixed blueprint | **No** — separate scale | Growth reporting, goal measurement, re-placement | Day-to-day adaptivity |
| **Summative** | Has this been learned to standard? | End of unit or course | Test beats, performance tasks | **Yes**, mastery-bearing | Mastery level, credit, credential, records | Placement into a different track |

> *"An assessment with no declared purpose **fails content validation**."* · *"If two purposes want the same instrument, build two instruments."*

---

### §4.3 — Mandatory accessibility parameters *(p.47–48)*

| Parameter | Requirement |
|---|---|
| Contrast | ≥4.5:1 body text, ≥3:1 large text and UI. High-contrast theme available |
| Color independence | No information by colour alone — pair with icon, text or pattern |
| Font scaling | 100–200% without loss of content or horizontal scrolling |
| Typeface | System default + serif + dyslexia-friendly, learner-switchable |
| Spacing | Line-height ≥1.5; paragraph spacing ≥2× font size; letter/word spacing adjustable |
| Touch targets | ≥44×44 CSS px, ≥8px apart |
| Keyboard | Every element reachable and operable; visible focus ring ≥3:1; logical tab order; skip-to-content |
| Screen reader | Semantic HTML; ARIA only where semantics are insufficient; live regions for score/feedback |
| Motion | Respect `prefers-reduced-motion`; no auto-playing motion; no parallax; nothing flashing >3×/sec |
| Timing | No time limits by default; where present, extendable ≥10× or disableable |
| Audio | Never the sole channel; independent volume; no sudden loud effects |
| Error handling | Errors identified in text, describe the problem, suggest a fix |
| Language | `lang` attribute set; language switch marked up |
| Orientation | Works portrait and landscape; no forced orientation |
| Reading level | Instructions at or below tier reading level — **measure it, don't estimate it** |

---

<!-- p.1 -->

Learning Platform Blueprint Framework update Edition A — Local-First / Offline (No Internet, No AI Service) Version: 1.1 · Status: Reusable template · Companion: BLUEPRINT_B_CONNECTED_AI.md Changelog: v1.1 folds in Patch 01 (diagnostics & goals), the Improvement Audit (scheduling, grading queue, rubrics, archival, onboarding, intervention ladder, export guard, retention, multi-learner, skill-graph validation, print spec, terminology lint) and the durable framework lessons from the engagement scorecard (learner agency, reward design). See §7.6. This is a template , not a plan for one app. Every place you see a > blockquote directive or a [BRACKETED SLOT], that is where you supply project-specific information when spinning up a new app variant. Nothing outside those markers should need editing to change subject, age group, or learning style.

> [SPIN-UP DIRECTIVE — FILL THIS FIRST]
 - Project name: [APP_NAME] - Subject domain:

> [DOMAIN — e.g. early literacy / trade certification / K-8 math]
 - Primary audience tier: [A0–A5, see §2] - Primary learning profile: [see §2.2] - Delivery constraint: offline-only, single device, no accounts - Success definition (testable, one sentence): [...]

## §0 — How 

To Use This Template 1. Copy this file into the new project as PROJECT_PLAN.md. 2. Work top to bottom. Answer every > directive before writing code. 3. Produce the three config files described in §6. These are the only files that should differ between two apps built from this template. 4. Keep a separate PROJECT_LOG.md for chronological build history. This document is the standing reference; that one is the history. 5. Do not edit this document to match what got built. It is the target, not a tracker. The single most important rule in this framework:

<!-- p.2 -->

Content, audience configuration, and presentation are data . The engines that consume them are code . Code never contains a subject noun, a grade level, an age, or a theme string. If you can't switch the app from a phonics game to a forklift certification course by editing JSON, the separation has failed.

## §1 — Executive 

Summary & Meta-Framework

### 1.1 What this framework produces 

A single codebase — a set of engines — that can be pointed at any content pack and any audience configuration to produce a complete learning application: lessons, practice, assessment, progress tracking, guardian/instructor reporting, and motivation mechanics.

### 1.2 The five-layer separation model 

Layer Contains Changes per app? Owned by L1 — Config Audience tier, accessibility defaults, feature flags, theme tokens, mastery thresholds, vocabulary of the UI Always Product owner L2 — Content Courses, units, lessons, beats, items, media manifests, standards mappings Always Curriculum author L3 — Engines Content resolver, assessment, scheduling/retrieval, progression, reporting Never Engineering L4 — Persistence Local database, schema versions, migrations, export/import Never Engineering

<!-- p.3 -->

Layer Contains Changes per app? Owned by L5 — Shell Routing, layout primitives, accessibility infrastructure, error boundaries Never Engineering Dependency direction is strictly downward: L1 → L2 → L3 → L4 → L5. An engine may read config. Config may never import an engine. Content may never contain executable logic.

### 1.3 The 

Content Slot concept A Content Slot is a named, typed hole in the framework that content fills. The engine knows the slot exists and what shape it takes; it does not know what goes in it. Slot Type Example fill (App 1) Example fill (App 2) program.title string "Ranger Academy" "CDL Prep" progression.unit.label string "Mission" "Module" learner.honorific string "Cadet" "Candidate" motivation.currency.primary string "XP" "Credits" lesson.relevanceFrame template string "How a pilot uses this" "On the job, this shows up when…" subject.set array [math, reading, science] [regulations, inspection, safety] assessment.masteryLabel[] array [Familiar, Proficient, Mastered] [Trainee, Competent, Certified]

> [DIRECTIVE — CONTENT SLOTS]
 Before building anything, list every noun your app shows the learner that is domain-specific. Each one becomes a slot in app.config.json (§6). If a string is hardcoded anywhere in L3–L5, that is a defect.

<!-- p.4 -->

### 1.4 Anti-patterns this framework exists to prevent 

These are drawn from a real audit of a working single-subject app. Each has a structural fix baked into §3. # Anti-pattern Structural fix 1 Content order = position in a JavaScript array Explicit order fields + units metadata layer (§3.2) 2 Curriculum structure living in code comments Promote to data files (§3.2) 3 Load-everything hydration (all tables, unbounded) Hot/cold split + windowed queries (§3.9) 4 Positional array destructuring of table loads Object-keyed loader (§3.9) 5 Seed/migration passes re-running on every launch Version-flagged seeds (§3.9) 6 Zero error handling in the data layer Mandatory error boundary + retry state (§3.9) 7 Date keys computed in UTC on a local-time product Single localDateKey() utility, used everywhere (§3.9) 8 Global progress tier gating per-subject content Per-track progression only (§3.6) 9 One static explanation for every wrong answer Per-distractor diagnosis contract (§3.6) 10 Motivation mechanics welded to content mechanics Progression engine reads events only (§3.7) 11 Dashboard showing everything at once Today-first surface, depth one level away (§4.6) 12 Accessibility deferred to a "polish phase" Accessibility is a launch gate, not a phase (§4)

<!-- p.5 -->

# Anti-pattern Structural fix 13 Timestamp-based record IDs UUID generation at the persistence boundary (§3.9) 14 Full-database synchronous export Streamed, transactional, versioned export (§3.9) 15 Diagnostic answers scored into the same mastery number as taught practice evidenceSource on every item event; mastery excludes diagnostic evidence (§3.10.6) 16 Placement extrapolated above what the learner actually demonstrated Evidence Bound rule — no extrapolation, ever (§3.10.4) 17 Placement set once at onboarding and never revisited expiresOn + named re-diagnostic triggers (§3.10.7) 18 Growth "measured" by comparing two different instruments Benchmark events carry instrumentId + form; deltas only within an instrument (§3.10.8) 19 An abandoned attempt recorded as a failed assessment attemptState: complete|abandoned|expired; only complete is evidence (§3.10.6) 20 Goals created with no baseline Baseline mandatory; goal creation fails validation without one (§3.11.3) 21 Every goal is an effort goal — the year looks great with zero learning At least one mastery or growth goal required per learner (§3.11.2) 22 Goals stored on a settings screen nobody opens Goal line renders on the today surface or the goal does not exist (§3.11.6) 23 A missing grade averaged as a zero ungraded is a first-class state everywhere it appears (§3.13)

<!-- p.6 -->

# Anti-pattern Structural fix 24 Content deleted rather than archived, orphaning records status: draft|active|archived|retired; content is never deleted (§3.2, §3.5) 25 A new table added without updating export Export-completeness guard: schema-driven test fails on any unlisted table (§3.9 rule 10) 26 Calendar pushing a learner past an unmet mastery gate Mastery wins; the calendar reports variance (§3.12) 27 Rewards that are entirely retrospective Progression must also hand the learner something to go do (§3.7.4) 28 A learner with zero choices anywhere in the product Agency budget: at least one real selection per session (§3.7.3)

### 1.5 Spin-up procedure 

Day Step Output 0 Answer the spin-up directive at the top of this file Scope statement 1 Complete the Audience Scaling Matrix (§2) audience.config.json 2 Complete the accessibility profile (§4) a11y.config.json 3 Complete Content Slots + theme tokens (§1.3, §6) app.config.json 4–5 Author one vertical slice : one unit, 3 lessons, 1 assessment First content pack 6 Run the QA matrix (§5.5) against the slice Pass/fail report

<!-- p.7 -->

Day Step Output 7 Review gate: does the slice work end to end for the target learner? Go / no-go 8–30 Content population in batches by unit, never by "whole subject" Full content pack

> [DIRECTIVE — VERTICAL SLICE]
 Never author breadth before the slice is approved. One fully finished unit proves the engines. Fifty half-finished lessons prove nothing and have to be reworked when the model changes.

### 1.6 What 

Edition A deliberately excludes Offline-only means the following are out of scope by design , not missing: cloud accounts, multi-device sync, server-side analytics, generated content, live video embeds, remote content updates, and any LLM-backed tutoring. If you need those, use Edition B — the data schema in §3 is deliberately forward-compatible so an Edition A app can be migrated to Edition B without a content rewrite.

## §2 — Audience 

Scaling Matrix The matrix converts "who is this for" into concrete, machine-readable parameters. No engine reads an age. Engines read tier parameters.

### 2.1 Age tiers 

Param A0 Early Childhood (3–5) A1 Lower Primary (6–8) A2 Upper Primary (9–11) A3 Secondary (12–17) A4 Higher Ed (18–24) A5 Adult / Professional Session target 5–8 min 10–15 min 15–25 min 25–45 min 45–90 min 20–40 min Items per session 4–6 6–10 8–14 10–20 15–30 10–20

<!-- p.8 -->

Param A0 Early Childhood (3–5) A1 Lower Primary (6–8) A2 Upper Primary (9–11) A3 Secondary (12–17) A4 Higher Ed (18–24) A5 Adult / Professional Reading level of UI Pre-reader (icon+audio) Grade 1–2 Grade 3–5 Grade 6–9 Adult Adult, plain-language Primary input Tap / drag Tap, tracing, short type Type, drag, select Full keyboard Full keyboard Full keyboard, mobile-first Text-to-speech Required, always on Required, default on Available, default on Available, default off Available Available Instruction delivery Audio + demo only Audio + short text Short text + example Text + worked example Text, reference-dense Task-first, reference on demand Gamification intensity High (immediate, sensory) High Medium-high Medium Low Low / opt-in Failure handling No wrong states — redirect Gentle retry, no score shown Retry + hint ladder Retry + diagnosis + score Score + rationale Score + rationale + relevance Autonomy Adult-driven Adult-guided Guided choice Learner-chosen w/ guardrails Self-directed Fully self-directed Guardian layer Required, primary user Required Required Optional, reporting-oriented (or employer report) Session limits / breaks Hard cap, enforced Prompted Prompted Optional Off Off Data sensitivity Highest — no PII at all Highest High High Standard Standard

<!-- p.9 -->

> [DIRECTIVE — AGE TIER]
 Select one primary tier. If you need two (e.g. a sibling app), do not average them — ship two audience configs against one codebase. Record here: primary [A?], secondary [A? or none].

### 2.2 Learning profile modifiers 

Applied on top of the age tier. Multiple may be active. Profile Config key What changes Standard profile.standard Tier defaults, no modification Attention support (ADHD-informed) profile.attention Session length ×0.6; one item per screen; progress bar always visible; movement/break beats inserted every N items; no timed pressure; distraction-free mode strips all non-essential UI Dyslexia-informed profile.dyslexia Dyslexia-friendly typeface option; increased letter/word/line spacing; TTS default on; no justified text; syllable-split option; extended time; never penalize spelling in non-spelling items Autism-informed profile.autism Motion reduced by default; predictable, identical screen structure; explicit "what happens next" preview; literal language (no idioms in instructions); sensory intensity slider; no surprise sounds or celebrations Dyscalculia-informed profile.dyscalculia Number line and manipulative always available; extended time; multi-representation of every quantity; no mental-math-only items

<!-- p.10 -->

Profile Config key What changes Language learner / EAL profile.eal Vocabulary taught in context, never as isolated glossary; L1 gloss slot; audio for every prompt; reduced idiom; longer response windows Motor / low dexterity profile.motor Large targets (min 44×44px); no drag-required interaction (tap-tap alternative); no time limits; full keyboard path Low vision profile.lowVision High-contrast theme default; 200% zoom without reflow loss; TTS on; screen-reader-first flows Advanced / acceleration profile.advanced Placement test-out enabled; fewer practice reps to mastery; enrichment beats unlocked; skip-ahead permitted Remediation / gap-filling profile.remediation Prerequisite back-stepping on failure; smaller skill grain; higher repetition; mastery threshold unchanged but attempts uncapped

> [DIRECTIVE — LEARNING PROFILES]
 List the profiles this app must support at launch. Each one you enable must appear in the QA matrix (§5.5) as its own test column. Enabling a profile you don't test is worse than not offering it.

### 2.3 Pacing tracks 

Track Config key Structure Best for Linear mastery ladder pacing.linear One skill at a time, gated at threshold, ~1 sitting each Procedural/hierarchical domains (arithmetic, notation, syntax)

<!-- p.11 -->

Track Config key Structure Best for Spiral pacing.spiral Same skills revisited across the year at increasing depth Comprehension, observation, analysis, writing Multi-stage project pacing.project 2–4 week arcs with named stages (e.g. Research → Draft → Revise → Present), progress persists across days Composition, design, research, capstones Unit cycle pacing.unitCycle 2–3 week units with fixed phases: Explore → Apply → Synthesize Science, social studies, most content-heavy domains Self-paced catalog pacing.catalog No forced order; learner picks; prerequisites advisory Adult/professional, reference-style learning Cohort/scheduled pacing.scheduled Calendar-driven release Compliance training, term-based courses

> [DIRECTIVE — PACING]
 Assign a track per subject/track, not per app. Mixing is normal and expected. A single app commonly runs linear for one track and project for another. The engine must support multi-day, multi-stage progress from day one — retrofitting it onto a single-sitting engine is a rewrite, not a patch. This is the single most common architectural mistake in this category of product. 2.4 UI intensity Intensity Config key Characteristics Gamified ui.gamified Currency, streaks, ranks, unlockables, celebration animation, avatar/world Balanced ui.balanced Progress rings + streak + badges; no currency economy; restrained motion

<!-- p.12 -->

Intensity Config key Characteristics Minimalist ui.minimal Progress % and completion only; no rewards; no animation beyond state change Professional ui.professional Completion, competency status, certificate/transcript; zero game mechanics Hard rule regardless of intensity: motivation mechanics must be readable from the progress event stream alone. If removing the gamification module breaks lessons or assessment, it was coupled wrong.

### 2.5 Guardian / instructor layer 

Tier Layer type Access model A0–A2 Required co-user Same device, same data, different view . No separate account needed for a single-household deployment. A3 Required supervisor Different view; PIN-gated if the learner shouldn't see grades before the adult does A4–A5 / optional export Learner owns own record; export for employer or institution

> [DIRECTIVE — GUARDIAN MODEL]
 Decide explicitly: single-profile with role views , or separate authenticated accounts . For a one-learner, one-adult deployment, single-profile with a PIN-gated adult view is correct and removes an entire auth subsystem. Do not build accounts you don't need. Record the decision and the reason here: [...]

<!-- p.13 -->

2.6 Output artifact // audience.config.json { "tier": "A2", // §2.1 "profiles": ["standard", "dyslexia"], // §2.2 — array, order irrelevant "pacingByTrack": { // §2.3 — one entry per track "[TRACK_ID_1]": "linear", "[TRACK_ID_2]": "project" }, "uiIntensity": "balanced", // §2.4 "guardian": { "model": "single-profile-role-view", "pinGated": true, "requiredForOnboarding": true }, "session": { "targetMinutes": 20, "itemsPerSession": 12, "breakPromptAfterMinutes": 25, "hardCapMinutes": null } }

## §3 — Core 

Architecture & Agnostic Data Schema

### 3.1 Module map 

L5 shell/ router · layout · ErrorBoundary · a11y providers · theme L3 engines/ content/ resolver · unit graph · prerequisite check assessment/ item runner · scoring · mastery · diagnosis scheduling/ retrieval ladder · daily set builder · session planner progression/ event reducer · streaks · currency · unlocks reporting/ rollups · exports · records L4 persistence/ db schema · migrations · hot/cold loaders · backup L2 content/ courses/ units/ lessons/ items/ media/ standards/ L1 config/ app.config · audience.config · a11y.config · theme tokens

<!-- p.14 -->

Enforcement: add a lint rule or CI check that fails the build if any file under engines/, persistence/, or shell/ contains a string literal from your domain vocabulary list. This is cheap and it is the only thing that reliably keeps the separation honest over months. Terminology-drift extension. Keep a retiredVocabulary list in config history. Any string that was once a vocabulary value and has since been renamed must also fail the build. Without this, a rename is mostly complete: the new word ships in the UI and the old one survives in three helper files, a badge label and an export header, and nobody finds out until a learner does.

### 3.2 Content hierarchy — the universal spine 

Program the whole app (1) └─ Track a subject/discipline/competency area (n) └─ Course a stage, level, or year (n) └─ Unit a coherent 1–4 week chunk with an essential question (n) └─ Lesson one addressable learning object (n) └─ Beat an atomic step inside a lesson (n) └─ Item a single assessable interaction (n) Every level is data , addressed by stable string ID. Order is an explicit order integer — never array position. Beat types (the universal instructional grammar — extend, never replace): Beat type Purpose Notes hook Activate interest / prior knowledge Optional retrieve Retrieval before teaching Ungraded; powerful; commonly skipped — don't teach 2–4 sentences + one worked example Short. Long teach blocks are the #1 engagement killer check Immediate low-stakes practice on the just-taught idea Hints free practice Graded practice, hints available Threshold-gated to advance

<!-- p.15 -->

Beat type Purpose Notes apply Transfer to a new context, no hints project Multi-day stage with persisted artifact For pacing.project reflect Learner writes/records their own reasoning Never auto-scored test No hints, no feedback until submit Mastery-bearing relevance The "why this matters" slot Must render where the learner still cares — not only on the final beat iterate "Try it a different way" after a build/reflect Required for project/maker content

> [DIRECTIVE — INSTRUCTIONAL PATTERN]
 Define the default beat sequence for each pacing track. Recommended default for linear: retrieve → teach → check → teach → check → practice → apply → test with relevance interleaved after the first check. Record yours: [...] Content node schema (universal): { "id": "unit.[track].[course].[nn]", // stable, never reused, never renumbered "type": "unit", // program|track|course|unit|lesson|beat|item "parentId": "course.[track].[nn]", "order": 3, "title": "[TITLE]", "essentialQuestion": "[ONE QUESTION THE UNIT ANSWERS]", "objectives": ["[LEARNER CAN …]"], "skillIds": ["skill.[domain].[nn]"], // the real currency of the system "prerequisiteSkillIds": [], "estimatedMinutes": 45, "difficulty": 2, // 1–5, engine-readable "pacing": "linear", "tags": ["[FREE TAGS]"], "standardsRefs": [ // §3.5

<!-- p.16 -->

{ "framework": "[FRAMEWORK_ID]", "code": "[CODE]" } ], "mediaRefs": ["media.[id]"], "contentVersion": "1.0.0", "reviewedOn": "[YYYY-MM-DD]", "status": "active", // draft | active | archived | retired "supersededBy": null, // id of the node that replaces this one "slots": { "relevanceFrame": "[TEMPLATE STRING]" } } Content lifecycle — the one hard rule: Content is never deleted. A record referencing archived content must still render, still export, and still appear on a transcript. Archived content is removed from selection , never from history . Status Appears in selection? Appears in records? Notes draft No No Authoring only; fails publish validation if referenced by an active unit active Yes Yes Normal state archived No Yes Retired from new assignment; existing progress preserved and still reported retired No Yes Permanently withdrawn; supersededBy set where a replacement exists

> [DIRECTIVE — ARCHIVAL BEHAVIOUR]
 Decide and record: when a unit is archived mid-track , does in-flight progress (a) complete on the old version, (b) migrate to supersededBy, or (c) close as partial and re-open on the new unit? [...] All three are defensible. Undefined means the engine picks differently in

<!-- p.17 -->

different code paths. Also state how archived work is hidden from the learner's active surfaces while remaining fully present in guardian records and exports.

> [DIRECTIVE — SKILL TAXONOMY]
 Before authoring content, define the skill list . Skills — not lessons — are what get mastered, reviewed, remediated and reported on. A lesson is a delivery vehicle; a skill is the durable unit. Getting this backwards means every later feature (adaptive review, gap analysis, recommendations) has nothing to hang on. Skill list location: content/skills/[DOMAIN].json

### 3.3 Learner profile schema { "learner

Id": "uuid", "displayName": "[SET AT ONBOARDING]", "createdAt": "iso", "audience": { // copied from audience.config, overridable "tier": "A2", "profiles": ["standard"], "uiIntensity": "balanced" }, "preferences": { // learner/guardian editable at runtime "textToSpeech": true, "speechRate": 1.0, "theme": "default", // default|highContrast|dark|lowStim "fontFamily": "system", // system|dyslexic|serif "fontScale": 1.0, // 0.875–2.0 "reduceMotion": false, "soundEffects": true, "captions": true, "language": "[BCP-47]", "sessionLengthOverrideMin": null }, "placement": { // §3.10 — one entry per track "[TRACK_ID]": { "startCourseId": "…", "evidence": { "highestDemonstratedCourseId": "…", // NOT "assumed" or "expected" "instrumentId": "diagnostic.…|external.…|null", "form": "A", "score": 0, // 0–100 on the instrument's own scale "administeredOn": "iso" }, "method": "diagnostic|manual|external|default", "setBy": "engine|guardian", "approvedBy": "guardian|null", // engine proposes, adult approves

<!-- p.18 -->

"assessedOn": "iso", "expiresOn": "iso", // assessedOn + validityDays "note": "[FREE TEXT]" } }, "goals": { // §3.11 — pointers only, not a settings blob "activeGoalIds": ["goal.…"], "termId": "[TERM_ID]", "defaults": { "dailyMinutes": 30, "weeklySessions": 5 } // effort floor only }, "milestones": [ { "id": "…", "label": "[SLOT]", "earnedAt": "iso", "evidenceEventIds": [] } ], "accommodationsNote": "[FREE TEXT FOR GUARDIAN/IEP CONTEXT]" } Design rules: - Preferences are per learner and always runtime-editable . A tier sets defaults; it never locks a learner out of a setting. - No PII beyond a display name. No birthdate — store the tier, not the age. - Profile is separable from progress: resetting progress must never destroy preferences, accommodations, or guardian records. - Goal records live in their own store (§3.11.3), not inline on the profile. A goal has a lifecycle, a baseline and a review history; it is a record , not a preference. Multi-learner on one install:

> [DIRECTIVE — MULTI-LEARNER]
 State explicitly whether this is one learner per install: [...]. If more than one, specify now — retrofitting is expensive in exactly the same way the account decision in §2.5 is: - learner switching (where, and does it require the guardian PIN?) - per-learner config overrides vs. install-wide settings - whether the guardian PIN is shared across learners - what the shared-device privacy expectation is (can sibling A see sibling B's report card?) - whether export is per-learner or whole-install Every engine already keys on learnerId, so the schema is ready. The decision that is expensive to reverse is the UX and privacy model, not the data model.

<!-- p.19 -->

### 3.4 Progress & event schema 

Everything is an append-only event. All derived state (mastery, streaks, grades, analytics) is computed from events, never written to directly. This is what makes the reporting and motivation layers swappable. // events (append-only, never mutated) { "eventId": "uuid", "learnerId": "uuid", "ts": "iso", // ALWAYS local-time-derived date key alongside "dateKey": "YYYY-MM-DD", // computed with localDateKey(), never UTC "type": "item.answered", // see table below "trackId": "…", "lessonId": "…", "beatId": "…", "itemId": "…", "skillIds": ["…"], "payload": { "correct": true, "selectedOptionId": "…", "responseMs": 8400, "hintsUsed": 0, "attemptNumber": 1, "confidence": null, // optional, see §3.6 "evidenceSource": "instruction|practice|review|diagnostic|benchmark|external", "attemptState": "complete|abandoned|expired", "instrumentId": null, // set for diagnostic/benchmark items "form": null // set for benchmark items }, "sessionId": "uuid", "schemaVersion": 1 } Event type Emitted when session.started / session.ended App focus in/out of a learning session beat.entered / beat.completed Beat transitions (gives you real duration data) item.answered Any assessable interaction hint.requested Hint ladder step shown lesson.completed All required beats done assessment.submitted Test beat submitted, with score

<!-- p.20 -->

Event type Emitted when skill.masteryChanged Derived, but recorded for trend charts artifact.saved Project stage output, reflection, writing sample guardian.noteAdded Adult-side record goal.progressed Toward a learner or term goal diagnostic.started / diagnostic.completed A placement or benchmark instrument is opened / finished diagnostic.abandoned Instrument exited before the stop rule fired placement.set Placement written, with method and approver placement.expired Validity window passed with no new evidence external.assessmentRecorded Guardian enters an outside result (§3.10.5) baseline.captured First measurable value for a track or goal metric goal.set / goal.checkpoint / goal.reviewed Goal lifecycle (§3.11.5) grading.queued / grading.scored Human-in-the-loop grading queue (§3.13)

> [DIRECTIVE — DURATION TRACKING]
 Emit beat.entered/beat.completed from day one even if you have no analytics screen yet. Time-on-task cannot be reconstructed later, and "which lessons take longest" is the first question every stakeholder asks once the app is real.

> [DIRECTIVE — BASELINE CAPTURE]
 Emit baseline.captured per track at first activity even if goals are off at launch . A baseline cannot be reconstructed after the fact. Same class of mistake as skipping beat.entered: the data is free on day one and impossible on day two hundred. Without it, a year from now the only honest answer to "did that change help?" is "we don't know." Ship baseline capture before or alongside the first learning-science change you intend to evaluate. Derived stores (rebuildable from events at any time):

<!-- p.21 -->

None// skillMastery { "learnerId":"…", "skillId":"…", "score": 0-100, "level": "unseen|introduced|proficient|mastered", "attempts": 14, "lastSeen": "iso", "streak": 3, "decayAdjustedScore": 88 } // trackProgress { "learnerId":"…", "trackId":"…", "furthestCourseId":"…", "furthestUnitId":"…", "skillsMastered": 22, "skillsIntroduced": 31, "lastActivity":"iso" } Rule 8 (from §1.4), stated explicitly: trackProgress is per track . A global level, rank, or tier must never be an input to what content a track serves or reviews. Progress in one subject unlocking harder material in another is a real and common bug with real consequences — the learner gets tested on material never taught.

### 3.5 Content 

Engine Pipeline: author → validate → build → load → resolve. 1. Author in flat data files (JSON/YAML/MDX front-matter), one file per unit. Never in application source files. 2. Validate at build time against a JSON Schema: - every id unique and matching its naming pattern - every parentId, skillId, prerequisiteSkillId, mediaRef resolves - every item has ≥1 skillId - every distractor has a diagnosis (§3.6) - every media asset has alt text / transcript / caption as applicable - reading level of learner-facing text within tier bounds - skill graph is sound : no prerequisite cycles; no orphan skills (a skill no lesson teaches); no unreachable content; every remediationSkillId resolves to a skill something actually teaches - assessment purpose declared on every assessment-bearing beat (§3.10.1) - rubric present for every performanceTask, checklist and project stage (§3.6 rubric schema) - no active node references a draft node; every retired node with a replacement has supersededBy set - every external reference carries verifiedOn and is inside its re-verification cadence - build fails on any violation — no warnings-only mode 3. Build into an indexed bundle: Map<id, node> plus adjacency indexes (by track, by unit, by skill, by standard). 4. Load per §3.9 (hot/cold).

<!-- p.22 -->

5. Resolve — the only API the UI gets: getNext(learnerId, trackId), getUnit(id), getItemsForSkill(skillId, difficulty). Media & external resource policy (offline edition): Asset Rule Images Bundled locally; every one has alt text; SVG preferred for diagrams Audio Bundled or device-TTS-generated; transcripts required Video Not bundled by default (size). If included: local file, captions file required External links Offline app: links open the system browser and are marked as "needs internet". They are references, not dependencies — no lesson may require one to be completable Attribution Every third-party asset carries source, license, retrievedOn

> [DIRECTIVE — REFERENCE VERIFICATION]
 Any external reference (link, citation, recommended resource) must be verified as real, current, and on-topic by a human, at authoring time , and stamped with verifiedOn. Never generate or guess a URL. Set a re-verification cadence: [e.g. every 6 months]. Log the verification in the content file, not in someone's memory. Mechanism, not just a rule. A directive nobody can execute is a comment. Ship all three: 1. A CI step that lists every reference past its cadence and fails or warns per your policy. 2. A stale-reference report on the guardian surface, so the adult can see rot without reading the repo. 3. Graceful degradation in the app — a reference that no longer resolves is marked unavailable, never an error, and never blocks completion (requiredForCompletion is always false here).

> [DIRECTIVE — STANDARDS ALIGNMENT]
 If this app must satisfy an external standard (state education standards, occupational competency framework,

<!-- p.23 -->

certification body, accreditation), name it here and add its codes to standardsRefs as each unit is authored , not as a retrofit pass: - Framework: [NAME + URL] - Required hours/days/coverage: [...] - Who verifies compliance: [...] Treat the standard as a floor to verify against , not a ceiling.

### 3.6 Assessment 

Engine Item schema: { "id": "item.[skill].[nn]", "skillIds": ["skill.…"], "difficulty": 3, // 1–5 "type": "multipleChoice", // see table "stem": "[QUESTION TEXT / MEDIA REF]", "options": [ { "id":"a", "text":"[…]", "correct":true, "feedback":"[WHY THIS IS RIGHT]" }, { "id":"b", "text":"[…]", "correct":false, "misconception": "[NAMED MISCONCEPTION]", "feedback": "[WHY *THIS SPECIFIC ANSWER* IS WRONG]", "remediationSkillId": "skill.…" } ], "hintLadder": ["[NUDGE]", "[STRATEGY]", "[WORKED STEP]"], "solution": "[FULL WORKED EXPLANATION, METHOD NOT JUST ANSWER]", "generator": null, // optional: parameterized variant generator id "timeLimitSec": null, "accessibility": { "altText":"…", "transcript":"…", "keyboardOnlyPath": true } } Item types the engine must support: multipleChoice, multiSelect, numericEntry (with tolerance), shortText (pattern or keyword scored), ordering, matching, dragToTarget (must have a tap-only alternative), hotspot, cloze, freeResponse (never auto-scored — routed to reflection/portfolio), performanceTask (rubric-scored by guardian/instructor), checklist (self-attested, for practical/physical tasks). Rubric schema — required by performanceTask, checklist, and every pacing.project stage. Two item types and an entire pacing track depend on this; without it there is nothing to score project work against.

<!-- p.24 -->

None{ "id": "rubric.[domain].[nn]", "appliesTo": ["item.…", "beat.…"], "levels": [ // ordered low → high { "id": "beginning", "label": "[LABEL]", "points": 1 }, { "id": "developing", "label": "[LABEL]", "points": 2 }, { "id": "meets", "label": "[LABEL]", "points": 3 }, { "id": "exceeds", "label": "[LABEL]", "points": 4 } ], "criteria": [ { "id": "c1", "label": "[CRITERION]", "weight": 0.4, "descriptors": { // one per level — REQUIRED, no blanks "beginning": "[WHAT IT LOOKS LIKE]", "developing": "[…]", "meets": "[…]", "exceeds": "[…]" }, "skillIds": ["skill.…"] } ], "scoreMapping": { "method": "weightedPercent", // weightedPercent | pointsTotal | bandOnly "mapToScale": [ // rubric result → the scale records use { "minPercent": 0, "level": "introduced" }, { "minPercent": 70, "level": "proficient" }, { "minPercent": 90, "level": "mastered" } ] } } The score-mapping rule. State how rubric levels map to whatever scale your records use, then check the middle of the range . A rubric where "meets the standard" lands on a failing percentage teaches the learner that meeting the standard is failure. This is a documented, recurring failure mode in rubric design, not a hypothetical — it happens whenever a 4-level rubric is divided by 4 and mapped onto a percentage scale where 75% is a C. Wrong-answer diagnosis contract — non-negotiable: Every incorrect option carries its own feedback explaining why that specific choice is wrong, tied to a named misconception. A single shared "here's the right method" string for all distractors is a validation failure and fails the build. Distractors must be designed as diagnostics , not filler. Mastery model (two-tier, configurable):

<!-- p.25 -->

None"mastery": { "scale": 100, "levels": [ { "id":"introduced", "min": 0 }, { "id":"proficient", "min": 80 }, { "id":"mastered", "min": 95 } ], "requiresSeparateSessions": 2, // can't master in one sitting "decayHalfLifeDays": 45, // score decays without practice "advanceGate": "proficient", // level needed to move on "credentialGate": "mastered" // level needed for certificate/transcript } Never use a single binary cutoff. "Passed once" and "actually retains it" are different questions and both matter. Adaptive difficulty rules (engine, config-tunable): Signal Response 2 consecutive correct at difficulty d Offer difficulty d+1 2 consecutive incorrect at d Drop to d−1 ; if already at 1, back-step to a prerequisite skill Same misconception ×3 across items Insert targeted micro-teach beat for that misconception Correct but slow (>2× median) Keep difficulty, schedule earlier review Correct but high hint usage Do not credit toward mastery; requeue Track score plateau over N sessions Surface to guardian/instructor report

> [DIRECTIVE — ADAPTIVITY BOUNDS]
 Set floor and ceiling: how far back may the engine step ([n] prerequisite levels) and how far ahead may it accelerate ([n]). Unbounded adaptivity produces incoherent sequences. Intervention ladder. The adaptivity table ends at "surface to guardian," which is where most frameworks stop and where the actual support work begins. Specify every rung, each with a trigger threshold and an exit condition — a rung without an exit condition makes the engine loop.

<!-- p.26 -->

Rung Trigger Action Exit condition 1 2 consecutive incorrect at difficulty d Drop to d−1 2 correct at d−1 → return to d 2 At difficulty floor and still failing Insert micro-teach on the named misconception 2 correct on the misconception's items 3 Micro-teach failed, or same misconception ×[n] Back-step to the prerequisite skill Prerequisite reaches proficient 4 Prerequisite back-step ×[n] in one track Back-step to the prerequisite unit ; pause forward progress in that track Unit completed at advanceGate 5 Rung 4 reached, or plateau over [n] sessions Adult notification naming the specific skill, the evidence, and the suggested next step Adult acknowledges and chooses an action 6 Rung 5 unresolved after [n] days, or return after long absence Re-diagnostic trigger (§3.10.7) New placement written and approved

> [DIRECTIVE — INTERVENTION THRESHOLDS]
 Fill every [n] above: [...]. Also state the maximum consecutive failures a learner experiences before rung 2 fires — this is a wellbeing parameter, not a tuning parameter. Repeated failure with no change in what is offered is the most reliable way to make a learner stop trying. Placement / diagnostic: every track needs an entry path, and every assessment must declare its purpose before it can be scored . Both are specified in §3.10 . This section (§3.6) covers item-level and mastery-bearing assessment only. Retrieval practice & spaced review:

<!-- p.27 -->

None"review": { "algorithm": "leitner", // leitner | sm2-lite | fixed "intervalsDays": [1, 3, 7, 14, 30, 60], "onCorrect": "advance", "onIncorrect": "resetToFirst", "maxIntervalDays": 90, "dailyReviewCap": 10, "poolScope": "taughtSkillsOnly" // CRITICAL — see below } Rule (from anti-pattern #8): poolScope: "taughtSkillsOnly" means the review pool is built only from skills this learner has actually been taught in that track . Not from a global level. Not from "everything in the course that exists." The engine must be able to answer "was this skill taught to this learner?" from the event log — if it can't, the review feature is not safe to ship. Retrieval must be spaced across days, not within a sitting. An end- of-lesson check on material taught ten minutes earlier measures recognition, not retention. Schedule the real retrieval for tomorrow. Optional but high-value: capture confidence (low/med/high) before revealing correctness. Confident-and-wrong is the highest-priority remediation signal in the system and costs one tap to collect.

### 3.7 Progression, 

Motivation & Learner Agency Reads the event stream. Writes nothing content-related. Fully removable.

### 3.7.1 Three task types 

(this taxonomy covers essentially all learning-app motivation needs): Type Definition Resets Habit Repeatable, unscheduled, any number of times Never Daily Recurring, scheduled, expected once per period Daily/weekly Goal One-time, has a completion state On completion

<!-- p.28 -->

3.7.2 Reward integrity rules — enforce these or the whole layer decays 1. Rewards attach only to verified completion events , never to self-reported or trivially repeatable actions. 2. Recognition (encouragement, celebration) is structurally separate from assessment. Warm tone must never inflate or soften an honest score. 3. Currency earned must be spendable on something the learner actually wants, or drop the currency entirely. 4. Streaks need a forgiveness mechanic (freeze/repair) or they punish illness and holidays and get abandoned. 5. Never gate required learning behind a reward economy. 6. No cross-learner comparison mechanics — leaderboards, rankings, peer percentiles — for A0–A3 without explicit guardian opt-in. In a single-learner deployment they are meaningless; with minors they carry real wellbeing risk for a motivational return the literature does not support. "progression": { "enabled": true, "currency": { "enabled": true, "label": "[SLOT]", "perMasteredSkill": 10 }, "streak": { "enabled": true, "graceDaysPerMonth": 2, "label": "[SLOT]" }, "levels": { "enabled": true, "labels": ["[SLOT]","[SLOT]"], "thresholds": [0,100,300] }, "badges": { "enabled": true, "source": "content/badges.json" }, "unlockables": { "enabled": false }, "celebrationIntensity": "medium" // none|low|medium|high — ties to §2.4 and reduceMotion }

> [DIRECTIVE — PROGRESSION]
 Set enabled: false for ui.professional. Verify the app is fully usable with the entire block disabled. If it isn't, the coupling is wrong.

### 3.7.3 Learner agency — the requirement most learning apps skip 

Motivation research is mixed on points and badges and consistent on autonomy. In any context where attendance is required — school, homeschool, compliance training, mandated certification — autonomy is often the only genuine source of intrinsic motivation available, because the decision to show up was never the learner's to make. The agency budget: every session must contain at least one real choice. A choice is real when the options are genuinely different and the learner's pick changes what happens next. Choosing which cosmetic to buy is not a real choice.

<!-- p.29 -->

Agency lever Implementation Cost Pick what's next Offer 2–3 eligible next lessons from the same curriculum position; learner chooses Near-free — selection among content that already exists Pick an emphasis Named specializations or interest strands that reweight examples and project options Mostly relabeling and tagging Pick the goal Learner proposes or selects one active goal (§3.11) Free once goals exist Pick the order within a day Learner sequences the day's blocks Free; scheduler already holds the set (§3.12) Pick the depth Optional enrichment or extra-practice branch at a lesson's end Content cost only Pick the format Where two representations of the same content exist, learner chooses Content cost; overlaps UDL (§4.2)

> [DIRECTIVE — AGENCY BUDGET]
 Name the choices this app gives the learner, and where each one appears: [...]. If the list is empty, the product has an engagement ceiling no amount of reward design will lift. Constraint: agency operates within the mastery model — a learner may choose what and when , not whether a gate applies.

### 3.7.4 Reward design rules 

Six rules that separate a reward layer that keeps working from one that gets ignored by month three: 1. Retrospective and prospective. Points, badges and levels record what already happened. At least one mechanic must hand the learner something to go do — a daily target, a challenge, a named next milestone. A purely retrospective system has nothing to say to a learner who is deciding whether to start. 2. Locked rewards show progress. A locked badge with no progress indicator is invisible motivation. Showing "3 of 5" is the cheapest motivational win available and is absent from most implementations.

<!-- p.30 -->

3. Ladders outlast year one. Size the level and rank arc for the full intended lifespan of the product, not the first year. A learner who tops out the progression in month nine of a six-year program is on their own for five years. 4. Vary the reward shape. Threshold badges ("do 50 of X") are one shape. Also include: breadth (touched every track), recovery (returned to a skill that was failed and mastered it), consistency (no threshold, just showing up), and above all comeback (returned after an absence). Comeback is the single highest-value moment in any long-running system and almost nothing marks it. 5. Celebration is not assessment (restating §3.7.2 rule 2, because this is where it gets violated). Warm tone never moves a number. 6. Effect sizes are modest and fade with novelty. Spacing, retrieval practice, immediate feedback, worked examples and chunking have strong evidence behind them. Gamification's evidence is mixed and novelty-dependent. Fix the retention mechanics before adding to the reward layer — a thicker reward system on weak retention produces a learner who attends daily and retains nothing.

> [DIRECTIVE — MOTIVATION MOMENTS]
 If this app has a mentor/persona (vocabulary.mentor), list the moments it reacts rather than greets: [...]. A persona that only greets gets muted within a week. The highest-return moments are: a hard thing nailed, a return after absence, and the instant a milestone is earned — especially where that can route to a real person (§3.8 records) rather than to another animation. Recognition from someone who matters outperforms every in-app currency.

### 3.8 Guardian / 

Instructor Reporting Engine All views are derived from events . Standard surface set: View Answers Notes Attendance / time Days active, minutes on task Against any required threshold Progress by track Coverage and mastery, shown separately "How much exists" ≠ "how well they're doing" — never merge these into one number Gradebook Item-level and lesson-level results Report card Summary status per track + "needs attention" list Printable

<!-- p.31 -->

View Answers Notes Trend Improvement rate per track over time Requires the event log; free once you have it Records Notes, artifacts, portfolio, external activity log Survives progress reset Grading queue What is awaiting a human, and how old it is One tap from the guardian home (§3.13) Goal status Every active goal: baseline → current → target, with feasibility verdict §

### 3.11.7 Term goal review 

What was set, met, carried, and why Printable, per term Growth chart Benchmark deltas per instrument per track, baseline marked Never mixes instruments (§3.10.8) Placement record Current placement, its evidence, and its expiry §

### 3.10 Stale references 

External refs past their re-verification cadence §

### 3.5 Export 

Full record out of the app See §3.9

> [DIRECTIVE — RECORDKEEPING]
 List every record this app must be able to produce for an outside party (transcript, certificate, compliance log, competency statement, hours record, portfolio): [...]. Design the export format for each now — retrofitting a transcript onto a schema that never tracked the required fields is a data-loss problem, not a UI problem. Print specification. printableRecords: true is not a feature until the page is specified. Define once, apply to every printable surface: Element Requirement Page size [Letter / A4], portrait unless the record is a wide table

<!-- p.32 -->

Element Requirement Margins ≥0.5in / 12mm all sides; nothing in the printer's dead zone Header, every page Learner name, record type, term, generated-on date Footer, every page "Page N of M" and the app + content pack version Page breaks Never split a table row, a criterion, or a signature block Color Must remain legible in greyscale — no color-only status (§4.3) Verification line Anything going to an outside party carries a signature/date line and a statement of what the record does and does not certify Ungraded items Rendered as — with a legend, never as 0 (§3.13) Data provenance Records sourced from external instruments say so, with the instrument name and date

### 3.9 Persistence 

Architecture (Edition A: local-first) Stack pattern: IndexedDB (via a thin wrapper) + an in-memory store. No server. All data on device. Ten mandatory rules — each one closes a confirmed failure mode: 1. Hot/cold hydration split. On launch load only what the first screen needs (profile, preferences, current track progress, today's schedule). Everything else (event history, artifacts, logs, media metadata) loads lazily when its screen mounts. Mark the app ready after hot load only. 2. Windowed queries always. Never toArray() an unbounded table. Every historical read is bounded by date range or limit(). Assume the app runs for years and the event table grows without limit. 3. Object-keyed loading. Load tables into a keyed object, never positional destructuring of a parallel array. Positional loading is a silent-corruption trap the moment someone inserts a table.

<!-- p.33 -->

4. Version-flagged seeds. Every seed/migration pass runs once, guarded by a stored version flag. Nothing re-scans or re-writes content on every launch. 5. Error handling is mandatory in the data layer. Every load path has try/catch, an error state, a user-visible message, and a retry action. Handle the database-blocked and version-change events explicitly ("close this app's other tab"). An app that can get stuck on a loading screen with no message will do exactly that, in the field, with no way for the user to recover. 6. One date utility. localDateKey(date) — local time, everywhere. Any UTC-derived date key will silently record evening activity on the following day and corrupt attendance, streaks, and any compliance record built on them. 7. UUIDs for record IDs. Never timestamps. Double-fire and double-click produce duplicate keys and edits land on the wrong record. 8. Writes await before state updates , or optimistic updates carry an explicit rollback + user-visible failure signal. A silently failed write that reverts on next launch destroys trust in the record. 9. Export/import is a first-class feature. Streamed and transactional (not one synchronous full-database stringify); non-pretty-printed; carries exportVersion; import diffs rather than blindly overwriting; bulk-writes inside a single transaction. 10. Export-completeness guard. Every table declared in the persistence schema must appear in the export routine or on an explicit exclusion list with a written reason. Enforced by a test that reads the schema and fails on any unlisted table. This closes a bug class that recurs on every single new feature: a table is added, export is not updated, and the omission stays invisible until someone migrates devices and loses months of work. The test is roughly thirty minutes of work and it protects everything built after it. Schema versioning: additive only. New fields optional with defaults. Never repurpose a field's meaning. Every version bump ships with a migration test against a real prior-version database file. Event rollup & retention. Windowed queries bound read cost , not table growth . For a product designed to run for years: - Roll events older than [N] months into daily per-track summaries (minutes, items, correct, skills touched, mastery deltas). - Keep the summaries permanently . Keep raw events only inside the rollup window. - Hard rule: anything a record, transcript, or credential depends on must survive rollup. Assessment results, mastery transitions, artifacts, external results, guardian notes and goal reviews are records, not telemetry — they are never rolled up or pruned. - Rollup is reversible only forward. Decide this before year two , because the rollup can only ever be built from data you still have.

<!-- p.34 -->

> [DIRECTIVE — RETENTION]
 Set the rollup window [N months], list the tables it applies to, and list the tables explicitly exempt because a record depends on them: [...] Backup: the user's data lives on one device with no server behind it. Prompt for an export on a schedule ([e.g. monthly]) and after any milestone. Say plainly in the UI that data lives on this device only. Reset semantics: "Reset progress" clears events and derived state. It must not clear preferences, accommodations, guardian notes, artifacts, or records. Require typed confirmation.

> [DIRECTIVE — DATA VOLUME]
 Project table growth at 1, 3, and 5 years of real use for your top 5 tables. Any table projected past ~10k rows needs a windowing and pruning/archival strategy specified before launch, not after.

### 3.10 Diagnostic, 

Placement & Growth Engine

### 3.10.1 Four assessment purposes — declare one on every assessment 

Scoring rules, reporting rules and adaptivity rules all differ by purpose. An assessment with no declared purpose fails content validation , because the engine cannot know what to do with the result. Purpose Question it answers When it runs Item source Feeds mastery? May authorize May not authorize Placement Where does this learner start? Track entry, re-entry, on expiry Probe set spanning courses above and below the assumed level No Setting startCourseId; skipping units with direct positive evidence Marking skills mastered · awarding credit · any grade of record Formative Did that just land? Inside a lesson The lesson's own items Yes, practice-weighted Adaptivity, hints, requeue Grades of record Benchmark Is this learner actually growing? Term start / mid / end, fixed cadence A stable, versioned form built No — separate scale Growth reporting, goal measurem Day-to-day adaptivity

<!-- p.35 -->

Purpose Question it answers When it runs Item source Feeds mastery? May authorize May not authorize to a fixed blueprint ent, re-placement Summative Has this been learned to standard? End of unit or course Test beats, performance tasks Yes, mastery-bearing Mastery level, credit, credential, records Placement into a different track

> [DIRECTIVE — ASSESSMENT PURPOSE]
 List every assessment surface this app will have and assign each one a purpose: [...]. If two purposes want the same instrument, build two instruments. A placement test doubling as a grade is the fastest way to put a number a learner never earned onto a permanent record. 3.10.2 Diagnostic instrument schema { "id": "diagnostic.[track].[purpose].[form]", "purpose": "placement", // placement | benchmark "trackId": "…", "form": "A", // comparable forms required for retest "formVersion": "1.0.0", "blueprint": [ // what it samples — never "whatever items exist" { "courseId": "…", "skillIds": ["…"], "minItems": 3 } ], "routing": { "startAtCourseId": "…", // or null to start from the stated assumption "startDifficulty": 3, "ceilingRule": { "consecutiveIncorrect": 2 }, "floorRule": { "consecutiveCorrect": 3 }, "maxLevelsAbove": 2, "maxLevelsBelow": 3, "maxItems": 30, "maxMinutes": 25 }, "scoring": { "evidenceThreshold": 0.75, // % correct in a course band to count as demonstrated "minItemsForEvidence": 3, // below this the band is INCONCLUSIVE, not failed "placementMap": [

<!-- p.36 -->

{ "highestDemonstratedCourseId": "…", "startCourseId": "…" } ] }, "validityDays": 120, "administration": { "hintsAvailable": false, "showScoreToLearner": false, // per the tier's failure-handling row, §2.1 "resumable": true, "resumeWindowHours": 48 } } minItemsForEvidence matters more than it looks. Three outcomes are possible per band — demonstrated , not demonstrated , and inconclusive . Collapsing the third into the second places learners below where they belong on thin evidence, and that is the single most common way a diagnostic loses a returning or above-level learner.

### 3.10.3 Minimum build 

Build manual placement and default-to-course-1 at minimum. Add the diagnostic instrument when a track's course count is large enough that starting at 1 wastes real weeks. A manual placement by an informed adult, recorded with its reason, beats a badly built diagnostic every time.

### 3.10.4 The 

Evidence Bound rule — non-negotiable Placement may be set only to the highest level for which the instrument produced direct positive evidence. - Absence of failure is not evidence of mastery. - Adjacent-skill success is not evidence for the skill not tested. - Age, prior grade level, previous curriculum, or "they're bright" are not evidence. - Raising a placement requires a new instrument result, not a reinterpretation of the old one. Config: assessment.diagnostics.evidenceBound.allowExtrapolation: false, maxLevelsAboveEvidence: 0. Setting either above zero must be a deliberate, documented product decision — never a default.

<!-- p.37 -->

The failure mode this prevents: content gets served at a level the learner was never shown to be ready for, the learner fails material that was never taught, and the record then shows a deficit that the placement itself created.

### 3.10.5 External assessment records 

In a local-first app the most credible instrument is often taken outside the app — on paper, at a third-party site, or with a proctor. The framework must hold that result as first-class evidence. { "id": "external.[uuid]", "learnerId": "…", "trackId": "…", "instrumentName": "[NAME]", "instrumentUrl": "[URL]", "verifiedOn": "[YYYY-MM-DD]", // per §3.5 reference verification "administeredOn": "iso", "enteredOn": "iso", "enteredBy": "guardian", "scale": "[e.g. band | percentile | raw | scaled]", "score": "…", "scoreBand": "…", "evidenceLevel": "[courseId]|null", // what this authorizes, if anything "comparableToPriorId": "external.…|null", "attachmentRef": "artifact.…|null", // scan or screenshot of the result "note": "[FREE TEXT]" } Rules: 1. External results are evidence for placement and growth only . They never write skillMastery directly. 2. An external result with no evidenceLevel is recorded for the portfolio and growth chart but authorizes no placement change. 3. Growth may be computed across two external results only when comparableToPriorId is set — same instrument, same scale. 4. External records survive progress reset (§3.8 records rule).

> [DIRECTIVE — EXTERNAL INSTRUMENTS]
 Name the outside instruments this app will accept, their scale, their cost, and their cadence: [...]. Verify each is genuinely available at the stated price before it enters the plan — an instrument that turns out to be paywalled or institution-only invalidates a whole term's measurement design.

<!-- p.38 -->

### 3.10.6 Evidence separation — diagnostics must not pollute the record 

Rule Why Every item event carries evidenceSource Mastery, gradebook and growth are three different questions over the same event log skillMastery is computed from instruction, practice, review only A wrong answer on untaught material is information, not a grade Diagnostic misses may set a skill to unseen or introduced — never lower an existing level Diagnosing cannot un-teach Only attemptState: "complete" counts as evidence An abandoned attempt is not a failed assessment. Reports must state which policy is in force Gradebook renders ungraded as a distinct state, never as zero A missing grade and a zero are opposite facts (§3.13)

### 3.10.7 Re-diagnostic triggers 

Placement expires. Fire a re-diagnostic prompt — to the adult, per the guardian model in §2.5 — on any of: - expiresOn reached (validityDays elapsed) - Adaptive engine back-stepped to a prerequisite [n] times in one track - Track score plateau over [n] sessions (§3.6 rung 5) - Return after inactivity > [n] days - Guardian request, at any time - A new external result is entered

> [DIRECTIVE — RE-DIAGNOSTIC CADENCE]
 Set validityDays per track and the back-step trigger count: [...]. A placement older than one term is a guess wearing a timestamp.

### 3.10.8 Baseline & growth measurement 

Growth is a delta on one instrument's scale, and nothing else. "benchmark": { "cadenceDays": 90,

<!-- p.39 -->

"requireComparableForm": true, // form B compares to form A only on the same blueprint "formRotation": ["A","B","A","C"], "reportAs": "delta", // delta | scaleScore | band "showToLearner": false, "minDaysBetweenAdministrations": 45 } 1. A benchmark administered before instruction begins is the baseline . Emit baseline.captured. No baseline, no growth claim. 2. Never report growth across different instruments, different scales, or different blueprints. Report them side by side and say so. 3. Re-administering the same form inside minDaysBetweenAdministrations measures memory of the form, not learning. 4. Growth reporting belongs to the guardian surface by default; learner visibility follows the tier's failure-handling row in §2.1.

### 3.10.9 What a diagnostic must never do - 

Gate access to the app or to a track - Show a failing score to a learner in a tier whose failure handling forbids it (§2.1) - Run longer than maxMinutes — an over-long diagnostic measures stamina - Produce a placement the adult never saw (engine proposes, adult approves) - Be the only assessment a learner meets in their first week

### 3.11 Goals, 

Targets & Milestones Engine Reads the event stream. Writes goal records only. Fully removable — the app must remain complete with goals.enabled: false.

### 3.11.1 Five goal types 

Type Measures Computed from Honest about learning? Effort Minutes, sessions, consistency session.*, beat.* No — measures showing up Coverage Units/lessons finished by a date lesson.completed No — measures moving Mastery N skills at level ≥ X skillMastery (derived) Yes

<!-- p.40 -->

Type Measures Computed from Honest about learning? Growth Benchmark delta on one instrument diagnostic.completed (benchmark), external.assessmentRecorded Yes — the strongest signal available Performance A produced artifact scored against a rubric artifact.saved + rubric event Yes, for transfer

### 3.11.2 The composition rule 

Every learner must have at least one Mastery or Growth goal active at all times. Config: goals.requireOneOf: ["mastery","growth"]. An app whose goals are all effort and coverage can report a perfect year in which nothing was learned: full attendance, every unit finished, no evidence anyone got better at anything. This rule is the cheapest protection against that outcome and it costs one validation check. Cap active goals (maxActivePerLearner, default 5). More than five and none of them are goals. 3.11.3 Goal schema — baseline is mandatory { "id": "goal.[learner].[nn]", "type": "growth", // effort|coverage|mastery|growth|performance "scope": "learner|guardian|program", "trackId": "…|null", "metric": "benchmarkScore", // minutesPerWeek|sessionsPerWeek|unitsCompleted // |skillsAtLevel|benchmarkScore|rubricScore "level": "proficient", // mastery goals only "instrumentId": "diagnostic.…", // growth goals only — pins the scale "baseline": { // REQUIRED — creation fails without it "value": 62, "capturedOn": "iso", "sourceEventIds": ["…"] }, "target": { "value": 78, "byDate": "iso" }, "window": { "start": "iso", "end": "iso", "termId": "[TERM_ID]" }, "checkpointCadence": "weekly", "feasibility": { // computed at creation, stored, shown

<!-- p.41 -->

"observedRatePerWeek": 1.4, "requiredRatePerWeek": 2.1, "verdict": "reachable|stretch|unrealistic" }, "visibility": "learner|guardian|both", "status": "proposed|active|met|partial|missed|carried|retired", "onMiss": "carry|rescope|retire", "reviewNote": null, "createdBy": "engine|guardian|learner", "approvedBy": "guardian|null" }

> [DIRECTIVE — BASELINE]
 goals.requireBaseline: true is the default and should stay true. A target with no baseline is a wish. Validation must reject goal creation when baseline.value is absent.

### 3.11.4 The feasibility check 

At creation, compute the learner's observed rate over the trailing 4 weeks for that metric and show the required rate beside it. Render the verdict before the adult saves. Verdict Condition Behaviour reachable required ≤ observed ×

### 1.25 Save silently stretch required ≤ observed × 2 

Save with the projection shown unrealistic required > observed × 2 Save permitted, warning persists on the goal card This is one arithmetic operation and it prevents the most demoralizing thing a goal system does: setting a target the learner's actual pace never had a chance of reaching, then reporting it as a failure.

### 3.11.5 Lifecycle — engine proposes, adult approves propose 

(engine, from evidence) → approve (adult) → active → checkpoint (cadence) → term review → met | partial | missed → carry | rescope | retire

<!-- p.42 -->

- goal.set on approval · goal.progressed on any qualifying event · goal.checkpoint on cadence · goal.reviewed at window end. - Progress is recomputed from the event log, never incremented. Same rule as mastery (§3.4). An incremented counter and a rebuilt one will disagree eventually, and the counter will be the one that's wrong. - A missed goal is carried, rescoped, or retired with a written reason — never silently dropped. goals.reviewRequiredAtTermEnd: true. - Engine-proposed goals never activate on their own.

### 3.11.6 Surfacing rule 

A goal appears as one line on the today surface — metric, current, target, days left — or it does not exist. Depth (history, projection, checkpoints) lives one level away, per §4.6. A goals screen the learner never opens is a database row, not a goal. Interaction with §3.7: goals are the Goal task type in the motivation taxonomy, and learner-set goals are an agency lever (§3.7.3). Rewards may attach to goal completion, but a goal must remain legible and useful with the entire progression module disabled.

### 3.11.7 Reporting 

Added to the §3.8 surface set: Goal status (baseline → current → target, with feasibility verdict) · Term goal review (printable: what was set, met, carried, and why) · Growth chart (benchmark deltas per instrument per track, baseline marked).

### 3.11.8 The weekly review ritual 

One learner-facing card, once a week, built entirely from data the app already holds: what was mastered this week, one thing that slipped, and the learner picks next week's focus. This is the self-regulated-learning piece most learning apps skip. It costs no new schema, and it is the one place in the framework where the learner sets their own direction — which makes it an agency lever (§3.7.3) as much as a reporting feature.

> [DIRECTIVE — REVIEW CADENCE]
 Set the weekly review day and whether the learner or the adult leads it: [...]

### 3.12 Scheduling & 

Calendar Engine engines/scheduling/ carries three responsibilities in the §3.1 module map — retrieval ladder, daily set builder, session planner. Only the first is specified in §3.6. This section specifies the other two.

<!-- p.43 -->

Scheduling touches the today surface, the review engine, the progression engine and every guardian report, so leaving it undefined produces more rework than any other gap in this document.

### 3.12.1 Term calendar as data // content/calendar/

[TERM_ID].json { "termId": "[TERM_ID]", "label": "[LABEL]", "start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "instructionalDaysTarget": 180, "nonInstructionalDays": [ { "date": "YYYY-MM-DD", "reason": "[holiday|break|planned absence]" } ], "reducedPacePeriods": [ { "start": "…", "end": "…", "factor": 0.5, "reason": "[…]" } ], "trackCadence": { "[TRACK_ID]": { "days": ["Mon","Wed","Fri"], "minutesPerDay": 45 } }, "paceTargets": { "[TRACK_ID]": { "unitsPerTerm": 6, "skillsPerWeek": 3 } } }

### 3.12.2 Daily set builder 

The daily set is assembled from four pools with explicit precedence: Priority Pool Default share Cap source 1 Due spaced review up to review.dailyReviewCap §3.6 2 Active project stage its own scheduled block §2.3 pacing.project 3 New instruction remainder of the session budget session.itemsPerSession 4 Optional enrichment / learner choice overflow only §3.7.3

<!-- p.44 -->

Collision rule: when caps collide, review wins over new instruction. Deferred new instruction reflows to the next day; deferred review compounds and is the thing that breaks retention. State the rule explicitly rather than letting whichever pool is queried first win. 3.12.3 "Today is done" — define it Every learning app needs this definition and most never write it down, which is why the learner never knows when to stop.

> [DIRECTIVE — DONE DEFINITION]
 Define "today is done" for this app: [...] Pick one and be explicit — e.g. all due review cleared + one lesson completed , or the scheduled minutes met , or every track touched . Also define "done early" : what a learner sees when they finish the set with time left. Offering more of the same is the most common answer and the worst one — it teaches that finishing is punished.

### 3.12.4 Catch-up policy

> [DIRECTIVE — CATCH-UP]
 Choose one and record it: [...] - Backlog — missed work accumulates and must be cleared. Honest; demoralizing if uncapped. If chosen, set a backlog ceiling. - Reflow — the schedule silently re-plans around the absence. Kindest; hides the variance unless the report surfaces it. - Drop — missed work is gone; the calendar moves on. Only defensible where coverage isn't a requirement. All three are defensible. Undefined is not — and undefined is what you get by default, applied inconsistently across three code paths. Review is exempt from "drop" in every case : spaced review that is silently discarded defeats the entire retention model.

### 3.12.5 The calendar-vs-mastery conflict rule 

A linear track gated at mastery will fall behind a calendar. State which wins. Recommended: mastery wins; the calendar reports the variance. A schedule that pushes a learner past an unmet gate defeats the mastery model — the learner is now being taught material that sits on a foundation they don't have, and the record will show that as their failure rather than the scheduler's. The variance is not hidden. Surface a pace report to the adult: per track, target vs actual, projected term-end position, and which specific gate is holding progress. That converts an invisible slip into a decision the adult can actually make.

<!-- p.45 -->

> [DIRECTIVE — PACE VARIANCE]
 Set the variance threshold at which the adult is notified: [...]

### 3.13 Human-in-the-

Loop Grading Queue Three item types — freeResponse, performanceTask, checklist — plus every project stage cannot be auto-scored. Without a workflow they become work that is produced, never scored, and silently absent from every report. 3.13.1 ungraded is a first-class state A missing grade and a zero are opposite facts. An average that treats them as the same is wrong, and on a permanent record it is wrong in a way that follows the learner. ungraded must render as a distinct state everywhere it appears : gradebook, report card, track average, transcript, export, print.

> [DIRECTIVE — AVERAGING POLICY]
 State it once, apply it everywhere: does an ungraded item lower the average , or is it excluded until scored ? [...] Recommended: excluded, with the count of ungraded items shown beside every average so the number is never read as complete when it isn't. 3.13.2 The queue { "id": "grading.[uuid]", "learnerId": "…", "trackId": "…", "lessonId": "…", "itemId": "…", "artifactRef": "artifact.…", "rubricId": "rubric.…|null", "queuedOn": "iso", "ageDays": 4, // derived "status": "awaitingHuman|scored|returned|waived", "scoredBy": "guardian|instructor|self", "scoredOn": "iso", "rubricResult": { "c1": "meets", "c2": "developing" }, "score": 82, "comment": "

> [RESPONSE TO THE LEARNER — required, see 3.13.3]
", "returnedToLearnerOn": "iso" } Requirements: reachable in one tap from the guardian home; sorted oldest-first with age visible; a count badge; and a queue-age alert at [n] days.

<!-- p.46 -->

### 3.13.3 The response channel back to the learner 

If a learner writes an explanation and receives only a letter grade, the reflection beat is decorative. Every scored item returns a comment to the learner, surfaced in the learner's own view, not buried in the adult's. For checklist and self-attested work, the return can be an acknowledgement — but something must come back, or learners stop investing in the open-ended work, which is exactly the work that develops transfer.

### 3.13.4 Adult workload cap

> [DIRECTIVE — GRADING LOAD]
 Set the sustainable weekly queue size for the adult: [n] items. If the queue routinely exceeds it, the content mix is wrong, not the adult. Rebalance toward auto-scorable items or reduce the frequency of open-ended tasks. A grading queue that outruns its human silently converts every open-ended assignment into unscored busywork.

## §4 — Universal 

Design & Accessibility (UDL) Accessibility is a launch gate , not a polish phase. An app that ships without it does not get it later.

### 4.1 Baseline standard 

Target: WCAG

### 2.2 Level 

AA, no exceptions. Level AAA where cheap (contrast, reading level) — especially for A0–A2 and dyslexia/low-vision profiles.

### 4.2 The three 

UDL principles, as build requirements Principle Requirement Concrete implementation Multiple means of representation No concept exists in only one modality Every text has TTS; every image has alt text; every audio has a transcript; every video has captions; quantities shown numerically and visually Multiple means of action & expression No task has only one input path Every drag has a tap alternative; every mouse action has a keyboard path;

<!-- p.47 -->

Principle Requirement Concrete implementation free-response accepts typed or recorded or uploaded artifact Multiple means of engagement Motivation and pacing are learner-adjustable Gamification intensity slider; session length override; goal setting; choice of order where pedagogically allowed

### 4.3 Mandatory parameters 

Parameter Requirement Contrast ≥4.5:1 body text, ≥3:1 large text and UI components. High-contrast theme available Color independence No information conveyed by color alone — always pair with icon, text, or pattern Font scaling 100–200% without loss of content or horizontal scrolling Typeface System default + serif + dyslexia-friendly option, learner-switchable Spacing Line-height ≥1.5; paragraph spacing ≥2× font size; letter/word spacing adjustable Touch targets ≥44×44 CSS px, ≥8px apart Keyboard Every interactive element reachable and operable; visible focus ring ≥3:1; logical tab order; skip-to-content link Screen reader Semantic HTML; ARIA only where semantics are insufficient; live regions for score/feedback announcements Motion Respect prefers-reduced-motion; no auto-playing motion; no parallax; nothing flashing >3×/sec

<!-- p.48 -->

Parameter Requirement Timing No time limits by default; where present, extendable ≥10× or disableable Audio Never the sole channel; independent volume; no sudden loud effects (autism/sensory profiles) Error handling Errors identified in text, describe the problem, suggest a fix Language lang attribute set; language switch marked up Orientation Works portrait and landscape; no forced orientation Reading level Instructions at or below tier reading level — measure it, don't estimate it

### 4.4 Text-to-speech 

Required infrastructure regardless of tier default: - Speak-this-element control on every content block - Adjustable rate (0.5×–2.0×) and voice selection from device voices - Word-level highlight synchronized with speech (critical for dyslexia and A0–A2) - Persists across sessions in preferences.textToSpeech - Offline edition: uses device TTS , no network dependency - Never reads out the answer key or feedback the learner hasn't unlocked 4.5 Theme configuration // a11y.config.json { "wcagTarget": "AA", "themes": ["default", "highContrast", "dark", "lowStimulation"], "defaultTheme": "default", "fontOptions": ["system", "serif", "dyslexiaFriendly"], "defaultFont": "system", "fontScaleRange": [0.875, 2.0], "textToSpeech": { "available": true, "defaultOn": false, "wordHighlight": true, "rateRange": [0.5, 2.0] },

<!-- p.49 -->

"reduceMotionDefault": false, "soundEffectsDefault": true, "simplifiedNavigation": { "available": true, "defaultOn": false }, "captionsDefault": true, "sessionBreakPrompts": true, "readingLevelCeiling": "[GRADE OR CEFR LEVEL]" }

### 4.6 Simplified navigation mode 

A single toggle that reduces the app to its essential path. Required for A0–A2, attention, and autism profiles; useful for everyone. When on: - Home shows only "what to do next" — one primary action - Maximum 3 top-level destinations - All statistics, history, and settings collapse behind one "More" - No secondary calls to action on a learning screen - Consistent, identical screen structure across all lesson types This is the fix for the "dashboard with eighteen widgets" failure mode. The general design rule, whether or not simplified mode is on: today's actionable item is front and center; everything else is one level away. Centralize all the data; surface only what is relevant now.

### 4.7 Content-authoring accessibility rules 

These are validated at build time (§3.5), not left to author discipline: - Alt text present and meaningful for every image (not "image1.png") - Transcript for every audio, captions for every video - No instruction that depends on spatial language alone ("click the box on the right") — name the target - No idioms in instructions when profile.autism or profile.eal enabled - Reading level check on every learner-facing string - Every distractor's feedback is written for the learner, not the author

### 4.8 Accessibility 

QA gate The app may not ship until all of the following pass: Full task completion using keyboard only

<!-- p.50 -->

Full task completion using a screen reader (test on 2 real ones) Automated audit (axe/Lighthouse) with zero critical or serious issues Manual contrast check on every theme 200% zoom with no content loss prefers-reduced-motion honored on every animation Each enabled learning profile (§2.2) walked end to end by a human TTS reads every learner-facing string correctly, including math/symbols

### 4.9 Onboarding / first-run specification 

Order of operations across profile, accessibility, placement and first lesson is undefined in most products, so every app improvises it — and the improvised order almost always runs the diagnostic before the accessibility settings are applied. The sequence: Step Screen Skippable? Notes 1 Welcome + what this app is, in one screen No Adult-facing for A0–A3 2 Create learner: display name only No No PII (§3.3) 3 Accessibility setup — TTS, font, contrast, motion, simplified nav No — cannot be skipped Defaults from the tier; all overridable 4 Tier / learning profile confirmation Yes, defaults apply Adult confirms; changeable later 5 Goal defaults — daily minutes, sessions per week Yes Effort floor only; real goals come after baseline (§3.11.3) 6 Placement: diagnostic, manual, or default Yes → default §3.10.3 7 First lesson No The session ends here

<!-- p.51 -->

Step Screen Skippable? Notes 8 Guardian tour + PIN setup Yes, deferrable Prompt again after 3 sessions if skipped Two rules worth stating outright: 1. No diagnostic before accessibility settings are applied. A learner who needs text-to-speech and takes the placement without it is measured on their ability to decode the interface, not on what they know — and that wrong number then sets where they start. 2. The first session ends in a completed lesson, not a test. The first experience of a learning app should be learning something. A first run that is entirely assessment teaches the learner what the app is for, and it is not that.

> [DIRECTIVE — FIRST RUN]
 Record which steps are skippable in this app, what the re-prompt policy is for skipped steps, and what the learner's very first completed lesson is: [...] Also define re-entry : what a returning learner sees after [n] days away. This is a different screen from first run, and it is the one that decides whether they come back a second time.

## §5 — Implementation & 

Deployment Blueprint

### 5.1 Tech stack validation checklist

> [DIRECTIVE — STACK]
 Record chosen stack and the reason for each choice. Concern Requirement Chosen Validation test UI framework Component model, mature a11y story [...] Renders a beat, keyboard-navigable State Atomic selectors; no whole-store subscriptions [...] Changing one field re-renders one component Local DB Indexed, versioned, transactional, >100MB capacity [...] Write 50k events, query a date window <100ms

<!-- p.52 -->

Concern Requirement Chosen Validation test Styling Design tokens driven by config; theme switch at runtime [...] Theme switch with no reload Build Content validation runs in build; fails on error [...] Bad content file fails the build Offline Works airplane-mode from cold start [...] Full session, no network Packaging [web / PWA / desktop / mobile] [...] Installs and launches on target device Testing Unit + integration + a11y automation [...] CI runs all three

### 5.2 Build phases and gates 

Work one phase at a time. Before starting a phase, write down what "done" means for it as a testable statement, not a feature list. Phase Scope Exit gate P0 Foundation Config layer, schemas, DB + migrations, error boundary, date utility, UUIDs, export/import Can create a learner, write and read events, export and reimport losslessly P1 Engines Content resolver, assessment, scheduling, progression, reporting, diagnostics, goals, grading queue — all against fixture content Full lesson runs end to end on synthetic content with no real subject matter; goal progress recomputes identically from a rebuilt event log ; a diagnostic run against fixture content produces a placement bounded by evidence ; the daily set builder resolves a cap collision by the stated rule

<!-- p.53 -->

Phase Scope Exit gate P2 Shell & a11y Routing, layouts, themes, TTS, keyboard, simplified nav §4.8 gate passes on fixture content P3 Vertical slice One real unit fully authored A real target learner completes it unaided; guardian view shows correct results; a learner with prior knowledge is not placed at course 1, and a learner with none is P4 Content population Batch authoring, unit by unit Each batch passes content validation + a human review pass P5 Guardian & records Reports, exports, records that survive reset, grading queue, print spec Every required outside-party record (§3.8) generates correctly; placement record, external assessment record, growth chart and term goal review all export correctly and survive progress reset ; every printable surface matches the §3.8 print spec P6 Motivation Progression module App fully usable with module disabled P7 Hardening & release Performance, data growth, backup prompts, install/update path §5.5 QA matrix green

> [DIRECTIVE — PHASE GATES]
 Write the testable "done" definition for each phase before starting it: [...] 5.3 CI/CD (offline product) Even a local-only app needs a pipeline:

<!-- p.54 -->

Noneon: push, pull_request 1. install 2. lint (incl. the domain-string check from §3.1) 3. typecheck 4. content:validate # schema, refs, alt text, diagnosis coverage, reading level, # skill-graph soundness, assessment purpose declared, # rubric presence, draft/archived reference rules 4b. refs:staleness # every external reference past its re-verification cadence 4c. export:completeness # every schema table exported, or on the written exclusion list 5. test:unit 6. test:integration # engines against fixture content 7. test:a11y # automated audit on key screens 8. test:migration # open a prior-version DB fixture, migrate, assert integrity 9. build 10. bundle-size check 11. package artifact # PWA/desktop/mobile installer Release process: semantic versioning; content pack version tracked separately from app version; every release ships a migration test result and a rollback note. Never ship a release that cannot open the previous version's database. 5.4 Content population workflow 1. Skill list first (§3.2 directive) — nothing else starts until it exists. 2. Unit outline — essential question, objectives, skill coverage, order. 3. Beat script — write the sequence before writing any item. 4. Items — including every distractor's diagnosis. Budget real time here; this is where quality lives and where estimates are always wrong. 5. Media & references — with alt text, transcripts, verification stamps. 6. Standards mapping — as you author, not after. 6b. Assessment purpose + rubric — declare the purpose on every assessment-bearing beat (§3.10.1); attach a rubric to every performance task, checklist and project stage (§3.6). 7. Validate — build must pass. 8. Human review — a second person walks the unit as a learner. 9. Batch commit — one unit per commit, tagged with content version.

> [DIRECTIVE — AUTHORING CAPACITY]
 Estimate realistically: a fully-built lesson with per-distractor diagnosis, hints, media and standards mapping is typically 2–6 hours of author time . Multiply by your lesson count before promising a date. Batch

<!-- p.55 -->

by unit. Never attempt an entire subject in one sitting — quality collapses and the rework costs more than the original build. 5.5 QA matrix Run every release. Rows = scenarios, columns = enabled profiles (§2.2). Scenario Standard + Dyslexia + Attention + Low vision + Motor First launch & onboarding Complete a full lesson Answer wrong → correct diagnosis shown Hint ladder behaves per beat type Mastery threshold reached correctly Spaced review serves only taught skills Multi-day project resumes correctly Session interrupted mid-lesson → resumes

<!-- p.56 -->

Scenario Standard + Dyslexia + Attention + Low vision + Motor Guardian view shows accurate results Export → wipe → import → data intact Keyboard only, start to finish Screen reader, start to finish Offline cold start App upgrade over previous version's data 3-years-of-data performance fixture Placement diagnostic: prior-knowledge learner placed above course 1 Placement never exceeds the highest

<!-- p.57 -->

Scenario Standard + Dyslexia + Attention + Low vision + Motor demonstrated band An inconclusive band (below minItemsForEvidence) does not place the learner down Diagnostic misses lower no existing mastery level and appear in no gradebook Abandoned diagnostic → no placement written, no failed record Expired placement raises a re-diagnostic prompt to the adult External result entered → shows in growth, alters no mastery Benchmark retest on a comparable form reports

<!-- p.58 -->

Scenario Standard + Dyslexia + Attention + Low vision + Motor the correct delta Goal creation without a baseline is rejected Goal progress identical after export → wipe → import Active goal renders on the today surface Term-end review produces the printable goal record Ungraded item renders as ungraded, never as zero, in every surface Scored queue item returns a comment to the learner Archived unit: records still render,

<!-- p.59 -->

Scenario Standard + Dyslexia + Attention + Low vision + Motor export, and print Missed days follow the stated catch-up policy; review is never dropped Mastery gate holds when the calendar wants to advance; variance is reported "Today is done" fires at the defined condition Every session offers at least one real learner choice New table added → export-completeness test fails until listed Additional non-negotiable checks: - Evening (post-8pm local) activity records on the correct date

<!-- p.60 -->

- Progress reset preserves preferences, notes, artifacts, records - Every enabled profile's defaults actually apply on a fresh install

### 5.6 Launch readiness 

All §5.2 phase gates passed §4.8 accessibility gate passed §5.5 QA matrix green across all enabled profiles Content validation passing with zero warnings suppressed Data-growth projection done; windowing in place (§3.9 directive) Backup/export prompt implemented and tested Migration tested from every prior shipped version Every required outside-party record generates correctly Baseline capture live for every track (§3.4 directive) At least one mastery or growth goal active per learner (§3.11.2) Grading queue reachable in one tap; averaging policy stated in the UI Retention/rollup window decided and documented Catch-up policy and "today is done" both written down and implemented Agency budget met: at least one real choice per session A real target learner completed a real session unaided Rollback plan written

## §6 — Configuration 

Layer Reference Three files. Changing these three files — and swapping the content pack — is the entire act of creating a new app from this framework. 6.1 app.config.json (annotated) { "app": { "id": "[kebab-case-id]", "name": "[APP_NAME]", "tagline": "[ONE LINE]", "domain": "[SUBJECT DOMAIN]", "edition": "local-first", "version": "1.0.0", "contentPackVersion": "1.0.0" },

<!-- p.61 -->

// ── Content Slots: every domain-specific word the learner sees ── "vocabulary": { "learner": "[e.g. Student | Cadet | Candidate | Apprentice]", "guardian": "[e.g. Parent | Instructor | Supervisor]", "track": "[e.g. Subject | Discipline | Competency]", "course": "[e.g. Level | Year | Stage]", "unit": "[e.g. Unit | Module | Mission]", "lesson": "[e.g. Lesson | Session | Task]", "assessment": "[e.g. Quiz | Check | Evaluation]", "mentor": "[e.g. Guide name, or null for none]" }, "tracks": [ { "id": "[track-id]", "label": "[LABEL]", "icon": "[ICON_ID]", "pacing": "linear", "order": 1, "colorToken": "track1" } // [ADD ONE PER SUBJECT/COMPETENCY AREA] ], "theme": { "tokens": { "brandPrimary": "[#HEX]", "brandSecondary": "[#HEX]", "surface": "[#HEX]", "text": "[#HEX]", "success": "[#HEX]", "warning": "[#HEX]", "danger": "[#HEX]" }, "radius": "[sm|md|lg|pill]", "density": "[compact|comfortable|spacious]", "illustrationStyle": "[none|line|flat|photographic]" }, "mastery": { /* §3.6 */ }, "review": { /* §3.6 */ }, "progression": { /* §3.7 */ }, "assessment": { "diagnostics": { "placement": { "enabled": true, "requiredAt": ["trackEntry"], // trackEntry | reEntry | never "validityDays": 120, "fallback": "manual", // manual | default "requiresGuardianApproval": true }, "benchmark": { "enabled": true, "cadenceDays": 90, "requireComparableForm": true, "minDaysBetweenAdministrations": 45,

<!-- p.62 -->

"showToLearner": false }, "evidenceBound": { "allowExtrapolation": false, "maxLevelsAboveEvidence": 0 }, "external": { "enabled": true, "requiresGuardianEntry": true, "instruments": [ { "id":"external.[id]", "name":"[NAME]", "scale":"[SCALE]", "cadenceDays": 180, "verifiedOn": "[YYYY-MM-DD]" } ] }, "backStepTriggerCount": 3, "inactivityRediagnosticDays": 90 }, "grading": { "ungradedInAverage": "exclude", // exclude | countAsZero (§3.13.1) "queueAgeAlertDays": 7, "weeklyQueueCap": 15, "commentRequiredOnScore": true } }, "goals": { "enabled": true, "requireBaseline": true, "requireOneOf": ["mastery", "growth"], "maxActivePerLearner": 5, "termLengthDays": 45, "checkpointCadence": "weekly", "surfaceOnHome": true, "proposalMode": "engineProposesAdultApproves", // | learnerSets | guardianSets "reviewRequiredAtTermEnd": true, "weeklyReviewRitual": { "enabled": true, "day": "[DAY]", "ledBy": "learner" } }, "scheduling": { "calendarSource": "content/calendar/[TERM_ID].json", "collisionRule": "reviewBeforeNewInstruction", "doneDefinition": "[dueReviewCleared+oneLesson | scheduledMinutesMet | everyTrackTouched]", "doneEarlyBehaviour": "[offerChoice | endSession | optionalEnrichment]", "catchUpPolicy": "reflow", // backlog | reflow | drop (review never drops) "backlogCeilingItems": 30, "masteryOverridesCalendar": true, "paceVarianceAlertPercent": 20

<!-- p.63 -->

}, "agency": { "choicesPerSession": 1, // minimum; 0 fails the §3.7.3 rule "levers": ["pickNext", "pickFocus"] // §3.7.3 table }, "content": { "lifecycle": { "neverDelete": true, "onArchiveMidTrack": "completeOnOldVersion" }, "referenceReverificationDays": 180 }, "retention": { "rawEventWindowMonths": 24, "rollupGranularity": "dailyPerTrack", "exemptFromRollup": ["assessments","artifacts","externalResults","guardianNotes","goalReviews"] }, "features": { "multiDayProjects": true, "portfolio": true, "guardianReports": true, "printableRecords": true, "certificates": false, "scheduler": true, "externalActivityLog": false }, "records": { "required": ["[e.g. attendance | transcript | competency-statement]"], "exportFormats": ["json", "pdf", "csv"] } } 6.2 audience.config.json — see §2.6 6.3 a11y.config.json — see §4.5

### 6.4 Worked example — 

App 1: early-primary literacy game // audience.config.json { "tier": "A1", "profiles": ["standard","dyslexia","eal"],

<!-- p.64 -->

"pacingByTrack": { "phonics": "linear", "storytime": "spiral" }, "uiIntensity": "gamified", "guardian": { "model": "single-profile-role-view", "pinGated": true, "requiredForOnboarding": true }, "session": { "targetMinutes": 12, "itemsPerSession": 8, "breakPromptAfterMinutes": 15, "hardCapMinutes": 30 } } // app.config.json (excerpt) { "vocabulary": { "learner":"Reader", "guardian":"Grown-up", "unit":"Adventure", "lesson":"Story Step" }, "mastery": { "levels":[{"id":"introduced","min":0},{"id":"proficient","min":75},{"id":"mastered ","min":90}], "requiresSeparateSessions": 2, "advanceGate":"proficient" }, "progression": { "enabled": true, "currency": { "enabled": true, "label":"Stars" }, "celebrationIntensity": "high" }, "features": { "multiDayProjects": false, "certificates": false }, "assessment": { "diagnostics": { "placement": { "enabled": false, "fallback": "manual" }, "benchmark": { "enabled": false } }, "grading": { "ungradedInAverage": "exclude" } }, "goals": { "enabled": true, "requireOneOf": ["mastery"], "maxActivePerLearner": 2, "surfaceOnHome": true, "weeklyReviewRitual": { "enabled": false } }, "agency": { "choicesPerSession": 1, "levers": ["pickNext"] } } // a11y.config.json (excerpt) { "defaultFont": "dyslexiaFriendly", "textToSpeech": { "available": true, "defaultOn": true, "wordHighlight": true }, "simplifiedNavigation": { "available": true, "defaultOn": true }, "readingLevelCeiling": "Grade 1" }

### 6.5 Worked example — 

App 2: adult professional certification // audience.config.json { "tier": "A5", "profiles": ["standard","motor"], "pacingByTrack": { "regulations": "catalog", "practical": "unitCycle" }, "uiIntensity": "professional", "guardian": { "model": "none", "pinGated": false, "requiredForOnboarding": false }, "session": { "targetMinutes": 30, "itemsPerSession": 15, "breakPromptAfterMinutes": 60, "hardCapMinutes": null } } // app.config.json (excerpt)

<!-- p.65 -->

{ "vocabulary": { "learner":"Candidate", "guardian":"Supervisor", "unit":"Module", "assessment":"Evaluation", "mentor": null }, "mastery": { "levels":[{"id":"introduced","min":0},{"id":"proficient","min":80},{"id":"mastered ","min":95}], "requiresSeparateSessions": 2, "credentialGate":"mastered" }, "progression": { "enabled": false }, "features": { "certificates": true, "printableRecords": true }, "assessment": { "diagnostics": { "placement": { "enabled": true, "requiresGuardianApproval": false }, "benchmark": { "enabled": true, "showToLearner": true } }, "grading": { "ungradedInAverage": "exclude", "commentRequiredOnScore": true } }, "goals": { "enabled": true, "requireOneOf": ["mastery"], "proposalMode": "learnerSets", "reviewRequiredAtTermEnd": false }, "agency": { "choicesPerSession": 2, "levers": ["pickNext","pickDepth","pickFocus"] }, "records": { "required": ["competency-statement","hours-log","certificate"] } } Note what did not change between App 1 and App 2: the content hierarchy, the event schema, the assessment engine, the review algorithm, the persistence rules, the accessibility infrastructure, the reporting engine, and every line of application code. That is the test.

## §7 — Appendices

### 7.1 Definition of 

Done — per lesson Every beat present per the track's instructional pattern Every item tagged to ≥1 skill Every distractor has its own named-misconception diagnosis Hint ladder present, 3 steps, escalating Worked solution shows the method, not just the answer Relevance slot filled and placed where the learner still cares Media has alt text / transcript / captions External references verified and stamped Standards mapped Reading level within tier ceiling Assessment purpose declared on every assessment-bearing beat

<!-- p.66 -->

evidenceSource and attemptState emitted on every item event Diagnostic items tagged to the course band they probe Benchmark items belong to a named, versioned form with a fixed blueprint Rubric attached to every performance task, checklist and project stage Any goal this content can satisfy names the event type that proves it status set; nothing active references anything draft Content validation passes Walked end to end by a human as a learner

### 7.2 Anti-pattern register 

See §1.4 (28 entries). Add newly discovered ones here with the structural fix , not just the bug fix. A one-off fix that doesn't change a rule will recur.

### 7.3 Glossary 

Agency budget — the minimum number of real learner choices per session. Assessment purpose — placement, formative, benchmark or summative; declared before scoring. Baseline — the first measured value; without it no growth claim is possible. Beat — atomic instructional step inside a lesson. Evidence Bound — placement may not exceed what was directly demonstrated. Content Slot — named, typed hole the framework exposes for domain content. Derived state — anything computable from the event log; never source of truth. Hot/cold hydration — split of launch-critical vs. lazily-loaded data. Inconclusive — a diagnostic band with too little evidence to judge; not the same as failed. Skill — the durable, masterable unit; the real currency of the system. Track — a subject, discipline, or competency area. Ungraded — awaiting a human; the opposite of a zero, never averaged as one.

### 7.4 Migration path to 

Edition B This edition is forward-compatible. To connect an Edition A app: 1. Events already carry learnerId, ts, schemaVersion — the sync layer replays them; no content rewrite required. 2. Content IDs are stable strings — a remote content service can serve the same pack. 3. Preferences and profile move to the account record unchanged. 4. Add the service layer per BLUEPRINT_B_CONNECTED_AI.md §3.10–3.13. Do not add cloud features by bolting a server onto Edition A incrementally. Read Edition B's §3.12 first — identity and privacy decisions constrain everything else and are expensive to reverse.

<!-- p.67 -->

### 7.5 Common recommendations that may not apply 

Generic engagement advice is written for consumer apps competing for a voluntary user. Much of it inverts in a required-attendance or single-learner context. Evaluate each against your actual situation before adopting it. Recommendation When it does not apply Leaderboards, peer comparison, social competition Single-learner or offline deployments — there is nobody to compare against, and comparison against nobody is meaningless. Also inappropriate for minors without explicit guardian opt-in (§3.7.2 rule 6) Push notifications and re-engagement campaigns Offline products, and any context where attendance is required. The in-app equivalent — a surface that adapts to absence, time of day, and what's on deck — does the same job without a server "Aha moment in the first 60 seconds" A churn metric. A learner who is required to attend is not evaluating whether to keep the app; optimizing for it optimizes something already guaranteed. §4.9's rule — first session ends in a completed lesson — is the version that matters DAU / retention / churn optimization generally Where attendance is mandated, the risk is not that the learner leaves. It is that they attend every day and retain nothing. Those two risks need opposite fixes Shorter "snackable" sessions Where the session length is set by a schedule or a workplace block. Chunking belongs inside the block — which the beat ladder (§3.2) already does Switching spaced-repetition algorithms Algorithm choice is rarely the bottleneck; coverage is. A simple Leitner ladder wired to every track beats a sophisticated one wired to a single track

<!-- p.68 -->

On statistics in engagement literature. Figures like "35% higher engagement" or "40% better retention" circulating in vendor material are marketing, not research. What is well evidenced in cognitive science: the spacing effect, retrieval practice, immediate feedback, worked examples, and chunking . Gamification effect sizes in the literature are mixed and tend to fade as novelty does. That is the actual argument for building §3.6's retrieval mechanics and §3.7.3's agency levers before adding anything further to the reward layer.

### 7.6 Suggested patch batching 

When applying this framework to an existing app rather than a new one, sequence matters: Batch Contents Rationale A Diagnostics + goals (§3.10, §3.11) and the export-completeness guard (§3.9 rule 10) Highest value; the export guard is about thirty minutes of work and protects everything built after it. Baseline capture in particular must exist before any change you intend to evaluate B Scheduling (§3.12) + grading queue (§3.13) + rubrics (§3.6) These three interlock — scheduling produces the work, the queue holds it, the rubric scores it. Building them separately means building the interfaces twice C Archival (§3.2) + onboarding (§4.9) + intervention ladder (§3.6) All touch content authoring; do them before batch content population D Retention/rollup, multi-learner, skill-graph validation, print spec, terminology lint Hardening and year-two concerns Process note. §0 rule 5 — "Do not edit this document to match what got built. It is the target, not a tracker" — applies to these patches too. Fold them in as targets and keep what actually shipped in PROJECT_LOG.md.
