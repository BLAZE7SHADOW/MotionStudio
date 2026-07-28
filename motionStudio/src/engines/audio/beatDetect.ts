/**
 * Where the beats are, from audio samples.
 *
 * Pure: samples in, two numbers out. No Web Audio, no DOM — which is the whole
 * point, because it means the interesting half can be tested headlessly against
 * a synthetic click track instead of "it looked right on one song".
 * `analyzeAudio.ts` is the thin browser wrapper that produces the samples.
 *
 * **We infer a grid rather than reporting the detections.** The tempting build
 * is to draw a tick at every onset and snap to those, but onset detection is
 * jittery — tens of milliseconds — and misses beats wherever the kick drops
 * out. A jittery grid is worse than no grid: a clip lands two frames off and
 * the user can't tell whether that was them or the tool. So the peaks are only
 * ever *evidence* for a tempo and a phase, and the grid that comes out is
 * perfectly regular.
 *
 * Everything here is in **seconds**. Beats do not land on frames — at 128 BPM a
 * beat is 14.06 frames at 30fps — so rounding happens once, at the moment
 * something snaps, never in the grid itself. Rounding early is how beat 32 ends
 * up two frames late and the whole edit drifts.
 */

export interface BeatAnalysis {
  /** Beats per minute, folded into a musically plausible range. */
  bpm: number;
  /** Where the first beat sits, in seconds, within `[0, beatPeriodSec)`. */
  offsetSec: number;
  /** 0–1. Surfaced in the UI, never used to silently discard a result. */
  confidence: number;
  /** How many peaks the tempo was inferred from — diagnostics only. */
  peakCount: number;
}

/** Most music sits here; anything outside is a doubled or halved reading. */
const MIN_BPM = 70;
const MAX_BPM = 180;

/** Envelope resolution. Fine enough that peak quantisation is a rounding
    detail rather than the accuracy ceiling, coarse enough to stay cheap. */
const HOP_SEC = 0.005;
/** Two kicks closer than this are the same kick. */
const REFRACTORY_SEC = 0.12;
/** Below this there isn't enough evidence to claim a tempo at all. */
const MIN_PEAKS = 8;
/** Beats per bar. Only used for labelling — 4/4 is the assumption this
    product's use case (short social edits) is built on. */
export const BEATS_PER_BAR = 4;

export const beatPeriodSec = (bpm: number): number => 60 / bpm;

/** Time of beat `n`, in seconds. The grid's definition, in one line. */
export function beatTimeSec(grid: { bpm: number; offsetSec: number }, n: number): number {
  return grid.offsetSec + n * beatPeriodSec(grid.bpm);
}

/** Index of the beat at or before `sec` — may be negative before the first. */
export function beatIndexAt(grid: { bpm: number; offsetSec: number }, sec: number): number {
  return Math.floor((sec - grid.offsetSec) / beatPeriodSec(grid.bpm));
}

/** The beat nearest a time, in seconds. */
export function nearestBeatSec(grid: { bpm: number; offsetSec: number }, sec: number): number {
  const n = Math.round((sec - grid.offsetSec) / beatPeriodSec(grid.bpm));
  return beatTimeSec(grid, n);
}

/**
 * A short-window RMS envelope.
 *
 * Peak-picking the raw waveform would trip over individual cycles; the
 * envelope turns a kick into one bump. It also shrinks the array by ~80×,
 * which is what keeps the whole analysis in the low milliseconds.
 */
function envelopeOf(samples: Float32Array, sampleRate: number) {
  const hop = Math.max(1, Math.round(HOP_SEC * sampleRate));
  const count = Math.floor(samples.length / hop);
  const env = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let sum = 0;
    const base = i * hop;
    for (let j = 0; j < hop; j++) {
      const v = samples[base + j];
      sum += v * v;
    }
    env[i] = Math.sqrt(sum / hop);
  }
  return { env, hopSec: hop / sampleRate };
}

