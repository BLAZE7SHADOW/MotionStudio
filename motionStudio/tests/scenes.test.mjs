const S = await import('./scenes.bundle.js');
let pass = 0, fail = 0;
const check = (n, c) => { c ? pass++ : fail++; console.log(`${c ? ' ok ' : 'FAIL'}  ${n}`); };
const FPS = 30;

const el = (id, startFrame, durationInFrames, extra = {}) =>
  ({ id, type: 'text', x: 0, y: 0, width: 100, height: 50, rotation: 0, opacity: 1,
     zIndex: 1, startFrame, durationInFrames, ...extra });

// A project exactly as it would have been saved before shots existed.
const legacy = {
  id: 'p1', name: 'Legacy', aspectRatio: '16:9', fps: FPS, durationInFrames: 300,
  createdAt: 1, updatedAt: 2, assets: [],
  canvas: { elements: [el('a', 0, 90), el('b', 90, 120), el('c', 210, 90)] },
};

/* ── 1. migration must not change what renders ── */
const m = S.ensureScenes(legacy);
const timingsOf = (p) => p.canvas.elements.map(({ id, startFrame, durationInFrames, zIndex }) =>
  ({ id, startFrame, durationInFrames, zIndex }));
check('migration leaves every element timing byte-identical',
  JSON.stringify(timingsOf(m)) === JSON.stringify(timingsOf(legacy)));
check('migration adds exactly one field (sceneId)', m.canvas.elements.every((e, i) => {
  const before = Object.keys(legacy.canvas.elements[i]);
  const after = Object.keys(e).filter((k) => k !== 'sceneId');
  return JSON.stringify(before) === JSON.stringify(after);
}));
check('migration mints one shot spanning the whole video',
  m.scenes.length === 1 && m.scenes[0].durationInFrames === 300);
check('every element lands in that shot', m.canvas.elements.every((e) => e.sceneId === m.scenes[0].id));
check('total duration unchanged', m.durationInFrames === legacy.durationInFrames);
check('migration is idempotent', S.ensureScenes(m) === m);
check('legacy project was not mutated', legacy.scenes === undefined);

/* ── 2. adding shots extends the video ── */
let p = S.addScene(m, 90, FPS);
check('add extends total', p.durationInFrames === 390 && p.scenes.length === 2);
check('add leaves existing shots untouched', p.scenes[0].durationInFrames === 300);
check('add does not move existing elements',
  JSON.stringify(timingsOf(p)) === JSON.stringify(timingsOf(legacy)));
const capped = S.addScene({ ...p, durationInFrames: 89 * FPS, scenes: [{ id: 's', durationInFrames: 89 * FPS }] }, 5 * FPS, FPS);
check('add refused past the 90s cap', capped.durationInFrames === 89 * FPS);

/* ── 3. resize ripples ── */
const two = S.addScene(m, 90, FPS);                  // [300][90]
const s2 = two.scenes[1].id;
const withLate = { ...two, canvas: { elements: [...two.canvas.elements, el('d', 300, 60, { sceneId: s2 })] } };
const grown = S.setSceneDuration(withLate, two.scenes[0].id, 360, FPS);
check('resize updates total', grown.durationInFrames === 450);
const d = grown.canvas.elements.find((e) => e.id === 'd');
check('elements after the resized shot ripple by the delta', d.startFrame === 360);
const a = grown.canvas.elements.find((e) => e.id === 'a');
check('elements before are untouched', a.startFrame === 0 && a.durationInFrames === 90);

const shrunk = S.setSceneDuration(withLate, two.scenes[0].id, 120, FPS);
check('shrinking refits elements inside the shot',
  shrunk.canvas.elements.filter((e) => e.sceneId !== s2)
    .every((e) => e.startFrame >= 0 && e.startFrame + e.durationInFrames <= 120));
check('shrinking ripples later elements back',
  shrunk.canvas.elements.find((e) => e.id === 'd').startFrame === 120);

/* ── 4. delete takes its elements with it ── */
const del = S.removeScene(withLate, s2);
check('delete removes the shot', del.scenes.length === 1);
check('delete removes that shot\'s elements', !del.canvas.elements.some((e) => e.id === 'd'));
check('delete closes the gap in total duration', del.durationInFrames === 300);
check('cannot delete the last shot', S.removeScene(m, m.scenes[0].id).scenes.length === 1);

