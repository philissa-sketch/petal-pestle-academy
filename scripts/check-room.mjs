// ---------------------------------------------------------------------------
// Run with: node scripts/check-room.mjs
//
// WHY THIS EXISTS.
//
// "The greenhouse looks cluttered. There's nothing on the walls and everything
// looks placed randomly around." Three complaints, and the third had a cause
// neither of us could see by looking:
//
//     bookshelf   far back    drawn at 1.00
//     bee hotel   far back    drawn at 0.90
//     birdbath    middle      drawn at 1.00
//     cat         near front  drawn at 0.95
//     rug         front       drawn at 1.15
//
// Twelve positions, each hand-picked by eye, one at a time, over several days.
// Scale ended up flat from the back wall to the front — which in one-point
// perspective removes the only depth cue the drawing has. Objects stopped
// reading as standing in a room and started reading as stickers on a picture.
// "Placed randomly" was not a complaint about taste. It was a missing
// dimension, correctly perceived.
//
// Positions are now (u, t) and scale is DERIVED, so that specific failure is
// impossible by construction. This script guards the rest:
//
//   1. Nothing sits outside the room.
//   2. Scale rises monotonically from the back wall to the front.
//   3. Nothing at the same depth overlaps anything else at the same depth.
//   4. The middle of the floor stays clear — the thing that actually stops a
//      room with twelve objects in it from looking cluttered.
//   5. Each wall carries something, so "nothing on the walls" cannot recur.
//
// Point 3 is depth-aware on purpose. A rose arch in FRONT of a window box
// overlaps it on screen and that is correct — it is what standing in front of
// something looks like. Only things at the same depth are actually colliding.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { GREENHOUSE_ITEMS } = await import(pathToFileURL(resolve(ROOT, 'src/data/rewards/petalCatalog.js')).href);
const { place, scaleAt, leftEdgeAt, rightEdgeAt, LEFT_BENCH, RIGHT_SHELF, SURFACES, onSurface, VB, BACK } =
  await import(pathToFileURL(resolve(ROOT, 'src/config/room.js')).href);

const errors = [];
const notes = [];

// ---- 2. scale must rise with depth ----
let last = -1;
let monotonic = true;
for (let t = 0; t <= 1.0001; t += 0.05) {
  const s = scaleAt(t);
  if (s <= last) monotonic = false;
  last = s;
}
if (!monotonic) {
  errors.push('scaleAt() does not increase from the back wall to the front — depth would read wrong');
} else {
  notes.push(`scale runs ${scaleAt(0).toFixed(2)} at the back wall to ${scaleAt(1).toFixed(2)} at the front`);
}

// ---- 1. everything inside the room ----
for (const item of GREENHOUSE_ITEMS) {
  const { u, t } = item.spot || {};
  if (typeof u !== 'number' || typeof t !== 'number') {
    errors.push(`${item.id}: spot must be { u, t }`);
    continue;
  }
  if (u < 0 || u > 1) errors.push(`${item.id}: u ${u} is outside the walls (0 to 1)`);
  if (t < 0 || t > 1) errors.push(`${item.id}: t ${t} is outside the room (0 to 1)`);
  const at = place(item.spot);
  if (at.x < -40 || at.x > 1640) errors.push(`${item.id}: lands at x ${at.x.toFixed(0)}, off the canvas`);
}

// ---- 3. nothing collides at the same depth ----
//
// Footprint width is approximated in room units, since the exact art bounds
// live in the component. 0.10 of the room's width is a generous body for a
// stool or a birdbath and errs toward flagging.
const SAME_DEPTH = 0.12;
const BODY = 0.1;

/**
 * WHICH LEVEL A THING STANDS ON — added v3.15, and it is a correction to this
 * rule's MODEL, not a relaxation of it.
 *
 * Until v3.15 every purchasable stood on the floor, so (u, t) was the whole
 * story and two things sharing a spot always collided. Then things started
 * standing on the bench, the shelf boards and the sill. A terrarium on the
 * bench top and a bookshelf on the floor beside it share a (u, t) and do NOT
 * overlap on screen — one is 118 room units above the other, which is what a
 * bench is for.
 *
 * A flat rule flagged that as a collision. Widening BODY or SAME_DEPTH to make
 * it pass would have been the wrong fix: it would have stopped catching real
 * floor collisions too. So the rule keeps its thresholds exactly and gains the
 * dimension it was missing. Two things collide only if they are at the same
 * depth, the same place across the room, AND standing on the same level.
 *
 * The negative test for this is in the harness: two items put on the FLOOR at
 * one spot must still fail.
 */
function levelOf(item) {
  const lift = item.spot?.lift || 0;
  if (lift < 60) return 'floor';
  if (lift < 300) return `surface${Math.round(lift)}`;
  return 'high';
}

