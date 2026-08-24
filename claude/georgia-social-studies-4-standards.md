# Georgia GSE — Fourth Grade Social Studies

**Transcribed from the Georgia Department of Education's published K-12 Social Studies standards, read from a `gadoe.org` address, Aug 17 2026.**
**On disk at `src/data/standards/georgiaSS4.js` since v3.32.** *United States History Year 2: Revolution to Reconstruction.*

**13 standards · 35 lettered elements · 37 ownable units.**

---

## ⚠️ Two files claimed this existed for nine versions

`curriculumPlan.js` said *"Already built against Georgia GSE Social Studies, verbatim — the standards work is done."* `georgiaScience4.js`'s header said the same treatment had *"already been given to Social Studies in georgiaSS4.js."*

**Neither was true.** `src/data/standards/` held one file, and `check-standards.mjs` imported `GA_SCIENCE_4` and nothing else — **which is why nothing ever tested either claim.** A subject no check reads can assert anything about itself.

Both notes are corrected, and `check-standards` reads both subjects now.

---

## Why 37 and not 35

**Two standards carry no lettered elements at all:** **SS4CG2** (First Amendment freedoms) and **SS4E2** (personal budget). They are single undivided requirements.

Owning only lettered elements would have left those two **owned by nobody, taught by nobody, and invisible to the check** — a gap of exactly the shape the file exists to prevent. So a letterless standard contributes **itself** as an ownable unit, flagged `wholeStandard: true`.

**35 lettered + 2 whole = 37 things that have to be taught.**

### Both earlier counts were wrong in part

| Claim | Source | Verdict |
|---|---|---|
| 13 standards, 37 elements | `curriculumPlan.js`, v3.22–v3.31 | **Half right.** 13 is correct; 37 is correct only under the whole-standard model — but it was asserted while no standards file existed. |
| 12 standards, 35 lettered | a county reproduction, read Aug 16 | **Wrong on standards.** 35 lettered is correct; the standard count is **13**. Recorded because it was nearly planned against. |

Both are printed by `check-standards` on every run rather than filed away.

---

## Historical Understandings — 6 standards, 19 elements

**SS4H1** — Explain the causes, events, and results of the American Revolution.

| | |
|---|---|
| **a** | Trace the events that shaped the revolutionary movement: French and Indian War, 1765 Stamp Act, "no taxation without representation," Sons of Liberty, Daughters of Liberty, Boston Massacre, Boston Tea Party. |
| **b** | Key individuals and groups: King George III, Washington, Franklin, Jefferson, Benedict Arnold, Patrick Henry, John Adams, Paul Revere, **and Black regiments**. |
| **c** | Major events and the factors leading to American victory and British defeat: Lexington and Concord, Saratoga, Yorktown. |
| **d** | The writing of the Declaration of Independence — who wrote it, how, why it was necessary, and how it answered tyranny and abuse of power. |

**SS4H2** — Analyze the challenges faced by the framers of the Constitution.

| | |
|---|---|
| **a** | Major leaders of the Constitutional Convention: Madison, Washington, Franklin. |
| **b** | The major issues debated: weaknesses of the Articles of Confederation, states' right to govern themselves, the Great Compromise, and slavery (Three-Fifths Compromise). |

**SS4H3** — Explain westward expansion in America.

| | |
|---|---|
| **a** | The War of 1812: the burning of the Capitol and the White House, and the writing of "The Star Spangled Banner." |
| **b** | The impact on American Indians: Trail of Tears, Battle of Little Bighorn, forced relocation to reservations. |
| **c** | Territorial expansion: Louisiana Purchase, Lewis and Clark, Texas (the Alamo and independence), Oregon (Oregon Trail), California (Gold Rush and mining towns). |

**SS4H4** — Examine the main ideas of the abolitionist and suffrage movements.

| | |
|---|---|
| **a** | Contributions and challenges of Susan B. Anthony, **Frederick Douglass**, Elizabeth Cady Stanton, **Sojourner Truth**, and **Harriet Tubman**. |

**SS4H5** — Explain the causes, major events, and consequences of the Civil War.

| | |
|---|---|
| **a** | *Uncle Tom's Cabin* and John Brown's raid on Harper's Ferry, and how each related to the war. |
| **b** | How states' rights and slavery increased tensions between North and South. |
| **c** | Major battles, campaigns and events: Fort Sumter, Gettysburg, **the Atlanta Campaign, Sherman's March to the Sea**, Appomattox Court House. |
| **d** | The roles of Lincoln, Robert E. Lee, Grant, Jefferson Davis, "Stonewall" Jackson, Sherman. |
| **e** | The effects of war on the North and South. |

**SS4H6** — Analyze the effects of Reconstruction on American life.

| | |
|---|---|
| **a** | The purpose of the 13th, 14th and 15th Amendments. |
| **b** | The work of the Freedmen's Bureau. |
| **c** | **How slavery was replaced by sharecropping, and how freed African Americans or Blacks were prevented from exercising their newly won rights.** |
| **d** | **The effects of Jim Crow laws and practices.** |

