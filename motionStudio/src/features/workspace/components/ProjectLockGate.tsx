import { useNavigate } from 'react-router-dom';
import { Eye, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LockStatus } from '../hooks/useProjectLock';

/**
 * What the user sees when a project is already open somewhere else.
 *
 * Two states, and the difference matters. `blocked` is a decision point and
 * blocks the editor outright — nothing has been written yet and nothing will
 * be until the user chooses. `readonly` is a persistent, non-modal reminder,
 * because by then they have either chosen to look without touching or been
 * taken over, and a dialog they cannot dismiss would just be in the way.
 */
export default function ProjectLockGate({
  status,
  onTakeOver,
  onOpenReadOnly,
}: {
  status: LockStatus;
  onTakeOver: () => void;
  onOpenReadOnly: () => void;
}) {
  const navigate = useNavigate();

  if (status === 'owner') return null;

  if (status === 'readonly') {
    return (
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-3 py-1.5 rounded-studio-md bg-studio-panel border border-studio-border-strong shadow-studio-lg pointer-events-auto">
        <Eye className="w-3.5 h-3.5 text-studio-text-faint shrink-0" />
        <span className="text-[12px] text-studio-text-muted">
          Read-only — this project is open in another tab.
        </span>
        <button
          type="button"
          onClick={onTakeOver}
          className="text-[12px] font-medium text-studio-text hover:underline"
        >
          Edit here
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-studio-bg/80 backdrop-blur-sm">
      <div className="w-90 rounded-studio-xl bg-studio-panel border border-studio-border-strong shadow-studio-lg overflow-hidden">
        <div className="px-5 pt-5 pb-4 flex flex-col gap-2.5">
          <div className="w-9 h-9 rounded-full bg-studio-surface border border-studio-border flex items-center justify-center">
            <MonitorSmartphone className="w-4 h-4 text-studio-text-muted" />
          </div>
          <h2 className="text-[15px] font-semibold text-studio-text">
            This project is open in another tab
          </h2>
          <p className="text-[12px] text-studio-text-muted leading-relaxed">
            Editing it in two places at once would make one of them silently
            overwrite the other. Take over here and the other tab switches to
            read-only.
          </p>
        </div>

        <div className="px-5 py-4 border-t border-studio-border bg-studio-bg/40 flex items-center gap-2">
          <Button
            size="sm"
            onClick={onTakeOver}
            className="h-8 px-4 text-[13px] bg-studio-accent hover:bg-studio-accent-hover text-white rounded-studio-md"
          >
            Take over here
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenReadOnly}
            className="h-8 px-3 text-[13px] text-studio-text-muted hover:text-studio-text hover:bg-studio-surface rounded-studio-md"
          >
            Open read-only
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="h-8 px-3 text-[13px] ml-auto text-studio-text-faint hover:text-studio-text hover:bg-studio-surface rounded-studio-md"
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