const floorItems = GREENHOUSE_ITEMS.filter((i) => i.layer !== 'roof' && i.layer !== 'hang');
for (let i = 0; i < floorItems.length; i++) {
  for (let j = i + 1; j < floorItems.length; j++) {
    const a = floorItems[i];
    const b = floorItems[j];
    // A rug is meant to be stood on. Floor layer never collides with anything.
    if (a.layer === 'floor' || b.layer === 'floor') continue;
    if (levelOf(a) !== levelOf(b)) continue;
    const dt = Math.abs(a.spot.t - b.spot.t);
    if (dt > SAME_DEPTH) continue;
    const du = Math.abs(a.spot.u - b.spot.u);
    if (du < BODY) {
      errors.push(
        `${a.id} and ${b.id} are at the same depth (t ${a.spot.t} vs ${b.spot.t}) and only ` +
          `${du.toFixed(2)} apart across the room — they will overlap`
      );
    }
  }
}
if (!errors.some((e) => e.includes('overlap'))) notes.push('nothing collides at the same depth');

// ---- 3b. EVERY BUILT SURFACE MUST CARRY SOMETHING SHE CAN BUY ----
//
// Gigi: "Greenhouse items have nowhere to go", and she named the windows. The
// placement check was passing the whole time, because it asks whether every
// ITEM has a place. Nothing asked the question the other way round: whether
// every PLACE has something that can go on it.
//
// It did not. The potting bench, both shelf boards and the back sill were all
// drawn at v2.1 and, for eleven versions, the only purchasable that ever sat on
// any of them was the window box. Twenty-one of twenty-two things stood on the
// floor of a room built around its walls.
//
// This is the assertion that would have caught that, and it is deliberately
// about the ROOM rather than about any one item.
for (const [id, surface] of Object.entries(SURFACES)) {
  const on = GREENHOUSE_ITEMS.filter((i) => {
    const lift = i.spot?.lift || 0;
    return Math.abs(lift - surface.lift) < 1;
  });
  if (on.length === 0) {
    errors.push(
      `nothing she can buy ever goes on ${surface.label} — it is drawn, it is empty, and no ` +
        `amount of Petals changes that`
    );
  } else {
    notes.push(`${surface.label}: ${on.length} thing${on.length === 1 ? '' : 's'} she can put on it`);
  }
}

// ---- 4. the middle of the floor stays clear ----
//
// "Cluttered" was never about the NUMBER of things. It was that all of them
// stood in the lower centre while the perimeter was empty. The middle is
// allowed a small number of things — the rug, the stool, the cat — and no more.
const MIDDLE = GREENHOUSE_ITEMS.filter(
  (i) => i.layer !== 'roof' && i.layer !== 'hang' && i.spot.u > 0.3 && i.spot.u < 0.7 && i.spot.t > 0.35
);
if (MIDDLE.length > 4) {
  errors.push(
    `${MIDDLE.length} things stand in the middle of the floor (${MIDDLE.map((m) => m.id).join(', ')}) — ` +
      `that is what "cluttered" was. Move some to a wall.`
  );
} else {
  notes.push(`${MIDDLE.length} things in the middle of the floor; the rest are against a wall`);
}

// ---- 5. EVERY WALL CARRIES SOMETHING THAT IS ACTUALLY ON IT ----
//
// THIS RULE WAS WRONG FROM v2.1 UNTIL v3.16, AND IT WAS PASSING THE WHOLE TIME.
//
// It counted an item's `u` — how far ACROSS the room it is — so the Field Guide
// Shelf STANDING ON THE FLOOR at u 0.11 counted as "the left wall carries
// something". It does not. A thing on the floor near a wall is not on the wall.
//
// It was written after Gigi's v2.1 note, "there's nothing on the walls", and it
// printed "left 7 · back 6 · right 6" and passed while she looked at v3.15 and
// said, again: "there isn't anything on the walls or ceiling". A check that
// reports a wall as used when nothing is fixed to it is the same failure as
// v3.13's overstating import check, in the one place it was written to prevent.
//
// A wall is used when something is MOUNTED on it: hard against it, and high
// enough off the floor to read as fixed rather than leaning. The wall shelves at
// lift 250 count, because a wall shelf is on the wall. A pot on the bench top at
// lift 118 does not, because it is on the bench.
const MOUNTED = 240;
const AGAINST = 0.12;
const mountedOn = (test) =>
  GREENHOUSE_ITEMS.filter((i) => i.layer !== 'hang' && test(i.spot.u) && (i.spot.lift || 0) >= MOUNTED);

