import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/engines/editor';

/**
 * The playback clock. While `isPlaying`, advances `currentFrame` in real time
 * using requestAnimationFrame, so the playhead sweeps and the canvas preview
 * plays back at the project's fps.
 *
 * Time-based (not tick-based): we advance by `elapsedSeconds × fps`, so
 * playback stays at the correct speed regardless of the monitor's refresh rate
 * or frame drops. This is a feature-layer hook because it composes two engines
 * (reads project fps/duration, writes editor currentFrame).
 */
export function usePlaybackClock(fps: number, totalFrames: number) {
  const isPlaying       = useEditorStore((s) => s.isPlaying);
  const setCurrentFrame = useEditorStore((s) => s.setCurrentFrame);
  const setIsPlaying    = useEditorStore((s) => s.setIsPlaying);

  const rafRef        = useRef<number | null>(null);
  const lastRef       = useRef(0);
  const frameFloatRef = useRef(0);

  useEffect(() => {
    if (!isPlaying || fps <= 0 || totalFrames <= 0) return;

    // start from the playhead; if it's at the end, restart from 0
    const start = useEditorStore.getState().currentFrame;
    frameFloatRef.current = start >= totalFrames - 1 ? 0 : start;
    lastRef.current = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastRef.current) / 1000; // seconds since last frame
      lastRef.current = now;
      frameFloatRef.current += dt * fps;

      if (frameFloatRef.current >= totalFrames - 1) {
        setCurrentFrame(totalFrames - 1); // land exactly on the last frame
        setIsPlaying(false);              // stop at the end
        rafRef.current = null;
        return;
      }

      setCurrentFrame(Math.floor(frameFloatRef.current));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, fps, totalFrames, setCurrentFrame, setIsPlaying]);
}
