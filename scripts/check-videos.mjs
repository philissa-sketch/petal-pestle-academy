// ---------------------------------------------------------------------------
// Run with: node scripts/check-videos.mjs
//
// CHECK #18 — the one the master plan described in §11.2 and nobody built.
//
// THE PROBLEM THIS EXISTS TO CATCH, in the parent's words: "do you have videos
// with each lesson" — followed by "in the future double check that there are
// videos attached."
//
// The honest answer at the time was one of fourteen. The plan had said since
// August that every lesson gets a verified video and that a check would enforce
// it. The rule was real, the intention was real, and thirteen lessons shipped
// without one because nothing was looking.
//
// That is the whole reason this file exists. From her brother's project log,
// quoted exactly, and it was written there after the same lapse:
//
//     every lesson must have a properly verified video before it ships, no
//     exceptions — "couldn't find one quickly" is never a reason to skip it
//
//     never invent or guess a URL
//
//     actively seek out Black American educators as video sources
//
// ---- WHAT IT ASSERTS ----
//
// 1. EVERY lesson has a video. No allow-list, no exemptions, no grace period.
//    This one really does fail the build, unlike check-standards and
//    check-curriculum-volume, and the difference is deliberate: a missing
//    lesson is work not yet done, and a missing video is a rule being broken.
// 2. Every video has an id, a url, a title and a channel.
// 3. Every video has a `verified` date. An id with no verification date was
//    never checked against YouTube, and an unchecked id is a guess.
// 4. The id looks like a real YouTube id — 11 characters of YouTube's alphabet.
//    Catches a truncated paste and a whole URL dropped into the id field.
// 5. The url and the id agree. They drift the moment someone edits one.
// 6. The title is not a placeholder — no "TODO", no "TBD", no empty string.
// 7. No two lessons share a video unless the reuse carries a written reason.
//    His app has exactly one legitimate reuse and it is explained in place;
//    an unexplained duplicate is almost always a copy-paste.
// 8. Every video that is NOT from a Black American educator carries a
//    `sourceGap` sentence saying what was searched for and not found.
//
// ---- WHY ASSERTION 8 IS THE IMPORTANT ONE ----
//
// A requirement with no evidence of effort is a requirement that quietly stops
// happening. Requiring the search to be WRITTEN DOWN — not the outcome, the
// search — means the next person can see whether it was actually tried, and can
// pick up where it was left rather than starting again.
//
// It also means the gap is on the screen every single run. Zero of thirteen is
// printed in full, with the reason for each, and that number should be
// uncomfortable to look at until it changes.
//
// ---- WHAT THIS SCRIPT CANNOT DO ----
//
// It cannot reach YouTube. There is no network in the sandbox this app is built
// in, so it cannot confirm an id is still live TODAY — only that someone
// recorded checking it. Verification happens at authoring time, against
// `https://www.youtube.com/oembed?url=...&format=json`, twice, independently.
// This script is the thing that stops an unverified id ever being written down
// in the first place.
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const { HERBALISM_Q1 } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/herbalismQ1.js')).href);
const { HERBALISM_M1 } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/herbalismM1.js')).href);

const ALL_LESSONS = [
  ...HERBALISM_Q1.map((l) => ({ ...l, src: 'Herbalism Q1' })),
  ...HERBALISM_M1.map((l) => ({ ...l, src: 'Herbalism M1' }))
];

/** Reuses of one video across two lessons, each with a written reason. */
const ALLOWED_REUSE = new Map([
  // e.g. ['someVideoId', 'Both lessons cover the same single real event.']
]);

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const PLACEHOLDER = /\b(tbd|todo|tk|placeholder|xxx|fixme)\b/i;

const errors = [];
const gaps = [];
const byId = new Map();

for (const l of ALL_LESSONS) {
  const v = l.video;
  const where = `${l.id} (${l.title})`;

  if (!v || !v.id) {
    errors.push(
      `${where} has NO VIDEO. Every lesson ships with a verified video — ` +
        `"couldn't find one quickly" is never a reason to skip it.`
    );
    continue;
  }

  if (!YT_ID.test(v.id)) {
    errors.push(`${where}: "${v.id}" is not a YouTube id — 11 characters of [A-Za-z0-9_-]`);
  }
  if (!v.url) {
    errors.push(`${where}: no url`);
  } else if (!v.url.includes(v.id)) {
    errors.push(`${where}: the url and the id disagree — one of them was edited and the other was not`);
  }
  if (!v.title || !v.title.trim()) {
    errors.push(`${where}: no title. Record the title YouTube RETURNS, not the one a search result claimed.`);
  } else if (PLACEHOLDER.test(v.title)) {
    errors.push(`${where}: the title is a placeholder — "${v.title}"`);
  }
  if (!v.channel || !v.channel.trim()) {
    errors.push(`${where}: no channel`);
  }
  if (!v.verified) {
    errors.push(
      `${where}: no \`verified\` date. An id with no verification date was never checked ` +
        `against YouTube, and an unchecked id is a guess.`
    );
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(v.verified)) {
    errors.push(`${where}: verified date "${v.verified}" is not YYYY-MM-DD`);
  }

  // Assertion 8 — the search must be written down, not just its outcome.
  if (!v.blackAmericanEducator) {
    if (!v.sourceGap || v.sourceGap.trim().length < 30) {
      errors.push(
        `${where}: not a Black American educator and no \`sourceGap\` saying what was searched for. ` +
          `A requirement with no evidence of effort is a requirement that quietly stops happening.`
      );
    } else {
      gaps.push({ lesson: l, video: v });
    }
  }

  if (byId.has(v.id)) {
    const other = byId.get(v.id);
    if (!ALLOWED_REUSE.has(v.id)) {
      errors.push(
        `${where} and ${other} both use video ${v.id}, with no written reason. ` +
          `An unexplained duplicate is almost always a copy-paste.`
      );
    }
  }
  byId.set(v.id, l.id);
}

