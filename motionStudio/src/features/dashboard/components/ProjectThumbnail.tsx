import { useMemo } from 'react';
import { Thumbnail } from '@remotion/player';
import MotionComposition from '@/engines/rendering/components/MotionComposition';
import { getCompositionDimensions } from '@/engines/project';
import type { Project } from '@/engines/project';

/** A still frame of the project, shown on its dashboard card. */
export default function ProjectThumbnail({ project }: { project: Project }) {
  const { width, height } = getCompositionDimensions(project.aspectRatio);

  const inputProps = useMemo(
    () => ({
      elements: project.canvas.elements,
      // Stored urls are blob: handles from the session that uploaded the file.
      // The dashboard never rehydrates, so use the S3 copy where there is one.
      assets: project.assets.map((a) => (a.storageUrl ? { ...a, url: a.storageUrl } : a)),
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
    <Thumbnail
      component={MotionComposition}
      inputProps={inputProps}
      // Not frame 0 — entrance effects start at opacity 0, so frame 0 is blank.
      frameToDisplay={Math.min(
        Math.round(project.durationInFrames * 0.4),
        Math.max(project.durationInFrames - 1, 0),
      )}
      durationInFrames={Math.max(project.durationInFrames, 1)}
      fps={project.fps}
      compositionWidth={width}
      compositionHeight={height}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
