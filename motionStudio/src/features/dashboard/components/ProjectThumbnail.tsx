import { useMemo, useRef } from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import MotionComposition from '@/engines/rendering/components/MotionComposition';
import { getCompositionDimensions } from '@/engines/project';
import type { Project } from '@/engines/project';
import { cloudUrl } from '@/lib/assetUrl';
import { useInViewport } from '@/hooks/useInViewport';

/**
 * The project's card preview: a paused frame that plays while hovered.
 *
 * One Player, mounted once and never swapped. Toggling between <Thumbnail> and
 * <Player> on hover meant tearing down and rebuilding a WebGL canvas, which
 * was observed remounting repeatedly and stalling playback. Pausing and
 * playing one instance avoids that entirely, and mirrors the template preview,
 * which behaves correctly.
 *
 * Mounted only once the card has scrolled into view. The grid renders a card
 * per project with no pagination, so every preview in a user's whole library
 * used to start up on dashboard load — and a preview is not cheap: a project
 * with video mounts @remotion/media's <Video>, which spins up a Mediabunny
 * decoder fetching from S3. Forty projects meant forty decoders for previews
 * nobody had looked at. TemplatePicker already refuses to render one preview
 * per row for the same reason; the grid never got the same treatment.
 *
 * Deliberately never unmounted on the way back out. That would reintroduce
 * exactly the remount thrash described above, on every scroll reversal. The
 * win that matters is at load, and this bounds that to a screenful; a user who
 * scrolls their whole library in one sitting ends up where they started, which
 * is the signal that poster frames are worth their complexity.
 */
export default function ProjectThumbnail({ project }: { project: Project }) {
  const playerRef = useRef<PlayerRef>(null);
  const [containerRef, seen] = useInViewport<HTMLDivElement>();
  const { width, height } = getCompositionDimensions(project.aspectRatio);
  const duration = Math.max(project.durationInFrames, 1);

  // Frame 0 is blank while entrance effects are still at opacity 0, so the
  // resting frame is part-way in.
  const posterFrame = Math.min(Math.round(duration * 0.4), duration - 1);

  // Must stay referentially stable: a fresh object here makes the Player treat
  // it as new data and reset.
  const inputProps = useMemo(
    () => ({
      elements: project.canvas.elements,
      // Stored urls are blob: handles from the session that uploaded the file.
      // The dashboard never rehydrates, so use the S3 copy where there is one.
      assets: project.assets.map((a) => {
        const cloud = cloudUrl(a);
        return cloud ? { ...a, url: cloud } : a;
      }),
    }),
    [project.canvas.elements, project.assets],
  );

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
      ref={containerRef}
      className="w-full h-full"
      onMouseEnter={() => {
        const p = playerRef.current;
        if (!p) return;
        p.seekTo(0);
        p.play();
      }}
      onMouseLeave={() => {
        const p = playerRef.current;
        if (!p) return;
        p.pause();
        p.seekTo(posterFrame);
      }}
    >
      {/* ProjectCard owns the aspect-ratio box, so holding this space costs
          nothing and swapping the Player in causes no layout shift. Reuses the
          empty-project placeholder rather than inventing a second one, and
          stays flat — index.html makes the case that a placeholder shouldn't
          grow into something that needs maintaining. */}
      {seen ? (
        <Player
          ref={playerRef}
          component={MotionComposition}
          inputProps={inputProps}
          durationInFrames={duration}
          initialFrame={posterFrame}
          fps={project.fps}
          compositionWidth={width}
          compositionHeight={height}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          controls={false}
          loop
          // Cards animate on hover as you sweep across the grid. Audio firing
          // from whatever your cursor happens to cross is startling, and there's
          // no control on the card to stop it.
          initiallyMuted
          clickToPlay={false}
          doubleClickToFullscreen={false}
          allowFullscreen={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-[11px] font-mono text-studio-text-faint">
            {project.aspectRatio}
          </span>
        </div>
      )}
    </div>
  );
}
