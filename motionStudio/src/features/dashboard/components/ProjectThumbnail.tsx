import { useEffect, useMemo, useRef, useState } from 'react';
import { Player, Thumbnail } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import MotionComposition from '@/engines/rendering/components/MotionComposition';
import { getCompositionDimensions } from '@/engines/project';
import type { Project } from '@/engines/project';

/** A still frame of the project, which plays while hovered. */
export default function ProjectThumbnail({ project }: { project: Project }) {
  const [hovered, setHovered] = useState(false);
  const playerRef = useRef<PlayerRef>(null);
  const { width, height } = getCompositionDimensions(project.aspectRatio);
  const duration = Math.max(project.durationInFrames, 1);

  const inputProps = useMemo(
    () => ({
      elements: project.canvas.elements,
      // Stored urls are blob: handles from the session that uploaded the file.
      // The dashboard never rehydrates, so use the S3 copy where there is one.
      assets: project.assets.map((a) => (a.storageUrl ? { ...a, url: a.storageUrl } : a)),
    }),
    [project.canvas.elements, project.assets],
  );

  // Play from the start each time the pointer arrives. Driven through the ref
  // rather than autoPlay, which proved unreliable.
  useEffect(() => {
    if (!hovered) return;
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(0);
    p.play();
  }, [hovered]);

  if (project.canvas.elements.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[11px] font-mono text-studio-text-faint">
          {project.aspectRatio}
        </span>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered ? (
        <Player
          ref={playerRef}
          component={MotionComposition}
          inputProps={inputProps}
          durationInFrames={duration}
          fps={project.fps}
          compositionWidth={width}
          compositionHeight={height}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          controls={false}
          loop
          clickToPlay={false}
          doubleClickToFullscreen={false}
          allowFullscreen={false}
        />
      ) : (
        <Thumbnail
          component={MotionComposition}
          inputProps={inputProps}
          // Not frame 0 — entrance effects start at opacity 0, so frame 0 is
          // blank. Only matters for the still; the player moves off it at once.
          frameToDisplay={Math.min(Math.round(duration * 0.4), duration - 1)}
          durationInFrames={duration}
          fps={project.fps}
          compositionWidth={width}
          compositionHeight={height}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        />
      )}
    </div>
  );
}
