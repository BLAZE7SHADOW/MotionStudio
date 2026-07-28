import { detectBeat, type BeatAnalysis } from './beatDetect';

/**
 * The browser half of beat detection: a URL in, samples out, straight into
 * `detectBeat`.
 *
 * Everything here is Web Audio plumbing and nothing here is interesting, which
 * is the point — all the judgement lives in `beatDetect.ts` where it can be
 * tested against a signal whose tempo we chose.
 *
 * The decode is the same `OfflineAudioContext` + `decodeAudioData` route
 * `engines/export/audioMix.ts` already uses, so this adds no dependency and no
 * new failure mode. It deliberately shares no code with the export: mixing and
 * measuring want different things, and coupling them would mean a change to
 * one could break the other.
 */

/** Analysis rate. The kick lives below 150Hz, so 8kHz is generous — and it
    makes the array ~5× smaller than the audio it came from. */
const ANALYSIS_RATE = 8000;

/** Only the opening minute. Tempo doesn't usually change, and a full track
    would cost seconds of decode for no extra certainty. */
const MAX_SECONDS = 60;

/** The kick band. Melody and vocals only confuse energy peak-picking. */
const LOWPASS_HZ = 150;

export interface AudioAnalysis {
  /** True length of the file. Worth returning because the `<audio>` metadata
      probe can stall indefinitely on files Web Audio decodes without complaint,
      so this is the more reliable of the two sources. */
  durationSec: number;
  beat: BeatAnalysis;
}

export async function analyzeAudioUrl(url: string): Promise<AudioAnalysis | null> {
  try {
    const bytes = await fetch(url).then((r) => r.arrayBuffer());

    // decodeAudioData needs *a* context; this one only exists to own the decode.
    const decoded = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(bytes);
    const seconds = Math.min(decoded.duration, MAX_SECONDS);
    if (seconds <= 0) return null;

    /* Rendering into a low-rate mono context does the downmix, the resample and
       the filtering in one pass, off the main thread. What comes back is
       already the array `detectBeat` wants. */
    const ctx = new OfflineAudioContext(1, Math.ceil(seconds * ANALYSIS_RATE), ANALYSIS_RATE);
    const source = ctx.createBufferSource();
    source.buffer = decoded;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = LOWPASS_HZ;
    source.connect(lowpass).connect(ctx.destination);
    source.start(0, 0, seconds);

    const rendered = await ctx.startRendering();
    return {
      durationSec: decoded.duration,
      beat: detectBeat(rendered.getChannelData(0), ANALYSIS_RATE),
    };
  } catch {
    // An undecodable or unreachable file is not an error worth surfacing — the
    // user simply gets no grid, and can enter a tempo by hand.
    return null;
  }
}
