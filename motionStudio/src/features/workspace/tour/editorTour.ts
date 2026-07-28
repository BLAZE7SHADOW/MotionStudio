import type { DriveStep } from 'driver.js';

/**
 * The first-run walkthrough of the editor.
 *
 * Its main job is the handful of things you cannot discover by looking: that
 * text is edited by double-clicking it, that a clip is trimmed by dragging its
 * *edge* rather than its body, and that motion deliberately doesn't play while
 * an element is selected. Every one of those has burnt a first-time user.
 *
 * Anchors are `data-tour` attributes rather than class names so restyling a
 * panel can't silently break the tour.
 */
export const TOUR_SEEN_KEY = 'ms_editor_tour_seen';

const ALL_STEPS: DriveStep[] = [
  {
    element: '[data-tour="insert"]',
    popover: {
      title: 'Start here',
      description:
        'Everything you place on the canvas starts from these three buttons. <strong>T</strong> adds text — the next two are worth a closer look.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="shader"]',
    popover: {
      title: 'Animated backgrounds',
      description:
        'Drops in a living background — 18 shader presets, from soft mesh gradients to noise and warp. Swap the preset and tune its speed and opacity in Properties. This is the fastest way to stop a video looking like plain text on black.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="blocks"]',
    popover: {
      title: 'Blocks — things text can’t do',
      description:
        'A <strong>terminal</strong> that types commands, a <strong>code panel</strong> that reveals your code line by line, <strong>progress steps</strong>, and <strong>confetti</strong>. Pick one, then edit its content in Properties — a code block takes your real code, a terminal takes one line per command.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="project-settings"]',
    popover: {
      title: 'Project settings',
      description:
        'That aspect ratio · fps · length readout is a button. Open it to reshape the project at any time — switch to 9:16 for Reels, change the frame rate, or make the video longer. <strong>Nothing is locked in at creation.</strong>',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="assets"]',
    popover: {
      title: 'Your media',
      description:
        'Everything available to this project lives here. Click a tile to place it on the canvas, or drag it where you want it. Two ways to fill it up — next two steps.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="add-media"]',
    popover: {
      title: 'Bring in your own files',
      description:
        'Images, video and audio. You can also <strong>drop files anywhere in this panel</strong>. Anything unsupported is named rather than silently ignored. Uploads go to cloud storage in the background, which is what lets Cloud Render see them.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="stock-tab"]',
    popover: {
      title: 'Free stock footage',
      description:
        'Search millions of free photos and videos from Pexels, and place one straight onto the canvas — no account with them, no downloads, no attribution to manage.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="canvas"]',
    popover: {
      title: 'The canvas',
      description:
        'Drag to move, pull the handles to resize or rotate. <strong>Double-click text to edit it in place.</strong>',
      side: 'left',
      align: 'center',
    },
  },
  {
    element: '[data-tour="properties"]',
    popover: {
      title: 'Everything about the selection',
      description:
        'Whatever is selected, this panel controls it — content, colour, size, position, timing. Headings with an arrow open and close, and <strong>Motion starts closed</strong>: that’s where the animation presets live. Motion also pauses while something is selected so you can position it, and the canvas tells you when that’s happening.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="effects-section"]',
    popover: {
      title: '34 text effects',
      description:
        'Typewriter, per-character rise, shimmer sweep, marker highlight and thirty more — each one a real animation, previewed live right here before you commit to it. This is where a plain title becomes something worth watching.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="shots"]',
    popover: {
      title: 'Build it shot by shot',
      description:
        'A video is a sequence of moments, and this is where you arrange them. <strong>Add shot</strong> puts a new one on the end — go on, try it. Click between them to work on one at a time, and the timeline below shows only that shot, so twenty quick cuts never become twenty rows to scroll. <strong>Sequence</strong> steps back to see the whole thing.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="timeline"]',
    popover: {
      title: 'When things happen',
      description:
        'Each element gets a clip. Drag the clip to move it, and <strong>drag its edge to trim</strong>. Click anywhere in the track to scrub.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="preview"]',
    popover: {
      title: 'Play it back',
      description:
        'Effects and animations only run during playback — this is where you see the real thing.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="export"]',
    popover: {
      title: 'Export',
      description:
        'Render an MP4 in your browser, or on the cloud for full fidelity.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="help"]',
    popover: {
      title: 'When something goes wrong',
      description:
        'Everything you need when you’re stuck lives here: <strong>replay this tour</strong>, <strong>send feedback</strong> — it reaches a real person, and carries the details that make a bug fixable — and <strong>what’s new</strong>, so you can tell a change from a fault. A dot means there’s something you haven’t read.',
      side: 'bottom',
      align: 'end',
    },
  },
];

/**
 * The steps whose anchors are actually on screen right now.
 *
 * Some panels only exist in context — the Effects section renders only while a
 * text element is selected, and the tour's first run happens on an empty
 * canvas. Pointing driver.js at a missing element gives a popover floating over
 * nothing, so the list is resolved against the live DOM instead. Replaying the
 * tour with a text element selected therefore shows more than the first run
 * did, which is the right way round.
 */
export function buildEditorTourSteps(): DriveStep[] {
  return ALL_STEPS.filter(
    (step) => typeof step.element === 'string' && document.querySelector(step.element),
  );
}
