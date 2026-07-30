# MotionStudio — User Guide

MotionStudio is a browser-based video maker. You place text, images, video, and
audio on a canvas, arrange them over time on a timeline, animate them, and export
a real video file. Think **Canva for programmatic video** — it's built on
[Remotion](https://remotion.dev), so what you preview is what you export.

---

**Requires a laptop or desktop screen (≥1024px wide).** The dashboard and
editor use fixed multi-panel layouts (timeline, canvas, properties) that
don't work on phones or small tablets — visiting either on a small screen
shows a "use a bigger screen" message instead. The landing page and sign-in
are fully usable on mobile, so you can sign up on your phone and pick up the
editor later on a bigger screen.

---

## 1. Quick start (2 minutes)

1. On the landing page, **sign in** (Google, email, or **Continue as guest**) —
   then on the **Dashboard**, click **New Project**, give it a name, pick an aspect
   ratio (16:9 / 9:16 / 1:1) and a frame rate (24 / 30 / 60), then **Create**.
   *In a hurry?* Before you have any projects the Dashboard shows a
   **Try a demo project** button — one click builds a finished template project
   and opens it in the editor, so you can skip straight to step 3.
2. In the editor, click the **T** button in the top toolbar → a text box appears
   on the canvas.
3. Double-click the text to type your own words. Click once to select it, then
   drag / resize / rotate it.
4. With it selected, open the **Properties** panel (right) → **Animation** →
   click **+ Fade In**.
5. Press **▶ Preview** (top-right) or the **▶** in the timeline → watch it play.
6. Click **Export** → pick a format → follow the two steps to render a video.

That's the whole loop: **add → arrange → animate → preview → export.**

**A short walkthrough runs the first time you open the editor**, pointing out
the parts that aren't obvious — the **animated background** button, the
**blocks** menu (terminal, code panel, progress steps, confetti), the
**project settings** readout in the toolbar (which is a button that reshapes the
project), **Add media** and **Stock**, and the **Effects** section where the 34
text effects live.

The tour only shows steps whose panel is actually on screen. The Effects section
exists only while a text element is selected, and the transition picker only
exists inside a shot that has something before it — so **replaying the tour with
some text selected and a second shot added shows more than the first run did**.
Worth doing once you have something on the canvas. Replay it any time from the
**?** menu in the toolbar → **Replay tour**; that also brings back any hint you
dismissed with "don't show again".

**Hints.** When something changes on its own — a tempo detected, another tab
taking over the project — MotionStudio says so in the top-right corner rather
than leaving you to work it out. Each one can be dismissed for good.

---

## 2. The interface

```
┌──────────────────────────────────────────────────────────┐
│  Toolbar   (logo · undo/redo · +Text · settings · ▶ · Export) │
├──────────┬─────────────────────────────────┬─────────────┤
│  Assets  │                                 │  Properties │
│  (media  │            Canvas               │  (edit the  │
│  library)│      (your video frame)         │   selected  │
│          │                                 │   element)  │
├──────────┴─────────────────────────────────┴─────────────┤
│  Timeline   (layers · clips · playhead · play controls)   │
└──────────────────────────────────────────────────────────┘
```

- **Toolbar** — global actions (undo/redo, add text, project settings, play, export)
- **Assets** (left) — upload and manage images, video, audio
- **Canvas** (center) — the actual video frame; select and arrange elements here
- **Properties** (right) — edit whatever element is selected
- **Timeline** (bottom) — control *when* things happen and *which layer* is on top

---

## 3. Projects

- **Create**: Dashboard → **New Project**. Pick a **template** from the list on the
  left — a live preview of it plays on the right — then click **Use Template**.
  The template sets the aspect ratio, frame rate and length for you, and the
  project opens with its text and background already animated; edit the text and
  you have a finished clip. Choose **Blank project** instead for an empty canvas,
  where you pick aspect ratio and frame rate yourself.
- **Templates available**: *Announce* (Feature shipped, Now live, Coming soon,
  Metric milestone, Milestone counter, Changelog drop) · *Dev & Product* (CLI
  demo, Code drop, How it works, Stack marquee) · *Hooks* (Bold question, Quote
  card, Stat drop, Wait for it, Before → after) · *Offers* (New offer, Product
  drop, Testimonial, Price reveal) · *Basics* (Title card, Outro/CTA).
- **Your first project**: with nothing saved yet, the Dashboard shows a
  first-run page instead of an empty grid — a live-playing template preview, a
  three-step summary of how a video gets made, and two ways in: **Try a demo
  project** (creates a filled-in project and opens the editor immediately) or
  **New Project** (the full template picker).
- **While you still have only a few projects** (fewer than five), a compact
  version of that three-step summary sits under the grid, with a shortcut to
  open a demo project. It's there as a refresher if you come back after a while
  and don't remember the flow. Dismiss it with the **×** and it won't return; it
  also disappears on its own once you have five projects.
- **Open**: click a project card on the Dashboard. Each card shows a real frame
  of that project, and animates (muted) when you hover it — so you can tell your
  projects apart at a glance instead of reading names.
- **Grouped by shape**: the Dashboard splits your projects into **Landscape**,
  **Portrait** and **Square** sections, so cards of the same format line up
  instead of making a ragged grid. A section only appears when you have
  projects in it.
- **Leaving the editor**: the **←** button or the **MotionStudio logo** in the
  editor toolbar takes you back to your projects. Nothing needs saving first —
  edits autosave a couple of seconds after you stop.
- **Change aspect ratio / frame rate anytime**: toolbar → the **`16:9 · 30 fps`**
  chip → adjust in the popover. The canvas updates instantly.
- **Autosave**: your projects **and** uploaded media are saved automatically in
  the browser and survive a page reload. (No Save button needed.)
- **Cloud sync**: when signed in, projects also save to your account a couple of
  seconds after every edit, and load back on any device you log in from. Media
  files stay on the device you uploaded them from (cloud renders can still use them).
- **One tab at a time**: a project can only be *edited* in one tab. Open the
  same project in a second tab and it asks whether to **take over here** or
  **open read-only**. Take over and the first tab switches to read-only with a
  banner, so it stops saving rather than overwriting your newer work — this used
  to lose changes silently. A read-only tab can take the project back at any
  time with **Edit here**, and picks it up automatically if the editing tab
  closes. Different projects in different tabs are unaffected.
- **Duration**: 10 seconds by default. Change it (5 / 10 / 15 / 30 / 60 / 90s) in
  the same settings popover. Changing the frame rate keeps the length in seconds —
  for the project **and** for every clip on the timeline, so nothing speeds up or
  slows down when you switch between 30 and 60 fps.
  **Note for 60s and 90s projects:** use **Cloud Render**. Browser export can't
  draw text effects, animated backgrounds or blocks (see §12), so a long project
  built from templates would export missing most of what you see.
- **Delete**: hover a project card on the Dashboard → trash icon → confirm.
  Removes the project and its media everywhere it's stored — this device,
  the cloud, and any other browser you've signed into. Can't be undone.

---

## 4. Adding content

### Text
Toolbar → **T**. A text box appears centered on the canvas.

**While an element is selected its motion is paused** so you can position it —
an entrance effect starts fully transparent, which would make the thing you're
dragging invisible. A note on the canvas says so when it applies; press
**Preview** to watch the motion play.

### Images, video, audio
1. Open the **Assets** panel → **Upload** tab.
2. **Drag files** onto the drop zone, or click **Browse Images / Videos / Audio**.
3. Your uploads appear as thumbnails under the **Images / Videos / Audio** tabs.
4. To place one on the canvas:
   - **Click** a thumbnail → it's added centered, or
   - **Drag** a thumbnail onto the canvas → it lands exactly where you drop it.
5. **Audio** has no on-screen visual — it drops straight onto the timeline as a
   sound clip.
6. Remove an asset from the library with the **×** on its thumbnail (hover).
7. **"Re-upload needed"** on a tile means that file isn't on this device — it was
   added from another browser or session and only the reference synced across.
   Elements using it render as empty rather than breaking the project. Re-add
   the file, or remove the tile.

### Stock photos & video (Pexels)
Open the **Assets** panel → **Stock** tab. Search, toggle **Photos**/**Videos**,
and click a result to import it into your project's asset library — from there
it works exactly like an upload (click or drag onto the canvas). Requires
being signed in.

Supported: common image (png/jpg/gif/webp), video (mp4/webm/mov), and audio
(mp3/wav/…) formats your browser understands.

---

## 5. Editing on the canvas

| Action | How |
|---|---|
| Select | Click an element |
| Move | Drag it |
| Resize | Drag a corner/edge handle |
| Rotate | Drag the rotation handle above it |
| Edit text | **Double-click** the text, type, then Esc or click away |
| Deselect | Click empty canvas, or press **Esc** |
| Delete | The trash icon in the Properties panel header or on the timeline row — or select it and press **Delete** / **Backspace** |

The percentage at the bottom of the canvas is the current zoom-to-fit scale.

---

## 6. The Properties panel

Shows controls for the selected element. Sections vary by type:

**Transform**, **Layer** and **Motion** start collapsed, so the controls that
say what an element *is* are on screen without scrolling. Click a header to
open it; your choice is remembered. Headers that can be cleared show a **↺** on
hover — currently Motion, which resets to no animations.

**Text** — Content, Font size, Color, and **Text Effect** (see §7a).

**Transform** (text / image / video) — X, Y, Width, Height, Rotation, Opacity.
Values are in composition pixels (e.g. 1920×1080).

> **Every number here can be dragged.** Press on a value and slide sideways to
> scrub it; hold **Shift** to move ten times faster. Click without dragging and
> it becomes a text field, so you can still type an exact number and press
> Enter (or Escape to cancel). Bounded values like Opacity show a filled track
> behind them so you can see where you are in the range.

**Layout** (image / video) — **Make Background**: one click resizes the element
to fill the whole canvas, resets its position/rotation, and sends it behind
every other layer. The fastest way to turn an uploaded photo or clip into a
background.

**Layer** (text / image / video) — restack depth:
- **To front / To back** — jump to the very top / bottom
- **Forward / Backward** — one step at a time

**Sound** (audio) — Volume.

**Animation** (text / image / video) — see the next section.

---

## 7. Animations

Animations make a property change **over time** — fade, slide, scale, spin.

### Add a preset
Properties → **Animation**:
- **Enter**: Fade In, Slide Up, Slide In, Pop In
- **Exit**: Fade Out, Slide Out, Pop Out

Presets **stack** — click several and they combine (e.g. Fade In + Slide Up).

### Add a single property
Use **＋ Add property…** to add one bare animation (Opacity, Position X/Y, Scale,
Rotate) and dial it in yourself.

### Edit an animation (each card)
- **From / To** — start and end value (opacity 0→1, y 60→0)
- **Start** — how many frames after the clip begins it fires
- **Dur** — how many frames it lasts
- **easing** — `linear` (constant), `ease` (smooth), `spring` (bouncy)
- **×** — remove just that animation · **Clear all** — remove them all

### Sequence effects
Give animations different **Start** values to play them in order — e.g. Fade In at
Start 0, then a Scale pulse at Start 20. An **Enter** + an **Exit** on the same
element gives a fade-in-hold-fade-out.

> Tip: a selected element shows its **base pose** (no animations, no text effect)
> so it stays visible and easy to position — entrance effects would otherwise hide
> it at frame 0. Deselect and scrub, or press **▶**, to see the real animation.

---

## 7a. Text effects (34 presets)

Text elements have a second, richer animation system: **Properties → Text Effect**.
Pick one from the dropdown, grouped by style:

- **Premium** — Soft Blur In, Blur Out Up, Focus Blur Resolve, Tracking In…
- **Kinetic** — Per-Character Rise, Bottom-Up / Top-Down Letters, Spring Scale In,
  Kinetic Center Build…
- **Reveal** — Staggered Fade Up, Mask Reveal Up, Line-by-Line Slide, Shimmer Sweep,
  Inline / Marker Highlight…
- **Tech / Glitch** — Typewriter, Matrix Decode, RGB Glitch.

**Every effect previews, and every effect explains itself.** A live looping
preview shows above the picker once an effect is selected, with a one-line
description underneath saying what it's for and what input it expects. Use the
↺ button in the corner to replay it — most entrance effects finish in under a
second, so the loop leaves them sitting on a static end frame.

The list and two-value effects preview with sample data ("Before" → "After",
0 → 100, three list items) rather than your text, precisely because that's what
shows you the shape they need: a **list** effect reads one item per line of the
text box, and a **two-value** effect animates from the text box to the **To**
field beneath it.

**Number effects (Rolling Number, Number Wheel) count between two numbers**, so
they can't display words. The two fields become **Count from** and **Count to**,
and if what's in them isn't a number the panel says so and tells you it will
render as `0` — rather than letting you find out on the canvas. Symbols and
separators are stripped, so `$1,200` counts as 1200; if you need the `$` visible
on screen, use **Slot Machine Roll** instead. Your original text is never
overwritten — switch to a different effect and it comes straight back.

Same idea as the shader preview in §7b.

Controls:
- **Speed** — multiplies the effect's pace (1 = normal, 2 = twice as fast).
- **Cursor blink** — Typewriter only: how many times per second the cursor
  blinks.
- **Highlight word** — for the two Highlight effects only: which word/phrase in
  your text gets the highlight treatment.
- **None (use keyframes)** — turn the effect off and animate with §7 instead.

A text effect **replaces** the element's plain rendering — it plays every time the
clip starts, both in the editor preview and in the export.

---

## 7c. Blocks (terminal, code, steps, confetti)

Toolbar → the **terminal icon (Add Block)** → pick one. Blocks are structured
components that a text effect can't express:

- **Terminal** — a window that types commands and streams output. In
  **Properties → Lines**, write one line each; prefix `$ ` for a command,
  `✓ ` for a success line, `✗ ` for an error. Everything else is plain output.
- **Code block** — a frosted editor window revealing your code line by line.
- **Progress steps** — a pipeline whose steps light up in order, one per line.
  **Direction** switches between horizontal and vertical, and **Track length**,
  **Node size** and **Label size** control how big it draws — raise them if the
  step names look small against a 1920×1080 frame.
- **Confetti** — a celebratory burst. Drop it on top of a finished scene and set
  its clip to start at the moment you want it to fire.

**Watch the clip length.** Each block needs a minimum number of frames to play in
full (the terminal needs the most). If its clip is too short the animation gets
cut off part-way, and the Properties panel will warn you with the number of
frames it needs — lengthen the clip on the timeline to fix it.

---

## 7b. Shader backgrounds (18 presets)

Toolbar → the **✦ (Add Background)** button adds a full-canvas animated background,
placed automatically behind everything else on the canvas.

A live loop preview shows above the picker so you can see each option before
committing to it. Change which shader it shows in **Properties → Background**,
grouped by style:

- **Premium** — Mesh Gradient, Grain Gradient, Warp, Swirl, Water, Spiral, Liquid
  Metal, Color Panels, God Rays, Smoke Ring, Pulsing Border.
- **Tech** — Neuro Noise, Voronoi, Dot Orbit, Dithering.
- **Clean** — Perlin Noise, Simplex Noise.
- **Playful** — Metaballs.

Like any layer, a shader background can be resized, faded, repositioned, or given
keyframe animations from the **Animation** section — it just defaults to filling
the whole frame. Add more than one to layer multiple backgrounds, or use **Layer**
to send one further back / bring one forward.

---

## 8. The timeline

### Beats

**One track under the whole video is the normal way to work.** Audio you add
plays across every shot automatically, and keeps covering new shots as you add
them — up to the length of the track itself. If the video ends up longer than
the music, the music simply stops; nothing is stretched.

Add a music track and MotionStudio measures its tempo in the background, then
marks the beats along the timeline — a brighter line every fourth beat, so you
can count bars at a glance. This is how you cut in time with the music instead
of guessing.

The **♪ button** in the timeline header shows the tempo it found, and opens the
controls:

- **Show beats on the timeline** — turn the marks on or off.
- **Tempo** — drag the number or click to type it.
- **Offset** — where the first beat sits, in milliseconds. Nudge it if the marks
  sit slightly ahead of or behind the music.
- **Tap along** — click in time with the track for a few beats and it takes the
  tempo from you. Often the fastest fix when the reading is wrong.

**Shots cut in time with the track.** Once the beats are showing:

- **Add shot** makes a new shot about a bar long, adjusted so it *ends* on a
  beat — so shots line up with the music even if the video didn't start out
  that way.
- **Dragging a shot's edge** snaps it to the nearest beat. Hold **Alt** while
  dragging if you want a length that deliberately isn't on the beat.
- Each shot in the Sequence view says how long it is in **beats** as well as
  seconds — "4 beats · 2.0s" — because with music that's the unit you're really
  choosing.

Detection works best on music with a strong, steady kick — dance, pop, hip-hop.
It's less reliable on ambient, orchestral, live-played music or speech, and when
it isn't confident it says so and asks you to tap or type instead. A wrong tempo
is always yours to correct; nothing is locked in.

### Shots

A video is a sequence of moments, and the strip above the timeline is where you
arrange them.

- **Add shot** appends a new one and makes the video that much longer (up to the
  90s maximum — past that it tells you to shorten a shot first).
- **Click a shot** to work on it. The timeline below then shows *only* that
  shot's clips, and the ruler covers only its span — so a video made of twenty
  quick cuts doesn't become twenty rows to scroll through.
- **Sequence** steps back to the whole video, drawn as its shots end to end.
  From there, **drag a shot's right edge** to change how long it lasts;
  everything after it moves along to make room. **Drag the shot itself** to
  reorder it — a line shows where it will land, and everything inside it moves
  with it.
- **Double-click a shot** to rename it. Leave the name empty and it goes back to
  "Shot 1", "Shot 2" and so on by position.
- **Transitions**: with a shot open, the control in the strip sets how that shot
  *arrives* — **Cut** (nothing), **Fade**, **Zoom punch**, **Whip** or **Spin**.
  With beats showing, a transition lasts half a beat, so it lands with the music.
  The first shot has no incoming cut, so it has no control. Transitions don't
  appear in the Motion section — they belong to the shot, and that's where you
  change them.
- **Hover a shot and click ×** to delete it — this removes everything inside it
  too, and the video gets shorter. The last remaining shot can't be deleted.
- Anything you add lands in the shot you're looking at, and spans it.
- **Some things belong to the whole video, not one shot** — a background, a
  music track, a watermark. Animated backgrounds and audio are set that way
  automatically when you add them. Anything else can be switched with the small
  **layers icon** on its timeline row: click it to play that element through
  every shot, click again to keep it to the current shot. Video-wide elements
  show up in every shot's timeline, because that's where they actually are.
- Existing projects are one shot covering the whole video, so nothing you have
  already made looks or behaves differently.

The timeline controls **time** and **layers**.

- **Ruler** (top) — second markers; spacing adapts as the video gets longer.
- **Rows** — one per element. This is your **layer stack**: the **top row is the
  front-most** layer on the canvas.
- **Clips** — the bar in each row is when that element is on screen:
  - **Drag the clip body** → move it earlier/later in time
  - **Drag a clip edge** → trim when it starts/ends
- **Animation strip** — the small accent bars at the bottom of a clip are its
  animations:
  - **Drag a bar** → change that animation's **Start**
  - **Drag a bar's right edge** → change its **Duration**
  - (These mirror the Properties **Start/Dur** — edit either.)
- **Playhead** — the vertical line. **Click or drag** anywhere in the track area
  to scrub to that moment; the canvas updates to show that frame.
- **Transport** (top-left of the timeline): **⏮ jump to start**, **▶/⏸ play**.
  The readout shows the current time and frame.

---

## 9. Playback

Press **▶** (in the timeline or the toolbar's **Preview**) to play. The playhead
sweeps, the canvas shows each frame, and video/audio play in sync. It stops at the
end; press **⏮** then **▶** to replay from the start.

(Editor audio/video preview may be muted or depend on your browser's autoplay
rules — the exported video always has correct sound and timing.)

---

## 10. Layers (how depth works)

There is **one canvas**. A "layer" is simply **one element** — they all live in
the same frame and stack by depth. Think of transparent sheets on a projector:
each sheet has its own content, but they overlay into one image.

- Add elements → each is a new layer.
- The **timeline rows** are your layers, top = front.
- Restack with **Properties → Layer** (To front / Forward / Backward / To back).

To build a **scene** (things appearing one after another), place each element's
clip in a different part of the timeline — e.g. an intro clip at 0–2s, the next at
2–4s. Give each an Enter animation at its start and an Exit at its end.

---

## 11. Undo / redo & keyboard shortcuts

| Shortcut | Action |
|---|---|
| **⌘Z** / Ctrl+Z | Undo |
| **⌘⇧Z** / Ctrl+Y | Redo |
| **Double-click** (text) | Edit text |
| **Delete / Backspace** | Delete selected element |
| **Esc** | Deselect / stop editing text |
| **Shift** + drag a number | Move it in steps of ten |
| **Alt** + drag a shot's edge | Resize without snapping to the beat |
| **Double-click** (shot) | Rename it in the sequence |

The same list is in the app under **? → Keyboard shortcuts**. The last three are
worth knowing because you cannot discover them by looking — they change what an
existing drag means rather than adding a control.

Undo/redo covers **every** edit — move, resize, trim, animate, reorder, add,
delete. A single drag counts as one undo step. The toolbar's **↶ / ↷** buttons do
the same. (Undo history resets when you reload; your saved data does not.)

---

## 12. Exporting a video

Click **Export** in the top toolbar. The dialog has **two tabs** — pick the one
that fits:

### Browser tab (free, unlimited)
Renders entirely inside your browser — no server, no terminal.

1. Pick a **Resolution**: Full 1080p / 75% 810p / 50% 540p.
2. Pick a **Quality** (encoder bitrate): Max 40 Mbps / High 20 / Medium 10 / Low 5.
3. Click **Export & download** — a progress bar fills while every frame is rendered
   offline, then the finished MP4 downloads automatically.

**Include effects (Beta).** There are two browser paths. The plain one flattens
each frame onto a canvas, which is fast and dependable but drops text effects,
animated backgrounds and blocks. **Include effects** renders the real
composition and keeps them.

It is **ticked automatically when your project uses any of those**, and left off
when it doesn't — on a plain text-and-images project it would only make the
export slower for an identical file. Untick it any time.

It's slower, and a few things still differ from Cloud Render: gradient-filled
text, 3D transforms and blend modes. If it can't finish, the export falls back
to the plain path so you still get a video, and the dialog tells you that's what
happened.

Under the hood: every frame is drawn to an off-screen canvas in exact order, source
videos are seeked frame-by-frame, all audio is mixed sample-exact
(`OfflineAudioContext`), and the browser's hardware encoder (WebCodecs / H.264)
compresses it. Nothing is uploaded and no quota is used. **Requires Chrome or
Edge** — Safari doesn't support WebCodecs yet.

### Cloud Render tab (any device, quota-based)
Renders on AWS instead of your machine — works in any browser, uses no local CPU,
and always outputs 1080p. Click **Render in cloud**, wait for the progress to
finish, and download the MP4 from the link.

- **Guests** get **1 free cloud render** (tracked per device).
- **Signed-in users** get a monthly quota, shown in the dialog.
- Uploaded media is sent to cloud storage automatically in the background when you
  import it, so cloud renders include your images / video / audio.

**Or from the terminal (advanced):**
```bash
npm run studio    # open Remotion Studio to preview / CLI-render
npm run render    # render the default composition to out/video.mp4
```

---

## 13. Good to know (mental models)

- **Frames, not seconds** — timing is measured in frames. At 30 fps, 1 second = 30
  frames. Animation Start/Dur and clip lengths are all in frames.
- **Composition space** — element X/Y/W/H are in the real output resolution
  (16:9 = 1920×1080). The editor just shows a scaled-down view; the export is
  full size and pixel-identical to what you see.
- **One source of truth** — the canvas, timeline, and properties are three views
  of the same element. Change it anywhere, everywhere updates.
- **Update banner** — if a tab's been open across a new deploy, a small "new
  version available" banner appears at the bottom of the screen. It never
  reloads on its own (so it won't interrupt an edit or export in progress) —
  click Refresh whenever it's convenient.

---

## 14. Example: a simple title card

1. New 16:9 project.
2. **T** → double-click → type your title. Set a big Font size and a color in
   Properties.
3. Animation → **+ Pop In**, then **+ Fade Out**.
4. Upload a background image → **drag** it onto the canvas → **Properties → Layer
   → To back** so it sits behind the text.
5. Press **⏮** then **▶** to preview.
6. **Export** → pick resolution + quality → **Export & download** → the MP4 saves automatically.

---

## 14a. Feedback and "What's new"

Both live under the **?** button in the toolbar, just left of Preview (and in
the dashboard header). Your avatar next to it is identity and sign-out only —
help and identity are separate jobs, and hiding one behind the other made it
undiscoverable.

**Failure surfaces carry a "Report this" link** — a failed browser export, a
failed cloud render, the beta-renderer fallback notice, and a file marked
"Re-upload needed" in the Assets panel. Clicking it opens the feedback form with
the problem already described, so you only add what happened from your side.

- **Send feedback** — pick whether something broke, you want a feature, or it's
  something else, describe it, and send. It reaches a real inbox and replies come
  back to the address you give. Guests have no address on file, so you'll need to
  type one — without it there's no way to tell you it's fixed.
  The form attaches your build, browser, screen size and (in the editor) the
  current project's format and contents. **Click the line above the Send button
  to read exactly what's attached before you send it** — nothing is collected
  that you can't see.
- **What's new** — a short list of what changed recently, in plain terms. It
  opens by itself once per release, and a dot sits on the **?** button until
  you've read it. Brand-new accounts never see it: a changelog needs a "before".

---

## 15. Current limitations

- **Dashboard and editor require a laptop/desktop-sized viewport** (≥1024px
  wide) — they're not usable on phones or small tablets, and show a
  "use a bigger screen" message below that width. The landing page and
  sign-in work on any screen size.
- Project length is chosen from presets (5 / 10 / 15 / 30 / 60 / 90s); no custom
  value yet.
- **Browser export doesn't include text effects, animated backgrounds or
  blocks.** It draws frames onto a plain canvas rather than running the real
  renderer, so those are missing from the file — the export dialog warns you
  when your project uses them. Use **Cloud Render** for anything with effects.
  Browser export is still fine for plain text, images and video, and it's free
  and unlimited.
- **Scene grouping** (moving several elements as one unit) isn't built yet — use
  timeline positioning to sequence.
- **Browser export** requires Chrome or Edge (WebCodecs). On Safari or other
  browsers, use the **Cloud Render** tab instead.
- **Cloud renders are limited** — 1 free for guests, a monthly quota when signed in.
- **Media mostly follows you across devices when signed in** — uploads sync to S3
  in the background, and the editor preview falls back to that copy on a device
  that doesn't have the file locally. It only stays device-only if you're signed
  out when you upload, or open the project elsewhere before the background
  upload finishes.
- Editor preview audio/video may be muted depending on the browser; the export
  always has correct sound and timing.

---

## 16. Under the hood (optional)

MotionStudio is built on an **engine architecture** — a Project owns all the data,
and separate engines (Canvas, Editor, Timeline, Animation, Asset, Rendering) each
own one job. The design decisions are recorded in `docs/adrs/`. This is why adding
a feature rarely breaks another — each engine stays in its lane.
