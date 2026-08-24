# The Human Body — blueprint **IN PROGRESS**

> ## ⚠️ THIS DOCUMENT IS NOT FINISHED AND MUST NOT BE READ AS IF IT WERE
>
> **9 videos verified. 55 are not.** The sixteen-module shape is **approved by Gigi, Aug 17 2026**. Modules 1–4 are Quarter 1 and are the current batch; Modules 5–16 are not started.
>
> This warning is here because of v3.32, when **two files claimed Georgia's social studies standards were transcribed and the folder held one file**, and v3.24, when a build-log line said a module was *"wired in and checked"* and no screen could reach it. **A document that overstates its own completeness is the same fault as a count that drifts.** When this file is finished the box comes off and the file is renamed.

**Course:** The Human Body · 64 lessons · 16 modules · Tue and Thu · all four quarters
**Georgia standard:** **none — enrichment**, deliberately written last
**Shape:** approved Aug 17 2026 · **Verification standard set by Gigi:** title · description · duration · channel

---

## 1. The pipeline — built and proven before any lesson was written

At v3.4 Gigi caught a lesson and its video teaching two different things, and **the cause was the blueprint, not the searching**. So the method was proven first.

| Step | Tool | What it establishes |
|---|---|---|
| 1 | web search | candidates exist |
| 2 | **`youtube.com/oembed`** | the video is real · **the exact title** · the channel |
| 3 | **oembed on a made-up id** | negative control |
| 4 | **YouTube search page → duration badge** | **the true length** |
| 5 | search snippet / video description | what it says it teaches |

### ⚠️ Four things this caught, three of them by nearly going wrong

**1. A fake id returns an EMPTY BODY, not an error.** So "a response came back" is not verification — **a parsed JSON carrying a `title` is.** This is precisely the hole noembed.com fell through at v3.9, when a deliberately fake id "verified" fine. Tested deliberately before trusting the endpoint.

**2. ⚠️ THE PLAYER CLOCK IS NOT A DURATION SOURCE.** Reading the length off the video player gave **1:00**, then **0:46**, then **0:35** for three different videos — **every one of them an advertisement**, not the video. Recording 0:35 as the length of *How Do Cuts Heal?* would have been flatly wrong, and nothing downstream would ever have questioned it.
**Duration is read from the DURATION BADGE on a YouTube search result**, which is rendered from the video's own metadata and is immune to whatever ad is playing.

**3. ⚠️ AND THAT IS NOT A THEORETICAL PRECAUTION — IT DISQUALIFIED A VIDEO ON ITS FIRST USE.** *Going to the Doctor! | SciShow Kids Compilation* was the first choice for Module 1 Lesson 1. The badge says **21 minutes**. The System Concept in a 30-minute lesson is **ten**. It is out.

**4. A SEARCH RESULT'S TITLE CAN BE WRONG, AND ITS CHANNEL CAN BE SOMEBODY ELSE ENTIRELY.** A search offered `BbiY-W4dHac` as *"How Do Cuts Heal?"* by SciShow Kids. oEmbed returned **"How Does a Cut Heal? | WebMD"**, by **WebMD**. Different title, different publisher, different id from the real one. **A search result can be stale; oEmbed cannot.** The same happened more mildly to `OSsntU6sTWI`, whose real title is longer than the search claimed.

---

## 1a. ⚠️ HOW LONG A VIDEO MAY BE — SETTLED FROM THE DISK, NOT GUESSED

I was about to accept a **9:19** video for Module 1 Lesson 1 on the reasoning that it fits inside a ten-minute System Concept. Then I measured the courses that already exist instead of reasoning about them.

| Course | Lesson | Videos: min–max | Median | Mean | Over 6 min |
|---|---|---|---|---|---|
| Herbalism & Botany | 45 min | **3–6** | 4 | 4.1 | **0** |
| **The Science Lab** | **30 min** | **3–7** | **4** | **4.3** | **1 of 48** |
| Social Studies | 30 min | 2–11 | 5 | 5.3 | **12 of 48** |

