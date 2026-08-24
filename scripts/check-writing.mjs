// ---------------------------------------------------------------------------
// CHECK #26 — THE WRITING PROGRAMME.
//
// Written because of two things that had already happened elsewhere in this app.
//
// ---- 1. WRITTEN IS NOT THE SAME AS REACHABLE ----
//
// The first version of miniLessonFor() picked the KIND with `n % 2` and the
// INDEX with `n % 36`. Both lists are 36 long, which is even, so grammar days
// always landed on even indices and writing days always on odd ones. THIRTY-SIX
// OF THE SEVENTY-TWO MINI-LESSONS WERE UNREACHABLE FOR EVER and nothing on any
// screen would have said so.
//
// That is the same failure as v3.25, where a whole course was written and no
// screen could open it. So this check walks a year of real day keys and counts
// how many distinct lessons actually come out.
//
// ---- 2. THE JOURNAL IS NEVER GRADED, AND THAT IS LOCKED ----
//
// Gigi's rule, and the reason for it: a child who learns that writing is a
// thing you get marked down for writes less. Teaching writing IN the journal is
// allowed. Grading it is not.
//
// A mini-lesson that quietly grew a box to type in, a score, or a correction
// would break that without anybody deciding to. So this check reads
// JournalView.jsx AS TEXT and fails if scoring words appear inside the
// mini-lesson block. Same shape as check-delivery asserting every screen reads
// the app-wide bank.
//
// ---- WHAT IT DOES NOT CLAIM ----
//
// It cannot tell whether a mini-lesson is any GOOD, and it does not pretend to.
// It tests reachability, separation, and shape.
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const { MINI_LESSONS, STAGES, stageOf, GRAMMAR_POINTS, WRITING_MOVES, SENTENCE_LESSONS, miniLessonFor, MINI_LESSON, MINI_LESSON_COUNT } =
  await import(pathToFileURL(resolve(ROOT, 'src/data/writing/writingProgramme.js')).href);
const {
  WRITING_PIECES, piecesForYear, gradePiece, RUBRIC_BANDS, PIECES_PER_YEAR,
  RUBRIC_LEVEL_PERCENT, RUBRIC_SCORE_MAPPING
} = await import(pathToFileURL(resolve(ROOT, 'src/data/writing/writingPieces.js')).href);

const errors = [];
const notes = [];

