import { MousePointer, Plus, X, ChevronsUp, ChevronUp, ChevronDown, ChevronsDown, Sparkles, Maximize2 } from 'lucide-react';
import { useEditorStore } from '@/engines/editor';
import { useCanvasEngine } from '@/engines/canvas';
import { ANIMATION_PRESETS, defaultAnimationFor } from '@/engines/animation';
import type { TextElement, AudioElement, ShaderElement, BaseElement, ElementPatch } from '@/engines/canvas';
import type { Animation, AnimationProperty, AnimationEasing, TextEffect, ShaderPreset } from '@/engines/project';
import { Input } from '@/components/ui/input';
import ShaderPreview from './ShaderPreview';
import TextEffectPreview from './TextEffectPreview';

const SHADER_GROUPS: { label: string; shaders: { id: ShaderPreset; label: string }[] }[] = [
  {
    label: 'Premium',
    shaders: [
      { id: 'shader-mesh-gradient',  label: 'Mesh Gradient' },
      { id: 'shader-grain-gradient', label: 'Grain Gradient' },
      { id: 'shader-warp',           label: 'Warp' },
      { id: 'shader-swirl',          label: 'Swirl' },
      { id: 'shader-water',          label: 'Water' },
      { id: 'shader-spiral',         label: 'Spiral' },
      { id: 'shader-liquid-metal',   label: 'Liquid Metal' },
      { id: 'shader-color-panels',   label: 'Color Panels' },
      { id: 'shader-god-rays',       label: 'God Rays' },
      { id: 'shader-smoke-ring',     label: 'Smoke Ring' },
      { id: 'shader-pulsing-border', label: 'Pulsing Border' },
    ],
  },
  {
    label: 'Tech',
    shaders: [
      { id: 'shader-neuro-noise', label: 'Neuro Noise' },
      { id: 'shader-voronoi',     label: 'Voronoi' },
      { id: 'shader-dot-orbit',   label: 'Dot Orbit' },
      { id: 'shader-dithering',   label: 'Dithering' },
    ],
  },
  {
    label: 'Clean',
    shaders: [
      { id: 'shader-perlin-noise',  label: 'Perlin Noise' },
      { id: 'shader-simplex-noise', label: 'Simplex Noise' },
    ],
  },
  {
    label: 'Playful',
    shaders: [
      { id: 'shader-metaballs', label: 'Metaballs' },
    ],
  },
];

