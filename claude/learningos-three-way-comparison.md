# LearningOS — three-way comparison and the engine-fit verdict

**Aug 30, 2026.** Successor to `mission-control-vs-petal-pestle.md` (Aug 13), which is
now 17 days and ~50 app versions stale.

Written to answer one question before any code moves: **can one engine hold Lamar's
course, Azianna's course, and Philissa's course?**

---

## 0 · What was actually read, and one limitation

| Source | How it was read |
|---|---|
| **Petal & Pestle** | The live repo — `src/`, `scripts/`, `src/db/db.js`, a real backup JSON, and all 30 docs in `claude/` |
| **The Academy** | All 27 markdown files — `Academy/docs/00`–`11`, `study/`, `TERM_0_SYLLABUS`, `TRACKER_CHANGE_SPEC`, `DECISION_LOG`, `_portfolio-tracker/` |
| **Mission Control** | ⚠️ **Repo not mounted this session.** Read from project knowledge, from Petal & Pestle's own comparison doc, and from `portfolio_scan.py`'s scrape of its `STATUS.md` |

**The limitation matters.** Every claim below about Mission Control's *code* is
second-hand. Before anything is built, his repo must be mounted and this document
re-verified against it. Nothing here should be treated as settled about his app.

---

## 1 · The three, side by side

| | Mission Control Academy | Petal & Pestle Academy | The Academy (hers) |
|---|---|---|---|
| Learner | Lamar, 12, 7th | Azianna, 9, 4th | Philissa, 50, adult |
| Career track | Aerospace engineer | Herbalist physician | Herbalist / horticulturist |
| Status | **Live, daily use since Aug 3** | **Live, daily use** | **Paper. 0 lines of code** |
| Size | ~356,000 lines, 356 lessons | 111,000 lines, 256 lessons | 5,342 lines of spec |
| Stack | Vite · React · Tailwind | Vite · React · Tailwind | **Next.js 15 · TypeScript** (specified) |
| Storage | Dexie / IndexedDB **v35** | Dexie / IndexedDB **v12**, 21 tables | **Supabase Postgres** (specified) |
| Hosting | Netlify | Netlify | **Vercel** (specified) |
| Guide | Commander Nova | Dr. Marigold | The AI Professor |
| Authority | Parent approves | Parent approves | **No parent. She is the authority** |
| Deadline pressure | Q3 curriculum due Jan 4 | Content complete for the year | **MVP must ship by Dec 20** |

---

## 2 · Identical / renamed / actually different

### Genuinely identical — the engine

These are the same mechanism in both live apps, and the Academy spec asks for them
too. This is the real shared spine.

- Lesson as a fixed-shape object taught in one sitting
- Dated term/quarter calendar driving what is offered today
- One day's work presented as a board, not a catalogue
- Auto-graded checks → periodic tests → quarterly/unit exams
- Percentage gradebook with an A–F ladder
- Instructional-hour accounting
- A progression ladder (ranks / CEU tiers)
- Portfolio of written work
- Local-first data with JSON export/import
- Verified-video-per-lesson rule
- **The build discipline**: decisions written by hand, anything countable generated;
  checks that refuse rather than guess

### Same thing, different name — pure pack data

Trivially different. These are why the apps *look* like different products, and they
are the cheapest thing on this list to unify.

| Concept | Lamar | Azianna | Philissa |
|---|---|---|---|
| Guide | Commander Nova | Dr. Marigold | AI Professor |
| Currency | XP | Petals / Golden Seeds | CEU |
| Ladder | 51 badges, ranks | 7 ranks, 0 badges | 4 tiers |
| Palette | dark cockpit | bright greenhouse | garden / earth / sage |
| Unit of work | Mission | Lesson | Lesson (8 blocks) |

Tailwind's config comment in Petal & Pestle already says it outright: *"Mission
Control is a dark cockpit; this is the opposite on purpose — a bright greenhouse.
**Same token STRUCTURE.**"*

### Actually different — and deliberately so

**This is the section that decides the merge.** These are not accidents of separate
development. Each one is a decision with reasoning written down, and several
directly contradict each other.

