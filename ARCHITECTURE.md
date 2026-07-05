# MotionStudio — Architecture & Engineering Decisions

A technical case study of how MotionStudio is built: the architecture, the problems
hit along the way, what was chosen, and **why**. Companion to `USER_GUIDE.md` (how to
use it) and `docs/adrs/` (formal decision records).

---

## 1. What it is

A **browser-based, programmatic video editor** built on [Remotion](https://remotion.dev).
Place text / image / video / audio on a canvas, arrange them on a frame-accurate
timeline, animate them, and export to MP4 / WebM / GIF / MOV. No backend.

- ~3,800 lines of TypeScript, 7 engines, 60 logically-grouped commits.
- React 19 · TypeScript (strict) · Vite · Tailwind v4 · Zustand · React Router v7 ·
  Remotion (+ @remotion/player, CLI) · react-moveable · shadcn/ui · IndexedDB · localStorage.

---

## 2. Tech stack — and why each

| Choice | Why |
|---|---|
| **Remotion** | The product renders real video. Remotion gives frames, `<Sequence>`, `<Player>`, and `renderMedia` — building a renderer + encoder ourselves would be months. |
| **Zustand** | Global state with zero boilerplate: one `create()` → a hook + selectors. No providers/reducers. |
| **React Router v7** | `/` dashboard, `/editor/:projectId` — the URL is the single input that selects a project. |
| **react-moveable** | Drag/resize/rotate handles are a solved problem; building them is weeks of hit-testing math that teaches nothing about *this* product. |
| **Tailwind v4 + shadcn/ui** | Fast, consistent dark UI via design tokens; accessible primitives (Dialog, Popover, Select) without reinventing them. |
| **IndexedDB + localStorage** | Client-only persistence: structured state is small JSON (localStorage); media is large binary (IndexedDB). |

---

## 3. Architecture — the mental model

Two layers, one rule.

```
engines/   own DATA + LOGIC   (no UI)
features/  own UI             (compose engines)
```

**The rule: the `Project` is the aggregate root.** One `Project` object owns *all*
data — elements, assets, settings. Engines don't keep their own copies; they expose
**verbs** that read/write the one Project through a single mutation point
(`updateProject`).

Everything downstream falls out of this:
- **Undo/redo** hooks the one mutation point → covers every edit automatically.
- **Autosave** persists the one Project → nothing to wire per-feature.
- **No state drift** — there's only ever one source of truth.

### The three data "moves" (immutability everywhere)
State is never mutated; new objects/arrays are always built:
```
add     → [...arr, x]
remove  → arr.filter(x => x.id !== id)
update  → arr.map(x => x.id === id ? { ...x, ...patch } : x)
```
Why: React/Zustand detect change by **reference identity**, and undo snapshots must
stay frozen. A single `.push()` would skip re-renders and corrupt history.

---

## 4. The engines

| Engine | Owns | Notes |
|---|---|---|
| **project** | The `projects` array (the aggregate root) + undo history + persistence | The only real *store* |
| **editor** | Ephemeral view state: `selectedElementId`, `currentFrame`, `isPlaying`, `zoom` | Deliberately *not* persisted |
| **canvas** | Verbs: `addText/Image/Video/Audio`, `updateElement`, `removeElement`, `reorderLayer` | A **hook**, not a store — owns no data |
| **timeline** | Pure frame↔pixel math (`scale.ts`) | Stateless helpers |
| **animation** | `interpolate`/`spring` evaluation + presets | Pure functions |
| **rendering** | The shared `style.ts` + Remotion `MotionComposition` | One renderer, two consumers |
| **asset** | Upload, metadata probing, blob persistence | Reads/writes `project.assets` |

**Why some engines are stores and others are hooks:** a store *owns state* (Project,
Editor). A hook *owns verbs* over state it doesn't hold (Canvas, Asset read the active
project and write back via `updateProject`). Keeping element data on the Project — not
in the Canvas engine — is the aggregate root enforced.

