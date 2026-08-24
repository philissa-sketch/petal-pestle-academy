// ---------------------------------------------------------------------------
// CHECK — NOTHING OF HERS GETS PUBLISHED.
//
// Run with: node scripts/check-publish-safety.mjs
//
// ---- WHY THIS EXISTS ----
//
// `public/her-latest-export.json` held Azianna's real data: her learner name,
// all nine measured strand levels — grammar 2.20, geometry 2.70, reading 3.46 —
// 74 of her answers, and her two journal entries in her own words.
//
// EVERYTHING IN public/ IS COPIED VERBATIM INTO dist/. So the first time this
// app was uploaded anywhere, that file would have been sitting at a public web
// address for anyone with the link.
//
// Nobody had done anything wrong. While the app only ever ran on localhost,
// "public/" and "on my own computer" were the same place. Publishing it to a
// Chromebook is what made them different, and the file had been there since
// August with no reason to think about it.
//
// That is exactly the shape of thing that must be a check rather than a memory.
// It costs nothing to run and it only has to catch this once.
//
// ---- WHAT IT ASSERTS ----
//
//   1. No file in public/ carries her data.
//   2. No file in a built dist/ carries her data — because a dist/ built BEFORE
//      this check existed could still be sitting on disk, ready to upload.
//   3. local/ is not empty of the export while the Grown-Up Corner still offers
//      the green button — i.e. if the file has been moved somewhere new, say so
//      rather than silently losing the feature.
//
// ---- WHAT IT DOES NOT ASSERT ----
//
//   · It does not stop her publishing. That is her decision.
//   · It does not scan node_modules, src/ or claude/. Her data does not belong
//     in those either, but they are not copied into the built site, so a hit
//     there is a different problem with a different fix.
//   · It cannot tell a real export from a convincing fake. It looks for the
//     markers a Petal & Pestle export actually carries.
//
// NOTE: no quote character appears inside a regex character class here — see
// the header of src/lib/readingLoad.js for why that matters to check-sources.
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const failures = [];
const fail = (rule, detail) => failures.push({ rule, detail });
const notes = [];

/**
 * ---- HOW AN EXPORT IS RECOGNISED, AND WHY NOT BY ITS WORDS ----
 *
 * The first version of this scanned every file for the words `strandStates`,
 * `learnerName`, `reviewItems` and so on, and failed a file carrying two or
 * more.
 *
 * IT FAILED THE FIRST REAL BUILD, on four files, ALL OF THEM CORRECT.
 * `dist/assets/index-*.js` is the compiled app, and the app is FULL of those
 * words — they are its own table and field names, sitting in the Dexie schema
 * and the export routine. The check was reading the code that HANDLES her data
 * and calling it her data.
 *
 * That is the anti-pattern this project has now hit five times: a check that
 * fails correct content teaches whoever hits it to reach for the check instead
 * of the content. Worse here than usual — the one thing this check must never
 * do is get ignored.
 *
 * So it identifies an export STRUCTURALLY: the file parses as JSON and says it
 * is one. Compiled JavaScript cannot pass that test no matter what words are in
 * it. A name-based rule catches the second realistic case — a backup dropped
 * into the folder by hand under an obvious name.
 */
function isHerExport(file) {
  // 1. Structural. A real export is JSON and names itself.
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    if (data && typeof data === 'object' && data.app === 'Petal & Pestle Academy') {
      const rows =
        (Array.isArray(data.answers) ? data.answers.length : 0) +
        (Array.isArray(data.strandStates) ? data.strandStates.length : 0);
      return { hit: true, why: `a Petal & Pestle export carrying ${rows} of her rows` };
    }
  } catch {
    // not JSON — fall through
  }

  // 2. By name. A backup carried in by hand and forgotten.
  const base = file.split(/[\\/]/).pop().toLowerCase();
  if (base.endsWith('.json') && /(export|backup)/.test(base)) {
    return { hit: true, why: `named like a backup (${base})` };
  }

  return { hit: false };
}

