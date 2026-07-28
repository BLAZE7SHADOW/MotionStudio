import type { TextEffect } from '@/engines/project';

/**
 * One plain-language line per text effect.
 *
 * A `<select>` option only carries a name, and names like "shared axis Z" or
 * "value swap" tell you nothing about what you'll see. The live preview shows
 * the motion; this says what the effect is *for*, which the motion alone
 * doesn't — particularly for the list and two-value effects, where the shape of
 * the input matters as much as the animation.
 */
export const TEXT_EFFECT_INFO: Record<TextEffect, string> = {
  /* entrance — blur */
  'soft-blur-in': 'Fades in from a soft blur. Safe, calm opener for any headline.',
  'blur-out-up': 'Blurs away upward — an exit, so put it at the end of a clip.',
  'focus-blur-resolve': 'Snaps from out-of-focus to sharp, like a lens finding focus.',

  /* entrance — letters */
  'tracking-in': 'Letters start spread wide and pull together into place.',
  'per-character-rise': 'Each character lifts into place in turn. The workhorse headline effect.',
  'bottom-up-letters': 'Letters rise from below the baseline, one after another.',
  'top-down-letters': 'Letters drop in from above, one after another.',

  /* entrance — scale */
  'spring-scale-in': 'Springs up to full size with a bounce. Energetic.',
  'micro-scale-fade': 'A restrained fade with a touch of scale. Barely there on purpose.',
  'scale-down-fade': 'Settles down from slightly too large. Good for a big number.',

  /* entrance — blocks and lines */
  'staggered-fade-up': 'Each line fades up in sequence. Best with multi-line text.',
  'mask-reveal-up': 'Text is wiped into view from behind an edge, as if unmasked.',
  'line-by-line-slide': 'Lines slide in one at a time. Multi-line text only.',
  'kinetic-center-build': 'Words assemble outward from the centre. Bold and loud.',
  'short-slide-right': 'A small slide in from the left. Subtle, good for captions.',
  'short-slide-down': 'A small slide in from above. Subtle, good for captions.',

  /* emphasis */
  'shimmer-sweep': 'A light sweeps across the text. Note: browser export can’t draw this — use Cloud Render.',
  'inline-highlight': 'Draws a highlight block behind one phrase, mid-sentence.',
  'marker-highlight': 'Scribbles a hand-drawn marker stroke over one phrase.',

  /* reveal */
  'typewriter': 'Types the text out character by character, with a cursor.',
  'matrix-decode': 'Scrambles through random glyphs before resolving to your text.',
  'rgb-glitch-text': 'Chromatic-aberration glitch. Short bursts work best.',
  'infinite-marquee': 'Scrolls your text sideways forever. Good as a ticker or a banner.',

  /* list-valued — one item per line of the text box */
  'value-swap': 'Cycles through your lines, swapping one for the next. One item per line.',
  'rolodex-flip': 'Flips through your lines like a desk calendar. One item per line.',
  'perspective-marquee': 'Your lines scroll past in 3D perspective. One item per line.',

  /* two-value — animates from the text box to the "To" field */
  'fade-through': 'Crossfades from the first value to the second. Set both in Properties.',
  'per-word-crossfade': 'Swaps word by word rather than all at once. Set both values.',
  'shared-axis-y': 'The old value slides up and out as the new one arrives. Set both values.',
  'shared-axis-z': 'The old value recedes as the new one comes forward. Set both values.',
  'strikethrough-replace': 'Strikes the first value out and replaces it. Ideal for before/after.',
  'slot-machine-roll': 'Rolls from one value to the other like a slot reel. Set both values.',

  /* two-value numeric */
  'rolling-number': 'Counts from one number to another. Both are parsed as numbers.',
  'number-wheel': 'Counts up on spinning digit wheels, odometer style.',
};
