import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { allWeeks, BANDS } from '../../config/assessment.js';
import { officialAttempt } from '../../lib/assessmentEngine.js';
import { reviewSummary, troubleSpots, dayKeyOf, daysBetween } from '../../lib/reviewQueue.js';
import { bankItemById, itemsForLessons } from '../../data/assessments/appBank.js'; // v3.25 — every course
import { HERBALISM_Q1 } from '../../data/lessons/herbalismQ1.js';

// ---------------------------------------------------------------------------
// THE GRADEBOOK.
//
// This is the half of the assessment system she never sees. She gets a band —
// Got it, Nearly there, Let's go back. A grown-up gets the number, every
// question, what she picked, and which lesson each miss traces back to.
//
// ---- WHY BOTH, RATHER THAN PICKING ONE ----
//
// A nine-year-old who is a year behind in reading does not need a percentage to
// carry around; it becomes an identity faster than anyone intends. But a school
// record built on "she seemed to be doing fine" is not a record, and this year
// is formally 4th grade — there has to be something a transcript can be built
// from that somebody else could check.
//
// So nothing is softened here. What is on this screen is exactly what happened,
// including the re-takes, including the attempts she failed. The kindness is in
// where the number is shown, not in whether it is true.
//
// ---- THE MOST USEFUL THING ON THIS SCREEN IS NOT THE SCORES ----
//
// It is "Slipping" — the questions she has met three or more times and misses
// more than half of. A test score says how one morning went. That list says
// what is not sticking, which is the thing a grown-up can actually do something
// about.
// ---------------------------------------------------------------------------

const BAND_STYLE = {
  'got-it': 'border-sage-500 bg-sage-300/25',
  nearly: 'border-gold-500 bg-gold-300/25',
  'go-back': 'border-clay-500 bg-clay-500/10'
};

function lessonLabel(lessonId) {
  const l = HERBALISM_Q1.find((x) => x.id === lessonId);
  return l ? `Lesson ${l.n} · ${l.title}` : lessonId;
}

function bandLabel(id) {
  return BANDS.find((b) => b.id === id)?.label || id;
}

