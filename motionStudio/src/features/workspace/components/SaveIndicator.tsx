import { useEffect, useState } from 'react';
import { CloudOff, CloudAlert, Check, RefreshCw } from 'lucide-react';
import { useSaveState, describeLastSaved } from '@/lib/saveState';

/**
 * Whether your work has reached the cloud.
 *
 * Permanently in the toolbar rather than a toast, because the question it
 * answers — *is my work safe?* — is one you ask at an arbitrary moment, not one
 * the app can predict. Ultramock keeps its quota visible for the same reason.
 *
 * Nothing is drawn while everything is fine and nothing has been saved yet:
 * a green tick on an untouched project is noise, and the accent-colour rule
 * reserves colour for live state.
 */
export default function SaveIndicator() {
  const status = useSaveState((s) => s.status);
  const lastSavedAt = useSaveState((s) => s.lastSavedAt);
  const error = useSaveState((s) => s.error);

  /* "just now" goes stale silently. A minute tick is enough — the label's own
     resolution is minutes, so anything faster redraws the same string. */
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (status !== 'saved') return;
    const id = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [status]);

  if (status === 'idle') return null;

  /* Fixed width, not just fixed height. This sits first in a right-aligned
     `ml-auto` row (Toolbar.tsx) ahead of Helper Mode, the `?` menu, Preview
     and Export — every one of those shifts sideways whenever this element's
     own width changes, which it did on every status change *and* on the
     60-second timer above that only redraws "3 minutes ago" into "4 minutes
     ago". `min-w` sized to the longest label ("Offline — saved on this
     device") makes the box a stable size once mounted; shorter labels just
     leave trailing space inside it rather than resizing it. The one shift
     this doesn't remove is the first one — idle renders nothing, so the very
     first save still inserts a new element into the row. Reserving that
     space permanently while nothing has been saved yet would be its own
     regression (see the doc comment above: a badge with nothing to report is
     noise), so that single appearance is left as the one deliberate
     exception. */
  const base =
    'flex items-center gap-1.5 h-7 px-2 rounded-studio-md text-[11px] font-medium select-none min-w-[190px] justify-start';

  if (status === 'saving') {
    return (
      <span className={`${base} text-studio-text-faint`} title="Saving to the cloud">
        <RefreshCw className="w-3 h-3 animate-spin" />
        Saving…
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span className={`${base} text-studio-text-faint`} title="Your work is saved to the cloud">
        <Check className="w-3 h-3" />
        Saved {describeLastSaved(lastSavedAt)}
      </span>
    );
  }

  if (status === 'offline') {
    /* Deliberately not alarming. Local persistence is a separate path and keeps
       working, so the work is not lost — and a user who believes it is will do
       something drastic to recover it. */
    return (
      <span
        className={`${base} text-amber-300/90`}
        title="Changes are kept on this device and will sync when you reconnect"
      >
        <CloudOff className="w-3 h-3" />
        Offline — saved on this device
      </span>
    );
  }

  return (
    <span className={`${base} text-amber-300/90`} title={error ?? 'The server refused the save'}>
      <CloudAlert className="w-3 h-3" />
      Couldn’t save to the cloud
    </span>
  );
}
