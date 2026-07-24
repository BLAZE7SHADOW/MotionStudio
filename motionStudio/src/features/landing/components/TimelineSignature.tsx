import { useEffect, useRef, useState } from 'react';

const FPS = 30;
const LOOP_FRAMES = 240; // 8s loop
const KEYFRAMES = [0.16, 0.47, 0.78]; // fractional positions along the track
const FLASH_WINDOW = 6; // frames a keyframe stays "lit" after the playhead crosses it

function formatTimecode(frame: number): string {
  const totalSeconds = Math.floor(frame / FPS);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const f = frame % FPS;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

/**
 * The page's signature element — a real, frame-driven timeline scrubber,
 * not a decorative CSS loop. Demonstrates the product's core idea (frame-
 * accurate, keyframe-driven motion) instead of just describing it in copy.
 * Hand-rolled with requestAnimationFrame rather than importing the actual
 * Remotion Player, since that's a meaningfully heavier dependency than a
 * marketing page — which loads before anyone has signed in — should carry.
 */
function initialFrame(): number {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return Math.round(LOOP_FRAMES * KEYFRAMES[1]);
  }
  return 0;
}

export default function TimelineSignature() {
  const [frame, setFrame] = useState(initialFrame);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    // reduced-motion: initial state already parked on a static keyframe
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsedFrames = Math.floor(((now - startRef.current) / 1000) * FPS) % LOOP_FRAMES;
      setFrame((prev) => (prev === elapsedFrames ? prev : elapsedFrames));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const progress = frame / LOOP_FRAMES;

  return (
    <div className="w-full max-w-105 select-none">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[13px] text-white/70 tracking-wider tabular-nums">
          {formatTimecode(frame)}
        </span>
        <span className="font-mono text-[10px] text-white/30 tracking-widest uppercase">
          {FPS}fps · loop
        </span>
      </div>

      <div className="relative h-10">
        {/* easing-curve hint, above the track */}
        <svg
          className="absolute inset-x-0 top-0 h-6 w-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 100 24"
        >
          <path
            d={`M 0 22 C ${KEYFRAMES[0] * 100} 22, ${KEYFRAMES[0] * 100} 2, ${KEYFRAMES[1] * 100} 2 S ${KEYFRAMES[2] * 100} 22, 100 4`}
            fill="none"
            stroke="oklch(0.627 0.265 298.232 / 25%)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* track */}
        <div className="absolute bottom-1 inset-x-0 h-px bg-white/10" />

        {/* keyframe diamonds */}
        {KEYFRAMES.map((pos, i) => {
          const kfFrame = Math.round(pos * LOOP_FRAMES);
          const dist = (frame - kfFrame + LOOP_FRAMES) % LOOP_FRAMES;
          const lit = dist < FLASH_WINDOW;
          return (
            <div
              key={i}
              className="absolute bottom-1 w-1.5 h-1.5 rotate-45 -translate-x-1/2 translate-y-1/2 transition-colors duration-150"
              style={{
                left: `${pos * 100}%`,
                backgroundColor: lit ? '#ff5c5c' : 'oklch(1 0 0 / 30%)',
              }}
            />
          );
        })}

        {/* playhead */}
        <div
          className="absolute bottom-0 top-0 w-px bg-white/80"
          style={{ left: `${progress * 100}%` }}
        >
          <div className="absolute -top-0.5 -translate-x-1/2 w-2 h-2 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}
