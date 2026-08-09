// Fake localStorage before importing the bundled module.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const O = await import('./projectOwner.bundle.js');
let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? ' ok ' : 'FAIL'}  ${name}`); };

const guest = (id) => ({ id, anonymous: true });
const account = (id) => ({ id, anonymous: false });
const kind = (owner, next) => O.decideTransition(owner, next).kind;

// ── The bug this module exists to prevent ─────────────────────────────────
// A guest builds a project, then signs up. Their work has no cloud copy, so
// wiping it here destroys it permanently.
check(
  'a guest signing up keeps their work',
  kind(guest('anon-1'), account('real-1')) === 'adopt',
);

// ── Signing out is not a handover ─────────────────────────────────────────
check('signing out keeps projects', kind(account('real-1'), null) === 'keep');
check('a guest signing out keeps projects', kind(guest('anon-1'), null) === 'keep');

// The owner marker outliving the session is what makes the above safe: the
// wipe still fires when someone else actually arrives.
check(
  'a different account after a sign-out still wipes',
  kind(account('real-1'), account('real-2')) === 'wipe',
);

// ── The wipe still has to work ────────────────────────────────────────────
check(
  'a different account wipes',
  kind(account('real-1'), account('real-2')) === 'wipe',
);
check(
  'a guest arriving after a real account wipes',
  kind(account('real-1'), guest('anon-9')) === 'wipe',
);

// ── Same person, no change ────────────────────────────────────────────────
check('the same account keeps', kind(account('real-1'), account('real-1')) === 'keep');
check('the same guest keeps', kind(guest('anon-1'), guest('anon-1')) === 'keep');

// ── Guest → guest ─────────────────────────────────────────────────────────
// A new anonymous id for the same person (they signed out and hit "try as
// guest" again) is indistinguishable from a second person. Adopting is the
// only option that doesn't risk destroying unrecoverable work.
check(
  'a second guest session adopts rather than destroying guest work',
  kind(guest('anon-1'), guest('anon-2')) === 'adopt',
);

// ── Fresh device ──────────────────────────────────────────────────────────
check('nothing owned locally adopts', kind(null, account('real-1')) === 'adopt');
check('nothing owned and nobody signed in keeps', kind(null, null) === 'keep');

// ── Storage round-trip ────────────────────────────────────────────────────
store.clear();
check('a fresh device has no owner', O.readOwner() === null);

O.writeOwner(account('real-1'));
check('an owner reads back', O.readOwner()?.id === 'real-1');
check('a real account is not marked anonymous', O.readOwner()?.anonymous === false);

O.writeOwner(guest('anon-1'));
check('a guest owner reads back as anonymous', O.readOwner()?.anonymous === true);

O.writeOwner(null);
check('clearing the owner removes it', O.readOwner() === null);

// A half-written marker (id present, flag missing) must not read as a guest —
// that would route a real account down the never-wipe path.
store.clear();
store.set('ms_last_user', 'real-1');
check('a missing anon flag reads as a real account', O.readOwner()?.anonymous === false);

/* …which is precisely why the caller has to rewrite the marker on every
   resolved session, not only on a change. A guest already signed in before
   this module existed has an id and no flag, so they read as a real account —
   and would be wiped on sign-up by the very code meant to protect them. The
   transition is 'keep' (same id), so only an unconditional write backfills it.
   Caught in the browser, not here: the decision was right and the persistence
   around it was wrong. */
store.clear();
store.set('ms_last_user', 'anon-1'); // legacy marker: no anon flag
const legacyGuest = { id: 'anon-1', anonymous: true };
check(
  'a legacy guest marker is a no-op transition',
  kind(O.readOwner(), legacyGuest) === 'keep',
);
O.writeOwner(legacyGuest); // what AuthBridge now does on every session
check('…and rewriting it backfills the flag', O.readOwner()?.anonymous === true);
check(
  '…so the next sign-up keeps their work',
  kind(O.readOwner(), account('real-1')) === 'adopt',
);

// ── Pending merge flag ────────────────────────────────────────────────────
check('nothing pending by default', O.takePendingMerge() === false);
O.markPendingMerge();
check('a marked merge is reported once', O.takePendingMerge() === true);
check('and is cleared after being read', O.takePendingMerge() === false);

// ── Storage unavailable (private mode) must never wipe ─────────────────────
const realStorage = globalThis.localStorage;
globalThis.localStorage = {
  getItem() { throw new Error('denied'); },
  setItem() { throw new Error('denied'); },
  removeItem() { throw new Error('denied'); },
};
check('unavailable storage reads as no owner', O.readOwner() === null);
check('unavailable storage does not throw on write', (() => {
  try { O.writeOwner(account('real-1')); return true; } catch { return false; }
})());
// No owner means no wipe — the safe direction to fail in.
check('unavailable storage never wipes', kind(O.readOwner(), account('real-2')) === 'adopt');
globalThis.localStorage = realStorage;

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
