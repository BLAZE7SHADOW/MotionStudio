import type { CanvasElement, Project, Scene } from './types';

/**
 * Everything the shot model knows how to do, as pure functions.
 *
 * No React, no store, no side effects — every one takes a project and returns a
 * new one. That is deliberate: the invariants below are easy to break by hand
 * and impossible to debug once a saved project is wrong, so they are kept in
 * one file that can be tested headlessly (see `scenes.test.mjs`).
 *
 * The invariants, maintained by every function here:
 *
 *   1. `project.durationInFrames` === the sum of the shot durations.
 *   2. Every element's `sceneId` names a shot that exists.
 *   3. An element lies inside its shot's span. Elements carry *absolute*
 *      frames, so this one is enforced rather than structural — which is the
 *      price of leaving the render path untouched.
 */

/**
 * `sceneId` for an element that belongs to the **whole video** rather than one
 * shot — a background, a music bed, a watermark.
 *
 * Every shot-based editor hits this, and skipping it made the model wrong in
 * the first five minutes of real use: a project's shader background lived in
 * shot 1, so adding shot 2 produced a black void with no background and no
 * music. Ultramock's answer is a global "scene" setting separate from per-shot
 * effects; ours is one field, because a background is already an element and
 * giving it a second home would mean two ways to say the same thing.
 *
 * A sentinel rather than `null`/`undefined` on purpose: absent means "not
 * migrated yet" and gets adopted by `ensureScenes`, which is a different thing
 * entirely and would silently swallow globals.
 */
export const ALL_SHOTS = '__all__';

/** True when this element spans the video rather than living in one shot. */
export function spansAllShots(el: { sceneId?: string }): boolean {
  return el.sceneId === ALL_SHOTS;
}

/** A shot shorter than this can't be trimmed or clicked reliably. */
export const MIN_SCENE_FRAMES = 6;

/** Matches the longest option in Project settings. Adding past it is refused
    rather than silently clamped, so the user knows why nothing happened. */
export const MAX_PROJECT_SECONDS = 90;