/**
 * Local maxima above a threshold that walks down until enough are found.
 *
 * **Local maxima, not "first sample over the line then skip ahead."** The naive
 * version manufactures its own rhythm: on noise it emits a peak exactly every
 * refractory period, which then reads as a rock-solid tempo. Requiring a true
 * local maximum keeps noise looking like noise.
 */
function pickPeaks(env: Float32Array, hopSec: number): number[] {
  let max = 0;
  for (const v of env) if (v > max) max = v;
  if (max <= 0) return [];

  const radius = Math.max(1, Math.round(REFRACTORY_SEC / hopSec));
  let best: number[] = [];

  for (let t = 0.85; t >= 0.15; t -= 0.05) {
    const threshold = t * max;
    const peaks: number[] = [];
    for (let i = 0; i < env.length; i++) {
      if (env[i] < threshold) continue;
      let isPeak = true;
      const from = Math.max(0, i - radius);
      const to = Math.min(env.length - 1, i + radius);
      for (let j = from; j <= to; j++) {
        if (env[j] > env[i]) { isPeak = false; break; }
      }
      if (!isPeak) continue;
      peaks.push(i);
      i += radius;
    }
    best = peaks;
    if (peaks.length >= 12) break;
  }
  return best;
}

/** Perceptual tempo centre, used only to break genuine ties. */
const PRIOR_BPM = 120;
/** Width of that prior in log space — deliberately loose. */
const PRIOR_SIGMA = 0.4;

/** How plausible a tempo is on its own, before any evidence. */
function priorWeight(bpm: number): number {
  const d = Math.log(bpm / PRIOR_BPM);
  return Math.exp(-(d * d) / (2 * PRIOR_SIGMA * PRIOR_SIGMA));
}

/**
 * The tempo the gaps between consecutive peaks agree on.
 *
 * **Only adjacent peaks.** Comparing every pair within a window looks more
 * thorough and is actively wrong: at 160 BPM the two-beat gap *is* 80 BPM, and
 * it turns up as often as the real tempo, so half-time reliably outvoted the
 * truth. The gap between one kick and the next is the beat; gaps across several
 * beats mostly add votes for its divisors.
 *
 * Folding still earns its place, because it is what makes a *missed* beat
 * harmless — a doubled gap folds straight back onto the same tempo — and it
 * catches tracks whose raw reading lands outside the plausible range.
 *
 * The prior only separates readings the evidence rates equally, such as 80 vs
 * 160 when every other peak is a snare.
 */
function inferTempo(peaks: number[], hopSec: number) {
  const bins = new Map<number, { weight: number; sum: number; count: number }>();
  let total = 0;

  for (let i = 1; i < peaks.length; i++) {
    const dt = (peaks[i] - peaks[i - 1]) * hopSec;
    if (dt <= 0) continue;
    let bpm = 60 / dt;
    while (bpm < MIN_BPM) bpm *= 2;
    while (bpm > MAX_BPM) bpm /= 2;
    if (bpm < MIN_BPM || bpm > MAX_BPM) continue;

    const w = priorWeight(bpm);
    const key = Math.round(bpm);
    const bin = bins.get(key) ?? { weight: 0, sum: 0, count: 0 };
    bin.weight += w;
    bin.sum += bpm;
    bin.count += 1;
    bins.set(key, bin);
    total += w;
  }
  if (total === 0) return { bpm: 0, agreement: 0 };

  // Neighbouring bins are merged: real tracks are rarely an exact integer BPM,
  // and 127/128/129 are the same answer split three ways.
  let bestKey = 0;
  let bestScore = -1;
  for (const key of bins.keys()) {
    const score =
      (bins.get(key - 1)?.weight ?? 0) + (bins.get(key)?.weight ?? 0) + (bins.get(key + 1)?.weight ?? 0);
    if (score > bestScore) { bestScore = score; bestKey = key; }
  }

  // Refine to a real number from the winning cluster rather than the integer
  // bin — a 1 BPM error is a whole beat out after sixty beats.
  let sum = 0;
  let count = 0;
  for (const key of [bestKey - 1, bestKey, bestKey + 1]) {
    const bin = bins.get(key);
    if (bin) { sum += bin.sum; count += bin.count; }
  }
  return { bpm: count ? sum / count : bestKey, agreement: bestScore / total };
}

