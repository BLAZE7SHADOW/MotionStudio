import { MousePointer, Plus, X } from 'lucide-react';
import { useEditorStore } from '@/engines/editor';
import { useCanvasEngine } from '@/engines/canvas';
import { ANIMATION_PRESETS, defaultAnimationFor } from '@/engines/animation';
import type { TextElement, AudioElement, BaseElement, ElementPatch } from '@/engines/canvas';
import type { Animation, AnimationProperty, AnimationEasing } from '@/engines/project';
import { Input } from '@/components/ui/input';

type Update = (patch: ElementPatch) => void;

const PROPERTY_LABELS: Record<AnimationProperty, string> = {
  opacity: 'Opacity',
  x: 'Position X',
  y: 'Position Y',
  scale: 'Scale',
  rotate: 'Rotate',
};

const EASINGS: AnimationEasing[] = ['linear', 'ease', 'spring'];

/* ── shared row: label + input ── */
function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-studio-text-faint w-16 shrink-0">{label}</span>
      {children}
    </div>
  );
}

/* ── compact number input ── */
function NumInput({
  value, onChange, unit,
}: {
  value: number; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div className="relative flex-1">
      <Input
        type="number"
        value={value}
        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
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

/* ── compact labelled number (animation cards) ── */
function MiniNum({
  label, value, onChange, unit, step,
}: {
  label: string; value: number; onChange: (v: number) => void; unit?: string; step?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-studio-text-faint w-8 shrink-0">{label}</span>
      <div className="relative flex-1">
        <Input
          type="number"
          step={step}
          value={value}
          onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
          className="h-7 text-[12px] bg-studio-surface border-studio-border text-studio-text rounded-studio-sm pr-5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {unit && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-studio-text-faint pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── one animation card ── */
function AnimationRow({
  anim, onChange, onRemove,
}: {
  anim: Animation; onChange: (patch: Partial<Animation>) => void; onRemove: () => void;
}) {
  return (
    <div className="rounded-studio-md border border-studio-border bg-studio-surface/40 p-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-studio-text">{PROPERTY_LABELS[anim.property]}</span>
        <div className="flex items-center gap-1.5">
          <select
            value={anim.easing}
            onChange={(e) => onChange({ easing: e.target.value as AnimationEasing })}
            className="h-6 text-[10px] bg-studio-surface border border-studio-border rounded-studio-xs text-studio-text-muted px-1.5 focus:outline-none focus:border-studio-accent-border"
          >
            {EASINGS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <button
            type="button"
            onClick={onRemove}
            title="Remove animation"
            className="w-6 h-6 flex items-center justify-center rounded-studio-xs text-studio-text-faint hover:text-studio-text hover:bg-studio-surface transition-colors duration-120"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MiniNum label="From" value={anim.from} onChange={(v) => onChange({ from: v })} step={0.1} />
        <MiniNum label="To"   value={anim.to}   onChange={(v) => onChange({ to: v })}   step={0.1} />
        <MiniNum label="Start" value={anim.startOffset} onChange={(v) => onChange({ startOffset: Math.max(0, Math.round(v)) })} unit="f" />
        <MiniNum label="Dur"   value={anim.duration}    onChange={(v) => onChange({ duration: Math.max(1, Math.round(v)) })}    unit="f" />
      </div>
    </div>
  );
}

/* ── shared: transform (any visual element) ── */
function TransformSection({ el, update }: { el: BaseElement; update: Update }) {
  return (
    <>
      <Section title="Transform" />
      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex gap-2">
          <PropRow label="X"><NumInput value={Math.round(el.x)} onChange={(v) => update({ x: v })} /></PropRow>
          <PropRow label="Y"><NumInput value={Math.round(el.y)} onChange={(v) => update({ y: v })} /></PropRow>
        </div>
        <div className="flex gap-2">
          <PropRow label="W"><NumInput value={Math.round(el.width)} onChange={(v) => update({ width: v })} /></PropRow>
          <PropRow label="H"><NumInput value={Math.round(el.height)} onChange={(v) => update({ height: v })} /></PropRow>
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

/* ── shared: animation stack (any element) ── */
function AnimationSection({ el, update }: { el: BaseElement; update: Update }) {
  const anims = el.animations ?? [];
  return (
    <>
      <Section title="Animation" />
      <div className="flex flex-col gap-2.5 px-4 py-3">
        {anims.length > 0 && (
          <div className="flex flex-col gap-2">
            {anims.map((anim, i) => (
              <AnimationRow
                key={i}
                anim={anim}
                onChange={(patch) =>
                  update({ animations: anims.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) })
                }
                onRemove={() => update({ animations: anims.filter((_, idx) => idx !== i) })}
              />
            ))}
          </div>
        )}

        {(['enter', 'exit'] as const).map((kind) => (
          <div key={kind} className="flex flex-col gap-1.5">
            <span className="text-[10px] text-studio-text-faint uppercase tracking-wider">
              {kind === 'enter' ? 'Enter' : 'Exit'}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {ANIMATION_PRESETS.filter((p) => p.kind === kind).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => update({ animations: [...anims, ...preset.build(el.durationInFrames)] })}
                  className="flex items-center justify-center gap-1.5 h-8 px-2 rounded-studio-md bg-studio-surface border border-studio-border text-[11px] font-medium text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong transition-colors duration-120"
                >
                  <Plus className="w-3 h-3" />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <select
          value=""
          onChange={(e) => {
            const prop = e.target.value as AnimationProperty;
            if (!prop) return;
            update({ animations: [...anims, defaultAnimationFor(prop)] });
          }}
          className="h-8 text-[11px] bg-studio-surface border border-studio-border rounded-studio-md text-studio-text-muted px-2 focus:outline-none focus:border-studio-accent-border"
        >
          <option value="" disabled>＋ Add property…</option>
          {(Object.keys(PROPERTY_LABELS) as AnimationProperty[]).map((p) => (
            <option key={p} value={p}>{PROPERTY_LABELS[p]}</option>
          ))}
        </select>

        {anims.length > 0 && (
          <button
            type="button"
            onClick={() => update({ animations: undefined })}
            className="h-7 rounded-studio-md text-[11px] font-medium text-studio-text-faint hover:text-studio-text border border-studio-border hover:border-studio-border-strong transition-colors duration-120"
          >
            Clear all
          </button>
        )}

        <p className="text-[10px] text-studio-text-faint leading-relaxed">
          Set Start / Dur on each card to sequence effects. Press play to preview.
        </p>
      </div>
    </>
  );
}

/* ── text: type-specific + shared sections ── */
function TextProperties({ el, update }: { el: TextElement; update: Update }) {
  return (
    <>
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

      <TransformSection el={el} update={update} />
      <AnimationSection el={el} update={update} />
    </>
  );
}

/* ── image / video: shared sections only ── */
function MediaProperties({ el, update }: { el: BaseElement; update: Update }) {
  return (
    <>
      <TransformSection el={el} update={update} />
      <AnimationSection el={el} update={update} />
    </>
  );
}

/* ── audio: no canvas presence, just sound ── */
function AudioProperties({ el, update }: { el: AudioElement; update: Update }) {
  return (
    <>
      <Section title="Sound" />
      <div className="flex flex-col gap-3 px-4 py-3">
        <PropRow label="Volume">
          <NumInput
            value={Math.round((el.volume ?? 1) * 100)}
            onChange={(v) => update({ volume: Math.min(1, Math.max(0, v / 100)) })}
            unit="%"
          />
        </PropRow>
        <p className="text-[10px] text-studio-text-faint leading-relaxed">
          Trim and position this clip on the timeline.
        </p>
      </div>
    </>
  );
}

/* ── main component ── */
export default function PropertiesPanel() {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const { elements, updateElement } = useCanvasEngine();

  const selected = elements.find((el) => el.id === selectedElementId) ?? null;

  return (
    <div className="flex flex-col h-full bg-studio-panel overflow-hidden">
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
            <TextProperties key={selected.id} el={selected} update={(u) => updateElement(selected.id, u)} />
          )}
          {(selected.type === 'image' || selected.type === 'video') && (
            <MediaProperties key={selected.id} el={selected} update={(u) => updateElement(selected.id, u)} />
          )}
          {selected.type === 'audio' && (
            <AudioProperties key={selected.id} el={selected} update={(u) => updateElement(selected.id, u)} />
          )}
        </div>
      )}
    </div>
  );
}