let seq = 0;
const newSceneId = () => `scene-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/** The shots of a project, or an empty list for one not yet migrated. */
export function scenesOf(project: Project): Scene[] {
  return project.scenes ?? [];
}

/**
 * Absolute start frame of every shot.
 *
 * The single place a shot's position is computed. Nothing stores it.
 */
export function sceneOffsets(scenes: Scene[]): Map<string, number> {
  const out = new Map<string, number>();
  let at = 0;
  for (const s of scenes) {
    out.set(s.id, at);
    at += s.durationInFrames;
  }
  return out;
}

export function sceneSpan(scenes: Scene[], sceneId: string): { start: number; end: number } {
  const start = sceneOffsets(scenes).get(sceneId) ?? 0;
  const scene = scenes.find((s) => s.id === sceneId);
  return { start, end: start + (scene?.durationInFrames ?? 0) };
}

/** Elements a shot shows: its own, plus everything spanning the whole video. */
export function elementsInScene(project: Project, sceneId: string): CanvasElement[] {
  return project.canvas.elements.filter(
    (el) => el.sceneId === sceneId || spansAllShots(el),
  );
}

/**
 * Re-spans every video-wide element over the current total.
 *
 * Their whole point is to cover the video, so their timing is derived, not
 * authored — any operation that changes the total length has to run this or
 * the background stops halfway through. Audio keeps its own length, since a
 * 20s track can't be stretched to fill a 30s video.
 */
function respanGlobals(project: Project, total: number): Project {
  if (!project.canvas.elements.some(spansAllShots)) return project;
  return {
    ...project,
    canvas: {
      ...project.canvas,
      elements: project.canvas.elements.map((el) => {
        if (!spansAllShots(el)) return el;
        const duration = el.type === 'audio' ? Math.min(el.durationInFrames, total) : total;
        return el.startFrame === 0 && el.durationInFrames === duration
          ? el
          : { ...el, startFrame: 0, durationInFrames: duration };
      }),
    },
  };
}

/** Display name for a shot — falls back to its position, so renaming or
    reordering can never leave a stale "Shot 3" in second place. */
export function sceneLabel(scenes: Scene[], sceneId: string): string {
  const i = scenes.findIndex((s) => s.id === sceneId);
  const scene = scenes[i];
  return scene?.name?.trim() || `Shot ${i + 1}`;
}

/** The shot covering a frame — how a newly created element is assigned one. */
export function sceneAtFrame(scenes: Scene[], frame: number): string | undefined {
  if (scenes.length === 0) return undefined;
  const offsets = sceneOffsets(scenes);
  let found = scenes[0].id;
  for (const s of scenes) {
    if ((offsets.get(s.id) ?? 0) <= frame) found = s.id;
  }
  return found;
}

const totalFrames = (scenes: Scene[]) => scenes.reduce((n, s) => n + s.durationInFrames, 0);

/** Clamps an element into a span without changing its length where it fits. */
function fitInto(el: CanvasElement, start: number, end: number): CanvasElement {
  const maxLen = Math.max(1, end - start);
  const duration = Math.min(el.durationInFrames, maxLen);
  const startFrame = Math.min(Math.max(el.startFrame, start), end - duration);
  return startFrame === el.startFrame && duration === el.durationInFrames
    ? el
    : { ...el, startFrame, durationInFrames: duration };
}

/**
 * The migration. Idempotent, so it is safe to run at every entry point —
 * IndexedDB rehydration, the cloud load, and project creation.
 *
 * A project saved before shots existed becomes a one-shot project spanning its
 * whole length, which is exactly how it already behaves. Crucially it does
 * **not** touch any element's `startFrame` or `durationInFrames`: the only
 * change is an added `sceneId`, so nothing renders differently.
 */
export function ensureScenes(project: Project): Project {
  const existing = project.scenes;
  const ids = new Set(existing?.map((s) => s.id));

  // Already migrated and coherent — the common path, so make it allocation-free.
  if (
    existing?.length &&
    project.canvas.elements.every((el) => spansAllShots(el) || (el.sceneId && ids.has(el.sceneId)))
  ) {
    return project;
  }

  const scenes: Scene[] =
    existing?.length ? existing : [{ id: newSceneId(), durationInFrames: project.durationInFrames }];

  // Anything orphaned (no shot, or a shot that has since been deleted) is
  // adopted by whichever shot covers its start frame. Losing an element to a
  // dangling id would be a far worse outcome than putting it in the wrong shot.
  const offsets = sceneOffsets(scenes);
  const owning = (frame: number) => {
    let found = scenes[0].id;
    for (const s of scenes) {
      if ((offsets.get(s.id) ?? 0) <= frame) found = s.id;
    }
    return found;
  };

  return {
    ...project,
    scenes,
    durationInFrames: totalFrames(scenes),
    canvas: {
      ...project.canvas,
      elements: project.canvas.elements.map((el) =>
        spansAllShots(el) || (el.sceneId && ids.has(el.sceneId))
          ? el
          : { ...el, sceneId: owning(el.startFrame) },
      ),
    },
  };
}

/**
 * Appends a shot, extending the video.
 *
 * Returns the project unchanged when that would exceed the cap — the caller
 * tells the user rather than us silently shortening what they asked for.
 */
export function addScene(project: Project, durationInFrames: number, fps: number): Project {
  const base = ensureScenes(project);
  const scenes = scenesOf(base);
  const duration = Math.max(MIN_SCENE_FRAMES, Math.round(durationInFrames));
  if (totalFrames(scenes) + duration > MAX_PROJECT_SECONDS * fps) return base;

  const next = [...scenes, { id: newSceneId(), durationInFrames: duration }];
  return respanGlobals(
    { ...base, scenes: next, durationInFrames: totalFrames(next) },
    totalFrames(next),
  );
}

/**
 * Deletes a shot **and everything in it**, closing the gap.
 *
 * Refuses to remove the last shot: a project with no shots has nowhere to put
 * the next element.
 */
export function removeScene(project: Project, sceneId: string): Project {
  const base = ensureScenes(project);
  const scenes = scenesOf(base);
  if (scenes.length <= 1 || !scenes.some((s) => s.id === sceneId)) return base;

  const { start, end } = sceneSpan(scenes, sceneId);
  const removedLength = end - start;
  const next = scenes.filter((s) => s.id !== sceneId);

  const out: Project = {
    ...base,
    scenes: next,
    durationInFrames: totalFrames(next),
    canvas: {
      ...base.canvas,
      elements: base.canvas.elements
        // A video-wide element isn't "in" the shot being deleted, so it stays.
        .filter((el) => spansAllShots(el) || el.sceneId !== sceneId)
        // Everything after the hole slides back by its length.
        .map((el) =>
          !spansAllShots(el) && el.startFrame >= end
            ? { ...el, startFrame: el.startFrame - removedLength }
            : el,
        ),
    },
  };
  return respanGlobals(out, totalFrames(next));
}

/**
 * Resizes a shot and ripples the rest.
 *
 * This is the operation nested shots would have given us free, and the reason
 * it is worth writing by hand: everything after the resized shot shifts by the
 * delta, and everything inside it is refitted so nothing escapes its span.
 */
export function setSceneDuration(
  project: Project,
  sceneId: string,
  durationInFrames: number,
  fps: number,
): Project {
  const base = ensureScenes(project);
  const scenes = scenesOf(base);
  const scene = scenes.find((s) => s.id === sceneId);
  if (!scene) return base;

  const duration = Math.max(MIN_SCENE_FRAMES, Math.round(durationInFrames));
  const delta = duration - scene.durationInFrames;
  if (delta === 0) return base;
  if (totalFrames(scenes) + delta > MAX_PROJECT_SECONDS * fps) return base;

  const { start, end } = sceneSpan(scenes, sceneId);
  const next = scenes.map((s) => (s.id === sceneId ? { ...s, durationInFrames: duration } : s));

  const out: Project = {
    ...base,
    scenes: next,
    durationInFrames: totalFrames(next),
    canvas: {
      ...base.canvas,
      elements: base.canvas.elements.map((el) => {
        // Video-wide elements are re-spanned below, not rippled.
        if (spansAllShots(el)) return el;
        if (el.startFrame >= end) return { ...el, startFrame: el.startFrame + delta };
        if (el.sceneId === sceneId) return fitInto(el, start, start + duration);
        return el;
      }),
    },
  };
  return respanGlobals(out, totalFrames(next));
}

/** Moves a shot, recomputing every element that changed position as a result. */
export function reorderScene(project: Project, sceneId: string, toIndex: number): Project {
  const base = ensureScenes(project);
  const scenes = scenesOf(base);
  const from = scenes.findIndex((s) => s.id === sceneId);
  const to = Math.min(Math.max(toIndex, 0), scenes.length - 1);
  if (from < 0 || from === to) return base;

  const next = [...scenes];
  next.splice(to, 0, ...next.splice(from, 1));

  /* Elements hold absolute frames, so reordering has to move them by hand.
     Each one keeps its offset *within* its own shot and picks up that shot's
     new start — which is why the offset is measured before the reorder. */
  const before = sceneOffsets(scenes);
  const after = sceneOffsets(next);

  return {
    ...base,
    scenes: next,
    canvas: {
      ...base.canvas,
      elements: base.canvas.elements.map((el) => {
        if (!el.sceneId || spansAllShots(el)) return el;
        const wasAt = before.get(el.sceneId);
        const nowAt = after.get(el.sceneId);
        if (wasAt === undefined || nowAt === undefined || wasAt === nowAt) return el;
        return { ...el, startFrame: el.startFrame - wasAt + nowAt };
      }),
    },
  };
}

/**
 * Rescales a project onto a new frame rate.
 *
 * Frames are the unit of everything temporal, so changing fps without
 * rescaling silently changes how long things last: at 30→60 a 10-second clip
 * becomes 5 seconds of wall time. Scaling shots *and* elements by the same
 * ratio keeps every duration where the user put it, and keeps invariant 1
 * (total === sum of shots) true, which a naive fps change would break.
 *
 * Rounding is absorbed by the last shot so the sum stays exact.
 */
export function rescaleForFps(project: Project, nextFps: number): Project {
  const base = ensureScenes(project);
  if (nextFps === base.fps || nextFps <= 0) return base;
  const ratio = nextFps / base.fps;

  const scaled = scenesOf(base).map((s) => ({
    ...s,
    durationInFrames: Math.max(MIN_SCENE_FRAMES, Math.round(s.durationInFrames * ratio)),
  }));
  const target = Math.round(totalFrames(scenesOf(base)) * ratio);
  const drift = target - totalFrames(scaled);
  const last = scaled[scaled.length - 1];
  last.durationInFrames = Math.max(MIN_SCENE_FRAMES, last.durationInFrames + drift);

  const offsets = sceneOffsets(scaled);
  const out: Project = {
    ...base,
    fps: nextFps,
    scenes: scaled,
    durationInFrames: totalFrames(scaled),
    canvas: {
      ...base.canvas,
      elements: base.canvas.elements.map((el) => {
        const scaledEl = {
          ...el,
          startFrame: Math.round(el.startFrame * ratio),
          durationInFrames: Math.max(1, Math.round(el.durationInFrames * ratio)),
        };
        // Rounding can push an element a frame past its shot; refit rather
        // than leave invariant 3 broken. A video-wide element has no shot to
        // be refitted into — `respanGlobals` gives it the exact new total.
        if (spansAllShots(el)) return scaledEl;
        const start = el.sceneId ? offsets.get(el.sceneId) ?? 0 : 0;
        const shot = scaled.find((s) => s.id === el.sceneId);
        return shot ? fitInto(scaledEl, start, start + shot.durationInFrames) : scaledEl;
      }),
    },
  };
  return respanGlobals(out, totalFrames(scaled));
}

/**
 * Changes the video's total length by absorbing the difference into the last
 * shot, so Project settings keeps working without knowing shots exist.
 */
export function setTotalDuration(project: Project, durationInFrames: number, fps: number): Project {
  const base = ensureScenes(project);
  const scenes = scenesOf(base);
  const last = scenes[scenes.length - 1];
  const others = totalFrames(scenes) - last.durationInFrames;
  return setSceneDuration(base, last.id, Math.max(MIN_SCENE_FRAMES, durationInFrames - others), fps);
}
