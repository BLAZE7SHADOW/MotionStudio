import type { DriveStep } from 'driver.js';

/**
 * The first-run walkthrough of the editor.
 *
 * It is written for someone who has never opened a video editor, so each step
 * answers the same three questions in the same order: **what this is, what you
 * do with it, and the thing that would otherwise catch you out.** That last part
 * is the reason the tour exists — text is edited by double-clicking it, a clip
 * is trimmed by dragging its *edge* rather than its body, number fields are
 * sliders, and motion deliberately freezes while an element is selected. Every
 * one of those has burnt a first-time user.
 *
 * Anchors are `data-tour` attributes rather than class names so restyling a
 * panel can't silently break the tour.
 */
export const TOUR_SEEN_KEY = 'ms_editor_tour_seen';

interface TourStep {
  /**
   * Selectors tried in order; the first one actually on screen anchors the step.
   *
   * Several panels only exist in context — the Sound section needs an audio
   * element selected, Effects needs a text element — and the first run happens
   * on an empty canvas. Without a fallback those steps simply vanish, which
   * means a brand-new user never hears about sound or text effects at all: the
   * two things they are most likely to want. The fallback keeps the explanation
   * and points at the panel the feature lives in; on a replay with something
   * selected, the precise anchor wins and the spotlight lands on the real
   * control.
   */
  anchors: string[];
  popover: DriveStep['popover'];
}

