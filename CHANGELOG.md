# Changelog

All notable changes to MotionStudio. Newest entries first.
Format: `## [date] — Title`, with **Added / Changed / Fixed** subsections.

---

## [2026-07-24] — Live animation previews, Effects/Animation panel reorder

### Added
- **`AnimationPreview.tsx`** — a small, always-looping live preview of one
  animation preset's actual motion, same `<Player>` pattern as
  `ShaderPreview`/`TextEffectPreview`. Shown inline on every Enter/Exit
  preset button (Fade In, Slide Up, Pop In, etc.) instead of a generic `+`
  icon, so what a preset does is visible at a glance instead of requiring
  "add it, then press play to find out."

### Changed
- **Effects/Animation now sit above Transform/Layer** in the Properties
  panel, for every element type (text, image/video, shader) — the creative
  decision comes first, position/layer-order plumbing comes after.
- **Text elements: Text Effect + Animation merged under one "Effects"
  header** ("Text Animation" / "Motion" sub-labels), replacing two
  separately-headed sections with Transform/Layer sandwiched between them.
  They're two different mechanisms under the hood but were reading as two
  unrelated features; grouping them fixes that without merging the code.
- `AnimationSection` gained an optional `hideHeader` prop so it can nest
  under the shared "Effects" header for text elements while keeping its own
  "Animation" header for image/video/shader elements, which don't have a
  competing effect system to nest under.

### Fixed
- `AnimationSection`'s preset buttons called `preset.build(60)` inline in
  JSX — a fresh array on every render. Passed as `<Player inputProps>`, an
  identity change resets Remotion's playback to frame 0, so any upstream
  re-render would freeze every preview. Same class of bug as the
  `CanvasPanel` `inputProps` fix earlier this session. Precomputed once at
  module load into a `Map` instead.

Files: `features/workspace/components/AnimationPreview.tsx` (new),
`PropertiesPanel.tsx` (`AnimationSection`, `TextProperties`,
`MediaProperties`, `ShaderProperties`).

---

## [2026-07-24] — Editor usability pass: legible Transform fields, auto-select, clearer copy

### Fixed
- **Transform panel's X/Y/W/H fields were functionally illegible.** `NumInput`
  hardcoded 24px of right padding reserved for a unit suffix ("px", "%") even
  on fields that pass no unit at all. Those four fields sit two-per-row at
  ~37px wide, so a value like `1000` had roughly 10px of usable space —
  correct in the data, invisible on screen. Padding is now conditional on
  whether a `unit` is actually passed, and the X/Y/W/H labels shrank from a
  generic 64px-wide column to a 16px one (`PropRow`'s new `compact` prop) —
  those labels are single letters, they didn't need the room "Rotation" and
  "Opacity" do.
- **Project Settings toolbar button had no tooltip.** Audited all toolbar
  icon buttons — "Add Text" and "Add Background" already had proper `title`
  attributes (confirmed via the DOM, not just a hover screenshot — automated
  browser hovering doesn't reliably trigger Chrome's native tooltip timing,
  which had made them look broken during a first pass). Only the Project
  Settings icon was actually missing one; added `title="Project settings"`.

### Changed
- **New elements are now auto-selected.** Clicking "Add Text" or "Add
  Background" used to leave the Properties panel on "Select an element to
  edit its properties" — you had to know to go click what you'd just added.
  Both toolbar actions now call `setSelectedElement` with the created
  element's id, matching the add → immediately adjust flow every comparable
  tool (Figma, Canva) already gives you.
- Timeline empty-state copy changed from "Add text to see clips here" to
  "Add an element…" — the old wording implied text was the only way to
  populate the timeline, when images/video/audio all do too.

Files: `features/workspace/components/PropertiesPanel.tsx` (`NumInput`,
`PropRow`, `TransformSection`), `Toolbar.tsx`, `ProjectSettingsPopover.tsx`,
`TimelinePanel.tsx`.

---

## [2026-07-24] — Fix RGB Glitch background/blend bug, live text-effect preview, typewriter cursor speed

### Fixed
- **`RGBGlitchText`** had the same background bug as yesterday's 7, just missed
  by an exact-string grep last time: `background: "#fafafa"` instead of
  `"white"`. Also removed `mixBlendMode: "multiply"` from its RGB channel
  copies — `multiply` composites against whatever's behind it, so on a dark
  canvas the glitch colors would multiply to black and disappear even with
  the background fixed. Channels are now plain opacity-composited, so the
  effect reads correctly on any background color, not just light ones.
- **`StaggeredFadeUp`** was the only one of the 20 text effects with no easing
  curve — every sibling uses a bezier ease, this one interpolated linearly.
  Added the same ease-out curve `BottomUpLetters`/`TopDownLetters` use.

### Added
- **Live preview for text effects** (`TextEffectPreview.tsx`) — same idea as
  the existing shader preview: a small looping Remotion `<Player>` shown in
  the Properties panel once an effect is picked, so you see how it actually
  moves before committing, instead of guessing from a name in a `<select>`.
  Rendered over a checkerboard (not a flat panel color) since effects are
  transparent — a solid preview background would misrepresent how they'll
  actually composite over other layers. Reuses the same lazy-loaded effect
  map `TextRenderer.tsx` already had, now exported for this purpose
  (`Effects`, `LazyTypewriter`, `LazyInlineHighlight`, `LazyMarkerHighlight`),
  mirroring how `ShaderRenderer.tsx` already exports `Shaders`.
- **Typewriter cursor blink speed** — `Caret.tsx` already supported
  `blinkPerSecond`, but `Typewriter` never forwarded it, so the blink rate was
  stuck at the default. Added `TextElement.textEffectCursorBlinkSpeed`, threaded
  through a new `cursorBlinkPerSecond` prop on `Typewriter`, with a "Cursor
  blink" control in the Properties panel (shown only when the typewriter
  effect is selected).

