import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { journalMarkForHer } from '../../data/journal/journalRubric.js';
import { MarigoldMessage } from '../Mentor/MarigoldMessage.jsx';
import {
  JOURNAL_KINDS,
  promptFor,
  kindMeta,
  assignedKindFor,
  wordCount
} from '../../data/journal/journalPrompts.js';
import { miniLessonFor } from '../../data/writing/writingProgramme.js';
import { WRITING_PIECES, piecesForYear } from '../../data/writing/writingPieces.js';

// ---------------------------------------------------------------------------
// THE HERBALIST'S JOURNAL.
//
// This is the only screen in the app where she produces something instead of
// answering something. Khan teaches her grammar; nothing on Khan asks her to
// write a paragraph about a leaf she is holding.
//
// ---- THREE DECISIONS WORTH DEFENDING ----
//
// 1. ⚠️ THE DAILY ENTRY IS MARKED NOW — CHANGED v3.68, GIGI'S DECISION.
//    From v3.6 to v3.67 this read "NOTHING IS GRADED, AND NOTHING IS
//    CORRECTED", and it was her rule. She overturned it on Aug 19 2026, having
//    been offered a separate graded daily piece instead:
//
//        "she isn't going to want to do the daily writing and the journal."
//
//    Two writing tasks a day means one gets done badly and the other resented.
//    NOTHING IS CORRECTED still holds — no spellcheck scolding, no red
//    underline, no "try again", and not one character of her text is ever
//    edited. The mark is a separate row keyed by entryId, and SHE SEES IT,
//    because §3.13.3 says a score returns to the learner or it is a judgement
//    made about her rather than for her.
//
// 2. THE WORD COUNT IS A DOOR, NOT A SCORE. It shows how many words she has and
//    how many make the entry count for Petals — then stops. It never says
//    "longer is better", because for a field note it very often is not.
//
// 3. THE KIND IS ASSIGNED; THE QUESTION IS NOT. Changed v3.68 — Gigi: "I also
//    don't want her to have a choice on what to journal." The weekday decides
//    which kind of entry she writes. "Give me another" still moves through the
//    QUESTIONS of that kind, and there is no blank-page mode. A blank page is
//    where a child sits for ten minutes and then says she does not like
//    writing.
// ---------------------------------------------------------------------------

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function prettyDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return String(iso).slice(0, 10);
  }
}

