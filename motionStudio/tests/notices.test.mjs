// Fake localStorage before importing the bundled module.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const N = await import('./notices.bundle.js');
let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? ' ok ' : 'FAIL'}  ${name}`); };

const KEY = 'ms_suppressed_notices';

check('nothing suppressed on a fresh install', N.readSuppressed().length === 0);
check('an unknown id is not suppressed', !N.isSuppressed('beat-found'));

N.suppress('beat-found');
check('suppress records the id', N.isSuppressed('beat-found'));
check('suppressing one leaves the others showing', !N.isSuppressed('read-only'));

// Suppressing twice must not grow the list — this runs on a click, and the
// obvious array-push version leaks an entry per click forever.
N.suppress('beat-found');
check('suppressing twice does not duplicate', N.readSuppressed().length === 1);

N.suppress('read-only');
check('a second id is added alongside the first', N.readSuppressed().length === 2);
check('both ids read back as suppressed', N.isSuppressed('beat-found') && N.isSuppressed('read-only'));

N.clearSuppressions();
check('clearSuppressions brings every hint back', N.readSuppressed().length === 0);

// Anything could be in storage: another build, a hand-edited value, a key
// collision. None of it may crash the component that renders on every route.
store.set(KEY, 'not json');
check('corrupt storage reads as nothing suppressed', N.readSuppressed().length === 0);
check('corrupt storage does not suppress a hint', !N.isSuppressed('beat-found'));

store.set(KEY, JSON.stringify({ 'beat-found': true }));
check('a non-array value reads as nothing suppressed', N.readSuppressed().length === 0);

store.set(KEY, JSON.stringify(['beat-found', 42, null, { id: 'read-only' }]));
check('non-string entries are dropped, valid ones kept', N.readSuppressed().length === 1);
check('the surviving entry is the valid one', N.isSuppressed('beat-found'));

// Writing over a corrupt value must recover rather than compound it.
store.set(KEY, 'not json');
N.suppress('read-only');
check('suppress recovers from corrupt storage', N.readSuppressed().length === 1 && N.isSuppressed('read-only'));

// Storage being unavailable (private mode) must fail towards showing hints,
// never towards throwing.
const realStorage = globalThis.localStorage;
globalThis.localStorage = {
  getItem() { throw new Error('denied'); },
  setItem() { throw new Error('denied'); },
  removeItem() { throw new Error('denied'); },
};
check('unavailable storage reads as nothing suppressed', N.readSuppressed().length === 0);
check('unavailable storage does not throw on suppress', (() => { try { N.suppress('beat-found'); return true; } catch { return false; } })());
check('unavailable storage does not throw on clear', (() => { try { N.clearSuppressions(); return true; } catch { return false; } })());
globalThis.localStorage = realStorage;

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
