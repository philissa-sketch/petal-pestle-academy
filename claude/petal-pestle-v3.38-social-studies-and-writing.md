# v3.32 – v3.38 — Social Studies, end to end. And the writing programme.

**Aug 17, 2026 · verified on Gigi's disk · 26 checks green, plus four simulations**

This is the record for seven versions. The master plan is the plan; this is what happened.

> **Note on a document that did not exist.** Both the master plan and the build log referenced `claude/petal-pestle-v3.31-social-studies-shape.md`. **It was never written.** The v3.31 record is inside the build log's own version history and inside this file's §1. The dangling reference is corrected in the same version this file lands — the same fault as a count that drifts, and it gets the same treatment: fix it where it is written, do not leave it standing.

---

## 1. What shipped

| v | What |
|---|---|
| **3.32** | **Georgia's 4th-grade Social Studies standards, transcribed from the GaDOE document.** They did not exist on disk, and two files had claimed for nine versions that they did. |
| **3.33** | `check-standards` reads **both subjects**. `DECLARED_OMISSIONS` — a dropped element must be declared by a person, with a date and a reason, and a declaration that goes stale fails the build. |
| **3.34** | **Module 1, The Road to Revolution** — and the engine bug it exposed: the weekly test was built from a global size, so a two-lesson course would have handed her an eight-question paper. |
| **3.35–3.36** | Modules 2–8. |
| **3.37** | Modules 9–12. **Social Studies complete: 48 lessons, 480 questions, 48 verified videos, 36 of 36 Georgia units it owns.** |
| **3.38** | **The writing and grammar programme, in the Journal she already opens.** |

**Where the app stands now, counted from the code rather than remembered:**

| | |
|---|---|
| Lessons | **192 of 256** — 36 modules |
| Bank questions | **1,855** |
| Verified videos | **192** |
| Weeks she can sit a test in | **72** — 32 Herbalism, 16 Science Lab, 24 Social Studies |
| Georgia units taught | **61 of 61** — 25 science, 36 social studies |
| Courses marked complete, and the claim tested | **3** |
| Automated checks | **26** |
| Still owed | **The Human Body, 64 lessons.** Enrichment. No Georgia element. |

---

## 2. The standards did not exist, and the file said they did

`curriculumPlan.js` had carried this line since v3.22:

> *"Already built against Georgia GSE Social Studies, verbatim — 13 standards, 37 elements. The standards work is done."*

`src/data/standards/` held exactly one file, `georgiaScience4.js`. `check-standards.mjs` only ever imported `GA_SCIENCE_4`. **Nothing tested the claim, so the claim survived nine versions.**

The standards were read from GaDOE's own published document and transcribed into `src/data/standards/georgiaSS4.js`.

### The count, settled from the primary source

| Claim | Where it came from | Verdict |
|---|---|---|
| 13 standards, 37 elements | `curriculumPlan.js`'s own note | **Half right.** 13 standards is correct. 37 is right only if you count the two standards that carry no lettered elements as units in their own right. |
| 12 standards, 35 lettered elements | a county reproduction of the GSE document | **Wrong on the standards.** 35 lettered elements is correct. |

**Both rejected counts are written into the file with their source and the verdict**, so the next person does not re-litigate it from a secondary source.

**SS4CG2 and SS4E2 carry no lettered elements.** They contribute themselves as whole-standard units — otherwise they cannot be owned by a lesson and cannot be checked, and an element nothing can own is an element nothing teaches.

**35 lettered + 2 whole-standard = 37 ownable units. 36 of them are taught.**

### SS4E2 — Gigi's call, recorded

> *"It's out. I'll teach her about money in the 5th grade."*

Personal budgeting — income, expenditures, saving. **Not required by Georgia's home study law.** It is declared in `DECLARED_OMISSIONS` in `curriculumPlan.js` with her name and the date, and `check-standards` prints it on every run.

