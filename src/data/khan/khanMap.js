// ---------------------------------------------------------------------------
// WHERE A LEVEL SENDS HER ON KHAN ACADEMY.
//
// This app does not teach Maths, Reading or Science. Khan Academy does. The
// diagnostic's whole job is to answer one question — "where should she start?"
// — and this file is the answer key that turns a number like 3.2 into a course
// and a unit she can open today.
//
// ------------------------------ EDIT THIS FILE -----------------------------
// Khan Academy renames and reorganises its units from time to time. When a
// unit name here stops matching what is on the site, THIS IS THE ONLY FILE TO
// CHANGE — every screen reads from here. The course URLs are the stable part
// and are what the buttons actually open, so a stale unit name is a wrong
// label, never a broken link.
// ---------------------------------------------------------------------------
//
// HOW THE BANDS WORK: each strand lists bands in ascending order. The first
// band whose `upTo` is greater than or equal to her level is the one she gets.
// The last band in each list is the ceiling and has upTo: 99.
//
// BOUNDARIES END IN .99, NOT .9. They used to end in .9, which left a gap of
// nine hundredths at the top of every grade: a child measured at 2.91 fell past
// the 2nd-grade band and landed in 3rd. It is a small window and it caught a
// real child — her vocabulary came out at exactly 2.91. A band boundary has to
// sit immediately below the next whole grade, not a tenth below it.

import { unitUrl as khanUnitUrl } from './khanUnits.js';

export const KHAN_COURSES = {
  math1: { label: '1st Grade Math', url: 'https://www.khanacademy.org/math/cc-1st-grade-math' },
  // FIXED Aug 16 2026. This was cc-SECOND-grade-math, which returns
  // "Oops! Page not found". Rendered twice in a browser to be sure. Khan
  // serves HTTP 200 for the dead address and draws the error in JavaScript
  // afterwards, so no status check could have caught it. Her Geometry and
  // Measurement both sit at the floor of 2nd grade, so this was the course
  // her plan opened most often, and it opened an error page.
  math2: { label: '2nd Grade Math', url: 'https://www.khanacademy.org/math/cc-2nd-grade-math' },
  math3: { label: '3rd Grade Math', url: 'https://www.khanacademy.org/math/cc-third-grade-math' },
  math4: { label: '4th Grade Math', url: 'https://www.khanacademy.org/math/cc-fourth-grade-math' },
  math5: { label: '5th Grade Math', url: 'https://www.khanacademy.org/math/cc-fifth-grade-math' },
  math6: { label: '6th Grade Math', url: 'https://www.khanacademy.org/math/cc-sixth-grade-math' },
  ela1: { label: '1st Grade Reading & Vocabulary', url: 'https://www.khanacademy.org/ela/cc-1st-reading-vocab' },
  ela2: { label: '2nd Grade Reading & Vocabulary', url: 'https://www.khanacademy.org/ela/cc-2nd-reading-vocab' },
  ela3: { label: '3rd Grade Reading & Vocabulary', url: 'https://www.khanacademy.org/ela/cc-3rd-reading-vocab' },
  ela4: { label: '4th Grade Reading & Vocabulary', url: 'https://www.khanacademy.org/ela/cc-4th-reading-vocab' },
  ela5: { label: '5th Grade Reading & Vocabulary', url: 'https://www.khanacademy.org/ela/cc-5th-reading-vocab' },
  ela6: { label: '6th Grade Reading & Vocabulary', url: 'https://www.khanacademy.org/ela/cc-6th-reading-vocab' },
  grammar: { label: 'Grammar', url: 'https://www.khanacademy.org/humanities/grammar' },
  // ---- THE THREE ELEMENTARY SCIENCE COURSES ARE GONE FROM KHAN ----
  //
  // Gigi, Aug 16 2026: "Science has a link to Khan Academy but there isn't any
  // science courses there for 4th grade."
  //
  // Rendered all three in a browser. Every one returns "Oops! Page not found":
  //     /science/3rd-grade-science   DEAD
  //     /science/4th-grade-science   DEAD
  //     /science/5th-grade-science   DEAD
  //
  // And Khan's /science index now lists THIRTY courses of which the lowest is
  // "6th grade science (TX TEKS)". There is no elementary science on Khan at
  // all any more - not the wrong curriculum, nothing.
  //
  // v3.2 already recorded that Khan's US science starts at 5th grade and that
  // the "4th grade science" course was the Philippines' national curriculum.
  // Since then Khan has removed those pages outright, and the app went on
  // linking to them because nothing re-checked a URL it had already written
  // down. They are removed rather than repointed: there is nothing to repoint
  // them at, and a link to middle-school biology for a nine-year-old is the
  // "she opens it, hits a wall, and learns her schedule lies" failure.
  //
  // Her science is taught by the app - Herbalism carries ten of Georgia's
  // twenty-five fourth-grade elements and The Science Lab owns the other
  // fifteen. See curriculumPlan.js.
  bio: { label: 'Middle School Biology', url: 'https://www.khanacademy.org/science/ms-biology' }
};

