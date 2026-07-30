import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useNoticeStore } from '@/lib/noticeStore';

/**
 * Renders the current contextual hint.
 *
 * Styling deliberately copies `UpdateBanner` rather than introducing a second
 * banner language: both are the app speaking to you at the bottom of the
 * screen, and two different-looking versions of that would read as two
 * different systems. They share a stack in `App.tsx` so they can never overlap.
 */
export default function NoticeHost() {
  const notice = useNoticeStore((s) => s.current);
  const dismiss = useNoticeStore((s) => s.dismiss);
  const dismissForever = useNoticeStore((s) => s.dismissForever);

  const seq = useNoticeStore((s) => s.seq);
  const timeoutMs = notice?.timeoutMs ?? 0;

  // Keyed on `seq`, not the id: two notices can share an id, and keying on the
  // id would hand the second one the remains of the first one's timer.
  useEffect(() => {
    if (timeoutMs <= 0) return;
    const timer = setTimeout(() => useNoticeStore.getState().dismiss(), timeoutMs);
    return () => clearTimeout(timer);
  }, [seq, timeoutMs]);

  if (!notice) return null;

  return (
    <div
      role="status"
      className="pointer-events-auto flex items-start gap-3 rounded-studio-lg border border-studio-border-strong bg-studio-panel px-4 py-3 shadow-lg max-w-[min(30rem,calc(100vw-2rem))]"
    >
      <p className="text-[13px] leading-relaxed text-studio-text">{notice.message}</p>

      {notice.suppressible && (
        <button
          type="button"
          onClick={dismissForever}
          className="shrink-0 h-7 px-2 rounded-studio-md text-[10px] font-semibold uppercase tracking-widest text-studio-text-faint hover:text-studio-text hover:bg-studio-surface transition-colors"
        >
          Don't show again
        </button>
      )}

      <button
        type="button"
        onClick={dismiss}
        title="Dismiss"
        aria-label="Dismiss"
        className="shrink-0 flex items-center justify-center size-7 rounded-studio-md text-studio-text-faint hover:text-studio-text hover:bg-studio-surface transition-colors"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
