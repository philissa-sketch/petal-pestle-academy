// ---------------------------------------------------------------------------
// Run with: node scripts/check-schedule.mjs
//
// The default school day, checked against the claims made about it.
//
// The master plan tells the grandmother this is "four hours a day, four days a
// week", and the Grown-Up Corner prints an instructional-minutes total that
// could plausibly end up copied onto a state form. A number like that has to be
// true, and it is the kind of thing that quietly stops being true the third
// time somebody nudges a block by ten minutes.
//
// So the default day is verified, not asserted:
//   1. every start time parses
//   2. nothing overlaps
//   3. no gaps you could lose a child in
//   4. instructional time really is about four hours, breaks excluded
//   5. every one of the five Khan core subjects actually has a block
//
// Point 5 is the one most likely to catch a real mistake later. Social Studies
// only moved to Khan's side of the ledger this week; a subject can very easily
// be agreed on in a planning document and then never appear on the timetable,
// which means it never happens.
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const {
  DEFAULT_SCHEDULE,
  orderedBlocks,
  instructionalMinutes,
  toClock,
  PROMISED_INSTRUCTIONAL_MINUTES
} = await import(pathToFileURL(resolve(ROOT, 'src/config/schedule.js')).href);

const errors = [];
const notes = [];

const ordered = orderedBlocks(DEFAULT_SCHEDULE);

// 1. every block parsed
if (ordered.length !== DEFAULT_SCHEDULE.length) {
  errors.push(
    `${DEFAULT_SCHEDULE.length - ordered.length} block(s) have an unreadable start time — ` +
      `orderedBlocks() dropped them, so they would silently never appear on her day`
  );
}

// 2. no overlaps, 3. no large gaps
for (let i = 1; i < ordered.length; i++) {
  const prev = ordered[i - 1];
  const cur = ordered[i];
  if (cur.startMin < prev.endMin) {
    errors.push(`"${prev.label}" runs into "${cur.label}" at ${toClock(cur.startMin)}`);
  }
  const gap = cur.startMin - prev.endMin;
  if (gap > 10) {
    errors.push(
      `${gap} unscheduled minutes between "${prev.label}" and "${cur.label}" — ` +
        `either make it a break or close the gap`
    );
  }
}

// 4. instructional time matches the number the plan promises
//
// This used to hard-code "about four hours". Gigi asked for hour-long blocks on
// Maths, Reading and Language Arts on Aug 13, which is +90 minutes a day, and
// the check failed — correctly. The wrong fix would have been to widen the band
// until it passed; that turns a guard into decoration.
//
// So the promise now lives in ONE place, exported from the schedule config, and
// this check asserts the day matches it. Change the day and this fails until
// you change the stated promise too — which is the point. The master plan, the
// Grown-Up Corner and this check can no longer drift apart, because they all
// read the same constant.
const mins = instructionalMinutes(DEFAULT_SCHEDULE);
const hours = mins / 60;
if (mins !== PROMISED_INSTRUCTIONAL_MINUTES) {
  errors.push(
    `the day is ${mins} instructional minutes but the plan promises ` +
      `${PROMISED_INSTRUCTIONAL_MINUTES} — fix the day or fix the promise, ` +
      `and do not widen this check to make it pass`
  );
} else {
  notes.push(`${mins} instructional minutes (${hours.toFixed(2)}h), breaks excluded — as promised`);
}

// A separate, softer sanity bound. The promise itself has to stay believable:
// a nine-year-old's four-day week should not quietly become a seven-hour day
// because each change looked small on its own.
if (hours > 6) {
  errors.push(
    `${hours.toFixed(2)}h of instruction is too long a day for a nine-year-old, ` +
      `whatever the promise says`
  );
}

// 5. every Khan core subject has a block
const CORE = [
  ['Mathematics', /math/i],
  ['Reading', /read/i],
  ['Language Arts & Writing', /language|writing/i],
  ['Science', /science/i],
  ['Social Studies', /social/i]
];
for (const [name, rx] of CORE) {
  if (!DEFAULT_SCHEDULE.some((b) => rx.test(b.label))) {
    errors.push(
      `${name} is a Khan core subject with no block on the timetable — ` +
        `a subject with no time on the day does not happen`
    );
  }
}
if (!errors.some((e) => e.includes('core subject'))) {
  notes.push('all five Khan core subjects have a block');
}