---

## Geographic Understandings — 2 standards, 4 elements

**SS4G1** — Locate important physical and man-made features in the United States.

| | |
|---|---|
| **a** | Atlantic Coastal Plain, Great Plains, Continental Divide, Gulf of Mexico, Mississippi River, Great Lakes. |
| **b** | New York City NY; Boston MA; Philadelphia PA; Washington D.C.; Gettysburg PA; the Erie Canal. |

**SS4G2** — Describe how physical systems affect human systems.

| | |
|---|---|
| **a** | How each force used the physical geography of Lexington and Concord, Saratoga and Yorktown to its benefit. |
| **b** | Physical barriers that hindered and gateways that benefited territorial expansion, 1801–1861. |

---

## Government/Civic Understandings — 3 standards, 6 elements

**SS4CG1** — Describe the meaning of:

| | |
|---|---|
| **a** | Natural rights as found in the Declaration of Independence (life, liberty, the pursuit of happiness). |
| **b** | "We the People" from the Preamble, as consent of the governed / popular sovereignty. |
| **c** | The federal system: federal powers, state powers, shared powers. |
| **d** | Representative democracy / republic. |

**SS4CG2** — Explain the importance of freedoms guaranteed by the First Amendment. **⚠️ No lettered elements.**

**SS4CG3** — Describe the structure of government and the Bill of Rights.

| | |
|---|---|
| **a** | How the three branches interact (checks and balances, separation of powers) and relate to local, state and federal government. |
| **b** | The rights in the Bill of Rights, how it limits government's powers, and why it was included in 1791. |

---

## Economic Understandings — 2 standards, 6 elements

**SS4E1** — Use trade, opportunity cost, specialization, voluntary exchange, productivity and price incentives to illustrate historical events.

| | |
|---|---|
| **a** | Opportunity cost and decision-making across time (e.g. deciding to settle in the west). |
| **b** | How price incentives affect behaviour: what crops to grow, what products to produce. |
| **c** | How specialization improves standards of living (North vs South economies). |
| **d** | How voluntary exchange helps buyers and sellers (Gold Rush mining towns). |
| **e** | How trade promotes economic activity (U.S. and Europe). |
| **f** | Technological advances and business productivity: cotton gin, steamboat, steam locomotive, telegraph. |

**SS4E2** — Identify the elements of a personal budget (income, expenditures, saving) and explain why personal spending and saving decisions matter. **⚠️ No lettered elements.**

**⚠️ SS4E2 needs Gigi's call** and it is recorded in the file, not remembered. Her own list of what Social Studies should cover named trade, opportunity cost and supply and demand — all SS4E1 — and did not name a personal budget. **If she drops it, it becomes a declared omission with her reason attached, never a silent deletion.**

---

## The crosswalk — 37 units across three quarters

Written **before a single lesson**, on purpose. Science learned this the hard way.

| Quarter | Units | Lessons | What it holds |
|---|---|---|---|
| **Q1** | **14** | 16 | Revolution, the Constitution, **and all of civics** — the government she is learning about is the one those two events produced. Civics taught anywhere else is trivia. |
| **Q2** | **13** | 16 | Westward expansion, the map of the country, and **every economic concept**, each attached to the historical event Georgia attaches it to. |
| **Q3** | **10** | 16 | Abolition, the Civil War, Reconstruction. **The lightest quarter on purpose** — SS4H4, SS4H6c and SS4H6d are where the Black-American-educator requirement is not a nice-to-have, and six spare lessons is what teaching them properly rather than listing them costs. |

Every unit carries a **vehicle** — one sentence saying how it actually gets taught. `check-standards` fails on an element assigned with no vehicle: *an element assigned with no vehicle is an intention, not a plan.*

---

## What the check now proves

- Every one of the 37 units is **owned by exactly one course**, in a quarter that course actually runs.
- **A course cannot be answerable for a subject it does not teach** — tested against the course's declared `kind`, which is an independent fact.
- **A code cannot belong to two subjects.**
- Science and Social Studies are **reported separately** — 25 of 25 and 0 of 37 — because one number across both would let a finished subject carry an unstarted one.
- The **self-guard from v3.27** still holds: if the check cannot see a course's lessons, it fails rather than printing a confident and wrong "still owed" list.

**Nine negative tests, all nine catching** — after one was rewritten, because its first version compared a value to itself and did nothing.

---

## What is still owed here

1. **Blueprint 48 lessons against these 37 units** — 16 per quarter, videos found and verified **before any prose**.
2. **Black American educators, actively sought, every failed search written down.** This subject is not the field The Science Lab searched; the standards name Black regiments, Douglass, Truth, Tubman, sharecropping and Jim Crow directly. **A search that comes up empty on these is a search that was not run properly.**
3. **Gigi's call on SS4E2.**
