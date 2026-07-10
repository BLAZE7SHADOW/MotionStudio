import { Composition } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { MotionComposition } from '../engines/rendering';

// make Inter available inside Remotion's headless browser (matches the editor)
loadFont();
import { getCompositionDimensions } from '../engines/project';
import type { CanvasElement, Asset, AspectRatio } from '../engines/project';

/**
 * Props the CLI feeds into the composition. `npx remotion render` reads these
 * from --props (a JSON string or file). calculateMetadata derives the video's
 * real size/fps/length from them, so one composition renders any project.
 */
export type ExportProps = {
  elements: CanvasElement[];
  assets: Asset[];
  aspectRatio: AspectRatio;
  fps: number;
  durationInFrames: number;
};

const DEFAULT_PROPS: ExportProps = {
  elements: [],
  assets: [],
  aspectRatio: '16:9',
  fps: 30,
  durationInFrames: 150,
};

function MotionRender({ elements, assets }: ExportProps) {
  return <MotionComposition elements={elements} assets={assets} />;
}

export function RemotionRoot() {
  const { width, height } = getCompositionDimensions(DEFAULT_PROPS.aspectRatio);
  return (
    <Composition
      id="MotionStudio"
      component={MotionRender}
      durationInFrames={DEFAULT_PROPS.durationInFrames}
      fps={DEFAULT_PROPS.fps}
      width={width}
      height={height}
      defaultProps={DEFAULT_PROPS}
      calculateMetadata={({ props }) => {
        const dims = getCompositionDimensions(props.aspectRatio);
        return {
          width: dims.width,
          height: dims.height,
          fps: props.fps,
          durationInFrames: props.durationInFrames,
        };
      }}
    />
  );
}
