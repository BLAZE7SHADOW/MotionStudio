import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import posthog from 'posthog-js';
import LandingPage from './features/landing/LandingPage';
import DashboardPage from './features/dashboard/DashboardPage';
import EditorPage from './features/workspace/EditorPage';
import ContactPage from './features/contact/ContactPage';
import ErrorPage from './pages/ErrorPage';
import UpdateBanner from './components/UpdateBanner';
import NoticeHost from './components/NoticeHost';
import { useAuth } from './hooks/useAuth';
import { useProjectStore, saveProject, loadProjects, isFromFuture } from './engines/project';
import { rehydrateAssets } from './engines/asset';
import { isReadOnly } from './lib/projectLock';
import { setSaveStatus } from './lib/saveState';
import { showNotice } from './lib/noticeStore';

// Fires a PostHog $pageview on every SPA route change.
// Must live inside the router so useLocation works.
function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    posthog.capture('$pageview', { $current_url: window.location.href });
  }, [location.pathname]);
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <PageTracker />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/',                  element: <LandingPage /> },
      { path: '/dashboard',         element: <DashboardPage /> },
      { path: '/editor/:projectId', element: <EditorPage /> },
      { path: '/contact',          element: <ContactPage /> },
      { path: '*',                  element: <ErrorPage /> },
    ],
  },
]);

const LAST_USER_KEY = 'ms_last_user';

function AuthBridge() {
  const { user, loading } = useAuth();
  const clearAll = useProjectStore((s) => s.clearAll);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (loading) return;

    const currentId = user?.id ?? null;
    const storedId = localStorage.getItem(LAST_USER_KEY);

    if (prevUserIdRef.current === undefined) {
      if (currentId !== storedId) clearAll();
      prevUserIdRef.current = currentId;
      if (currentId) localStorage.setItem(LAST_USER_KEY, currentId);
      else localStorage.removeItem(LAST_USER_KEY);
      return;
    }

    if (currentId !== prevUserIdRef.current) {
      clearAll();
      prevUserIdRef.current = currentId;
      if (currentId) localStorage.setItem(LAST_USER_KEY, currentId);
      else localStorage.removeItem(LAST_USER_KEY);
    }
  }, [loading, user, clearAll]);

  return null;
}

/**
 * Syncs the project store to Supabase for logged-in users.
 * On login: pulls cloud projects (replaces local — cloud is the source of truth).
 * On any project change: debounce 2s then upsert all projects.
 */
function CloudSync() {
  const { user } = useAuth();
  const projects  = useProjectStore((s) => s.projects);
  const setProjects = useProjectStore((s) => s.setProjects);
  // Track whether we are mid-load so we skip the immediate post-load save
  const loadingRef = useRef(false);

  // Pull from cloud when a user logs in
  useEffect(() => {
    if (!user) return;
    loadingRef.current = true;
    void loadProjects(user.id).then((cloud) => {
      if (cloud.length > 0) {
        setProjects(cloud);
        /* `setProjects` replaces the whole array, so it also replaces whatever
           `rehydrateAssets` resolved when the editor opened — and it lands
           roughly a second later, so it always wins. Every project with media
           came back from a reload showing "Re-upload needed" while its files sat
           safely in IndexedDB and S3.

           `forStorage` stops new rows carrying dead `blob:` urls, but rows
           written before it, and the empty urls it writes now, both still need
           resolving against this device. Re-running the relink here is what
           makes the order stop mattering. Only the open project needs it; the
           dashboard reads thumbnails, not asset bytes. */
        const openId = useProjectStore.getState().activeProjectId;
        if (openId) void rehydrateAssets(openId);
      }
      loadingRef.current = false;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /* What we have already pushed, per project id, keyed by `updatedAt`.
     Without this the effect re-uploaded *every* project on every keystroke —
     open five projects, edit one, and four untouched blobs went over the wire
     every two seconds. */
  const pushedRef = useRef(new Map<string, number>());

  const flush = useCallback(async () => {
    if (!user) return;
    const due = useProjectStore.getState().projects.filter((p) => {
      // Skip anything this tab holds read-only: we push whole projects, so a
      // tab looking at a project another tab is editing would otherwise write
      // its stale copy straight over the live one.
      if (isReadOnly(p.id)) return false;
      // Never write our older reading of a project a newer build wrote.
      if (isFromFuture(p)) return false;
      return pushedRef.current.get(p.id) !== p.updatedAt;
    });
    if (due.length === 0) return;

    setSaveStatus('saving');
    const results = await Promise.all(
      due.map(async (p) => ({ project: p, result: await saveProject(p, user.id) })),
    );

    for (const { project, result } of results) {
      if (result.ok) pushedRef.current.set(project.id, project.updatedAt);
    }

    const failures = results.filter((r) => !r.result.ok);
    if (failures.length === 0) {
      setSaveStatus('saved');
      return;
    }
    // One failure is enough to stop claiming everything is saved. Offline wins
    // over a server error when both happen: it is the one the user can act on.
    const first = failures.find((f) => !f.result.ok && f.result.offline) ?? failures[0];
    const r = first.result as { ok: false; offline: boolean; message: string };
    setSaveStatus(r.offline ? 'offline' : 'failed', r.message);
  }, [user]);

  // Debounced auto-save — 2 s after the last change.
  useEffect(() => {
    if (!user || loadingRef.current) return;
    const timer = setTimeout(() => void flush(), 2000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, user?.id, flush]);

  /* Coming back online is the one failure worth retrying by itself: nothing the
     user does will trigger the debounce if they simply stopped typing while the
     connection was down, and their last edit would sit unsaved indefinitely. */
  useEffect(() => {
    const onOnline = () => void flush();
    const onOffline = () => setSaveStatus('offline', 'No internet connection');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [flush]);

  /* A project written by a newer build is displayed but never overwritten.
     Say so, or the user just sees edits that never stick. */
  const warnedFuture = useRef(false);
  useEffect(() => {
    if (warnedFuture.current) return;
    if (!projects.some(isFromFuture)) return;
    warnedFuture.current = true;
    showNotice({
      id: 'project-from-future',
      message:
        'A project here was saved by a newer version of MotionStudio. You can look at it, but changes won’t be saved until you reload.',
    });
  }, [projects]);

  return null;
}

export default function App() {
  /* Drop the pre-JS skeleton from `index.html`.

     A layout effect, not an effect and not a timer: layout effects run after
     React has written the DOM but *before* the browser paints, so there is
     never a frame with both the skeleton and the app on screen. On a timer
     they would overlap; on a plain effect they can. */
  useLayoutEffect(() => {
    document.getElementById('ms-skeleton')?.remove();
  }, []);

  return (
    <>
      <AuthBridge />
      <CloudSync />
      <RouterProvider router={router} />
      {/* One stack for everything the app says to you, so a contextual hint and
          an update prompt can never land on top of each other.

          Top-right, not bottom-centre: the bottom of the editor is the timeline,
          and the first notice we wrote — "the beats are marked along the
          timeline" — covered the grid it was pointing at. A hint that hides its
          own subject is worse than no hint. `pointer-events-none` on the column
          keeps the gap between cards clickable. */}
      <div className="pointer-events-none fixed top-14 right-4 z-100 flex flex-col items-end gap-2">
        <NoticeHost />
        <UpdateBanner />
      </div>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
