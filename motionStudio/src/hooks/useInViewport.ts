import { useEffect, useRef, useState } from 'react';

/**
 * Whether an element has ever scrolled into view.
 *
 * Latch-once by design: it flips to `true` on first intersection and stays
 * there, and the observer disconnects the moment it does. Both consumers want
 * "has this been seen yet", not "is this on screen right now" — the reveal
 * animation on the landing page would look broken replaying on every scroll
 * past, and the dashboard's Remotion players must not be torn down and rebuilt
 * (see ProjectThumbnail's doc comment: swapping one out and back in was
 * observed remounting repeatedly and stalling playback).
 *
 * `rootMargin` defaults to a screenful of slack so work starts slightly before
 * the element is actually visible. For a fade-in that is cosmetic; for
 * something that mounts a player it is the difference between the user seeing
 * a placeholder and never knowing this hook exists.
 */
export function useInViewport<T extends Element>(
  options: { rootMargin?: string; threshold?: number } = {},
): [React.RefObject<T | null>, boolean] {
  const { rootMargin = '200px', threshold = 0 } = options;
  const ref = useRef<T>(null);

  /* Starts true where IntersectionObserver isn't available. Rendering
     everything is exactly today's behaviour — degrading to rendering *nothing*
     would turn a missing optimisation into a blank page. */
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (seen) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSeen(true);
        // Nothing can unset `seen`, so staying subscribed is pure cost.
        observer.disconnect();
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen, rootMargin, threshold]);

  return [ref, seen];
}
