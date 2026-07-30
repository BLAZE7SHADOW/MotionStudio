import { useCallback, useEffect, useRef, useState } from 'react';
import { showNotice } from '@/lib/noticeStore';
import {
  claim,
  holder,
  isLockable,
  release,
  setReadOnly,
  startHeartbeat,
  subscribe,
} from '@/lib/projectLock';

export type LockStatus =
  /** We hold it. Normal editing. */
  | 'owner'
  /** Another live tab holds it and we haven't asked the user yet. */
  | 'blocked'
  /** The user chose to look without touching, or was taken over. */
  | 'readonly';

/**
 * Claims the editing lock for a project, and keeps it.
 *
 * Deliberately starts in `blocked` rather than optimistically claiming: the
 * whole point is that the second tab must not write anything before the user
 * has decided, and an optimistic claim is a write.
 */
export function useProjectLock(projectId: string) {
  const [status, setStatus] = useState<LockStatus>(() => {
    // Without storage there is no guard to give, and refusing to open the
    // editor would be a worse failure than the one we're preventing.
    if (!isLockable()) return 'owner';
    if (holder(projectId) === 'other') return 'blocked';
    claim(projectId);
    return 'owner';
  });

  /* The store reads this synchronously on every mutation, so it has to track
     status rather than be set from an event handler. */
  useEffect(() => {
    setReadOnly(projectId, status !== 'owner');
    return () => setReadOnly(projectId, false);
  }, [projectId, status]);

  /* Hold the claim while we own it, and drop it on the way out so the next
     tab doesn't have to wait out the staleness window. */
  useEffect(() => {
    if (status !== 'owner') return;
    /* Re-assert on every run of this effect, not just in the `useState`
       initialiser. StrictMode mounts → cleans up → mounts, and the cleanup
       below releases, so without this the tab settles into believing it owns a
       project it has actually let go of. */
    claim(projectId);
    const stop = startHeartbeat(projectId);
    const drop = () => release(projectId);
    window.addEventListener('pagehide', drop);
    return () => {
      stop();
      window.removeEventListener('pagehide', drop);
      drop();
    };
  }, [projectId, status]);

  /* Being taken over is the case that makes "take over" safe to offer: the
     losing tab finds out immediately instead of continuing to edit into a
     void. */
  useEffect(() => {
    return subscribe(projectId, () => {
      setStatus((prev) => {
        if (prev === 'owner' && holder(projectId) === 'other') return 'readonly';
        // A tab that released cleanly leaves the project free; a read-only tab
        // can then quietly promote itself rather than stranding the user.
        if (prev === 'readonly' && holder(projectId) === 'nobody') {
          claim(projectId);
          return 'owner';
        }
        return prev;
      });
    });
  }, [projectId]);

  /* Say it out loud when editing is taken away or handed back.
     The gate dialog only covers arriving at a project that is already open;
     these two transitions happen *while* you are working, and silently going
     read-only mid-edit is exactly the confusion the lock was built to prevent.
     Not suppressible — this describes a live state, not a tip. */
  const prevStatus = useRef<LockStatus | null>(null);
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;
    if (prev === null) return; // first render is arrival, which the gate owns
    if (prev === 'owner' && status === 'readonly') {
      showNotice({
        id: 'read-only',
        message: 'Another tab took over this project. You can keep looking, but changes here won’t be saved.',
      });
    } else if (prev === 'readonly' && status === 'owner') {
      showNotice({
        id: 'read-only',
        message: 'The other tab let go — you can edit this project again.',
        timeoutMs: 6_000,
      });
    }
  }, [status]);

  const takeOver = useCallback(() => {
    claim(projectId);
    setStatus('owner');
  }, [projectId]);

  const openReadOnly = useCallback(() => setStatus('readonly'), []);

  return { status, takeOver, openReadOnly };
}