| # | Divergence | Detail |
|---|---|---|
| 1 | **Reward economies: same structure, one opposed rule** | `src/lib/economy.js` says hers *is* structurally his — *"passive earning derived from a monotonic counter, discrete events in a ledger that merges by union, balance folded from both and never stored"* — then: *"ONE THING IS DELIBERATELY DIFFERENT, AND IT IS THE WHOLE POINT… NOTHING in this file pays for being right."* Effort-only, so the adaptive diagnostic cannot be gamed. **Good news: the ledger merges. The fork is a single rule, not an architecture** — but it is still a decision, not a merge conflict |
| 2 | **Adaptive diagnostic engine** | Hers only. 9 strands, 270 items, step-down staircase. Founding mechanism of her app; his has no counterpart |
| 3 | **Leitner spaced review** | Hers: continuous year-long queue, intervals 1/3/7/16/35/70. His: a 5-day study cycle before each quarterly. The comparison doc's own line — *"his is spaced preparation… hers is spaced retention… each app would be better with the other's"* |
| 4 | **Test cadence** | Hers: unit + weekly tests every 3–4 lessons. His: nothing until the quarterly |
| 5 | **Evidence-source quarantine** | Hers: `itemEvents.evidenceSource` keeps diagnostic misses out of mastery. No equivalent in his |
| 6 | **Read-aloud as recorded construct** | Hers: `readAloud` per answer, driving an explicit validity claim on the parent report. 63% of her answers were read aloud — every ELA level she has is a *listening* level |
| 7 | **Reading level, not age** | All her lessons written at ~2.5 and enforced by `check-readability.mjs`. His at 7th grade. **None of his 720 weekly words transfer** |
| 8 | **Body-image fence** | Her `check-assessment` bans weight/appearance language across all 640 Human Body questions; PE deliberately became *Movement & Wellbeing*. Master plan §14: *"His is built around healthy weight and muscle gain. Not carried across"* |
| 9 | **Parent dashboard scale** | His 30 sections vs. her 6 groups / 16 sections |
| 10 | **Longitudinal simulation** | Hers: `simulate-year.mjs` plays out 40 school days and found two real bugs. *"He has 118 checks and none of them plays out a calendar"* |

**Read #1, #7 and #8 together.** Azianna's 256 lessons cannot be moved into Lamar's
app. They are written at a different reading level, enforced by a different check,
under a content rule his app does not have, paying a currency his app does not use.
"Transferring everything over to Lamar's app" is not a data move — it is a rebuild
of his app into something that can hold hers.

---

## 3 · Verdict on your course: **it does not fit their engine, and it shouldn't**

Structurally, the Academy is **a homeschool chassis with the child-supervision layer
removed and a research-integrity layer bolted on in its place.**

The outer shell ports nearly intact — course catalog, dated terms, a today-card that
offers one lesson, an eight-block lesson shell, percentage grades, hour accounting,
a tier ladder, spaced review, transcript export. A K-12 engine would run all of that
without argument.

**What has no slot in a child's app:**

1. Six-state mastery where *Mastered* requires correct retrievals at ≥14 **and** ≥30
   days — unreachable within a month by design
2. Evidence weighting — a lab performance counts 4× an in-lesson multiple choice
3. Confidence calibration tracked as a graded competency; confident-and-wrong is the
   flagged cell
4. A misconception register with a six-step closure protocol
5. The "I looked this up" toggle — never penalized, but evidence-capping
6. A retention index displayed *next to* the GPA, deliberately the less flattering
   number
7. Mastery **decay** over time
8. Safety-critical topics that must reach Mastered regardless of course average
9. Five AI mode contracts where EXAMINE cannot be reached by conversation
10. Per-claim epistemic tiering and a hard citation-invention ban
11. Seasonal lab windows — a July lab cannot be assigned in February
12. A defended capstone with a separate passing floor on intellectual honesty

**What their apps have that yours refuses, by decision:**

1. **No parent role — and no second user exists in the schema.** Doc 03 §2: *"she's
   the only one it reports to."* You are student, owner, author and developer at once
