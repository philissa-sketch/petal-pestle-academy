// ---------------------------------------------------------------------------
// Run with: node scripts/check-placement.mjs
//
// EVERY THING SHE CAN BUY MUST HAVE SOMEWHERE TO GO.
//
// This check exists because of a real defect the grandmother found, not a
// hypothetical one. The Market shipped selling 32 items — a stool, an apron, a
// jar — into an app with no greenhouse, no avatar and no shelf. Her words:
// "you didn't create the greenhouse, avatar, or shelves."
//
// That is the worst possible bug in a child's reward system, and it is silent.
// Nothing crashes. The purchase succeeds, the Petals leave her balance, a
// confirmation appears — and the thing she bought does not exist anywhere. A
// nine-year-old learns from that exactly once, and what she learns is that the
// money is pretend and the work behind it was too.
//
// So: every item needs a placement (`spot`, `shelf` or `slot`) AND a renderer
// that actually knows how to draw it. Adding a catalogue row without adding the
// artwork now fails the build instead of shipping.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GREENHOUSE_ITEMS,
  SHELF_ITEMS,
  APRON_ITEMS,
  BACKGROUND_ITEMS,
  ALL_PETAL_ITEMS
} from '../src/data/rewards/petalCatalog.js';
// NOT imported: node cannot load .jsx, and adding a build step just to run a
// guard would make the guard the most expensive thing in the project. The slot
// list is read out of the file as text instead, which is also closer to what is
// being asserted — that the CODE agrees with the catalogue.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

/** Pull the drawable ids out of a renderer, by reading its ART/BODY/Hat keys.
 *  Static, not executed — these files import React and cannot run under node. */
function idsIn(file, patterns) {
  const src = readFileSync(resolve(ROOT, file), 'utf8');
  const found = new Set();
  for (const rx of patterns) {
    let m;
    const r = new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : rx.flags + 'g');
    while ((m = r.exec(src))) found.add(m[1]);
  }
  return found;
}

// ---- Greenhouse -----------------------------------------------------------
{
  const drawn = idsIn('src/components/Rewards/GreenhouseScene.jsx', [/'(gh-[a-z-]+)':/]);
  for (const item of GREENHOUSE_ITEMS) {
    // Positions are ROOM coordinates now: u across, t deep. Screen x, y and
    // scale are computed from them — see config/room.js for why.
    if (!item.spot) errors.push(`${item.id}: greenhouse item with no spot {u,t}`);
    else {
      const { u, t } = item.spot;
      if (![u, t].every((n) => typeof n === 'number')) {
        errors.push(`${item.id}: spot must have numeric u and t`);
      } else if (u < 0 || u > 1 || t < 0 || t > 1) {
        errors.push(`${item.id}: spot (u ${u}, t ${t}) falls outside the room — both run 0 to 1`);
      }
      if ('s' in item.spot) {
        errors.push(
          `${item.id}: spot still carries a hand-set scale. Scale is computed from depth now, ` +
            `and a hand-set one is exactly how the room lost its perspective the first time.`
        );
      }
    }
    if (!drawn.has(item.id)) {
      errors.push(`${item.id}: nothing in GreenhouseScene.jsx knows how to draw it`);
    }
  }
}

// ---- Shelf ----------------------------------------------------------------
{
  const drawn = idsIn('src/components/Rewards/ApothecaryShelf.jsx', [/'(sh-[a-z-]+)':/]);
  for (const item of SHELF_ITEMS) {
    if (!item.shelf) errors.push(`${item.id}: shelf item with no {row,x}`);
    else {
      if (![0, 1, 2].includes(item.shelf.row)) {
        errors.push(`${item.id}: shelf row ${item.shelf.row} does not exist (0, 1 or 2)`);
      }
      if (item.shelf.x < 40 || item.shelf.x > 620) {
        errors.push(`${item.id}: shelf x ${item.shelf.x} hangs off the board`);
      }
    }
    if (!drawn.has(item.id)) {
      errors.push(`${item.id}: nothing in ApothecaryShelf.jsx knows how to draw it`);
    }
  }
}

