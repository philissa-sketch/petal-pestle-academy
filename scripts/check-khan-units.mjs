// ---------------------------------------------------------------------------
// Run with: node scripts/check-khan-units.mjs
//
// CHECK #23 — the Khan unit links, and the four bugs that were live in the app
// on the morning of Aug 16 2026 with all twenty-two other checks passing.
//
// ---- WHAT WENT WRONG, AND WHY NOTHING SAW IT ----
//
// 1. A DEAD COURSE URL. khanMap.js sent 2nd Grade Math to
//    /math/cc-second-grade-math. Rendered in a browser it says "Oops! Page not
//    found". Her Geometry and Measurement both measured at the floor of 2nd
//    grade, so that was the course her plan opened most, and it opened an error.
//
// 2. UNIT NAMES FOR UNITS THAT DO NOT EXIST. Seven of them. The 3rd grade
//    reading units were called "Reading informational text" and "Vocabulary";
//    Khan's real units are Pets, Homes and Extreme Environments. 2nd grade
//    maths had "Equal parts of circles and rectangles", which is not a 2nd
//    grade unit at all. The LINK still resolved, so the wrong LABEL was
//    invisible — the screen said one thing and Khan said another.
//
// 3. THE SCHEDULE OPENED A COURSE INDEX. resolveBlockTarget handed back
//    courseUrl, so tapping Mathematics landed her on a page of eight units to
//    read and search. v2.0 took six steps out of starting a maths block and
//    left this one in.
//
// ---- WHAT THIS FILE CAN AND CANNOT TEST, STATED PLAINLY ----
//
// It CANNOT tell you a Khan URL is alive. Three reasons, all verified:
//   * Khan answers HTTP 200 for the dead URL and draws "Page not found"
//     afterwards in JavaScript.
//   * The served HTML <title> of a dead course is byte-identical to a live one.
//   * Khan's public API is gone — /api/v1/topic/<slug> returns "410 API
//     removed". There is no endpoint left to ask.
// Only a rendering browser knows. So re-confirming a link is a browser job, and
// `confirmedOn` records when it was last done.
//
// What it DOES test is shape, provenance and agreement — every one of which
// would have caught one of the three bugs above:
//   1. every course carries a confirmedOn date, and it is a real date
//   2. units are numbered 1..n, no gaps, no duplicates, no empty slug
//   3. a unit URL is NEVER equal to its own course front page  <- bug 3
//   4. every unitCourse/unitN in khanMap resolves to a real unit  <- bug 1
//   5. every unit NAME in khanMap matches the confirmed name     <- bug 2
//   6. the three Khan blocks on her real measured levels open an EXACT unit
//   7. no two units in a course share a slug
//
// A check must never claim more than it tests. This one prints its own blind
// spot on every run rather than leaving the reader to assume coverage.
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const U = await import(pathToFileURL(resolve(ROOT, 'src/data/khan/khanUnits.js')).href);
const { KHAN_MAP, KHAN_COURSES } = await import(pathToFileURL(resolve(ROOT, 'src/data/khan/khanMap.js')).href);
const { resolveBlockTarget } = await import(pathToFileURL(resolve(ROOT, 'src/lib/blockLinks.js')).href);
// v3.74 — §6c below records results through the app's own writer instead of
// inventing grade objects. See the note there; it matters more than it looks.
const { khanGradeRow } = await import(pathToFileURL(resolve(ROOT, 'src/lib/khanGrade.js')).href);

const errors = [];
const notes = [];

// ---- 1. provenance -------------------------------------------------------
for (const id of U.KHAN_UNIT_COURSE_IDS) {
  const c = U.KHAN_UNIT_COURSES[id];
  if (!/^\/[a-z0-9\-/]+$/i.test(c.base || '')) {
    errors.push(`${id}: base "${c.base}" is not a plain path`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.confirmedOn || '')) {
    errors.push(`${id}: confirmedOn "${c.confirmedOn}" is not a YYYY-MM-DD date — an unconfirmed link is a guess`);
  } else if (Number.isNaN(Date.parse(c.confirmedOn))) {
    errors.push(`${id}: confirmedOn "${c.confirmedOn}" is not a real date`);
  }
  // renderedOn is a SEPARATE claim from confirmedOn and is required too: the
  // slug was read off a list, but the address this file BUILDS was opened in a
  // browser and came back with the right heading. A correct slug on a stale
  // base still gives a dead link, which is exactly how cc-second-grade-math
  // survived for months.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.renderedOn || '')) {
    errors.push(`${id}: renderedOn "${c.renderedOn}" is not a YYYY-MM-DD date — nobody has opened these addresses in a browser`);
  } else if (Date.parse(c.renderedOn) < Date.parse(c.confirmedOn)) {
    errors.push(`${id}: renderedOn (${c.renderedOn}) is older than confirmedOn (${c.confirmedOn}) — the units changed after anyone last opened them`);
  }
  if (!c.units || c.units.length === 0) errors.push(`${id}: no units`);
}