Files: `components/remocn/rgb-glitch-text.tsx`, `staggered-fade-up.tsx`,
`typewriter.tsx`; `engines/project/types.ts`;
`engines/rendering/components/renderers/TextRenderer.tsx`;
`features/workspace/components/TextEffectPreview.tsx` (new),
`PropertiesPanel.tsx`.

---

## [2026-07-23] — Fix Remocn text effects painting an opaque white background

### Fixed
- **7 of the 22 Remocn text effects** (`Typewriter`, `ShimmerSweep`,
  `MarkerHighlight`, `InlineHighlight`, `StaggeredFadeUp`, `MatrixDecode`,
  `TrackingIn`) hardcoded `background: "white"` on their full-bleed wrapper
  `div`. Copy-pasted from Remocn's registry, where components preview on a
  white demo page — harmless there, but on this canvas that wrapper sits
  `position: absolute; inset: 0` over the whole composition, so any of these
  7 effects painted an opaque white box over every layer behind it (shader
  backgrounds, images, other text). The other 15 effects (e.g.
  `PerCharacterRise`) already used `background: "transparent"` and were
  unaffected — which is why the bug only showed up with some effects and not
  others.
- Changed all 7 to `background: "transparent"`, matching the rest.

Files: `components/remocn/typewriter.tsx`, `shimmer-sweep.tsx`,
`marker-highlight.tsx`, `inline-highlight.tsx`, `staggered-fade-up.tsx`,
`matrix-decode.tsx`, `tracking-in.tsx`.

---

## [2026-07-20] — Gate dashboard/editor to desktop, make landing + auth responsive

