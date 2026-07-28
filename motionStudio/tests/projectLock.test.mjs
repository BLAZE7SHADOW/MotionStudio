// Fake localStorage + window before importing the bundled module.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = { addEventListener() {}, removeEventListener() {} };
globalThis.document = {
  addEventListener() {}, removeEventListener() {}, visibilityState: 'visible',
};

const L = await import('./lock.cjs.js');
let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? ' ok ' : 'FAIL'}  ${name}`); };

const P = 'proj-1';

check('free project reports nobody', L.holder(P) === 'nobody');
L.claim(P);
check('after claim, holder is me', L.holder(P) === 'me');

// Simulate another tab by rewriting the raw entry with a foreign tabId.
const other = (ts) => store.set('ms_lock_' + P, JSON.stringify({ tabId: 'other-tab', ts }));

other(Date.now());
check('foreign fresh claim reports other', L.holder(P) === 'other');

other(Date.now() - 120_000);
check('foreign stale claim reports nobody (crashed tab recovers)', L.holder(P) === 'nobody');

// release must not steal another tab's live claim
other(Date.now());
L.release(P);
check('release leaves a foreign live claim intact', store.has('ms_lock_' + P));

// take-over then release
L.claim(P);
check('take over wins', L.holder(P) === 'me');
L.release(P);
check('release drops our own claim', !store.has('ms_lock_' + P));

// corrupt entry must not throw or lock the project forever
store.set('ms_lock_' + P, 'not json');
check('corrupt lock entry reads as nobody', L.holder(P) === 'nobody');
store.set('ms_lock_' + P, JSON.stringify({ tabId: 5 }));
check('malformed lock entry reads as nobody', L.holder(P) === 'nobody');

// read-only registry
store.delete('ms_lock_' + P);
check('no read-only by default', !L.hasReadOnly() && !L.isReadOnly(P));
L.setReadOnly(P, true);
check('isReadOnly true after set', L.isReadOnly(P) && L.hasReadOnly());
L.setReadOnly(P, false);
check('isReadOnly false after clear', !L.isReadOnly(P) && !L.hasReadOnly());

/* ── regressions found by actually running the app ── */

// A: React StrictMode mounts, runs cleanup (which releases), then mounts again.
// The heartbeat used to only refresh `if (holder === 'me')`, so after that
// release the tab believed it owned a project it was no longer holding, and
// could never recover. The heartbeat must re-assert.
store.delete('ms_lock_' + P);
L.claim(P);
L.release(P);                       // <- what StrictMode's cleanup does
check('after a transient release nobody holds it', L.holder(P) === 'nobody');
const stopA = L.startHeartbeat(P);
await new Promise((r) => setTimeout(r, 4500));   // one heartbeat
check('heartbeat re-claims after a transient release (StrictMode)', L.holder(P) === 'me');
stopA();

// ...but it must not steal a project another tab legitimately holds, or two
// tabs would ping-pong the claim forever.
other(Date.now());
const stopB = L.startHeartbeat(P);
await new Promise((r) => setTimeout(r, 4500));
check('heartbeat backs off when another tab holds it', L.holder(P) === 'other');
stopB();

// B: Chrome clamps setInterval in hidden tabs to ~1/min, so any staleness
// window under a minute silently evicts every backgrounded tab.
other(Date.now() - 60_000);
check('a claim throttled to a 60s background tick is still considered alive',
  L.holder(P) === 'other');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
