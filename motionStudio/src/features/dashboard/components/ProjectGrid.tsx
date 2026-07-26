import type { Project, AspectRatio } from '@/engines/project';
import ProjectCard from './ProjectCard';

interface ProjectGridProps {
  projects: Project[];
}

/**
 * Projects are grouped by aspect ratio because a single grid mixing them looks
 * ragged — a 16:9 card is short and a 9:16 card is nearly twice as tall, so
 * rows never line up. Within a section every card is the same shape.
 *
 * Column counts differ per section on purpose: portrait cards are tall, so
 * more (narrower) columns keep them from dominating the page, while landscape
 * cards are wide and need fewer.
 */
/**
 * Keyed by AspectRatio rather than a plain array so TypeScript fails the build
 * if a new ratio is ever added without a section — otherwise those projects
 * would silently disappear from the dashboard.
 */
const SECTION_META: Record<AspectRatio, { label: string; sub: string; columns: string }> = {
  '16:9': {
    label: 'Landscape',
    sub: 'YouTube, presentations',
    columns: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  },
  '9:16': {
    label: 'Portrait',
    sub: 'Reels, TikTok, Shorts',
    columns: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8',
  },
  '1:1': {
    label: 'Square',
    sub: 'Instagram, posts',
    columns: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6',
  },
};

const SECTION_ORDER: AspectRatio[] = ['16:9', '9:16', '1:1'];

export default function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <div className="flex flex-col gap-8">
      {SECTION_ORDER.map((ratio) => {
        const items = projects.filter((p) => p.aspectRatio === ratio);
        if (items.length === 0) return null;
        const meta = SECTION_META[ratio];

        return (
          <section key={ratio} className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2.5">
              <h3 className="text-[13px] font-medium text-studio-text">{meta.label}</h3>
              <span className="text-[11px] text-studio-text-faint">
                {ratio} · {meta.sub}
              </span>
              <span className="ml-auto text-[11px] text-studio-text-faint">{items.length}</span>
            </div>
            <div className={`grid gap-4 ${meta.columns}`}>
              {items.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
