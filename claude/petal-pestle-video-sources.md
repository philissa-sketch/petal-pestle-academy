# Petal & Pestle — Video Sources (queued)

Standing requirement, carried over from Lamar's project log, quoted exactly:

> every video link must be verified as a real, currently-existing, correctly
> on-topic video before it's added — **never invent or guess a URL**

> actively seek out **Black American educators as video sources**, not just
> generic sources like Khan Academy/NASA

**Where Petal & Pestle stands:** 13 Herbalism lessons written, **0 videos**. His
Aerospace course is 49/49 and Social Studies 18/18. This is a straight gap, not
a difference of approach.

---

## How a video gets verified before it goes in

Never from memory, never from a plausible-looking URL. The check is:

1. Search for candidates.
2. Hit YouTube's oEmbed endpoint for the exact video id:
   `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json`
3. A live video returns its **real title and channel**. A dead or invented id
   returns an error.
4. Record the title and channel returned by YouTube — not the title from a
   search result, which can be stale.

Negative-tested Aug 14: a made-up id returns a 400, a real one returns JSON.
This becomes check #18 — the build fails if any lesson has no video, or has one
whose id was never verified.

---

## SINGING — Gigi's pick, verified Aug 14 2026

**Cheryl Porter Vocal Coach**

| | |
|---|---|
| Channel | https://www.youtube.com/@CherylPorterVocalCoach |
| Canonical id | https://www.youtube.com/channel/UCiuFR-m7cy1GW-JMMYBd1TQ |
| Status | Live, active |
| Who | Black American vocal coach, born in Detroit, based in Italy. Covered by Essence and PRX's *The World*. Known for vocal warm-ups and technique. |
| Fits the standing requirement | **Yes** — a Black American educator, named by Gigi rather than picked off a search result |

**Verified starter video** (oEmbed, Aug 14 2026):

| Title (as YouTube returns it) | Channel | URL |
|---|---|---|
| Easy Vocal Warmup for SINGERS w/Vocal Coach Cheryl Porter | Cheryl Porter Vocal Coach | https://www.youtube.com/watch?v=qwjD-KvdjAs |

**One judgement call for Gigi, flagged not decided:** the channel is aimed at
adult and pop singers. A nine-year-old handed an open channel ends up somewhere
nobody chose. So the plan is to link **specific verified videos in a sequence**,
with the channel link kept visible for Gigi. Say the word if you'd rather she
just have the channel.

---

## YOGA — Gigi's pick, verified Aug 14 2026

**Yoga Guppy**

| | |
|---|---|
| Channel | https://www.youtube.com/@yogaguppy |
| Canonical id | https://www.youtube.com/channel/UC02UfeIO6g1BrAC0nHgRGRw |
| Status | Live, active |
| Who | Run by Rashmi. Kids' yoga — asana practice, yoga stories, yoga music, mindfulness and breathing exercises. |
| Aimed at children | **Yes, explicitly.** The channel's own description is about little ones focusing on their health. Listed by *Yoga Journal* among kids' yoga channels. |

**Verified starter video** (oEmbed, Aug 14 2026):

| Title (as YouTube returns it) | Channel | URL |
|---|---|---|
| Kids Yoga for Beginners I Easy Yoga Poses for Flexibility & Strength I Yoga Guppy | Yoga Guppy | https://www.youtube.com/watch?v=bXFoEmJDwI8 |

**Why this one is easier than the singing channel.** Cheryl Porter's channel is
built for adult singers, so specific videos have to be picked. Yoga Guppy is
built for children from the ground up — asana practice, breathing, yoga stories.
The whole channel is age-appropriate, so a fuller ladder can be drawn from it
with less filtering.

**It fits Movement & Wellbeing exactly as scoped.** That section tracks
movement, yoga, sleep, water, mood and strength — and never weight, appearance
or body composition. A kids' yoga channel about flexibility, strength, posture
and breathing sits inside that scope with nothing to strip out.

---

## How Singing and Yoga get built

Both live in the **Singing & Movement** block (`blk-doing`, 3:35pm), which
currently has no `subject` and therefore opens nothing at all.

1. Add `singing` and `movement` subjects to `blockLinks.js`.
2. Build one small screen with two ladders — warm-ups from Cheryl Porter,
   yoga from Yoga Guppy — each video verified, each in a sensible order for a
   nine-year-old starting out.
3. Ticking a video is **participation, not a grade**. Petals for doing it, never
   for how it sounded or how deep the stretch went. Same rule as the Journal and
   the Garden.
4. Alternating is fine and probably right: singing some days, yoga others. The
   block is 15 minutes.

---

## Still to source

| Course | Lessons | Videos needed |
|---|---|---|
| Herbalism & Botany Q1 | 13 | 13 |
| Herbalism Q2–Q4 | 39 | 39 |
| The Human Body | 26 | 26 |
| Social Studies (Georgia GSE) | 52 | 52 |
| Singing ladder | — | ~6–8 |
| Yoga ladder | — | ~6–8 |

For Social Studies especially, the Black-American-educators requirement is not a
nice-to-have — SS4H4, SS4H6c and SS4H6d are Frederick Douglass, Harriet Tubman,
sharecropping and Jim Crow. Who is telling her that history matters.
