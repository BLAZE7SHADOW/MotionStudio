# Changelog

All notable changes to MotionStudio. Newest entries first.
Format: `## [date] — Title`, with **Added / Changed / Fixed** subsections.

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
