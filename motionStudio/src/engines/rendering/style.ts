import type { CSSProperties } from 'react';
import type { TextElement } from '../project/types';
import { evaluateAnimations } from '../animation';

/** frame context for animated rendering; omit for a static (base-pose) render */
export interface AnimationContext {
  localFrame: number; // frames since the clip started
  fps: number;
}

/**
 * The visual style for a text element, in composition space.
 *
 * `scale` lets the editor render the same element at viewport size
 * (composition × scale) while Remotion renders at native size (scale = 1).
 *
 * `anim` (optional) evaluates the element's animations at a frame and applies
 * the result on top of the base pose. The editor passes the current playhead
 * frame; Remotion passes useCurrentFrame(). Same math → WYSIWYG in motion.
 */
export function textElementStyle(
  el: TextElement,
  scale = 1,
  anim?: AnimationContext,
): CSSProperties {
  const t = anim
    ? evaluateAnimations(el.animations, anim.localFrame, anim.fps)
    : { opacity: 1, tx: 0, ty: 0, scale: 1, rotate: 0 };

  return {
    position:        'absolute',
    left:            el.x * scale,
    top:             el.y * scale,
    width:           el.width * scale,
    height:          el.height * scale,
    // base pose + animated offsets: translate & scale composited with rotation
    transform:       `translate(${t.tx * scale}px, ${t.ty * scale}px) rotate(${el.rotation + t.rotate}deg) scale(${t.scale})`,
    transformOrigin: 'center',
    opacity:         el.opacity * t.opacity,
    zIndex:          el.zIndex,
    fontSize:        el.fontSize * scale,
    fontFamily:      el.fontFamily,
    color:           el.color,
    lineHeight:      1.2,
    whiteSpace:      'pre-wrap',
    wordBreak:       'break-word',
    margin:          0,
  };
}
