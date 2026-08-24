// ---------------------------------------------------------------------------
// Run with: npm run check     (or: node scripts/run-all-checks.mjs)
//
// EVERY CHECK ON DISK. NOT A LIST SOMEBODY REMEMBERED TO UPDATE.
//
// ---- WHY THIS FILE EXISTS ----
//
// `npm run check` used to be seventeen script names typed out end to end in
// package.json, joined by &&. Twenty-six checks had been written. NINE OF THEM
// WERE NOT IN IT:
//
//   check-curriculum-volume · check-delivery · check-garden · check-khan-units
//   check-projects · check-sciencelab · check-standards · check-videos
//   check-writing
//
// Each one was written after a real failure, negative-tested, and recorded in
// the build log as protecting something — and then never added to the one
// command that runs them. Among the nine: the check that proves a written
// lesson is REACHABLE, the check that proves every lesson has a real video, the
// check that proves a lesson only asks for what it taught her, and the check
// that proves both Georgia subjects are actually covered.
//
// START-PETAL-PESTLE.bat calls `npm run check` on first-time setup. So on
// Azianna's laptop, a third of this app's checks had never run at all.
//
// ---- THE RULE THIS BREAKS, AND WHY IT KEPT BREAKING ----
//
// "Anything countable is generated, never hand-typed." Every hand-typed number
// and hand-typed list in this project has drifted — the video counts, the
// lesson counts, the version in two files, the unlinked-course exemption, the
// strand levels, and now this. A list of checks is the worst thing to maintain
// by hand, because the failure is SILENT and it makes the app look MORE tested
// than it is.
//
// So this file does not contain a list of checks. It reads the folder.
// Add scripts/check-anything.mjs tomorrow and it runs tomorrow, with no edit
// here and no edit to package.json.
// ---------------------------------------------------------------------------

import { readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// A check is any script whose name says it checks something. This file is not
// one — it starts with `run-`, deliberately, so it can never run itself.
const IS_CHECK = /^(check|verify|simulate)-.+\.mjs$/;

const discovered = readdirSync(HERE).filter((f) => IS_CHECK.test(f)).sort();

// ---- The floor. A discovery step that finds nothing must FAIL, never pass. ----
// A silent zero here would print "0 of 0 passed" and exit green, which is the
// most dangerous shape a build script can have.
if (discovered.length < 20) {
  console.error(
    `\nOnly ${discovered.length} check scripts were found in scripts/. That is fewer than this ` +
      `app has ever had, so the discovery pattern has drifted rather than the checks having ` +
      `vanished. Fix this file rather than trusting it.\n`
  );
  process.exit(1);
}

// ---- Order, not membership. ----
// Membership is derived above and cannot be missed. This only decides what runs
// FIRST, so that a syntax error stops the run in two seconds instead of after
// the 260-day year simulation. Every name here must exist, or the rename that
// broke it fails the build instead of silently losing its place in the queue.
const RUN_FIRST = ['check-sources.mjs', 'check-imports.mjs', 'check-jsx.mjs', 'check-hooks.mjs'];

const missingFirst = RUN_FIRST.filter((f) => !discovered.includes(f));
if (missingFirst.length) {
  console.error(
    `\nrun-all-checks expects ${missingFirst.join(', ')} to exist and cannot find them. If a check ` +
      `was renamed, rename it here too — a stale ordering list is how a check quietly stops ` +
      `running first.\n`
  );
  process.exit(1);
}

const ordered = [...RUN_FIRST, ...discovered.filter((f) => !RUN_FIRST.includes(f))];

// ---- Batches, so the output can actually be read. ----
const BATCH = 6;

console.log(`\n${'='.repeat(70)}`);
console.log(`  PETAL & PESTLE — ${ordered.length} checks, every one found on disk`);
console.log(`${'='.repeat(70)}`);

const failed = [];
const passed = [];
const started = Date.now();

for (let i = 0; i < ordered.length; i += 1) {
  if (i % BATCH === 0) {
    console.log(`\n${'-'.repeat(70)}`);
    console.log(`  BATCH ${Math.floor(i / BATCH) + 1} of ${Math.ceil(ordered.length / BATCH)}`);
    console.log(`${'-'.repeat(70)}`);
  }

  const name = ordered[i].replace(/\.mjs$/, '');
  console.log(`\n### ${String(i + 1).padStart(2)} / ${ordered.length} · ${name}`);

  const r = spawnSync(process.execPath, [resolve(HERE, ordered[i])], {
    cwd: ROOT,
    stdio: 'inherit'
  });

  if (r.status === 0) passed.push(name);
  else failed.push(name);
}

const seconds = Math.round((Date.now() - started) / 1000);

console.log(`\n${'='.repeat(70)}`);
if (failed.length) {
  console.error(`  ${passed.length} of ${ordered.length} checks passed in ${seconds}s.`);
  console.error(`\n  ${failed.length} FAILED:`);
  for (const f of failed) console.error(`    ✗ ${f}`);
  console.error(
    `\n  Scroll up for the reason. Each check prints what it found and why it matters.\n` +
      `${'='.repeat(70)}\n`
  );
  process.exit(1);
}

console.log(`  ALL ${ordered.length} CHECKS PASSED in ${seconds}s.`);
console.log(`${'='.repeat(70)}\n`);
