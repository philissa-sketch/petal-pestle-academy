# v3.40 — the writing programme, rebuilt because Gigi caught it

**Aug 17, 2026 · verified on her disk · 26 checks and four simulations green · 15 negative tests, all catching**

> *"The daily journal should have writing lesson. Sentence structures so she can properly write sentences and paragraphs. Also, for ex the journal was teaching about verbs that doesn't end in ed and asked her about a verb run with[out] telling her what the past tense is. That isn't a lesson that makes sense. You are creating a lesson plan for a child that is in second grade learning this wouldn't make sense to her. All lessons needs to be at the learning level."*

She was right three times over, and the disk proved each one.

---

## 1. What was wrong

### ⚠️ The lesson asked for what it never gave her

Verbatim from the old `writingProgramme.js`:

> **Verbs that break the rule** — "Some verbs do not add ed. **You have to know them.**"
> Example: go → went · see → saw · bring → brought
> **Try it: Say the past of run, write and grow.**

Three words she had never been shown, after a lesson whose entire teaching was *you have to know them*. **A quiz wearing a lesson's clothes.**

It was not alone. Lesson 4 showed *child → children* and *mouse → mice*, then asked for **foot, tooth and person**. Lesson 23 said outright that English does not tell you the rule for adjective order — and then asked her to use it.

### ⚠️ It was pitched years above her

Measured with the same formula the rest of the app uses: **40 of the 72 mini-lessons read above a 3.0 grade level. The worst hit 8.0.**

| Her Check-In, Aug 13 | |
|---|---|
| **Grammar & Usage** | **2.15** — her weakest strand bar the two that hit the floor |
| Writing Strategies | 2.45 |
| Reading Comprehension | 3.46 — **a listening score**; 10 of her 13 reading questions were read aloud |
| Khan has her on | **Parts of speech: the noun** |

Her own results doc had already set the rule: *"Every lesson gets written at her reading level, not her age."*

**Nothing had ever measured these.** `check-readability` guards Check-In items. `check-assessment` guards bank questions. **The mini-lesson prose fell in the gap between them** — the same gap sixty Science Lab questions fell into at v3.25.

### ⚠️ There was no order, so sentences never got built

Delivery picked by a **hash of the day key**. Possessive-plural apostrophes could land in week one and *"a noun names something"* in week thirty. Sentence work was three lines at the very end.

**A programme with no sequence is not a programme.**

---

## 2. What it is now

### Gigi's two calls

| Question | Her answer |
|---|---|
| Where to start, how far to climb | **Start at 2nd grade, climb to 3rd–4th across the year** |
| Where sentence structure sits | **Build it first, uninterrupted, then everything else** |

### Four stages, 72 lessons, in order

| Stage | Lessons | What it builds | Reading cap |
|---|---|---|---|
| **1 · Building a sentence** | **1–24** | what a whole thing is · the naming part · the doing part · both together · capitals, full stops, question marks · what is NOT a sentence yet · make it longer with where, when, how · join with and, but, because, so · the comma before the join · **then what a paragraph is, and when to start a new one** | **2.6** |
| **2 · Naming words and doing words** | 25–42 | nouns · plurals including the ones that change · verbs · now, before, later · **the irregular verbs taught as a list she is given** · agreement · is/are, was/were, has/have · helping words | 3.1 |
| **3 · Describing, and standing in** | 43–58 | adjectives · adverbs · comparing with er and est · more and most · pronouns · its and it's · place and time words · the apostrophe that owns · commas in a list · quotation marks | 3.6 |
| **4 · Making the writing good** | 59–72 | the exact word · say how many · compare it · show don't tell · start where something happens · read it out loud · cut the empty words · one idea to a paragraph · stop when you are done | 4.1 |

**The sentence work runs first and nothing is mixed into it.** The grammar comes after, once she has a sentence to put it in.

### Every lesson carries its answer

She reads it, says her answer out loud, then taps **"Say it out loud, then check"**. Nothing she says is collected, nothing is marked. **The Journal is still never graded and never corrected** — that is locked and a check reads the screen as text every run.

### The order is kept by her progress, not a date

Position is **the number of earlier days she has written in the journal**. Write three days a week and she moves three lessons. Miss a fortnight and she carries on where she stopped. Counted from days *strictly before today*, so saving an entry does not swap the lesson out from under her. After all 72 it starts again as review, and the screen says *second time round*.

**Still no date-to-quarter function anywhere in `src/`.** The app has refused a calendar since v3.31 and did not grow one here.

---

## 3. The rules that came out of it

Three new ones, all checks, all negative-tested.

### A lesson may only ask for what it gave her

Every lesson declares its task as **closed** (one right answer) or **open** (she makes her own). For a closed task, **every content word of the answer must appear in the lesson itself.** The old lesson 9 cannot come back: *ran, wrote, grew* fails unless the lesson shows ran, wrote and grew.

**And it cannot be dodged by going all-open.** Fewer than forty closed tasks fails the build — an escape hatch nothing checks is how a rule quietly stops meaning anything. **61 of the 72 are closed.**

### Every mini-lesson is measured at her level

Per stage, per field, with `·` `→` and `:` ending a unit the same way a full stop does — because **an example list is not one long sentence, and a ruler that says it is would force the prose to get worse.**

**One exemption, and it is the one the courses already use:** a long word is forgiven when the lesson teaches it by name. *Paragraph* and *apostrophe* are the content here exactly as *friction* and *refraction* are in The Science Lab. The **title** is where a lesson declares what it teaches — so title words are what is forgiven, and **titles are capped at seven words** so the exemption cannot be widened by writing a longer title.

### The sentence stage comes first and stays whole

Gigi chose it, so it is a check rather than a habit: the first stage is sentence work, all of it, nothing else mixed in, and paragraphs may not be taught before sentences are built.

---

## 4. Three things the checks caught in my own new work

**An optional argument that must always be passed is a rule nobody enforces.** `miniLessonFor(dayKey, journalDayKeys)` defaults her progress to an empty list — so a one-argument call hands her **lesson 1 for ever** while every other assertion stays green. The check now reads JournalView's source and counts the arguments **with a real parenthesis scan**, not a regex. Same shape as `check-curriculum-volume` reading TodayView; same reason the v3.31 regex was thrown out.

**A check tested a word on the screen instead of the thing rendered.** Deleting the rubric from her screen stayed green, because the panel's own sentence — *"Read the rubric first"* — still contained the word "rubric". Found by a negative test. The assertions are structural now.

**And nine of my own new lessons failed the new rules on their first run** — answers using a word the lesson never showed, titles over the cap. Every one was reworded. **None of the caps moved.**

---

## 5. What she should look at

**`writing-mini-lessons-v3.40.html`** — all 72 in order, printable, with the answer to each and a tag showing whether it has one right answer or is hers to make. It is also saved as an artifact so it can be opened again without finding this conversation.

**Restart the dev server.** The nav bar should read **3.40**.
