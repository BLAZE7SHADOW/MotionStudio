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
    id: '2026-08-07',
    title: 'Your music comes back when you reload',
    changes: [
      {
        kind: 'fixed',
        text: 'Reopening a project could show your photos, video and music as “Re-upload needed”, as though they had been lost. Nothing ever was — the files were safe the whole time, and the app was throwing away the link to them a second after finding it. Reloading now brings your media straight back.',
      },
    ],
  },
  {
    id: '2026-08-06',
    title: 'The tour actually teaches you the app',
    changes: [
      {
        kind: 'fixed',
        text: 'Adding a shot now takes you to it properly. It opened the new shot but left the playhead back in the previous one, so the canvas showed the shot before the one you were editing — and the first thing you added seemed to vanish.',
      },
      {
        kind: 'improved',
        text: 'The walkthrough is now straight with you about exporting: a quick browser export flattens the video and drops your animated background, blocks and text effects unless you tick “Include effects”. Cloud Render always matches what you see in the editor.',
      },
      {
        kind: 'improved',
        text: 'The first-run walkthrough now covers the whole app in plain language, not just the toolbar. It explains what a shot is and how to build a video out of them, what a clip’s position and width on the timeline actually mean, the difference between dragging a clip’s middle and dragging its end, how music works, how to turn a photo into your background, and what the 34 text effects do.',
      },
      {
        kind: 'new',
        text: 'Steps for things that only appear once you’ve selected something — sound, text effects, motion — no longer go missing on a brand-new empty project. You get the explanation either way, pointed at the panel the feature lives in.',
      },
      {
        kind: 'new',
        text: 'The walkthrough now points out the parts nobody was finding: that every number box in the Properties panel can be dragged sideways like a slider, that ⌘Z undoes anything, and that the small square next to a timeline row makes that item play through the whole video instead of just the shot you’re in — which is what you want for a background or a music track.',
      },
    ],
  },
  {
    id: '2026-07-30',
    title: 'The app explains itself',
    changes: [
      {
        kind: 'new',
        text: 'You can paste media straight in. Copy a screenshot and press ⌘V anywhere in the editor — no saving it to disk first just to find it in a file picker.',
      },
      {
        kind: 'improved',
        text: 'MotionStudio no longer opens on a black rectangle while it loads: the panels are drawn immediately, before any of the app has arrived.',
      },
      {
        kind: 'fixed',
        text: 'On a tablet held upright, MotionStudio used to tell you to switch to a laptop. It now says to turn your device sideways, which is all it actually needs.',
      },
      {
        kind: 'new',
        text: 'The Properties panel now marks which values are animated with a small diamond — so a rotation sitting at 0° that actually spins during playback no longer looks static. The mark shows on the section heading too, even when it’s collapsed.',
      },
      {
        kind: 'improved',
        text: 'Motion is split into Presets and Manual. Pick a preset and it drops you straight into Manual showing exactly what it set, which is the quickest way to learn what those controls do.',
      },
      {
        kind: 'new',
        text: 'The toolbar now says whether your work has reached the cloud — saving, saved, or offline. If you lose your connection it says so plainly and keeps your changes on this device, then saves them by itself the moment you’re back.',
      },
      {
        kind: 'improved',
        text: 'Deleting a shot now tells you how many elements go with it before it happens, and reminds you that your background and music stay. Empty shots still delete in one click — no dialog for nothing.',
      },
      {
        kind: 'new',
        text: 'MotionStudio now tells you when something changes on its own. Add a music track and it says what tempo it found and what that changes — instead of a grid of lines appearing on your timeline with no explanation. If a tempo is hard to read it says so, rather than quietly guessing. Every hint has a "don’t show again", and replaying the tour brings them all back.',
      },
      {
        kind: 'new',
        text: 'The tour now covers cutting to the beat and how a shot arrives — the two things it never mentioned, and the two most worth knowing.',
      },
      {
        kind: 'new',
        text: 'A keyboard shortcuts list under the ? button, including the two that are impossible to discover: hold Shift while dragging a number to move it in tens, and hold Alt while dragging a shot’s edge to ignore the beat.',
      },
      {
        kind: 'improved',
        text: 'If another tab takes over the project you’re editing, you’re told the moment it happens rather than finding out when your changes don’t stick — and you’re told again when you get it back.',
      },
    ],
  },
  {
    id: '2026-07-28',
    title: 'Effects you can actually preview',
    changes: [
      {
        kind: 'new',
        text: 'Shots can now arrive with a transition instead of a hard cut \u2014 fade, zoom punch, whip or spin. Pick one from the shot strip and it lasts half a beat, so it lands with the music rather than near it.',
      },
      {
        kind: 'fixed',
        text: 'Clicking the music track or the background used to throw you out of the shot you were editing, back to the whole-sequence view.',
      },
      {
        kind: 'fixed',
        text: 'A music track stopped where the video used to end, so adding shots left the last part of your video silent. One track now plays across the whole sequence, however many shots you add \u2014 up to the end of the track itself.',
      },
      {
        kind: 'new',
        text: 'Add a music track and MotionStudio works out its tempo, then marks the beats along the timeline — brighter lines every fourth beat so you can count bars at a glance. If it reads the tempo wrong you can type it, drag it, or just tap along in time.\n\nShots then cut in time with the track: Add shot lands on a beat, dragging a shot\u2019s edge snaps to one (hold Alt if you want an odd length), and each shot says how many beats it lasts.',
      },
      {
        kind: 'fixed',
        text: 'Some audio and video files could stop uploading entirely — no error, the file just never appeared. Anything slow to read now gets added anyway.',
      },
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