/**
 * A strand Khan does not teach at her level.
 *
 * Not an empty list and not a missing key - a NAMED thing, so the difference
 * between "nobody has filled this in" and "Khan does not have it" is visible in
 * the file rather than inferred from an absence.
 */
export const NOT_ON_KHAN = 'not-on-khan';

export const KHAN_MAP = {
  'numbers-operations': [
    { upTo: 1.99, course: 'math1', unit: 'Addition and subtraction within 20' },
    { upTo: 2.99, course: 'math2', unit: 'Add and subtract within 100', unitCourse: 'math2', unitN: 3 },
    { upTo: 3.99, course: 'math3', unit: 'Intro to multiplication' },
    { upTo: 4.99, course: 'math4', unit: 'Multiply by 1-digit numbers' },
    { upTo: 5.99, course: 'math5', unit: 'Multi-digit multiplication and division' },
    { upTo: 99, course: 'math6', unit: 'Arithmetic operations' }
  ],
  'fractions-decimals': [
    { upTo: 1.99, course: 'math1', unit: 'Halves and fourths' },
    // WAS 'Equal parts of circles and rectangles'. 2nd grade math has no
    // fractions unit at all - partitioning shapes lives inside Geometry,
    // Unit 8. Confirmed off the rendered course page Aug 16 2026.
    { upTo: 2.99, course: 'math2', unit: 'Geometry', unitCourse: 'math2', unitN: 8 },
    { upTo: 3.99, course: 'math3', unit: 'Understand fractions' },
    { upTo: 4.99, course: 'math4', unit: 'Add and subtract fractions' },
    { upTo: 5.99, course: 'math5', unit: 'Add and subtract fractions with unlike denominators' },
    { upTo: 99, course: 'math6', unit: 'Arithmetic with rational numbers' }
  ],
  'measurement-data': [
    { upTo: 1.99, course: 'math1', unit: 'Measurement and data' },
    // WAS 'Measurement and data'. Khan split it: Unit 6 is Measurement and
    // Unit 7 is Data. She goes to Measurement, which is the half her 2.00
    // was measured on.
    { upTo: 2.99, course: 'math2', unit: 'Measurement', unitCourse: 'math2', unitN: 6 },
    { upTo: 3.99, course: 'math3', unit: 'Measurement' },
    { upTo: 4.99, course: 'math4', unit: 'Units of measurement' },
    { upTo: 5.99, course: 'math5', unit: 'Converting units of measure' },
    { upTo: 99, course: 'math6', unit: 'Data and statistics' }
  ],
  geometry: [
    { upTo: 1.99, course: 'math1', unit: 'Geometry' },
    { upTo: 2.99, course: 'math2', unit: 'Geometry', unitCourse: 'math2', unitN: 8 },
    { upTo: 3.99, course: 'math3', unit: 'Perimeter and area' },
    { upTo: 4.99, course: 'math4', unit: 'Plane figures and angles' },
    { upTo: 5.99, course: 'math5', unit: 'Coordinate plane and geometry' },
    { upTo: 99, course: 'math6', unit: 'Geometry' }
  ],
  'patterns-algebra': [
    { upTo: 1.99, course: 'math1', unit: 'Counting and place value' },
    { upTo: 2.99, course: 'math2', unit: 'Add and subtract within 100', unitCourse: 'math2', unitN: 3 },
    { upTo: 3.99, course: 'math3', unit: 'Patterns and problem solving' },
    { upTo: 4.99, course: 'math4', unit: 'Factors, multiples and patterns' },
    { upTo: 5.99, course: 'math5', unit: 'Algebraic thinking' },
    { upTo: 99, course: 'math6', unit: 'Variables and expressions' }
  ],
  'reading-comprehension': [
    { upTo: 1.99, course: 'ela1', unit: 'Reading for understanding' },
    // WAS 'Reading for understanding' - no such unit. Khan's 2nd grade reading
    // is Fairy Tales Retold, The Moon, and Rural, Suburban, Urban.
    { upTo: 2.99, course: 'ela2', unit: 'Fairy Tales Retold', unitCourse: 'ela2', unitN: 1 },
    // WAS 'Reading informational text' - THERE IS NO SUCH UNIT. Khan's 3rd
    // grade reading is three THEMED units: Pets, Homes, Extreme
    // Environments. The link resolved, so nothing ever caught the wrong
    // label. All three ELA strands point at Unit 1 because these units are a
    // sequence, not a set of skills to match a strand to - saying so here
    // rather than inventing a mapping that reads as precise.
    { upTo: 3.99, course: 'ela3', unit: 'Pets', unitCourse: 'ela3', unitN: 1 },
    { upTo: 4.99, course: 'ela4', unit: 'Reading literature' },
    { upTo: 5.99, course: 'ela5', unit: 'Reading informational text' },
    { upTo: 99, course: 'ela6', unit: 'Reading literature and informational text' }
  ],
  vocabulary: [
    { upTo: 1.99, course: 'ela1', unit: 'Building vocabulary' },
    // WAS 'Building vocabulary' - no such unit. See the note above.
    { upTo: 2.99, course: 'ela2', unit: 'Fairy Tales Retold', unitCourse: 'ela2', unitN: 1 },
    // WAS 'Vocabulary' - no such unit in 3rd grade. See the note above.
    { upTo: 3.99, course: 'ela3', unit: 'Pets', unitCourse: 'ela3', unitN: 1 },
    { upTo: 4.99, course: 'ela4', unit: 'Vocabulary' },
    { upTo: 5.99, course: 'ela5', unit: 'Vocabulary' },
    { upTo: 99, course: 'ela6', unit: 'Vocabulary — roots and affixes' }
  ],
  'grammar-usage': [
    { upTo: 1.99, course: 'grammar', unit: 'Parts of speech: the noun' },
    { upTo: 3.4, course: 'grammar', unit: 'Parts of speech: the noun', unitCourse: 'grammar', unitN: 1 },
    { upTo: 4.4, course: 'grammar', unit: 'Parts of speech: the verb' },
    { upTo: 5.4, course: 'grammar', unit: 'Punctuation — commas and apostrophes' },
    { upTo: 99, course: 'grammar', unit: 'Syntax — sentence structure' }
  ],
  // Khan has no standalone elementary WRITING course. Its writing instruction
  // lives inside Grammar and inside each grade's reading course, so this strand
  // routes there rather than inventing a course that does not exist.
  'writing-strategies': [
    { upTo: 1.99, course: 'ela1', unit: 'Writing about what you read' },
    // The 2nd-grade band was MISSING. Levels 2.0 to 2.9 dropped straight
    // through into the 3rd-grade band below, so the screen said "about halfway
    // through 2nd grade" and then sent her to 3rd-grade material on the same
    // row. scripts/check-links.mjs now fails the build on exactly this.
    // WAS 'Writing about what you read' - no such unit. See the note above.
    { upTo: 2.99, course: 'ela2', unit: 'Fairy Tales Retold', unitCourse: 'ela2', unitN: 1 },
    // WAS 'Reading informational text (writing about what you read)' - again,
    // not a real unit. See the note above.
    { upTo: 3.4, course: 'ela3', unit: 'Pets', unitCourse: 'ela3', unitN: 1 },
    { upTo: 4.4, course: 'grammar', unit: 'Sentence construction' },
    { upTo: 5.4, course: 'grammar', unit: 'Usage and style' },
    { upTo: 99, course: 'grammar', unit: 'Syntax — building complex sentences' }
  ],
  'plants-life': NOT_ON_KHAN,
  'human-body': NOT_ON_KHAN,
  'scientific-method': NOT_ON_KHAN
};

