import type { CSSProperties } from 'react';
import type { BaseElement, TextElement } from '../project/types';
import { evaluateAnimations } from '../animation';

/** frame context for animated rendering; omit for a static (base-pose) render */
export interface AnimationContext {
  localFrame: number; // frames since the clip started
  fps: number;
}

const IDENTITY = { opacity: 1, tx: 0, ty: 0, scale: 1, rotate: 0 };

/**
 * Geometry + animation shared by every element type: position, size, rotation,
 * opacity, z-index, and the animated transform. `scale` maps composition space
 * to the editor viewport (Remotion uses scale = 1).
 */
export function elementBoxStyle(
  el: BaseElement,
  scale = 1,
  anim?: AnimationContext,
): CSSProperties {
  const t = anim ? evaluateAnimations(el.animations, anim.localFrame, anim.fps) : IDENTITY;
  return {
    position:        'absolute',
    left:            el.x * scale,
    top:             el.y * scale,
    width:           el.width * scale,
    height:          el.height * scale,
    transform:       `translate(${t.tx * scale}px, ${t.ty * scale}px) rotate(${el.rotation + t.rotate}deg) scale(${t.scale})`,
    transformOrigin: 'center',
    opacity:         el.opacity * t.opacity,
    zIndex:          el.zIndex,
  };
}

/** text element = shared box + typography */
export function textElementStyle(
  el: TextElement,
  scale = 1,
  anim?: AnimationContext,
): CSSProperties {
  return {
    ...elementBoxStyle(el, scale, anim),
    fontSize:   el.fontSize * scale,
    fontFamily: el.fontFamily,
    color:      el.color,
    lineHeight: 1.2,
    whiteSpace: 'pre-wrap',
    wordBreak:  'break-word',
    margin:     0,
  };
}

/** image element = shared box + clip overflow (the <img> fills it) */
export function imageElementStyle(
  el: BaseElement,
  scale = 1,
  anim?: AnimationContext,
): CSSProperties {
  return {
    ...elementBoxStyle(el, scale, anim),
    overflow: 'hidden',
  };
}