### Added
- **`DesktopOnlyGate`** (`components/DesktopOnlyGate.tsx`) — wraps a page and
  swaps its content for an on-brand "use a bigger screen" message below a
  `1024px` viewport, driven by a new reusable `useMediaQuery` hook
  (`hooks/useMediaQuery.ts`, live-updating via `matchMedia`'s `change` event).
  Applied to `DashboardPage` and `EditorPage` — both rely on fixed-width
  multi-panel layouts (220px asset panel + 260px properties panel + 224px
  timeline in the editor; a card grid in the dashboard) that don't have a
  sane small-screen fallback, so rather than a broken cramped UI they now
  tell the user plainly to switch to a laptop/desktop or widen the window.

### Changed
- **`LandingPage` and `AuthPanel`** are now fully responsive — the two-column
  layout (`product` / `auth`) stacks vertically below Tailwind's `lg`
  breakpoint instead of forcing a fixed `400px` auth column and `12–20px`
  desktop padding onto phone-width viewports. Heading size, body padding, and
  the feature-card grid (`grid-cols-2` → `grid-cols-1` on mobile) all scale
  down with viewport width. Sign-up/sign-in was already narrow-friendly
  internally; the fix was entirely in the parent page's layout.

Files: `components/DesktopOnlyGate.tsx` (new), `hooks/useMediaQuery.ts` (new),
`features/dashboard/DashboardPage.tsx`, `features/workspace/EditorPage.tsx`,
`features/landing/LandingPage.tsx`.

---

## [2026-07-19] — Fix negative zIndex rendering invisibly behind Remotion's Player

### Fixed
- **A shader or "Make Background" image could vanish completely** — not just
  sit behind other layers, but not render *at all*, even in the areas nothing
  else covered — whenever it ended up with a negative `zIndex`. Both
  `addShader` and `Make Background` computed their "send to back" position as
  `Math.min(existing zIndex) - 1`, which goes negative the moment any other
  element already exists. Confirmed via direct DOM/WebGL inspection: the
  element's box and (for shaders) its canvas were both correctly positioned
  and sized, but painted nothing — Remotion Player renders an internal opaque
  backdrop that any negative-zIndex sibling ends up behind, regardless of
  render correctness. Deleting the element on top didn't fix it either, since
  the survivor was *also* negative.
- Rewrote both to use the same scheme `reorderLayer('back')` already uses
  safely: shift every other element's `zIndex` forward by one, and give the
  new/target element slot `0`. Contiguous, always non-negative, by
  construction. `makeBackground` moved into the canvas engine as a proper
  verb (`useCanvasEngine().makeBackground(id)`) instead of living in
  `PropertiesPanel.tsx`, since it now needs the same all-elements rewrite
  `reorderLayer` does.
- Verified live: shader → image → Make Background → delete shader now
  correctly reveals the background immediately, no manual "bring to front"
  needed.

Files: `engines/canvas/store.ts` (`addShader`, new `makeBackground`),
`features/workspace/components/PropertiesPanel.tsx`.

---

## [2026-07-18] — One-click "Make Background" for image/video

### Added
- Properties panel → **Layout** section (image/video elements): a single
  **Make Background** button resizes the element to the full canvas, resets
  position/rotation to origin, and sends it behind every other layer in one
  action — the same convention shaders already use when added via the
  toolbar. Previously this required manually resizing, repositioning, and
  reordering through Layer controls.

Files: `features/workspace/components/PropertiesPanel.tsx`.

---

## [2026-07-18] — Stock media search (Pexels)

### Added
- New **Stock** tab in the Assets panel: search free Pexels photos/videos,
  toggle between the two, and import a result straight into the project's
  asset library — from there it behaves exactly like an upload (click/drag
  onto canvas, goes through the same S3 background-upload path as any other
  asset).
- `/api/stock-search` (new): server-side proxy to Pexels — the API key never
  reaches the browser. Gated behind a signed-in session (same JWT check as
  `/api/quota`/`/api/render`) so the shared key's rate limit isn't exposed to
  anonymous abuse.
- `api.searchStock()` added to the typed `apiClient.ts`.
- New env var: `PEXELS_API_KEY` (server-side only, added to Vercel
  Production/Preview/Development).

Files: `api/stock-search.ts` (new), `src/lib/apiClient.ts`,
`src/features/workspace/components/AssetsPanel.tsx`.

---

## [2026-07-18] — Fix soft/blurry images and video in Browser export

### Fixed
- Every frame drawn during the free Browser (WebCodecs) export used a 2D
  canvas context with no explicit `imageSmoothingQuality`, which Chrome
  defaults to `'low'`. Any image or video needing a cover-fit crop or scale
  (`drawMedia` in `canvasFrame.ts` — effectively all of them) came out
  visibly softer than necessary. Set `imageSmoothingQuality = 'high'` on the
  export canvas. Import/upload itself was already untouched — verified no
  resizing or re-encoding happens anywhere in the asset pipeline
  (`probe.ts`, `storage.ts`); this only affected exported video, not what
  the editor canvas shows (a real `<img>`/`<video>` tag, unaffected).

Files: `engines/export/exporter.ts`.

---

## [2026-07-18] — Fix shaders never rendering (editor + Lambda) + add live picker preview

### Fixed
- **Shaders never appeared in the editor canvas, in dev.** Every Remocn shader
  wrapper gates its WebGL paint behind Remotion's `delayRender()`/
  `continueRender()`, resolved via a ref callback with no cleanup. React
  `StrictMode` (enabled in `main.tsx`) double-mounts every component once in
  dev; the discarded first mount's `delayRender` handle was never released,
  and Remotion won't mark that part of the tree "ready" to paint until its
  handle resolves — so the shader canvas sat blank indefinitely. Rewrote the
  gating in all 18 shader components (`src/components/remocn/shader-*.tsx`)
  as a `useEffect` whose cleanup unconditionally calls `continueRender(handle)`,
  so a StrictMode-discarded mount can never leak one. Verified live: shaders
  now paint immediately and animate correctly through full playback, alone
  and layered with text/other elements.
- **Shaders (and every change since 2026-07-12) never appeared in Cloud
  Render output.** Remotion Lambda renders from a static site bundle
  pre-deployed to S3 (`REMOTION_SERVE_URL`), not live code — and that bundle
  hadn't been redeployed since 2026-07-12, six days before shaders (and
  today's text effects and Player-canvas refactor) existed. There was no
  redeploy step wired into the project. Fixed by redeploying the Lambda site
  (`npx remotion lambda sites create`), which first required teaching
  Remotion's own bundler about the `@/` → `src/` path alias it doesn't share
  with Vite — added `remotion.config.ts`. (Note: `__dirname` is unusable
  inside that config file — Remotion loads/transpiles it from inside its own
  `@remotion/cli` package directory — so the alias is anchored on
  `process.cwd()` instead, matching how this project always invokes the
  Remotion CLI.) Same site name/bucket, so no Vercel env var changes needed.
- **First shader use in a dev session showed several seconds of blank canvas**,
  even while paused. Vite compiles each lazy-imported chunk on demand the
  first time it's requested; `@paper-design/shaders-react` (shared by all 18
  shaders) is large enough that this was noticeable. Added it to
  `optimizeDeps.include` in `vite.config.ts` so it's pre-bundled at dev-server
  startup instead — dev-only issue, production builds pre-bundle everything
  regardless.

