const B = await import('./beatDetect.bundle.js');
let pass = 0, fail = 0;
const check = (n, c) => { c ? pass++ : fail++; console.log(`${c ? ' ok ' : 'FAIL'}  ${n}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

const RATE = 8000;

/**
 * A click track: a short decaying thud every beat, silence between.
 * This is the whole reason detection is split into a pure half — "it looked
 * right on one song" is not a test, and a signal whose tempo we chose is.
 */
function clicks({ bpm, seconds = 30, offsetSec = 0, amp = 1 }) {
  const out = new Float32Array(Math.round(seconds * RATE));
  const period = (60 / bpm) * RATE;
  const decay = Math.round(0.03 * RATE);
  for (let k = 0; ; k++) {
    const at = Math.round(offsetSec * RATE + k * period);
    if (at >= out.length) break;
    for (let i = 0; i < decay && at + i < out.length; i++) {
      out[at + i] = amp * Math.exp(-i / (decay / 4)) * Math.sin((2 * Math.PI * 60 * i) / RATE);
    }
  }
  return out;
}

/* ── a tempo we chose, read back ── */
const t120 = B.detectBeat(clicks({ bpm: 120 }), RATE);
check(`120 BPM click track reads as 120 (got ${t120.bpm})`, near(t120.bpm, 120, 1));
check(`...with high confidence (got ${t120.confidence})`, t120.confidence > 0.6);
check(`...and offset ~0 (got ${t120.offsetSec})`, near(t120.offsetSec, 0, 0.02));

const t128 = B.detectBeat(clicks({ bpm: 128 }), RATE);
check(`128 BPM reads as 128 (got ${t128.bpm})`, near(t128.bpm, 128, 1));

const t90 = B.detectBeat(clicks({ bpm: 90 }), RATE);
check(`90 BPM reads as 90 (got ${t90.bpm})`, near(t90.bpm, 90, 1));

/* ── phase: the first beat is not always at zero ── */
const off = B.detectBeat(clicks({ bpm: 120, offsetSec: 0.3 }), RATE);
check(`a track starting at 0.3s reports that offset (got ${off.offsetSec})`,
  near(off.offsetSec, 0.3, 0.03));
check('...and still reads the right tempo', near(off.bpm, 120, 1));

/* ── folding: 160 BPM must not come back as 320, nor 60 as 60 ── */
const fast = B.detectBeat(clicks({ bpm: 160 }), RATE);
check(`160 BPM stays 160 rather than folding (got ${fast.bpm})`, near(fast.bpm, 160, 1));
const slow = B.detectBeat(clicks({ bpm: 60 }), RATE);
check(`60 BPM folds up to its double, 120 (got ${slow.bpm})`, near(slow.bpm, 120, 1));

/* ── the failure cases, which matter more than the successes ──
   A confident wrong tempo is worse than an admitted failure, because the user
   builds an edit on top of it. */
const noise = new Float32Array(RATE * 30);
let seed = 42;
for (let i = 0; i < noise.length; i++) {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  noise[i] = (seed / 0x7fffffff) * 2 - 1;
}
const n = B.detectBeat(noise, RATE);
check(`white noise is not reported confidently (got ${n.confidence})`, n.confidence < 0.5);

const silence = B.detectBeat(new Float32Array(RATE * 10), RATE);
check('silence returns no tempo at all', silence.bpm === 0 && silence.confidence === 0);
check('an empty buffer does not throw', B.detectBeat(new Float32Array(0), RATE).bpm === 0);
check('a zero sample rate does not divide by zero', B.detectBeat(clicks({ bpm: 120 }), 0).bpm === 0);

/* ── grid maths: seconds in, seconds out, no rounding until snap time ── */
const grid = { bpm: 128, offsetSec: 0.25 };
check('beat 0 is the offset', B.beatTimeSec(grid, 0) === 0.25);
check('beat 1 is one period later', near(B.beatTimeSec(grid, 1), 0.25 + 60 / 128, 1e-9));
check('beatIndexAt finds the beat before a time', B.beatIndexAt(grid, 0.25 + 60 / 128 + 0.01) === 1);
check('nearestBeatSec rounds to the closer beat',
  near(B.nearestBeatSec(grid, 0.25 + (60 / 128) * 2.4), B.beatTimeSec(grid, 2), 1e-9));

/* The drift this whole design exists to avoid: at 128 BPM a beat is 14.06
   frames at 30fps, so a grid stored in frames would lose ~2 frames by beat 32.
   Storing seconds and rounding once must not. */
const FPS = 30;
const beat32 = B.beatTimeSec(grid, 32);
const snapped = Math.round(beat32 * FPS) / FPS;
check(`beat 32 stays within half a frame of true time (off by ${((snapped - beat32) * FPS).toFixed(3)} frames)`,
  Math.abs(snapped - beat32) * FPS <= 0.5 + 1e-9);
const naive = (Math.round((60 / 128) * FPS) / FPS) * 32 + 0.25;
check(`...whereas a frame-rounded grid would drift (${((naive - beat32) * FPS).toFixed(2)} frames)`,
  Math.abs(naive - beat32) * FPS > 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
