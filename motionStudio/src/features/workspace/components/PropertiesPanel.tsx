import { MousePointer } from 'lucide-react';
import { useEditorStore } from '@/engines/editor';
import { useCanvasEngine } from '@/engines/canvas';
import type { TextElement } from '@/engines/canvas';
import { Input } from '@/components/ui/input';

/* ── shared row: label + input ── */
function PropRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-studio-text-faint w-16 shrink-0">{label}</span>
      {children}
    </div>
  );
}

/* ── compact number input ── */
function NumInput({
  value,
  onChange,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="relative flex-1">
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        className="h-7 text-[12px] bg-studio-surface border-studio-border text-studio-text rounded-studio-sm pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {unit && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-studio-text-faint pointer-events-none">
          {unit}
        </span>
      )}
    </div>
  );
}

/* ── section header ── */
function Section({ title }: { title: string }) {
  return (
    <div className="px-4 py-2 border-b border-studio-border shrink-0">
      <span className="text-[10px] font-semibold text-studio-text-faint uppercase tracking-widest">
        {title}
      </span>
    </div>
  );
}

/* ── text element properties ── */
function TextProperties({
  el,
  update,
}: {
  el: TextElement;
  update: (updates: Partial<Omit<TextElement, 'id' | 'type'>>) => void;
}) {
  return (
    <>
      {/* Text section */}
      <Section title="Text" />
      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-studio-text-faint">Content</span>
          <textarea
            value={el.content}
            onChange={(e) => update({ content: e.target.value })}
            rows={3}
            className="w-full resize-none rounded-studio-sm bg-studio-surface border border-studio-border text-[12px] text-studio-text px-2.5 py-2 placeholder:text-studio-text-faint focus:outline-none focus:border-studio-accent-border focus:ring-1 focus:ring-studio-accent transition-colors"
          />
        </div>

        <PropRow label="Font size">
          <NumInput value={el.fontSize} onChange={(v) => update({ fontSize: v })} unit="px" />
        </PropRow>

        <PropRow label="Color">
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-7 h-7 rounded-studio-sm border border-studio-border shrink-0 overflow-hidden cursor-pointer relative"
              style={{ backgroundColor: el.color }}
            >
              <input
                type="color"
                value={el.color}
                onChange={(e) => update({ color: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <Input
              value={el.color}
              onChange={(e) => update({ color: e.target.value })}
              className="h-7 text-[12px] bg-studio-surface border-studio-border text-studio-text rounded-studio-sm font-mono"
            />
          </div>
        </PropRow>
      </div>

      {/* Transform section */}
      <Section title="Transform" />
      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex gap-2">
          <PropRow label="X">
            <NumInput value={Math.round(el.x)} onChange={(v) => update({ x: v })} />
          </PropRow>
          <PropRow label="Y">
            <NumInput value={Math.round(el.y)} onChange={(v) => update({ y: v })} />
          </PropRow>
        </div>

        <div className="flex gap-2">
          <PropRow label="W">
            <NumInput value={Math.round(el.width)} onChange={(v) => update({ width: v })} />
          </PropRow>
          <PropRow label="H">
            <NumInput value={Math.round(el.height)} onChange={(v) => update({ height: v })} />
          </PropRow>
        </div>

        <PropRow label="Rotation">
          <NumInput value={Math.round(el.rotation)} onChange={(v) => update({ rotation: v })} unit="°" />
        </PropRow>

        <PropRow label="Opacity">
          <NumInput
            value={Math.round(el.opacity * 100)}
            onChange={(v) => update({ opacity: Math.min(1, Math.max(0, v / 100)) })}
            unit="%"
          />
        </PropRow>
      </div>
    </>
  );
}

/* ── main component ── */
export default function PropertiesPanel() {
  const selectedElementId  = useEditorStore((s) => s.selectedElementId);
  const { elements, updateElement } = useCanvasEngine();

  const selected = elements.find((el) => el.id === selectedElementId) ?? null;

  return (
    <div className="flex flex-col h-full bg-studio-panel overflow-hidden">
      {/* Header */}
      <div className="px-4 h-9 flex items-center border-b border-studio-border shrink-0">
        <span className="text-[11px] font-semibold text-studio-text-faint uppercase tracking-widest">
          Properties
        </span>
      </div>

      {selected === null ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2.5 px-5">
          <MousePointer className="w-5 h-5 text-studio-text-faint" strokeWidth={1.5} />
          <p className="text-[12px] text-studio-text-faint text-center leading-relaxed">
            Select an element to<br />edit its properties
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {selected.type === 'text' && (
            <TextProperties
              key={selected.id}
              el={selected}
              update={(updates) => updateElement(selected.id, updates)}
            />
          )}
        </div>
      )}
    </div>
  );
}
