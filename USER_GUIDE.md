# MotionStudio — User Guide

MotionStudio is a browser-based video maker. You place text, images, video, and
audio on a canvas, arrange them over time on a timeline, animate them, and export
a real video file. Think **Canva for programmatic video** — it's built on
[Remotion](https://remotion.dev), so what you preview is what you export.

---

## 1. Quick start (2 minutes)

1. On the **Dashboard**, click **New Project**, give it a name, pick an aspect
   ratio (16:9 / 9:16 / 1:1) and a frame rate (24 / 30 / 60), then **Create**.
2. In the editor, click the **T** button in the top toolbar → a text box appears
   on the canvas.
3. Double-click the text to type your own words. Click once to select it, then
   drag / resize / rotate it.
4. With it selected, open the **Properties** panel (right) → **Animation** →
   click **+ Fade In**.
5. Press **▶ Preview** (top-right) or the **▶** in the timeline → watch it play.
6. Click **Export** → pick a format → follow the two steps to render a video.

That's the whole loop: **add → arrange → animate → preview → export.**

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

- **Create**: Dashboard → **New Project**. Choose name, aspect ratio, frame rate.
- **Open**: click a project card on the Dashboard.
- **Change aspect ratio / frame rate anytime**: toolbar → the **`16:9 · 30 fps`**
  chip → adjust in the popover. The canvas updates instantly.
- **Autosave**: your projects **and** uploaded media are saved automatically in
  the browser and survive a page reload. (No Save button needed.)
- **Duration**: 10 seconds by default. Change it (5 / 10 / 15 / 30s) in the same
  settings popover. Changing the frame rate keeps the length in seconds.

---

## 4. Adding content

### Text
Toolbar → **T**. A text box appears centered on the canvas.

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
| Delete | Select it, press **Delete** / **Backspace** |

The percentage at the bottom of the canvas is the current zoom-to-fit scale.

---

## 6. The Properties panel

Shows controls for the selected element. Sections vary by type:

**Text** — Content, Font size, Color.

**Transform** (text / image / video) — X, Y, Width, Height, Rotation, Opacity.
Values are in composition pixels (e.g. 1920×1080).

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

> Tip: a selected element shows its **base pose** (no animation) so it's easy to
> position. Press **▶** (or deselect and scrub) to see the animation play.

---

## 8. The timeline

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

Undo/redo covers **every** edit — move, resize, trim, animate, reorder, add,
delete. A single drag counts as one undo step. The toolbar's **↶ / ↷** buttons do
the same. (Undo history resets when you reload; your saved data does not.)

---

## 12. Exporting a video

Click **Export** in the top toolbar — a dialog opens entirely inside the browser.
No terminal, no server, no Node.js required.

**Steps:**
1. Pick a **Resolution**: Full 1080p / 75% 810p / 50% 540p.
2. Pick a **Quality** (encoder bitrate): Max 40 Mbps / High 20 / Medium 10 / Low 5.
3. Click **Export & download** — a progress bar fills while every frame is rendered
   offline, then the finished MP4 downloads automatically.

**What happens under the hood:**
- Every frame is rendered to an off-screen canvas in exact order — nothing is
  dropped or rushed.
- Source videos are seeked frame-by-frame to guarantee accuracy.
- All audio tracks (music, sound effects, video soundtracks) are mixed sample-exact
  using `OfflineAudioContext` and encoded into the same MP4.
- The browser's hardware encoder (WebCodecs / H.264) handles compression.

**Requirements:** Chrome or Edge (WebCodecs). Safari is not supported yet.

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

## 15. Current limitations

- Project length is chosen from presets (5 / 10 / 15 / 30s); no custom value yet.
- **Scene grouping** (moving several elements as one unit) isn't built yet — use
  timeline positioning to sequence.
- Export requires **Chrome or Edge** (WebCodecs); Safari is not yet supported.
- Editor preview audio/video may be muted depending on the browser; the export
  always has correct sound and timing.

---

## 16. Under the hood (optional)

MotionStudio is built on an **engine architecture** — a Project owns all the data,
and separate engines (Canvas, Editor, Timeline, Animation, Asset, Rendering) each
own one job. The design decisions are recorded in `docs/adrs/`. This is why adding
a feature rarely breaks another — each engine stays in its lane.