/** Every file under a folder, recursively. */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function scan(folder, rule, why) {
  const dir = resolve(ROOT, folder);
  if (!existsSync(dir)) {
    notes.push(`${folder}/ does not exist — nothing to scan`);
    return;
  }
  const files = walk(dir);
  let hits = 0;
  for (const file of files) {
    const verdict = isHerExport(file);
    if (verdict.hit) {
      hits += 1;
      fail(rule, `${relative(ROOT, file)} is ${verdict.why}. ${why}`);
    }
  }
  notes.push(`${folder}/: ${files.length} file(s) scanned, ${hits} carrying her data`);
}

// ---- 1. public/ — copied verbatim into the built site ----------------------

scan(
  'public',
  'no-personal-data-in-public',
  'Everything in public/ is copied into dist/ and published. Move it to local/, ' +
    'which Vite does not know about.'
);

// ---- 2. dist/ — what actually gets uploaded --------------------------------

scan(
  'dist',
  'no-personal-data-in-dist',
  'This is the folder that gets dragged to a host. Delete dist/ and build again ' +
    'before uploading anything.'
);

// ---- 3. the dev-only route still has a file to serve -----------------------
//
// Not a privacy rule — a "did the fix quietly break the feature" rule. The
// Grown-Up Corner offers a green "Load her latest export" button in development
// and it reads from local/. If the file is gone, the button is dead and nothing
// would say so.

const LOCAL_EXPORT = resolve(ROOT, 'local/her-latest-export.json');
if (!existsSync(LOCAL_EXPORT)) {
  notes.push(
    'local/her-latest-export.json is not there — the dev-only "Load her latest ' +
      'export" button will find nothing. Harmless, and worth knowing.'
  );
} else {
  if (!isHerExport(LOCAL_EXPORT).hit) {
    fail(
      'local-export-is-really-an-export',
      'local/her-latest-export.json does not look like a Petal & Pestle export. ' +
        'Either it is the wrong file or the export format changed.'
    );
  } else {
    notes.push('local/her-latest-export.json is present and is a real export');
  }
}

// ---- 4. the dev-only guard is still in place -------------------------------
//
// Asserted by reading the source as TEXT, the same way check-delivery asserts
// the video sits above the prose. The privacy of this file rests on two lines:
// `apply: 'serve'` in the Vite plugin and `import.meta.env.DEV` in the panel.
// Delete either and her data goes back into the build with everything green.

/**
 * Comments blanked, so an assertion cannot be satisfied by the prose that
 * EXPLAINS it.
 *
 * Both guards below failed their negative test the first time for exactly that
 * reason: vite.config.js explains `apply: 'serve'` in a comment, and the panel
 * explains `import.meta.env.DEV` in a comment. Deleting the real line left the
 * words behind and the check stayed green.
 *
 * That is the v3.62 failure — "a check that greps a component instead of
 * calling it", one of which "matched the comments explaining the decision it
 * was testing" — arriving again in a new file. Caught by the negative test,
 * which is what negative tests are for.
 */
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((line) => {
      const i = line.indexOf('//');
      return i === -1 ? line : line.slice(0, i);
    })
    .join('\n');
}

const VITE_CONFIG = codeOnly(readFileSync(resolve(ROOT, 'vite.config.js'), 'utf8'));
if (!VITE_CONFIG.includes("apply: 'serve'")) {
  fail(
    'dev-only-plugin-guard',
    "vite.config.js no longer says apply: 'serve' on the local-export plugin. " +
      'Without it the middleware can run during a build.'
  );
}

const PANEL = codeOnly(
  readFileSync(resolve(ROOT, 'src/components/Parent/ParentDashboard.jsx'), 'utf8')
);
const fetchAt = PANEL.indexOf('/her-latest-export.json');
if (fetchAt === -1) {
  notes.push('ParentDashboard no longer fetches the local export at all');
} else {
  const before = PANEL.slice(Math.max(0, fetchAt - 400), fetchAt);
  if (!before.includes('import.meta.env.DEV')) {
    fail(
      'dev-only-fetch-guard',
      'ParentDashboard fetches /her-latest-export.json without an ' +
        'import.meta.env.DEV guard directly above it. The published app would ask ' +
        'for her data file by name.'
    );
  }
}

