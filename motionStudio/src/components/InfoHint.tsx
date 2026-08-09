import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { HELP, type HelpId } from '@/content/help';
import { cn } from '@/lib/utils';

/**
 * A small, static, always-there way to learn what a control does —
 * deliberately lighter than Helper Mode's `HelperCard`: no border flash on
 * the control itself, no chips, no "more", just the short `title`/`line`
 * pair from the same `content/help.ts` catalog Helper Mode reads. Helper
 * Mode is proactive (opens on hovering the control) and off by default;
 * this is passive (opens only on hovering this icon) and always on, so
 * there's still a way to ask "what is this" without turning anything on.
 */
export default function InfoHint({ id, className }: { id: HelpId; className?: string }) {
  const entry = HELP[id];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={`About: ${entry.title}`}
          className={cn(
            'inline-flex items-center justify-center text-studio-text-faint hover:text-studio-text-muted transition-colors cursor-help',
            className,
          )}
        >
          <Info className="w-3 h-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px] text-left">
        <p className="font-semibold text-studio-text">{entry.title}</p>
        <p className="text-studio-text-faint mt-0.5">{entry.line}</p>
      </TooltipContent>
    </Tooltip>
  );
}