// ---- 2. numbering and slugs ----------------------------------------------
for (const id of U.KHAN_UNIT_COURSE_IDS) {
  const c = U.KHAN_UNIT_COURSES[id];
  const seen = new Set();
  c.units.forEach((u, i) => {
    if (u.n !== i + 1) errors.push(`${id}: unit at position ${i + 1} is numbered ${u.n} — units must run 1..n in order`);
    if (!u.slug || !u.slug.trim()) errors.push(`${id}: unit ${u.n} has no slug`);
    if (!u.name || !u.name.trim()) errors.push(`${id}: unit ${u.n} has no name`);
    if (seen.has(u.slug)) errors.push(`${id}: two units share the slug "${u.slug}"`);
    seen.add(u.slug);
    if (u.slug && u.slug.startsWith('/')) errors.push(`${id}: unit ${u.n} slug starts with a slash — it is joined to the base, not used whole`);
  });
}

// ---- 3. A UNIT LINK IS NEVER THE COURSE FRONT PAGE ------------------------
// This is the assertion for Gigi's own words: "Links to the course front page"
// listed as the first thing wrong with v3.19.
for (const id of U.KHAN_UNIT_COURSE_IDS) {
  const front = U.courseUrl(id);
  for (const u of U.KHAN_UNIT_COURSES[id].units) {
    const link = U.unitUrl(id, u.n);
    if (!link) { errors.push(`${id}: unit ${u.n} resolves to no URL`); continue; }
    if (link === front) {
      errors.push(`${id}: unit ${u.n} "${u.name}" resolves to the COURSE FRONT PAGE — she has to find her own unit on a page of ${U.KHAN_UNIT_COURSES[id].units.length}`);
    }
    if (!link.startsWith('https://www.khanacademy.org/')) {
      errors.push(`${id}: unit ${u.n} does not resolve to a khanacademy.org address`);
    }
  }
}

// ---- 3b. NO URL KNOWN TO BE DEAD MAY COME BACK ----------------------------
//
// Four addresses were rendered on Aug 16 2026 and every one returned "Page not
// found". Three of them were live in the app at the time with 23 checks
// passing, and two were found by Gigi using it rather than by anything here.
// Writing them down is only useful if something reads the list.
{
  const dead = new Map(U.KHAN_URLS_CONFIRMED_DEAD.map((d) => [d.url, d]));
  for (const [id, c] of Object.entries(KHAN_COURSES)) {
    const d = dead.get(c.url);
    if (d) {
      errors.push(
        `KHAN_COURSES.${id} points at ${c.url}, which was opened on ${d.renderedOn} and returned "${d.saw}"` +
          (d.instead ? ` — the live address is ${d.instead}` : ' — Khan has no replacement')
      );
    }
  }
  for (const id of U.KHAN_UNIT_COURSE_IDS) {
    const base = 'https://www.khanacademy.org' + U.KHAN_UNIT_COURSES[id].base;
    if (dead.has(base)) errors.push(`khanUnits.${id} is built on ${base}, which is a dead page`);
  }
  notes.push(`${dead.size} addresses on the confirmed-dead list, none of them in use`);
}

