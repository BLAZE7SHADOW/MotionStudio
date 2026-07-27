import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Plus, X, Loader2 } from 'lucide-react';
import { STEPS, useQuickDemo } from './gettingStarted';

/**
 * A condensed version of the first-run guidance, shown while the dashboard is
 * still sparse.
 *
 * Two or three cards in a wide grid reads as abandoned rather than new, and
 * that's exactly the point where someone is still learning the flow — or coming
 * back after a fortnight having forgotten it. It's deliberately not the full
 * empty state: next to real projects, a hero-sized onboarding block would talk
 * over the thing the user actually came for.
 *
 * Dismissible, because someone with four projects who knows the app shouldn't
 * have to keep scrolling past it. It also retires on its own at five.
 */
const DISMISS_KEY = 'ms_dashboard_getting_started_dismissed';

/** Below this many projects the dashboard still looks empty enough to need it. */
export const GETTING_STARTED_THRESHOLD = 5;

export default function GettingStartedStrip() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === '1',
  );
  const { demo, creating, start } = useQuickDemo();

  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // private mode — it just comes back next session, which is harmless
    }
  }

  return (
    <section className="mt-10 rounded-studio-lg border border-studio-border bg-studio-panel/60 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[13px] font-medium text-studio-text">
            Making a video, in three steps
          </h3>
          <p className="text-[12px] text-studio-text-muted">
            A quick refresher — this goes away once you have a few projects.
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss getting started"
          className="shrink-0 w-6 h-6 rounded-studio-sm flex items-center justify-center text-studio-text-faint hover:text-studio-text hover:bg-studio-surface transition-colors duration-120"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-studio-md bg-studio-surface flex items-center justify-center shrink-0">
              <step.icon className="w-3.5 h-3.5 text-studio-text-muted" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-[12px] font-medium text-studio-text">
                <span className="font-mono text-studio-text-faint mr-1.5">0{i + 1}</span>
                {step.title}
              </p>
              <p className="text-[11px] text-studio-text-muted leading-relaxed">
                {step.short}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-studio-border">
        <Button
          size="sm"
          onClick={start}
          disabled={creating || !demo}
          className="gap-1.5 h-7 px-3 text-[12px] bg-studio-surface border border-studio-border text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong rounded-studio-md"
        >
          {creating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Zap className="w-3 h-3" />
          )}
          {creating ? 'Opening…' : 'Open a demo project'}
        </Button>
        <span className="text-[11px] text-studio-text-faint">
          or start a new one with <Plus className="w-3 h-3 inline -mt-px" /> New Project above
        </span>
      </div>
    </section>
  );
}
