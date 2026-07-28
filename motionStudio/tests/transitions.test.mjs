const T = await import('./transitions.bundle.js');
let pass = 0, fail = 0;
const check = (n, c) => { c ? pass++ : fail++; console.log(`${c ? ' ok ' : 'FAIL'}  ${n}`); };

const FPS = 30;
const ctx = { durationInFrames: 8, compositionWidth: 1920 };

/* Every transition has to end on the element's own pose. If one didn't, turning
   it off would leave the element permanently displaced and the user would have
   no way to find out why — the animation isn't even listed in Motion. */
for (const preset of T.TRANSITIONS) {
  const anims = T.buildTransition(preset.id, ctx);
  const identity = { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 };
  check(`${preset.label}: every animation lands on the element's own pose`,
    anims.every((a) => a.to === identity[a.property]));
  check(`${preset.label}: every animation is tagged as ours`,
    anims.every((a) => a.source === 'transition'));
  check(`${preset.label}: nothing starts before the cut`,
    anims.every((a) => a.startOffset === 0));
}

check('cut produces no animation at all', T.buildTransition('cut', ctx).length === 0);
check('an unknown id degrades to a cut rather than throwing',
  T.buildTransition('nonsense', ctx).length === 0);

/* Travel has to scale with the format: 768px is a shove across 1920 and would
   throw an element clean off a 1080-wide portrait frame. */
const wide = T.buildTransition('whip', { ...ctx, compositionWidth: 1920 }).find((a) => a.property === 'x');
const tall = T.buildTransition('whip', { ...ctx, compositionWidth: 1080 }).find((a) => a.property === 'x');
check(`whip travel scales with width (${wide.from} vs ${tall.from})`, wide.from > tall.from);
check('whip travel is a fraction of the frame, not a fixed pixel count',
  wide.from / 1920 === tall.from / 1080);

/* Duration follows the tempo, which is what makes a transition feel *of* the
   beat rather than merely near it. */
check(`no tempo falls back to the default (${T.transitionFrames(FPS)})`,
  T.transitionFrames(FPS) === T.DEFAULT_TRANSITION_FRAMES);
check(`120 BPM gives half a beat (${T.transitionFrames(FPS, 120)} frames)`,
  T.transitionFrames(FPS, 120) === 8);
check('a slow tempo is capped rather than dragging',
  T.transitionFrames(FPS, 40) === T.MAX_TRANSITION_FRAMES);
check('a fast tempo still registers',
  T.transitionFrames(FPS, 300) === T.MIN_TRANSITION_FRAMES);
check('a zero tempo does not divide by zero', T.transitionFrames(FPS, 0) === T.DEFAULT_TRANSITION_FRAMES);
check('a zero frame rate does not either', T.transitionFrames(0, 120) === T.DEFAULT_TRANSITION_FRAMES);

check('every transition lasts as long as it was told to',
  T.TRANSITIONS.filter((p) => p.id !== 'cut').every((p) =>
    T.buildTransition(p.id, ctx).some((a) => a.duration === ctx.durationInFrames)));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
