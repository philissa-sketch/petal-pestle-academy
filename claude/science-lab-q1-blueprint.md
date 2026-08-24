# The Science Lab — Quarter 1 Blueprint · **v2, re-cut**

**24 lessons · 8 weekly tests · 1 quarterly exam · 9 weeks · Aug 3 – Oct 31 2026**
For approval before any lesson prose is written. Aug 16 2026.

---

## Why there is a v2

Gigi: *"Make sure you used the same format as Herbalism and just didn't add random videos that has nothing to do with the lesson."*

**She was right, and v1 failed the test in two places outright.** Audited against Herbalism, where every lesson's video teaches *that lesson* and the titles almost echo the lesson names — *"Seeds that travel"* → **How Do Plant Seeds Travel?**, *"Taproots and fibrous roots"* → **Types of Roots | Taproot | Fibrous Root**, *"Soil is alive"* → **Soil Is Alive!**

v1 scored **13 good, 9 weak or duplicated, 2 flatly wrong.** The worst: a lesson called *"The pulley and the screw"* carrying a video called **Types of Levers**.

**The cause was the blueprint, not the searching.** v1 put six lessons on ONE standard. There are not six different videos about "balanced and unbalanced forces", so four topics got stretched across six slots and the seams showed.

**Herbalism works because every lesson is a genuinely different thing.** So v2 re-cuts the lesson topics until each one is distinct — and Module 3 proves the principle by itself: **there are exactly six simple machines**, so it is one machine per lesson, not two bundled.

**Rule adopted:** if no video exists that teaches a lesson, that is the signal the lesson is not distinct enough — not a licence to reach for something adjacent.

---

## The 24 lessons, each with the video that teaches it

Every id confirmed against YouTube's oEmbed endpoint; every title is the string YouTube returned.

### Module 1 · Push, Pull, and What Wins *(Weeks 1–2)* — **S4P3a**

| # | Lesson | Video | Channel |
|---|---|---|---|
| 1 | Every push and every pull | Push and Pull for Kids \| Forces in Science | Homeschool Pop |
| 2 | Balanced — when nothing moves | Forces for Kids \| Balanced and Unbalanced | GenerationGenius |
| 3 | Tug of war with string and weights | Physics Tug of War | Teach Engineering |
| 4 | **Friction — the force that slows the wheelbarrow** | Forces: Friction for Kids! | Learn and Play Online! |
| 5 | **Which way it goes, and how fast** | Forces and Motion – Magnitude and Direction | Next Generation Science |
| 6 | **Air pushes back — the parachute and the falling leaf** | Playtime with Parachutes \| Physics for Kids | SciShow Kids |

### Module 2 · Gravity, and Which Way Is Down *(Weeks 3–4)* — **S4P3b**

| # | Lesson | Video | Channel |
|---|---|---|---|
| 7 | The pull that never switches off | Defining Gravity: Crash Course Kids #4.1 | Crash Course Kids |
| 8 | Drop the heavy one and the light one together | Do Heavier Objects Fall Faster? Easy Gravity Experiment! | Mind of Mason |
| 9 | **The root that grows down whichever way the seed lay** | Bending Plant Roots with Gravity \| STEM Lesson Plan | Science Buddies |
| 10 | **Heavy is not the same as how much stuff** | Difference between MASS and WEIGHT | MooMooMath and Science |
| 11 | **What she would weigh on the moon** | Solar System : How much would you weigh on other planets?? | Very Important Things |
| 12 | **Why the moon does not fall on us** | Why Doesn't the Moon Fall Down? \| Gravity & Orbits Explained for Kids! | STEM Spark Zone |

### Module 3 · Six Simple Machines in the Garden Shed *(Weeks 5–6)* — **S4P3c**

**One machine per lesson.** This is the module that showed v1 what was wrong with it.