/* ── 5. reorder ── */
const ro = S.reorderScene(withLate, two.scenes[0].id, 1);   // [300][90] -> [90][300]
check('reorder swaps the shots', ro.scenes[0].id === s2);
check('reorder moves the second shot\'s element to the front',
  ro.canvas.elements.find((e) => e.id === 'd').startFrame === 0);
check('reorder moves the first shot\'s elements after it',
  ro.canvas.elements.find((e) => e.id === 'a').startFrame === 90);
check('reorder preserves total duration', ro.durationInFrames === withLate.durationInFrames);

/* ── 6. invariants hold everywhere ── */
const sum = (p) => p.scenes.reduce((n, s) => n + s.durationInFrames, 0);
for (const [name, proj] of Object.entries({ m, p, grown, shrunk, del, ro })) {
  check(`invariant: ${name} duration === sum of shots`, proj.durationInFrames === sum(proj));
  check(`invariant: ${name} every sceneId resolves`,
    proj.canvas.elements.every((e) => proj.scenes.some((s) => s.id === e.sceneId)));
}

/* ── 7. total duration absorbs into the last shot ── */
const td = S.setTotalDuration(two, 500, FPS);
check('setTotalDuration hits the requested total', td.durationInFrames === 500);
check('setTotalDuration only changed the last shot', td.scenes[0].durationInFrames === 300);

/* ── 8. changing frame rate keeps every duration where the user put it ── */
const two30 = S.addScene(m, 90, FPS);                       // 300 + 90 @30fps
const at60 = S.rescaleForFps(two30, 60);
check('fps change scales the total', at60.durationInFrames === 780);
check('fps change scales each shot',
  at60.scenes[0].durationInFrames === 600 && at60.scenes[1].durationInFrames === 180);
check('fps change keeps total === sum of shots',
  at60.durationInFrames === at60.scenes.reduce((n, s) => n + s.durationInFrames, 0));
check('fps change scales element timings (a 3s clip stays 3s)',
  at60.canvas.elements.find((e) => e.id === 'a').durationInFrames === 180);
check('fps change keeps every element inside its shot', at60.canvas.elements.every((e) => {
  const off = S.sceneOffsets(at60.scenes).get(e.sceneId);
  const shot = at60.scenes.find((s) => s.id === e.sceneId);
  return e.startFrame >= off && e.startFrame + e.durationInFrames <= off + shot.durationInFrames;
}));
check('fps change round-trips', S.rescaleForFps(at60, 30).durationInFrames === two30.durationInFrames);
check('fps change to the same rate is a no-op', S.rescaleForFps(two30, FPS) === two30);

/* ── 9. elements that span the whole video ───────────────────────────────
   A background or a soundtrack belongs to the video, not to whichever shot was
   open when it was added. Getting this wrong is what made adding a shot land
   you on a black screen with no music. */
const bg = el('bg', 0, 300, { sceneId: S.ALL_SHOTS, type: 'shader' });
// The asset matters: a track's limit is the file, not whatever length the
// element currently has. Without one there is nothing to respect.
const trackAsset = { id: 'mus-src', type: 'audio', name: 'm.wav', url: '', durationInSeconds: 200 / FPS };
const track = el('mus', 0, 200, { sceneId: S.ALL_SHOTS, type: 'audio', assetId: 'mus-src' });
const withGlobals = S.ensureScenes({ ...legacy,
  assets: [trackAsset],
  canvas: { elements: [...legacy.canvas.elements, bg, track] } });

check('migration leaves a video-wide element alone',
  withGlobals.canvas.elements.find(e => e.id === 'bg').sceneId === S.ALL_SHOTS);
check('a video-wide element shows in every shot',
  S.elementsInScene(withGlobals, withGlobals.scenes[0].id).some(e => e.id === 'bg'));

const grown2 = S.addScene(withGlobals, 90, FPS);
check('adding a shot re-spans the background over the new total',
  grown2.canvas.elements.find(e => e.id === 'bg').durationInFrames === grown2.durationInFrames);
check('adding a shot does not stretch audio past its own length',
  grown2.canvas.elements.find(e => e.id === 'mus').durationInFrames === 200);
check('the background still starts at 0',
  grown2.canvas.elements.find(e => e.id === 'bg').startFrame === 0);
check('a video-wide element appears in the NEW shot too',
  S.elementsInScene(grown2, grown2.scenes[1].id).some(e => e.id === 'bg'));