**The Science Lab is the course to copy.** It has the identical 30-minute shape The Human Body will have, and across 48 lessons its videos are **3 to 5 minutes**, with exactly one exception.

**The reason is arithmetic, and §10.2 states it:** a 30-minute lesson gives the System Concept **ten minutes**, and that ten minutes has to hold **the video AND two beats**, each with a hook, an example and an Apply-It. A nine-minute video eats the entire block and leaves nothing for the teaching. **A video that long is not a lesson input, it is the lesson.**

> ### THE STANDARD FOR THIS COURSE: **3–5 minutes, 6 as a hard ceiling.**

### ⚠️ And that immediately rejects three videos I had already chosen

| Video | Length | Verdict |
|---|---|---|
| *Let's Go To The Doctor!* — Caitie's Classroom | **9:19** | ❌ **out** |
| *Muscular System for Kids…* — Learn Bright | **8:11** | ❌ **out** |
| *Bones for Kids…* — Learn Bright | **7:15** | ❌ **out** |
| *PE Chef: Pulse…* — Just Adapt It. | **7:38** | ❌ **out** of reserve |

**Three of my first nine picks were too long**, and I only know because I read the disk. That is the rule about verifying against the disk rather than against reasoning, doing exactly what it is for.

### ⚠️ AND NOTHING CHECKS THIS. NOT ONE OF THE TWENTY-SIX.

`check-videos` asserts every lesson has a video, verified, dated, with its search recorded. **It says nothing about how long the video is.** `video.minutes` is recorded in every lesson file and **no assertion reads it.**

That is how **Social Studies drifted to twelve videos over six minutes, including one of eleven** — in a course whose System Concept is ten minutes. **A field that is recorded and never asserted is a field that drifts**, which is the same shape as the count drift corrected at v3.41.

**Owed: an assertion in `check-videos` that a video fits the System Concept of the course that owns it** — and a decision from Gigi about the twelve Social Studies videos already over it, because that is her content, not mine to quietly re-cut.

---

### ⚠️ The honest limit: verified is not watched

Gigi's rule is *"the video is picked and watched first."* **I cannot watch video.** What is recorded per video is its **exact title, its channel, its true duration and its own description** — Gigi's chosen standard, set knowing this. The transcript panel opens in a browser but does not come back as text, and reading sixty by screenshot is its own project.

**Every row below states what was checked. Nothing is inferred from a title alone.** That is the difference between this and v3.4.

### A publisher exclusion, in the spirit of the advocacy rule

**WebMD is excluded.** It is a consumer medical-information site, not a children's educational publisher, and this course carries an absolute rule that **nothing may teach her to diagnose herself or her family.** Recorded here with its verified id so the decision is visible rather than silent — the same way PragerU, Learn Liberty and FEE are recorded in Social Studies.

---

## 2. The sixteen modules — **APPROVED Aug 17 2026**

| Q | # | Module | Ends in the doctor's action |
|---|---|---|---|
| **1** | 1 | What a Doctor Does First | **Take a pulse** — 15 seconds × 4 |
| | 2 | Skin, the Cover | Describe how a cut closes, in stages |
| | 3 | Bones, the Frame | **Height and arm span, cm *and* inches** · **hand traced on squared paper — perimeter measured, area counted** |
| | 4 | Muscles, the Pull | **Test a reflex** |
| **2** | 5 | The Heart, a Pump | Pulse **before and after** moving |
| | 6 | Blood, and What It Carries | Read what a cuff shows |
| | 7 | The Lungs | **Breaths a minute** · **lung volume, marked bottle** |
| | 8 | Listening to a Chest | **Listen to a chest** |
| **3** | 9 | The Mouth and the Stomach | Time how long a cracker takes to turn sweet |
| | 10 | The Gut | Map the journey, end to end |
| | 11 | The Kidneys and Water | Measure water in, over a day |
| | 12 | The Brain and the Nerves | **Reaction time — elapsed time** |
| **4** | 13 | Eyes and Ears | **Read an eye chart** |
| | 14 | Growing | **Read a growth chart — height only** |
| | 15 | Staying Well | Handwashing, tested |
| | 16 | **Black Women in Medicine** | *(the Herbalism Module 15 slot)* |

