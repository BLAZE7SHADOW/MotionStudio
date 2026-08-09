import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import {
  decideTransition,
  readOwner,
  writeOwner,
  markPendingMerge,
  takePendingMerge,
} from './lib/projectOwner';

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

/**
 * Ties the PostHog person to whoever is actually signed in, right where the
 * app already watches for an account switch — this is the same "identity
 * changed" moment `clearAll` reacts to, not a second place to detect it.
 *
 * `distinct_id` stays the stable Supabase UUID, not the email itself: email
 * is a property on the person, not the id PostHog keys events by. An email
 * can change (or, for a guest, doesn't exist); a UUID never does, and
 * merging two distinct_ids after an email edit is exactly the kind of
 * cleanup this sidesteps. PostHog's own Persons view surfaces the `email`
 * property as the person's display name automatically, so this is still
 * "see the email in the dashboard" — just without keying identity on a
 * value that can change.
 *
 * Guests have no email, so they're never identified — anonymous events stay
 * anonymous, which is the honest state. `reset()` on sign-out (or a switch
 * to a guest session) is what stops the *next* session on a shared device
 * from inheriting the previous person's identity.
 */
function identify(user: { id: string; email?: string } | null): void {
  if (user?.email) posthog.identify(user.id, { email: user.email });
  else posthog.reset();
}

function AuthBridge() {
  const { user, loading } = useAuth();
  const clearAll = useProjectStore((s) => s.clearAll);

  /* `persist` rehydrates from storage asynchronously, and this effect can win
     that race — in which case `clearAll()` empties a store that hydration then
     refills from the copy it had already read, and the wipe silently doesn't
     happen. Found by setting a foreign owner and watching the projects survive
     a reload; it predates the ownership rules below and made the wipe
     unreliable rather than wrong. Waiting for hydration is what makes the
     decision act on the real state. */
  const [hydrated, setHydrated] = useState(() => useProjectStore.persist.hasHydrated());
  useEffect(() => useProjectStore.persist.onFinishHydration(() => setHydrated(true)), []);

  useEffect(() => {
    if (loading || !hydrated) return;

    // Both the first-mount and the live-change case ask the same question of
    // the same persisted marker, so they run the same code. They used to
    // differ — first mount compared against storage, later changes compared
    // against a ref — and the live-change branch wiped unconditionally on any
    // id change, which is what destroyed guest work on sign-up.
    const next = user ? { id: user.id, anonymous: user.is_anonymous ?? false } : null;
    const transition = decideTransition(readOwner(), next);

    if (transition.kind === 'wipe') {
      clearAll();
    } else if (transition.kind === 'adopt') {
      // These projects have a new owner and no cloud row yet. Tell the pull
      // below to merge rather than replace, or it drops them a second later.
      markPendingMerge();
    }

    /* Record the owner on every resolved session, not just the ones that
       changed something. A guest already signed in when this shipped has an
       id but no `anonymous` flag — it predates the flag — and a missing flag
       reads as a real account, which would route them straight back into the
       wipe this exists to prevent. Rewriting on 'keep' backfills them.

       Signing out is the exception: `next` is null, and the marker has to
       outlive the session so the wipe can still fire if someone else arrives. */
    if (next) writeOwner(next);

    identify(user);
  }, [loading, hydrated, user, clearAll]);

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
  const setCloudSyncing = useProjectStore((s) => s.setCloudSyncing);
  // Track whether we are mid-load so we skip the immediate post-load save
  const loadingRef = useRef(false);

  // Pull from cloud when a user logs in
  useEffect(() => {
    if (!user) return;
    loadingRef.current = true;
    setCloudSyncing(true);
    const merging = takePendingMerge();
    void loadProjects(user.id).then((result) => {
      loadingRef.current = false;
      setCloudSyncing(false);

      /* Reaching the cloud failed. Keep whatever is on this device and say so
         — replacing it with nothing would show the "make your first video"
         empty state to someone whose projects are fine and simply out of
         reach, which reads as data loss. */
      if (!result.ok) {
        showNotice({
          id: 'cloud-load-failed',
          message:
            'Couldn’t reach your cloud projects just now. You’re seeing what’s saved on this device — reload once you’re back online.',
        });
        return;
      }

      const cloud = result.projects;

      /* Projects carried across an account change have no cloud row yet, so a
         plain `setProjects(cloud)` would delete exactly the work `AuthBridge`
         just rescued. Cloud wins on a shared id (it is the canonical copy);
         anything local the cloud has never seen rides along and gets pushed up
         by the next debounced save. */
      if (merging) {
        const cloudIds = new Set(cloud.map((p) => p.id));
        const carried = useProjectStore.getState().projects.filter((p) => !cloudIds.has(p.id));
        if (cloud.length > 0 || carried.length > 0) setProjects([...cloud, ...carried]);
      } else if (cloud.length > 0) {
        setProjects(cloud);
      }

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

  /* Closing the tab inside the 2 s debounce, or while a save is failing.
     Nothing is lost *on this device* — zustand's `persist` writes to IndexedDB
     on every change, synchronously with the edit — so this warns about the
     cross-device case: the cloud copy is behind, and the next machine they
     open would show older work.

     Guests are deliberately never warned. They have no cloud copy for anything
     to fall behind, so the prompt would be asking them to worry about a
     problem they cannot have. `pushedRef` is already the record of what has
     and hasn't reached the server, so this reads existing state rather than
     tracking dirtiness a second time. */
  useEffect(() => {
    if (!user) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const unsynced = useProjectStore.getState().projects.some(
        (p) => !isReadOnly(p.id) && !isFromFuture(p) && pushedRef.current.get(p.id) !== p.updatedAt,
      );
      if (!unsynced) return;
      // The modern signal; `returnValue` is the one older browsers read.
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [user]);

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
      {/* "You did that" toolbar confirmations (text/shader/block added) — a
          separate stack from the notice pair above because these can
          legitimately fire more than once in a row (double-click insert),
          which the single-notice host deliberately never does. */}
      <ToastContainer
        position="top-center"
        icon={false}
        closeButton={false}
        hideProgressBar
        toastClassName="!min-h-0 !p-0 !shadow-none !bg-transparent"
      />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
