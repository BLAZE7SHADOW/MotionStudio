import { create } from 'zustand';

/**
 * Which assets are being uploaded right now.
 *
 * Deliberately *not* on the `Asset`. That object is persisted, so a tab closed
 * mid-upload would write `uploading: true` to storage and strand it there
 * forever — a permanent spinner on a file nothing is working on. In-flight is a
 * property of this session, so it lives in a session-only store and disappears
 * with the tab, which is the correct behaviour rather than a compromise.
 *
 * The persisted fields answer the durable question ("is there a cloud copy?");
 * this answers the live one ("is something happening?"). The tile needs both.
 */

/** How long a finished upload keeps saying so before the tile goes quiet. */
const SETTLED_MS = 2_500;

type Status = 'uploading' | 'done';

interface UploadStatusState {
  status: Record<string, Status>;
  begin: (assetId: string) => void;
  settle: (assetId: string) => void;
  clear: (assetId: string) => void;
}

export const useUploadStatus = create<UploadStatusState>((set) => ({
  status: {},
  begin: (assetId) =>
    set((s) => ({ status: { ...s.status, [assetId]: 'uploading' } })),
  settle: (assetId) => {
    set((s) => ({ status: { ...s.status, [assetId]: 'done' } }));
    /* Clears itself. SaveIndicator's rule is that a tick on settled work is
       noise and colour belongs to live state — the confirmation is worth
       showing at the moment it happens and not after. Failures are the ones
       that persist, because they need acting on. */
    setTimeout(() => {
      set((s) => {
        if (s.status[assetId] !== 'done') return s; // a later upload took over
        const { [assetId]: _gone, ...rest } = s.status;
        return { status: rest };
      });
    }, SETTLED_MS);
  },
  clear: (assetId) =>
    set((s) => {
      const { [assetId]: _gone, ...rest } = s.status;
      return { status: rest };
    }),
}));

/** Non-reactive read, for callers outside React. */
export function isUploading(assetId: string): boolean {
  return useUploadStatus.getState().status[assetId] === 'uploading';
}
