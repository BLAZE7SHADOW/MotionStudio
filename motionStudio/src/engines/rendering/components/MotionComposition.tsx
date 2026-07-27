import { AbsoluteFill, Sequence } from 'remotion';
import type { CanvasElement, Asset } from '../../project/types';
import ElementRenderer from './ElementRenderer';

/**
 * A `type` alias, not an `interface`, on purpose: an interface can be augmented
 * later so TypeScript won't treat it as assignable to `Record<string, unknown>`,
 * which is what Remotion's composition APIs require. Same trap that made
 * `<Composition>` infer props as `unknown` (see ARCHITECTURE.md §6).
 */
export type MotionCompositionProps = {
  elements: CanvasElement[];
  assets: Asset[];
  background?: string;
};

/**
 * The Remotion composition root.
 *
 * Consumed by the editor's <Player> preview and, later, by renderMedia()
 * for export. It is a pure function of element data → frames, so the same
 * component drives preview and final render.
 */
/**
 * Every Remocn text component sets `font-family: var(--font-geist-sans), …`.
 * That variable ships with Remocn's own Next.js setup, not with us — and an
 * undefined `var()` with no fallback makes the WHOLE declaration invalid, so
 * the text silently fell back to the browser default (Times, serif) rather
 * than to the `sans-serif` at the end of the list.
 *
 * Defining it here — on the one composition both the editor preview and the
 * Remotion render mount — fixes every effect in both places at once, which is
 * the same reason `style.ts` is shared rather than duplicated.
 */
const FONT_VARS = { '--font-geist-sans': 'Inter, system-ui, sans-serif' } as React.CSSProperties;

export default function MotionComposition({
  elements,
  assets,
  background = '#000000',
}: MotionCompositionProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: background, ...FONT_VARS }}>
      {elements.map((el) => (
        <Sequence
          key={el.id}
          from={el.startFrame}
          durationInFrames={el.durationInFrames}
          layout="none"
        >
          <ElementRenderer el={el} assets={assets} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