**A declaration is not a hiding place.** An element that is declared dropped **and** owned by a course is two people disagreeing in writing, and the build fails on it. Dropping a science element the old quiet way now fails too.

---

## 3. The twelve modules

| Module | Weeks | Georgia | What it teaches |
|---|---|---|---|
| **1 · The Road to Revolution** | Q1 1–2 | SS4H1a ×2, SS4H1b, SS4H1c | The war that came with a bill · the people who refused · who was on which side · the morning the shooting started |
| **2 · The Revolution Itself** | Q1 3–4 | SS4H1c·d, SS4G2a | Declaration · the winters · the turning points · the map that decided battles |
| **3 · Building a Government** | Q1 5–6 | SS4H2a·b, SS4CG1a·b | Why the first attempt failed · the Constitution · natural rights · consent of the governed |
| **4 · The Bill of Rights and the Branches** | Q1 7–8 | SS4CG2, SS4CG3a·b | Three branches · what the First Amendment actually says · rights and responsibilities |
| **5 · Moving West** | Q2 1–2 | SS4H3a·b, SS4G1a | Louisiana Purchase · Lewis and Clark · the physical features that shaped the route |
| **6 · Removal** | Q2 3–4 | SS4H3c, SS4G1b | The Trail of Tears — **which began in this state** · Sequoyah · what the law said and what happened |
| **7 · A Country Splitting** | Q2 5–6 | SS4H4a, SS4H5a | Two economies · the compromises that held and then did not |
| **8 · Machines, Money and Work** | Q2 7–8 | SS4E1a–f, SS4G2b | Scarcity · opportunity cost · price · the telegraph and the cotton gin |
| **9 · Abolition and Suffrage** | Q3 1–2 | **SS4H4a ×3** | **Douglass has his own lesson.** Tubman and Truth share one. Anthony and Stanton share one — **including the moment the two movements split** |
| **10 · The Civil War** | Q3 3–4 | SS4H5a·b·c | Fort Sumter · Gettysburg · the Atlanta Campaign and Sherman's march — **through here** · Appomattox |
| **11 · Reconstruction** | Q3 5–6 | SS4H6a·b, **SS4H6c ×2** | The three amendments · Freedmen's Bureau · **a year of sharecropping worked through on paper until the number goes below zero** |
| **12 · Jim Crow, and Living Memory** | Q3 7–8 | **SS4H6d ×2**, SS4H6a | Poll tax, literacy test, grandfather clause — **three rules that took the vote without ever mentioning race** · and **Lesson 48 is a conversation with an older person** |

### Three decisions worth keeping

**SS4H4a got three lessons instead of one.** Georgia names five people in a single line. One lesson makes them a list to recite.

**SS4H6c and SS4H6d got two each.** Sharecropping and disenfranchisement are different machines and are taught as such — one is arithmetic that comes out negative, the other is three rules taken apart one at a time.

**The last lesson of forty-eight sends her to talk to somebody.** Jim Crow ended inside living memory. Lesson 48 is a conversation with an older person, arranged by a grown-up, asking what school was like when they were nine. **The final ledger entry in the whole course is a sentence she collected herself.**

---

## 4. The videos — 48, and 39 searches written down

**Every one verified at `https://www.youtube.com/oembed?...&format=json`, title recorded character for character.** noembed.com is not used and will not be — at v3.9 it "verified" a deliberately fake id.

### ⭐ The standing requirement was finally answered, after two courses of failing it

0 of 48 on The Science Lab. 0 of 16 in Social Studies Q1. **Quarter 3 found four:**

| Lesson | Channel | Confidence |
|---|---|---|
| Frederick Douglass | **Seed of Melanin Kids!** | **likely, not confirmed** |
| Harriet Tubman | **The Magic In Me TV — Black History Series For Kids** | **likely, not confirmed** |
| Literacy tests and the vote | **Black History Files** | **likely, not confirmed** |
| Jim Crow | **The Blk History Channel** | **likely, not confirmed** |

