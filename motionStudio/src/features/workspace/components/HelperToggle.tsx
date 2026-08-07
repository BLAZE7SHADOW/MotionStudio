import { useId } from 'react';
import { Lightbulb } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useHelperMode } from '@/lib/helperMode';
import { track } from '@/lib/analytics';

/**
 * The switch for helper mode.
 *
 * It earns a permanent toolbar slot — rather than living only in the ? menu —
 * because it is a *mode*, and a mode you cannot see the state of is a mode you
 * will wonder about. On means hovering an explainable control shows its
 * card; off means it doesn't. The ? menu mirrors it for anyone who goes
 * looking for help where help usually is.
 *
 * A labelled switch, not an icon whose color you have to learn — an icon
 * button here (bare or tinted) reads as "a thing you can click", not
 * "currently on"; the on/off has to be legible at a glance without hovering
 * for a tooltip first.
 *
 * The label is a real `<label htmlFor>`, not a click handler on a wrapping
 * `<div>`. `Switch` renders an actual `<button>` internally, so a `<div
 * onClick>` around both would double-fire — once from the div, once from the
 * switch's own `onCheckedChange` — cancelling itself out on a direct click
 * and only working when you happen to click the text. `<label>` forwarding
 * to the switch's `id` is the one click path, native and keyboard-safe.
 */
export default function HelperToggle() {
  const on = useHelperMode((s) => s.on);
  const setOn = useHelperMode((s) => s.setOn);
  const id = useId();

  function toggle(next: boolean) {
    track.helperModeToggled({ on: next });
    setOn(next);
  }

  return (
    <div className="flex items-center gap-1.5 h-7 px-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 cursor-pointer select-none">
        <Lightbulb className={`w-3.5 h-3.5 ${on ? 'text-studio-accent' : 'text-studio-text-faint'}`} />
        <span className={`text-[11px] font-medium ${on ? 'text-studio-text' : 'text-studio-text-muted'}`}>
          Helper mode
        </span>
      </label>
      <Switch id={id} checked={on} onCheckedChange={toggle} />
    </div>
  );
}