const shrunk2 = S.setSceneDuration(grown2, grown2.scenes[0].id, 120, FPS);
check('resizing a shot re-spans the background, never ripples it',
  shrunk2.canvas.elements.find(e => e.id === 'bg').startFrame === 0 &&
  shrunk2.canvas.elements.find(e => e.id === 'bg').durationInFrames === shrunk2.durationInFrames);

const deleted = S.removeScene(grown2, grown2.scenes[1].id);
check('deleting a shot does not delete the background',
  deleted.canvas.elements.some(e => e.id === 'bg'));
check('the background re-spans after a shot is deleted',
  deleted.canvas.elements.find(e => e.id === 'bg').durationInFrames === deleted.durationInFrames);

const reordered = S.reorderScene(grown2, grown2.scenes[0].id, 1);
check('reordering never moves a video-wide element',
  reordered.canvas.elements.find(e => e.id === 'bg').startFrame === 0);

const fps60 = S.rescaleForFps(grown2, 60);
check('changing fps re-spans the background exactly',
  fps60.canvas.elements.find(e => e.id === 'bg').durationInFrames === fps60.durationInFrames);

/* ── 9b. a soundtrack must cover the sequence, not stop partway ──
   The common case: one track under the whole video. Capping the element by its
   own current length made that a one-way ratchet — a track added to a short
   video was clipped, and adding shots could never let it grow back. */
const musicAsset = { id: 'aud', type: 'audio', name: 'track.wav', url: '', durationInSeconds: 20 };
const shortProject = S.ensureScenes({
  ...legacy, durationInFrames: 150, assets: [musicAsset],
  scenes: [{ id: 'only', durationInFrames: 150 }],
  canvas: { elements: [el('bed', 0, 150, { sceneId: S.ALL_SHOTS, type: 'audio', assetId: 'aud' })] },
});
const bed = (p) => p.canvas.elements.find((e) => e.id === 'bed');
check('a track is clipped to a video shorter than it', bed(shortProject).durationInFrames === 150);

const longer = S.addScene(shortProject, 300, FPS);          // 150 -> 450 frames
check('adding a shot lets the soundtrack grow to cover it',
  bed(longer).durationInFrames === 450);
check('...and it still starts at zero', bed(longer).startFrame === 0);

const beyond = S.addScene(longer, 300, FPS);                 // 450 -> 750, past the 600-frame file
check('but never past the end of the file itself',
  bed(beyond).durationInFrames === 600);
check('the video is still allowed to be longer than the music',
  beyond.durationInFrames === 750);

/* ── 10. beat snapping ───────────────────────────────────────────────────
   The grid lives in seconds precisely so that frames are computed once. These
   pin down that the conversion happens where it should and nowhere else. */
const grid = { bpm: 128, offsetSec: 0.25, enabled: true };
const off = { ...grid, enabled: false };

check('no snapping when the grid is off', S.snapFrameToBeat(off, FPS, 137) === 137);
check('no snapping without a grid at all', S.snapFrameToBeat(undefined, FPS, 137) === 137);
check('gridActive rejects a zero tempo', !S.gridActive({ ...grid, bpm: 0 }));

const beat3 = 0.25 + (60 / 128) * 3;
check('a frame near beat 3 snaps onto it',
  S.snapFrameToBeat(grid, FPS, Math.round(beat3 * FPS) + 2) === Math.round(beat3 * FPS));
check('a frame just past a beat snaps back to it',
  S.snapFrameToBeat(grid, FPS, Math.round(beat3 * FPS) - 2) === Math.round(beat3 * FPS));

/* The drift guard, from the other side: snapping far down the timeline must
   still land on the true beat, not on an accumulated approximation. */
const beat64 = 0.25 + (60 / 128) * 64;
check('beat 64 snaps to within one frame of true time',
  Math.abs(S.snapFrameToBeat(grid, FPS, Math.round(beat64 * FPS) + 3) - beat64 * FPS) <= 1);

check('a bar is four beats of frames', S.barFrames(grid, FPS) === Math.round((60 / 128) * 4 * FPS));
check('framesInBeats reads a bar back as 4', S.framesInBeats(grid, FPS, S.barFrames(grid, FPS)) === 4);
check('framesInBeats rounds rather than reporting a fraction',
  S.framesInBeats(grid, FPS, S.barFrames(grid, FPS) + 1) === 4);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