**Channel identity is judged from name and presentation only. Unknown is recorded as unknown, never as a gap closed.** These four are recorded as *likely*, and the word *likely* is in the files.

**Georgia Public Broadcasting teaches five of the lessons**, including its own *Tragedy in Georgia* on Cherokee removal from this state.

### The advocacy exclusion, and what it cost

**PragerU and PragerU Kids appeared in at least nine searches. Learn Liberty and the Foundation for Economic Education appeared in the economics searches. None was used** — they are advocacy organisations, not neutral educational publishers, and a nine-year-old cannot see the difference.

**It cost two lessons their own video** — SS4E1c specialization and SS4E1d voluntary exchange returned nothing usable at elementary level that was not from one of those three. Under the v3.24 rule that is a re-cut, so both folded into the trade lesson.

**⚠️ The exclusion is written into each lesson file with a verified alternate beside it, in case Gigi disagrees.** It is her app.

**⚠️ Needs her call:** `Lh8wC-qoqgw`, the 3/5 Compromise video in Lesson 10. 5:13, and squarely about slavery. **She should watch it before it plays.**

---

## 5. The bugs

### ⚠️ The engine handed a nine-year-old the wrong paper

`buildWeeklyTest` used the **global** 8-question size for every course. Social Studies declares **5**, because it teaches two lessons a week.

So the moment Social Studies had a finished week, the engine would have built an **eight-question test drawn from two lessons** — the exact thing `check-curriculum-volume` forbids, one file away.

**Both numbers had been per-course since v3.22. Nothing propagated them into the engine.**

> **A rule enforced on the number in the config, and not on the paper the child is handed, is half a rule.**

### And its negative test missed, which found a second hole

Removing the clamp that keeps earlier-week questions to a quarter of the paper left the paper **five questions long** — so the length assertion stayed green while the **mix** went from 1 old question to 2. The check now asserts both: earlier-week questions are **at most a quarter of the paper and at least one**.

### Four checks were carrying a global assumption that only broke once a two-day course existed

| Check | What it assumed | What it does now |
|---|---|---|
| `check-assessment` | one week shape, one test size | reads `lessonDaysPerWeek` and `weeklyTestQuestions` **per course** |
| `check-assessment` | one vocabulary list for the reading exemption | **derives the exemption per course** |
| `check-curriculum-volume` | `WRITTEN.social` was a **literal 0** | reads the course's own lessons |
| `check-standards` | an owner's subject was stamped by which array it came from | compares the **owning course's declared `kind`** |

**The third of those was right for the wrong reason.** A literal 0 fails the build when nothing is written — and keeps failing it after 48 lessons land. **A number that happens to be correct today is not a measurement.**

### The reading exemption was one course wide

The derived long-word exemption was built from The Science Lab's vocabulary and handed out on the `sl-` prefix, so Social Studies got no credit for *liberty* or *loyalist*. **Now derived per course. The rule did not move.**

### `simulate-year` could not reach Social Studies week 1 in 170 days

One test a day, offered in week order, meant a **re-take of week 3 beat the first sitting of week 33**. Never-sat units now go before re-takes — and the run was **extended from 170 days to 260** rather than lowering the 2.0-retrieval bar. **The simulation moved; the standard did not.**

### About twenty prompts over the reading cap

*Benedict, remembered, Madison, governments, newspaper, president, colonist, Oregon, California, Sequoyah, Cherokee, Gettysburg, Appalachian, Cumberland, travelling* — **all reworded. None exempted.** Proper nouns moved into the choices, which are not measured.

**One word earned the exemption: `telegraph`**, added to Module 8's glossary because Georgia's SS4E1f names it — the same allowance as *friction* and *refraction*.

### Bank answer spreads drifted repeatedly