---

## 5. Core systems & the decisions behind them

### Composition-space coordinates (ADR-003)
Elements are stored in **output resolution** (16:9 = 1920×1080), not screen pixels.
The editor renders a **scaled** view.
```
data → screen : × scale     (shrink to fit the window)
screen → data : ÷ scale     (grow a drag/drop back to real coords)
```
**Why:** the export must match the editor. Store coordinates once at final resolution,
and every view (editor at ~50%, Remotion at 100%) just multiplies by its own scale.
This screen↔composition conversion powers canvas dragging, drop-to-canvas, and scrubbing.

### WYSIWYG via one shared renderer (ADR-002)
The editor preview and the Remotion export call the **same** style function
(`engines/rendering/style.ts`), differing only by the `scale` argument (editor `< 1`,
Remotion `= 1`). **Why:** WYSIWYG isn't "we tried to match" — it's "they run identical
code," so the preview is *mathematically* the export.

### Frame-based temporal model → Remotion `<Sequence>`
Every element carries `startFrame` + `durationInFrames`, mapped 1:1 to
`<Sequence from={startFrame} durationInFrames={…}>`. Visibility is the half-open window
`[start, start+duration)`. **Why frames, not seconds:** Remotion is frame-based, and
frames are exact (no floating-point drift).

### Timeline coordinate math
Same idea as composition space, on the time axis:
```
pxPerFrame = trackWidth / totalFrames
frameToX(f) = f × pxPerFrame     (draw a clip/ruler tick)
xToFrame(x) = round(x / pxPerFrame)   (scrub / drag)
```
Dragging a clip to retime it is `updateElement(id, { startFrame })` — the **same verb**
as canvas dragging (`x`), through the same door.

### Time-based playback clock
Playback advances by **real elapsed time × fps**, not `currentFrame++` per animation
frame. **Why:** `requestAnimationFrame` fires at the monitor's rate (60/120Hz, drops
under load); `frame++` would play 30fps content at 60fps on a 60Hz screen. Measuring
wall-clock time keeps speed correct on any hardware.

### Animation engine
Built on Remotion's `interpolate` (with `extrapolate: 'clamp'` so animations *finish*
instead of extrapolating to infinity) and `spring` (physics/overshoot; needs `fps`
because a bounce is real-time). Multiple animations **accumulate** into one transform
(factors multiply, offsets add) — the same algebra compositors use.

### Persistence — split by data shape
```
metadata (JSON, small)  → localStorage via Zustand persist
media bytes (binary)    → IndexedDB
```
Object URLs (`blob:`) die on reload, so we persist the **bytes** and mint a fresh URL
each session (`rehydrateAssets`). **Why the split:** localStorage can't hold large
binaries; IndexedDB is built for Blobs. Editor view state is intentionally *not*
persisted (you don't want to reopen frozen mid-playback).

### Undo/redo — immutable snapshots + coalescing
History is snapshots of the `projects` array. Because edits build new objects
immutably, snapshots **share unchanged sub-objects** (cheap — no deep copies). Rapid
edits within ~500ms **coalesce** into one step, so a whole drag or typing burst = one
undo. **Why it was nearly free:** every edit already flows through `updateProject`.

### Export — Remotion CLI (ADR-002)
Remotion renders in **Node** (headless Chrome + FFmpeg), not the browser. A
`registerRoot` entry exposes the composition; `calculateMetadata` derives per-project
size/fps/duration from props; the in-app Export dialog produces the `npx remotion
render … --props … --codec …` command and a `props.json`. Formats via `--codec`
(h264/vp8/gif/prores).

---

## 6. Problems faced & how they were solved

Real bugs and gotchas from the build — the interesting part.

**`Omit` on a discriminated union collapses to common fields.**
`CanvasElement = Text | Image | Video | Audio`. `Omit<union, 'id'>` keeps only *shared*
keys, so `updateElement` silently lost `content`, `assetId`, etc. → Fixed with an
`ElementPatch` = intersection of per-member partials (every field of every member,
optional).

**Remotion `<Composition>` inferred props as `unknown`.**
An `interface` isn't assignable to `Record<string, unknown>` (it could be augmented); a
`type` alias is. Changing `interface ExportProps` → `type ExportProps` fixed inference.

**WYSIWYG drift risk.** Solved by the single shared `style.ts` used by editor *and*
Remotion — impossible to drift because it's one function.

**`contenteditable` cursor jumped to start on every keystroke.**
React re-rendering the element reset the DOM selection. → Set initial text via a ref on
mount only, then let `onInput` push to the store without React re-writing the node.

**react-moveable under a scaled canvas.** Element coords are composition-space, the
stage is scaled. → Drive drag/resize with client-pixel deltas ÷ scale, committing
composition coords on release.

**Video preview in the editor.** DOM `<video>` isn't Remotion. → Seek on scrub (exact
frame), play natively while playing (seeking every frame is janky); muted for reliable
programmatic autoplay. The Remotion export (`<OffthreadVideo>`) is authoritative.

