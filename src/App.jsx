import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore.js';
import { NavBar } from './components/Navigation/NavBar.jsx';
import { HomeDashboard } from './components/Home/HomeDashboard.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { ParentGate } from './components/Parent/ParentGate.jsx';
import { currentReadingCheck } from './lib/readingCheck.js';

// The Home screen is the first paint, so it is imported directly. Everything
// else is reachable only by a nav tab or a button on Home, so none of it needs
// to be in the bundle the browser parses before the greenhouse appears.
// ParentGate is deliberately NOT lazy — it must render the lock screen without
// first downloading the dashboard it is guarding.
const DiagnosticView = lazy(() =>
  import('./components/Diagnostic/DiagnosticView.jsx').then((m) => ({ default: m.DiagnosticView }))
);
const LevelsView = lazy(() =>
  import('./components/Levels/LevelsView.jsx').then((m) => ({ default: m.LevelsView }))
);
const PlanView = lazy(() =>
  import('./components/Plan/PlanView.jsx').then((m) => ({ default: m.PlanView }))
);
const HerbLibraryView = lazy(() =>
  import('./components/Herbs/HerbLibraryView.jsx').then((m) => ({ default: m.HerbLibraryView }))
);

// Something to do instead of walking away — Gigi, Aug 19. Never locked.
const GamesView = lazy(() =>
  import('./components/Games/GamesView.jsx').then((m) => ({ default: m.GamesView }))
);

// Singing & Yoga — Azianna asked for it, Aug 19. Participation, never graded.
const MovementView = lazy(() =>
  import('./components/Movement/MovementView.jsx').then((m) => ({ default: m.MovementView }))
);
const MarketView = lazy(() =>
  import('./components/Rewards/MarketView.jsx').then((m) => ({ default: m.MarketView }))
);
const GreenhouseView = lazy(() =>
  import('./components/Rewards/GreenhouseView.jsx').then((m) => ({ default: m.GreenhouseView }))
);
const YearPlanView = lazy(() =>
  import('./components/Plan/YearPlanView.jsx').then((m) => ({ default: m.YearPlanView }))
);
const TodayView = lazy(() =>
  import('./components/Schedule/TodayView.jsx').then((m) => ({ default: m.TodayView }))
);
const CatchUpView = lazy(() =>
  import('./components/Schedule/CatchUpView.jsx').then((m) => ({ default: m.CatchUpView }))
);
const LessonsView = lazy(() =>
  import('./components/Lessons/LessonsView.jsx').then((m) => ({ default: m.LessonsView }))
);
const JournalView = lazy(() =>
  import('./components/Journal/JournalView.jsx').then((m) => ({ default: m.JournalView }))
);
const ReadingCheckView = lazy(() =>
  import('./components/Assess/ReadingCheckView.jsx').then((m) => ({ default: m.ReadingCheckView }))
);
const ParentDashboard = lazy(() =>
  import('./components/Parent/ParentDashboard.jsx').then((m) => ({ default: m.ParentDashboard }))
);

/**
 * THE ADDRESS THIS APP IS ACTUALLY OPEN AT.
 *
 * Saved work does not live in the app folder. It lives in the browser, filed
 * under the exact address the page was opened at — so localhost:5180 and
 * localhost:5181 hold two completely separate sets of data.
 *
 * That distinction is invisible, and it cost a real afternoon: Vite used to
 * slide to the next free port when 5180 was busy, which happens the moment two
 * servers are running at once. The app opened, looked completely normal, and
 * every saved thing appeared to be gone. It was not gone. It was at the other
 * address.
 *
 * strictPort in vite.config.js stops that happening again. This banner is the
 * belt to that braces: if the page is ever open anywhere other than 5180, it
 * says so on screen and says where the work actually is, rather than letting
 * anyone conclude the data was deleted.
 */
const EXPECTED_PORT = '5180';

function WrongPortBanner() {
  if (typeof window === 'undefined') return null;
  const port = window.location.port;
  if (!port || port === EXPECTED_PORT) return null;
  return (
    <div className="print-hide border-b-2 border-clay-500 bg-clay-500/10 px-4 py-3 text-center text-sm text-ink-900">
      <p className="font-700">
        This is open at localhost:{port}, not localhost:{EXPECTED_PORT}.
      </p>
      <p className="mt-1 text-xs text-ink-700">
        Saved work is filed under the address it was opened at, so this page has its own separate,
        empty set of data. Nothing has been deleted — it is all at{' '}
        <a
          href={`http://localhost:${EXPECTED_PORT}`}
          className="font-700 text-clay-500 underline"
        >
          localhost:{EXPECTED_PORT}
        </a>
        . Close the other black window, then start the app again.
      </p>
    </div>
  );
}

function ScreenLoading() {
  return (
    <div className="flex h-[50vh] items-center justify-center text-ink-500">
      <p className="font-display text-sm">Growing…</p>
    </div>
  );
}

