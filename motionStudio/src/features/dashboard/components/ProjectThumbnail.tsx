import { useEffect, useMemo, useRef, useState } from 'react';
import { Player, Thumbnail } from '@remotion/player';
import MotionComposition from '@/engines/rendering/components/MotionComposition';
import { getCompositionDimensions } from '@/engines/project';
import type { Project } from '@/engines/project';

/**
 * A real preview of a project's first frames, used on the dashboard cards.
 *
 * Two deliberate constraints:
 *
 * 1. **Static by default, animated only on hover.** Every shader background is
 *    its own WebGL context and browsers cap those (~8–16); a grid of
 *    autoplaying <Player>s would exhaust the limit and start losing contexts.
 *    <Thumbnail> renders a single frame, and only the hovered card upgrades to
 *    a playing <Player> — so there's at most one running at a time.
 *
 * 2. **Only mounts once scrolled into view**, so a long project list doesn't
 *    build a composition for every card up front.
 */
export default function ProjectThumbnail({ project }: { project: Project }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  const { width, height } = getCompositionDimensions(project.aspectRatio);

  const inputProps = useMemo(
    () => ({
      elements: project.canvas.elements,
      // A project's `url` is a blob: from the session that uploaded it and is
      // dead everywhere else. The dashboard never runs rehydrateAssets, so
      // prefer the S3 copy — same fallback the editor and export path use.
      assets: project.assets.map((a) => (a.storageUrl ? { ...a, url: a.storageUrl } : a)),
    }),
    [project.canvas.elements, project.assets],
  );

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const isEmpty = project.canvas.elements.length === 0;

  // Far enough in that entrance animations have played, but still early enough
  // to be representative of the clip.
  const posterFrame = Math.min(
    Math.round(project.durationInFrames * 0.4),
    Math.max(project.durationInFrames - 1, 0),
  );

  return (
    <div
      ref={hostRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full h-full bg-studio-bg"
    >
      {isEmpty || !visible ? (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-[11px] font-mono text-studio-text-faint">
            {project.aspectRatio}
          </span>
        </div>
      ) : hovered ? (
        <Player
          component={MotionComposition}
          inputProps={inputProps}
          durationInFrames={Math.max(project.durationInFrames, 1)}
          // Same frame the static thumbnail shows, so hovering continues from
          // what you were already looking at rather than cutting to the blank
          // opacity-0 first frame.
          initialFrame={posterFrame}
          fps={project.fps}
          compositionWidth={width}
          compositionHeight={height}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          controls={false}
          loop
          autoPlay
          clickToPlay={false}
          doubleClickToFullscreen={false}
          allowFullscreen={false}
        />
      ) : (
        <Thumbnail
          component={MotionComposition}
          inputProps={inputProps}
          frameToDisplay={posterFrame}
          durationInFrames={Math.max(project.durationInFrames, 1)}
          fps={project.fps}
          compositionWidth={width}
          compositionHeight={height}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        />
      )}
    </div>
  );
}
