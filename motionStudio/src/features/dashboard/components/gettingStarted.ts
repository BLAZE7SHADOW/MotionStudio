import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Type, Download } from 'lucide-react';
import { useProjectStore } from '@/engines/project';
import { getTemplate, instantiateTemplate, templateDurationInFrames } from '@/content/templates';
import { track } from '@/lib/analytics';

/**
 * Shared first-run guidance, used by both the empty dashboard and the compact
 * strip that shows while a user still has only a handful of projects.
 *
 * Kept in one place because the two surfaces say the same thing at different
 * sizes — letting them drift would mean the onboarding contradicts itself
 * depending on how many projects you happen to have.
 */

/** The template the demo button opens — generic enough for any first-timer. */
export const DEMO_TEMPLATE_ID = 'feature-shipped';

export const STEPS = [
  {
    icon: LayoutTemplate,
    title: 'Start from a template',
    body: 'Pick one of 21 ready-made scenes. It arrives with a background, animated text and timing already set — nothing starts blank.',
    short: 'Pick one of 21 ready-made scenes — background, text and timing already set.',
  },
  {
    icon: Type,
    title: 'Swap in your words',
    body: 'Double-click any text on the canvas to edit it. Change the effect, colour and timing from the Properties panel on the right.',
    short: 'Double-click text on the canvas to edit it, then restyle it on the right.',
  },
  {
    icon: Download,
    title: 'Export it',
    body: 'Hit Export for an MP4. Render in your browser for a quick draft, or in the cloud when you want full quality.',
    short: 'Export an MP4 — in your browser for a draft, in the cloud for full quality.',
  },
];

/**
 * Builds the demo project and opens it, skipping the picker entirely. A
 * first-timer shouldn't have to decide anything before they've seen what the
 * editor looks like.
 */
export function useQuickDemo() {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);
  const [creating, setCreating] = useState(false);

  const demo = getTemplate(DEMO_TEMPLATE_ID);

  function start() {
    if (!demo || creating) return;
    setCreating(true);

    const project = createProject({
      name: 'My first video',
      aspectRatio: demo.aspectRatio,
      fps: demo.fps,
      elements: instantiateTemplate(demo),
      durationInFrames: templateDurationInFrames(demo),
    });

    track.projectCreated({
      aspect_ratio: demo.aspectRatio,
      fps: demo.fps,
      template_id: demo.id,
      template_category: demo.category,
    });

    navigate(`/editor/${project.id}`);
  }

  return { demo, creating, start };
}
