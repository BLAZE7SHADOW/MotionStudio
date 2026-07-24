import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useVersionCheck } from '@/hooks/useVersionCheck';

export default function UpdateBanner() {
  const updateAvailable = useVersionCheck();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-100 flex items-center gap-3 rounded-studio-lg border border-studio-border-strong bg-studio-panel px-4 py-3 shadow-lg">
      <p className="text-[13px] text-studio-text">
        A new version of MotionStudio is available.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex items-center gap-1.5 h-7 px-3 rounded-studio-md bg-studio-accent hover:bg-studio-accent-hover text-white text-[12px] font-medium transition-colors"
      >
        <RefreshCw className="size-3.5" />
        Refresh
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        title="Dismiss"
        className="flex items-center justify-center size-7 rounded-studio-md text-studio-text-faint hover:text-studio-text hover:bg-studio-surface transition-colors"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
