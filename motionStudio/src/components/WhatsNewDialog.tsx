import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RELEASES } from '@/content/releases';
import type { ReleaseChangeKind } from '@/content/releases';

const KIND_STYLE: Record<ReleaseChangeKind, string> = {
  new: 'bg-studio-accent-subtle text-studio-accent border-studio-accent-border',
  improved: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  fixed: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
};

const KIND_LABEL: Record<ReleaseChangeKind, string> = {
  new: 'New',
  improved: 'Better',
  fixed: 'Fixed',
};

/**
 * What changed recently, in the user's terms.
 *
 * Opens by itself once per release for people who were already using the app,
 * and is reachable any time from the help menu (?). First-time users never see
 * it — a changelog is meaningless before you have a "before".
 */
export default function WhatsNewDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-140 bg-studio-panel border-studio-border-strong rounded-studio-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-studio-border">
          <DialogTitle className="text-[15px] font-semibold text-studio-text">
            What's new
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 flex flex-col gap-6">
          {RELEASES.map((release) => (
            <div key={release.id} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-[13px] font-medium text-studio-text">{release.title}</h3>
                <span className="text-[11px] font-mono text-studio-text-faint">{release.id}</span>
              </div>

              <ul className="flex flex-col gap-2.5">
                {release.changes.map((change) => (
                  <li key={change.text} className="flex items-start gap-2.5">
                    <span
                      className={`shrink-0 mt-px text-[9px] font-semibold uppercase tracking-wider px-1.5 py-px rounded-studio-sm border ${KIND_STYLE[change.kind]}`}
                    >
                      {KIND_LABEL[change.kind]}
                    </span>
                    <span className="text-[12px] text-studio-text-muted leading-relaxed">
                      {change.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-studio-border bg-studio-bg/40">
          <p className="text-[11px] text-studio-text-faint">
            Something broken or missing? Use <strong className="font-medium">Send
            feedback</strong> under the <strong className="font-medium">?</strong>{' '}
            menu — it reaches a human.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
