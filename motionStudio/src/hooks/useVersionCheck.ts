import { useEffect, useState } from 'react';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Detects when a newer deploy is live while this tab is still running the old
 * one. A page navigation inside the SPA never re-fetches index.html, so a tab
 * left open across a deploy has nothing telling it to check for new code —
 * this polls a small unhashed version.json (always revalidated, unlike the
 * hashed/immutable JS chunks) and compares it to the build this tab loaded.
 *
 * Never auto-reloads — this is an editor with in-progress work, so the caller
 * decides when it's safe to prompt the user.
 */
export function useVersionCheck(): boolean {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' });
        if (!res.ok) return;
        const { buildId } = (await res.json()) as { buildId: string };
        if (!cancelled && buildId !== __APP_VERSION__) setUpdateAvailable(true);
      } catch {
        // offline or blip — try again next interval, not worth surfacing
      }
    }

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisible);

    function onVisible() {
      if (document.visibilityState === 'visible') check();
    }

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return updateAvailable;
}