### Known limitation (not fixed this pass)
- **Shaders (and text effects) still don't appear in the free Browser export.**
  That path is a hand-rolled 2D canvas renderer (`engines/export/canvasFrame.ts`)
  that only knows how to draw `text`/`image`/`video` primitives — it has no
  concept of the live React/WebGL tree a shader or Remocn text effect renders
  through, and this predates today's work. **Cloud Render is unaffected** — it
  runs the real `MotionComposition` tree via `renderMedia()`, now fixed above.
  Shader/effect-heavy projects should export via Cloud Render until the
  Browser path is extended to capture arbitrary component output.

### Added
- **Live shader preview** in the Properties panel: a small looping `<Player>`
  showing the currently-selected preset, so picking from the 18-option dropdown
  is no longer a guess. Reuses the same lazy-loaded shader map as the canvas
  renderer (`ShaderRenderer.tsx` now exports it) — `ShaderPreview.tsx` (new).
- Also fixed in passing: `<Player>`'s `inputProps` was rebuilt fresh every
  CanvasPanel render (a new reference 30+ times/sec during playback); now
  `useMemo`'d so it's stable unless elements/selection/assets actually change.

Files: `src/components/remocn/shader-*.tsx` (all 18), `remotion.config.ts`
(new), `vite.config.ts`, `features/workspace/components/CanvasPanel.tsx`,
`features/workspace/components/ShaderPreview.tsx` (new),
`engines/rendering/components/renderers/ShaderRenderer.tsx`,
`features/workspace/components/PropertiesPanel.tsx`.

---

## [2026-07-18] — 18 shader backgrounds (Remocn)

### Added
- New `shader` element type: a full-bleed, frame-synced WebGL background. 18
  Remocn shader presets under `src/components/remocn/` (mesh gradient, grain
  gradient, warp, swirl, water, spiral, liquid metal, color panels, neuro/perlin/
  simplex noise, voronoi, dot orbit, dithering, god rays, smoke ring, metaballs,
  pulsing border), lazy-loaded per preset in a new `ShaderRenderer`.
- Toolbar "Add Background" button — inserts a full-canvas shader element
  (default: Mesh Gradient), automatically placed behind every existing layer.
- Properties panel: grouped shader picker (Premium / Tech / Clean / Playful) +
  speed control, alongside the existing Transform / Layer / Animation sections
  so backgrounds can still be resized, reordered, and faded like any element.
- New dependency: `@paper-design/shaders-react` (the underlying WebGL shaders
  Remocn wraps). Each wrapper is frame-driven via `useCurrentFrame()` instead of
  a wall clock, so renders stay deterministic — same requirement text effects
  already met.

### Why
Requested as backgrounds for compositions. Decided against building transitions
in the same pass — Remocn's transitions are built for `TransitionSeries` between
two *scenes*, and MotionStudio has no scene-grouping concept yet (each element
is an independent layer on one timeline). Adding scene grouping speculatively,
before there's a real need for multi-scene sequencing, was explicitly deferred.

