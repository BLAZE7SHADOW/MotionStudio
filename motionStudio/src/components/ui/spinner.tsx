import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The one spinner. Every loading spot in the app (`AuthPanel`,
 * `DashboardPage`, `SaveIndicator`, ...) used to repeat
 * `<Loader2 className="animate-spin ..." />` independently — this exists so
 * a new loading spot has somewhere to reach for instead of another copy.
 */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className={cn('animate-spin', className)} />
      {label && <span className="text-studio-text-muted">{label}</span>}
    </span>
  );
}
