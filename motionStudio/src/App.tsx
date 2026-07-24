import { useEffect, useRef } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import posthog from 'posthog-js';
import LandingPage from './features/landing/LandingPage';
import DashboardPage from './features/dashboard/DashboardPage';
import EditorPage from './features/workspace/EditorPage';
import ContactPage from './features/contact/ContactPage';
import ErrorPage from './pages/ErrorPage';
import { useAuth } from './hooks/useAuth';
import { useProjectStore, saveProject, loadProjects } from './engines/project';

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
      if (cloud.length > 0) setProjects(cloud);
      loadingRef.current = false;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Debounced auto-save — 2 s after last change, push all projects to cloud
  useEffect(() => {
    if (!user || loadingRef.current) return;
    const timer = setTimeout(() => {
      // Read from store at save-time so we always push the latest version
      useProjectStore.getState().projects.forEach((p) => void saveProject(p, user.id));
    }, 2000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, user?.id]);

  return null;
}

export default function App() {
  return (
    <>
      <AuthBridge />
      <CloudSync />
      <RouterProvider router={router} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
