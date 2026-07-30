import posthog from 'posthog-js';

/**
 * Global exception capture.
 *
 * The Ultramock benchmark lists this as "Sentry with release = git SHA". We
 * already have both halves without adding a dependency: PostHog is wired and
 * carries ~30 events including both export failure paths, and `__APP_VERSION__`
 * is the Vercel commit SHA. A second vendor would buy a nicer stack-trace UI
 * and another script on every page load.
 *
 * What this earns: an export that dies mid-render is currently invisible unless
 * the user happens to file feedback. The failure the user never reports is the
 * one that quietly decides they are done with the product.
 */

/** Identical errors fire in loops — a bad render can throw once per frame. */
const seen = new Set<string>();
const MAX_DISTINCT = 20;

function capture(kind: 'error' | 'unhandledrejection', message: string, stack?: string) {
  const key = `${kind}:${message}`;
  if (seen.has(key)) return;
  // Stop rather than evict: past twenty distinct errors in one session the tab
  // is already broken, and the useful signal is in the first few.
  if (seen.size >= MAX_DISTINCT) return;
  seen.add(key);

  posthog.capture('client_exception', {
    kind,
    message: message.slice(0, 500),
    // Enough to identify the frame, not so much that it dwarfs the event.
    stack: stack?.slice(0, 2000),
    build: __APP_VERSION__,
    path: window.location.pathname,
  });
}

export function installExceptionCapture(): void {
  window.addEventListener('error', (e) => {
    // Resource load failures (a 404'd image) also fire `error` on window, with
    // no `error` object. They are not exceptions and would drown the real ones.
    if (!e.error) return;
    capture('error', e.message || String(e.error), e.error?.stack);
  });

  window.addEventListener('unhandledrejection', (e) => {
    const r: unknown = e.reason;
    capture(
      'unhandledrejection',
      r instanceof Error ? r.message : String(r),
      r instanceof Error ? r.stack : undefined,
    );
  });
}