// ---- 4 & 5. khanMap agrees with the confirmed units ----------------------
let bound = 0;
for (const [strandId, bands] of Object.entries(KHAN_MAP)) {
  for (const band of bands) {
    if (!band.unitCourse && !band.unitN) continue;
    if (!band.unitCourse || !band.unitN) {
      errors.push(`${strandId}: band "${band.unit}" has only half a unit reference — unitCourse and unitN travel together`);
      continue;
    }
    const rec = U.unitFor(band.unitCourse, band.unitN);
    if (!rec) {
      errors.push(`${strandId}: band "${band.unit}" points at ${band.unitCourse} unit ${band.unitN}, which is not in khanUnits.js`);
      continue;
    }
    if (rec.name !== band.unit) {
      errors.push(`${strandId}: the map calls ${band.unitCourse} unit ${band.unitN} "${band.unit}" — Khan calls it "${rec.name}". A wrong label is invisible while the link still works.`);
    }
    const mapCourse = KHAN_COURSES[band.course];
    const unitCourse = U.KHAN_UNIT_COURSES[band.unitCourse];
    if (mapCourse && unitCourse && !mapCourse.url.endsWith(unitCourse.base)) {
      errors.push(`${strandId}: band sits in course "${band.course}" (${mapCourse.url}) but links a unit of "${band.unitCourse}" (${unitCourse.base}) — a level would send her to one course and one unit of another`);
    }
    bound++;
  }
}

// ---- 6. her real day opens a real unit ------------------------------------
// Her Check-In results, as recorded. Not a level someone happened to try.
const HER_STRANDS = {
  geometry: { asked: 7, level: 2.0 },
  'measurement-data': { asked: 6, level: 2.0 },
  'numbers-operations': { asked: 8, level: 3.48 },
  'fractions-decimals': { asked: 7, level: 3.89 },
  'patterns-algebra': { asked: 6, level: 2.98 },
  'reading-comprehension': { asked: 7, level: 3.46 },
  vocabulary: { asked: 6, level: 2.91 },
  'grammar-usage': { asked: 7, level: 2.15 },
  'writing-strategies': { asked: 6, level: 2.45 }
};
const frontPages = Object.values(KHAN_COURSES).map((c) => c.url);
for (const subject of ['math', 'reading', 'writing']) {
  const t = resolveBlockTarget({ subject }, HER_STRANDS, []);
  if (!t) { errors.push(`the ${subject} block resolves to nothing at her measured levels`); continue; }
  if (!t.exact) {
    errors.push(`the ${subject} block opens a course front page at her measured levels, not her unit — this is the v3.19 complaint, back again`);
  }
  if (frontPages.includes(t.url)) {
    errors.push(`the ${subject} block opens ${t.url}, which is a course front page`);
  }

  // ---- 6b. SHE STARTS AT THE FIRST UNIT OF HER LANE ----
  //
  // ⚠️ INVERTED AT v3.81, NOT DELETED. Gigi overturned her own rule, in one
  // letter: "B", Aug 25 2026.
  //
  // ---- WHAT THIS USED TO ASSERT, AND WHY ----
  //
  // Gigi, Aug 16 2026, from using it: "Math just skips to unit 6 instead of
  // starting at unit 1." It did — her lowest strand chose the unit as well as
  // the course, so Measurement 2.00 opened Unit 6 and Units 1-5 were never
  // reachable. From v3.20 to v3.80 this line read `if (t.unitN !== 1)`.
  //
  // THIS CHECK WAS THE FIRST SUSPECT THEN AND IT WAS GUILTY: the version before
  // it asserted the block opens "an exact unit" and never once asked WHICH. It
  // passed, green, while the app skipped five units.
  //
  // ---- WHY IT TURNED OVER ----
  //
  // Starting every strand at Unit 1 had a cost nobody had priced. Her three
  // maths strands all route to 2nd Grade Math, and with no grades recorded all
  // three were handed Unit 1 — "Add and subtract within 20", which teaches
  // NUMBERS & OPERATIONS, her 3.48 strand. Measurement & Data 2.50 is Unit 6
  // and Geometry 2.82 is Unit 8. The rule was spending her two weakest strands'
  // half hour on her strongest one, and would have gone on doing it for months.
  //
  // ---- AND THE OLD HARM IS STILL FORBIDDEN ----
  //
  // v3.20's complaint was SKIPPING: units passed over, never done, the Course
  // Challenge unreachable for ever. That cannot happen here and it is asserted
  // in check-strand-lanes, not merely described: every unit belongs to exactly
  // one lane, each lane starts at its own first unit and runs in order, and the
  // Course Challenge still asks the WHOLE course.
  //
  // So Unit 5 is not a skip. It is the first Measurement unit there is.
  //
  // THE WAY BACK, written down the way v3.68 wrote check-writing's: delete the
  // STRAND_LANES entry for the course and this assertion returns to Unit 1 on
  // its own, because every strand falls back to the whole course in order.
  const lane = U.laneFor(t.courseId, t.strandId);
  const expected = lane ? Math.min(...lane.units) : 1;
  if (t.unitN !== expected) {
    errors.push(
      `with nothing graded, the ${subject} block opens Unit ${t.unitN} ("${t.label}") — it must start at ` +
        `Unit ${expected}, the first unit of ${lane ? `her ${t.strandId} lane` : 'the course'}. ` +
        `Starting anywhere else means the units before it are never done and the Course Challenge can never unlock.`
    );
  }
}