function Composer({ onDone }) {
  const saveEntry = useAppStore((s) => s.saveJournalEntry);
  // ASSIGNED BY THE DAY, not chosen. Gigi, Aug 19: "I also don't want her to
  // have a choice on what to journal." See assignedKindFor in journalPrompts.js.
  const kind = assignedKindFor(todayKey());
  const [nudge, setNudge] = useState(0);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Every day she has already written on. The mini-lesson walks in ORDER and
  // this is what moves it — her progress, never a date. See writingProgramme.js.
  const journal = useAppStore((s) => s.journal);
  const journalDays = useMemo(
    () => (journal || []).map((e) => String(e.at).slice(0, 10)),
    [journal]
  );
  const [showAnswer, setShowAnswer] = useState(false);

  const day = todayKey();
  // Taken from the DAY KEY, never from the clock, so a grown-up looking at the
  // Journal on a Sunday evening sees that day's lesson rather than a new one.
  const lesson = miniLessonFor(day, journalDays);
  const prompt = promptFor(kind, day, nudge);
  const meta = kindMeta(kind);
  const words = wordCount(text);
  const enough = words >= meta.minWords;

  async function save() {
    if (!text.trim() || busy) return;
    setBusy(true);
    await saveEntry({ kind, prompt, text });
    setBusy(false);
    setText('');
    setSaved(true);
    setNudge((n) => n + 1);
    onDone?.();
    setTimeout(() => setSaved(false), 3500);
  }

  return (
    <section className="panel px-5 py-5">
      <h2 className="font-display text-lg text-ink-900">Write something</h2>

      {/* ---- TODAY'S KIND IS ASSIGNED. No picker. ----
           Gigi, Aug 19: "I also don't want her to have a choice on what to
           journal." The day decides, derived from the weekday — so Wednesday is
           the same kind of writing whether or not she wrote on Tuesday.

           She can still press "Give me another" for a different QUESTION of
           that kind. A prompt she cannot get a purchase on is a blank page with
           extra steps, and that is the one choice worth keeping. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-sage-700 px-4 py-2 text-sm font-700 text-white">
          <span aria-hidden="true" className="mr-1.5">
            {meta.icon}
          </span>
          {meta.label}
        </span>
        <span className="text-xs text-ink-500">Today&rsquo;s writing</span>
      </div>
      <p className="mt-2 text-xs text-ink-500">{meta.blurb}</p>

      {/* ---- THE FIVE-MINUTE MINI-LESSON (v3.38, rebuilt v3.40) ----

          Gigi: "writing strategies and grammar usage should be taught in the
          daily journals." And then, when the first version got it wrong:
          "That isn't a lesson that makes sense... All lessons needs to be at
          the learning level."

          So it teaches, shows the answer when she asks for it, and gets out of
          the way. There is NO input here, no score, no tick and no place to
          submit anything. She says the answer out loud, then taps to check it.
          Nothing she says is collected and she is never marked on it — because
          the locked rule is that
          nothing in this Journal is ever graded or corrected, and a mini-lesson
          that quietly grew a box to type in would have broken it without
          anybody deciding to.

          The lesson comes from HER PROGRESS — how many days she has written —
          not from the date and not from a hash. That is what keeps the sentence
          work in order.

          check-writing reads this file as text and fails the build if a score,
          a mark, a correction or an input ever appears inside this block. */}
      <div className="mt-4 rounded-petal border border-lavender-300 bg-lavender-300/15 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="rounded-full bg-lavender-300/50 px-2 py-0.5 text-[0.65rem] font-700 text-lavender-700">
            {lesson.stage?.title}
          </span>
          <span className="tnum text-[0.65rem] text-ink-500">
            {lesson.position} of {lesson.of}
            {lesson.pass > 1 ? ' · second time round' : ''}
          </span>
        </div>
        <p className="mt-1.5 font-display text-base text-ink-900">{lesson.title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{lesson.plain}</p>
        <p className="mt-1 text-sm italic leading-relaxed text-ink-500">{lesson.example}</p>
        <p className="mt-2 text-sm text-ink-700">
          <span className="font-700">Try it:</span> {lesson.tryIt}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAnswer((v) => !v)}
            className="rounded-full border border-lavender-500 bg-white px-3 py-1 text-xs font-700 text-lavender-700 hover:bg-lavender-300/30"
          >
            {showAnswer ? 'Hide it' : 'Say it out loud, then check'}
          </button>
          {showAnswer && <span className="text-sm text-ink-900">{lesson.answer}</span>}
        </div>
        <p className="mt-2 text-xs text-ink-500">
          Nothing here is written down or kept. Then write your journal below.
        </p>
      </div>

      <div className="mt-4 rounded-petal border-2 border-sage-300 bg-sage-300/15 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-base leading-snug text-ink-900">{prompt}</p>
          <button
            type="button"
            onClick={() => setNudge((n) => n + 1)}
            className="shrink-0 rounded-full border border-sage-500 bg-white px-3 py-1 text-xs font-700 text-sage-700 hover:bg-sage-300/30"
          >
            Another
          </button>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={kind === 'write' ? 12 : 6}
        placeholder="Start here…"
        spellCheck={false}
        className="mt-3 w-full rounded-petal border border-cream-300 bg-white px-4 py-3 font-body text-base leading-relaxed text-ink-900 outline-none focus:border-sage-500"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-500">
          <span className="tnum font-700 text-ink-700">{words}</span>{' '}
          {words === 1 ? 'word' : 'words'}
          {!enough && (
            <span>
              {' '}
              · <span className="tnum">{meta.minWords - words}</span> more and this earns Petals
            </span>
          )}
          {enough && <span className="text-sage-700"> · this one earns Petals 🌸</span>}
        </p>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs font-700 text-sage-700">Saved to your journal ✓</span>}
          <button
            type="button"
            onClick={save}
            disabled={!text.trim() || busy}
            className="rounded-full bg-blush-500 px-6 py-2.5 text-sm font-700 text-white hover:bg-blush-700 disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Save it'}
          </button>
        </div>
      </div>
    </section>
  );
}

