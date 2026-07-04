import type { CSSProperties } from 'react';
import type { TextElement } from '../project/types';

/**
 * The visual style for a text element, in composition space.
 *
 * `scale` lets the editor render the same element at viewport size
 * (composition × scale) while Remotion renders at native size (scale = 1).
 * Because every geometric property is multiplied by the same factor, the
 * editor and the final render are pixel-for-pixel identical — WYSIWYG.
 */
export function textElementStyle(el: TextElement, scale = 1): CSSProperties {
  return {
    position:        'absolute',
    left:            el.x * scale,
    top:             el.y * scale,
    width:           el.width * scale,
    height:          el.height * scale,
    transform:       `rotate(${el.rotation}deg)`,
    transformOrigin: 'center',
    opacity:         el.opacity,
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