export function GradebookPanel() {
  // Raw state subscriptions, then derive — see the note in LessonsView. A
  // selector that returns a fresh object every call re-renders this panel on
  // every unrelated store change.
  const attempts = useAppStore((s) => s.attempts);
  const reviewItems = useAppStore((s) => s.reviewItems);
  const lessonReads = useAppStore((s) => s.lessonReads);
  const attemptsByTest = useAppStore.getState().attemptsByTest();
  const [openAttempt, setOpenAttempt] = useState(null);

  const lessonsRead = Object.keys(lessonReads || {});
  const readQuestionIds = itemsForLessons(lessonsRead).map((q) => q.id);
  const summary = reviewSummary(reviewItems, readQuestionIds);
  const trouble = troubleSpots(reviewItems, 8);
  const today = dayKeyOf();

  // Every weekly test in the course, in teaching order. Was UNITS['herbalism-q1']
  // until v3.8 — four unit tests in one quarter. It is sixteen weekly tests
  // across two quarters now, and the ids are the test ids either way.
  const weeks = allWeeks();

  if (!attempts.length && !lessonsRead.length) {
    return (
      <div className="panel px-5 py-6">
        <h2 className="font-display text-lg text-ink-900">Nothing recorded yet</h2>
        <p className="mt-2 text-sm text-ink-700">
          This page fills in as she reads lessons and sits weekly tests. It holds every test she
          takes, question by question — what she picked, what was right, and which lesson each miss
          came from.
        </p>
        <p className="mt-2 text-xs text-ink-500">
          She never sees a percentage. She sees Got it, Nearly there, or Let&apos;s go back. The
          numbers live here, because a school record has to be checkable and a nine-year-old does
          not need a number to carry around.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ---- what is actually sticking ---- */}
      <section className="panel px-5 py-5">
        <h2 className="font-display text-lg text-ink-900">What is sticking</h2>
        <p className="mt-1 text-xs text-ink-700">
          Across the {summary.total} questions from the {lessonsRead.length} lessons she has read.
          This comes from her daily warm-ups as well as her tests, so it is a truer read than any
          single morning.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <Stat n={summary.solid} label="Solid" hint="Answered right at long gaps" tone="sage" />
          <Stat n={summary.settling} label="Settling" hint="Still on short gaps" tone="gold" />
          <Stat n={summary.slipping} label="Slipping" hint="Missed more often than not" tone="clay" />
          <Stat n={summary.unseen} label="Not yet met" hint="Waiting in the bank" tone="plain" />
        </div>

        {trouble.length > 0 && (
          <div className="mt-4">
            <p className="label-caps">Worth sitting down with her about</p>
            <div className="mt-2 space-y-1.5">
              {trouble.map((it) => {
                const q = bankItemById(it.questionId);
                if (!q) return null;
                const overdue = daysBetween(it.dueOn, today);
                return (
                  <div
                    key={it.questionId}
                    className="rounded-petal border border-cream-300 bg-white px-3.5 py-2.5"
                  >
                    <p className="text-sm text-ink-900">{q.prompt}</p>
                    <p className="mt-0.5 text-[0.7rem] text-ink-500">
                      {lessonLabel(q.lesson)} · seen {it.seen}, missed {it.missed} ·{' '}
                      {overdue >= 0 ? 'due now' : `back in ${-overdue} day${overdue === -1 ? '' : 's'}`}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-ink-700">
                      Right answer: <span className="font-700">{q.choices[q.answer]}</span> — {q.why}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ---- the practice gate ---- */}
      {lessonsRead.length > 0 && (
        <section className="panel px-5 py-5">
          <h2 className="font-display text-lg text-ink-900">Lessons and the practice gate</h2>
          <p className="mt-1 text-xs text-ink-700">
            Each lesson ends in a quick check. Miss more than one and she is served extra practice
            from that lesson&apos;s own question bank before she finishes. It never blocks her —
            what it does is make sure a lesson she did not understand shows up here instead of
            passing silently.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-cream-300 text-[0.7rem] uppercase tracking-wide text-ink-500">
                  <th className="py-2 pr-3">Lesson</th>
                  <th className="py-2 pr-3">Check</th>
                  <th className="py-2 pr-3">Extra practice</th>
                  <th className="py-2">Reads</th>
                </tr>
              </thead>
              <tbody>
                {HERBALISM_Q1.filter((l) => lessonReads[l.id]).map((l) => {
                  const row = lessonReads[l.id];
                  const p = row.practice;
                  return (
                    <tr
                      key={l.id}
                      className={`border-b border-cream-200 ${p && p.passed === false ? 'bg-gold-300/20' : ''}`}
                    >
                      <td className="py-2.5 pr-3 font-700 text-ink-900">
                        {l.n}. {l.title}
                      </td>
                      <td className="tnum py-2.5 pr-3">
                        {p ? `${p.correct}/${p.asked}${p.passed === false ? ' · shaky' : ''}` : '—'}
                      </td>
                      <td className="tnum py-2.5 pr-3">
                        {p?.extraServed ? `${p.extraCorrect}/${p.extraServed}` : '—'}
                      </td>
                      <td className="tnum py-2.5">{row.reads}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            A dash under Check means she finished that lesson before the gate existed, or without
            doing the check. The row shows her LATEST attempt, not her best — a lesson she has since
            fumbled should say so.
          </p>
        </section>
      )}

      {/* ---- the tests ---- */}
      <section className="panel px-5 py-5">
        <h2 className="font-display text-lg text-ink-900">Herbalism · Quarter 1</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cream-300 text-[0.7rem] uppercase tracking-wide text-ink-500">
                <th className="py-2 pr-3">Test</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Band</th>
                <th className="py-2 pr-3">Attempts</th>
                <th className="py-2">Taken</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((u) => {
                const list = attemptsByTest[u.id] || [];
                const off = officialAttempt(list);
                return (
                  <tr key={u.id} className="border-b border-cream-200">
                    <td className="py-2.5 pr-3 font-700 text-ink-900">
                      Q{u.quarter} Week {u.n} · {u.title}
                    </td>
                    <td className="tnum py-2.5 pr-3">
                      {off ? `${off.right}/${off.total} · ${off.percent}%` : '—'}
                    </td>
                    <td className="py-2.5 pr-3">{off ? bandLabel(off.bandId) : 'Not sat'}</td>
                    <td className="tnum py-2.5 pr-3">{list.length || '—'}</td>
                    <td className="py-2.5 text-xs text-ink-500">{off?.dayKey || '—'}</td>
                  </tr>
                );
              })}
              {[1, 2].map((q) => {
                const list = attemptsByTest[`herbalism-q${q}-final`] || [];
                const off = officialAttempt(list);
                return (
                  <tr key={`qexam-${q}`} className="bg-gold-300/15">
                    <td className="py-2.5 pr-3 font-700 text-ink-900">Quarter {q} Exam</td>
                    <td className="tnum py-2.5 pr-3">
                      {off ? `${off.right}/${off.total} · ${off.percent}%` : '—'}
                    </td>
                    <td className="py-2.5 pr-3">{off ? bandLabel(off.bandId) : 'Not sat'}</td>
                    <td className="tnum py-2.5 pr-3">{list.length || '—'}</td>
                    <td className="py-2.5 text-xs text-ink-500">{off?.dayKey || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-500">
          The score shown is the LATEST attempt, not the best one, and the attempts column says how
          many there were. A re-take that is hidden is a record nobody can trust.
        </p>
      </section>

      {/* ---- every attempt, question by question ---- */}
      <section className="panel px-5 py-5">
        <h2 className="font-display text-lg text-ink-900">Every attempt, question by question</h2>
        {attempts.length === 0 ? (
          <p className="mt-2 text-sm text-ink-700">No tests sat yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {[...attempts].reverse().map((a) => (
              <div key={a.attemptId} className={`rounded-petal border-2 ${BAND_STYLE[a.bandId]}`}>
                <button
                  type="button"
                  onClick={() => setOpenAttempt(openAttempt === a.attemptId ? null : a.attemptId)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-sm font-700 text-ink-900">{a.title}</span>
                    <span className="block text-[0.7rem] text-ink-700">
                      {a.dayKey} · attempt {a.attempt} · {bandLabel(a.bandId)}
                    </span>
                  </span>
                  <span className="tnum text-sm font-700 text-ink-900">
                    {a.right}/{a.total} · {a.percent}%
                  </span>
                </button>

                {openAttempt === a.attemptId && (
                  <div className="border-t border-white/60 bg-white/70 px-4 py-3">
                    {a.revisit?.length > 0 && (
                      <p className="mb-2 text-xs text-ink-700">
                        Sent back to:{' '}
                        {a.revisit.map((r) => lessonLabel(r.lesson).replace('Lesson ', 'L')).join(', ')}
                      </p>
                    )}
                    <ol className="space-y-1.5 text-xs">
                      {a.rows.map((r, i) => {
                        const q = bankItemById(r.questionId);
                        return (
                          <li key={r.questionId} className="flex gap-2">
                            <span
                              className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full text-[0.6rem] font-700 ${
                                r.correct ? 'bg-sage-500 text-white' : 'bg-clay-500 text-white'
                              }`}
                            >
                              {r.correct ? '✓' : '✗'}
                            </span>
                            <span>
                              <span className="text-ink-900">
                                {i + 1}. {q?.prompt || r.questionId}
                              </span>
                              {!r.correct && (
                                <span className="block text-ink-700">
                                  {r.skipped
                                    ? 'Left blank.'
                                    : `She chose "${q?.choices?.[r.chosen] ?? r.chosen}". Right answer: "${q?.choices?.[r.answer] ?? r.answer}".`}
                                </span>
                              )}
                              <span className="block text-[0.65rem] text-ink-500">
                                {lessonLabel(r.lesson)}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const STAT_TONE = {
  sage: 'border-sage-500/50 bg-sage-300/20',
  gold: 'border-gold-500/50 bg-gold-300/20',
  clay: 'border-clay-500/50 bg-clay-500/10',
  plain: 'border-cream-300 bg-white'
};

function Stat({ n, label, hint, tone }) {
  return (
    <div className={`rounded-petal border-2 px-3.5 py-3 ${STAT_TONE[tone]}`}>
      <p className="tnum font-display text-2xl text-ink-900">{n}</p>
      <p className="text-xs font-700 text-ink-900">{label}</p>
      <p className="mt-0.5 text-[0.65rem] leading-snug text-ink-700">{hint}</p>
    </div>
  );
}
