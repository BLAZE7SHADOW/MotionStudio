// The six predicates that drive the quick start.
//
// These are the only real logic in the walkthrough, and the expensive way to
// get one wrong is a step that never completes: the user is then staring at an
// instruction they have already followed, with no way forward but Skip. So they
// are pure functions over plain data, and this file drives all six without a
// browser, a store or a React tree.
//
// The recurring theme below is the `atStart` comparison. "A text element
// exists" is true the instant a returning user replays the walkthrough on a
// finished project, and the whole thing would flash past without them touching
// anything — so every predicate asks what changed *since the step opened*.

const Q = await import('./quickStart.bundle.js');
let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? ' ok ' : 'FAIL'}  ${name}`); };

const el = (over = {}) => ({
  id: 'e1', type: 'text', content: 'Hello',
  x: 0, y: 0, width: 100, height: 40, rotation: 0,
  opacity: 1, zIndex: 0, startFrame: 0, durationInFrames: 30,
  ...over,
});

const world = (elements = [], scenes = [{ id: 's1', durationInFrames: 300 }], editor = {}) => ({
  project: { id: 'p', name: 'p', assets: [], scenes, canvas: { elements } },
  editor: { selectedElementId: null, isPlaying: false, ...editor },
});

const empty = world();
const step = (i) => Q.QUICK_STEPS[i];
const done = (i, now, atStart) => step(i).isDone(now, atStart);

/* ── shape ─────────────────────────────────────────────────────────────── */

check('there are six steps', Q.QUICK_STEPS.length === 6);
check('the first five wait for an action', Q.QUICK_STEPS.slice(0, 5).every((s) => typeof s.isDone === 'function'));
check('the last step has nothing to wait for', step(5).isDone === undefined);
check('every step has a prompt', Q.QUICK_STEPS.every((s) => s.prompt.length > 0));
check('every waiting step has a reward line', Q.QUICK_STEPS.slice(0, 5).every((s) => s.done.length > 0));

/* Step 3 must not be anchored on its own copy's id: `effects-section` is a
   header div whose sibling holds the picker, and driver.js makes everything
   outside the highlight unclickable — so anchoring there strands the step. */
check('the effects step points at the whole properties panel', step(2).anchor === 'properties');

/* ── 1. add text ───────────────────────────────────────────────────────── */

check('1 — waits while the canvas is empty', !done(0, empty, empty));
check('1 — fires when a text element appears', done(0, world([el()]), empty));

const oneText = world([el()]);
check('1 — a replay does not complete instantly', !done(0, oneText, oneText));
check('1 — a shader appearing is not a title', !done(0, world([el({ id: 'sh', type: 'shader' })]), empty));

/* ── 2. move it ────────────────────────────────────────────────────────── */

check('2 — waits while nothing has moved', !done(1, oneText, oneText));
check('2 — fires on a move', done(1, world([el({ x: 40 })]), oneText));
// Grabbing a corner or the rotate handle proves the same point. Insisting on a
// drag of the middle would strand anyone who reached for a corner first.
check('2 — fires on a resize', done(1, world([el({ width: 260 })]), oneText));
check('2 — fires on a rotate', done(1, world([el({ rotation: 12 })]), oneText));
// A brand-new element has no baseline to differ from, so it must not count —
// otherwise adding a second thing completes a step about moving the first.
check('2 — a newly added element does not count as a move', !done(1, world([el(), el({ id: 'e2' })]), oneText));

/* ── 3. give it an effect ──────────────────────────────────────────────── */

const withEffect = world([el({ textEffect: 'typewriter' })]);
check('3 — waits while no effect is set', !done(2, oneText, oneText));
check('3 — fires when an effect is chosen', done(2, withEffect, oneText));
check('3 — a replay with an effect already set does not complete', !done(2, withEffect, withEffect));
check('3 — swapping to a different effect fires', done(2, world([el({ textEffect: 'fade-up' })]), withEffect));
// Clearing an effect is the opposite of the instruction.
check('3 — removing the effect does not fire', !done(2, oneText, withEffect));

/* ── 4. press play ─────────────────────────────────────────────────────── */

const playing = world([], undefined, { isPlaying: true });
check('4 — waits while stopped', !done(3, empty, empty));
check('4 — fires on the flip to playing', done(3, playing, empty));
check('4 — already playing is not pressing play', !done(3, playing, playing));

/* ── 5. add a shot ─────────────────────────────────────────────────────── */

const twoShots = world([], [{ id: 's1', durationInFrames: 150 }, { id: 's2', durationInFrames: 150 }]);
check('5 — waits on one shot', !done(4, empty, empty));
check('5 — fires when a second shot appears', done(4, twoShots, empty));
check('5 — a replay on a two-shot project does not complete', !done(4, twoShots, twoShots));
// `addShot` is a no-op past the project length cap; a refused add must not read
// as a success.
check('5 — a refused add does not fire', !done(4, twoShots, twoShots));

/* ── no project ────────────────────────────────────────────────────────── */

// The editor renders before the project arrives from IndexedDB, and the
// walkthrough can start in that window. None of these may throw.
const none = { project: undefined, editor: { selectedElementId: null, isPlaying: false } };
const survives = Q.QUICK_STEPS.slice(0, 5).every((s) => {
  try { s.isDone(none, none); return true; } catch { return false; }
});
check('every predicate survives a project that has not loaded', survives);
check('nothing completes without a project', Q.QUICK_STEPS.slice(0, 5).every((s) => !s.isDone(none, none)));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