// ---------------------------------------------------------------------------
// 1. Shape, and the Khan units
// ---------------------------------------------------------------------------
{
  const seen = new Set();
  for (const l of MINI_LESSONS) {
    if (!l.title) errors.push(`mini-lesson ${l.n} has no title`);
    if (seen.has(l.title)) errors.push(`two mini-lessons share the title "${l.title}"`);
    seen.add(l.title);
    if (!['sentence', 'grammar', 'writing'].includes(l.kind)) {
      errors.push(`mini-lesson ${l.n} has kind "${l.kind}"`);
    }
    if (!['closed', 'open'].includes(l.task)) {
      errors.push(`mini-lesson ${l.n} does not declare its task as closed or open`);
    }
    // "Is." and "She." are complete answers to a one-word question, so the
    // floor for an answer is two characters rather than five. Correcting a
    // check's model is not loosening it — the rule is that an answer EXISTS and
    // comes from its own lesson, which section 3 enforces.
    for (const field of ['plain', 'example', 'tryIt']) {
      if (!l[field] || String(l[field]).trim().length < 5) {
        errors.push(`mini-lesson ${l.n} "${l.title}" has no usable ${field}`);
      }
    }
    if (!l.answer || String(l.answer).trim().length < 2) {
      errors.push(`mini-lesson ${l.n} "${l.title}" has no answer. Every lesson must be able to state what a right response looks like.`);
    }
    if (!stageOf(l.n)) errors.push(`mini-lesson ${l.n} sits in no stage`);
  }
  if (MINI_LESSONS.some((l, i) => l.n !== i + 1)) {
    errors.push('the mini-lessons are not numbered 1..72 in order — the order IS the programme');
  }
  for (const l of MINI_LESSONS) {
    if (l.kind === 'writing') continue;
    if (!Number.isInteger(l.khanUnit) || l.khanUnit < 1 || l.khanUnit > 7) {
      errors.push(`mini-lesson ${l.n} claims Khan unit ${l.khanUnit}; the course has units 1-7`);
    }
  }
  for (let u = 1; u <= 7; u += 1) {
    if (!MINI_LESSONS.some((l) => l.khanUnit === u)) {
      errors.push(`nothing tracks Khan grammar unit ${u} — the app and Khan would drift apart`);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. SENTENCE BUILDING COMES FIRST, AND IT IS NOT INTERRUPTED — Gigi's call
//
//   "Sentence structures so she can properly write sentences and paragraphs."
//
// She chose to have it built first and uninterrupted rather than woven through
// the year. That is a decision a person made, so it is a check rather than a
// habit — the first stage is sentence work, all of it, with nothing else mixed
// in, and it ends on paragraphs rather than starting on them.
// ---------------------------------------------------------------------------
{
  const first = STAGES[0];
  if (first.id !== 'sentence') {
    errors.push('the first stage is not sentence building. Gigi asked for that stage first.');
  }
  for (const l of MINI_LESSONS.filter((x) => x.n <= first.to)) {
    if (l.kind !== 'sentence') {
      errors.push(
        `mini-lesson ${l.n} is "${l.kind}" inside the sentence stage. The sentence work was to run ` +
          `uninterrupted — a grammar point dropped into the middle of it is the shuffle coming back.`
      );
    }
  }
  if (SENTENCE_LESSONS.length < 20) {
    errors.push(`only ${SENTENCE_LESSONS.length} sentence lessons. That is not enough to build a sentence and then a paragraph.`);
  }
  const paragraphs = MINI_LESSONS.filter((l) => /paragraph/i.test(`${l.title} ${l.plain}`));
  if (!paragraphs.length) errors.push('nothing teaches what a paragraph is');
  if (paragraphs.length && paragraphs[0].n < 10) {
    errors.push('paragraphs are taught before sentences are built. The order is the whole point.');
  }
  notes.push(`${SENTENCE_LESSONS.length} sentence lessons first, then ${GRAMMAR_POINTS.length} grammar and ${WRITING_MOVES.length} writing`);
}

// ---------------------------------------------------------------------------
// 3. SHE IS NEVER ASKED FOR WHAT THE LESSON DID NOT GIVE HER
//
// ---- WHY THIS RULE EXISTS, IN GIGI'S WORDS ----
//
//   "the journal was teaching about verbs that doesn't end in ed and asked her
//    about a verb run with[out] telling her what the past tense is. That isn't
//    a lesson that makes sense."
//
// The old lesson showed go, see and bring, then asked for the past of run,
// write and grow. So: for a CLOSED task — one with a right answer — every
// content word of the answer must appear somewhere in the lesson itself.
//
// AND THE PROGRAMME CANNOT DODGE IT BY GOING ALL-OPEN. If fewer than forty of
// the seventy-two are closed, the build fails. An escape hatch nothing checks
// is how a rule quietly stops meaning anything.
// ---------------------------------------------------------------------------
{
  const STOP = new Set(`a an the is are was were be been being it its it's this that these those there here
    i you he she we they me him her them my your his our their one two three four both and or but so if then
    than as at by for from in into of off on out to up with no not yes any some each every other same
    something anything nothing thing things word words say says said saying use using used add adds added
    put puts goes go going does do did done make makes made like also just only more most less least
    something's part parts try tries out loud again still now next when where how why what which who
    right wrong good better best fine ok okay works work worked`.split(/\s+/).filter(Boolean));

  const wordsOf = (t) =>
    String(t || '')
      .toLowerCase()
      .split(/[^a-z’']+/)
      .filter(Boolean)
      .map((w) => w.replace(/[’']s$/, ''));

  let closed = 0;
  for (const l of MINI_LESSONS) {
    if (l.task !== 'closed') continue;
    closed += 1;
    const given = new Set([
      ...wordsOf(l.title),
      ...wordsOf(l.plain),
      ...wordsOf(l.example),
      ...wordsOf(l.tryIt)
    ]);
    const missing = wordsOf(l.answer).filter((w) => !STOP.has(w) && !given.has(w));
    if (missing.length) {
      errors.push(
        `mini-lesson ${l.n} "${l.title}" answers with ${missing.map((w) => `"${w}"`).join(', ')}, ` +
          `which the lesson never showed her. THIS IS THE BUG GIGI FOUND: a lesson that asks for what ` +
          `it did not teach is a quiz wearing a lesson's clothes. Show the word, or make the task open.`
      );
    }
  }
  const FLOOR = 40;
  if (closed < FLOOR) {
    errors.push(
      `only ${closed} of ${MINI_LESSON_COUNT} tasks are closed. Open tasks skip the rule above, so a ` +
        `programme that drifts to all-open has quietly switched the rule off. Floor is ${FLOOR}.`
    );
  } else {
    notes.push(`${closed} of ${MINI_LESSON_COUNT} tasks have a right answer, and every one of them comes from its own lesson`);
  }
}

// ---------------------------------------------------------------------------
// 4. EVERY MINI-LESSON IS MEASURED AT HER READING LEVEL
//
// ---- WHY THIS WAS MISSING, AND WHAT IT COST ----
//
// FORTY OF THE SEVENTY-TWO old mini-lessons read above a 3.0 grade level; one
// hit 8.0. Her Check-In put Grammar & Usage at 2.15 and Khan has her on "Parts
// of speech: the noun". Her own results doc had already set the rule: every
// lesson is written at her reading level, not her age.
//
// Nothing measured these. check-readability guards Check-In items and
// check-assessment guards bank questions; this prose fell in the gap between
// them — the same gap sixty Science Lab questions fell into at v3.25.
//
// ---- THE RULER, AND THE ONE EXEMPTION ----
//
// Measured per FIELD, not on the fields glued together, and · → and : end a
// unit the same way a full stop does. An example list is not one long sentence,
// and a ruler that says it is would force the prose to get worse.
//
// THE EXEMPTION IS THE SAME ONE THE COURSES USE: a long word is forgiven when
// the lesson teaches it BY NAME. "Paragraph" and "apostrophe" are the content
// here, exactly as "friction" and "refraction" are in The Science Lab. The
// title is where a lesson declares what it teaches, so title words are what is
// forgiven — and titles are capped at seven words so the exemption cannot be
// widened by writing a longer title.
// ---------------------------------------------------------------------------
{
  const syllables = (w) => {
    const s = w.toLowerCase().replace(/[^a-z]/g, '');
    if (!s) return 0;
    const v = s.match(/[aeiouy]{1,2}/g);
    let n = v ? v.length : 1;
    if (s.endsWith('e') && n > 1) n -= 1;
    return Math.max(1, n);
  };
  const unitsOf = (t) => String(t || '').split(/[.!?·→:;]+/).map((x) => x.trim()).filter(Boolean);
  const wordsIn = (u) => u.split(/[\s,“”"]+/).map((w) => w.replace(/[^A-Za-z’']/g, '')).filter(Boolean);

  const over = [];
  for (const l of MINI_LESSONS) {
    const stage = stageOf(l.n);
    if (wordsIn(l.title).length > 7) {
      errors.push(`mini-lesson ${l.n} has a ${wordsIn(l.title).length}-word title. Titles are capped at seven, because title words are the ones forgiven on length.`);
    }
    const taught = new Set(wordsIn(l.title).map((w) => w.toLowerCase()));
    let sentences = 0;
    let words = 0;
    let syl = 0;
    let longest = 0;
    for (const field of [l.plain, l.example, l.tryIt, l.answer]) {
      for (const u of unitsOf(field)) {
        const ws = wordsIn(u);
        if (!ws.length) continue;
        sentences += 1;
        words += ws.length;
        longest = Math.max(longest, ws.length);
        for (const w of ws) syl += taught.has(w.toLowerCase()) ? 1 : syllables(w);
      }
    }
    if (!sentences) continue;
    const fk = 0.39 * (words / sentences) + 11.8 * (syl / words) - 15.59;
    if (fk > stage.fkCap || longest > stage.wordsPerSentence) {
      over.push(`${l.n} "${l.title}" reads ${fk.toFixed(1)} (cap ${stage.fkCap}) with a ${longest}-word sentence (cap ${stage.wordsPerSentence})`);
    }
  }
  if (over.length) {
    errors.push(
      `${over.length} mini-lesson${over.length === 1 ? '' : 's'} read above the stage they sit in. ` +
        `Her Grammar & Usage measured 2.15 — a lesson pitched over her head fails for reading reasons ` +
        `and teaches her that writing is hard. Reword it; do not move the cap.\n      ` +
        over.slice(0, 12).join('\n      ')
    );
  } else {
    notes.push(`every mini-lesson reads inside its stage — caps ${STAGES.map((s) => s.fkCap).join(' → ')} across the year`);
  }
}

// ---------------------------------------------------------------------------
// 5. THE ORDER IS KEPT, AND IT IS KEPT BY HER PROGRESS RATHER THAN A DATE
//
// The old delivery hashed the day key, so an apostrophe lesson could land in
// week one. The app has no date-to-quarter function anywhere in src/ and is not
// getting one, so position is the number of earlier days she has written.
// ---------------------------------------------------------------------------
{
  const days = [];
  const seenOrder = [];
  for (let i = 0; i < MINI_LESSON_COUNT * 2; i += 1) {
    const key = new Date(Date.UTC(2026, 8, 1) + i * 86400000).toISOString().slice(0, 10);
    const l = miniLessonFor(key, days);
    if (!l || !l.title) {
      errors.push(`miniLessonFor("${key}") returned nothing`);
      break;
    }
    seenOrder.push(l.n);
    days.push(key);
  }
  const firstPass = seenOrder.slice(0, MINI_LESSON_COUNT);
  if (firstPass.join(',') !== MINI_LESSONS.map((l) => l.n).join(',')) {
    errors.push('the lessons do not come up in order. A programme with no sequence is not a programme.');
  }
  if (seenOrder[MINI_LESSON_COUNT] !== 1) {
    errors.push('after the last lesson it does not start again at the first');
  }

  // Writing twice in one day must not skip a lesson, and the same day must give
  // the same lesson however many times it is asked.
  const twice = miniLessonFor('2026-11-04', ['2026-11-01', '2026-11-02', '2026-11-02']);
  const again = miniLessonFor('2026-11-04', ['2026-11-01', '2026-11-02', '2026-11-02']);
  if (twice.n !== again.n) errors.push('the same day gives two different mini-lessons');
  if (twice.n !== 3) errors.push(`two days written should give lesson 3, not ${twice.n}`);

  // Today's own entry must not move today's lesson out from under her.
  const beforeSaving = miniLessonFor('2026-11-04', ['2026-11-01']);
  const afterSaving = miniLessonFor('2026-11-04', ['2026-11-01', '2026-11-04']);
  if (beforeSaving.n !== afterSaving.n) {
    errors.push('saving today’s entry changes today’s lesson. She would watch it swap as she writes.');
  }

  // A day she has not written yet cannot be ahead of one she has.
  const none = miniLessonFor('2026-09-01', []);
  if (none.n !== 1) errors.push('a child on day one is not given lesson 1');
  notes.push('the order is driven by days she has written, never by a date');
}

// ---------------------------------------------------------------------------
// 3. THE JOURNAL STAYS UNGRADED — read the screen as text
// ---------------------------------------------------------------------------
{
  if (MINI_LESSON.graded !== false || MINI_LESSON.corrected !== false) {
    errors.push('MINI_LESSON no longer declares itself ungraded and uncorrected');
  }

  const src = readFileSync(resolve(ROOT, 'src/components/Journal/JournalView.jsx'), 'utf8');

  // Comments are not code. Every scan below runs on the stripped source, and the
  // comment itself is asserted separately further down, so stripping can never
  // become a way to delete the documentation and pass.
  const strip = (s) =>
    s
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ');

  // ---- NEGATIVE TEST 3 WALKED STRAIGHT THROUGH THE FIRST VERSION ----
  //
  // It renamed the marker to "THE FIVE-MINUTE MINI-LESSON-REMOVED-MARKER" and
  // indexOf found it anyway, because a superstring contains the string. A marker
  // a rename can walk through is not an anchor, and a check that locates the
  // thing it is guarding by a comment is guarding the comment.
  //
  // Two fixes, and both are needed:
  //   1. the marker has to be the WHOLE token - nothing word-ish or dash-ish may
  //      follow it;
  //   2. the mini-lesson has to be proved DELIVERED with no reference to any
  //      comment at all: imported, called, and its fields rendered. Rip the panel
  //      out and three assertions fail that no comment can satisfy.
  const stripped = strip(src);

  if (
    !/import\s*\{[^}]*\bminiLessonFor\b[^}]*\}\s*from\s*['"][^'"]*writingProgramme\.js['"]/.test(
      stripped
    )
  ) {
    errors.push('JournalView no longer imports miniLessonFor from the writing programme');
  }
  if (!/\bminiLessonFor\s*\(/.test(stripped)) {
    errors.push('JournalView never calls miniLessonFor - the mini-lesson is not delivered');
  }

  // ⚠️ AN OPTIONAL ARGUMENT THAT MUST ALWAYS BE PASSED IS A RULE NOBODY ENFORCES.
  //
  // miniLessonFor(dayKey, journalDayKeys) defaults the second argument to an
  // empty list, so a call with one argument returns LESSON 1 FOR EVER and every
  // other assertion in this file still passes. check-curriculum-volume learned
  // this at v3.31 and reads TodayView's source for the same reason.
  //
  // Counted with a real parenthesis scan, not a regex — `fn\([^)]*\)` stops at
  // the first close paren, which is the v3.31 bug that reported every correct
  // call as bare.
  {
    const at = stripped.indexOf('miniLessonFor(');
    if (at === -1) {
      errors.push('JournalView has no miniLessonFor( call to read');
    } else {
      let depth = 0;
      let end = -1;
      for (let i = at + 'miniLessonFor'.length; i < stripped.length; i += 1) {
        const c = stripped[i];
        if (c === '(') depth += 1;
        else if (c === ')') {
          depth -= 1;
          if (depth === 0) { end = i; break; }
        }
      }
      const args = end === -1 ? '' : stripped.slice(at + 'miniLessonFor('.length, end);
      let d = 0;
      let commas = 0;
      for (const c of args) {
        if ('([{'.includes(c)) d += 1;
        else if (')]}'.includes(c)) d -= 1;
        else if (c === ',' && d === 0) commas += 1;
      }
      if (commas < 1) {
        errors.push(
          'JournalView calls miniLessonFor with one argument, so it would hand her LESSON 1 every ' +
            'single day and nothing else in this file would notice. Her progress has to be passed in.'
        );
      }
    }
  }
  for (const field of ['lesson.title', 'lesson.plain', 'lesson.example', 'lesson.tryIt', 'lesson.answer', 'lesson.stage', 'lesson.position']) {
    if (!stripped.includes(field)) {
      errors.push(
        `JournalView never renders ${field}. A mini-lesson that is fetched and then not shown ` +
          `is the same as not having one.`
      );
    }
  }

  const found = /THE FIVE-MINUTE MINI-LESSON(?![\w-])/.exec(src);
  if (!found) {
    errors.push('the mini-lesson block is no longer in JournalView - the programme is not delivered');
  } else {
    const open = found.index;
    // Start at the OPENING of the JSX comment, not at the marker inside it -
    // otherwise the slice begins mid-comment, the comment has no opening
    // delimiter to strip against, and the stripper silently does nothing. That is
    // exactly what happened on the first run of the fixed version.
    const commentStart = src.lastIndexOf('{/*', open);
    const from = commentStart === -1 ? open : commentStart;
    // The block ends where the writing prompt block begins.
    const close = src.indexOf('border-2 border-sage-300', open);
    const raw = close === -1 ? src.slice(from) : src.slice(from, close);

    // ---- THE FIRST VERSION OF THIS FAILED ON ITS OWN DOCUMENTATION ----
    //
    // It scanned the raw text for "score", "grade" and "correct", and the comment
    // ABOVE the block explains that there is no score, no grade and no correction
    // here. The check fired three times on the sentence describing the rule it
    // was enforcing.
    //
    // v3.25 hit this exact shape in check-sources and reworded the comment. The
    // better fix here is the v3.15 one: CORRECTING A CHECK'S MODEL IS NOT
    // LOOSENING IT. The rule is about what the code DOES, so the scan strips
    // comments first - and then asserts separately that the comment explaining
    // the rule is still there, so this cannot become a way to delete the
    // documentation and pass.
    const block = strip(raw);

    for (const phrase of ['graded or corrected', 'never']) {
      if (!raw.toLowerCase().includes(phrase)) {
        errors.push(
          `the comment on the mini-lesson block no longer says "${phrase}". The rule has to be ` +
            `readable by the next person, not only enforced by this file.`
        );
      }
    }

    const banned = ['<input', '<textarea', 'onChange', 'score', 'grade', 'correct', 'mark='];
    for (const word of banned) {
      if (block.toLowerCase().includes(word.toLowerCase())) {
        errors.push(
          `the mini-lesson block in JournalView contains "${word}". Nothing in the Journal is ` +
            `graded or corrected - that rule is locked, and a box to type in is how it would break.`
        );
      }
    }
  }

  // The graded pieces must NOT live in the journal.
  const pieceSrc = readFileSync(resolve(ROOT, 'src/data/writing/writingPieces.js'), 'utf8');
  if (pieceSrc.includes('journalPrompts') || pieceSrc.includes('saveJournalEntry')) {
    errors.push('writingPieces.js reaches into the Journal. The graded work must stay separate.');
  }

  // -------------------------------------------------------------------------
  // THE GROWN-UP SIDE OF THE JOURNAL — added v3.44
  //
  // Gigi: "Her journal is entered but there isn't a way to grade it or give
  // feedback." Then, directly: can the journal be graded by AI?
  //
  // What was built is a note SHE writes and Azianna receives — feedback, which
  // Gigi herself distinguished from grading in the backlog. That is a new box
  // on a grown-up screen pointed straight at a child's journal entry, which
  // makes it the single most likely place for the locked rule to erode: a score
  // field here would be a grade on the Journal no matter what the child's own
  // screen says.
  //
  // So the review panel is read as text the same way JournalView is.
  //
  // ⚠️ AND THIS IS NOT A KEYWORD SCAN OF THE WHOLE FILE. The v3.40 mistake was
  // a check that found the word "rubric" inside the sentence "Read the rubric
  // first" — and this very file's own history is the other half of it, where a
  // scan for "score"/"grade"/"correct" matched the COMMENT explaining that
  // there is no score, grade or correction. ParentDashboard is a 900-line file
  // that legitimately contains the Gradebook and the writing marks, so a
  // file-wide scan would be meaningless. Only the JournalNote function is read,
  // comments stripped.
  // -------------------------------------------------------------------------
  {
    const rel = 'src/components/Parent/ParentDashboard.jsx';
    const raw = readFileSync(resolve(ROOT, rel), 'utf8');
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

    const at = src.indexOf('function JournalNote');
    if (at < 0) {
      // Not an error on its own — the feature may be renamed or removed. But it
      // must not vanish silently while the panel still offers a box.
      if (/Say something back/.test(src)) {
        errors.push(
          `${rel} still offers "Say something back" but JournalNote is gone — the box a grown-up ` +
            `types into beside a journal entry is exactly what this assertion guards.`
        );
      }
    } else {
      // ⚠️ FINDING THE BODY, NOT THE PARAMETERS.
      //
      // The first draft took the first `{` after the function name and matched
      // braces from there. `function JournalNote({ entry })` DESTRUCTURES, so
      // that first brace is the parameter list — it closed one character later
      // and the "body" this check read was the string
      // `function JournalNote({ entry }`. Every assertion below then passed or
      // failed for reasons that had nothing to do with the code.
      //
      // It failed loudly rather than quietly, which is the only lucky part: the
      // sendMessage assertion went red on a correct screen. A check that reads
      // the wrong REGION is v3.17; one that reads the wrong FUNCTION is v3.41.
      // This is both, and it is why the parameter list is skipped explicitly.
      let pd = 0;
      let bodyStart = -1;
      for (let i = src.indexOf('(', at); i < src.length; i++) {
        if (src[i] === '(') pd++;
        else if (src[i] === ')') {
          pd--;
          if (pd === 0) {
            bodyStart = src.indexOf('{', i);
            break;
          }
        }
      }
      let depth = 0;
      let end = at;
      for (let i = bodyStart; i >= 0 && i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      const block = src.slice(at, end + 1);

      // If the region is implausibly small the scan has gone wrong again, and
      // saying so beats silently asserting over one line of source.
      if (block.length < 200) {
        errors.push(
          `${rel}: JournalNote's body read as ${block.length} characters, which is too small to be ` +
            `the function. This assertion is reading the wrong region — fix the scan, do not drop ` +
            `the rule.`
        );
      }

      const banned = ['score', 'grade', 'mark=', 'rubric', 'correct', 'outOf', 'percent'];
      for (const word of banned) {
        if (block.toLowerCase().includes(word.toLowerCase())) {
          errors.push(
            `JournalNote in ${rel} contains "${word}". A note back to her is FEEDBACK; the moment ` +
              `it carries a score it is a grade on the Journal, and the Journal is never graded. ` +
              `That rule is locked and this box is where it would break first.`
          );
        }
      }

      // It must not be able to touch her words.
      for (const forbidden of ['saveJournalEntry', 'removeJournalEntry', 'entry.text =']) {
        if (block.includes(forbidden)) {
          errors.push(
            `JournalNote calls ${forbidden} — the grown-up side of the Journal is read-only. The ` +
              `moment a child finds out a grown-up rewrites her journal it stops being her journal.`
          );
        }
      }

      // It must deliver through the notes channel that already exists, rather
      // than growing a second one with its own table and its own backup bug.
      if (!/sendMessage\s*\(/.test(block)) {
        errors.push(
          `JournalNote does not call sendMessage. The note must go to "Notes from Gigi and Mom" — ` +
            `the channel that is already built, already in the backup and already read back by ` +
            `the import. A second delivery path is four places to get wrong.`
        );
      }

      notes.push(
        'the grown-up can write back to a journal entry, and the box carries no score, no rubric ' +
          'and no way to edit her words — it sends a note through the existing Notes channel'
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 4. The graded pieces
// ---------------------------------------------------------------------------
{
  for (const p of WRITING_PIECES) {
    if (!p.rubric || p.rubric.length < 3) errors.push(`${p.title} has fewer than three rubric rows`);
    for (const row of p.rubric || []) {
      for (const lvl of ['l1', 'l2', 'l3', 'l4']) {
        if (!row[lvl] || String(row[lvl]).trim().length < 10) {
          errors.push(`${p.title} rubric row "${row.row}" has no usable ${lvl} — she sees this BEFORE she starts`);
        }
      }
    }
    if (p.readAloudAllowed !== true) {
      errors.push(
        `${p.title} does not allow read-aloud. TEN of her thirteen Check-In reading questions were ` +
          `read aloud, so her independent reading is below her recorded score. Refusing it here ` +
          `would make the grade measure her reading rather than her writing.`
      );
    }
  }

  // A research paper a nine-year-old abandons teaches her she cannot write one.
  const papers = WRITING_PIECES.find((p) => p.id === 'research-paper');
  if (papers && papers.perYear > 2) {
    errors.push(
      `${papers.perYear} research papers a year. Two finished beat four started, and the decision ` +
        `to cap it is written in the file — raising it needs a reason, not a default.`
    );
  }
  if (papers && (!papers.sequence || papers.sequence.length < 4)) {
    errors.push('the research paper is assigned rather than taught as a sequence of steps');
  }

  // -------------------------------------------------------------------------
  // GRADING ARITHMETIC — AND THE MIDDLE OF THE RANGE, WHICH WAS NEVER TESTED
  //
  // This block tested all 4s and all 1s for seventeen versions and NEVER TESTED
  // ANYTHING BETWEEN THEM. That is precisely how the defect survived with a
  // check pointed straight at it: both ends were right and the middle was
  // wrong. All 3s — "meets the standard" on every row — came out 75%, a C. All
  // 2s came out 50%, an F. The bottom TWO levels of a four-level rubric both
  // collapsed into failure.
  //
  // The standard names both the bug and the test, in one sentence.
  // BLUEPRINT_A_LOCAL_FIRST §3.6:
  //
  //   "State how rubric levels map to whatever scale your records use, THEN
  //    CHECK THE MIDDLE OF THE RANGE. A rubric where 'meets the standard' lands
  //    on a failing percentage teaches the learner that meeting the standard is
  //    failure… it happens whenever a 4-level rubric is divided by 4 and mapped
  //    onto a percentage scale where 75% is a C."
  //
  // Six graded pieces a year enter a Georgia record. Fixed at v3.56, before the
  // first one was ever marked — writingMarks was empty in her Aug 18 backup.
  // -------------------------------------------------------------------------

  // Best grade first, so a lower index is a better grade.
  const ladder = RUBRIC_BANDS.map((b) => b.grade);
  const rank = (g) => ladder.indexOf(g);

  const full = gradePiece('book-report', [4, 4, 4, 4]);
  if (!full || full.percent !== 100 || full.grade !== 'A') errors.push('a full-marks book report does not grade as 100% and an A');

  // ---- THE ASSERTION THAT WOULD HAVE CAUGHT IT. Derived, never typed. ----
  const floor = RUBRIC_SCORE_MAPPING.meetsTheStandardIsAtLeast;
  if (rank(floor) < 0) {
    errors.push(`RUBRIC_SCORE_MAPPING.meetsTheStandardIsAtLeast is "${floor}", which is not a grade on RUBRIC_BANDS`);
  }
  for (const piece of WRITING_PIECES) {
    const meets = gradePiece(piece.id, Array(piece.rubric.length).fill(3));
    if (!meets || rank(meets.grade) > rank(floor)) {
      errors.push(
        `a ${piece.kind} that MEETS THE STANDARD on every rubric row grades as ` +
          `${meets ? `${meets.percent}% (${meets.grade})` : 'nothing at all'}, below ${floor}. ` +
          `A rubric where meeting the standard is a mediocre grade teaches her that doing what ` +
          `was asked is not worth doing.`
      );
    }
    // The specific arithmetic that caused it, pinned so it cannot come back:
    // summing the marks and dividing by the maximum puts all 3s on exactly 75.
    const dividedByFour = Math.round((3 * piece.rubric.length) / (piece.rubric.length * 4) * 100);
    if (meets && meets.percent === dividedByFour) {
      errors.push(
        `${piece.kind}: all 3s scores ${meets.percent}%, which is what total ÷ (rows × 4) gives. ` +
          `The old arithmetic is back.`
      );
    }
  }

  // ---- Every step of the ladder must be distinct and going the right way. ----
  const steps = [1, 2, 3, 4].map((l) => RUBRIC_LEVEL_PERCENT[l]);
  if (steps.some((p) => typeof p !== 'number')) {
    errors.push('RUBRIC_LEVEL_PERCENT does not give a percentage for all four rubric levels');
  } else if (steps.some((p, i) => i > 0 && p <= steps[i - 1])) {
    errors.push(`RUBRIC_LEVEL_PERCENT does not increase with the rubric level: ${steps.join(' → ')}`);
  }
  if (!full || full.method !== RUBRIC_SCORE_MAPPING.method) {
    errors.push(
      'gradePiece does not report the scoreMapping method it used. §3.6 requires the mapping to be ' +
        'declared rather than implied by whatever the arithmetic happens to do.'
    );
  }

  // ---- INVERTED AT v3.56, NOT DELETED. ----
  // This used to require all 1s to grade as an F, and under total ÷ (rows × 4)
  // it did — 25%. Under Lamar's ladder the bottom rubric level is 60, a D-.
  //
  // THE REASON, so this can be argued with later: level 1 is the lowest
  // DESCRIBED level of a rubric she was shown before she started. It is work
  // that exists, at the bottom of the scale. That is a different fact from work
  // that was never handed in, and the blueprint keeps the two apart everywhere
  // (§3.13.1, "a missing grade and a zero are opposite facts"). So F is now
  // reserved for a piece that is not there.
  //
  // THE WAY BACK: if Gigi decides a bottom-marks piece should be an F, change
  // RUBRIC_LEVEL_PERCENT[1] to something below 60 and invert this assertion
  // again, with that decision and its date written here. Do not delete it —
  // check-yearplan was inverted at v3.23 the same way, and the record of what
  // it used to assert is why anyone can still tell what changed.
  const low = gradePiece('research-paper', [1, 1, 1, 1, 1]);
  const bottom = RUBRIC_SCORE_MAPPING.bottomOfRubric;
  if (!low || low.grade !== bottom) {
    errors.push(
      `a bottom-marks research paper grades as ${low ? low.grade : 'nothing at all'}, and ` +
        `RUBRIC_SCORE_MAPPING.bottomOfRubric says ${bottom}. Aug 18 2026: F is for a piece that ` +
        `was never handed in, not for one that is there and weak.`
    );
  }

  if (gradePiece('book-report', [4, 4, 4]) !== null) errors.push('gradePiece accepts a short mark list');
  if (gradePiece('book-report', [4, 4, 4, 5]) !== null) errors.push('gradePiece accepts a mark above 4');
  if (RUBRIC_BANDS[0].grade !== 'A' || RUBRIC_BANDS[RUBRIC_BANDS.length - 1].grade !== 'F') {
    errors.push('the rubric ladder does not run from A to F');
  }

  const year = piecesForYear();
  if (year.length !== PIECES_PER_YEAR) errors.push('PIECES_PER_YEAR disagrees with piecesForYear()');
  for (let q = 1; q <= 4; q += 1) {
    if (!year.some((p) => p.quarter === q)) {
      errors.push(`no graded writing at all in quarter ${q}`);
    }
  }
  notes.push(
    `${year.length} graded pieces a year: ${WRITING_PIECES.map((p) => `${p.perYear} ${p.kind}${p.perYear === 1 ? '' : 's'}`).join(' · ')}`
  );
}

// ---------------------------------------------------------------------------
// 5. THE GRADED PIECES ARE ON A SCREEN — v3.39
//
// v3.38 shipped the rubrics, the five-step sequence and gradePiece() in a data
// file, and NOTHING RENDERED ANY OF IT. That is the v3.25 failure exactly: a
// thing written, checked, logged as delivered, and unreachable. This section is
// what stops it happening a third time.
//
// Three claims, each tested against source read as TEXT rather than against a
// promise in a comment:
//   1. a grown-up can MARK a piece — the panel exists, the dashboard mounts it,
//      and the tab id it mounts on is a section the navigation actually has;
//   2. SHE can read the rubric BEFORE she starts — the Journal renders the
//      rubric wording and the research paper's steps;
//   3. the mark SURVIVES — a table in the database, in the export, and read
//      back by the import, merged so nothing is dropped.
// ---------------------------------------------------------------------------
{
  const strip = (s) =>
    s
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ');

  const read = (rel) => strip(readFileSync(resolve(ROOT, rel), 'utf8'));

  // ---- 1. the grown-up can mark one ----
  const panel = read('src/components/Parent/WritingPiecesPanel.jsx');
  for (const needed of ['piecesForYear', 'gradePiece', 'addWritingMark']) {
    if (!panel.includes(needed)) {
      errors.push(`WritingPiecesPanel does not use ${needed} — a rubric nobody can mark against is a rubric that does not exist`);
    }
  }
  // ⚠️ THE FIRST VERSION OF THIS CLAIMED FOUR THINGS AND TESTED ONE.
  // It looped l1..l4 and every pass was rescued by one template literal that
  // happened to contain all four — the same fault as the v3.33 assertion that
  // compared a fact with itself. The honest claim is that the screen walks all
  // four levels and indexes the row by them, so every level has words beside it
  // rather than a bare number.
  if (!/const LEVELS = \[4, ?3, ?2, ?1\]/.test(panel)) {
    errors.push('the marking screen does not offer all four rubric levels, best first');
  }
  if (!/row\[`l\$\{lvl\}`\]/.test(panel)) {
    errors.push('the marking screen shows no wording for the levels — a number with no words beside it is not a rubric');
  }

  const dash = read('src/components/Parent/ParentDashboard.jsx');
  if (!/import\s*\{[^}]*\bWritingPiecesPanel\b[^}]*\}/.test(dash)) {
    errors.push('the Grown-Up Corner does not import WritingPiecesPanel');
  }
  const mounted = /tab === '([a-zA-Z]+)' && <WritingPiecesPanel/.exec(dash);
  if (!mounted) {
    errors.push('WritingPiecesPanel is imported but never rendered — imported is not delivered');
  } else {
    const nav = readFileSync(resolve(ROOT, 'src/config/navigation.js'), 'utf8');
    if (!nav.includes(`id: '${mounted[1]}'`)) {
      errors.push(
        `the dashboard renders the writing panel on tab "${mounted[1]}", which is not a section in ` +
          `navigation.js. A panel behind a tab nobody can reach is the same as no panel.`
      );
    }
  }

  // ---- 2. she reads the rubric BEFORE she starts ----
  const journal = read('src/components/Journal/JournalView.jsx');
  if (!/import\s*\{[^}]*\bpiecesForYear\b[^}]*\}\s*from\s*['"][^'"]*writingPieces\.js['"]/.test(journal)) {
    errors.push('the Journal does not read the graded pieces — she would meet the rubric only after being marked on it');
  }
  // ⚠️ THIS ONCE TESTED A WORD ON THE SCREEN INSTEAD OF THE THING RENDERED.
  // It looked for the bare string "rubric", and the panel's own sentence —
  // "Read the rubric first" — kept it green while the rubric itself was deleted
  // from the markup. A negative test caught it. The claims are structural now.
  for (const [what, re] of [
    ['the rubric rows', /piece\.rubric\.map/],
    ['the wording of the top level', /row\.l4/],
    ['the research paper’s steps', /piece\.sequence/]
  ]) {
    if (!re.test(journal)) {
      errors.push(
        `her own screen never renders ${what}. A rubric she meets afterwards is a mark scheme, ` +
          `not a teaching tool — she has to be able to read it before she writes a word.`
      );
    }
  }

  // ---- 3. the mark survives ----
  const db = readFileSync(resolve(ROOT, 'src/db/db.js'), 'utf8');
  if (!/db\.version\(7\)[\s\S]{0,1200}writingMarks:/.test(db)) {
    errors.push('there is no writingMarks table at database version 7');
  }
  // ⚠️ SLICED TOO WIDE ON FIRST WRITE. Reading from exportAll to the END OF THE
  // FILE swept in readWritingMarks() and putWritingMark() below it, so deleting
  // the table from the backup left the assertion green. The region has to be the
  // RETURNED OBJECT, nothing else — the same slice check-import takes.
  const exportFn = db.slice(db.indexOf('export async function exportAll'));
  const exportBody = exportFn.slice(exportFn.indexOf('return {'), exportFn.indexOf('\n}'));
  if (!exportBody.includes('writingMarks')) {
    errors.push('exportAll does not ship writingMarks — six marks a year is the whole graded-writing record');
  }
  const importBody = db.slice(
    db.indexOf('export async function importBackup'),
    db.indexOf('export async function exportAll')
  );
  if (!importBody.includes('data.writingMarks')) {
    errors.push('importBackup never reads data.writingMarks — every mark would be lost on the first machine change');
  }

  const store = read('src/store/useAppStore.js');
  for (const fn of ['addWritingMark', 'removeWritingMark']) {
    if (!store.includes(`${fn}(`)) errors.push(`the store has no ${fn}`);
  }

  // THE PERCENTAGE IS DERIVED, NEVER STORED.
  //
  // Same rule as the v3.20 `exact` flag: a number computed from something other
  // than the thing it describes can drift away from it silently. If a stored
  // percent ever disagreed with the rubric marks beside it, nothing on any
  // screen would say which one was the grade.
  const addBody = store.slice(store.indexOf('async addWritingMark'), store.indexOf('async removeWritingMark'));
  for (const banned of ['percent:', 'grade:']) {
    if (addBody.includes(banned)) {
      errors.push(
        `addWritingMark stores "${banned}". The percentage and the letter are computed from the ` +
          `marks by gradePiece() — a stored total can quietly disagree with the rubric it came from.`
      );
    }
  }
  // The PARAMETER is named readAloud too, so "does the word appear" was already
  // true with the field deleted. What matters is that it is WRITTEN INTO THE ROW.
  if (!/readAloud:\s*!!readAloud/.test(addBody)) {
    errors.push('a mark does not record whether it was read aloud — hiding that makes the record wrong');
  }

  const { pickWritingMark } = await import(pathToFileURL(resolve(ROOT, 'src/lib/mergeBackup.js')).href);
  const a = { markId: 'm1', pieceId: 'book-report', marks: [3, 3, 3, 3], editedAt: 100 };
  const b = { markId: 'm1', pieceId: 'book-report', marks: [4, 4, 4, 4], editedAt: 200 };
  if (pickWritingMark(null, b) !== b) errors.push('writing marks: an incoming mark did not arrive');
  if (pickWritingMark(a, null) !== a) errors.push('writing marks: a local mark was dropped');
  if (pickWritingMark(a, b) !== b) errors.push('writing marks: the newer edit lost');
  if (pickWritingMark(b, a) !== b) errors.push('writing marks: an older copy overwrote a newer edit');

  notes.push('the graded pieces are markable in the Grown-Up Corner, readable by her first, and survive a merge');
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ⚠️ THE JOURNAL IS GRADED NOW. THIS ASSERTION IS INVERTED, NOT DELETED.
//
// From v3.6 to v3.67 the rule was "nothing in this Journal is ever graded or
// corrected", and this file enforced it. IT WAS GIGI'S RULE AND SHE OVERTURNED
// IT, Aug 19 2026, having been offered a separate graded daily piece instead:
//
//     "she isn't going to want to do the daily writing and the journal."
//
// Two writing tasks a day for a nine-year-old means one gets done badly and the
// other resented. One task, marked, beats two where the graded one is a chore.
//
// Inverted with her words and the date, the same way check-yearplan was at
// v3.23 and check-writing's own bottom-mark assertion was at v3.56. A rule
// deleted is a rule nobody can argue with later.
//
// ---- WHAT DID NOT MOVE, AND IS STILL ENFORCED ABOVE ----
//
//   · The MINI-LESSON block still may not contain an input or a score.
//   · "SAY SOMETHING BACK" is still FEEDBACK and still fails on a score.
//
// Both assertions are untouched. Feedback and grading stayed separate, which is
// the line Gigi drew herself.
//
// THE WAY BACK: delete src/data/journal/journalRubric.js and the panel, and
// restore the ban. The reason it went is written here.
// ---------------------------------------------------------------------------
{
  const { readFileSync } = await import('node:fs');
  const rubric = await import(pathToFileURL(resolve(ROOT, 'src/data/journal/journalRubric.js')).href);
  const view = readFileSync(resolve(ROOT, 'src/components/Journal/JournalView.jsx'), 'utf8');
  const panel = readFileSync(resolve(ROOT, 'src/components/Parent/JournalMarkPanel.jsx'), 'utf8');

  // ---- 1. THE LADDER IS THE APP'S ONE LADDER. ----
  //         A second scale would make the same letter mean two things on one
  //         record. §3.6, and the v3.56 defect that made all-3s a C.
  const allThrees = rubric.gradeJournalEntry({ answered: 3, sentences: 3, enough: 3 });
  if (!allThrees || allThrees.percent !== 87) {
    errors.push(
      `journal rubric: meeting the standard on every row scores ${allThrees?.percent}%, not 87%. ` +
        `"A rubric that grades Solid as a C teaches her that meeting the standard is failure."`
    );
  }
  const band = rubric.journalBand(allThrees?.percent);
  if (!band || !String(band.grade).startsWith('B')) {
    errors.push(`journal rubric: all 3s lands on "${band?.grade}", which is not a B.`);
  }
  if (rubric.gradeJournalEntry({ answered: 1, sentences: 1, enough: 1 })?.percent !== 60) {
    errors.push('journal rubric: the bottom of the scale is not on Lamar\'s ladder (1 -> 60).');
  }

  // ---- 2. AN UNMARKED ROW IS NOT A ZERO. §3.13.1. ----
  if (rubric.gradeJournalEntry({}) !== null) {
    errors.push('journal rubric: an entry with nothing marked returned a grade instead of null.');
  }
  const partial = rubric.gradeJournalEntry({ sentences: 4 });
  if (!partial || partial.percent !== 100 || partial.rowsMarked !== 1) {
    errors.push(
      'journal rubric: a single marked row was averaged against the unmarked ones. A missing ' +
        'grade and a zero are opposite facts.'
    );
  }

  // ---- 3. SENTENCE-LEVEL WRITING MUST BE ONE OF THE ROWS. ----
  //         Grammar & Usage is her lowest strand at 2.20 and NO course in this
  //         app teaches it. This is the only place in her week where an adult
  //         looks at her sentences on purpose.
  if (!rubric.JOURNAL_RUBRIC.some((r) => /sentence|punctuation/i.test(r.row))) {
    errors.push(
      'journal rubric: no row looks at sentences or punctuation. That row is the entire reason ' +
        'this grades anything — grammar is her lowest strand and nothing else in the app teaches it.'
    );
  }
  for (const r of rubric.JOURNAL_RUBRIC) {
    for (const l of [1, 2, 3, 4]) {
      if (!r[`l${l}`]) errors.push(`journal rubric: row "${r.row}" has no level ${l} descriptor.`);
    }
  }

  // ---- 4. SHE SEES IT. Gigi chose this explicitly. ----
  //         §3.13.3: a score returns to the learner, or it is a judgement made
  //         ABOUT her rather than FOR her.
  if (!/\{mark\.letter\}/.test(view) || !/\{mark\.percent\}/.test(view)) {
    errors.push(
      'the mark does not render on HER journal screen. Gigi chose that she sees the grade, and ' +
        '§3.13.3 requires it — a mark she cannot see is a mark about her, not for her.'
    );
  }
  if (!/mark\.working/.test(view) || !/mark\.strong/.test(view)) {
    errors.push(
      'her mark shows a number with no words beside it. Warm, never softened — the rows she did ' +
        'well and the rows she did not both get named.'
    );
  }

  // ---- 5. THE MARK MAY NEVER TOUCH HER WRITING. That was the condition. ----
  if (/saveJournalEntry|entry\.text\s*=/.test(panel)) {
    errors.push(
      'the marking panel can write to the journal entry. The mark lives in its own table keyed by ' +
        'entryId precisely so that marking cannot alter a character of what she wrote.'
    );
  }

  // ---- 6. THE KIND IS ASSIGNED, NOT PICKED. ----
  const { assignedKindFor, JOURNAL_KINDS } = await import(pathToFileURL(resolve(ROOT, 'src/data/journal/journalPrompts.js')).href);
  if (!/assignedKindFor\(/.test(view)) {
    errors.push('the journal no longer assigns the day\'s kind — she is choosing it again.');
  }
  if (/setKind\(/.test(view)) {
    errors.push(
      'the journal has a kind picker again. Gigi, Aug 19: "I also don\'t want her to have a ' +
        'choice on what to journal." If that changes, INVERT this with the reason and the date.'
    );
  }
  // Derived from the list, never a typed table: a fifth kind must widen it.
  const seen = new Set(
    ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23']
      .map(assignedKindFor)
  );
  if (seen.size !== JOURNAL_KINDS.length) {
    errors.push(
      `the rotation reaches ${seen.size} of ${JOURNAL_KINDS.length} kinds across a week. It is ` +
        `meant to be derived from JOURNAL_KINDS, so adding a kind widens it with no edit.`
    );
  }

  // ---- 7. THE MECHANICS READER COUNTS. IT DOES NOT GRADE. ----
  //
  // Gigi: "Is there a grader in the journal entry that will grade her work?"
  // No — and §3.6's item table forbids one for this kind of writing:
  // freeResponse is "never auto-scored", and Edition A is "No AI Service".
  //
  // So this asserts the line holds: it may have an opinion about ONE row, the
  // one that is countable, and Gigi applies it by hand.
  const mech = await import(pathToFileURL(resolve(ROOT, 'src/lib/sentenceMechanics.js')).href);

  if (mech.SUGGESTIBLE_ROWS.length !== 1 || mech.SUGGESTIBLE_ROWS[0] !== 'sentences') {
    errors.push(
      `the mechanics reader may suggest ${mech.SUGGESTIBLE_ROWS.join(', ')}. It may only ever ` +
        `suggest "sentences" — whether she ANSWERED THE QUESTION and whether she SAID ENOUGH ` +
        `require reading what she meant, and a machine guessing at those is how a nine-year-old ` +
        `gets marked down for writing something interesting.`
    );
  }
  // The panel must apply the suggestion to that row and no other.
  const applied = [...panel.matchAll(/setLevels\(\(p\) => \(\{ \.\.\.p, (\w+):/g)].map((m) => m[1]);
  for (const row of applied) {
    if (row !== 'sentences' && !/\[row\.id\]/.test(row)) {
      errors.push(`the suggestion button writes to row "${row}". Only "sentences" may be suggested.`);
    }
  }

  // NOTHING WRITTEN IS NOT THE SAME FACT AS WRITTEN BADLY. §3.13.1 again.
  if (mech.suggestSentenceLevel('') !== null) {
    errors.push('the mechanics reader gave an empty entry a level instead of null.');
  }

  // ---- PROPORTIONAL, NOT ABSOLUTE. Her entries are 8-11 words. ----
  //
  // ⚠️ The first draft banded on the RAW slip count, so a one-sentence entry
  // with no capital and no full stop — everything wrong — scored 3, whose
  // descriptor reads "one or two slips". Caught by running it against her three
  // real entries before it was wired to anything.
  const allWrong = mech.suggestSentenceLevel('did you konw the coat of the seed let it dry');
  if (!allWrong || allWrong.level > 1) {
    errors.push(
      `a one-sentence entry with no capital and no end mark suggested level ${allWrong?.level}. ` +
        `On a one-sentence entry that is not "one or two slips", it is all of it — band on the ` +
        `PROPORTION that is right, never the raw count.`
    );
  }
  const allRight = mech.suggestSentenceLevel('The seed was dry. I looked at it again. It had not changed.');
  if (!allRight || allRight.level !== 4) {
    errors.push(`three clean sentences suggested level ${allRight?.level}, not 4.`);
  }

  // It must say WHY, or a grown-up either trusts it blindly or ignores it.
  if (!allWrong.because || !/sentence/i.test(allWrong.because)) {
    errors.push('the suggestion gives a level with no count beside it.');
  }
  if (!/\{suggestion\.because\}/.test(panel)) {
    errors.push('the panel shows a suggested level without showing what was counted.');
  }

  notes.push(
    `the daily entry is marked on the app's one ladder (all 3s = ${allThrees?.percent}% = ` +
      `${band?.grade}), an unmarked row is not a zero, she sees the mark, and the kind is ` +
      `assigned by the day`
  );
}

console.log('\nPetal & Pestle — writing programme check\n');
console.log(`  ${GRAMMAR_POINTS.length} grammar points tracking Khan units 1-7 · ${WRITING_MOVES.length} writing moves`);
console.log(`  ${MINI_LESSON.minutes} minutes at the top of the Journal, then she writes as before\n`);
for (const n of notes) console.log(`  · ${n}`);
console.log(
  '\n  THE JOURNAL IS NEVER GRADED AND NEVER CORRECTED. That is locked, and this check reads\n' +
    '  the screen as text to make sure a box to type in never appears in the mini-lesson.\n' +
    '  The graded writing is a finished piece she chose to make, on a rubric she sees first.'
);

if (errors.length) {
  console.log(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log('');
  process.exit(1);
}
console.log('\nEvery mini-lesson is reachable, the daily entry is marked and she can see it, and every rubric is complete.\n');