| # | Lesson | The garden tool | Video | Channel |
|---|---|---|---|---|
| 13 | The lever | Trowel · wheelbarrow handle | Super Simple Machines: Levers | SciShow Kids |
| 14 | The wheel and axle | Wheelbarrow · hose reel | Simple Machines – Wheel and Axle | Little School |
| 15 | **The pulley** | Hanging basket · well bucket | Need a Lift? Try a Pulley! | SciShow Kids |
| 16 | **The inclined plane** | The ramp up to the raised bed | Ramps: A Super, Simple Machine! | SciShow Kids |
| 17 | **The wedge** | Spade · pruners · axe | Simple Machines: The Wedge | funsciencedemos |
| 18 | **The screw** | Jar lid · auger bit · hose fitting | Simple Machines – Screws | Little School |

### Module 4 · Light, and What It Meets *(Weeks 7–8)* — **S4P1a · S4P1b · S4P1c**

| # | Lesson | Element | Video | Channel |
|---|---|---|---|---|
| 19 | Opaque, transparent, translucent | S4P1a | Opaque Transparent Translucent Objects (For Kids) | TutWay |
| 20 | **Shadows — what an opaque thing makes** | S4P1a | HOW SHADOWS ARE FORMED? | Make It Easy Education |
| 21 | Light travels straight, and dust proves it | S4P1b | Light Travels in a Straight Line \| Science Experiment | Hungry SciANNtist |
| 22 | The mirror and the angle | S4P1b | Reflection of light - Elementary Science | Elearnin |
| 23 | The pencil that bends in a glass of water | S4P1c | Refraction of Light - Why does a pencil look bent in water? | It's AumSum Time |
| 24 | A water drop is a magnifier | S4P1c | How To Make a Water Drop Magnifier | RonyesTech |

**Week 9 — Quarter 1 Exam.** Study guide → review game → 24 questions, cumulative across Modules 1–4 and nothing beyond.

---

## What changed from v1

| | |
|---|---|
| Videos kept | **13** — every one that already taught its lesson |
| Lessons re-cut and re-searched | **11** |
| Videos dropped for being off-topic or duplicating another lesson | 9 |
| Videos dropped for being **flatly wrong** | 2 — *Types of Levers* on a pulley-and-screw lesson; *Inclined Plane & Screw* on a lesson about the wedge |
| Videos dropped for failing verification | 1 — Turtlediary, oEmbed **HTTP 401**, embedding disabled |
| New videos found and verified | **11** |
| **Total, all confirmed** | **24 of 24** |

**No two lessons share a video.** SciShow Kids appears four times and Little School twice, but as four and two *different* videos — `check-videos` fails on a duplicate id, which is the thing that actually matters.

**No lesson prose had been written when this was caught**, so nothing was wasted. This is the stage the audit was for.

---

## What each lesson owes

Built to the `Inside a Seed` reference shape (v3.6):

| | |
|---|---|
| Shape | Check-In → **two beats**, each with a hook, teaching, a worked example and an **Apply-It answered on the spot** → a 3-question check |
| Length | 30 minutes — `blk-science`, not Herbalism's 45 |
| Reading level | **~2.5** |
| Video | one verified video, with a `teaches:` list mapping to the lesson's own words |
| Bank | **10 questions**, per-choice feedback, every wrong choice a real candidate |
| Weekly test | 8 questions on Day 4 — six from this week, two from earlier |

**Totals: 24 lessons · 24 videos ✅ · 240 bank questions · 8 weekly tests · 1 exam.**

---

## The Black-American-educator requirement: 0 of 24

Seventeen searches in v1 plus eleven more in v2, all in a real browser, all written down in `science-lab-q1-videos-verified.md`. No identifiable Black American educator surfaced for elementary physical science on any of them.

**Two caveats stated rather than buried:** channel identity was judged from name and presentation only — `Mind of Mason` and `Savannah Hendrickson` are logged **unknown**, not as a gap closed. And YouTube returned only two results per search in this session, so **this was not an exhaustive survey**.

---

## What this changes in the record

- `curriculumPlan.js` gains `SCIENCELAB_MODULES` — 4 modules, 24 lessons, their weeks, quarter and element codes.
- The Science Lab moves `state: 'planned'` → `'building'`. Not `complete` until all 48 exist.
- **No `TAUGHT_OFF_GRADE` entries needed** — all six elements are genuinely fourth grade.