/**
 * Where the downbeat sits, and how tightly the peaks agree about it.
 *
 * A circular mean rather than a histogram: phase wraps, so averaging 0.01 and
 * 0.49 of a half-second period has to give ~0.00, not 0.25. The resultant
 * length falls out for free and is exactly the coherence measure we want —
 * 1 when every peak lands on the beat, ~0 when they're scattered.
 */
function inferPhase(peaks: number[], hopSec: number, bpm: number) {
  const period = beatPeriodSec(bpm);
  let sin = 0;
  let cos = 0;
  for (const p of peaks) {
    const phase = ((p * hopSec) % period) / period;
    sin += Math.sin(2 * Math.PI * phase);
    cos += Math.cos(2 * Math.PI * phase);
  }
  const n = peaks.length || 1;
  const coherence = Math.sqrt(sin * sin + cos * cos) / n;
  let turns = Math.atan2(sin, cos) / (2 * Math.PI);
  if (turns < 0) turns += 1;
  return { offsetSec: turns * period, coherence };
}

/**
 * Sharpen a rough tempo by fitting the grid back to the peaks.
 *
 * The envelope quantises every peak to a 5ms hop, so a period that isn't a
 * whole number of hops produces alternating intervals — at 160 BPM, 37 and 38
 * hops, which read as 162 and 158 and average to neither. Binning cannot
 * recover from that; the resolution limit is baked into the peak positions.
 *
 * Searching a narrow band for the tempo whose grid the peaks sit on *does*
 * recover it, because phase coherence is sensitive to a tempo error in a way a
 * histogram of intervals is not: being 1% out walks a whole beat away over a
 * hundred peaks, and the coherence collapses. Narrow on purpose — a wider
 * search would happily find the half-time reading.
 */
function refineTempo(peaks: number[], hopSec: number, rough: number) {
  const SPAN = 0.04;
  const STEPS = 200;
  let best = { bpm: rough, coherence: -1 };
  for (let i = 0; i <= STEPS; i++) {
    const bpm = rough * (1 - SPAN + (2 * SPAN * i) / STEPS);
    if (bpm < MIN_BPM || bpm > MAX_BPM) continue;
    const { coherence } = inferPhase(peaks, hopSec, bpm);
    if (coherence > best.coherence) best = { bpm, coherence };
  }
  return best;
}

/**
 * Infer a beat grid from mono samples.
 *
 * Returns `confidence: 0` rather than a guess when there is nothing to go on —
 * a confident wrong tempo is far more damaging than an admitted failure,
 * because the user builds an edit on it.
 */
export function detectBeat(samples: Float32Array, sampleRate: number): BeatAnalysis {
  const empty: BeatAnalysis = { bpm: 0, offsetSec: 0, confidence: 0, peakCount: 0 };
  if (!samples.length || sampleRate <= 0) return empty;

  const { env, hopSec } = envelopeOf(samples, sampleRate);
  const peaks = pickPeaks(env, hopSec);
  if (peaks.length < MIN_PEAKS) return { ...empty, peakCount: peaks.length };

  const rough = inferTempo(peaks, hopSec);
  if (!rough.bpm) return { ...empty, peakCount: peaks.length };

  const bpm = refineTempo(peaks, hopSec, rough.bpm).bpm;
  const agreement = rough.agreement;
  const { offsetSec, coherence } = inferPhase(peaks, hopSec, bpm);

  /* Both halves have to hold up. Strong agreement with scattered phase means a
     tempo nothing actually lands on; tight phase with weak agreement means we
     found a repeating sound that isn't the beat. The geometric mean punishes
     either being weak, which is the behaviour we want. */
  const confidence = Math.sqrt(Math.max(0, agreement) * Math.max(0, coherence));

  return {
    bpm: Math.round(bpm * 100) / 100,
    offsetSec: Math.round(offsetSec * 1000) / 1000,
    confidence: Math.round(confidence * 100) / 100,
    peakCount: peaks.length,
  };
}
