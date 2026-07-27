import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import type { BlockPreset, BlockProps } from '@/engines/project';

/** One editable setting on a block, rendered as an input by the Properties panel. */
export interface BlockField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'color' | 'select';
  /** Choices for a `select` field. */
  options?: { value: string; label: string }[];
  /** Shown under a textarea to explain a line-based format. */
  hint?: string;
}

export interface BlockDefinition {
  label: string;
  description: string;
  /** The component's natural length. Clips shorter than this CLIP the animation. */
  naturalLength: number;
  /** Default box size in composition space (16:9 reference). */
  defaultSize: { width: number; height: number };
  defaults: BlockProps;
  fields: BlockField[];
  component: LazyExoticComponent<ComponentType<Record<string, unknown>>>;
  /**
   * Turns the flat, JSON-safe `blockProps` into the component's real props —
   * this is where multiline strings become the arrays-of-objects the component
   * actually wants. Keeping the parse here is what lets a project stay
   * serializable for localStorage and the Supabase JSONB column.
   */
  toProps: (props: BlockProps) => Record<string, unknown>;
}

// Each block has its own prop shape; the registry's `toProps` is what
// guarantees the right ones are passed, so the map itself is deliberately loose.
const lazyBlock = (loader: () => Promise<{ default: ComponentType<never> }>) =>
  lazy(loader as unknown as () => Promise<{ default: ComponentType<Record<string, unknown>> }>);

/** `$ cmd` → command · `✓ ok` → success · `✗ / ! ` → error · anything else → log */
function parseTerminalLines(raw: string) {
  return raw
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const t = line.trim();
      if (t.startsWith('$ ')) return { text: t.slice(2), type: 'command' as const };
      if (t.startsWith('✓ ')) return { text: t.slice(2), type: 'success' as const };
      if (t.startsWith('✗ ') || t.startsWith('! ')) return { text: t.slice(2), type: 'error' as const };
      return { text: t, type: 'log' as const };
    });
}

export const BLOCKS: Record<BlockPreset, BlockDefinition> = {
  'terminal-simulator': {
    label: 'Terminal',
    description: 'A terminal window typing commands and streaming output.',
    naturalLength: 240,
    defaultSize: { width: 1200, height: 620 },
    defaults: {
      lines: '$ npm install motionstudio\nresolving dependencies...\n✓ added 1 package in 2s',
      prompt: '$',
      title: '~/projects',
      fontSize: 22,
    },
    fields: [
      { key: 'lines', label: 'Lines', type: 'textarea', hint: 'One per line. Prefix "$ " for a command, "✓ " for success, "✗ " for an error.' },
      { key: 'title', label: 'Window title', type: 'text' },
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'fontSize', label: 'Font size', type: 'number' },
    ],
    component: lazyBlock(() => import('@/components/remocn/terminal-simulator').then((m) => ({ default: m.TerminalSimulator }))),
    toProps: (p) => ({
      lines: parseTerminalLines(String(p.lines ?? '')),
      prompt: p.prompt,
      title: p.title,
      fontSize: p.fontSize,
    }),
  },

  'glass-code-block': {
    label: 'Code block',
    description: 'A frosted editor window revealing code line by line.',
    naturalLength: 180,
    defaultSize: { width: 1140, height: 690 },
    defaults: {
      code: 'export function hello() {\n  return "world";\n}',
      title: 'hello.ts',
      fontSize: 20,
    },
    fields: [
      { key: 'code', label: 'Code', type: 'textarea' },
      { key: 'title', label: 'File name', type: 'text' },
      { key: 'fontSize', label: 'Font size', type: 'number' },
    ],
    component: lazyBlock(() => import('@/components/remocn/glass-code-block').then((m) => ({ default: m.GlassCodeBlock }))),
    // width/height come from the element box so resizing on canvas works.
    toProps: (p) => ({ code: p.code, title: p.title, fontSize: p.fontSize }),
  },

  'progress-steps': {
    label: 'Progress steps',
    description: 'A pipeline whose steps light up in sequence.',
    naturalLength: 150,
    defaultSize: { width: 1400, height: 320 },
    // Geometry is in composition pixels, so these are sized against a
    // 1920x1080 frame. The component's own fallbacks were built for a small
    // preview box and are far too small to read on a real canvas.
    defaults: {
      steps: 'Connect\nProcess\nDeploy',
      orientation: 'horizontal',
      activeColor: '#22c55e',
      textColor: '#ffffff',
      trackLength: 1200,
      nodeRadius: 40,
      labelSize: 40,
    },
    fields: [
      { key: 'steps', label: 'Steps', type: 'textarea', hint: 'One step per line.' },
      {
        key: 'orientation',
        label: 'Direction',
        type: 'select',
        options: [
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical', label: 'Vertical' },
        ],
      },
      { key: 'trackLength', label: 'Track length', type: 'number', hint: 'How far the pipeline spans, in composition pixels.' },
      { key: 'nodeRadius', label: 'Node size', type: 'number' },
      { key: 'labelSize', label: 'Label size', type: 'number' },
      { key: 'activeColor', label: 'Active colour', type: 'color' },
      { key: 'textColor', label: 'Text colour', type: 'color' },
    ],
    component: lazyBlock(() => import('@/components/remocn/progress-steps').then((m) => ({ default: m.ProgressSteps }))),
    toProps: (p) => ({
      steps: String(p.steps ?? '').split('\n').filter(Boolean).map((label) => ({ label })),
      orientation: p.orientation,
      activeColor: p.activeColor,
      textColor: p.textColor,
      trackLength: p.trackLength,
      nodeRadius: p.nodeRadius,
      labelSize: p.labelSize,
    }),
  },

  confetti: {
    label: 'Confetti',
    description: 'A celebratory particle burst. Layer it over a finished scene.',
    naturalLength: 90,
    defaultSize: { width: 1920, height: 1080 },
    defaults: { particleCount: 160, power: 18, size: 13, seed: 1 },
    fields: [
      { key: 'particleCount', label: 'Particles', type: 'number' },
      { key: 'power', label: 'Power', type: 'number' },
      { key: 'size', label: 'Size', type: 'number' },
      { key: 'seed', label: 'Seed', type: 'number' },
    ],
    component: lazyBlock(() => import('@/components/remocn/confetti').then((m) => ({ default: m.Confetti }))),
    toProps: (p) => ({
      particleCount: p.particleCount,
      power: p.power,
      size: p.size,
      seed: p.seed,
    }),
  },
};

export function getBlock(preset: BlockPreset): BlockDefinition {
  return BLOCKS[preset];
}