// ---- 6c. it advances one unit at a time, and ends at the Course Challenge --
//
// ⚠️ THIS SECTION WAS GUILTY, AND IT IS THE SECOND TIME IN THIS FILE.
//
// Until v3.74 the line below read `grades.push({ courseId: 'math2', unitN: i })`
// — a grade object built BY THE CHECK, in a shape the app had never once
// produced. `addKhanGrade` stored no courseId and no unitN, so every grade Gigi
// could actually enter was invisible to `nextUnitFor`. This walked Unit 1 to 8
// and printed "advance one unit per grade" while the app advanced nobody.
//
// Read §6b immediately above: the same file confessing to the same mistake one
// section higher. Testing the shape of an answer instead of the answer.
//
// It now uses the app's own writer, so a check row and a saved row cannot be
// different things. The end-to-end assertion lives in check-khan-advance;
// this stays because what it tests here is the BLOCK — resolveBlockTarget at
// her real measured levels — which that check does not touch.
// ⚠️ v3.81 — AND THE ORDER IT WALKS IS HER LANE'S ORDER, NOT 1 TO 8.
//
// This loop used to expect exactly Unit 1, 2, 3 … 8. With lanes, her lowest
// maths strand walks its own units first and then the block moves on to the
// rest of the course in order — so the sequence for Measurement & Data is
// 5, 6, 7, then 1, 2, 3, 4, 8.
//
// It still asserts the two things that matter and always did: EVERY unit is
// reached exactly once, and the Course Challenge arrives at the end and not
// before. Those are what v3.20 was really about. Expecting the literal
// sequence 1..8 was expecting the implementation, not the rule.
{
  const grades = [];
  const seen = [];
  const total = U.KHAN_UNIT_COURSES.math2.units.length;
  for (let i = 1; i <= total; i++) {
    const t = resolveBlockTarget({ subject: 'math' }, HER_STRANDS, grades);
    if (!t || !t.unitN) {
      errors.push(`after ${i - 1} unit(s) graded the maths block offers no unit, with ${total - i + 1} still ungraded`);
      break;
    }
    if (seen.includes(t.unitN)) {
      errors.push(`the maths block offered Unit ${t.unitN} twice — a graded unit must never come round again`);
      break;
    }
    seen.push(t.unitN);
    // ⚠️ GRADE THE UNIT THE BLOCK ACTUALLY OFFERED, not the loop counter.
    // Until v3.81 this read `unitN: i`, which was the same thing only while the
    // block walked 1..8. With lanes it is not, and grading unit `i` while the
    // block sits on unit 5 would file a result against a unit she never opened
    // — the exact harm khanGrade.js refuses free-text rows to prevent, arriving
    // inside the check that guards it.
    const built = khanGradeRow({ courseId: 'math2', unitN: t.unitN, grade: 'B' });
    if (!built.ok) {
      errors.push(`the app cannot even record a result for maths Unit ${t.unitN}: ${built.reason}`);
      break;
    }
    grades.push(built.row);
  }
  const done = resolveBlockTarget({ subject: 'math' }, HER_STRANDS, grades);
  if (!done || !done.challenge) {
    errors.push(`with all ${total} maths units graded the block offers "${done && done.label}" — it should offer the Course Challenge`);
  }
  // EVERY unit reached exactly once, in whatever order her lane produces.
  const everyUnit = [...Array(total)].map((_, i) => i + 1);
  const missed = everyUnit.filter((n) => !seen.includes(n));
  if (missed.length) {
    errors.push(
      `the maths block never offered Unit(s) ${missed.join(', ')} — a unit nothing reaches is a unit ` +
        `she can never be graded on, and the Course Challenge would never unlock. This is the v3.20 ` +
        `harm arriving by omission instead of by skipping.`
    );
  } else {
    notes.push(`the maths block reaches all ${total} units exactly once — order ${seen.join(', ')} — then the Course Challenge`);
  }
}

