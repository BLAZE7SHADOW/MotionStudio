const S = await import('./scale.bundle.js');
let pass = 0, fail = 0;
const check = (n, c) => { c ? pass++ : fail++; console.log(`${c ? ' ok ' : 'FAIL'}  ${n}`); };

/* The scale gained an `originFrame` so the timeline can show one shot at full
   width while the data keeps absolute frame numbers. Everything visual — the
   ruler, every clip, the playhead — goes through these two functions, so the
   window arithmetic is worth pinning down. */

const FULL = S.createScale(1000, 500);          // whole video, 500 frames
const SHOT = S.createScale(1000, 100, 200);     // a shot spanning frames 200–300

check('no origin: frame 0 is at x=0', S.frameToX(FULL, 0) === 0);
check('no origin: last frame is at the right edge', S.frameToX(FULL, 500) === 1000);
check('no origin round-trips', S.xToFrame(FULL, S.frameToX(FULL, 123)) === 123);

check('windowed: the shot start sits at x=0', S.frameToX(SHOT, 200) === 0);
check('windowed: the shot end sits at the right edge', S.frameToX(SHOT, 300) === 1000);
check('windowed: a frame before the window is negative (drawn off-screen left)',
  S.frameToX(SHOT, 190) < 0);
check('windowed: pixels map back to ABSOLUTE frames', S.xToFrame(SHOT, 0) === 200);
check('windowed round-trips', S.xToFrame(SHOT, S.frameToX(SHOT, 250)) === 250);

check('windowed: clamps to the start of the window', S.xToFrame(SHOT, -500) === 200);
check('windowed: clamps to the end of the window', S.xToFrame(SHOT, 99999) === 300);
check('no origin: still clamps at zero', S.xToFrame(FULL, -10) === 0);

check('a shot fills the width regardless of the video length',
  S.createScale(1000, 100, 200).pxPerFrame === 10);
check('zero-length composition does not divide by zero',
  S.createScale(1000, 0).pxPerFrame === 0 && S.xToFrame(S.createScale(1000, 0, 40), 500) === 40);

check('widths are independent of the origin',
  S.framesToWidth(SHOT, 50) === S.framesToWidth(S.createScale(1000, 100), 50));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