**Measurement is spread across four modules and lives only in the Activity** — the prose stays under the quarter cap. Both geometry floors (perimeter 0/3, area 0/2) land in Module 3 on her own traced hand. Pulse ×4 feeds her Khan *Intro to multiplication*.

**Safety, absolute:** no dosing · no "take this for that" · no self-treatment · **no weight, no body composition, no appearance** · **nothing that teaches her to diagnose herself or her family.** Module 14 plots **height only**.

---

## 3. Quarter 1 — the current batch

### Module 1 · What a Doctor Does First

**PLACED = verified real by oEmbed · duration read from the badge · inside the 3–6 minute standard · fit judged from its own description.**

### Module 1 · What a Doctor Does First

| L | Lesson | Video | Id | Channel | Length | |
|---|---|---|---|---|---|---|
| 1 | What happens at a check-up | ⚠️ **STILL UNRESOLVED** | — | — | — | |
| 2 | Your heart is a muscle you can feel | **How to Feel Your Heart Beat** | `tF9-jLZNM10` | SciShow Kids | **3:35** | ✅ **PLACED** |
| 3 | Finding a pulse, and counting it | **Brain Bites- Heart Rate** | `wzdVUSVObOw` | Lynn Hefele | **4:35** | ✅ **PLACED** |
| 4 | Why a pulse changes | **Science for kids - Measuring Heart Rate \| Body Parts \| Experiments for kids \| Operation Ouch** | `RiWr69OzfPo` | Operation Ouch | **4:29** | ✅ **PLACED** |

**Lesson 2's own description:** *"Get to know your body's most important muscle -- your heart -- and learn how to take your own pulse!"* — the lesson, in the video's own words.

**⚠️ Lesson 1 has now lost BOTH candidates on length.** The SciShow compilation is **21:00**; Caitie's Classroom is **9:19**. Both out. **A third search is owed** for a 3–5 minute video about what happens at a check-up.

### Module 2 · Skin, the Cover

| L | Video | Id | Channel | Length | |
|---|---|---|---|---|---|
| ? | **How Do Cuts Heal?** | `cLEdznnTT8s` | SciShow Kids | **3:08** | ✅ **PLACED** |
| ? | **Why Do We Sweat? \| Sports Science \| SciShow Kids** | `c2_aN98p0RM` | SciShow Kids | ⬜ | verified, length owed |

*How Do Cuts Heal?*'s own description: *"If you've ever had a little cut or scratch, you know it doesn't take long for it to heal! But do you know how different parts of your…"* — Module 2's doctor's action exactly. **Two more lessons owed.**

**Rejected:** `BbiY-W4dHac` — *How Does a Cut Heal? | WebMD*. Wrong publisher, and excluded on principle. See §1.

### Module 3 · Bones, the Frame

| L | Video | Id | Channel | Length | |
|---|---|---|---|---|---|
| ? | **The Skeletal System - Bones for Kids (Updated Version)** | `VHCCgrNSSOg` | Smile and Learn - English | ⬜ | verified, length owed |
| ? | **All about BREAKING Bones! \| Compilation \| Science for Kids \| Operation Ouch** | `iapYNqXvHnw` | Operation Ouch | ⬜ | ⚠️ "Compilation" — expect it to fail on length |
| — | ~~Bones for Kids \| Learn about the Skeletal System for Kids~~ | `3MN-M4gsDX0` | Learn Bright | **7:15** | ❌ **over the ceiling** |

**Three more owed**, and one must carry the **hand traced on squared paper** — perimeter by measuring the outline, area by counting squares. That is the lesson aimed at Geometry 2.00.

### Module 4 · Muscles, the Pull