// ---- Avatar ---------------------------------------------------------------
{
  const src = readFileSync(resolve(ROOT, 'src/components/Rewards/HerbalistAvatar.jsx'), 'utf8');
  const slotBlock = src.slice(src.indexOf('export const AVATAR_SLOTS'));
  const slotIds = [...slotBlock.matchAll(/\{\s*id:\s*'([a-z]+)'/g)].map((m) => m[1]);
  if (slotIds.length === 0) errors.push('AVATAR_SLOTS could not be read out of HerbalistAvatar.jsx');
  for (const item of APRON_ITEMS) {
    if (!item.slot) {
      errors.push(`${item.id}: wearable with no slot`);
      continue;
    }
    if (!slotIds.includes(item.slot)) {
      errors.push(`${item.id}: slot "${item.slot}" is not one of ${slotIds.join(', ')}`);
    }
    // The figure must mention the item id somewhere — that is what makes it
    // change the drawing rather than silently do nothing.
    if (!src.includes(`'${item.id}'`)) {
      errors.push(`${item.id}: HerbalistAvatar.jsx never reads it, so wearing it would change nothing`);
    }
  }
  // And every slot must actually be consumed by the drawing.
  for (const slot of slotIds) {
    if (!src.includes(`gear.${slot}`)) {
      errors.push(`slot "${slot}" is offered in the wardrobe but the figure never reads gear.${slot}`);
    }
  }
}

// ---- Room looks -----------------------------------------------------------
//
// A room look has no spot, no shelf and no slot, because what it changes is the
// LIGHT over everything else. That makes it the easiest kind of purchase to
// ship broken: a catalogue row, a price, a card in the Market, and absolutely
// nothing different on screen when she buys it. Exactly the failure this whole
// script was written for, in a category the script did not know existed.
//
// So a look must carry a palette, the scene must actually apply one, and the
// screen must give her a way to choose. All three, or it does nothing.
{
  const SHELL_KEYS = ['glass', 'glassDeep', 'frame', 'frameDark', 'wallSide', 'wallSideDark', 'floor', 'floorFar'];
  const scene = readFileSync(resolve(ROOT, 'src/components/Rewards/GreenhouseScene.jsx'), 'utf8');
  const view = readFileSync(resolve(ROOT, 'src/components/Rewards/GreenhouseView.jsx'), 'utf8');

  for (const bg of BACKGROUND_ITEMS) {
    if (!bg.look || typeof bg.look !== 'object') {
      errors.push(`${bg.id}: a room look with no palette — buying it would change nothing`);
      continue;
    }
    for (const k of SHELL_KEYS) {
      if (!bg.look[k]) errors.push(`${bg.id}: palette is missing "${k}", so part of the room keeps the old light`);
    }
  }
  if (BACKGROUND_ITEMS.length) {
    if (!/look\s*=\s*null/.test(scene) || !/\.\.\.\(look \|\| \{\}\)/.test(scene)) {
      errors.push(
        'GreenhouseScene.jsx does not merge a room look into its palette, so every background ' +
          'in the shop is decoration on a card and nothing else'
      );
    }
    if (!view.includes('BACKGROUND_ITEMS') || !view.includes('setRoomLook')) {
      errors.push(
        'GreenhouseView.jsx gives her no way to choose a room look she has bought'
      );
    }
  }
}

// ---- Nothing homeless -----------------------------------------------------
for (const item of ALL_PETAL_ITEMS) {
  // `look` counts as a placement: it is applied to the whole room rather than
  // standing anywhere in it. Checked properly in the block above.
  const placed = !!(item.spot || item.shelf || item.slot || item.look);
  if (!placed) errors.push(`${item.id}: buyable but has nowhere to go`);
  if (!item.icon) errors.push(`${item.id}: no icon for the shop card`);
  if (!(Number(item.cost) > 0)) errors.push(`${item.id}: no cost`);
}

// ---- Report ---------------------------------------------------------------
console.log('\nPetal & Pestle — placement check');
console.log(
  `Greenhouse ${GREENHOUSE_ITEMS.length} · Shelf ${SHELF_ITEMS.length} · Wearable ${APRON_ITEMS.length} · ` +
    `Room looks ${BACKGROUND_ITEMS.length}\n`
);

if (errors.length) {
  console.error(`FAILED — ${errors.length} item${errors.length === 1 ? '' : 's'} with nowhere to go:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('Every purchasable thing has a place and something that draws it.\n');
