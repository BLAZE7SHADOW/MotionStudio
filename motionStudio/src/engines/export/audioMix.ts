import type { Project } from '../project/types';

/**
 * Offline audio mixing for the client-side export.
 *
 * Every audible element (audio clips, and the soundtracks of video clips) is
 * decoded and scheduled into an OfflineAudioContext at its exact start time,
 * with its volume applied. OfflineAudioContext renders the full mix faster
 * than real time and sample-exact — the audio twin of our offline video loop.
 */

interface AudibleSource {
  url: string;
  startTime: number; // seconds into the composition
  duration: number;  // seconds
  volume: number;    // 0–1
}

function collectAudibleSources(project: Project): AudibleSource[] {
  const out: AudibleSource[] = [];
  for (const el of project.canvas.elements) {
    if (el.type !== 'audio' && el.type !== 'video') continue;
    const asset = project.assets.find((a) => a.id === el.assetId);
    if (!asset) continue;
    out.push({
      url: asset.url,
      startTime: el.startFrame / project.fps,
      duration: el.durationInFrames / project.fps,
      volume: el.type === 'audio' ? (el.volume ?? 1) : 1,
    });
  }
  return out;
}

/**
 * Mix the project's audio into one stereo AudioBuffer.
 * Returns null when the project has nothing audible (video stays audio-less).
 */
export async function mixAudioTrack(
  project: Project,
  sampleRate = 48_000,
): Promise<AudioBuffer | null> {
  const sources = collectAudibleSources(project);
  if (sources.length === 0) return null;

  const durationSec = project.durationInFrames / project.fps;
  const ctx = new OfflineAudioContext(2, Math.ceil(durationSec * sampleRate), sampleRate);

  let scheduled = false;
  await Promise.all(
    sources.map(async (s) => {
      try {
        const bytes = await fetch(s.url).then((r) => r.arrayBuffer());
        const decoded = await ctx.decodeAudioData(bytes); // also extracts a video's audio track
        const node = ctx.createBufferSource();
        node.buffer = decoded;
        const gain = ctx.createGain();
        gain.gain.value = Math.max(0, Math.min(1, s.volume));
        node.connect(gain).connect(ctx.destination);
        node.start(s.startTime, 0, s.duration); // when, source offset, how long
        scheduled = true;
      } catch {
        // undecodable source (e.g. a silent video) — skip, never fail the export
      }
    }),
  );

  if (!scheduled) return null;
  return ctx.startRendering();
}
