import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipHint } from '@/components/ui/tooltip';
import { useHelperMode } from '@/lib/helperMode';
import { track } from '@/lib/analytics';

/**
 * The switch for the helper dots.
 *
 * It earns a permanent toolbar slot — rather than living only in the ? menu —
 * because it is a *mode*, and a mode you cannot see the state of is a mode you
 * will wonder about. Lit means the dots are out; unlit means they aren't. The ?
 * menu mirrors it for anyone who goes looking for help where help usually is.
 */
export default function HelperToggle() {
  const on = useHelperMode((s) => s.on);
  const setOn = useHelperMode((s) => s.setOn);

  return (
    <TooltipHint label={on ? 'Hide the helper dots' : 'Show the helper dots'}>
      <Button
        variant="ghost"
        size="icon"
        aria-pressed={on}
        onClick={() => {
          track.helperModeToggled({ on: !on });
          setOn(!on);
        }}
        className={[
          'w-7 h-7 rounded-studio-md transition-colors duration-120',
          on
            ? 'text-studio-accent bg-studio-accent-subtle hover:bg-studio-accent-subtle'
            : 'text-studio-text-muted hover:text-studio-text hover:bg-studio-surface',
        ].join(' ')}
      >
        <Lightbulb className="w-3.75 h-3.75" />
      </Button>
    </TooltipHint>
  );
}