3/3/4/0 · 2/5/0/3 · 2/4/1/3 · 10/12/8/10. Every one rebalanced by **reordering the choices so `null` stayed on the answer**, never by changing which answer is right. All twelve modules are **10/10/10/10**.

---

## 6. v3.38 — the writing and grammar programme

> *"She needs help with grammar and writing and I wanted her journals to assist with that. Can we have a course for that added?"*

**It is not a course. It is five minutes at the top of the Journal she already opens** — because a course is a fifth block in an afternoon that has none free, and the Journal is the one place she already writes every day.

### What it is

| | |
|---|---|
| **36 grammar points** | tracking **Khan units 1–7**, so the app and Khan are teaching the same thing in the same order |
| **36 writing moves** | openings, evidence, transitions, endings, cutting words |
| **How they alternate** | by day key — grammar one day, a writing move the next |
| **72 in all** | so nothing repeats inside a school year |
| **Graded?** | **No. Never.** |

### The Journal stays ungraded. That was the condition.

The mini-lesson has **no box to type in, no score, no submit.** She reads it, then she writes what she was going to write.

**`check-writing` reads the screen as text on every run** and fails the build if `<input`, `<textarea`, `onChange`, `score`, `grade`, `correct` or `mark=` ever appears inside that block.

### The graded writing is separate, and she sees the rubric first

| Piece | Per year | Quarters |
|---|---|---|
| **Book report** | 4 | 1, 2, 3, 4 |
| **Research paper** | **2** | 2, 4 |

Both on **Lamar's +/− ladder**. **Read-aloud is allowed on both.**

**The research paper is taught as a five-step sequence, never handed over whole:** choose a question (not a topic) → find two sources and write down where each came from → take notes with the book closed → write it → read it out loud and check every fact.

**Step 3 is the one that matters.** Taking notes with the book closed is what stops copying happening two steps later.

**Still owed:** the pieces are scoped in `writingPieces.js` and are **not yet on a screen**. Wiring them into the Gradebook and the projects area is the next job in this thread.

### ⚠️ Half the mini-lessons could never have come up

The **kind** (grammar or writing) and the **index** into the list were both derived from the same number — and both lists are 36 long, so the parity that chose the kind also fixed which half of the list was reachable. **Thirty-six of the seventy-two were dead for ever**, and nothing on any screen would have looked wrong.

Caught by check #26's first negative test, before she ever saw it.

### ⚠️ And a negative test got through

The mutation *"rip the mini-lesson out of the Journal"* was **not caught**. The check located the block by searching for a comment marker, and `indexOf` matches a **superstring** — renaming the marker to `THE FIVE-MINUTE MINI-LESSON-REMOVED-MARKER` walked straight past it.

**The check was rebuilt rather than the test reworded.** Two fixes, both needed:

1. the marker must be a **whole token** — nothing word-ish or dash-ish may follow it;
2. the mini-lesson must be proved **delivered with no reference to any comment at all** — imported, called, and every field rendered.

**Ten negative tests now, all ten catching.**

> **A check that locates the thing it guards by a comment is guarding the comment.**

---

## 7. What still needs Gigi

1. **`Lh8wC-qoqgw`** — the 3/5 Compromise video in Lesson 10. **Watch it before it plays.**
2. **The advocacy exclusion** — PragerU / Learn Liberty / FEE. It cost two lessons their own video. Alternates are in the files.
3. **A Black-scientists module for The Science Lab** — two real finds that fit no lesson there.
4. **The Ubongo / Super Sema question** — Science Lab Lesson 23.
5. **Azianna's laptop is still on v2.8.**

---

## 8. Next

- **Wire book reports and research papers onto a screen** — Gradebook and the projects area.
- **The Human Body, 64 lessons.** The only course left. **Confirm before starting** — it carries no Georgia element and was scoped out on purpose.
- The Khan grades screen · the Annual Progress Report / generated `STATUS.md` · weekly spelling and vocabulary · Gradebook tabs per course by quarter.