const left = mountedOn((u) => u <= AGAINST);
const right = mountedOn((u) => u >= 1 - AGAINST);
const back = GREENHOUSE_ITEMS.filter((i) => i.spot.t <= 0.2 && (i.spot.lift || 0) > 0);
if (!left.length) {
  errors.push(
    'nothing is MOUNTED on the left wall — things standing on the floor beside it do not count, ' +
      'which is exactly what this rule used to count'
  );
}
if (!right.length) errors.push('nothing is MOUNTED on the right wall');
if (!back.length) errors.push('nothing sits up against the back glass');
notes.push(
  `mounted on the walls — left ${left.length} · right ${right.length} · back glass ${back.length}`
);

// ---- 5b. THE TOP OF THE ROOM IS NOT EMPTY ----
//
// The other half of what Gigi saw. The floor plane is only the bottom third of
// the picture (y ${BACK.y2}–${VB.h}); everything above it is glass and roof. At
// v3.15 the top third of the room held exactly two things and both were at
// x 800, dead centre. A greenhouse hangs things from its roof, and hers did not.
{
  const TOP_THIRD = BACK.y1 + (VB.h - BACK.y1) / 3;
  const up = GREENHOUSE_ITEMS.filter((i) => place(i.spot).y < TOP_THIRD);
  const WANT = 4;
  if (up.length < WANT) {
    errors.push(
      `only ${up.length} thing(s) sit in the top third of the room (above y ${Math.round(TOP_THIRD)}). ` +
        `The whole upper half is glass with nothing in it — want at least ${WANT}.`
    );
  } else {
    notes.push(`${up.length} things hang in the top third of the room`);
  }
}

// ---- 5c. IT IS NOT ALL PILED INTO ONE BAND ----
//
// "everything is jammed in the same area" — measured, this was thirteen of
// twenty-two items whose bases sat inside a single 120px horizontal band around
// the horizon line. Perspective does that on its own: the back of the room and
// every low surface compress toward the vanishing line, so adding things at the
// back makes the pile worse rather than better. Height is the only cure.
{
  const BAND = 120;
  const ys = GREENHOUSE_ITEMS.map((i) => place(i.spot).y);
  let worst = 0;
  let worstAt = 0;
  for (let y = BACK.y1; y < VB.h; y += 10) {
    const n = ys.filter((v) => v >= y && v < y + BAND).length;
    if (n > worst) {
      worst = n;
      worstAt = y;
    }
  }
  const share = worst / ys.length;
  const CAP = 0.45;
  if (share > CAP) {
    errors.push(
      `${worst} of ${ys.length} things (${Math.round(share * 100)}%) sit inside one ${BAND}px band ` +
        `starting at y ${worstAt} — that is what "jammed in the same area" is. Cap is ${Math.round(CAP * 100)}%.`
    );
  } else {
    notes.push(`densest ${BAND}px band holds ${worst} of ${ys.length} (${Math.round(share * 100)}%)`);
  }
}

// ---- 5d. THE WHOLE CANVAS GETS USED ----
// The near side walls — the outer wedges of the picture — were empty at v3.15
// because nothing was ever placed hard against a wall with height on it.
{
  const xs = GREENHOUSE_ITEMS.map((i) => place(i.spot).x);
  const margin = Math.min(Math.min(...xs), VB.w - Math.max(...xs));
  if (margin > 260) {
    errors.push(
      `nothing comes within ${Math.round(margin)}px of the side of the picture — the near walls are bare`
    );
  } else {
    notes.push(`the room reaches x ${Math.round(Math.min(...xs))} to ${Math.round(Math.max(...xs))} of ${VB.w}`);
  }
}

// The room's own furniture must actually touch its wall.
if (LEFT_BENCH.uOuter !== 0) {
  errors.push(`the potting bench sits at u ${LEFT_BENCH.uOuter}, not against the left wall (u 0)`);
}
if (RIGHT_SHELF.uOuter !== 1) {
  errors.push(`the wall shelf sits at u ${RIGHT_SHELF.uOuter}, not against the right wall (u 1)`);
}
if (!errors.some((e) => e.includes('wall (u'))) notes.push('the bench and the shelf are flush to their walls');

// And the component must actually draw them.
const scene = readFileSync(resolve(ROOT, 'src/components/Rewards/GreenhouseScene.jsx'), 'utf8');
for (const [name, marker] of [
  ['the potting bench', 'LEFT_BENCH'],
  ['the wall shelf', 'RIGHT_SHELF'],
  ['the back sill', 'BACK_SILL']
]) {
  if (!scene.includes(marker)) errors.push(`${name} is defined but GreenhouseScene.jsx never draws it`);
}

console.log('\nPetal & Pestle — greenhouse layout check\n');
for (const n of notes) console.log(`  · ${n}`);
if (errors.length) {
  console.error(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\nThe room reads as a room: depth is real, walls are used, the middle is clear.\n');