2. **No XP, badges, coins or avatars anywhere in 5,342 lines**
3. **No alarm mechanics.** D-052: *"Overdue review is amber, never red. Falling
   behind is expected, not an emergency"*
4. **No compliance attendance.** Georgia's Declaration of Intent attaches to Lamar,
   not to you — you are 50, and D-006 forbids accreditation claims

And the hard technical wall: **D-029 — the Claude API key cannot be client-side.**
Your app needs a server. Their apps are client-only by design. That single
constraint means your course cannot run inside their architecture even if everything
else matched.

**Verdict: your course is a different application that belongs on the same platform
account — not a third pack inside their engine.**

---

## 4 · Verdict on the merge: right destination, wrong project for this fall

The full LearningOS — one engine, three content packs — would require, at minimum:

| Work | Why it is large |
|---|---|
| Add `profileId` to both schemas | Petal & Pestle has **zero** hits for any learner-id field. Single-student is structural, not configured. Both databases hold irreplaceable live school records |
| Build a content-pack layer | It does not exist in either app. `blueprint-conformance-audit.md` §B already calls this *"the deepest structural gap here"* — course ids are literals in `src/lib/`, `src/config/assessment.js`, **and all 42 check scripts** |
| Theme indirection | **1,848 hardcoded colour class occurrences across 38 files** in Petal & Pestle alone. **Zero** CSS custom properties. Re-theming is a find-and-replace, not a token swap |
| Reconcile the economies | XP-for-correct vs. effort-only. A decision, not a task |
| Dexie → Supabase | Two schemas, v35 and v12, both live |
| Your app | A different stack entirely |

**And here is the part that settles it.** `Academy/docs/10_DEVELOPMENT_ROADMAP.md`
§1 — your own words, your own constraint:

> *"Building the app competes with studying in it."*
>
> Build capacity is **High only in Sept–Dec 2026**. Medium in summers and the Dec/Jan
> break. **None during spring and fall semesters.** *"The MVP must be finished before
> January 4, 2027, because after that date there is no time to finish it."*
>
> Risk register, rated High/High: *"Content authoring falls behind — this is the
> likeliest cause of failure"* and *"Building displaces studying."* Mitigation: **"If
> a conflict arises, studying wins."**

Sept–Dec 2026 is the only window you have. The three-way merge would consume all of
it and more — and it would consume it during a live school year for two children,
one of whom needs Q3 curriculum by Jan 4.

**A merge that costs you your own MVP window is not a merge worth doing this year.**

---

## 5 · What LearningOS should actually be this fall

The thing that delivers what you asked for — multiple people sign in, each with their
own named homeschool — **without** the engine merge, is a shared spine underneath
three front ends.

You already invented this. `08_TECHNICAL_ARCHITECTURE.md` §5 documents an API
surface and a `domain_events` table, and D-011 names it *the LifeOS seam*.

### The shape

```
                    ONE SUPABASE PROJECT
                    ┌──────────────────┐
                    │  auth.users      │  3 logins
                    │  learners        │  name, homeschool name, theme
                    │  records         │  hours, grades, transcript
                    │  portfolio       │  work samples
                    │  domain_events   │  the seam
                    └──────────────────┘
                       ▲      ▲      ▲
          ┌────────────┘      │      └────────────┐
   Mission Control      Petal & Pestle        The Academy
   Vite · Dexie         Vite · Dexie          Next.js · Postgres
   local-first          local-first           server-side
   syncs up             syncs up              native
```

Each app keeps its own database, its own engine, its own economy. Each syncs its
record layer up. Nothing is rewritten.

### What this buys you

- **One login each.** Real sign-in, the answer to the original question
- **Each person names their own homeschool.** Mission Control Academy, Petal &
  Pestle Academy, yours — the platform is LearningOS, the school is theirs
- **Kills the standing risk in your own handoff notes** — Lamar's entire school
  record no longer lives in one browser on one computer with nothing behind it
