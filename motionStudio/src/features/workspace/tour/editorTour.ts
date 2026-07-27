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

export const EDITOR_TOUR_STEPS: DriveStep[] = [
  {
    element: '[data-tour="insert"]',
    popover: {
      title: 'Start here',
      description:
        'Add text, an animated background, or a block — a terminal, code panel, progress steps or confetti.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="assets"]',
    popover: {
      title: 'Your media',
      description:
        'Add your own files or search free stock. Drop files anywhere in this panel. Click a tile to place it, or drag it onto the canvas.',
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
        'Content, colour, effects, motion and position. Headings with an arrow open and close — <strong>Motion starts closed</strong>, and that’s where the animation presets live. Motion also pauses while an element is selected so you can position it; the canvas says so when it does.',
      side: 'left',
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
        'Render an MP4 in your browser, or on the cloud for full fidelity. You can replay this tour any time from the account menu.',
      side: 'bottom',
      align: 'end',
    },
  },
];
