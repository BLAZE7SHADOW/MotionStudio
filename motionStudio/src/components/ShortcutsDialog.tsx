import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SHORTCUT_GROUPS, modKeyLabel } from '@/features/workspace/shortcuts';

/**
 * The keyboard and modifier gestures, in one list.
 *
 * Worth a dialog rather than tooltips: the gestures that save the most time —
 * Shift to move a number in tens, Alt to defeat beat snapping — are invisible
 * by nature, because they change what an existing drag means rather than
 * adding a control you could notice.
 */
export default function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const mod = modKeyLabel();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-120 bg-studio-panel border-studio-border-strong rounded-studio-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-studio-border">
          <DialogTitle className="text-[15px] font-semibold text-studio-text">
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title} className="flex flex-col gap-1.5">
              <h3 className="text-[10px] font-semibold text-studio-text-faint uppercase tracking-widest">
                {group.title}
              </h3>
              {group.shortcuts.map((s) => (
                <div key={s.what + s.keys.join()} className="flex items-center gap-3 py-1">
                  <span className="flex items-center gap-1 shrink-0">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="min-w-6 h-6 px-1.5 flex items-center justify-center rounded-studio-xs border border-studio-border bg-studio-surface text-[11px] font-medium text-studio-text-muted"
                      >
                        {k === 'mod' ? mod : k}
                      </kbd>
                    ))}
                  </span>
                  <span className="text-[12px] text-studio-text-muted">{s.what}</span>
                </div>
              ))}
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
