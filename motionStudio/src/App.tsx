import { useEffect, useRef } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import LandingPage from './features/landing/LandingPage';
import DashboardPage from './features/dashboard/DashboardPage';
import EditorPage from './features/workspace/EditorPage';
import { useAuth } from './hooks/useAuth';
import { useProjectStore } from './engines/project';

const router = createBrowserRouter([
  { path: '/',                element: <LandingPage /> },
  { path: '/dashboard',       element: <DashboardPage /> },
  { path: '/editor/:projectId', element: <EditorPage /> },
]);

const LAST_USER_KEY = 'ms_last_user';

// Sits above the router so it runs on every route without re-mounting.
// Detects account switches and wipes local project data to prevent bleed.
function AuthBridge() {
  const { user, loading } = useAuth();
  const clearAll = useProjectStore((s) => s.clearAll);
  // track previous user id across renders without causing extra re-renders
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (loading) return;

    const currentId = user?.id ?? null;
    const storedId = localStorage.getItem(LAST_USER_KEY);

    // undefined means "first run this session" — skip the check and just record
    if (prevUserIdRef.current === undefined) {
      // different account from last session → clear stale local data
      if (currentId !== storedId) {
        clearAll();
      }
      prevUserIdRef.current = currentId;
      if (currentId) {
        localStorage.setItem(LAST_USER_KEY, currentId);
      } else {
        localStorage.removeItem(LAST_USER_KEY);
      }
      return;
    }

    // user switched accounts or signed out mid-session
    if (currentId !== prevUserIdRef.current) {
      clearAll();
      prevUserIdRef.current = currentId;
      if (currentId) {
        localStorage.setItem(LAST_USER_KEY, currentId);
      } else {
        localStorage.removeItem(LAST_USER_KEY);
      }
    }
  }, [loading, user, clearAll]);

  return null;
}

export default function App() {
  return (
    <>
      <AuthBridge />
      <RouterProvider router={router} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