export default function App() {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrationError = useAppStore((s) => s.hydrationError);
  const retryHydrate = useAppStore((s) => s.retryHydrate);

  const [view, setView] = useState('home');
  const [dbNotice, setDbNotice] = useState(null);

  // v3.80 — which reading check is hers today, derived rather than routed.
  // Passing an id through navigate() would give the button and the screen two
  // ways to disagree about which unit she is on; asking the same function twice
  // gives them none.
  const strands = useAppStore((s) => s.strands);
  const khanGrades = useAppStore((s) => s.khanGrades);
  const readingUnitId = currentReadingCheck(strands, khanGrades)?.id ?? null;

  // v3.42 — WHICH COURSE A LINK MEANT, not just which tab.
  //
  // Every screen navigates with onNavigate(view). LessonsView holds its own
  // course switcher and starts on APP_COURSES[0], which is Herbalism. So the
  // moment the timetable gained a working Social Studies link, pressing it
  // would have opened HERBALISM — the v3.20 bug in a new coat, "her schedule
  // opened a course index, not her unit".
  //
  // navigate(view, course) is backwards compatible: navigate('journal') still
  // works everywhere it is already called with one argument, and the course is
  // simply cleared. Only the lessons tab reads it.
  //
  // v3.79 — AND WHICH LESSON, when the link meant one lesson and not a course.
  //
  // Gigi, Aug 25 2026: "her today prompt just sends her to the lesson she is to
  // complete". resolveBlockTarget now returns a lessonId for the four courses
  // this app teaches. Without a third argument here it would be computed
  // correctly and then thrown away one function later — the target would know
  // the answer and the screen would still open the index.
  //
  // navigate(view, course, lesson) stays backwards compatible in both
  // directions: navigate('journal') and navigate('lessons', 'social') are
  // unchanged everywhere they are already called, and the lesson is cleared.
  const [viewCourse, setViewCourse] = useState(null);
  const [viewLesson, setViewLesson] = useState(null);
  const navigate = useCallback((next, course = null, lesson = null) => {
    setView(next);
    setViewCourse(course || null);
    setViewLesson(lesson || null);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onBlocked = () => setDbNotice('blocked');
    const onVersionChange = () => setDbNotice('versionchange');
    window.addEventListener('pp-db-blocked', onBlocked);
    window.addEventListener('pp-db-versionchange', onVersionChange);
    return () => {
      window.removeEventListener('pp-db-blocked', onBlocked);
      window.removeEventListener('pp-db-versionchange', onVersionChange);
    };
  }, []);

  if (!hydrated) {
    const problem = hydrationError || dbNotice;
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <WrongPortBanner />
        {problem ? (
          <>
            <p className="text-4xl">🌱</p>
            <p className="font-display text-lg text-ink-900">Your saved work could not open</p>
            <p className="max-w-md text-sm text-ink-700">
              {dbNotice === 'blocked'
                ? 'Petal & Pestle looks open in another tab. Close the other tab, then press Try Again.'
                : dbNotice === 'versionchange'
                  ? 'The app was updated in another tab. Reload this one to catch up — nothing is lost.'
                  : `Everything is still saved on this computer, but the app could not read it: ${hydrationError}`}
            </p>
            <button
              type="button"
              onClick={() => {
                if (dbNotice === 'versionchange') return window.location.reload();
                setDbNotice(null);
                retryHydrate();
              }}
              className="rounded-full bg-blush-500 px-6 py-2.5 font-700 text-white hover:bg-blush-700"
            >
              {dbNotice === 'versionchange' ? 'Reload' : 'Try again'}
            </button>
          </>
        ) : (
          <p className="font-display text-sm text-ink-500">Opening the greenhouse…</p>
        )}
      </div>
    );
  }

  // The Grown-Up Corner replaces the whole screen, nav included — it is not a
  // tab she should be able to wander back out of by tapping something behind it.
  if (view === 'parent') {
    return (
      <div className="min-h-screen">
        <ErrorBoundary>
          <Suspense fallback={<ScreenLoading />}>
            <ParentGate onExit={() => setView('home')}>
              <ParentDashboard onExit={() => setView('home')} />
            </ParentGate>
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <WrongPortBanner />
      {dbNotice === 'versionchange' && (
        <div className="print-hide flex items-center justify-center gap-3 border-b border-gold-500/40 bg-gold-300/30 px-4 py-2 text-center text-xs text-ink-700">
          <span>The app was updated in another tab — reload this one to catch up.</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-cream-300 bg-white px-3 py-1 font-700"
          >
            Reload
          </button>
        </div>
      )}
      <NavBar view={view} onNavigate={navigate} />
      <ErrorBoundary>
        <Suspense fallback={<ScreenLoading />}>
          {view === 'home' && <HomeDashboard onNavigate={navigate} />}
          {view === 'today' && <TodayView onNavigate={navigate} />}
          {view === 'lessons' && (
            <LessonsView onNavigate={navigate} courseId={viewCourse} lessonId={viewLesson} />
          )}
          {/* v3.80 — the reading check. It works out WHICH unit she is on
              itself, from her strand levels, rather than being handed an id:
              one definition of "which Khan reading unit is she in", asked by
              both the button on Today and the screen it opens. */}
          {view === 'reading' && <ReadingCheckView unitId={readingUnitId} onExit={() => navigate('today')} />}
          {view === 'friday' && <CatchUpView onNavigate={navigate} />}
          {view === 'journal' && <JournalView />}
          {view === 'diagnostic' && <DiagnosticView onNavigate={navigate} />}
          {view === 'levels' && <LevelsView onNavigate={navigate} />}
          {view === 'plan' && <PlanView onNavigate={navigate} />}
          {view === 'year' && <YearPlanView onNavigate={navigate} />}
          {view === 'greenhouse' && <GreenhouseView onNavigate={navigate} />}
          {view === 'market' && <MarketView onNavigate={navigate} />}
          {view === 'herbs' && <HerbLibraryView />}
          {view === 'games' && <GamesView />}
          {view === 'movement' && <MovementView />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