// ---- 6d. every screen that resolves a block must hand it her grades --------
//
// A caller that forgets the third argument gets `grades = []` and therefore
// offers Unit 1 forever, which looks exactly like a child who has done nothing.
// Rule 11: a rule the app must follow lives where a check can test it — so this
// reads the call sites as text, the same way check-links reads navigate calls.
{
  const srcDir = resolve(ROOT, 'src');
  const walk = (d) =>
    readdirSync(d).flatMap((f) => {
      const p = `${d}/${f}`;
      return statSync(p).isDirectory() ? walk(p) : p.endsWith('.jsx') || p.endsWith('.js') ? [p] : [];
    });
  for (const f of walk(srcDir)) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/resolveBlockTarget\(([^)]*)\)/g)) {
      const args = m[1].split(',').length;
      if (args < 3) {
        errors.push(
          `${f.split('/src/')[1]} calls resolveBlockTarget with ${args} argument(s) — without her grades it offers Unit 1 forever`
        );
      }
    }
  }
}

// ---- 8. A COURSE CARRIES ALL OF ITSELF, NOT THE PART SOMEBODY GOT TO -------
//
// ⚠️ THE ASSERTION THIS FILE WAS MISSING, AND IT WAS MISSING FOR THIRTEEN DAYS.
//
// §2 above asserts units run 1..n with no gaps. Grammar held units 1 and 2 of
// Khan's TEN. One and two have no gaps. IT PASSED EVERY SINGLE RUN — thirty-nine
// green checks over a course carrying a fifth of itself, and the file even
// explained in a comment why that was fine.
//
// Gigi found it by opening the Khan grades screen and asking why Language Arts
// and Writing stopped at the verb. She could not record a grade for a unit that
// did not exist here, so seven units of real work had nowhere to go.
//
// ---- WHY A COUNT AND NOT A CLEVERER TEST ----
//
// The check cannot ask Khan how many units a course has: Khan serves HTTP 200
// for dead pages, renders in JavaScript, and its public API is gone (see this
// file's header). So the count is DECLARED — `unitCount`, written down by a
// person who opened the page — and this asserts the list matches the claim.
//
// That is a smaller promise than "this course is complete", and it is stated as
// such below rather than dressed up. What it makes impossible is the specific
// thing that happened: a course quietly holding fewer units than the person who
// last looked at it wrote down. To ship a short course now you have to EDIT THE
// DECLARED NUMBER DOWN, which is a visible act in a diff, not an omission.
//
// ⚠️ AND A MISSING unitCount IS A FAILURE, NOT A SKIP. A course that simply
// omits the field would otherwise opt itself out of this check by saying
// nothing — which is how the original bug looked from the outside.
for (const id of U.KHAN_UNIT_COURSE_IDS) {
  const c = U.KHAN_UNIT_COURSES[id];

  if (!Number.isInteger(c.unitCount) || c.unitCount < 1) {
    errors.push(
      `${id}: no unitCount. Open the course page, count what Khan prints, and write it down. ` +
        `A course with no declared length cannot be checked for being short — which is exactly ` +
        `how Grammar carried 2 of 10 units through thirty-nine green runs.`
    );
    continue;
  }

  if (c.units.length < c.unitCount) {
    errors.push(
      `${id} "${c.label}" holds ${c.units.length} of its ${c.unitCount} units. ` +
        `Units ${c.units.length + 1}–${c.unitCount} cannot be graded, cannot be linked, and cannot be ` +
        `reached — Gigi has no way to record work Azianna has actually done. ` +
        `⚠️ Do NOT lower unitCount to make this pass unless Khan really has removed units; ` +
        `add the missing ones, each opened in a browser first.`
    );
  }

  if (c.units.length > c.unitCount) {
    errors.push(
      `${id} "${c.label}" holds ${c.units.length} units but declares ${c.unitCount}. ` +
        `Either a unit was added without opening the course page, or Khan has grown the course ` +
        `and nobody re-read it. Both need a browser, not a guess.`
    );
  }
}

// ---- 8b. THE FLOOR. This section must never assert nothing. ---------------
// If KHAN_UNIT_COURSE_IDS is ever empty or the loop above is refactored into
// silence, the two assertions vanish and the check goes green having examined
// nothing — the shape run-all-checks' own floor exists to prevent.
{
  const declared = U.KHAN_UNIT_COURSE_IDS.filter((id) =>
    Number.isInteger(U.KHAN_UNIT_COURSES[id].unitCount)
  ).length;
  if (declared < 4) {
    errors.push(
      `only ${declared} course(s) declare a unitCount. This app has had four since v3.19, so the ` +
        `completeness rule has stopped being applied rather than the courses having gone away.`
    );
  }
  notes.push(
    `${declared} courses declare their unit count, and each holds every unit it declares ` +
      `(this proves the list matches what a person counted on the page — NOT that Khan still agrees today)`
  );
}

