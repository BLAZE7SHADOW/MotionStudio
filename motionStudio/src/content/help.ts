/**
 * Every explanation the editor can give about itself, in one place.
 *
 * Two surfaces read this file and they must never describe the same control
 * differently:
 *
 *   - the **quick start** (`tour/quickStart.ts`) — six hands-on steps on first
 *     run, which use `emoji` + `title` + `line` + `chips`
 *   - the **helper dots** (`tour/helperMode.ts`) — a beacon beside every control
 *     below, on demand, which use all of the above plus `more`
 *
 * Before this file the copy lived only in the tour, so anything the tour didn't
 * cover was undocumented in the product and anything it did cover was told to
 * you exactly once, in a 21-step wall, before you had touched anything. Keeping
 * one registry is the same discipline as the living-docs rule in CLAUDE.md: two
 * descriptions of one feature is two things to keep true, and one of them
 * always rots.
 *
 * ## How to write an entry
 *
 * The old tour failed because it was written like documentation — correct,
 * complete, and unread. These limits are enforced by `tests/help.test.mjs`, so
 * the copy cannot quietly slide back into prose:
 *
 *   `title`  ≤ 5 words     — a headline, not a sentence
 *   `line`   ≤ 15 words    — ONE sentence, the single thing worth knowing
 *   `chips`  ≤ 2, ≤ 4 words each — the gotchas, as glanceable pills
 *   `more`   ≤ 60 words    — the fuller answer, only reached by asking
 *
 * Plain words. Say "picture" not "asset", "song" not "audio track". Assume the
 * reader has never opened a video editor and is not going to read a paragraph.
 *
 * Keys are the `data-tour` attributes already on the components, so restyling a
 * panel cannot silently break either surface — and `Record<HelpId, HelpEntry>`
 * makes a forgotten entry a compile error rather than a blank popover.
 */

/** Placement of the popover relative to its anchor. Mirrors driver.js. */
export type HelpSide = 'top' | 'right' | 'bottom' | 'left';
export type HelpAlign = 'start' | 'center' | 'end';

export interface HelpChip {
  emoji: string;
  /** ≤ 4 words. A gotcha, not a sentence. */
  text: string;
}

export interface HelpEntry {
  emoji: string;
  /** ≤ 5 words. */
  title: string;
  /** ONE sentence, ≤ 15 words. */
  line: string;
  /** ≤ 2. The things that catch people out. */
  chips?: HelpChip[];
  /** ≤ 60 words. Helper dots only — the quick start never shows this. */
  more?: string;
  side: HelpSide;
  align: HelpAlign;
}

/**
 * Every id here is a live `data-tour` value. Adding one without adding the
 * attribute is harmless — `resolveAnchor` drops ids with nothing on screen —
 * but the reverse (an attribute with no entry) means a control nobody can ask
 * about, so grep both when adding a panel.
 */
export type HelpId =
  /* toolbar */
  | 'insert'
  | 'shader'
  | 'blocks'
  | 'project-settings'
  | 'preview'
  | 'export'
  | 'help'
  /* left panel */
  | 'assets'
  | 'add-media'
  | 'stock-tab'
  /* centre */
  | 'canvas'
  /* right panel */
  | 'properties'
  | 'media-layout'
  | 'sound-section'
  | 'effects-section'
  | 'motion-section'
  /* bottom */
  | 'shots'
  | 'transition'
  | 'beat'
  | 'timeline'
  | 'tracks';