function EntryCard({ entry, onDelete }) {
  const [open, setOpen] = useState(false);
  const mark = useAppStore((s) => journalMarkForHer(s.journalMarkFor(entry.entryId)));
  const meta = kindMeta(entry.kind);
  const long = (entry.text || '').length > 220;
  const shown = open || !long ? entry.text : `${entry.text.slice(0, 220)}…`;

  return (
    <article className="rounded-petal border border-cream-300 bg-white px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-700 text-ink-700">
          <span aria-hidden="true" className="mr-1">
            {meta.icon}
          </span>
          {meta.label}
          <span className="ml-2 font-400 text-ink-500">{prettyDate(entry.at)}</span>
        </p>
        <p className="tnum text-[0.7rem] text-ink-500">{entry.words} words</p>
      </div>

      {entry.prompt && (
        <p className="mt-2 border-l-2 border-sage-300 pl-3 text-xs italic text-ink-500">
          {entry.prompt}
        </p>
      )}

      <p className="mt-2 whitespace-pre-wrap font-body text-sm leading-relaxed text-ink-900">
        {shown}
      </p>

      {/* ---- HER MARK. She asked for it and she gets to see it. ----

           Gigi chose, Aug 19, that the daily journal is graded AND that Azianna
           sees the grade. §3.13.3: "every scored item returns a comment to the
           learner, surfaced in the learner's own view, not buried in the
           adult's." A mark she cannot see is a mark about her, not for her.

           WARM, NEVER SOFTENED — §3.7.2 rule 2. The rows she did well are named
           and so are the rows she did not. There is no praise over a 1, because
           a child works out fast that praise arriving whatever she does is not
           about her.

           And it renders NOTHING when the entry is unmarked. An unmarked entry
           is not a zero, and a panel saying "not marked yet" on every entry is
           the app talking about itself. ---- */}
      {mark && (
        <div className="mt-3 rounded-petal border border-sage-500 bg-sage-300/15 px-3.5 py-2.5">
          <p className="tnum text-sm font-700 text-ink-900">
            {mark.letter} · {mark.percent}%
          </p>
          {mark.strong.length > 0 && (
            <p className="mt-1 text-[0.8rem] leading-snug text-ink-900">
              Strong: {mark.strong.join(' · ')}
            </p>
          )}
          {mark.working.length > 0 && (
            <p className="mt-0.5 text-[0.8rem] leading-snug text-ink-700">
              Working on: {mark.working.join(' · ')}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-3">
        {long && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-700 text-lavender-700 hover:underline"
          >
            {open ? 'Show less' : 'Read all of it'}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(entry)}
          className="text-xs text-ink-500 hover:text-clay-500 hover:underline"
        >
          Delete
        </button>
      </div>
    </article>
  );
}


// ---------------------------------------------------------------------------
// THE WRITING SHE HANDS IN — and the rubric she reads BEFORE she starts.
//
// ---- WHY IT IS ON THIS SCREEN AND NOT ANOTHER ONE ----
//
// This is where she writes. Putting the graded pieces anywhere else would mean
// a nine-year-old had to remember a second place, and the one she remembers is
// the one she uses.
//
// ---- WHY IT CANNOT BLUR INTO THE JOURNAL ----
//
// It is labelled, separated and worded so the line is unmissable: the journal
// above is never marked, this is. Nothing here writes to the journal and
// nothing in the journal is read by it.
//
// ---- THE RUBRIC COMES FIRST. THAT IS THE WHOLE DESIGN. ----
//
// A rubric she only meets afterwards is a mark scheme, not a teaching tool. She
// can open every row and read what a 4 looks like before she writes a word —
// and the research paper shows its five steps, because it is taught as five
// sessions rather than handed over whole.
// ---------------------------------------------------------------------------
function HandedInWriting() {
  const [open, setOpen] = useState(null);
  const slots = piecesForYear();

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg text-ink-900">Writing you hand in</h2>
      <p className="mt-1 text-sm text-ink-700">
        These ones <span className="font-700">are</span> marked — four book reports and two research
        papers in a year. Your journal above is never marked. Read the rubric first: it tells you
        exactly what a good one looks like before you start.
      </p>

      <div className="mt-4 space-y-2">
        {slots.map((slot) => {
          const piece = WRITING_PIECES.find((x) => x.id === slot.pieceId);
          const isOpen = open === slot.id;
          return (
            <div key={slot.id} className="rounded-petal border border-cream-300 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-base text-ink-900">{slot.title}</p>
                  <p className="text-xs text-ink-500">
                    About {slot.minutes} minutes · you may have it read aloud to you
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : slot.id)}
                  className="rounded-full border border-lavender-500 bg-white px-4 py-1.5 text-xs font-700 text-lavender-700 hover:bg-lavender-300/30"
                >
                  {isOpen ? 'Close' : 'What makes a good one'}
                </button>
              </div>

              {isOpen && (
                <div className="mt-3 space-y-3">
                  {piece.frame && (
                    <ol className="space-y-1.5">
                      {piece.frame.map((f) => (
                        <li key={f.n} className="text-sm text-ink-700">
                          <span className="font-700 text-ink-900">
                            {f.n}. {f.heading}
                          </span>{' '}
                          — {f.ask}
                        </li>
                      ))}
                    </ol>
                  )}

                  {piece.sequence && (
                    <ol className="space-y-1.5">
                      {piece.sequence.map((st) => (
                        <li key={st.n} className="text-sm text-ink-700">
                          <span className="font-700 text-ink-900">
                            Step {st.n} · {st.step}
                          </span>{' '}
                          — {st.ask}
                          <span className="block text-xs italic text-ink-500">{st.example}</span>
                        </li>
                      ))}
                    </ol>
                  )}

                  <div className="rounded-petal bg-cream-100 px-3 py-3">
                    <p className="text-xs font-700 uppercase tracking-wide text-ink-500">
                      How it is marked
                    </p>
                    {piece.rubric.map((row) => (
                      <div key={row.row} className="mt-2">
                        <p className="text-sm font-700 text-ink-900">{row.row}</p>
                        <p className="text-sm text-ink-700">
                          <span className="font-700">Best:</span> {row.l4}
                        </p>
                        <p className="text-xs text-ink-500">{row.l3}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function JournalView() {
  const journal = useAppStore((s) => s.journal);
  const removeEntry = useAppStore((s) => s.removeJournalEntry);
  const totalWords = useAppStore((s) => s.journalWordTotal());
  const [confirming, setConfirming] = useState(null);
  const [filter, setFilter] = useState('all');

  const entries = useMemo(() => {
    const list = [...journal].sort((a, b) => String(b.at).localeCompare(String(a.at)));
    return filter === 'all' ? list : list.filter((e) => e.kind === filter);
  }, [journal, filter]);

  const daysWritten = useMemo(
    () => new Set(journal.map((e) => String(e.at).slice(0, 10))).size,
    [journal]
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header>
        <p className="label-caps">Your own pages</p>
        <h1 className="mt-1 font-display text-3xl text-ink-900">The Herbalist’s Journal</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-700">
          Nobody marks this. Nobody corrects your spelling. This is where you write down what you
          actually saw — the way every herbalist and every doctor before you did.
        </p>
      </header>

      <div className="mt-5">
        <MarigoldMessage
          text="A field journal is a real instrument, the same as a scale or a hand lens. Write what is there, not what you think should be there — that is the whole trick, and most grown-ups never learn it."
          size="sm"
        />
      </div>

      {journal.length > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ['Entries', journal.length],
            ['Days written', daysWritten],
            ['Words in all', totalWords]
          ].map(([label, value]) => (
            <div key={label} className="rounded-petal bg-cream-100 px-3 py-3 text-center">
              <p className="tnum font-display text-2xl text-ink-900">{value.toLocaleString()}</p>
              <p className="text-[0.7rem] uppercase tracking-wide text-ink-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Composer />
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg text-ink-900">
            {journal.length === 0 ? 'Nothing written yet' : 'What you have written'}
          </h2>
          {journal.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {[['all', 'All'], ...JOURNAL_KINDS.map((k) => [k.id, k.label])].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-full px-3 py-1 text-xs font-700 ${
                    filter === id ? 'bg-lavender-500 text-white' : 'text-ink-700 hover:bg-cream-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {journal.length === 0 ? (
          <p className="mt-3 rounded-petal border border-dashed border-cream-300 px-4 py-8 text-center text-sm text-ink-500">
            Your first entry goes above. Two sentences counts.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {entries.map((e) => (
              <EntryCard key={e.entryId} entry={e} onDelete={setConfirming} />
            ))}
          </div>
        )}
      </section>

      <HandedInWriting />

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4">
          <div className="w-full max-w-sm rounded-petal bg-white px-5 py-5 shadow-lift">
            <h3 className="font-display text-lg text-ink-900">Delete this entry?</h3>
            <p className="mt-2 text-sm text-ink-700">
              This one cannot be got back. The Petals you earned for it stay.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="rounded-full border border-cream-300 bg-white px-4 py-2 text-sm font-700 text-ink-700"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={() => {
                  removeEntry(confirming.entryId);
                  setConfirming(null);
                }}
                className="rounded-full bg-clay-500 px-4 py-2 text-sm font-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