Files: `engines/project/types.ts` (`ShaderElement`, `ShaderPreset`,
`SHADER_PRESETS`), `engines/canvas/store.ts` (`addShader`), `engines/rendering/
components/renderers/ShaderRenderer.tsx` (new), `engines/rendering/components/
ElementRenderer.tsx`, `features/workspace/components/{Toolbar,PropertiesPanel}.tsx`.

---

## [2026-07-18] — Fix Player-canvas regressions (scale, drag, editing, playback)

### Fixed
- **Canvas rendered elements giant and unclickable**: the Remotion `<Player>` style
  had no explicit `width`/`height`, so the Player sized itself at full composition
  resolution (1920×1080, scale = 1) and overflowed the stage — visuals no longer
  matched the interaction overlay. Fixed with `width/height: 100%`.
- **No live feedback while dragging/resizing/rotating**: moveable only moved the
  invisible overlay; the visible pixels (Player) updated on release. Now each
  gesture live-commits to the store (undo coalescing keeps it one step).
- **Selected element showed its animated pose**, misaligning the selection box.
  The Player now renders the selected element with animations stripped (base pose),
  matching pre-refactor behavior.
- **Double text while inline-editing**: the Player kept rendering the text under
  the contenteditable. The edited element is now hidden from the Player.
- **Text with an entrance effect vanished while building at frame 0**: entrance
  effects start at opacity 0, so the text was invisible exactly when the user
  was arranging it. Adopted the CapCut-style hybrid: the SELECTED element now
  renders plain (text effect + keyframes stripped) so it is always visible while
  being worked on; deselected elements stay frame-accurate WYSIWYG.
- **Text effects invisible during playback (but fine while scrubbing)**: two
  clocks raced — the editor's rAF clock (`usePlaybackClock`) advanced
  `currentFrame` while the Player was separately seeked/played, so the Player
  could seek to the end and freeze while the playhead swept. The Player is now
  the ONLY playback clock: play() drives it, its `frameupdate` events move the
  timeline playhead, `ended` stops playback, and the rAF clock is deleted.
  Playback is smooth, audio is audible, and effects animate correctly.

Files: `features/workspace/components/CanvasPanel.tsx`,
`features/workspace/components/EditorLayout.tsx`,
`features/workspace/hooks/usePlaybackClock.ts` (deleted).

---

## [2026-07-18] — Project cloud sync (Supabase)

### Added
- `engines/project/cloudSync.ts` — `saveProject` (upsert), `loadProjects`, `deleteCloudProject` against a new Supabase `projects` table (JSONB row per project, RLS-scoped per user).
- `CloudSync` component in `App.tsx`: pulls cloud projects on login (cloud is source of truth), then auto-saves all projects 2 s (debounced) after any edit.
- `setProjects` action on the project store for cloud restores (replaces list, clears undo history).

### Why
Projects previously lived only in `localStorage` — a session expiry triggered `clearAll()` and wiped work, and nothing followed the user across devices. Edits (including text effects) now survive reloads, logouts, and device switches.

---

## [2026-07-18] — 22 Remocn text effects + Player-based canvas (WYSIWYG)

### Added
- 22 copy-paste Remocn animation components under `src/components/remocn/` (blur, per-character, scale, reveal, kinetic, highlight, typewriter, matrix, glitch families) + shared `remocn-ui` timeline/motion utilities.
- `TextEffect` type + `TEXT_EFFECTS` const; `TextElement` gains `textEffect`, `textEffectSpeed`, `textEffectHighlight`.
- `TextRenderer` lazy-loads each effect as its own bundle chunk; `inline-highlight`/`marker-highlight` get before/highlight/after content splitting.
- Properties panel: grouped effect picker (Premium / Kinetic / Reveal / Tech), speed input, highlight-word input.
- Remocn agent skill at `.agents/skills/remocn/` for AI-assisted integration.

### Changed
- **CanvasPanel rewritten around a single Remotion `<Player>`** rendering `MotionComposition` — the exact pipeline used by WebCodecs and Lambda export. Removed the custom `TextNode`/`ImageNode`/`VideoNode`/`AudioNode` DOM renderers (−302 lines). Interaction (select, drag/resize/rotate via react-moveable, inline text edit) now lives on a transparent overlay above the Player.

### Why
The editor previously had its own rendering path that bypassed `TextRenderer`, so effects worked in export but were invisible while editing. One shared pipeline = true WYSIWYG and zero dual-path drift.

---

## [2026-07-17] — S3 asset upload for cloud renders