export const HELP: Record<HelpId, HelpEntry> = {
  /* ─────────────────────────── Toolbar ─────────────────────────── */

  insert: {
    emoji: '✨',
    title: 'Put words on screen',
    line: 'Click T, then start typing — it appears right away.',
    chips: [
      { emoji: '✏️', text: 'double-click to edit' },
      { emoji: '↩️', text: '⌘Z undoes anything' },
    ],
    more: 'Three ways to add something. T is text. The sparkle is a moving background. The last one is a ready-made block. Whatever you pick lands in the middle already selected, so the panel on the right is straight away about the thing you just made.',
    side: 'bottom',
    align: 'start',
  },

  shader: {
    emoji: '🌈',
    title: 'A background that moves',
    line: 'One click, and your video stops looking flat.',
    chips: [
      { emoji: '🎚️', text: '18 to choose from' },
      { emoji: '⚡', text: 'you set the speed' },
    ],
    more: 'Plain words on black look unfinished. This drops in a living backdrop — soft colour clouds, noise, swirls, liquid metal. It fills the frame and sits behind everything else, so you add it once and forget it. Swap which one and how fast on the right.',
    side: 'bottom',
    align: 'start',
  },

  blocks: {
    emoji: '🧱',
    title: 'Ready-made animations',
    line: 'A terminal, code, steps or confetti — drop one in.',
    chips: [{ emoji: '⏱️', text: 'each needs time' }],
    more: 'Four things text cannot do on its own: a terminal typing commands, code revealing line by line, steps lighting up one after another, and confetti. Add one, then paste your real content into it on the right. Make it too short on the timeline and it tells you how much it needs.',
    side: 'bottom',
    align: 'start',
  },

  'project-settings': {
    emoji: '📐',
    title: 'Shape and length',
    line: 'That 16:9 · 30fps · 10s label is really a button.',
    chips: [
      { emoji: '📱', text: 'go tall for Reels' },
      { emoji: '🔓', text: 'nothing is locked' },
    ],
    more: 'Open it to turn the video upright for Reels and Shorts, make the motion smoother, or make the whole thing longer or shorter. Nothing you chose when you created this project is stuck that way.',
    side: 'bottom',
    align: 'start',
  },

  preview: {
    emoji: '▶️',
    title: 'Watch the real thing',
    line: 'Effects only run while it plays, so press this.',
    chips: [{ emoji: '🎬', text: 'exactly what exports' }],
    more: 'The canvas holds still so you can position things. This is where it comes alive, and what you see here is what comes out of the export. The play button at the top left of the timeline does the same job.',
    side: 'bottom',
    align: 'end',
  },

  export: {
    emoji: '🎁',
    title: 'Turn it into a file',
    line: 'Two ways out, and they do not give the same file.',
    chips: [
      { emoji: '⚡', text: 'Browser is quick' },
      { emoji: '☁️', text: 'Cloud matches exactly' },
    ],
    more: 'Browser renders on your own machine — fast, nothing to set up, but a plain browser export flattens each frame and drops your moving background, blocks and text effects unless you tick "Include effects". Cloud Render always matches the editor. The dialog says which applies to you, so read it before posting anywhere.',
    side: 'bottom',
    align: 'end',
  },

  help: {
    emoji: '🆘',
    title: 'Stuck?',
    line: 'Replay this, see the shortcuts, or tell us what broke.',
    chips: [{ emoji: '🔴', text: 'a dot means news' }],
    more: 'Everything for when something is not right. Replaying the quick start is worth it once you have things on the canvas. Feedback reaches a real person and carries the details that make a bug fixable. A dot means there is something new you have not read.',
    side: 'bottom',
    align: 'end',
  },

  /* ────────────────────────── Left panel ────────────────────────── */

  assets: {
    emoji: '📦',
    title: 'Your files live here',
    line: 'Every picture, clip and song you have added sits here.',
    chips: [{ emoji: '🖱️', text: 'drag one out' }],
    more: 'Click a tile to drop it in the middle of the frame, or drag the tile and let go exactly where you want it. Nothing here is on your video until you place it.',
    side: 'right',
    align: 'start',
  },

  'add-media': {
    emoji: '⬆️',
    title: 'Bring in your own',
    line: 'Pictures, video and music from your own computer.',
    chips: [
      { emoji: '📋', text: 'paste with ⌘V' },
      { emoji: '🫳', text: 'or drop them here' },
    ],
    more: 'You can drop files anywhere in this panel, or paste a screenshot straight in without saving it to disk first. If a file type will not work you are told which one, rather than nothing happening. Files upload quietly in the background, which is what lets Cloud Render see them later.',
    side: 'right',
    align: 'start',
  },

  'stock-tab': {
    emoji: '🔍',
    title: 'Free photos and video',
    line: 'Search millions of them and drop one straight in.',
    chips: [{ emoji: '🆓', text: 'nothing to credit' }],
    more: 'Search Pexels and add a photo or clip straight into your project. No account with them, no downloads to keep track of, and nothing you have to credit.',
    side: 'right',
    align: 'start',
  },

  /* ───────────────────────────  Canvas  ─────────────────────────── */

  canvas: {
    emoji: '🖐️',
    title: 'Your actual video',
    line: 'Drag to move, corners to resize, the handle to spin.',
    chips: [
      { emoji: '✍️', text: 'double-click text' },
      { emoji: '⏸️', text: 'motion waits while picked' },
    ],
    more: 'This is the real frame. The one thing that catches everyone out: while something is selected the motion freezes so you can position it — the canvas says so, and Preview brings it back. ⌘Z undoes anything, so nothing here is a mistake you cannot take back.',
    side: 'left',
    align: 'center',
  },

  /* ───────────────────────── Right panel ───────────────────────── */

  properties: {
    emoji: '🎛️',
    title: 'All about what you picked',
    line: 'The words, the colour, the size, the timing — all here.',
    chips: [
      { emoji: '↔️', text: 'drag numbers sideways' },
      { emoji: '◆', text: 'means it animates' },
    ],
    more: 'Headings with a small arrow open and close, and a diamond beside one means something inside it moves — so a closed section can still tell you. Every number box can be dragged sideways like a slider, which beats typing while you feel out a value. Click into it when you want an exact number.',
    side: 'left',
    align: 'start',
  },

  'media-layout': {
    emoji: '🖼️',
    title: 'Photo as your background',
    line: 'Place it, click it, then press Make Background.',
    chips: [{ emoji: '⬇️', text: 'drops behind everything' }],
    more: 'Any picture or clip can be the backdrop. It snaps to fill the whole frame and goes behind everything else in one go — quicker and far more exact than dragging its corners out by hand. Then put your words on top.',
    side: 'left',
    align: 'start',
  },

  'sound-section': {
    emoji: '🎵',
    title: 'Music and volume',
    line: 'Music has no picture, so look for its bar below.',
    chips: [
      { emoji: '✂️', text: 'drag ends to trim' },
      { emoji: '🕐', text: 'drag middle to move' },
    ],
    more: 'Music comes in like anything else: add the file, then click it to place it. Select its bar on the timeline and this panel gives you the volume. Dragging the ends trims the track; dragging the middle chooses when the music comes in.',
    side: 'left',
    align: 'start',
  },

  'effects-section': {
    emoji: '🎬',
    title: '34 ways text moves',
    line: 'Typing out, letters rising, a shimmer, numbers counting up.',
    chips: [
      { emoji: '👀', text: 'each one previews' },
      { emoji: '🐢', text: 'speed changes it' },
    ],
    more: 'This is where a plain title turns into something worth watching. Every one plays right here as you browse, so you see it before you commit. Some ask for a little more — a highlight wants to know which word, a counter wants the number to count to.',
    side: 'left',
    align: 'start',
  },

  'motion-section': {
    emoji: '🚀',
    title: 'How it comes and goes',
    line: 'Fade in, slide up, pop — and it works on anything.',
    chips: [{ emoji: '🎯', text: 'presets fill the dials' }],
    more: 'Different from the text effects: this moves the whole box, not the letters, and it works on pictures and blocks too. Presets are the one-click version. Manual is the same thing with the dials showing. Click a preset and you land on Manual seeing exactly what it set — the fastest way to learn what those dials do.',
    side: 'left',
    align: 'start',
  },

  /* ────────────────────────── Bottom ────────────────────────────── */

  shots: {
    emoji: '🎞️',
    title: 'Build it shot by shot',
    line: 'Add shot puts a new moment on the end of the video.',
    chips: [
      { emoji: '✏️', text: 'double-click to rename' },
      { emoji: '👁️', text: 'Sequence shows all' },
    ],
    more: 'A video is a run of moments, and this strip is that run. Click between them to work on one at a time — the timeline then shows only that shot, so twenty quick cuts never become twenty rows to scroll through. Sequence steps back to see the whole thing at once.',
    side: 'top',
    align: 'start',
  },

  transition: {
    emoji: '💫',
    title: 'How a shot arrives',
    line: 'Fade, zoom punch, whip or spin instead of a hard cut.',
    chips: [{ emoji: '🥁', text: 'lands on the beat' }],
    more: 'Every join is a hard cut until you say otherwise. With music loaded each transition lasts half a beat, so it lands with the track rather than near it. Try a zoom punch on a drop and play it back.',
    side: 'top',
    align: 'start',
  },

  beat: {
    emoji: '🥁',
    title: 'Cut in time',
    line: 'Add music and the beats appear along the ruler.',
    chips: [
      { emoji: '👏', text: 'tap along to fix' },
      { emoji: '⌥', text: 'Alt ignores snapping' },
    ],
    more: 'MotionStudio works the tempo out on its own, brightening every fourth line so you can count bars at a glance. From then on Add shot lands on a beat and dragging a shot edge snaps to one — the difference between a reel locked to the track and one that is merely close.',
    side: 'top',
    align: 'start',
  },

  timeline: {
    emoji: '⏱️',
    title: 'When things happen',
    line: 'Left to right is time, and width is how long.',
    chips: [
      { emoji: '🚚', text: 'drag middle to move' },
      { emoji: '✂️', text: 'drag ends to trim' },
    ],
    more: 'Everything you add gets a bar down here. Where it starts is when that thing appears. Click anywhere in the track to jump the video to that moment. If something has motion on it you will see slim bars inside its clip — drag those to change when the animation happens without moving the clip.',
    side: 'top',
    align: 'start',
  },

  tracks: {
    emoji: '🗂️',
    title: 'Layers, top one in front',
    line: 'Each row is one thing, and the top row wins.',
    chips: [
      { emoji: '🌍', text: 'square = whole video' },
      { emoji: '🗑️', text: 'bin removes it' },
    ],
    more: 'Click a name to select it. The small square beside it is the one worth knowing: press it and that item plays through the whole video instead of only this shot — exactly what you want for a background or a music track. It turns into a stack icon once it is on.',
    side: 'top',
    align: 'start',
  },
};