// The signature course too — it is the whole point of the app.
if (!DEFAULT_SCHEDULE.some((b) => b.kind === 'signature')) {
  errors.push('no block for Herbalism & Botany, which is the signature course');
} else {
  notes.push('the signature course has a block');
}

const first = ordered[0];
const last = ordered[ordered.length - 1];
notes.push(
  `day runs ${toClock(first.startMin)} to ${toClock(last.endMin)} across ${ordered.length} blocks`
);

// ---------------------------------------------------------------------------
// THE GEORGIA HOURS LEDGER — a record a grown-up may act on.
//
// Gigi, backlog §4.1: "Where are the hours counted for the Georgia standards?
// For a homeschool record in Georgia this is not optional."
//
// The requirement was LOOKED UP, not remembered — 180 days, each of at least
// four and a half hours, covering five named subjects (O.C.G.A. § 20-2-690, via
// HSLDA and the Georgia Home Education Association, fetched Aug 16 2026). Being
// roughly right about a legal figure is worse than saying you do not know.
//
// The rule that earns its keep is the last one. A ledger and a garden that both
// count "days she worked" from the same ticks must never disagree, and the way
// they come to disagree is that somebody adds a second count somewhere. That is
// the exact drift class that has bitten this project three separate times.
// ---------------------------------------------------------------------------
{
  const { GEORGIA, hoursSummary, dailyLedger, subjectsWithNoHours } = await import(pathToFileURL(resolve(ROOT, 'src/lib/hours.js')).href);
  const { gardenFor } = await import(pathToFileURL(resolve(ROOT, 'src/lib/garden.js')).href);

  // ---- the arithmetic agrees with itself
  if (GEORGIA.hoursPerYear !== (GEORGIA.daysPerYear * GEORGIA.minutesPerDay) / 60) {
    errors.push('the Georgia year total does not equal days × hours');
  }
  if (GEORGIA.hoursPerDay !== 4.5 || GEORGIA.daysPerYear !== 180) {
    errors.push(
      `the ledger is set to ${GEORGIA.daysPerYear} days of ${GEORGIA.hoursPerDay} hours — ` +
        `Georgia asks for 180 of 4.5, and this number is not one to drift`
    );
  }

  // ---- HER DAY MUST BE ABLE TO REACH THE REQUIREMENT
  //
  // If the taught blocks on the default day total less than four and a half
  // hours, she could tick every single one and still never record a qualifying
  // day. The ledger would then count downward forever and nobody would know why.
  const taught = DEFAULT_SCHEDULE.filter((b) => b.subject).reduce((a, b) => a + (b.minutes || 0), 0);
  if (taught < GEORGIA.minutesPerDay) {
    errors.push(
      `the default day teaches ${taught} minutes, under Georgia's ${GEORGIA.minutesPerDay} — ` +
        `she could tick every block and still never record a qualifying day`
    );
  } else {
    notes.push(
      `a full day tots up to ${(taught / 60).toFixed(2)}h against Georgia's ${GEORGIA.hoursPerDay}h`
    );
  }

  // ---- every subject the statute names can actually accrue hours
  const subjectsOnTheDay = new Set(DEFAULT_SCHEDULE.map((b) => b.subject).filter(Boolean));
  for (const req of GEORGIA.requiredSubjects) {
    if (!req.subjects.some((sub) => subjectsOnTheDay.has(sub))) {
      errors.push(
        `"${req.statute}" is named by the statute but nothing on her day carries it, so the ` +
          `annual progress report would show a hole that no amount of school could fill`
      );
    }
  }

  // ---- a short day is a day of school, but not a qualifying one
  const blocks = DEFAULT_SCHEDULE;
  const allOn = Object.fromEntries(blocks.filter((b) => b.subject).map((b) => [b.id, true]));
  const oneBlock = { [blocks.find((b) => b.subject).id]: true };
  const days = { d1: { done: allOn }, d2: { done: oneBlock }, d3: { done: {} } };
  const sum = hoursSummary({ scheduleDays: days, blocks });

  if (sum.daysWithWork !== 2) errors.push(`a day with nothing ticked is being counted (${sum.daysWithWork} of 2)`);
  if (sum.daysMeetingRequirement !== 1) {
    errors.push(
      `${sum.daysMeetingRequirement} qualifying days from one full day and one short one — a ` +
        `short day must count as school WITHOUT counting toward the 180`
    );
  }
  // A day of only BREAKS is not a day of school. This is on a legal record:
  // ticking lunch must never add hours to it.
  const breakBlock = blocks.find((x) => !x.subject && x.minutes);
  if (breakBlock) {
    const onlyBreaks = hoursSummary({ scheduleDays: { b1: { done: { [breakBlock.id]: true } } }, blocks });
    if (onlyBreaks.minutes !== 0 || onlyBreaks.daysWithWork !== 0) {
      errors.push(
        `ticking "${breakBlock.label}" alone records ${onlyBreaks.minutes} minutes on ${onlyBreaks.daysWithWork} ` +
          `day(s) — a break is not instructional time and this number goes on a legal record`
      );
    }
  }

  if (dailyLedger({ scheduleDays: { d: { done: {} } }, blocks }).length !== 0) {
    errors.push('un-ticking everything does not take the day back out of the ledger');
  }

  // ---- THE LEDGER AND THE GARDEN MUST AGREE
  //
  // Both answer "which days did she work" from the same ticks. If they ever
  // stop agreeing, one of them has grown a second count.
  const garden = gardenFor({ scheduleDays: days, blocks });
  const gardenDays = Math.max(...garden.map((p) => p.days));
  const ledgerDays = sum.daysWithWork;
  if (gardenDays > ledgerDays) {
    errors.push(
      `the garden says ${gardenDays} days worked and the hours ledger says ${ledgerDays} — ` +
        `they read the same ticks and must not disagree`
    );
  }

  notes.push(
    `hours ledger: ${GEORGIA.daysPerYear} days × ${GEORGIA.hoursPerDay}h = ${GEORGIA.hoursPerYear}h, ` +
      `built on the same ticks as the garden`
  );
  if (subjectsWithNoHours(sum).length === GEORGIA.requiredSubjects.length) {
    errors.push('a full day of ticks records no hours against any statute subject');
  }
}