const ALL_STEPS: TourStep[] = [
  /* ─────────────── Putting things on screen ─────────────── */
  {
    anchors: ['[data-tour="insert"]'],
    popover: {
      title: 'Start here',
      description:
        'These three buttons are how things get onto your video. <strong>T</strong> adds text. The sparkle adds a moving background. The last one adds a ready-made block. Whatever you click lands on the canvas already selected, so you can start editing it straight away in the panel on the right.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    anchors: ['[data-tour="shader"]'],
    popover: {
      title: 'A background that moves',
      description:
        'Plain text on black looks unfinished. This drops in a living background — <strong>18 to choose from</strong>, from soft colour clouds to noise, swirls and liquid metal. Change which one, and how fast it moves, on the right. It fills the frame and sits behind everything else, so you can add it once and forget about it.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    anchors: ['[data-tour="blocks"]'],
    popover: {
      title: 'Things text can’t do',
      description:
        'Four ready-made animations: a <strong>terminal</strong> typing out commands, a <strong>code panel</strong> revealing your code line by line, <strong>progress steps</strong> that light up one after another, and <strong>confetti</strong>. Add one, then paste your real content into it on the right. Each needs a bit of time to finish — make it too short on the timeline and it tells you exactly how much it needs.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    anchors: ['[data-tour="project-settings"]'],
    popover: {
      title: 'The shape and length of the video',
      description:
        'That little <em>16:9 · 30fps · 10s</em> readout is a button. Open it to go tall for Reels and Shorts, change how smooth the motion is, or make the whole video longer or shorter. <strong>Nothing you picked when you created this project is locked in.</strong>',
      side: 'bottom',
      align: 'start',
    },
  },

  /* ─────────────── Your media ─────────────── */
  {
    anchors: ['[data-tour="assets"]'],
    popover: {
      title: 'Your media lives here',
      description:
        'Every photo, video clip and music file in this project sits in this panel. Click a tile to drop it on the canvas, or <strong>drag the tile and let go exactly where you want it</strong>. Two ways to fill it up — next.',
      side: 'right',
      align: 'start',
    },
  },
  {
    anchors: ['[data-tour="add-media"]'],
    popover: {
      title: 'Bring in your own files',
      description:
        'Photos, video and music. You can also <strong>drop files anywhere in this panel</strong>, or <strong>paste a screenshot straight in with ⌘V</strong> without saving it to disk first. If a file type isn’t supported you’re told which one, rather than nothing happening. Files upload quietly in the background — that’s what lets Cloud Render see them later.',
      side: 'right',
      align: 'start',
    },
  },
  {
    anchors: ['[data-tour="stock-tab"]'],
    popover: {
      title: 'Free photos and video',
      description:
        'Nothing of your own to use? Search millions of free photos and videos from Pexels and add one straight into your project — no account with them, no downloads to manage, nothing to credit.',
      side: 'right',
      align: 'start',
    },
  },
  {
    anchors: ['[data-tour="media-layout"]', '[data-tour="assets"]'],
    popover: {
      title: 'Turn a photo into your background',
      description:
        'Any photo or video can be the backdrop. Place it, click it, then press <strong>Make Background</strong> on the right — it snaps to fill the whole frame and drops behind everything else in one go. Quicker and more exact than dragging its corners out. Then put your text on top.',
      side: 'right',
      align: 'start',
    },
  },
  {
    anchors: ['[data-tour="sound-section"]', '[data-tour="assets"]'],
    popover: {
      title: 'Music and sound',
      description:
        'Music comes in the same way: add the file, then click it to place it. It has no picture, so you’ll only see it as a bar on the timeline along the bottom. Select that bar and the right-hand panel gives you <strong>Volume</strong>. <strong>Drag the ends of the bar to trim the track</strong>, and drag its middle to choose when the music comes in.',
      side: 'right',
      align: 'start',
    },
  },

  /* ─────────────── The canvas ─────────────── */
  {
    anchors: ['[data-tour="canvas"]'],
    popover: {
      title: 'Moving things around',
      description:
        'This is your actual video frame. <strong>Drag</strong> anything to move it, grab a <strong>corner</strong> to resize, or the handle above it to <strong>rotate</strong>. <strong>Double-click text to type straight into it.</strong> One thing that catches everyone out: while something is selected the motion freezes so you can position it — the canvas says so, and Preview brings it back. And <strong>⌘Z undoes anything</strong>, so nothing here is a mistake you can’t take back.',
      side: 'left',
      align: 'center',
    },
  },

  /* ─────────────── Properties ─────────────── */
  {
    anchors: ['[data-tour="properties"]'],
    popover: {
      title: 'Everything about what you picked',
      description:
        'Whatever is selected, this panel edits it — the words, the colour, the size, the volume, the timing. Headings with a small arrow open and close, and a <strong>diamond ◆ beside one means something inside it is animated</strong>, so a closed section can still tell you. And <strong>every number box here can be dragged sideways like a slider</strong> — far quicker than typing when you’re feeling out a value. Click into it when you want an exact number.',
      side: 'left',
      align: 'start',
    },
  },
  {
    anchors: ['[data-tour="effects-section"]', '[data-tour="properties"]'],
    popover: {
      title: '34 ways to make text move',
      description:
        'This is where a plain title turns into something worth watching. Typing out one letter at a time. Letters rising into place. A shimmer sweeping across. A marker-pen line drawn under one word. Numbers counting up to a total. <strong>Each one plays right here as you browse it</strong>, so you see it before you commit. <strong>Speed</strong> makes it quicker or slower, and some ask for a little more — a highlight wants to know which word, a counter wants the number to count to.',
      side: 'left',
      align: 'start',
    },
  },
  {
    anchors: ['[data-tour="motion-section"]', '[data-tour="properties"]'],
    popover: {
      title: 'Motion — how it arrives and leaves',
      description:
        'Different from the text effects: this moves the whole box, and it works on anything, not just text. <strong>Presets</strong> is the one-click version — fade in, slide up, pop, and the matching ways out. <strong>Manual</strong> is the same thing with the dials showing: where it starts, where it ends, when it begins and how long it takes. Click a preset and you land on Manual looking at exactly what it just set — the fastest way to learn what those dials really do.',
      side: 'left',
      align: 'start',
    },
  },

  /* ─────────────── Shots ─────────────── */
  {
    anchors: ['[data-tour="shots"]'],
    popover: {
      title: 'Build it shot by shot',
      description:
        'A video is a run of moments, one after another, and this strip is that run. <strong>Add shot</strong> puts a new one on the end — go on, try it. Click between them to work on one at a time: the timeline below then shows only that shot, so twenty quick cuts never become twenty rows to scroll through. <strong>Double-click a shot to rename it</strong>, and <strong>Sequence</strong> on the left steps back to see the whole video at once.',
      side: 'top',
      align: 'start',
    },
  },
  {
    /* Only rendered inside a shot that has something before it, so this step
       appears on a replay rather than the first run — which is the right way
       round: there is nothing to transition into until you have two shots. */
    anchors: ['[data-tour="transition"]'],
    popover: {
      title: 'How a shot arrives',
      description:
        'Every join is a hard cut until you say otherwise. Pick a <strong>fade</strong> (up out of black), a <strong>zoom punch</strong> (snaps in from slightly too big), a <strong>whip</strong> (flies in from the side) or a <strong>spin</strong>, and the shot you’re in arrives that way. With music loaded each one lasts half a beat, so it lands <em>with</em> the track — try a zoom punch on a drop and play it back.',
      side: 'top',
      align: 'start',
    },
  },
  {
    anchors: ['[data-tour="beat"]'],
    popover: {
      title: 'Cut in time with the music',
      description:
        'Add a music track and MotionStudio works out its tempo on its own, then marks the beats along the ruler — every fourth line brighter, so you can count bars at a glance. From then on <strong>Add shot</strong> lands on a beat and dragging a shot’s edge snaps to one, which is the difference between a reel that feels locked to the track and one that is merely close. If the tempo looks wrong, open this and <strong>tap along</strong> — it works it out from your taps. Hold <strong>Alt</strong> while dragging to ignore the snapping just this once.',
      side: 'top',
      align: 'start',
    },
  },

  /* ─────────────── Timing ─────────────── */
  {
    anchors: ['[data-tour="timeline"]'],
    popover: {
      title: 'When things happen, and for how long',
      description:
        'Everything you add gets a bar down here, and <strong>left to right is time</strong>. Where a bar starts is when that thing appears; how wide it is, is how long it stays on screen. <strong>Drag the middle of a bar to move it. Drag either end to make it shorter or longer.</strong> Click anywhere in the track to jump the video to that moment — the thin line is where you are, and the counter at the top right reads it out in seconds. If something has motion on it you’ll see slim bars inside its clip; drag those to change <em>when</em> the animation happens without moving the clip itself.',
      side: 'top',
      align: 'start',
    },
  },
  {
    anchors: ['[data-tour="tracks"]'],
    popover: {
      title: 'Layers, and what plays everywhere',
      description:
        'Each row is one thing, and the top row is the one in front on the canvas. Click a name to select it. The small square beside it is the one worth knowing: press it and that item plays through the <strong>whole video</strong> instead of only this shot — exactly what you want for a background or a music track. It turns into a stack icon once it’s on, and the bin next to it removes the item.',
      side: 'top',
      align: 'start',
    },
  },

  /* ─────────────── Finishing ─────────────── */
  {
    anchors: ['[data-tour="preview"]'],
    popover: {
      title: 'Watch it properly',
      description:
        'Effects and animations only run while it’s playing, so this is where you see the real thing — exactly as it will come out. The play button at the top left of the timeline does the same job.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    anchors: ['[data-tour="export"]'],
    popover: {
      title: 'Turn it into a file',
      description:
        'Two ways out, and they are <em>not</em> the same file. <strong>Browser</strong> renders here on your machine — quick, nothing to set up, but a plain browser export flattens each frame, so your <strong>animated background, blocks and text effects drop out</strong> unless you tick <strong>Include effects</strong>. <strong>Cloud Render</strong> always matches the editor exactly. The dialog says which applies to your project, so read the note before you post it anywhere.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    anchors: ['[data-tour="help"]'],
    popover: {
      title: 'When you’re stuck',
      description:
        'Everything for when something isn’t right lives here: <strong>replay this tour</strong> — worth doing once you have things on the canvas, because it then shows the parts about sound, text effects and motion that an empty canvas can’t — plus the <strong>keyboard shortcuts</strong>, <strong>send feedback</strong> that reaches a real person and carries the details that make a bug fixable, and <strong>what’s new</strong>. A dot means there’s something you haven’t read.',
      side: 'bottom',
      align: 'end',
    },
  },
];

/**
 * The steps that have an anchor on screen right now, each resolved to it.
 *
 * Pointing driver.js at a missing element gives a popover floating over
 * nothing, so the list is resolved against the live DOM. A step with no anchor
 * present at all — the transition picker, which needs a second shot — is
 * dropped rather than faked. Replaying the tour with a text element selected
 * therefore shows more than the first run did, which is the right way round.
 */
export function buildEditorTourSteps(): DriveStep[] {
  return ALL_STEPS.flatMap((step) => {
    const anchor = step.anchors.find((selector) => document.querySelector(selector));
    return anchor ? [{ element: anchor, popover: step.popover }] : [];
  });
}
