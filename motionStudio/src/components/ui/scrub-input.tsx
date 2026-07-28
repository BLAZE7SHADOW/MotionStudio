import { useRef, useState } from 'react';

/**
 * A number field you can drag.
 *
 * Every numeric control in the editor was a plain `<input type="number">`:
 * to nudge an element 10px right you had to click into the field, select the
 * text, and type a new number. For a spatial tool that is the wrong primitive —
 * the value is a quantity you want to *feel*, not a string you want to author.
 *
 * So the whole row is a drag surface. Press and move horizontally to scrub;
 * release without moving and it focuses for typing, because the keyboard is
 * still the right answer when you know the exact number you want.
 *
 * The gesture is printed on the control itself rather than hidden in a tooltip
 * or a tour step. A hint you have to hover to discover doesn't help the person
 * who never suspected there was anything to discover.
 */

/** Movement below this reads as a click, not a drag. Trackpads jitter. */
const CLICK_SLOP_PX = 3;

interface ScrubInputProps {
  value: number;
  onChange: (v: number) => void;
  /** Value change per pixel dragged. Also the typing step. */
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  /** Decimals to display. Defaults to what `step` implies. */
  precision?: number;
  /** Hides the DRAG chip where space is tight (e.g. paired X/Y fields). */
  hideHint?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function ScrubInput({
  value,
  onChange,
  step = 1,
  min,
  max,
  unit,
  precision,
  hideHint,
  className = '',
  'aria-label': ariaLabel,
}: ScrubInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [typing, setTyping] = useState(false);
  /** What's in the box while typing — lets the field hold "-" or "1." mid-edit. */
  const [draft, setDraft] = useState('');

  const decimals = precision ?? (step < 1 ? String(step).split('.')[1]?.length ?? 1 : 0);
  const clamp = (v: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));

  /* Drag state lives in a ref, not state: it changes on every pointermove and
     re-rendering the panel at pointer frequency is exactly the jank we're
     trying to remove. */
  const drag = useRef({ startX: 0, startValue: 0, moved: 0 });

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Let the input handle its own clicks once it's already focused.
    if (typing) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { startX: e.clientX, startValue: value, moved: 0 };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    if (drag.current.moved < CLICK_SLOP_PX) return;
    // Shift is the coarse modifier in every design tool worth copying.
    const perPx = step * (e.shiftKey ? 10 : 1);
    onChange(clamp(drag.current.startValue + dx * perPx));
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setDragging(false);
    // Never moved → the user meant to click into the field and type.
    if (drag.current.moved < CLICK_SLOP_PX) {
      setDraft(String(round(value, decimals)));
      setTyping(true);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }

  function commit() {
    const parsed = parseFloat(draft);
    if (!Number.isNaN(parsed)) onChange(clamp(parsed));
    setTyping(false);
  }

  /* A filled track only makes sense when the value has ends. Unbounded
     quantities like X or rotation get no fill rather than a meaningless one. */
  const hasRange = min !== undefined && max !== undefined && max > min;
  const fillPct = hasRange ? ((clamp(value) - min) / (max - min)) * 100 : 0;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={[
        'group relative flex-1 h-7 flex items-center rounded-studio-sm border overflow-hidden',
        'bg-studio-surface border-studio-border transition-colors duration-120',
        typing ? 'border-studio-accent-border' : 'hover:border-studio-border-strong',
        dragging ? 'cursor-ew-resize select-none' : typing ? 'cursor-text' : 'cursor-ew-resize',
        className,
      ].join(' ')}
      style={{ touchAction: 'none' }}
    >
      {hasRange && (
        <div
          className="absolute inset-y-0 left-0 bg-studio-border/60 pointer-events-none"
          style={{ width: `${fillPct}%` }}
        />
      )}

      {typing ? (
        <input
          ref={inputRef}
          type="number"
          step={step}
          value={draft}
          aria-label={ariaLabel}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setTyping(false);
          }}
          autoFocus
          className="relative w-full h-full bg-transparent px-2 text-[12px] text-studio-text outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <>
          {/* The hint occupies the same row as the value, so revealing it on
              hover doesn't reflow anything. */}
          {!hideHint && (
            <span className="relative ml-2 text-[9px] font-medium tracking-wider text-studio-text-faint bg-studio-bg/60 px-1 py-px rounded-studio-xs opacity-0 group-hover:opacity-100 transition-opacity duration-120 pointer-events-none select-none">
              DRAG
            </span>
          )}
          <span
            aria-label={ariaLabel}
            className="relative ml-auto mr-2 text-[12px] text-studio-text tabular-nums select-none"
          >
            {round(value, decimals)}
            {unit && <span className="text-studio-text-faint ml-px">{unit}</span>}
          </span>
        </>
      )}
    </div>
  );
}

function round(v: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}