// ---------------------------------------------------------------------------
// KHAN GRADES — the app must never invent one, and she must never see a number.
//
// Two rules, and both are about honesty rather than correctness.
//
// The first: Khan lives outside this app and there is no way to read it from
// here. A grade the app generated would look exactly like one a grown-up typed,
// and it would end up on a transcript. So the ONLY caller of addKhanGrade is
// the Grown-Up Corner form.
//
// The second: the percentage is for the record. Her own screens show a band,
// same rule as every other score in this app, and a number leaking onto a
// child's screen is the failure the whole banding decision exists to prevent.
// ---------------------------------------------------------------------------
{
  const walk = (dir, out = []) => {
    for (const name of readdirSync(dir)) {
      const p = `${dir}/${name}`;
      if (statSync(p).isDirectory()) walk(p, out);
      else if (/\.jsx?$/.test(p)) out.push(p);
    }
    return out;
  };
  const files = walk(resolve(ROOT, 'src'));

  const callers = files.filter((f) => /addKhanGrade\(/.test(readFileSync(f, 'utf8')));
  const outsideParent = callers.filter(
    (f) => !f.includes('/Parent/') && !f.includes('/store/')
  );
  if (outsideParent.length) {
    errors.push(
      `addKhanGrade is called outside the Grown-Up Corner (${outsideParent
        .map((f) => f.split('/src/')[1])
        .join(', ')}) — the app must never write a Khan grade it was not given`
    );
  }

  // SCREENS only. The store legitimately handles the number — it clamps and
  // stores what the grown-up typed — and so does the merge. The rule is about
  // what reaches HER eyes, so it looks at components she can open.
  const childScreens = files.filter(
    (f) =>
      f.includes('/components/') &&
      !f.includes('/Parent/') &&
      /khanGrades/.test(readFileSync(f, 'utf8'))
  );
  for (const f of childScreens) {
    const src = readFileSync(f, 'utf8');
    if (/\.percent/.test(src)) {
      errors.push(
        `${f.split('/src/')[1]} is a screen she sees and it reads a Khan percentage — ` +
          `she gets a band, never a number`
      );
    }
  }
  notes.push('Khan grades: typed by a grown-up only, and no percentage on her screens');
}

// ---------------------------------------------------------------------------
// THE BELL STAYS ON UNTIL THE END OF THE SCHOOL DAY — v3.43
//
// Gigi: "fix the bell so that it is louder ... and that it will not turn off
// until the end of the school day once it is turned on."
//
// It was never turning off. `bellOn` was `useState(false)` inside TodayView, so
// it reset to false every time she left the tab and again on every reload. The
// screen even said so out loud — "for as long as this tab stays open" — which
// was an honest description of a bug that nobody had recognised as one.
//
// NOTHING IN ANY OF THE TWENTY-SIX CHECKS HAD EVER MENTIONED THE BELL. It was
// the one thing on her timetable with no assertion of any kind behind it.
//
// Four things are tested here, and the last one is the one that matters:
//
//   1. The end of the school day is DERIVED from the last block, not typed.
//      A literal 955 is correct today and silently wrong the day a block moves
//      — a number that happens to be correct today is not a measurement (v3.34).
//   2. The bell is on during the day and off after it, on a real clock.
//   3. A bell switched on YESTERDAY is not on today.
//   4. TodayView does not hold the on/off state itself. This is the assertion
//      that would have caught the original bug: component state cannot survive
//      the tab being left, so the rule has to live in the store and bell.js.
// ---------------------------------------------------------------------------
{
  const { schoolDayEndsAt, bellShouldBeOn, BELL_VOLUME } = await import(pathToFileURL(resolve(ROOT, 'src/lib/bell.js')).href);

  const ends = schoolDayEndsAt(DEFAULT_SCHEDULE);

  // 1. derived, and sane
  const lastFinish = Math.max(
    ...DEFAULT_SCHEDULE.map((b) => {
      const [h, m] = b.start.split(':').map(Number);
      return h * 60 + m + (b.minutes || 0);
    })
  );
  if (ends !== lastFinish) {
    errors.push(
      `the bell thinks the school day ends at ${ends} minutes but the last block finishes at ` +
        `${lastFinish}. This number must be READ OFF the timetable, never typed — a literal is ` +
        `correct until somebody moves a block, and then the bell switches itself off mid-afternoon.`
    );
  }
  if (ends < 600) {
    errors.push(`the school day is computed to end at ${ends} minutes past midnight, before 10am`);
  }

  // ⚠️ AND IT IS ASKED ABOUT A TIMETABLE THAT IS NOT HERS.
  //
  // The comparison above cannot tell a derived answer from a hard-coded one,
  // because the hard-coded answer a person would write is 955 — and 955 is the
  // right answer for her real day. Putting `return 955;` at the top of
  // schoolDayEndsAt CHANGED NOTHING and its negative test could not fail.
  //
  // A NEGATIVE TEST THAT CANNOT FAIL IS NOT A PASSING NEGATIVE TEST (v3.28).
  // So the function is handed a made-up day whose answer is nothing like hers.
  // A literal fails here instantly, which is the whole point: the rule is that
  // this number is READ, and a rule you cannot break is a rule you cannot test.
  const madeUpDay = [
    { start: '09:00', minutes: 30 },
    { start: '10:15', minutes: 20 },
    { start: '11:00', minutes: 45 } // finishes 11:45 = 705
  ];
  const madeUpEnd = schoolDayEndsAt(madeUpDay);
  if (madeUpEnd !== 705) {
    errors.push(
      `schoolDayEndsAt returned ${madeUpEnd} for a made-up day whose last block finishes at 705. ` +
        `It is not reading the timetable it is given — it is returning a number that happens to be ` +
        `correct for hers. A number that happens to be correct today is not a measurement (v3.34).`
    );
  }
  if (schoolDayEndsAt([]) !== 0) {
    errors.push('schoolDayEndsAt invents an end time for a day with no blocks in it');
  }

  // 2. on during the day, off after it
  const TODAY = '2026-08-17';
  const during = bellShouldBeOn({
    bellOnDayKey: TODAY, todayKey: TODAY, minutesNow: ends - 60, schedule: DEFAULT_SCHEDULE
  });
  const after = bellShouldBeOn({
    bellOnDayKey: TODAY, todayKey: TODAY, minutesNow: ends + 1, schedule: DEFAULT_SCHEDULE
  });
  if (!during) errors.push('the bell is off an hour before the end of the school day');
  if (after) errors.push('the bell is still on after the school day has ended');

  // 3. yesterday's bell is not today's
  const stale = bellShouldBeOn({
    bellOnDayKey: '2026-08-16', todayKey: TODAY, minutesNow: 600, schedule: DEFAULT_SCHEDULE
  });
  if (stale) errors.push('a bell switched on yesterday is still on today');

  // 4. ⚠️ THE ONE THAT WOULD HAVE CAUGHT IT.
  const tv = readFileSync(resolve(ROOT, 'src/components/Schedule/TodayView.jsx'), 'utf8');

  // ⚠️ THE FIRST VERSION OF THIS ASSERTION WAS WRONG, AND IT FAILED A CORRECT
  // SCREEN. It also looked for `useState(false)` followed by a comment
  // mentioning "bell" — which matched the perfectly legitimate
  // `const [bellBlocked, setBellBlocked] = useState(false);` because the next
  // thing in the file was the comment explaining this very fix.
  //
  // A CHECK THAT LOCATES THE THING IT GUARDS BY A COMMENT IS GUARDING THE
  // COMMENT (v3.38). Written into a check by the person who wrote that rule
  // down, one version later. Checked the check before the content — the screen
  // was right.
  //
  // `bellBlocked` is fine as component state: it is a transient "the browser
  // said no" flag with no meaning tomorrow. What must never live on the screen
  // is `bellOn`, so that is the only name asserted, by its declaration.
  if (/const\s*\[\s*bellOn\b[^\]]*\]\s*=\s*useState/.test(tv)) {
    errors.push(
      'TodayView holds the bell on/off state in component state. It cannot survive her leaving ' +
        'the tab or reloading, which is exactly the bug Gigi reported as "the bell turns off". ' +
        'It belongs on the saved day row, with the rule in bell.js where this check can reach it.'
    );
  }
  // ⚠️ THIS ASSERTION WAS SATISFIED BY THE IMPORT LINE. It tested for the bare
  // word `bellShouldBeOn`, and renaming every CALL left the name sitting in the
  // import list, so the check stayed green while the screen decided the rule
  // for itself. Its negative test caught it. Same shape as v3.39, where an
  // assertion was satisfied by a parameter name — a name is not a call.
  if (!/bellShouldBeOn\s*\(/.test(tv)) {
    errors.push('TodayView no longer CALLS bellShouldBeOn — the rule is being decided on the screen again');
  }
  if (!/setBellOnForDay\s*\(/.test(tv)) {
    errors.push('TodayView no longer saves the bell for the day, so it will reset when she leaves the tab');
  }

  if (BELL_VOLUME < 0.4) {
    errors.push(
      `the bell volume is ${BELL_VOLUME}. Gigi asked for a louder bell and anything under 0.4 is ` +
        `the quiet chime she could not hear from another room.`
    );
  }

  notes.push(
    `the bell: on from the first press until ${String(Math.floor(ends / 60)).padStart(2, '0')}:` +
      `${String(ends % 60).padStart(2, '0')}, derived from the last block · volume ${BELL_VOLUME} · ` +
      `state saved on the day row, not held on the screen`
  );
}

console.log('\nPetal & Pestle — school day check\n');
for (const n of notes) console.log(`  · ${n}`);
if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\nThe default day is coherent and matches what the plan promises.\n');
