import { Clapperboard, Loader2 } from 'lucide-react';

/**
 * The full-page loading screen — sign-in resolving, cloud projects
 * fetching. Uses the same logo mark as the landing page nav and the
 * editor's toolbar (`Clapperboard` in an accent box + the wordmark), just
 * larger, so a loading screen still reads as MotionStudio rather than a
 * generic spinner any app could show.
 */
export function BrandedLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-14 h-14 rounded-studio-lg bg-studio-accent flex items-center justify-center animate-pulse">
        <Clapperboard className="w-7 h-7 text-white" />
      </div>
      <span
        style={{ fontFamily: 'var(--font-display)' }}
        className="text-[22px] font-semibold tracking-tight text-studio-text"
      >
        Motion<span className="text-studio-accent">Studio</span>
      </span>
      {label && (
        <span className="flex items-center gap-2 text-[13px] text-studio-text-muted">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {label}
        </span>
      )}
    </div>
  );
}