### Added
- `/api/upload-url`: presigned S3 PUT URLs (JWT-gated). Browser uploads media bytes directly to S3 in the background after import; asset is patched with a public `storageUrl`.
- Export dialog remaps `blob:` URLs → `storageUrl` before invoking Lambda.

### Why
`blob:` URLs are browser-only — Lambda (headless Node on AWS) could never fetch them. Cloud renders now support image/video/audio media.

---

## [2026-07-15] — Auth, serverless API, Lambda cloud render, landing page, analytics

### Added
- **Auth (Supabase)**: Google OAuth, email/password with confirmation, and anonymous guest (1 free cloud render). Centralized `useAuth` hook — components never touch supabase directly. Device-ID cookie (1-year) prevents same-device guest abuse.
- **Serverless API on Vercel** (`/api/render`, `/api/quota`): 4-gate guard — JWT → device (anon only) → monthly quota → Remotion Lambda. Failed renders don't consume the guest's free slot.
- **Remotion Lambda cloud render**: headless render on AWS, returns S3 URL. Any device, no local CPU, 1080p. Coexists with browser export in the Export dialog.
- **Account isolation**: `AuthBridge` wipes local store + IndexedDB on account switch — User B never sees User A's projects.
- Landing page (feature showcase + auth), auth-guarded `/dashboard`, UserMenu.
- PostHog + Vercel Analytics/Speed Insights across auth, editor, and export flows.

---

## [2026-07-10] — In-browser WebCodecs export

### Added
- Frame-perfect export engine: renders each frame to canvas, encodes via WebCodecs, muxes MP4 with Mediabunny — no server, no CLI.
- Audio mixing through `OfflineAudioContext` for frame-perfect A/V sync.
- One-click quality presets in the Export dialog; Inter font embedded in editor + render.

### Changed
- Replaced the CLI-based export flow as the user-facing path (users can't run `npx remotion render`). Chrome/Edge only.

---

## [2026-07-04] — Undo/redo, persistence, polish

### Added
- Undo/redo with snapshot history + 500 ms edit coalescing; keyboard shortcuts and toolbar buttons. Hooks the single `updateProject` mutation point, so every edit is covered automatically.
- Persistence: project JSON → `localStorage` (Zustand persist); asset bytes → IndexedDB, with fresh `blob:` URLs minted on project open.
- Drag assets from the panel onto the canvas at the drop point; editable project duration (default 10 s); synced vertical timeline scrolling; layer reorder that rewrites `zIndex`.
- `USER_GUIDE.md` documenting all features.

---

## [2026-07-04] — Assets: image, video, audio

### Added
- Asset engine: upload, media probing (dimensions/duration), library panel with thumbnails.
- Image / Video / Audio element types with renderers — `<Img>`, `OffthreadVideo` (render-safe), `<Audio>` — placed from the assets panel and synced to the playhead in the editor.
- Remotion composition entry (`registerRoot` + `calculateMetadata`) and export dialog for CLI rendering.

---

## [2026-07-04] — Animation engine

### Added
- Animation data model: per-property (`opacity`/`x`/`y`/`scale`/`rotate`) from→to windows, timed relative to clip start.
- Evaluator built on Remotion `interpolate`/`spring`; renderer is frame-aware so preview and export animate identically.
- Entry/exit presets, animation list editor, and a timeline keyframe strip to retime animations by dragging.

---

## [2026-07-04] — Timeline

### Added
- Timeline engine with frame↔pixel coordinate math.
- Ruler, per-element clips (move/trim), scrubbing, transport controls, and a time-based playback clock driving the editor's current frame.

---

## [2026-07-04] — Canvas, elements & rendering engine

### Added
- Canvas engine (`addText`, `updateElement`, `removeElement`); text elements with selection, drag/resize/rotate (react-moveable), and inline editing.
- Composition-space coordinates (elements stored at 1920×1080-space; editor scales) — ADR-003.
- Rendering engine: shared `style.ts` + `MotionComposition` (Sequence-per-element) consumed by both the editor preview and export — the WYSIWYG foundation. ADR-001 (Project as aggregate root), ADR-002 (Remotion as render engine).

---

## [2026-06-27] — Foundations

### Added
- Vite + React 19 + TypeScript (strict) toolchain; Tailwind v4 dark-first design-token layer; shadcn/ui primitives.
- Project engine (`Project` type, `useProjectStore`) and editor engine (selection, frame, playback, zoom, tool).
- Dashboard: project grid, empty state, create-project modal; workspace editor shell (toolbar, canvas, assets, properties, timeline).