// ---- report ---------------------------------------------------------------
console.log('\nPetal & Pestle — Khan unit links check\n');
if (errors.length) {
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(`\n${errors.length} problem${errors.length === 1 ? '' : 's'} with the Khan unit links.\n`);
  process.exit(1);
}
for (const id of U.KHAN_UNIT_COURSE_IDS) {
  const c = U.KHAN_UNIT_COURSES[id];
  const tests = c.units.filter((u) => u.test).length;
  console.log(
    `  · ${c.label.padEnd(32)} ${String(c.units.length).padStart(2)} units · ` +
      `${tests}/${c.units.length} unit tests · ${c.courseChallenge ? 'course challenge' : 'no course challenge'} · confirmed ${c.confirmedOn} · rendered ${c.renderedOn}`
  );
}
console.log(`\n  · ${U.KHAN_UNIT_COUNT} units on file across ${U.KHAN_UNIT_COURSE_IDS.length} courses`);
console.log(`  · ${bound} level bands bound to a confirmed unit, every name matching Khan's own`);
console.log('  · her Mathematics, Reading and Language Arts blocks each open a UNIT, not a course index');
// ⚠️ v3.81 — THIS LINE SAID "all three start at UNIT 1" AND WOULD HAVE GONE ON
// SAYING IT. The assertion above it was inverted for lanes and this printed
// claim was not, so the check would have passed while announcing, on every run,
// something the app had stopped doing. A check must never claim more than it
// tests — and a check that claims the OPPOSITE of what it tests is worse than
// one that claims too much, because it reads as confirmation.
console.log(
  '  · with nothing graded each strand starts at the FIRST UNIT OF ITS OWN LANE, and advances one per grade'
);
for (const n of notes) console.log('  · ' + n);
// ⚠️ v3.94 — THIS WAS TWO HAND-TYPED SENTENCES AND BOTH HAD GONE STALE.
//
// They said "ALL 28 ADDRESSES WERE OPENED IN A BROWSER ON Aug 16 2026 — 16
// units, 10 unit tests, 2 course challenges." Grammar gained eight units and
// eight unit tests on Aug 29 and every one of those numbers was wrong, in the
// check whose job is to notice wrong numbers. The date was wrong too: it named
// one render pass as though it were the only one.
//
// "Anything countable is generated, never hand-typed" — the rule the build log
// records as having been broken by the video counts, the lesson counts, the
// version in two files, the strand levels and the list of checks itself. This
// is the same rule, in the file that polices it.
{
  const units = U.KHAN_UNIT_COURSE_IDS.reduce((n, id) => n + U.KHAN_UNIT_COURSES[id].units.length, 0);
  const tests = U.KHAN_UNIT_COURSE_IDS.reduce(
    (n, id) => n + U.KHAN_UNIT_COURSES[id].units.filter((u) => u.test).length,
    0
  );
  const challenges = U.KHAN_UNIT_COURSE_IDS.filter((id) => U.KHAN_UNIT_COURSES[id].courseChallenge).length;
  const renders = [...new Set(U.KHAN_UNIT_COURSE_IDS.map((id) => U.KHAN_UNIT_COURSES[id].renderedOn))].sort();

  console.log(
    `\n  ${units + tests + challenges} ADDRESSES ARE ON FILE — ${units} units, ${tests} unit tests, ` +
      `${challenges} course challenge${challenges === 1 ? '' : 's'}.`
  );
  console.log(`  Each course was last opened in a browser on: ${renders.join(', ')}.`);
  console.log('  Every heading matched on the day it was read. Nothing came back "Oops!".');
}
console.log('\n  WHAT THIS CHECK CANNOT DO: it cannot tell you they are STILL live today.');
console.log('  Khan serves HTTP 200 for a dead course and renders "Page not found" in JavaScript,');
console.log('  a dead course\'s HTML <title> is identical to a live one, and the public API is gone');
console.log('  (410 API removed). Only a real browser knows. Re-confirm in one, and update confirmedOn.\n');
