# MotionStudio — Architecture & Engineering Decisions

A technical case study of how MotionStudio is built: the architecture, the problems
hit along the way, what was chosen, and **why**. Companion to `USER_GUIDE.md` (how to
use it) and `docs/adrs/` (formal decision records).

---

## 1. What it is

A **browser-based, programmatic video editor** built on [Remotion](https://remotion.dev).
Place text / image / video / audio on a canvas, arrange them on a frame-accurate
timeline, animate them (keyframes + 22 Remocn text effects), and export — in-browser
via WebCodecs, or on AWS via Remotion Lambda. Backed by a small serverless layer:
Vercel Functions (render/quota/upload/contact API), Supabase (auth + project sync), S3.

- ~5K+ lines of TypeScript, 7 engines, 85+ logically-grouped commits.
- React 19 · TypeScript (strict) · Vite · Tailwind v4 · Zustand · React Router v7 ·
  Remotion (Player + Lambda) · Mediabunny (WebCodecs muxer) · react-moveable · shadcn/ui ·
  Remocn · Supabase · AWS (Lambda, S3) · IndexedDB · localStorage.

---

## 2. Tech stack — and why each

| Choice | Why |
|---|---|
| **Remotion** | The product renders real video. Remotion gives frames, `<Sequence>`, `<Player>`, and `renderMedia` — building a renderer + encoder ourselves would be months. |
| **Zustand** | Global state with zero boilerplate: one `create()` → a hook + selectors. No providers/reducers. |
| **React Router v7** | `/` dashboard, `/editor/:projectId` — the URL is the single input that selects a project. |
| **react-moveable** | Drag/resize/rotate handles are a solved problem; building them is weeks of hit-testing math that teaches nothing about *this* product. |
| **Tailwind v4 + shadcn/ui** | Fast, consistent dark UI via design tokens; accessible primitives (Dialog, Popover, Select) without reinventing them. |
| **IndexedDB + localStorage** | Local persistence: structured state is small JSON (localStorage); media is large binary (IndexedDB). |
| **Supabase** | Auth (OAuth / email / anonymous guest) + Postgres with RLS for render quotas and project cloud sync — no auth server to build or run. |
| **Vercel Functions** | The API is 4 endpoints (`render`, `quota`, `upload-url`, `contact`); serverless means zero infrastructure for that footprint. |
| **Remotion Lambda + S3** | Production export path: headless render on AWS, output to S3. A cloud render pipeline for ~20 minutes of config instead of months of infra. |
| **Remocn** | 22 copy-paste Remotion text-effect components — animation polish bought, not built, and owned as source in the repo. |
| **Resend** | Transactional email for the contact form — a single `emails.send()` call instead of managing SMTP or a mail server. |

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
Originally the editor and the export shared only the style function
(`engines/rendering/style.ts`). Since the Remocn integration, the editor canvas goes
further: it renders `MotionComposition` through a single Remotion `<Player>` (synced
to the timeline frame), with selection/drag/resize as a transparent overlay on top.
Preview, WebCodecs export, and Lambda now run the **identical component tree** —
WYSIWYG isn't "we tried to match," the preview *is* the export pipeline.

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
metadata (JSON, small)  → localStorage via Zustand persist  +  Supabase (cloud, per user)
media bytes (binary)    → IndexedDB (local)  +  S3 (public URL for Lambda)
```
Object URLs (`blob:`) die on reload, so we persist the **bytes** and mint a fresh URL
each session (`rehydrateAssets`). **Why the split:** localStorage can't hold large
binaries; IndexedDB is built for Blobs. Editor view state is intentionally *not*
persisted (you don't want to reopen frozen mid-playback).

For signed-in users, projects also sync to Supabase (`cloudSync.ts`): on login the
cloud copy is loaded as the source of truth; after any edit, a 2 s-debounced upsert
pushes every project as a JSONB row (RLS-scoped per user). Work survives session
expiry, `localStorage` wipes, and device switches — because everything is one
`Project` object, cloud sync was one table and ~40 lines.

### Undo/redo — immutable snapshots + coalescing
History is snapshots of the `projects` array. Because edits build new objects
immutably, snapshots **share unchanged sub-objects** (cheap — no deep copies). Rapid
edits within ~500ms **coalesce** into one step, so a whole drag or typing burst = one
undo. **Why it was nearly free:** every edit already flows through `updateProject`.

### Export — two production paths

**Path 1: in-browser (WebCodecs + Mediabunny)** — free, unlimited, Chrome/Edge only:

1. **Frame loop** — an off-screen canvas renders each frame with `drawFrame()`,
   seeking source videos to the exact time via the `seeked` event (not real-time).
2. **Audio mix** — `OfflineAudioContext` decodes every audible element's bytes,
   schedules them at their exact start times with per-clip gain, and renders the
   whole mix faster than real time.
3. **Mediabunny** (`CanvasSource` + `AudioBufferSource`) owns WebCodecs encoder
   configuration, muxing, and backpressure — `source.add()` awaits the encoder
   ready signal, so the loop never outruns the hardware encoder.
4. Output: a single MP4 (H.264 video + AAC audio) downloaded via a `blob:` URL.

`isExportSupported()` gates on `typeof VideoEncoder !== 'undefined'` (Chrome/Edge).
Safari falls back to a "not supported" message.

**Path 2: cloud render (Remotion Lambda)** — quota-based, works on any device:
the browser POSTs the project to `/api/render`; the API invokes a Remotion Lambda
function that renders the same `MotionComposition` in headless Chrome on AWS and
returns an S3 URL. Media is remapped from `blob:` URLs to public S3 `storageUrl`s
before invoking (uploaded in the background at import time via presigned PUTs from
`/api/upload-url`). Remotion's CLI path also still works for local power users.

> **Two separate deploy targets — easy to forget one.** Vercel deploys the Vite
> app and `/api/*` functions on every push; it does **not** touch the Remotion
> Lambda site. `REMOTION_SERVE_URL` points at a static bundle already sitting in
> S3, built and uploaded independently via `npm run deploy:lambda-site`
> (`remotion lambda sites create src/remotion/index.ts --site-name=motionstudio`
> — same site name in, same URL out, so nothing else needs updating). **Any
> change reachable from `src/remotion/index.ts`** — the composition tree,
> `engines/rendering`, or anything a barrel file transitively pulls in — needs
> that command re-run, or cloud renders keep executing the old bundle while
> the rest of the app looks fully deployed and up to date.

### Auth, quota & the serverless guard
Three sign-in paths (Google OAuth, email/password, anonymous guest with 1 free cloud
render), all owned by a single `useAuth` hook — components never touch supabase
directly. `/api/render` runs a **4-gate guard, strictly in order**: verify JWT →
check device ID (anon only; a 1-year cookie survives localStorage wipes) → check
monthly quota → invoke Lambda. A device's free render is recorded only after a
confirmed output URL, so failed renders don't consume the slot. On account switch,
`AuthBridge` wipes the local store + IndexedDB so users on a shared device never see
each other's projects. **Why this order:** never trust the client — identity first,
then abuse checks, then spend.

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

**`blob:` URLs can't be rendered in Node/Lambda.** Browser-only object URLs are
meaningless to a headless renderer on AWS. → Assets upload to S3 in the background
at import (presigned PUT), the asset is patched with a public `storageUrl`, and the
Export dialog remaps `blob:` → `storageUrl` before invoking Lambda.

**Supabase key formats & permissions.** The new `sb_secret_` key format caused 403s
(needed the legacy JWT format); RLS blocked even `service_role` on the `renders`
table until an explicit `GRANT`; `.throwOnError()` returned empty error strings —
direct REST fetches with explicit headers surfaced the real errors.

**Remotion version drift broke Lambda.** Client at 4.0.483 vs Lambda at 4.0.488
failed at invoke time. → All Remotion packages pinned to one exact version, `^` removed.

**Cloud renders crashed with `supabaseUrl is required.` on every frame.**
`Root.tsx` imports `getCompositionDimensions` from the `engines/project`
barrel — which also re-exports `cloudSync.ts`, and that module called
`createClient()` at **module top-level**. Remotion's bundler doesn't replace
Vite's `import.meta.env.VITE_*` syntax, so the URL came through `undefined`
in the Lambda/CLI bundle, throwing on construction before a single frame
rendered. → Made the client a lazy `getSupabase()` instead of an eager
top-level singleton — importing the module transitively (via a barrel) no
longer has a side effect, since it's only constructed on an actual call.

**Fixing the code didn't fix the render — the S3 site was still stale.**
After the lazy-`getSupabase()` fix above shipped to Vercel, cloud renders
*still* failed with the identical error. The Vercel deploy only rebuilds the
app and API functions; the actual Lambda-executed bundle is a separate
artifact in S3 that nothing rebuilds automatically. → Added
`npm run deploy:lambda-site` and ran it manually to push the fixed bundle;
now it's a documented one-liner instead of a step that's easy to forget.

**shadcn CLI wrote to a root `@/` folder.** Root `tsconfig.json` lacked `paths`. →
Added `paths` so `@/` resolves to `src/`.

**White-on-white text.** Default text color was `#ffffff` on a white canvas — invisible,
no error. A reminder that "no crash" ≠ "correct."

---

## 7. Trade-offs & limitations (honest)

- **Browser export requires Chrome or Edge** — WebCodecs (`VideoEncoder`) isn't
  available in Safari yet. The Lambda cloud render covers every other device.
- **Cloud renders are quota-limited** — Lambda costs real money; guests get 1 free
  render (device-tracked), signed-in users a monthly quota.
- **Editor audio preview** is muted / browser-autoplay-dependent; the export
  is authoritative for sound and timing.
- **Asset bytes don't follow you across devices** — project JSON syncs via Supabase,
  but media blobs live in local IndexedDB (S3 copies exist only for Lambda's use).
- **No scene grouping yet** — sequencing is done by positioning clips on the timeline.
- **Dashboard and editor are desktop-only** — both rely on fixed multi-panel
  layouts (220px+260px side panels, 224px timeline) that assume a laptop-sized
  viewport; below `1024px` a `DesktopOnlyGate` (`components/DesktopOnlyGate.tsx`,
  gated on `useMediaQuery('(min-width: 1024px)')`) replaces the page with a
  "use a bigger screen" message rather than attempting a cramped layout. The
  landing page and auth flow remain fully responsive so sign-up still works on
  mobile.

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
| Centralized `useAuth` hook | Zero auth logic leaked into UI components |
| Device cookie for guests | Abuse prevention without forcing account creation |
| One `Project` object | Cloud sync = one table + ~40 lines; nothing to wire per-feature |
| Player-based editor canvas | Remocn effects, video, audio all preview for free — no dual path |

---

## 9. Lessons

- **A single mutation path is a superpower** — it's what made undo, autosave, and
  WYSIWYG cheap. Decide *where* data changes before deciding *how*.
- **Store data in the target domain** (output resolution, frames), not the view's
  units — views come and go, the data shouldn't.
- **"No error" isn't "correct"** (white-on-white text, silent `Omit`-on-union).
- **Buy the boring parts** (moveable handles, encoding, Lambda rendering) and build
  the parts that are actually your product (the composition model, the timeline, the
  animation system). Remotion Lambda turned "cloud render pipeline" from months of
  infrastructure into ~20 minutes of configuration.
- **The CLI export was always the wrong tool for end users** — they can't run
  terminal commands. The gap wasn't a missing feature; it was a missing production
  path (browser WebCodecs for free, Lambda for everyone else).
- **Never trust the client** — verify identity server-side first, then abuse checks,
  then spend money. Always in that order.

---

*Built with AI assistance and documented decision-by-decision. Every choice here can be
walked through and defended, and the architecture is designed to be extended.*