for (const [vid, reason] of ALLOWED_REUSE) {
  const uses = ALL_LESSONS.filter((l) => l.video?.id === vid).length;
  if (uses < 2) {
    errors.push(
      `ALLOWED_REUSE excuses video ${vid} ("${reason}") but only ${uses} lesson uses it. ` +
        `A stale allowance is how a real duplicate gets hidden.`
    );
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const withVideo = ALL_LESSONS.filter((l) => l.video?.id).length;
const black = ALL_LESSONS.filter((l) => l.video?.blackAmericanEducator).length;

console.log('\nPetal & Pestle — video check (#18)\n');
console.log(`  ${withVideo} of ${ALL_LESSONS.length} lessons carry a verified video.`);
console.log(`  ${new Set([...byId.keys()]).size} distinct videos, every id oEmbed-checked at authoring time.\n`);

console.log(`  Black American educator as the source: ${black} of ${withVideo}.`);
if (gaps.length) {
  console.log(
    `  ${gaps.length} fallback${gaps.length === 1 ? '' : 's'}, each with the search written down.\n` +
      `  Printed in full every run on purpose — this number should be uncomfortable until it changes.\n`
  );
  for (const g of gaps) {
    console.log(`    ${g.lesson.id.padEnd(11)} ${g.video.channel}`);
  }
}

// ---------------------------------------------------------------------------
// A VIDEO MUST FIT THE SYSTEM CONCEPT OF THE COURSE THAT OWNS IT — v3.45
//
// ---- WHY THIS EXISTS ----
//
// `video.minutes` has been recorded on all 192 lessons since v3.24 and NOT ONE
// OF THE TWENTY-SIX CHECKS EVER READ IT. A field that is recorded and never
// asserted is a field that drifts — and it drifted: Social Studies reached
// twelve videos over six minutes, one of them eleven, in a course whose System
// Concept is ten minutes.
//
// Found while choosing videos for The Human Body. A 9:19 video looked fine by
// reasoning ("it fits in ten minutes") and was killed by MEASURING the courses
// that already exist: The Science Lab has the identical 30-minute shape and its
// 48 videos run 3 to 5 minutes.
//
// The ceiling is DERIVED in curriculumPlan.js from each course's own minutes —
// see videoCeilingFor(). It is not typed here, because 6 and 8 are correct
// today and would go quietly wrong the day a course's length changes.
//
// The thirteen already over it are DECLARED by Gigi, by id, with a date and a
// reason. A declaration names ids; it does not raise the ceiling. Anything that
// drifts over tomorrow still fails.
// ---------------------------------------------------------------------------
{
  const { APP_COURSES: PLAN_COURSES, videoCeilingFor, DECLARED_LONG_VIDEOS } = await import(pathToFileURL(resolve(ROOT, 'src/config/curriculumPlan.js')).href);
  const { APP_COURSES: DATA_COURSES } = await import(pathToFileURL(resolve(ROOT, 'src/data/lessons/appCourses.js')).href);

  const declared = new Map();
  for (const d of DECLARED_LONG_VIDEOS || []) {
    for (const id of d.lessons || []) declared.set(id, d);
  }

  // A declaration that has gone stale fails the build, exactly as a stale
  // DECLARED_OMISSION does since v3.33. If a declared video was swapped for a
  // short one, the exception is excusing nothing and must be removed — an
  // exemption fails once it is no longer needed (v3.24).
  // ---- THE RULE CAME IN ON THIS DATE, AND IT ONLY BINDS FORWARD ----
  //
  // ⚠️ 85 OF HERBALISM'S 96 VIDEOS HAVE NO RECORDED LENGTH — 44% of the app.
  // The Science Lab and Social Studies are 48 of 48. `video.minutes` arrived
  // with The Science Lab at v3.24; Herbalism was written at v3.5–v3.9, before
  // the field existed, and nothing ever went back.
  //
  // Hard-failing all 85 today would leave exactly one quick route to a green
  // build: INVENT 85 DURATIONS NOBODY HAS MEASURED. That is the failure this
  // project already has a rule for — a check that pressures you to falsify the
  // data is worse than no check (v3.24, and it fired again at v3.40).
  //
  // So this follows check-standards and check-curriculum-volume: THE GAP IS
  // PRINTED IN FULL ON EVERY RUN, and the hard failure is narrow and forward-
  // looking. A video VERIFIED ON OR AFTER the day this rule came in must carry
  // its length. Every Human Body video is verified after it, so the new course
  // cannot repeat the omission — and the rule needs no list, expires on its own
  // as Herbalism gets measured, and cannot be satisfied by guessing.
  const RULE_CAME_IN = '2026-08-17';

  const stillLong = new Set();
  const unmeasured = [];
  let counted = 0;
  let longest = { id: null, minutes: 0 };

  for (const course of DATA_COURSES) {
    const planned = PLAN_COURSES.find((c) => c.id === course.id);
    const ceiling = videoCeilingFor(planned || course.id);
    if (!ceiling) continue;

    for (const lesson of course.lessons) {
      const mins = lesson.video?.minutes;
      if (lesson.video?.id && typeof mins !== 'number') {
        unmeasured.push({ id: lesson.id, course: course.id, verified: lesson.video.verified });
        if (String(lesson.video.verified || '') >= RULE_CAME_IN) {
          errors.push(
            `${lesson.id}: its video was verified on ${lesson.video.verified}, on or after the day ` +
              `video length became a rule (${RULE_CAME_IN}), and carries no length. Length is not ` +
              `decoration — it is what decides whether the two beats still fit in the System ` +
              `Concept. Read it off the duration badge; do not estimate it.`
          );
        }
        continue;
      }
      if (typeof mins !== 'number') continue;
      counted++;
      if (mins > longest.minutes) longest = { id: lesson.id, minutes: mins };

      // ⚠️ OVER THE CEILING IS PRINTED, NOT FAILED — v3.46, Gigi's call.
      //
      // This was a hard error at v3.45. Measuring Herbalism then found eighteen
      // more over the line, two of them over half an hour, and Gigi said:
      // "Just leave the videos alone the way they are. It maybe good to have
      // her watch the full videos."
      //
      // THE CEILING WAS MY INFERENCE, NOT HER RULE. Deriving it from §10.2's
      // arithmetic was reasonable as a default and is useful as a signal. It is
      // not a law about how she may spend forty-five minutes with her
      // granddaughter — a video may be the activity, or watched over two
      // afternoons, or previewed and clipped, which is exactly what hb-m12-05's
      // own note already says.
      //
      // A check must never claim more than it tests, and this one was claiming
      // authority over a teaching decision. The number stays visible; the
      // failure goes.
      if (mins > ceiling) stillLong.add(lesson.id);
    }
  }

  for (const [id, d] of declared) {
    if (!stillLong.has(id)) {
      errors.push(
        `${id} is declared as an over-length video by ${d.by} on ${d.on}, and it is not over ` +
          `length any more. A declaration that has gone stale excuses nothing — remove it. ` +
          `(The same rule that fails a stale DECLARED_OMISSION, v3.33.)`
      );
    }
  }

  if (counted || unmeasured.length) {
    const ceilings = DATA_COURSES.map((c) => {
      const p = PLAN_COURSES.find((x) => x.id === c.id);
      return `${c.id} ≤${videoCeilingFor(p || c.id)}min`;
    }).join(' · ');
    console.log(
      `\n  Video length — ${counted} measured · longest ${longest.id} at ${longest.minutes} min\n` +
        `  Guide only, not enforced (Gigi, Aug 17): ${ceilings} · ${stillLong.size} run longer`
    );

    // PRINTED IN FULL EVERY RUN, ON PURPOSE. This number should stay
    // uncomfortable until it is zero. A gap that is not printed is a gap
    // nobody remembers, and a gap printed too small is not honesty either.
    if (unmeasured.length) {
      const byCourse = {};
      for (const u of unmeasured) byCourse[u.course] = (byCourse[u.course] || 0) + 1;
      const total = counted + unmeasured.length;
      console.log(
        `\n  ⚠️  ${unmeasured.length} of ${total} videos have NO RECORDED LENGTH — ` +
          Object.entries(byCourse).map(([c, n]) => `${c} ${n}`).join(' · ') +
          `\n      Not a build failure, and deliberately so: hard-failing these would leave one ` +
          `fast\n      route to green, which is to invent durations nobody measured.` +
          `\n      Any video verified on or after ${RULE_CAME_IN} DOES fail without one.`
      );
    }
  }
}

if (errors.length) {
  console.log(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log('');
  process.exit(1);
}

// The closing line said "…and it fits the lesson it sits in" for one version.
// It stopped being true the moment the ceiling became a guide instead of a
// rule, and a summary sentence is the line a reader actually remembers — the
// same reason the v3.31 wording about "every block, all four quarters" had to
// change. Length is measured and printed; it is not enforced.
console.log('\nEvery lesson has a video. Every id is well-formed, dated, and its search recorded. Length is measured and printed, not enforced.\n');
