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
