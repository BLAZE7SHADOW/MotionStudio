import { TEMPLATES, CATEGORY_LABELS, CATEGORY_ORDER } from '@/content/templates';
import type { TemplateDefinition } from '@/content/templates';

interface TemplatePickerProps {
  /** null = the Blank option */
  selected: TemplateDefinition | null;
  onSelect: (template: TemplateDefinition | null) => void;
}

const RATIO_BADGE: Record<string, string> = {
  '16:9': '16:9',
  '9:16': '9:16',
  '1:1': '1:1',
};

function Row({
  label,
  sub,
  active,
  onClick,
}: {
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left px-2.5 py-2 rounded-studio-md border transition-colors duration-[120ms]',
        active
          ? 'bg-studio-accent-subtle border-studio-accent-border'
          : 'bg-studio-surface border-studio-border hover:border-studio-border-strong',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={[
            'text-[13px] font-medium truncate',
            active ? 'text-studio-accent' : 'text-studio-text',
          ].join(' ')}
        >
          {label}
        </span>
        <span className="text-[10px] font-mono text-studio-text-faint shrink-0">{sub}</span>
      </div>
    </button>
  );
}

/**
 * The template list. Deliberately does NOT render a live preview per row —
 * each shader background is its own WebGL context, and a dozen at once would
 * blow past the browser's context limit. One preview of the selection lives
 * beside the list instead, matching how effects/shaders are picked in the
 * Properties panel.
 */
export default function TemplatePicker({ selected, onSelect }: TemplatePickerProps) {
  return (
    <div className="flex flex-col gap-4">
      {CATEGORY_ORDER.map((category) => {
        const items = TEMPLATES.filter((t) => t.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category} className="flex flex-col gap-1.5">
            <p className="text-[11px] font-medium text-studio-text-muted uppercase tracking-wider px-0.5">
              {CATEGORY_LABELS[category]}
            </p>
            {items.map((t) => (
              <Row
                key={t.id}
                label={t.name}
                sub={RATIO_BADGE[t.aspectRatio]}
                active={selected?.id === t.id}
                onClick={() => onSelect(t)}
              />
            ))}
          </div>
        );
      })}

      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-medium text-studio-text-muted uppercase tracking-wider px-0.5">
          Start from nothing
        </p>
        <Row
          label="Blank project"
          sub="—"
          active={selected === null}
          onClick={() => onSelect(null)}
        />
      </div>
    </div>
  );
}