| L | Video | Id | Channel | Length | |
|---|---|---|---|---|---|
| ? | **How do our muscles and bones work? \| BBC Teach** | `3haTJCOkyxA` | BBC Bitesize for Teachers | ⬜ | verified, length owed |
| — | ~~Muscular System for Kids \| Muscles for kids…~~ | `OSsntU6sTWI` | Learn Bright | **8:11** | ❌ **over the ceiling** |
| — | ~~2-Minute Neuroscience: Knee-jerk Reflex~~ | `c-dD0N53QRg` | Neuroscientifically Challenged | — | ❌ **rejected on level** |

**BBC Bitesize** is a public-service educational publisher, the same standing as Georgia Public Broadcasting, which teaches five Social Studies lessons.

**⚠️ `c-dD0N53QRg` rejected on LEVEL, not length.** *Neuroscientifically Challenged* is an adult neuroscience channel; its knee-jerk video is a reflex-arc explanation with motor neurones and antagonistic muscles. **Her Grammar & Usage measured 2.15 and her independent reading is below a 3.46 listening score.** This is precisely the v3.40 failure — content pitched years above her — and it is rejected here rather than caught later. **Three more owed for this module**, one of them a kids-level reflex video.

⬜ = verified real by oEmbed, **duration not yet read**. **Nothing is placed until its length is read.**

---

## 4. Failed searches — written down, per the standing rule

**Black American educators are actively sought and every failed search is recorded.** Identity is judged from name and presentation only. **Unknown is recorded as unknown, never as a gap closed.**

| # | Date | Search | Result |
|---|---|---|---|
| 1 | Aug 17 2026 | *Black educator YouTube channel human body anatomy for kids elementary science* | **Nothing.** Returned Kenhub, Institute of Human Anatomy, Happy Learning, generic compilations. The search tool stated outright that no Black-educator-led channel matched. |
| 2 | Aug 17 2026 | *"Seed of Melanin Kids" OR "The Magic In Me TV" human body heart lungs bones* | **Nothing on the human body.** Both channels exist and both are already recorded as *likely* from Social Studies Quarter 3 — **neither has human-body content these searches surfaced.** |

**Running total for this course: 0 of 9 verified videos, across 2 searches.**

Context, so the number is not misread: **0 of 96 in Herbalism · 0 of 48 in The Science Lab across 33 searches · 4 of 48 in Social Studies across 39 searches.**

**Module 16 carries Black women in medicine**, as Herbalism does in Module 15 — a module *about people*, where biographical material belongs, rather than a phenomenon lesson a biography would sit oddly on. **It is not a substitute for finding Black educators teaching the other fifteen modules**, and the searches continue.

---

## 5. What is owed

| | |
|---|---|
| **Quarter 1** | **4 placed of 16.** Owed: **1** for Module 1 L1 · **2** for Module 2 · **3** for Module 3 · **3** for Module 4 — plus **3 durations** on videos already verified |
| **Quarters 2–4** | **48 videos**, Modules 5–16 |
| **A check** | **`check-videos` must assert a video fits the System Concept of its course.** Nothing does today, and that is how Social Studies reached twelve videos over six minutes and one at eleven |
| **Gigi's call** | **The twelve Social Studies videos already over the ceiling.** Her content, not mine to quietly re-cut |
| **Then** | 64 lessons written **to** the videos, at her measured level, with the reading cap per quarter |

---

## 6. The tally, honestly

| | |
|---|---|
| Videos verified real by oEmbed | **12** |
| **Placed on a lesson** | **4** |
| Rejected **on length**, against the disk's own standard | **4** |
| Rejected **on level** | **1** |
| Rejected **on publisher** | **1** — WebMD |
| Durations read | 8 |
| Failed Black-educator searches, recorded | **2** |

**Two thirds of what I verified did not survive contact with the standards.** That is the process working rather than failing — every one of those rejections would otherwise have been a lesson Gigi had to catch on screen, which is how v3.4 and v3.40 both went.
