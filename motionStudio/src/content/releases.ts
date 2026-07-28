/**
 * User-facing release notes, newest first.
 *
 * Deliberately NOT generated from `CHANGELOG.md`. That file is written for
 * whoever maintains this code — it names modules, explains root causes, and
 * records decisions. A user opening "What's new" wants to know what changed for
 * *them*; "parseEffectNumber is now shared between the renderer and the panel"
 * is noise to them and detail worth keeping for us.
 *
 * The cost of that split is drift, so it's covered by the living-docs rule in
 * CLAUDE.md: a release that shipped anything a user can see gets an entry here
 * in the same commit. A stale "What's new" is worse than none — it advertises
 * that nobody is minding the product.
 *
 * `id` is the date the release shipped, and doubles as the "have they seen it"
 * marker, so it must be unique and must only ever move forward.
 */

export type ReleaseChangeKind = 'new' | 'improved' | 'fixed';

export interface ReleaseChange {
  kind: ReleaseChangeKind;
  text: string;
}

export interface Release {
  /** YYYY-MM-DD. Unique, monotonically increasing. */
  id: string;
  title: string;
  changes: ReleaseChange[];
}

export const RELEASES: Release[] = [
  {
    id: '2026-07-28',
    title: 'Effects you can actually preview',
    changes: [
      {
        kind: 'fixed',
        text: 'Adding a second shot used to leave you on a black screen with no music, because the background and the soundtrack belonged to the first shot. Backgrounds and audio now play through the whole video. Any other element can be switched between "this shot only" and "the whole video" with the layers icon on its timeline row.',
      },
      {
        kind: 'new',
        text: 'Build a video shot by shot. Add shot puts a new moment on the end, and you work on one at a time \u2014 the timeline shows only that shot, so twenty quick cuts never become twenty rows to scroll through. Sequence steps back to see the whole video, where you can drag a shot\u2019s edge to change how long it lasts and drag the shot itself to reorder it. Double-click a shot to name it.',
      },
      {
        kind: 'fixed',
        text: 'Changing the frame rate used to silently change how long everything ran for — switch 30 to 60 and a three-second clip played for a second and a half. Every clip now keeps the length in seconds you gave it.',
      },
      {
        kind: 'fixed',
        text: 'Opening the same project in two tabs could quietly undo your work — whichever tab saved last won, and the other one was never told. Only one tab can edit a project now. The second offers to take over or open read-only, and the tab that loses says so instead of dropping changes on the floor.',
      },
      {
        kind: 'improved',
        text: 'The Properties panel opens on the controls you came for. Transform, Layer and Motion now start collapsed, so what an element actually says and looks like is on screen without scrolling. Open any of them once and it stays that way.',
      },
      {
        kind: 'new',
        text: 'Motion has a reset. Presets stack up when you click more than one, and clearing them meant removing each animation by hand — now there is a single button on the section header.',
      },
      {
        kind: 'improved',
        text: 'Every number in the Properties panel can now be dragged. Press on a value and slide sideways to change it, holding Shift to move in bigger steps. Click without dragging and you can still type an exact number, exactly as before.',
      },
      {
        kind: 'new',
        text: 'A feedback form and a "What\u2019s new" list under the ? button in the toolbar. When an export or an upload fails, "Report this" sends the details straight through — you just add what you were doing.',
      },
      {
        kind: 'fixed',
        text: 'Project cards on the dashboard played sound when you hovered them. They\u2019re silent now.',
      },
      {
        kind: 'fixed',
        text: 'Eleven text effects showed an empty preview box — the counters, the before/after swaps and the list effects. All 34 now preview properly.',
      },
      {
        kind: 'new',
        text: 'Every text effect has a one-line description under its preview saying what it does and what input it expects, plus a replay button.',
      },
      {
        kind: 'fixed',
        text: 'Applying a number effect to ordinary words silently replaced them with 0. It now tells you before it happens, and your text is never overwritten.',
      },
      {
        kind: 'fixed',
        text: 'The Progress steps block drew as a bare line with its labels stacked on top of each other. It now lays out properly and you can set its size and direction.',
      },
    ],
  },
  {
    id: '2026-07-27',
    title: 'Exports keep your effects',
    changes: [
      {
        kind: 'new',
        text: 'Browser export now keeps text effects, animated backgrounds and blocks by default when your project uses them. If it can’t finish, it falls back to the plain export rather than failing, and tells you.',
      },
      {
        kind: 'fixed',
        text: 'Uploads and cloud render started failing with "Invalid session" after roughly an hour of editing. Sessions now refresh themselves.',
      },
      {
        kind: 'new',
        text: 'A first-run dashboard with a one-click demo project, and a short refresher that stays until you have a few projects.',
      },
      {
        kind: 'improved',
        text: 'The guided tour now covers animated backgrounds, blocks, project settings, uploads, stock footage and text effects.',
      },
      {
        kind: 'fixed',
        text: 'Project cards on the dashboard stalled after the first frame when hovered, and the selection handles floated over open dialogs.',
      },
    ],
  },
];

export const LATEST_RELEASE_ID = RELEASES[0]?.id ?? '';