/**
 * The course + unit for one strand at one measured level.
 *
 * ---- WHY THERE ARE NOW TWO URLS, AND WHICH ONE TO OPEN ----
 *
 * Gigi: "Links to the course front page" - listed as the first thing wrong with
 * the v3.19 Khan work. A course front page is an index a nine-year-old has to
 * read and search. The unit's own page is the thing she is meant to be doing.
 *
 * `unitUrl` is that page, and it is only ever non-null when the unit has been
 * CONFIRMED against Khan's rendered course page and written into khanUnits.js.
 * Bands for quarters not yet built get null rather than a guessed link - a
 * missing button is recoverable, a wrong one teaches her that her schedule lies.
 *
 * `courseUrl` stays, unchanged, as the fallback every caller already handles.
 */
export function khanFor(strandId, level) {
  const bands = KHAN_MAP[strandId];
  // Khan has no elementary science. Returning null means no button, which is
  // the honest answer - see the note above KHAN_COURSES.
  if (bands === NOT_ON_KHAN) return null;
  if (!Array.isArray(bands) || level == null) return null;
  const band = bands.find((b) => level <= b.upTo) || bands[bands.length - 1];
  const course = KHAN_COURSES[band.course];
  const unitUrl = band.unitCourse && band.unitN
    ? khanUnitUrl(band.unitCourse, band.unitN)
    : null;
  return {
    courseLabel: course.label,
    courseUrl: course.url,
    unit: band.unit,
    unitUrl,
    unitCourse: band.unitCourse || null,
    unitN: band.unitN || null
  };
}