// ---- 5. if dist/ exists, is it the folder that should be uploaded? ---------
//
// THE TRAP THIS CATCHES. A host needs index.html at the top of whatever folder
// it is given, and THIS PROJECT HAS TWO of them.
//
//   index.html       at the project root — the SOURCE template. It points at
//                    /src/main.jsx, which is raw JSX no browser can run.
//   dist/index.html  written by `npm run build` — points at the compiled files.
//
// Drag the project folder to Netlify and it is ACCEPTED, because an index.html
// is there. The site then loads a blank page, because the browser asks for
// /src/main.jsx and gets a file it cannot execute. It looks like the upload
// worked and it did not, which is the worst kind of failure to debug from a
// Chromebook with a nine-year-old waiting.
//
// So: if a dist/ is sitting there, say whether it is uploadable.

const DIST = resolve(ROOT, 'dist');
if (existsSync(DIST)) {
  const index = join(DIST, 'index.html');
  if (!existsSync(index)) {
    fail(
      'dist-has-an-index',
      'dist/ exists but has no index.html. A host has nothing to serve. Run npm run build again.'
    );
  } else {
    const html = readFileSync(index, 'utf8');
    if (html.includes('/src/')) {
      fail(
        'dist-index-is-built-not-source',
        'dist/index.html still points at /src/ — that is the SOURCE template, not a build. ' +
          'Uploading it gives a blank page. Run npm run build.'
      );
    }
    if (!/assets\//.test(html)) {
      fail(
        'dist-index-references-built-assets',
        'dist/index.html references no assets/ file. It does not look like a finished build.'
      );
    }
    if (failures.every((f) => !f.rule.startsWith('dist-'))) {
      notes.push('dist/index.html looks like a real build — this is the folder to upload');
    }
  }
} else {
  notes.push('no dist/ yet — run npm run build, then upload the dist folder (not this one)');
}

// ---------------------------------------------------------------------------
// ---- GIT, AND WHY IT IS STRICTER THAN public/ ---- v3.77
//
// Gigi, Aug 24 2026: "I want to do this through github to Netlify."
//
// ⚠️ AND THE REPOSITORY IS PUBLIC. Her call, made knowing the trade.
//
// The v3.72 rule was "nothing personal may sit in public/". Git needs a harder
// one, because GIT KEEPS HISTORY: committing a file once and deleting it in
// the next commit does NOT remove it. It stays in the repository for ever, in
// every clone anybody has taken, and a public repo is scraped by machines
// within hours. THERE IS NO TAKING IT BACK — which is exactly what made the
// public/ mistake survivable and this one not.
//
// There were THIRTEEN copies of her export in this folder on the day the repo
// was set up. Two inside the project, eleven in _to_delete/.
//
// ---- WHAT THIS SECTION ASSERTS ----
//
//   1. A .gitignore exists at all. Without one, `git add .` takes everything.
//   2. Every file on disk that IS her export would be ignored by it.
//   3. The specific lines that make that true are present — asserted by NAME,
//      because a rule that only holds by accident is not a rule.
//   4. claude/ is excluded, because it holds a full educational assessment of
//      a named nine-year-old. See the note on that rule below.
//   5. node_modules and dist are excluded.
//
// ---- WHAT IT CANNOT DO, STATED SO IT IS NOT ASSUMED ----
//
//   · It cannot read git. There may be no repository yet, and this check must
//     work before `git init` as well as after. It reasons about what
//     .gitignore WOULD exclude, not about what git has actually staged.
//   · It cannot un-commit anything. If her data has already been pushed once,
//     no check can help — the repository has to be deleted and remade.
//   · It cannot tell you whether the repo SHOULD be public.
// ---------------------------------------------------------------------------