- **One records view across all three** — hours, grades, portfolio, transcript
- **Georgia compliance in one place** for both children
- **Your Academy is built natively on it** — no retrofit, no migration, and it is
  the app you have a December deadline for

### What it costs

Not zero, but bounded: a Supabase schema, auth, RLS on all four verbs (your Doc 08
§4 already flags the tracker's SELECT-only bug as the lesson), and a sync writer in
each Vite app. It touches the record layer of the two live apps and nothing else —
no engine surgery, no theme rewrite, no economy decision, no content-pack extraction.

### And the real LearningOS still happens

One engine, three packs, is the **summer 2027 commercial rebuild you already
planned** — with three years of proof behind it, a stable records spine already
running, and the pack boundary designed once rather than retrofitted twice.

---

## 6 · What this means for the reward tab, right now

You are working on Lamar's rewards this week. One thing to settle before you build
more of it.

The two apps' economies are **opposed on purpose**. His pays XP for correct answers;
hers pays nothing for being right, so her adaptive diagnostic cannot be gamed. Every
badge, multiplier and payout you add to his reward tab is more surface that a future
single engine has to reconcile.

**This does not mean stop.** His app is live and the reward tab is real work. It
means: while you are in there, decide and write down whether **XP-for-correct
survives into LearningOS.** One paragraph in his `PROJECT_LOG.md`. If it does, hers
eventually adopts it and the diagnostic needs a different guard. If it doesn't, stop
deepening it now and let the redesign concept settle it.

Also still open from your Aug 8 handoff and unresolved: Part 10 sells Planet
Exploration, the redesign says destinations should be **earned, not bought.** That
conflict has to be settled before Part 10 is built, not after — and it is the same
question in a different costume.

---

## 7 · On pausing Azianna's app

Pausing feature work is reasonable — she is at **256 of 256 lessons, content complete
for the year**. But three things should not be lost:

1. **Her app keeps running.** It is her live school. Stopping development is not
   stopping the app, and nothing here should interrupt her year
2. **Four of five measurement gaps have no lesson that teaches them** (master plan
   §35, `PHASE_4_SCOPE`) — units, perimeter, area, telling time, elapsed time.
   Measurement is her weakest strand at 2.44 and *falling*. Tagging cannot
   manufacture content that was never written
3. **Her independent reading has never been measured.** 63% of her answers were read
   aloud. Every ELA level in her record is a listening level. `readingCheck.js`
   exists to fill that blank and it is still one unit deep

None of these are merge work. They are the shortest path to her year being real, and
they are cheap next to anything in section 4.

---

## 8 · Sequence

| Window | Work | Netlify |
|---|---|---|
| **Now → Sept 21** | Mount Mission Control and re-verify §2 against his code. Design the Supabase spine — schema, auth, RLS on all four verbs. No deploys possible anyway | **0** |
| **Sept 22 → Oct** | Spine live. Sync writer in one app first (Lamar's), tested against a copy of his export before it ever touches his real database | 1 batched |
| **Oct → Dec 20** | **The Academy MVP.** This is the window your roadmap says is the only one. Built natively on the spine | — |
| **Dec 20 → Jan 4** | Azianna's sync writer. Lamar's Q3 curriculum | 1 batched |
| **Jan 2027 → Apr** | Nothing. You are in Y1S1 at 14 hrs/week. Studying wins | — |
| **Summer 2027** | The real engine merge — one engine, three packs | — |

**Full export of both live databases before any sync writer runs. No exceptions.**

---

## Open questions for Philissa

1. **Does XP-for-correct survive into LearningOS?** (§6 — blocks reward tab depth)
2. **Planet Exploration: bought or earned?** (§6 — blocks Part 10)
3. Does the Small Garden Tracker's Supabase project become the LearningOS project, or
   does LearningOS get its own and the tracker joins it? Doc 08 §1 assumed the former
   for a two-app world; three apps may change that
4. Auth method for a 9-year-old with no email — parent-created accounts, or magic
   links to your inbox?
5. Confirm: **is the Dec 20 Academy MVP still the priority it was when Doc 10 was
   written?** Everything in §8 is sequenced around yes.
