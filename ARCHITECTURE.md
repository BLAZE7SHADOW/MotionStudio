# MotionStudio — Architecture & Engineering Decisions

A technical case study of how MotionStudio is built: the architecture, the problems
hit along the way, what was chosen, and **why**. Companion to `USER_GUIDE.md` (how to
use it) and `docs/adrs/` (formal decision records).

---

## 1. What it is

A **browser-based, programmatic video editor** built on [Remotion](https://remotion.dev).
Place text / image / video / audio on a canvas, arrange them on a frame-accurate
timeline, animate them (keyframes + 34 Remocn text effects, 18 shaders, 4 UI blocks), and export — in-browser
via WebCodecs, or on AWS via Remotion Lambda. Backed by a small serverless layer:
Vercel Functions (render/quota/upload/contact API), Supabase (auth + project sync), S3.

- ~5K+ lines of TypeScript, 7 engines, 95+ logically-grouped commits.
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
| **Remocn** | 57 copy-paste Remotion components (text effects, shaders, UI blocks) — animation polish bought, not built, and owned as source in the repo. |
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

### Templates — starting points, not a second data model
A template is just **a project's element list, authored ahead of time**
(`src/content/templates/`). No new rendering path, no template runtime: a
`TemplateDefinition` holds plain `CanvasElement`s minus their ids, and
`instantiateTemplate()` mints a fresh `crypto.randomUUID()` per element at
create time so two projects never share ids. `createProject` grew two optional
fields (`elements`, `durationInFrames`); the blank path is byte-identical to
before. **Why it stayed this small:** the `Project` aggregate root already is
the whole document — so "a template" and "a project someone made" are the same
shape, and the editor can't tell them apart.

Two constraints worth knowing:
- **Templates ship text and shaders only — never media.** Image/video/audio
  elements point at an `assetId` whose bytes live in IndexedDB and S3, which a
  static definition can't supply; a media-bearing template would apply as a
  broken canvas. Text, the 18 shaders and the 4 blocks render instantly with
  nothing to upload.
- **The picker shows one live preview, not a grid of them.** Each shader is its
  own WebGL context and browsers cap those (~8–16), so a dozen autoplaying cards
  would exhaust the limit. The selected template previews beside the list —
  the same pattern the Properties panel already uses for effects and shaders,
  and it renders the real `MotionComposition`, so the preview *is* the output.

`track.projectCreated` carries `template_id` / `template_category` (both
`'blank'` for an empty project) — deliberate instrumentation, since which
templates get used is the evidence for who the product is actually for.

### Blocks — a registry instead of another hardcoded union
Text effects and shaders are string-literal unions with a hand-maintained lazy map,
which is fine for "one component, one string" but can't express components that take
arrays and objects (a terminal's lines, a pipeline's steps). Those became a sixth
element type, `BlockElement`, backed by `src/content/blocks/registry.ts`: each entry
declares its lazy import, defaults, natural length, a **field schema** the Properties
panel renders inputs from, and a `toProps` translator. Adding a block is a registry
entry; the renderer and the panel don't change. The panel only grows when a block
needs an input *kind* that doesn't exist yet — `select` was added for the progress
pipeline's horizontal/vertical switch, and every block gets it for free.

**Sizing is the registry's job too.** Remocn components carry pixel geometry tuned
for whatever canvas their author had; dropped into a 1920×1080 composition those
numbers can be invisible (the progress pipeline shipped with 15px labels — 1.4% of
the frame height). Blocks therefore take their geometry as props and the registry
supplies composition-scale defaults, so the sizing decision lives with the rest of
the block's configuration rather than buried in the component.

Vendored does not mean verified. The same pipeline's nodes were laid out with
`width: segment` plus `marginRight: -segment`, which cancels each item's own width
and stacked every node at the same x — it had never drawn correctly, and enlarging
its numbers only made the broken layout bigger. The component now positions nodes
absolutely from `trackLength`. Blocks are the one part of the composition with no
cheap visual check in the editor, so the diagnosis came from rendering the block
alone through `remotion render` and reading the frame — worth reaching for early
rather than reasoning about layout from source.

**`blockProps` is deliberately flat and primitive.** A project is persisted as JSON —
localStorage and a Supabase JSONB column — so nothing non-serializable can live on an
element. Components wanting arrays-of-objects take a **multiline string** that
`toProps` parses at render time (a terminal's `$ `/`✓ ` line prefixes become
`{text, type}`). The editor stays a plain textarea and the data round-trips.

**Natural length is a real constraint, not a style note.** Every Remocn component has
a length it needs (terminal-simulator 240f, glass-code-block 180f, rolling-number
150f); a shorter clip cuts the animation off. `addBlock` sizes new clips to at least
the natural length, the Properties panel warns when a clip is too short, and the
template check enforces it. Worth knowing: components differ in how they read time —
some are fixed-length, while others (like `rolling-number`) call
`useVideoConfig().durationInFrames` and therefore stretch to the **composition**
length rather than their clip's.

### The undefined CSS variable that made every text effect serif
Every Remocn text component sets `font-family: var(--font-geist-sans), -apple-system,
…, sans-serif`. That variable ships with Remocn's own Next.js setup, not with us, and
CSS treats an undefined `var()` with no fallback as *invalid at computed-value time* —
which throws away the **entire** declaration rather than falling through to the
`sans-serif` at the end. So all 30-odd text components silently rendered in the browser
default, Times. Fixed by defining the variable once on `MotionComposition`'s root
`AbsoluteFill` — the one component mounted by both the editor `<Player>` and the
Remotion render, so preview and export stay identical for the same reason `style.ts`
is shared. Found by rendering a template through the CLI and looking at a frame; it
had been invisible because "no error" is not the same as "correct."

### Deploy freshness — detecting a stale tab without forcing a reload
A client-side route change never re-fetches `index.html`, so a tab left open across
a deploy has nothing telling it to check for new code — it keeps running the old
bundle indefinitely, cache headers notwithstanding. `vite.config.ts` writes an
unhashed `dist/version.json` (`{ buildId }`, sourced from `VERCEL_GIT_COMMIT_SHA`)
at build time via a `closeBundle` plugin hook, alongside injecting the same
`buildId` into the client as `__APP_VERSION__` via `define`. `useVersionCheck`
polls that file every 5 minutes and on tab-focus, always with `cache: 'no-store'`
(the hashed JS/CSS in `/assets/` is cached forever — this one file deliberately
isn't). On a mismatch it surfaces `<UpdateBanner>` — a dismissible "new version
available" prompt, never an automatic reload, because this is an editor with
in-progress work an unannounced reload would destroy. Separately, `main.tsx`
listens for Vite's own `vite:preloadError` event and *does* reload automatically
there — that only fires when a lazy-loaded chunk (one of the 34 text effects,
18 shaders or 4 blocks) already failed to load, so there's nothing left to lose.
**Gotcha:** the SPA catch-all rewrite in root `vercel.json` excludes only
`api/`, `assets/`, and the two icon files — `version.json` had to be added to
that exclusion list too, or the rewrite silently serves `index.html` for it
instead of real JSON, breaking the check without ever erroring.

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

### Cloud render: the client polls, the server doesn't wait
`api/render.ts` queues a Lambda render and returns the `renderId` **immediately**
(202); the browser then polls `api/render-status.ts`, which does one fast
progress check per call. It previously polled inside the request for up to 6
minutes — which silently capped renders at whatever Vercel allowed (~60s, since
no `maxDuration` was ever configured). Lambda would finish and write to S3 while
the caller saw a timeout. Polling from the client removes the ceiling entirely
rather than raising it, and it's why the progress bar can show real percentages
instead of an indefinite spinner.

Device-locking for guests moved to the status endpoint, because success is only
observable there. A guest who abandons the tab mid-render therefore isn't
charged — deliberate, and the per-user monthly quota still applies.

### Browser export is NOT the same renderer (a real WYSIWYG gap)
The claim that all three paths run one composition holds for the editor preview
and Lambda. It does **not** hold for browser export: `engines/export/canvasFrame.ts`
paints each frame onto a 2D canvas with `fillText`/`drawImage`, handling only
text, image and video plus the shared keyframe evaluator. Anything React-rendered
— all 34 text effects, all 18 shaders, all 4 blocks — is absent from the output.

That was acceptable when elements were plain text and images; adding Remocn
components made it wrong, and it stayed invisible because the editor preview uses
the real renderer, so a project looks right until it's exported. Reimplementing
those components in canvas 2D isn't viable, so the export dialog now inspects the
project and warns when it contains something the canvas path can't draw. The
honest long-term options are to drop the path or move it to real composition
capture; neither is done.

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

**Cloud project sync silently never worked — the table didn't exist.**
`cloudSync.ts` was written correctly against a `projects` table that was
never actually created in Supabase; every save/load failed with a
table-not-found error that only reached `console.error`, so the UI never
showed a problem — projects just quietly never made it further than
`localStorage`, meaning a new browser always looked empty. Confirmed by
querying the Supabase REST API directly with the service-role key. → Created
the table with RLS scoped to `auth.uid() = user_id`, plus an explicit
`GRANT … TO authenticated, service_role` (same class of gotcha as the
Supabase-permissions bullet above — this project's `public` schema didn't
have the usual default privilege grants applied). A reminder that
`console.error` on a persistence path is invisible until someone goes
looking — it should have surfaced as user-facing state instead.

**A prop name mismatch silently ate a color setting.** `TextRenderer.tsx`
passes every text effect a shared `{ text, fontSize, color, speed }` object,
but `ShimmerSweep` declared its own prop as `baseColor` — so the `color`
value was passed, matched nothing, and was dropped without a TypeScript
error (excess/mismatched props on a spread aren't checked the way an object
literal would be). → Renamed the prop to `color` to match the shared shape
every other effect in the `Effects` map already uses.

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