const TEXT_EFFECT_GROUPS: { label: string; effects: { id: TextEffect; label: string }[] }[] = [
  {
    label: 'Premium',
    effects: [
      { id: 'soft-blur-in',       label: 'Soft Blur In' },
      { id: 'focus-blur-resolve', label: 'Focus Blur Resolve' },
      { id: 'blur-out-up',        label: 'Blur Out Up' },
      { id: 'tracking-in',        label: 'Tracking In' },
      { id: 'scale-down-fade',    label: 'Scale Down Fade' },
      { id: 'micro-scale-fade',   label: 'Micro Scale Fade' },
      { id: 'shimmer-sweep',      label: 'Shimmer Sweep' },
    ],
  },
  {
    label: 'Kinetic',
    effects: [
      { id: 'per-character-rise',   label: 'Per Character Rise' },
      { id: 'bottom-up-letters',    label: 'Bottom Up Letters' },
      { id: 'top-down-letters',     label: 'Top Down Letters' },
      { id: 'spring-scale-in',      label: 'Spring Scale In' },
      { id: 'kinetic-center-build', label: 'Kinetic Center Build' },
      { id: 'short-slide-right',    label: 'Short Slide Right' },
      { id: 'short-slide-down',     label: 'Short Slide Down' },
    ],
  },
  {
    label: 'Reveal',
    effects: [
      { id: 'staggered-fade-up',  label: 'Staggered Fade Up' },
      { id: 'mask-reveal-up',     label: 'Mask Reveal Up' },
      { id: 'line-by-line-slide', label: 'Line By Line Slide' },
      { id: 'inline-highlight',   label: 'Inline Highlight' },
      { id: 'marker-highlight',   label: 'Marker Highlight' },
    ],
  },
  {
    label: 'Tech / Glitch',
    effects: [
      { id: 'typewriter',     label: 'Typewriter' },
      { id: 'matrix-decode',  label: 'Matrix Decode' },
      { id: 'rgb-glitch-text', label: 'RGB Glitch' },
    ],
  },
];

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
function PropRow({ label, children, compact }: { label: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[11px] text-studio-text-faint shrink-0 ${compact ? 'w-4' : 'w-16'}`}>{label}</span>
      {children}
    </div>
  );
}

/* ── compact number input ── */
function NumInput({
  value, onChange, unit, step,
}: {
  value: number; onChange: (v: number) => void; unit?: string; step?: number;
}) {
  return (
    <div className="relative flex-1">
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
        className={`h-7 text-[12px] bg-studio-surface border-studio-border text-studio-text rounded-studio-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${unit ? 'pr-6' : 'pr-2'}`}
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
          <PropRow label="X" compact><NumInput value={Math.round(el.x)} onChange={(v) => update({ x: v })} /></PropRow>
          <PropRow label="Y" compact><NumInput value={Math.round(el.y)} onChange={(v) => update({ y: v })} /></PropRow>
        </div>
        <div className="flex gap-2">
          <PropRow label="W" compact><NumInput value={Math.round(el.width)} onChange={(v) => update({ width: v })} /></PropRow>
          <PropRow label="H" compact><NumInput value={Math.round(el.height)} onChange={(v) => update({ height: v })} /></PropRow>
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

/* ── shared: layer order (visual elements) ── */
type LayerDir = 'front' | 'back' | 'forward' | 'backward';

function LayerSection({ reorder }: { reorder: (dir: LayerDir) => void }) {
  const buttons: { dir: LayerDir; label: string; icon: typeof ChevronUp }[] = [
    { dir: 'front',    label: 'To front', icon: ChevronsUp },
    { dir: 'forward',  label: 'Forward',  icon: ChevronUp },
    { dir: 'backward', label: 'Backward', icon: ChevronDown },
    { dir: 'back',     label: 'To back',  icon: ChevronsDown },
  ];
  return (
    <>
      <Section title="Layer" />
      <div className="grid grid-cols-2 gap-1.5 px-4 py-3">
        {buttons.map(({ dir, label, icon: Icon }) => (
          <button
            key={dir}
            type="button"
            onClick={() => reorder(dir)}
            className="flex items-center justify-center gap-1.5 h-8 rounded-studio-md bg-studio-surface border border-studio-border text-[11px] font-medium text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong transition-colors duration-120"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
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
function TextProperties({ el, update, reorder }: { el: TextElement; update: Update; reorder: (dir: LayerDir) => void }) {
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

      {/* ── Text Effect ── */}
      <Section title="Text Effect" />
      <div className="flex flex-col gap-3 px-4 py-3">
        {el.textEffect && <TextEffectPreview effect={el.textEffect} color={el.color} />}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-3 h-3 text-studio-accent" />
            <span className="text-[11px] text-studio-text-faint">Animation preset</span>
          </div>
          <select
            value={el.textEffect ?? ''}
            onChange={(e) => update({ textEffect: (e.target.value as TextEffect) || undefined })}
            className="h-8 text-[11px] bg-studio-surface border border-studio-border rounded-studio-md text-studio-text px-2 focus:outline-none focus:border-studio-accent-border"
          >
            <option value="">None (use keyframes)</option>
            {TEXT_EFFECT_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.effects.map((e) => (
                  <option key={e.id} value={e.id}>{e.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {el.textEffect && (
          <PropRow label="Speed">
            <NumInput
              value={el.textEffectSpeed ?? 1}
              onChange={(v) => update({ textEffectSpeed: Math.max(0.1, v) })}
              step={0.1}
            />
          </PropRow>
        )}

        {el.textEffect === 'typewriter' && (
          <PropRow label="Cursor blink">
            <NumInput
              value={el.textEffectCursorBlinkSpeed ?? 1}
              onChange={(v) => update({ textEffectCursorBlinkSpeed: Math.max(0.1, v) })}
              step={0.1}
              unit="/s"
            />
          </PropRow>
        )}

        {(el.textEffect === 'inline-highlight' || el.textEffect === 'marker-highlight') && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-studio-text-faint">Highlight word / phrase</span>
            <Input
              value={el.textEffectHighlight ?? ''}
              placeholder="Type the word to highlight…"
              onChange={(e) => update({ textEffectHighlight: e.target.value || undefined })}
              className="h-7 text-[12px] bg-studio-surface border-studio-border text-studio-text rounded-studio-sm"
            />
          </div>
        )}

        {el.textEffect && (
          <p className="text-[10px] text-studio-text-faint leading-relaxed">
            Effect fills the element box — resize the element to control size and position on canvas.
          </p>
        )}
      </div>

      <TransformSection el={el} update={update} />
      <LayerSection reorder={reorder} />
      <AnimationSection el={el} update={update} />
    </>
  );
}

/* ── image / video: shared sections only ── */
function MediaProperties({
  el, update, reorder, onMakeBackground,
}: {
  el: BaseElement; update: Update; reorder: (dir: LayerDir) => void; onMakeBackground: () => void;
}) {
  return (
    <>
      <Section title="Layout" />
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={onMakeBackground}
          className="flex items-center justify-center gap-1.5 w-full h-8 rounded-studio-md bg-studio-surface border border-studio-border text-[11px] font-medium text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong transition-colors duration-120"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Make Background
        </button>
      </div>

      <TransformSection el={el} update={update} />
      <LayerSection reorder={reorder} />
      <AnimationSection el={el} update={update} />
    </>
  );
}

/* ── shader: full-bleed animated background ── */
function ShaderProperties({ el, update, reorder }: { el: ShaderElement; update: Update; reorder: (dir: LayerDir) => void }) {
  return (
    <>
      <Section title="Shader" />
      <div className="flex flex-col gap-3 px-4 py-3">
        <ShaderPreview preset={el.shader} />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-3 h-3 text-studio-accent" />
            <span className="text-[11px] text-studio-text-faint">Background</span>
          </div>
          <select
            value={el.shader}
            onChange={(e) => update({ shader: e.target.value as ShaderPreset })}
            className="h-8 text-[11px] bg-studio-surface border border-studio-border rounded-studio-md text-studio-text px-2 focus:outline-none focus:border-studio-accent-border"
          >
            {SHADER_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.shaders.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <PropRow label="Speed">
          <NumInput
            value={el.shaderSpeed ?? 1}
            onChange={(v) => update({ shaderSpeed: Math.max(0.1, v) })}
            step={0.1}
          />
        </PropRow>

        <p className="text-[10px] text-studio-text-faint leading-relaxed">
          Fills the element box (default: the whole canvas). Resize or reorder like
          any other layer.
        </p>
      </div>

      <TransformSection el={el} update={update} />
      <LayerSection reorder={reorder} />
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
  const { elements, updateElement, reorderLayer, makeBackground } = useCanvasEngine();

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
            <TextProperties
              key={selected.id}
              el={selected}
              update={(u) => updateElement(selected.id, u)}
              reorder={(dir) => reorderLayer(selected.id, dir)}
            />
          )}
          {(selected.type === 'image' || selected.type === 'video') && (
            <MediaProperties
              key={selected.id}
              el={selected}
              update={(u) => updateElement(selected.id, u)}
              reorder={(dir) => reorderLayer(selected.id, dir)}
              onMakeBackground={() => makeBackground(selected.id)}
            />
          )}
          {selected.type === 'audio' && (
            <AudioProperties key={selected.id} el={selected} update={(u) => updateElement(selected.id, u)} />
          )}
          {selected.type === 'shader' && (
            <ShaderProperties
              key={selected.id}
              el={selected}
              update={(u) => updateElement(selected.id, u)}
              reorder={(dir) => reorderLayer(selected.id, dir)}
            />
          )}
        </div>
      )}
    </div>
  );
}