**Layer reorder did nothing.** The first attempt shuffled array order, but stacking is
driven by `zIndex`, not array order. → Rewrote it to reassign contiguous `zIndex`.

**Undo stepped pixel-by-pixel.** Clip drags commit on every pointer-move. → Time-based
coalescing groups a burst into one undo step.

**Undo restored dead media URLs.** Asset rehydration calls `updateProject`, which would
enter history → undo would revert to stale `blob:` URLs. → Rehydration is a *silent*
update (`{ history: false }`).

**`blob:` URLs can't be rendered in Node.** The Export dialog flags it: replace
`assets[].url` in `props.json` with real file paths before rendering uploaded media.

**shadcn CLI wrote to a root `@/` folder.** Root `tsconfig.json` lacked `paths`. →
Added `paths` so `@/` resolves to `src/`.

**White-on-white text.** Default text color was `#ffffff` on a white canvas — invisible,
no error. A reminder that "no crash" ≠ "correct."

---

## 7. Trade-offs & limitations (honest)

- **Export is terminal-based** (no one-click in-app render) — a true in-browser render
  needs a backend/Lambda; Remotion can't render in a tab.
- **Uploaded media in export** needs real URLs in `props.json` (`blob:` is browser-only).
- **Editor audio/video preview** is muted / browser-autoplay-dependent; the export is
  authoritative for sound and timing.
- **No scene grouping yet** — sequencing is done by positioning clips on the timeline.
- **Fonts** fall back to system sans-serif in the Node render (not bundled yet).

---

## 8. What each decision bought us

| Decision | Payoff |
|---|---|
| Project as aggregate root | Undo/redo + autosave added at *one* point, covered *everything* |
| Engines own verbs, not state | No state drift; features stayed thin and composable |
| One shared renderer | WYSIWYG guaranteed, not hoped for |
| Composition-space coords | Editor preview = export, at any zoom |
| Frames + `<Sequence>` | Timeline maps directly onto Remotion; export "just works" |
| Immutable updates | Cheap undo (structural sharing) + reliable re-renders |
| Discriminated-union elements | Adding a new element type = one type + one renderer |

---

## 9. Lessons

- **A single mutation path is a superpower** — it's what made undo, autosave, and
  WYSIWYG cheap. Decide *where* data changes before deciding *how*.
- **Store data in the target domain** (output resolution, frames), not the view's
  units — views come and go, the data shouldn't.
- **"No error" isn't "correct"** (white-on-white text, silent `Omit`-on-union).
- **Buy the boring parts** (moveable handles, encoding) and build the parts that are
  actually your product (the composition model, the timeline, the animation system).

---

*Built with AI assistance and documented decision-by-decision. Every choice here can be
walked through and defended, and the architecture is designed to be extended.*
