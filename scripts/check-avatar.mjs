// ---------------------------------------------------------------------------
// Run with: node scripts/check-avatar.mjs
//
// WHY THIS EXISTS.
//
// "Her avatar's face isn't full form." Then, after a redraw: "the avatar still
// isn't correct." Then a third time. Each report was accurate and each fix was
// aimed at the wrong thing — I kept adding detail to the face (brows, lashes, a
// nose, lips, cheeks) and every piece of it landed in the file correctly and was
// invisible on screen.
//
// SVG has no z-index. It paints in document order, and <Hair> sat at the bottom
// of the component. The default puff is an ellipse with ry 31 centred at -132,
// so it reached down to y = -101 — past the brows at -124 and over the eyes at
// -113. A solid black dome with a nose and a mouth showing underneath it.
//
// The reason it survived three rounds is that nothing could see it. Six check
// scripts all passed: the imports resolved, the brackets balanced, every
// purchasable thing had a place to sit. Not one of them looked at the PICTURE.
// A drawing bug is invisible to text checks by construction, and "I redrew the
// face" is not evidence that the face is visible.
//
// So this script checks the one thing that actually went wrong: WHAT ORDER
// THINGS ARE PAINTED IN, and whether anything is allowed to cover the face.
//
// THE RULE IT ENFORCES: anything that goes on her head is split at the
// hairline. The volume is painted BEFORE the head. Only the hairline cap is
// painted after, and it must stop above the brows.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = resolve(ROOT, 'src/components/Rewards/HerbalistAvatar.jsx');
const raw = readFileSync(FILE, 'utf8');

/**
 * Blank out comments, keeping every character offset in place.
 *
 * Needed because the first draft of this script failed on its own paperwork:
 * the file's comments explain the bug and therefore CONTAIN the strings being
 * searched for — 'layer="front"' in a prose description, and the
 * transform="translate(-5 0)" that was removed but is still named in the note
 * saying it was removed. Searching the raw text found the explanation instead
 * of the code. A checker that cannot tell code from commentary about code will
 * fail loudest on well-documented files, which is precisely backwards.
 */
function blankComments(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] === '/' && s[i + 1] === '/') {
      while (i < s.length && s[i] !== '\n') (out += ' '), i++;
      continue;
    }
    if (s[i] === '/' && s[i + 1] === '*') {
      out += '  ';
      i += 2;
      while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) {
        out += s[i] === '\n' ? '\n' : ' ';
        i++;
      }
      out += '  ';
      i += 2;
      continue;
    }
    out += s[i];
    i++;
  }
  return out;
}

const src = blankComments(raw);

const errors = [];
const notes = [];

// ---- 1. The head is painted, and we know where ----
//
// Found by what it IS (the ellipse filled with SKIN) rather than by its
// coordinates. The first draft hardcoded cy="-112" and broke the moment the
// head was resized to make her look younger — a checker that has to be edited
// every time the thing it checks is edited will eventually just be deleted.
const headMatch = src.match(/<ellipse cx="0" cy="(-\d+(?:\.\d+)?)"[^>]*fill=\{SKIN\}/);
const headAt = headMatch ? headMatch.index : -1;
if (headAt === -1) {
  errors.push('cannot find the head — no <ellipse cx="0" ... fill={SKIN}> in the figure');
} else {
  notes.push(`head found at cy=${headMatch[1]}`);
}

/** The y at which the eyebrows sit, read from the brows themselves. Nothing
 *  painted after the face may come below this, or it starts eating the face. */
const browMatch = src.match(/d="M-\d+(?:\.\d+)? (-\d+(?:\.\d+)?) q[^"]*" stroke="#241A15"/);
const BROW_Y = browMatch ? Number(browMatch[1]) : -124;
if (!browMatch) notes.push('could not read the brow height; falling back to -124');

// ---- 2. The last thing on the face, so we know where the face ends ----
// The chin is the last thing drawn on the face, so its path marks where the
// face block ends. Matched on the path itself rather than on a comment, since
// comments are blanked above.
const chinAt = src.indexOf('M-6 -86 q6 4 12 0');
if (chinAt === -1) errors.push('cannot find the chin path that closes the face block');

// ---- 3. Hair volume goes BEFORE the head ----
const backAt = src.indexOf('layer="back"');
if (backAt === -1) {
  errors.push('no <Hair layer="back" /> — the hair volume must be painted behind the head');
} else if (headAt !== -1 && backAt > headAt) {
  errors.push(
    'the hair volume (layer="back") is painted AFTER the head — it will cover her face, ' +
      'which is exactly the bug this file exists to prevent'
  );
} else {
  notes.push('hair volume paints behind the head');
}

// ---- 4. The hairline cap goes AFTER the face ----
const frontAt = src.indexOf('layer="front"');
if (frontAt === -1) {
  errors.push('no <Hair layer="front" /> — she has no hairline');
} else if (chinAt !== -1 && frontAt < chinAt) {
  errors.push('the hairline (layer="front") paints before the face is finished');
} else {
  notes.push('hairline paints in front, after the face');
}

// ---- 5. The cap must stop above the brows ----
// Pull every y-like number out of HairCap. Coordinates in this drawing put the
// head between roughly -90 and -180, so anything in that band is a y.
const capStart = src.indexOf('function HairCap');
if (capStart === -1) {
  errors.push('cannot find HairCap — the shared hairline shape');
} else {
  const capBody = src.slice(capStart, src.indexOf('\n}', capStart));
  const ys = (capBody.match(/-1[0-7]\d(?:\.\d+)?/g) || []).map(Number).filter((n) => n <= -90 && n >= -180);
  if (ys.length === 0) {
    errors.push('HairCap has no recognisable y coordinates — cannot verify it clears the brows');
  } else {
    const lowest = Math.max(...ys); // "lowest on screen" = closest to zero
    if (lowest > BROW_Y) {
      errors.push(
        `the hairline reaches y=${lowest}, below the brows at y=${BROW_Y} — it will cover them`
      );
    } else {
      notes.push(`hairline stops at y=${lowest}, clear of the brows at y=${BROW_Y}`);
    }
  }
}

// ---- 6. Nothing full-size may paint after the face ----
// A big ellipse after the chin is the exact shape of the original bug.
if (chinAt !== -1) {
  const after = src.slice(chinAt);
  const bigEllipse = after.match(/<ellipse[^>]*\bry="(\d+(?:\.\d+)?)"/g) || [];
  for (const tag of bigEllipse) {
    const ry = Number(tag.match(/ry="(\d+(?:\.\d+)?)"/)[1]);
    // The straw hat's brim is legitimately wide but flat (ry 14–15); a tall
    // ellipse this late in the file is hair or a helmet, and covers her.
    if (ry > 20) {
      errors.push(`a tall ellipse (ry ${ry}) is painted after the face — it will cover her`);
    }
  }
}

// ---- 7. No stray transforms inside the face ----
// The upper lip once carried transform="translate(-5 0)", which slid the
// cupid's bow five units off the lower lip. Nobody noticed, because the hair
// was covering it.
if (headAt !== -1 && chinAt !== -1) {
  const faceBlock = src.slice(headAt, chinAt);
  if (/transform="translate\(/.test(faceBlock)) {
    errors.push('a translate() transform is sitting inside the face block — features will be off-centre');
  } else {
    notes.push('no stray transforms inside the face');
  }
}

console.log('\nPetal & Pestle — avatar paint-order check\n');
for (const n of notes) console.log(`  · ${n}`);
if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\nHer face is painted last of the things that belong on it. Nothing covers it.\n');