{
  const IGNORE_PATH = resolve(ROOT, '.gitignore');

  if (!existsSync(IGNORE_PATH)) {
    fail(
      'gitignore-exists',
      'there is no .gitignore. `git add .` would commit her export, her diagnostic results, ' +
        'and node_modules — and a public repository cannot be un-published.'
    );
  } else {
    const ignore = readFileSync(IGNORE_PATH, 'utf8');
    const lines = ignore
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));

    /**
     * Does .gitignore cover this path? Deliberately SIMPLE and deliberately
     * PESSIMISTIC — it understands a bare directory name and a `*name*` glob,
     * and nothing cleverer. A checker that tried to reimplement git's matching
     * rules would be a second, wrong copy of them; when in doubt this says NO
     * and something has to be spelled out, which is the safe direction to be
     * wrong in.
     */
    const isIgnored = (rel) => {
      const parts = rel.split('/');
      const base = parts[parts.length - 1];
      return lines.some((line) => {
        const pat = line.replace(/\/$/, '');
        if (!pat.includes('*')) return parts.includes(pat) || base === pat;
        const rx = new RegExp('^' + pat.split('*').map((x) => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
        return rx.test(base);
      });
    };

    // ---- 2. every copy of her data on disk would be left out ----
    const SKIP = new Set(['node_modules', '.git', 'dist']);
    const walk = (dir, out = []) => {
      for (const name of readdirSync(dir)) {
        if (SKIP.has(name)) continue;
        const full = join(dir, name);
        let st;
        try {
          st = statSync(full);
        } catch {
          continue;
        }
        if (st.isDirectory()) walk(full, out);
        else if (name.toLowerCase().endsWith('.json') && st.size < 2_000_000) out.push(full);
      }
      return out;
    };

    let hers = 0;
    for (const file of walk(ROOT)) {
      const found = isHerExport(file);
      if (!found.hit) continue;
      hers += 1;
      const rel = relative(ROOT, file).split('\\').join('/');
      if (!isIgnored(rel)) {
        fail(
          'her-data-would-be-committed',
          `${rel} is ${found.why}, and .gitignore does not exclude it. ` +
            `A public commit cannot be taken back — the file stays in the history for ever.`
        );
      }
    }
    notes.push(`${hers} file(s) on disk are her export — every one excluded from git`);

    // ---- 3 and 4. the rules are present BY NAME ----
    //
    // Assertion 2 passes today because these lines exist. Deleting one could
    // leave it passing tomorrow simply because the matching file had been
    // moved — a guard that holds by luck, which v3.76 is the whole lesson
    // about. So the lines themselves are required.
    const REQUIRED = [
      { pat: 'local/', why: 'local/her-latest-export.json is her live record' },
      { pat: '_to_delete/', why: 'it held eleven copies of her export' },
      { pat: 'node_modules/', why: '59MB, and Netlify installs it itself' },
      { pat: 'dist/', why: 'Netlify builds it, and dist/ has carried her export before' },
      {
        pat: 'claude/',
        why:
          'it holds azianna-diagnostic-results.md — a full educational assessment of a named ' +
          'nine-year-old, her measured levels and the item detail behind them — plus her raw ' +
          'backup. TO PUBLISH IT ANYWAY: remove the line here AND in .gitignore, together, ' +
          'so it is a decision somebody makes rather than a line that got tidied away.'
      }
    ];
    for (const r of REQUIRED) {
      if (!lines.includes(r.pat)) {
        fail('gitignore-keeps-its-rules', `.gitignore no longer excludes \`${r.pat}\` — ${r.why}`);
      }
    }

    // ---- the build command runs the checks before it publishes ----
    const TOML = resolve(ROOT, 'netlify.toml');
    if (!existsSync(TOML)) {
      notes.push('no netlify.toml — the site is still deployed by dragging dist/ by hand');
    } else {
      const toml = readFileSync(TOML, 'utf8');
      const m = toml.match(/command\s*=\s*.([^\u0022\u0027]+)./);
      if (!m) {
        fail('netlify-has-a-build-command', 'netlify.toml has no build command');
      } else if (!/run check\s*&&/.test(m[1])) {
        fail(
          'netlify-runs-the-checks-first',
          `the Netlify build command is "${m[1]}" — it does not run \`npm run check &&\` first, ` +
            `so a red check would publish to Azianna anyway and the dashboard would look normal.`
        );
      } else {
        notes.push('Netlify runs all the checks before it builds — a red check cannot publish');
      }
    }
  }
}

// ---- report ----------------------------------------------------------------

console.log('\nPetal & Pestle — publish safety');
console.log('Would uploading this folder put any of her work on the internet?\n');
for (const n of notes) console.log(`  ${n}`);
console.log(
  '\n  NOT TESTED HERE: whether you SHOULD publish, or anything outside\n' +
    '  public/ and dist/. See the header.\n'
);

if (failures.length === 0) {
  console.log('Nothing of hers is in the publishable folders.\n');
  process.exit(0);
}

console.error(`FAILED — ${failures.length}\n`);
for (const f of failures) console.error(`  [${f.rule}] ${f.detail}`);
console.error('');
process.exit(1);
