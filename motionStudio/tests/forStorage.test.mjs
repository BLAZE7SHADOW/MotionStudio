const S = await import('./forStorage.bundle.js');
let pass = 0, fail = 0;
const check = (n, c) => { c ? pass++ : fail++; console.log(`${c ? ' ok ' : 'FAIL'}  ${n}`); };

const project = (assets) => ({
  id: 'p1', name: 'test', aspectRatio: '16:9', fps: 30, durationInFrames: 300,
  assets, canvas: { elements: [] }, createdAt: 0, updatedAt: 0,
});

/* The bug this exists to prevent: a `blob:` url is a pointer into the memory of
   the tab that made it. Persisting one saves a value that is guaranteed dead by
   the time anything reads it back — and because the Supabase copy lands *after*
   `rehydrateAssets` has already resolved good urls, the dead one wins and every
   project with media reads as "Re-upload needed". */
const withBlob = project([
  { id: 'a1', type: 'audio', name: 'track.mp3', url: 'blob:http://localhost:5173/abc-123', storageUrl: 'https://s3/a1.mp3' },
]);
const stored = S.forStorage(withBlob);

check('a blob: url is never written to storage', stored.assets[0].url === '');
check('the S3 copy survives — it is what the relink falls back to',
  stored.assets[0].storageUrl === 'https://s3/a1.mp3');
check('everything else about the asset is untouched',
  stored.assets[0].id === 'a1' && stored.assets[0].name === 'track.mp3' && stored.assets[0].type === 'audio');
check('the input is not mutated — the live store keeps its working url',
  withBlob.assets[0].url === 'blob:http://localhost:5173/abc-123');

/* An https url is durable and must be left alone: blanking it would throw away
   the only thing that makes media work on a second device. */
const httpsOnly = project([
  { id: 'a2', type: 'image', name: 'shot.png', url: 'https://s3/a2.png' },
]);
check('an https url is left exactly as it is', S.forStorage(httpsOnly).assets[0].url === 'https://s3/a2.png');
check('a project with nothing to strip is returned as the same object',
  S.forStorage(httpsOnly) === httpsOnly);
const empty = project([]);
check('a project with no assets is returned as the same object', S.forStorage(empty) === empty);

/* Mixed is the realistic case — one file uploaded, one still local-only. */
const mixed = project([
  { id: 'a3', type: 'audio', name: 'a.mp3', url: 'blob:http://x/1' },
  { id: 'a4', type: 'video', name: 'b.mp4', url: 'https://s3/a4.mp4' },
]);
const mixedOut = S.forStorage(mixed);
check('mixed: the blob is blanked and the https is kept',
  mixedOut.assets[0].url === '' && mixedOut.assets[1].url === 'https://s3/a4.mp4');

/* An already-blank url is the post-fix steady state — it must round-trip
   unchanged, or every save would churn the row and re-trigger cloud sync. */
const blank = project([{ id: 'a5', type: 'audio', name: 'c.mp3', url: '' }]);
check('an already-blank url round-trips as the same object', S.forStorage(blank) === blank);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
