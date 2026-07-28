# Changelog

All notable changes to MotionStudio. Newest entries first.
Format: `## [date] — Title`, with **Added / Changed / Fixed** subsections.

---

## [2026-07-28] — In-app feedback and release notes

### Added
- **A feedback form in the account menu.** Category (broke / want / other), a
  message, and a reply address — prefilled for signed-in users, required for
  guests, since without one there is no way to close the loop.
  - **It auto-attaches context**: build id, browser, screen size, and in the
    editor the project's id, format and element/asset counts. Unstructured
    feedback is mostly unactionable not because people are unhelpful but because
    they don't know which details matter — nobody thinks to mention their aspect
    ratio or that they were on Safari. This is the difference between a form
    that generates work and one that generates fixes.
  - **The attached context is shown before sending**, expandable in full.
    Collecting diagnostics silently would be a cheap trick.
  - Posts to the existing `/api/contact` (Resend + rate limiting), so no new
    infrastructure. Reports the endpoint's `fallback` response as an error
    rather than showing a false success when mail isn't configured.
- **A "What's new" dialog**, opening once per release and reachable from the
  account menu, with a dot on the avatar while unread. First-time users never
  see it — a changelog is meaningless before you have a "before", so a first
  visit is marked seen silently.
- `src/content/releases.ts` — user-facing release notes, and
  `lib/releaseSeen.ts` for the seen-tracking (called during render as a lazy
  state initialiser, so it can't live in a component module).

### Changed
- **`CLAUDE.md`'s living-docs rule now covers `releases.ts` as a fifth
  document.** The notes are deliberately *not* generated from `CHANGELOG.md`:
  that file names modules and explains root causes, which is right for whoever
  maintains this and noise for whoever uses it. The cost of two lists is drift,
  so the rule spells out which changes belong in which — and that purely
  internal work gets a changelog entry and no release note.

## [2026-07-28] — Number effects stop silently eating your text

### Fixed
- **Applying a number effect to ordinary text replaced it with `0`, with no
  warning.** `Rolling Number` and `Number Wheel` count between two numbers, so
  the renderer strips non-digits and falls back to `0` rather than drawing NaN —
  correct at render time, but it meant selecting "Launching soon" and picking
  Rolling Number silently turned the canvas into a static zero. The panel did
  warn, but only under the *To* field: below the problem, and only after the
  user had already lost the text on screen.
  - The Content field now warns as soon as the content isn't numeric, quoting
    what it can't show and saying it will render as `0`.
  - The labels become **Count from (number)** / **Count to (number)** for
    numeric effects, so the fields read as numeric slots rather than prose.
  - The original text is **not** overwritten, so switching to another effect
    brings it straight back — worth saying in the warning, since the canvas
    suggests otherwise.
- **A literal `"0"` was treated as invalid.** The old `Number(...) || 0` can't
  tell zero from garbage. The shared `parseEffectNumber` returns `null` only
  when there is genuinely no number present, so a counter starting at 0 no
  longer looks like a mistake.

### Changed
- **`parseEffectNumber` is shared between the renderer and the Properties
  panel** (`engines/project/types.ts`), along with `isNumberEffect` and
  `NUMBER_TEXT_EFFECTS`. Two implementations of "is this a number" would drift,
  and the panel would end up reassuring the user about a frame that says
  something else.

## [2026-07-28] — Every text effect previews, and says what it does

### Fixed
- **Eleven of the 34 text effects showed a blank preview.** `TextEffectPreview`
  looked only in the `Effects` map, but the effects are grouped by the shape of
  input they take across four maps — swap (`fade-through`, `per-word-crossfade`,
  `shared-axis-y/z`), from-to (`strikethrough-replace`, `slot-machine-roll`),
  numeric (`rolling-number`, `number-wheel`) and list (`value-swap`,
  `rolodex-flip`, `perspective-marquee`). Anything outside the first map
  resolved to `undefined` and rendered `null`, so a third of the catalogue
  looked broken rather than "this one takes different input". The preview now
  dispatches across all five shapes.

### Added
- **A one-line description under every effect preview**
  (`content/textEffectInfo.ts`, typed `Record<TextEffect, string>` so the
  compiler enforces coverage). A name like "shared axis Z" says nothing; the
  preview shows the motion, and the line says what the effect is *for* and what
  input it expects — which matters most for exactly the effects that were blank.
- **A replay button on the preview.** Most entrance effects finish in well under
  the loop length, leaving the preview parked on a static end frame that reads
  as frozen.
- The list and two-value effects preview with **sample data** — "Before" →
  "After", 0 → 100, three list items — rather than the element's own text, so
  the preview doubles as a demonstration of the input shape they need.

### Changed
- **Effect maps moved out of `TextRenderer` into
  `engines/rendering/textEffects.ts`.** Exporting shared constants from a
  component module breaks fast refresh, and the preview needed four more of
  them. The split also puts all four maps in front of anyone importing one,
  which is the mistake that caused the blank previews. Same shape as
  `content/blocks/registry.ts`. Net lint warnings went down.

## [2026-07-27] — Getting-started strip on a sparse dashboard

### Added
- **A compact getting-started strip under the project grid, shown while the user
  has fewer than five projects.** Two or three cards in a wide grid reads as
  abandoned rather than new, and that is exactly the point where someone is
  still learning the flow — or returning after a fortnight having forgotten it.
  It carries the same three steps as the empty state (template → edit text →
  export) plus a shortcut to open a demo project.
  - Deliberately *not* the full empty state: next to real projects a hero-sized
    onboarding block would talk over the thing the user came for.
  - Dismissible, and it retires on its own at five projects. Someone with four
    projects who knows the app shouldn't have to scroll past it forever.

### Changed
- **Extracted the shared onboarding content into
  `components/gettingStarted.ts`** — the step copy, the demo template id, and a
  `useQuickDemo()` hook holding the create-and-open logic. The empty state and
  the strip say the same thing at different sizes; duplicating it would have let
  the onboarding contradict itself depending on how many projects you happen to
  have. `EmptyState` lost its own copy of the demo handler as a result.

## [2026-07-27] — Tour covers the assets panel and text effects

### Added
- **Three more tour steps** (10 → 13): **Add media** (uploads, drag-and-drop
  anywhere in the panel, and that uploads are what let Cloud Render see your
  files), **Stock** (free Pexels search), and the **Effects** section, where the
  34 text effects and their live previews live.
- `data-tour` anchors for those: `add-media` and a generated `{tab}-tab` in
  `AssetsPanel`, and an optional `tourId` prop on the Properties panel's
  `Section`.

### Changed
- **Tour steps now resolve against the live DOM.** `buildEditorTourSteps()`
  drops any step whose anchor isn't currently rendered. The Effects section only
  exists while a text element is selected, and the first run happens on an empty
  canvas — a step pointing at a missing element would have left a popover
  floating over nothing. A useful side effect: **replaying the tour with text
  selected shows more than the first run did.** It also means a future panel
  rename degrades to a shorter tour rather than a broken one.
- Tightened the **Your media** and **Properties** step copy, which now overlaps
  the new dedicated steps.

## [2026-07-27] — Property previews play again; selection handles stay under modals

### Fixed
- **The text effect, shader and animation previews sat frozen on their first
  frame.** All three passed `inputProps={{ ... }}` as an object literal, so
  every re-render of the Properties panel looked like new data to the Player and
  reset it to frame 0 — and that panel re-renders on any store change. Since the
  previews exist precisely to answer "what does this effect *do*", a still frame
  made them worse than useless. All three now memoise `inputProps` and drive
  playback from a `PlayerRef` rather than trusting `autoPlay`.
  `AnimationPreview` memoises on the array's serialised contents, since callers
  build the array inline and a reference-keyed memo would never hit.
  This is the fourth time this exact bug has shipped in this codebase.
- **Selection handles painted over the export dialog.** `react-moveable` gives
  its control box `z-index: 3000`; modals sit at `z-50`. With no stacking
  context between them, the 3000 competed at the document root and won. The
  stage now carries `isolate`, confining Moveable's z-index to the canvas.

## [2026-07-27] — Browser export keeps effects by default

### Changed
- **"Include effects" is now on by default — but only for projects that use
  them.** Off, the export silently drops text effects, backgrounds and blocks,
  which is the wrong default for a project built around them. On for a plain
  text-and-images project it would be pure cost: slower, more ways to fail, for
  a byte-identical file. The toggle seeds from `usesUnsupportedFeatures`, the
  same check that drives the warning banner, and stays manually overridable.

### Added
- **A canvas fallback when the beta renderer fails.** Promoting a beta path to
  the default meant a failure would have cost the user their export outright —
  previously they'd have got an error and no video. It now retries through the
  flattened canvas exporter so a file is always produced, and reports that it
  did: the video is complete but without effects, with a route to Cloud Render
  for one that isn't. Falling back silently would hand back exactly the
  degraded video the default was chosen to avoid.
  If the canvas path fails too, the *original* web-renderer error is surfaced —
  when both paths fail the beta renderer wasn't the cause (missing media fails
  either way), so the fallback's error describes the problem worse.
  Verified by forcing the renderer to throw: the fallback ran, the file
  downloaded, and the notice appeared.

## [2026-07-27] — Session tokens stopped expiring mid-edit

### Fixed
- **Uploads and quota returned 401 "Invalid session" after a long editing
  session.** Every API caller passed a token that `useAuth` captured at mount
  and refreshed only when Supabase happened to emit an auth event. Supabase
  access tokens last about an hour, so a long session sent an expired JWT and
  `/api/quota`, `/api/upload-url` and cloud render all failed at once.
  - New `lib/authToken.ts` resolves the token **at request time**, refreshing it
    a minute before expiry, and `apiFetch` retries once against a forced refresh
    if a 401 comes back anyway (clock skew, or a session rotated in another tab).
  - `api.*` no longer takes a `token` argument at all, so the stale value can't
    be reintroduced by a call site. `useAuth`'s `token` is documented as a
    presence signal for UI gating only.
  - The asset upload path had a comment claiming it read the token "fresh" via
    `getSession()` — but `getSession()` returns the *stored* token whether or not
    it has expired. Fresh read, stale token; that was the bug.
- **A thousand-plus console warnings during a browser export.**
  `text-rendering: optimizeLegibility` was set on `:root` and so inherited
  everywhere; `@remotion/web-renderer` copies computed styles onto a canvas
  context, where the value arrives lowercased and Chrome rejects it — once per
  frame. Dropped it; Chrome's default `auto` already does kerning and standard
  ligatures. (A remaining `CanvasFontStretch '100%'` warning is upstream in the
  beta web renderer — Chrome serialises `font-stretch: normal` as a percentage,
  which its canvas API won't take. Cosmetic, and not ours to fix.)
- **The browser tab claimed effects "are not included" even with the effects
  renderer switched on.** That line is now conditional.

### Changed
- **Browser-export copy.** The warning leads with the consequence rather than
  the mechanism — "Your text effects and blocks won't appear in this file" —
  says the export still succeeds, and then offers *both* remedies: the effects
  toggle, or Cloud Render. It previously named only Cloud Render, sending people
  to a quota-limited path when a free one was one checkbox away.
- **"Include effects (experimental)" is now "Include effects" with a Beta
  badge**, and names what still differs (gradient-filled text, 3D transforms,
  blend modes) instead of the vague "some things may still differ".

## [2026-07-27] — Tour covers shaders, blocks and project settings

### Added
- **Three more tour steps**, taking the editor walkthrough from seven to ten.
  All three point at features that already shipped but that a first-time user
  had no reason to click:
  - **Animated backgrounds** — the sparkle button. 18 shader presets, and the
    single fastest way to stop a video looking like plain text on black.
  - **Blocks** — the terminal/code/steps/confetti menu. It's an icon-only
    button whose popover is the only place the four blocks are named.
  - **Project settings** — the `16:9 · 30 fps · 10s` readout reads as a status
    label, but it's a button, and it's the only way to change aspect ratio,
    frame rate or length after creation. The step says so explicitly: nothing
    is locked in at creation.
- `data-tour` anchors for those three controls (`shader`, `blocks`,
  `project-settings`).

### Changed
- The opening tour step no longer lists what the shader and block buttons do,
  since each now gets its own step; it just orients you to the insert cluster.

## [2026-07-27] — Legible progress steps, and a real first-run dashboard

### Fixed
- **The Progress steps block rendered as a bare line — its node layout was
  broken.** Each step was a flex item with `width: segment` *and*
  `marginRight: -segment`; the negative margin cancels the item's own width, so
  every node was laid out at the same x and all of them stacked into a single
  dot. The SVG track, sized independently, overflowed the element box and got
  clipped. Nodes are now positioned absolutely along the track — each offset is
  a direct function of `trackLength` — and the track is plain divs, so the box
  dimensions and the drawn content can't disagree.
  Caught by rendering the block headlessly through the Remotion CLI and looking
  at the frame; a first pass that only enlarged the numbers made the broken
  layout bigger without fixing it.
- **Progress steps geometry was hard-coded for a small preview box** — a 920px
  track, 44px nodes and **15px labels**. Against a 1920×1080 composition that
  put the step names at 1.4% of the frame height, roughly four pixels in the
  editor preview. Geometry is now props (`trackLength`, `nodeRadius`,
  `labelSize`) with defaults sized for a real canvas (1200 / 40 / 40), and
  stroke width, gaps, the check icon and the node glow all derive from node size
  so one control resizes the component coherently.
  Existing projects pick the new sizes up automatically, since `blockProps`
  merges over the registry defaults and never stored these keys.
- **Each step lit up before its incoming line arrived.** Segment `i` began
  filling at `(i+1) * stepDuration` — a step behind the node it feeds — so a
  node showed its check while the line reaching it was still half drawn. It now
  fills between node `i` and node `i+1` activating.

### Added
- **Size and direction controls for Progress steps.** Track length, node size
  and label size are exposed as number fields, and **Direction** finally exposes
  the `orientation` prop — it was in the block's defaults but had no field, so
  vertical pipelines were unreachable from the UI. Needed a new `select` field
  type in the block registry, rendered by `PropertiesPanel`.
- **A first-run dashboard.** With zero projects the Dashboard was a 14-line
  placeholder: an icon, "No projects yet", and a button. It now shows a live
  template preview, a three-step "how it works" summary (template → edit text →
  export), and a pointer to the editor tour.
- **Try a demo project.** One click builds a finished project from the
  *Feature shipped* template and opens it in the editor — no picker, no naming,
  no format decision. A first-timer shouldn't have to make three choices before
  seeing what the editor looks like.

### Changed
- The Progress steps block's default box is 1400×320 (was 1400×260) so the
  larger labels sit inside it, and the *How it works* template's block was
  repositioned to match.

## [2026-07-27] — Changed: simplified both preview surfaces

The previous versions were over-built and still didn't work well. Replaced with
the obvious approach.

### Changed
- **Template preview is now click-to-play.** A play button; nothing loads until
  you press it, then it plays and loops. Removes the autoplay, the initial-frame
  offset and the loading state — a preview that loads on demand can't feel slow
  to load, because you asked for it.
- **Dashboard cards use one Player, paused, that plays while hovered**
  (120 lines → 82). Removed the IntersectionObserver and visibility gate and
  the loading placeholder.
  - Swapping between `<Thumbnail>` and `<Player>` on hover was tearing down and
    rebuilding a WebGL canvas. A MutationObserver caught it remounting **eight
    times in three seconds** with the pointer held still — and only
    intermittently, which is why it presented as "starts, then sticks". One
    Player that pauses and plays avoids the churn completely, and matches the
    template preview, which behaves correctly.
  - It rests on frame 40%, because frame 0 is blank while entrance effects are
    at opacity 0, and plays from 0 on hover — where blank doesn't matter,
    since it moves off immediately.
- **Playback is driven explicitly through the player ref, not `autoPlay`**, in
  both the template preview and the hover preview. The earlier symptom — a
  preview that looked frozen — was a player parked on a static frame and never
  actually playing.
- **Dropped the dashboard shader prefetch.** It only existed to cover mounts the
  IntersectionObserver was deferring; with thumbnails mounting immediately it
  was doing nothing. `projectShaderPresets` went with it.

All prefetching is removed, including the derived-import map and
`templateShaderPresets` that existed only to serve it; `ShaderRenderer` is back
to a plain lazy map.

Files: `src/features/dashboard/components/{TemplatePreview,ProjectThumbnail}.tsx`,
`src/features/dashboard/DashboardPage.tsx`, `src/engines/project/index.ts`

---

## [2026-07-27] — Performance: warm template shaders when the New Project dialog opens

### Changed
- **Template previews no longer wait on a network fetch.** Each of the 18
  shaders is its own lazy chunk (~8–20 KB, plus a shared 24 KB runtime and a
  24 KB noise texture on first use), so the first preview using a given shader
  paid for fetching and compiling it while later ones were instant — which is
  exactly why some templates appeared immediately and others visibly lagged.
  Opening the dialog now warms all 15 shaders the template set uses.
- Scheduled via `requestIdleCallback`, because this is speculative work and
  must never compete with the preview the user is looking at right now.
  Failures are swallowed — a missed prefetch just falls back to the normal
  lazy load.
- `ShaderRenderer` now derives both its lazy components *and* the prefetcher
  from one importer map, so a newly added shader can't be wired into one and
  forgotten by the other. The list of shaders to warm is likewise derived from
  the template definitions rather than hardcoded.

### Also on the dashboard — scoped to the user's own projects
- The dashboard warms **only the shaders its projects actually use**, derived
  from the projects themselves. This is bounded by definition: it can never
  fetch more than the thumbnails would fetch anyway as their cards mount, it
  only moves the work earlier — which matters because a card below the fold
  doesn't mount its thumbnail until scrolled near, so scrolling used to stall
  on a fetch.
- What is *not* done there is prefetching the whole 18-shader set, which would
  pull ~156 KB for backgrounds a user may never see on a page that typically
  needs one or two.

### Note on the earlier "slower" report
`initialFrame` was ruled out as a cause by reading the Player source: it's used
once, in a lazy `useState` initialiser, so it costs nothing at runtime. The
delay was always present; it only became perceptible once the previews had
visible content to arrive at, rather than resolving to the same blank frame
they started on.

Files: `src/engines/rendering/components/renderers/ShaderRenderer.tsx`,
`src/content/templates/index.ts`,
`src/features/dashboard/components/CreateProjectModal.tsx`

---

## [2026-07-27] — Fixed: previews opened on a blank frame, and looked stuck while loading

### Fixed
- **The template preview and dashboard hover preview showed nothing.** Both
  started at frame 0 — and every template opens with an entrance effect, which
  animates opacity *from* 0. Frame 0 is a genuinely blank frame, and with the
  shader backgrounds muted to 0.14–0.35 by the design pass it renders as a
  near-black rectangle. Nothing was broken: a console check confirmed the
  canvas present at the right size with a live WebGL context, faithfully
  rendering an empty first frame. (An earlier layout theory was tested in the
  browser and disproved — `height: 100%` resolves fine against those wrappers.)
  Both now open part-way in: the template preview at 35%, the hover player at
  the same poster frame the static thumbnail already used, so hovering
  continues from what you were looking at rather than cutting to blank.
  Looping still brings the entrance animation around.
- **Previews looked stuck while starting.** A preview is a real composition —
  it lazy-loads a shader chunk, creates a WebGL context and renders at full
  composition resolution before it can show a pixel. That cost is inherent, but
  showing an empty box meanwhile reads as broken. All three now use Remotion's
  `renderLoading` to show a placeholder until the first frame is ready.

### Changed
- The tour's Properties step now says the headings collapse and that **Motion —
  where the animation presets live — starts closed**. Defaulting it closed
  saves seven Remotion Players per selection, but had made the presets
  undiscoverable, which is a poor trade to make silently.

Files: `src/features/dashboard/components/{TemplatePreview,ProjectThumbnail}.tsx`,
`src/features/workspace/tour/editorTour.ts`

---

## [2026-07-27] — Fixed: Add Block button; collapsible Properties; /contact rebuilt

### Fixed
- **The Add Block button did nothing.** Wrapping it in `TooltipHint` broke the
  control outright: `PopoverTrigger`'s `asChild` cloned `TooltipHint` with the
  trigger's props and ref, and `TooltipHint` — a plain component — dropped
  them, so the click never reached the button. A regression from the tooltip
  pass. Both triggers now chain `asChild` onto the same Button, and the trap is
  documented on `TooltipHint` itself.

### Changed
- **Motion, Transform and Layer are now collapsible.** The headline reason
  isn't scrolling: `AnimationSection` renders an `<AnimationPreview>` per
  animation preset and each is a full Remotion `<Player>`, so selecting any
  element mounted **seven of them looping at once**, on top of the effect
  preview and the canvas. Collapsing Motion unmounts all seven.
  - The secondary reason still holds: a text element renders ~1000px of
    controls into a panel that gets `100vh − 268px` (~630px on a 13" laptop),
    so Transform and Layer sat permanently below the fold.
  - **The defaults carry the value, not the mechanism** — a collapsed section
    is hidden too. Motion starts closed (it's the expensive one, and presets
    are a one-time choice); the rest start open. State persists per section.
  - Only the three sections that benefit were converted. `Section` renders a
    plain header when given no children, so the other five call sites are
    untouched — no need to re-nest all nine.
- **`/contact` rebuilt as the landing page's old contact section** now that the
  landing carries only a credit band: name and role, the portfolio as a
  gradient pill showing the real domain, click-to-copy email, brand-coloured
  socials, and the message form.
  - Drops the bio, avatar, location, availability status and résumé link. This
    is "how to reach the person who made this" for someone using a product,
    not a CV.
  - `profile.ts` trimmed to what's actually rendered. It had been lifted whole
    from a portfolio site and carried seven unused fields — two of which
    pointed at files that were never added (an avatar image and a résumé PDF)
    and would have 404'd had anything rendered them.

Files: `src/features/workspace/components/{Toolbar,PropertiesPanel}.tsx`,
`src/components/ui/tooltip.tsx`, `src/features/contact/ContactPage.tsx`,
`src/content/profile.ts`

---

## [2026-07-27] — Changed: landing page reworked around the product

The page pitched twice, then pointed away from itself.

### Changed
- **Removed the four-card feature grid.** It covered the same ground as the
  `ProductTour` directly beneath it, in the same order — one description was
  character-identical between the two files. The tour keeps the explaining
  (it has real screenshots); a compact spec block now states what's in the box.
- That spec block **absorbs the orphaned stats line**, which sat between two
  sections with no heading of its own and claimed "22 text effects · 18
  shaders" long after there were 34 effects, 18 shaders, 4 blocks and 21
  templates. Counts verified against the source arrays rather than retyped.
- **Inverted the CTA hierarchy.** The loudest element on the page was the
  portfolio button — gradient fill, violet glow, hover lift — while the product
  CTA was a flat rectangle. The strongest visual pull was sending visitors off
  the site. The hero CTA now carries that weight and **fires analytics**; it
  previously fired none, so hero→signup conversion was unmeasurable.
- **The author section becomes a credit band in the footer.** It was a full
  section with a heading, gradient button, socials and an entire contact form —
  roughly 40% of the height below the fold spent on the author rather than the
  product. The form already exists on `/contact`.
- Nav **Contact** routes to `/contact` instead of the `#contact` anchor, which
  no signed-in visitor could ever reach: `/` redirects to `/dashboard`, so the
  whole section was unreachable once logged in.

### Fixed
- **Dead code in ProductTour**: no step has ever been a video, so the
  `mediaKind` union, the `<video>` element and its error state were
  unreachable. `TourMedia` now takes an image and real alt text.
- **Two developer-facing strings shipped to visitors.** "Media not found —
  check file path or add the asset" → "Preview unavailable"; the guest sign-in
  failure no longer instructs the user to change a setting in a Supabase
  dashboard they have no access to.
- The tour's media frame is solid-bordered rather than dashed — dashed read as
  an empty placeholder even with the screenshot loaded.

### Performance
- **Landing screenshots converted to WebP**: 2.4 MB of PNG (one file 1.27 MB
  on its own) → **172 KB total, a 93% reduction**, at identical dimensions,
  verified before the originals were deleted.

Files: `src/features/landing/LandingPage.tsx`,
`src/features/landing/components/{ProductTour,AuthPanel}.tsx`,
`src/lib/analytics.ts`, `public/assets/landing/*`

---

## [2026-07-27] — Fixed: dev-server API calls, frozen template previews; added viewer controls

### Fixed
- **Every API call failed on the dev server** with
  `Unexpected token '<', "<!doctype "... is not valid JSON`. `/api` is served
  by Vercel functions that don't exist under `vite dev`, so requests fell
  through to the SPA catch-all and got `index.html` back. It presented as a
  stock-search bug but hit quota, render and contact equally; production was
  correct throughout (it returns proper JSON, including a 401 when unauthed).
  Added a dev proxy to the deployment, overridable via `VITE_API_PROXY` for
  anyone running `vercel dev` to work on the API itself.
- `apiClient` now checks the content type before parsing, so a non-JSON
  response names the actual problem instead of failing inside `JSON.parse`
  with a message about a doctype.
- **Template previews in the New Project dialog sat frozen.** `inputProps` was
  built inline, so it was a fresh object each render and Player read the
  identity change as new data and snapped back to frame 0 continuously. Now
  memoised. Third time this exact trap has appeared here — `CanvasPanel`'s
  `inputProps` and `PRESET_PREVIEW_ANIMATIONS` both already carry comments
  about it.

### Added
- **Fullscreen and mute controls on the canvas**, beside the zoom readout,
  driving the Player's own `requestFullscreen`/`mute` methods. Preview could
  previously only play inline, and a project with sound had no way to silence
  it while working. Mute only appears when something can actually produce
  audio — an audio clip, or a video whose track plays through the Player.
  `allowFullscreen` is now on; double-click-to-fullscreen stays off because
  that gesture edits text.

Files: `vite.config.ts`, `src/lib/apiClient.ts`,
`src/features/dashboard/components/TemplatePreview.tsx`,
`src/features/workspace/components/CanvasPanel.tsx`

---

## [2026-07-27] — Added: guided first-run walkthrough of the editor

### Added
- **A seven-step tour** over the real editor controls — insert tools, assets,
  canvas, properties, timeline, preview, export — running once on first editor
  open. Built on `driver.js`.
- Its actual purpose is the gestures that can't be discovered by looking:
  **double-click text to edit it**, **drag a clip's edge (not its body) to
  trim**, and that **motion pauses while an element is selected**. Every one of
  those had a first-time user reasonably conclude something was broken.
- Steps anchor on `data-tour` attributes rather than class names, so restyling
  a panel can't silently break the tour. Verified every step resolves to a real
  anchor.
- `driver.js` plus both stylesheets load **dynamically** — a once-per-user
  event has no business in the main bundle. It builds as its own chunk,
  ~7.2 kB gzipped, fetched only when the tour actually runs.
- **Replayable** from the account menu — otherwise it's strictly one-shot, and
  the one time it runs is the moment you understand the app least. The entry
  only appears inside the editor, since that menu is shared with the dashboard.
- Restyled to the `--studio-*` tokens: driver.js ships a white popover which
  would read as a third-party overlay pasted onto a dark app.
- New `editor_tour_started` event, flagged with whether it was a replay.

Files: `src/features/workspace/tour/{editorTour.ts,useEditorTour.ts,tour.css}` (new),
`src/features/workspace/components/{EditorLayout,Toolbar}.tsx`,
`src/components/UserMenu.tsx`, `src/lib/analytics.ts`

---

## [2026-07-27] — Changed: editor usability pass

A UI audit found several traps that made working features look broken.

### Fixed
- **Picking a text effect appeared to do nothing.** Selecting an element
  strips its `animations` and `textEffect` from the preview — deliberate,
  since an entrance effect starts at `opacity: 0` and the element you're
  trying to drag would be invisible. But nothing said so, so the effect read
  as not applying at all. A notice now appears on the canvas when the
  selection genuinely has motion being withheld, pointing at Preview. Its
  condition lives in a separate memo so it can't destabilise the `inputProps`
  memo, which is intentionally stable (a fresh reference each frame resets
  Player/WebGL state during playback).
- **Nothing could be deleted without the keyboard.** Delete/Backspace was the
  only route, and that key is ignored whenever focus is in a field — which in
  the Properties panel is nearly always. Delete controls added to the
  Properties header and every timeline track row.
- `clipLabel` had drifted between the two timeline files: a clip showed a
  block's registry name ("Terminal") while the track header printed the raw
  discriminant ("block"). Now one shared function.

### Changed
- **The Assets panel is rebuilt around getting media in.** It opened on the
  Images tab — empty on every new project — so a new user's first sight was
  "No images yet", while Upload and Stock were 40px icons among five tabs in a
  220px rail. Now a permanent **Add media** button, two tabs (Library, Stock),
  a type filter inside Library, and drop-anywhere-in-the-panel.
  - Search moved inside Library; it used to render over Stock and Upload where
    typing produced no feedback at all.
  - Unsupported files were skipped in silence — rejected names are now listed.
  - Stock search was Enter-only with no button, and looked usable when signed
    out, failing only after submit; it now says so up front and has a button.
  - Uploading no longer yanks the active tab based on the first file's type.
  - `UploadTab`, `EmptyAssetState` and `TAB_TYPE` deleted as unreachable.
- **Real tooltips.** Every hint was a native `title` — ~1s delay, unstyled,
  on controls that are 8-of-11 icon-only. `radix-ui` was already a dependency,
  so a `Tooltip` primitive joins the existing popover/dialog, with a
  `TooltipHint` wrapper and a 200ms delay. Undo/Redo shortcuts are now
  legible, and Add Block explains what a block is.
- Merged the two side-by-side controls that both went to `/dashboard`. The
  timeline keeps its own transport — a play control beside the scrubber is a
  different context, not a duplicate.

Files: `src/features/workspace/components/{CanvasPanel,AssetsPanel,PropertiesPanel,TimelinePanel,Toolbar}.tsx`,
`src/features/workspace/components/timeline/clipLabel.ts` (new),
`src/components/ui/tooltip.tsx` (new)

---

## [2026-07-27] — Added: missing-media indicator in the Assets panel

### Added
- **Assets that can't be loaded now say so.** Once the renderers started
  skipping unresolvable media (to stop the decoder hanging on a dead URL), that
  media simply vanished from the canvas with nothing but a console warning —
  no way to tell *which* file needed replacing. Such assets now render as a
  dashed amber "Re-upload needed" tile in the Assets panel, still showing the
  filename, and aren't draggable onto the canvas.
- Uses the same `isUrlUsable()` the renderers use, so the panel and the canvas
  can't disagree about whether a file is available. Promoted from a deep import
  to the `engines/asset` barrel alongside `createObjectUrl`/`revokeObjectUrl`.

Files: `src/features/workspace/components/AssetsPanel.tsx`,
`src/engines/asset/index.ts`

---

## [2026-07-27] — Fixed: the editor itself hung on unavailable media

### Fixed
- **The retry storm came from the editor preview, not the export.** Fixing the
  export path didn't stop it: `rehydrateAssets` returned an asset *unchanged*
  when it found neither local bytes in IndexedDB nor a `storageUrl`, leaving a
  dead `blob:` URL in the project. The preview `<Player>` then mounted
  `<Video src="blob:…">`, and `@remotion/media` treats a failed fetch as
  retryable — so it hammered a URL that can never resolve, forever, before the
  user even pressed Export. The older `<OffthreadVideo>` failed quietly, which
  is why this only appeared after that swap.
- `rehydrateAssets` now blanks the URL of an asset it can't resolve (and logs
  which one), and `ElementRenderer` skips any element whose asset has no usable
  URL. Rendering nothing is deliberate — a dead `src` hangs the composition.
- Export still refuses rather than silently producing a video missing content:
  the unusable-asset check now catches blanked URLs as well as stale blobs.

### Not done
- Missing media currently just vanishes from the canvas with a console warning;
  there's no in-editor indicator telling you *which* asset needs re-uploading.
  The Assets panel is the obvious home for that.

Files: `src/engines/asset/rehydrate.ts`,
`src/engines/rendering/components/ElementRenderer.tsx`,
`src/engines/export/webRenderer.ts`

---

## [2026-07-27] — Fixed: dead blob URLs hung the in-browser export forever

### Fixed
- **Exporting a project whose media wasn't in S3 spun forever** on
  `GET blob:… net::ERR_FILE_NOT_FOUND`, retrying the failed fetch endlessly
  instead of failing. A project's stored asset `url` is a `blob:` minted by
  whichever session imported the file; those die with the session, so a project
  reopened later — or synced from another device — carries dead references, and
  the previous code only substituted `storageUrl` when one happened to exist.
- The web-render path now re-reads asset bytes from IndexedDB and mints a fresh
  object URL at export time (the same thing `rehydrateAssets` does when opening
  the editor), falling back to S3, and **revokes them afterwards**. If a
  referenced file is genuinely gone it now throws a clear message naming the
  asset instead of hanging — an unexplained hang is worse than an error.

### Known trade-off
- The main bundle grew from ~1,780 kB to ~2,148 kB (gzip 529 → 621 kB) because
  `@remotion/media` is statically imported by the video/audio renderers, which
  are on the editor's critical path — it can't be lazy-loaded without breaking
  the guarantee that preview and export run the same components. Route-level
  code splitting (landing vs editor) is the real fix and isn't done.

Files: `src/engines/export/webRenderer.ts`

---

## [2026-07-27] — Fixed: video and audio now render in the browser too

### Fixed
- **`<OffthreadVideo>` and `<Html5Audio>` are rejected by the client-side web
  renderer**, so any project containing video or audio failed to export with
  effects enabled. Both renderers now use `<Video>` and `<Audio>` from
  **`@remotion/media`** (added, pinned to `4.0.488` to match every other
  Remotion package — its only deps are `remotion@4.0.488` and
  `mediabunny@1.50.8`, both already present at those exact versions).
- **This is safe for Lambda.** `@remotion/media` decodes via Mediabunny and
  works in *both* the browser and server-side rendering, falling back to
  `<OffthreadVideo>` server-side if a file can't be decoded. Verified by
  rendering a video-plus-audio composition through the Remotion CLI: no
  fallback was triggered, and `ffprobe` confirms h264 + aac streams in the
  output. One component now covers every render path.
- Worth knowing: `@remotion/media` **requires CORS headers on the media URL**
  and falls back (or fails, client-side) without them. The S3 assets bucket is
  already configured for this.

### Known limitation
- **Shimmer Sweep produces no shimmer in browser export.** Its whole mechanism
  is `background-clip: text`, which the web renderer doesn't support. It
  degrades gracefully — the base text still renders, just without the sweep —
  rather than breaking the frame. Cloud Render is unaffected.

Files: `src/engines/rendering/components/renderers/{VideoRenderer,AudioRenderer}.tsx`,
`package.json`

---

## [2026-07-27] — Fixed: CORS-tainted media in both browser export paths

### Fixed
- **Remote (S3) images broke in-browser rendering with a CORS error**, despite
  the bucket being configured correctly — it does return
  `Access-Control-Allow-Origin: *` when an `Origin` header is sent. The real
  cause was **cache poisoning**: S3's *non*-CORS response carries no `Vary`
  header, so once the browser cached a plain `<img>` load (the dashboard
  thumbnail, or the editor canvas), it reused that ACAO-less response for the
  renderer's later CORS request and the fetch was blocked. Fixed by requesting
  remote assets consistently as CORS requests — `crossOrigin="anonymous"` on
  `ImageRenderer`'s `<Img>` — so only the CORS-flavoured response is ever
  cached. **You may need one hard refresh** to evict an already-poisoned entry.
- **The same bug silently broke the original browser export.** `prepareSources`
  in `exporter.ts` built `new Image()` / `<video>` without `crossOrigin`, so any
  cloud-synced asset tainted the export canvas and encoding would fail with a
  SecurityError. It set `src` first too — `crossOrigin` has to be assigned
  *before* `src` or the non-CORS fetch has already begun. Both fixed.
- **`renderMediaOnWeb()` requires a licence key.** Now read from
  `VITE_REMOTION_LICENSE_KEY`, defaulting to `free-license`. Kept as config
  rather than hardcoded, since asserting licence eligibility is a legal claim —
  verify at https://remotion.dev/license.

Files: `src/engines/rendering/components/renderers/ImageRenderer.tsx`,
`src/engines/export/exporter.ts`, `src/engines/export/webRenderer.ts`

---

## [2026-07-27] — Added: experimental in-browser export that keeps effects

### Added
- **An opt-in "Include effects" checkbox on the Browser export tab**, backed by
  `@remotion/web-renderer` — which turned out to already be installed, since it
  ships with the pinned Remotion version. Unlike `canvasFrame.ts` (which
  hand-draws text/image/video onto a 2D canvas and therefore drops every effect),
  this runs the real `MotionComposition`, the same component the editor preview
  and Lambda use.
- **Known not to be full parity.** The web renderer emulates layout and styles
  onto a canvas and supports a subset: no `background-clip: text`
  (shimmer-sweep), no 3D transforms (perspective-marquee), no blend modes
  (glass-code-block's frosted panel), no `<OffthreadVideo>` (video elements),
  and `z-index` is ignored in favour of paint order — so elements are sorted by
  `zIndex` before rendering. Shader behaviour is untested. Upstream flags the
  package experimental. Hence opt-in, and Lambda remains the fidelity guarantee.
- `@remotion/web-renderer` is **dynamically imported** — statically importing it
  put ~180 kB (~53 kB gzipped) on the main bundle for a path most visitors never
  use. It now builds its own chunk, matching how every effect and shader is
  lazy-loaded.

### Fixed
- `MotionCompositionProps` changed from an `interface` to a `type` alias. An
  interface can be augmented, so TypeScript won't accept it as
  `Record<string, unknown>`, which Remotion's composition APIs require — the
  same trap that once made `<Composition>` infer props as `unknown`
  (ARCHITECTURE.md §6). Now documented at the definition.

Files: `src/engines/export/webRenderer.ts` (new), `src/engines/export/index.ts`,
`src/engines/rendering/components/MotionComposition.tsx`,
`src/features/workspace/components/ExportDialog.tsx`

---

## [2026-07-27] — Fixed: cloud render couldn't finish long videos; browser export silently drops effects

### Fixed
- **Cloud render now works for videos of any length.** `api/render.ts` used to
  poll Lambda inside the request for up to 6 minutes, but no `maxDuration` was
  ever configured, so Vercel killed the function at its ~60s default. Lambda
  would finish and write the file to S3 while the caller saw a timeout — which
  is why nothing longer than a short clip could be rendered. It now queues the
  render and returns the `renderId` immediately (202), and the browser polls a
  new `api/render-status.ts`. That removes the ceiling rather than raising it,
  and the button shows a real percentage instead of an indefinite spinner.
  Verified the Lambda function itself was never the constraint: it's deployed
  at 120s per invocation and Remotion parallelises across invocations.
- Guest device-locking moved into the status endpoint, since a successful
  output is only observable there. A guest who abandons the tab mid-render
  isn't charged for it; the per-user monthly quota still applies.

### Changed
- **Browser export now warns about what it can't render.** It paints frames onto
  a 2D canvas (`engines/export/canvasFrame.ts`) rather than running the React
  composition, so it handles only text, image and video plus keyframes — **all
  34 text effects, all 18 shaders and all 4 blocks are absent from its output**.
  That was fine when elements were plain text and images; adding Remocn
  components made it wrong, and it stayed hidden because the editor preview uses
  the real renderer, so projects look correct right up until export. The dialog
  now inspects the project and names exactly what will be missing, with a link
  to switch to Cloud Render.
- Corrected README and ARCHITECTURE, which both claimed all three paths run the
  same React composition. True for the editor and Lambda; false for browser
  export.

Files: `api/render.ts`, `api/render-status.ts` (new),
`src/lib/apiClient.ts`, `src/features/workspace/components/ExportDialog.tsx`

---

## [2026-07-27] — Added: 60s and 90s project lengths

### Added
- **Project duration can now be 60s or 90s**, not just up to 30s. The cap made
  the product a short-clip maker by definition; a product explainer — the video
  we want to make to test whether the tool delivers real value — is 60–90s and
  simply couldn't be built. `DURATION_OPTIONS` in `ProjectSettingsPopover.tsx`
  gains 60/90 and the picker moves to a 3-column grid to fit six options.
- No timeline work was needed: `chooseTickIntervalFrames` already selects from
  `[1,2,5,10,15,30,60,…]`-second spacings targeting ~80px per label, so a 90s
  project lands on 10s ticks by itself. Verified by rendering the tail frames
  (2690–2699) of a 2700-frame composition through the Remotion CLI.

### Known limitation
- **Cloud Render can't finish a 60s/90s video.** `api/render.ts` polls Lambda
  for up to 6 minutes (`120 × 3s`), but no `maxDuration` is configured anywhere,
  so Vercel kills the function at its default (~60s). Short clips render inside
  that window — which is why the two renders on record succeeded — but a long
  one will fail with a timeout even though Lambda finished and the file exists
  in S3. **Browser export is unaffected**: it's WebCodecs on the user's own
  machine with no server involved. Documented in USER_GUIDE §3 and §15.
  The proper fix is to stop polling server-side: return the `renderId`
  immediately and let the client poll a status endpoint, which removes the
  ceiling entirely rather than raising it.

Files: `src/features/workspace/components/ProjectSettingsPopover.tsx`

---

## [2026-07-27] — Changed: templates follow Remocn's design rules (they were slop)

### Changed
- **Every template's background is now restrained.** The first pass ran vivid
  shaders at full opacity and `speed: 1` in nearly every template, which is
  precisely what Remocn's `anti-patterns.md` calls out as "the #1 tell" of
  generic-looking work: a bright, fast, full-frame wash that fights the text for
  attention. The `bg()` helper now defaults to `speed 0.3 / opacity 0.35`, with
  visually busy shaders (liquid-metal, metaballs, god-rays, dithering,
  dot-orbit) knocked back further to ~0.14–0.22. The composition's near-black
  shows through, so contrast — and legibility — goes up.
- **One accent colour per template, on a neutral base.** Text now uses a small
  palette from `design.md` (`#fafafa` primary, `#a1a1aa` secondary) with exactly
  one accent per video — green `#22c55e`, sky `#0ea5e9`, violet `#a855f7`, or
  warm `#d97757` — applied only to the emphasised element (a kicker, an active
  number, a price). Previously every line was pure white, so nothing led.
- **ALL-CAPS removed** ("JUST SHIPPED" → "Just shipped", "NOW LIVE" → "Now
  live", "30% OFF" → "30% off", …). `design.md` rule 2 is explicit that
  uppercase shouldn't be a reflex for emphasis; hierarchy comes from size,
  colour and weight instead.
- Verified by rendering a template through the CLI and comparing frames, not by
  assuming — the difference is large and visible.

Note: this is a correction of my own earlier work. The design rules were read
during the template build and then under-applied.

Files: `src/content/templates/definitions.ts`

---

## [2026-07-27] — Changed: dashboard groups projects by aspect ratio

### Changed
- **Projects are now grouped into Landscape / Portrait / Square sections.**
  With real previews in place, a single grid mixing formats looked ragged: a
  16:9 card is short and a 9:16 card nearly twice as tall, so rows never lined
  up. Each section now holds one shape, and only appears when it has projects.
- **Card thumbnails use their true aspect ratio again.** The previous layout
  squashed portrait cards (`min(h, w * 1.5)`, so 9:16 rendered as 9:13.5) purely
  to limit how much they broke the grid. Grouping removes that need, so a
  portrait card is now honestly 9:16.
- **Column counts differ per section** — portrait cards are tall, so that
  section uses more, narrower columns (up to 8) while landscape uses up to 5.
- Section config is keyed by `AspectRatio` rather than held in a plain array, so
  adding a fourth ratio without a section fails the build instead of silently
  hiding those projects from the dashboard.

Files: `src/features/dashboard/components/{ProjectGrid,ProjectCard}.tsx`

---

## [2026-07-26] — Added: live project previews on the dashboard, editor navigation

### Added
- **Project cards now show a real preview instead of an aspect-ratio label.**
  Every card was an identical grey box reading "16:9", so a list of projects was
  indistinguishable. Cards now render an actual frame of the project (40% in, so
  entrance animations have played) and animate on hover.
- **Two deliberate constraints in `ProjectThumbnail`:** it uses `<Thumbnail>`
  (a single static frame) rather than `<Player>`, upgrading to a playing Player
  only for the hovered card — because each shader background is its own WebGL
  context and browsers cap those around 8–16, so a grid of autoplaying previews
  would exhaust the limit and start losing contexts. It also only mounts once
  scrolled into view (IntersectionObserver, 200px margin) so a long list doesn't
  build every composition up front.
- Previews prefer an asset's `storageUrl` over its `url`: a project's `blob:`
  URLs are dead outside the session that created them and the dashboard never
  runs `rehydrateAssets`, so the S3 copy is the one that actually resolves —
  the same fallback the editor and export paths use.
- **Editor navigation** — a back arrow and a clickable logo in the editor
  toolbar, both returning to the project list; edits are already autosaved, so
  leaving mid-edit is safe. The dashboard logo now links to the landing page.

Files: `src/features/dashboard/components/{ProjectThumbnail,ProjectCard,DashboardHeader}.tsx`,
`src/features/workspace/components/Toolbar.tsx`

---

## [2026-07-26] — Added: 12 text effects, a `block` element type, 7 new templates

### Added
- **Expanded the component vocabulary, because templates had hit a ceiling.**
  The 14 templates all looked like *text on a shader* — not a design failure but
  the limit of a 5-type element model. An audit against the Remocn catalog found
  only 41 of its 122 components installed; missing were all 12 transitions, all
  6 UI blocks, all 9 social cards, confetti and 12 text animations. Conclusion:
  Remocn *is* the library, so don't build a custom one — the bottleneck was
  MotionStudio's element model.
- **12 new text effects**, grouped by how they read their content:
  *Numbers* — Rolling Number, Number Wheel, Slot Machine Roll ·
  *Swap* — Fade Through, Per Word Crossfade, Shared Axis Y/Z, Strikethrough
  Replace · *Lists & Marquee* — Value Swap, Rolodex Flip, Perspective Marquee,
  Infinite Marquee. This cost exactly **one new optional field**
  (`TextElement.contentTo`): list effects reuse `content` split on newlines,
  two-value effects animate `content` → `contentTo`, and numeric ones parse both
  with `Number()`. Their prop names differ upstream (`fromText`/`toText` vs
  `from`/`to`), so `TextRenderer` maps each group rather than forcing one
  signature.
- **A sixth element type, `block`** — structured components that take arrays and
  objects and therefore can't be text effects: **terminal-simulator**,
  **glass-code-block**, **progress-steps**, **confetti**. Backed by a registry
  (`src/content/blocks/registry.ts`) where each entry declares its lazy import,
  defaults, natural length, a field schema the Properties panel renders inputs
  from, and a `toProps` translator — so adding the next block is a registry
  entry, not a code change.
- **`blockProps` is deliberately flat and JSON-serializable.** Projects persist
  to localStorage and a Supabase JSONB column, so components wanting
  arrays-of-objects take a multiline string parsed at render time — a terminal's
  `$ ` / `✓ ` / `✗ ` line prefixes become `{text, type}` pairs.
- **7 new templates**, shaped by Remocn's own `references/archetypes/` shot
  lists (which turned out to be a frame-level spec for exactly this audience):
  *Dev & Product* — CLI demo, Code drop, How it works, Stack marquee ·
  *Announce* — Milestone counter (rolling number + confetti payoff) ·
  *Hooks* — Before → after · *Offers* — Price reveal. 21 templates total.
- Toolbar gained an **Add Block** control; new `editor_block_added` event.

### Fixed
- **Every Remocn text component was rendering in serif — in the editor *and* in
  exports.** All 30-odd of them set `font-family: var(--font-geist-sans), …,
  sans-serif`, but that variable ships with Remocn's Next.js setup and was never
  defined here. CSS treats an undefined `var()` with no fallback as invalid at
  computed-value time, which discards the **whole** declaration instead of
  falling through to the trailing `sans-serif` — so text silently fell back to
  the browser default, Times. Fixed by defining the variable once on
  `MotionComposition`'s root `AbsoluteFill`, the single component mounted by
  both the editor `<Player>` and the Remotion render. Found by rendering a
  template through the CLI and actually looking at a frame.
- Milestone counter's odometer was cropped: the digit reel scrolls vertically and
  `boxStyle`'s `overflow: hidden` cut it, so the box needed well over one line of
  height.

### Notes
- Verified by rendering block and number templates end-to-end through
  `npx remotion render` and inspecting real frames — not just the editor.
- Known, pre-existing: **shader backgrounds fail a local CLI render** with
  "WebGL is not supported in this browser" (headless Chrome without GPU flags).
  Lambda renders are unaffected; this only limits local CLI testing of
  shader-bearing templates.
- **Cloud renders need `npm run deploy:lambda-site`** to pick these components
  up — the Lambda S3 bundle is a separate deploy target from Vercel.

Files: `src/content/blocks/registry.ts`, `src/content/templates/definitions.ts`,
`src/engines/project/types.ts`, `src/engines/canvas/store.ts`,
`src/engines/rendering/components/{MotionComposition,ElementRenderer}.tsx`,
`src/engines/rendering/components/renderers/{TextRenderer,BlockRenderer}.tsx`,
`src/features/workspace/components/{PropertiesPanel,Toolbar}.tsx`,
plus 16 new components in `src/components/remocn/`

---

## [2026-07-26] — Added: 14 ready-made templates (fixes the blank-canvas problem)

### Added
- **Templates — the product had no starting point.** Every project began as an
  empty canvas needing ~20 operations to reach 10 seconds of output (New
  Project → name → aspect → fps → Create → Add Background → pick shader → Add
  Text → type → size → font → color → pick effect → speed → position → clip
  timing → Preview → Export → resolution → quality → download). That's why
  making a video felt hectic even for the person who built the editor. There
  was no shortage of capability — 22 text effects, 18 shaders, keyframes — just
  nowhere to start from. 14 templates now cut that to roughly three operations.
- **Template set**, spanning the two audiences that share the same composition
  shapes (builders announcing work; marketers/freelancers announcing offers):
  *announce* — Feature shipped, Now live, Coming soon, Metric milestone,
  Changelog drop · *hook* — Bold question, Quote card, Stat drop, Wait for it ·
  *offer* — New offer, Product drop, Testimonial · *basic* — Title card,
  Outro/CTA. Blank project is still there, unchanged.
- **Templates are just project data, not a second model.** A
  `TemplateDefinition` is a list of ordinary `CanvasElement`s minus their ids;
  `instantiateTemplate()` mints fresh ids per use. `createProject` gained two
  optional fields (`elements`, `durationInFrames`) and the blank path behaves
  exactly as before. Nothing new was needed in the renderer.
- **Deliberate constraint: templates carry text + shaders only, never media.**
  Image/video/audio elements reference an `assetId` whose bytes live in
  IndexedDB/S3, which a static definition can't ship — such a template would
  apply as a broken canvas. Text and the 18 shaders render instantly with
  nothing to upload.
- **The picker previews one template at a time, deliberately.** Each shader is
  its own WebGL context and browsers cap those around 8–16, so a grid of
  autoplaying cards would exhaust the limit. The selection previews beside the
  list — same pattern the Properties panel uses for effects/shaders — rendering
  the real `MotionComposition`, so the preview is literally the output.
- **`track.projectCreated` now carries `template_id` and `template_category`**
  (`'blank'` for an empty project). This is the point: which templates get used
  is the evidence for which audience the product is actually for, rather than
  deciding that from intuition.

Files: `src/content/templates/{types,definitions,index}.ts`,
`src/features/dashboard/components/{TemplatePicker,TemplatePreview,CreateProjectModal}.tsx`,
`src/engines/project/{store,types}.ts`, `src/lib/analytics.ts`

---

## [2026-07-25] — Added: stale-deploy detection with a dismissible update banner

### Added
- **A tab left open across a deploy now knows about it.** SPA route changes
  never re-fetch `index.html`, so a running tab had no way to learn a new
  version existed — it would just keep running old code until someone
  happened to hard-refresh. `vite.config.ts` now writes an unhashed
  `dist/version.json` at build time (`buildId` sourced from Vercel's
  `VERCEL_GIT_COMMIT_SHA`) and injects the same id into the client as
  `__APP_VERSION__`. A new `useVersionCheck` hook polls that file every 5
  minutes and on tab-focus (always `cache: 'no-store'`); on a mismatch it
  shows `<UpdateBanner>`, a small dismissible "new version available —
  Refresh" prompt. It deliberately never auto-reloads — this is an editor
  with in-progress work, and yanking the page out from under a mid-edit or
  mid-export would be worse than the staleness itself.
- **Safety net for lazy-loaded chunks specifically.** `main.tsx` listens for
  Vite's own `vite:preloadError` event and reloads automatically *there* —
  that only fires when one of the 22 text effect / 18 shader chunks has
  already failed to load (e.g. a very old tab whose deploy got pruned), so
  there's nothing left to lose by reloading.
- **Fixed the root `vercel.json` SPA rewrite to not swallow `version.json`.**
  The catch-all rewrite only excluded `api/`, `assets/`, and the two icon
  files — `version.json` wasn't in that list, so it would've silently served
  `index.html` instead of real JSON, breaking the whole mechanism without
  ever throwing a visible error. Added it to the exclusion list.
  Files: `vite.config.ts`, `src/vite-env.d.ts`, `src/hooks/useVersionCheck.ts`,
  `src/components/UpdateBanner.tsx`, `src/main.tsx`, `src/App.tsx`,
  `vercel.json`.

---

## [2026-07-25] — Fix: broken media after cross-device project sync

### Fixed
- **Images/video showed broken after opening a project synced from another
  browser or profile.** `rehydrateAssets` (run once per project open) only
  ever looked in the local IndexedDB blob store for asset bytes; if a device
  never had the file locally — exactly the case for a project pulled down by
  cloud sync — it silently left the *other* device's dead `blob:` URL in
  place instead of trying anything else, so the image/video/background just
  failed to load. The S3 `storageUrl` the background upload already
  produces (used by the Cloud Render export path via `storageUrl ?? url`)
  was sitting right there, unused for this. Added the same fallback to
  `rehydrateAssets`: local blob first, then `storageUrl`, then leave it as
  a last resort. Softened the USER_GUIDE §15 limitation bullet accordingly —
  media now mostly follows you across devices when signed in; it only stays
  device-only if you were signed out at upload time or open the project
  elsewhere before the background upload finishes.
  Files: `src/engines/asset/rehydrate.ts`.

---

## [2026-07-25] — Fix: cloud project sync never actually worked; delete-project support; shimmer-sweep color bug

### Fixed
- **Cloud project sync was completely non-functional since the feature was built.**
  `engines/project/cloudSync.ts` has always called `.from('projects')`, but the
  `projects` table **never existed in Supabase** — only `device_renders` and
  `renders` were ever created. Every `saveProject`/`loadProjects` call failed
  with `Could not find the table 'public.projects' in the schema cache`, but
  the error only went to `console.error`, so it silently looked like it worked.
  Projects only ever lived in the browser's local `zustand`-persisted storage,
  which is why opening a different browser (or clearing storage) always showed
  an empty dashboard — there was never a cloud copy to restore. Confirmed by
  querying the Supabase REST API directly with the service-role key (bypasses
  RLS) and getting a table-not-found error. Root-caused and fixed by creating
  `public.projects` (`id uuid pk`, `user_id uuid → auth.users`, `data jsonb`,
  `updated_at timestamptz`) with RLS policies scoped to `auth.uid() = user_id`,
  plus explicit `grant … to authenticated, service_role` (this project's
  `public` schema didn't have Supabase's usual default privilege grants
  applied, so the table alone still 403'd until grants were added). No code
  changes were needed — `cloudSync.ts` was already written correctly against
  a schema that simply didn't exist yet.
- **Shimmer Sweep text effect ignored the element's chosen color.**
  `TextRenderer.tsx` passes every text effect a shared `{ text, fontSize, color,
  speed }` prop set, but `ShimmerSweep`'s own props were named `baseColor` /
  `shineColor` — so the `color` prop was silently dropped and the base text
  always rendered with the hardcoded default gray, no matter what color was
  picked in the Properties panel. Renamed the prop to `color` to match the
  shared signature every other effect in the `Effects` map already uses.
  Files: `src/components/remocn/shimmer-sweep.tsx`.

### Added
- **Delete project**, dashboard-side. Hovering a project card reveals a trash
  icon; clicking opens a confirmation dialog (reusing the existing `Dialog`
  primitive, not a native `confirm()`). Confirming removes the project from
  local state (`useProjectStore.deleteProject`), deletes its asset bytes from
  IndexedDB (`deleteBlob`) and S3 (`deleteAssetFromStorage`, currently a
  no-op stub), and deletes the cloud row (`deleteCloudProject`, already
  existed but was unused until now). New orchestration function
  `deleteProjectCompletely` in `engines/project/deleteProject.ts` ties the
  three together so no call site has to remember all of them. Tracked via a
  new `project_deleted` PostHog event.
  Files: `src/engines/project/store.ts`, `src/engines/project/deleteProject.ts`,
  `src/engines/project/index.ts`, `src/features/dashboard/components/ProjectCard.tsx`,
  `src/lib/analytics.ts`.

---

## [2026-07-24] — Fix: cloud render crashed with "supabaseUrl is required."

### Fixed
- **Every Lambda cloud render (and local CLI render) was failing** with a raw
  `supabaseUrl is required.` error, surfaced verbatim through `/api/render`'s
  progress-polling loop. Root cause: `src/remotion/Root.tsx` imports
  `getCompositionDimensions` from the `engines/project` barrel file, which
  also re-exports `cloudSync.ts` (`saveProject`/`loadProjects`) — and that
  module imported `lib/supabase.ts`, which called `createClient()` **at
  module top-level**. Remotion's bundler (`@remotion/bundler`, used for both
  the Lambda site and the CLI) doesn't replace Vite's `import.meta.env.VITE_*`
  syntax, so `VITE_SUPABASE_URL` came through as `undefined` in that bundle —
  crashing on construction on every single frame, even though the browser app
  itself worked fine. No Supabase or Vercel dashboard setting was ever going
  to fix this; it was a bundling/import-graph bug.
- **Fix:** `lib/supabase.ts` now exports a lazy `getSupabase()` instead of
  constructing the client eagerly at import time — the client is only built
  when an actual auth/DB call runs, which never happens on the render path,
  so importing the module transitively (via the barrel) is now side-effect
  free. Updated the three call sites: `hooks/useAuth.ts`,
  `engines/project/cloudSync.ts`, `engines/asset/store.ts`.
- Verified by running `npx remotion render … --frames=0-2` locally, which
  reproduced the exact crash before the fix and completed clean after.
- **Follow-up: the code fix alone didn't fix production.** Cloud renders kept
  failing with the identical error even after this shipped to Vercel — because
  `REMOTION_SERVE_URL` points at a separate static bundle already sitting in
  S3, which a Vercel deploy never rebuilds. Added `npm run deploy:lambda-site`
  (`remotion lambda sites create src/remotion/index.ts --site-name=motionstudio`)
  and ran it manually to push the fixed bundle — confirmed same site name
  produces the same Serve URL, so no `.env` changes were needed.

Files: `src/lib/supabase.ts`, `src/hooks/useAuth.ts`,
`src/engines/project/cloudSync.ts`, `src/engines/asset/store.ts`, `package.json`
(new `deploy:lambda-site` script).

---

## [2026-07-24] — Contact form, portfolio credit, real product-tour screenshots, error boundary, sign-out fix

### Added
- **On-page "Connect" section** (`LandingPage.tsx`, `id="contact"`) — name, role,
  a highlighted gradient button showing the actual portfolio domain
  (`shivamgovindrao.com`) so it reads as a real link rather than generic
  "view portfolio" copy, a click-to-copy email button, and colorful
  brand-colored social icons (GitHub / LinkedIn / X). Nav and footer "Contact"
  links now anchor-scroll to this section instead of navigating away.
- **`ContactForm.tsx`** (rewritten to MotionStudio's `studio-*` design tokens)
  and **`CopyEmail.tsx`** — shared components used on both the landing page
  and the dedicated contact page, posting to `analytics.track.contactFormSubmitted`.
- **`features/contact/ContactPage.tsx`** — standalone `/contact` route with a
  fuller profile card (avatar, tagline, resume/portfolio/email buttons, socials)
  plus the same form, for a shareable direct link.
- **`src/content/profile.ts`** — single source of truth for name, role, socials,
  portfolio URL, resume/avatar paths, used by both contact surfaces.
- **`src/components/icons/BrandIcons.tsx`** — hand-rolled GitHub/LinkedIn/X marks
  (lucide-react dropped brand icons a while back).
- **`api/contact.ts`** — new Vercel serverless function. Sends messages via
  [Resend](https://resend.com) (rate-limited 3 requests/15min per IP, in-memory);
  falls back to returning `{ fallback: true }` so the client opens a `mailto:`
  link if `RESEND_API_KEY` isn't configured yet. Replaces an earlier
  `motionStudio/src/api/contact/route.ts` that was written in Next.js App
  Router style (`route.ts`, `NextRequest`) and would never have run — this repo
  is Vite + Vercel Functions, where API routes live at the repo-root `/api/`
  folder per `vercel.json`'s rewrites, not under `src/`.
- **Global error boundary** — `pages/ErrorPage.tsx`, wired as both the router's
  `errorElement` and a catch-all `*` route in `App.tsx`. Bad/unknown URLs
  previously fell through to React Router's raw default error screen; now they
  see a branded "page not found" screen with a way back to the landing page.
- **Graceful broken-media handling** in `ProductTour.tsx` — an `onError` handler
  swaps a failed image/video for a "media not found" message instead of a
  broken-image icon, in case a screenshot path is ever wrong or a file goes
  missing.

### Changed
- **Real screenshots wired into the landing page product tour** — the four
  placeholder tiles (canvas editor, effects gallery, timeline keyframes, export)
  now render actual editor screenshots from `public/assets/landing/`. Switched
  the fit from `object-cover` to `object-contain` so full screenshots stay
  visible regardless of capture dimensions, instead of cropping to a forced
  16:9 and hiding parts of the image.
- **Product tour's last step reframed around AWS Lambda specifically**
  ("Export in 1080p on AWS Lambda" / "Render full resolution from any device.
  No CPU usage, no waiting.") — the in-browser WebCodecs export path isn't
  fully wired up yet in this project's current build, so the copy no longer
  implies both paths are ready.

### Fixed
- **Sign-out didn't redirect to the landing page.** `signOut()` cleared the
  Supabase session but left the router on `/editor/:id` or `/dashboard` — a
  page with no valid auth state. Both sign-out call sites (`UserMenu.tsx`,
  `ExportDialog.tsx`) now `navigate('/', { replace: true })` immediately after
  the session clears.

Files: `api/contact.ts` (new), `api/package.json`, `src/App.tsx`,
`src/pages/ErrorPage.tsx` (new), `src/content/profile.ts` (new),
`src/components/ContactForm.tsx`, `src/components/CopyEmail.tsx` (new),
`src/components/icons/BrandIcons.tsx` (new), `src/components/UserMenu.tsx`,
`src/features/contact/ContactPage.tsx` (new),
`src/features/landing/LandingPage.tsx`,
`src/features/landing/components/ProductTour.tsx`,
`src/features/workspace/components/ExportDialog.tsx`, `src/lib/analytics.ts`.

---

## [2026-07-24] — Landing page: brand emphasis + scroll-driven product tour

### Added
- **`ProductTour.tsx`** — a new "See it in action" section between Features
  and Stats. A vertical rail fills as you scroll through the section
  (tracked via `getBoundingClientRect`, rAF-throttled scroll listener), with
  keyframe-diamond markers that light up red at each step — the same visual
  language as the hero's `TimelineSignature`, not a generic borrowed
  "connecting line" effect. Each step alternates sides and reveals via
  `IntersectionObserver` as it scrolls into view. Media slots are currently
  labeled placeholders (screenshot/clip captions) — swapping in real
  screenshots/video is a one-line change per step in the `STEPS` array, no
  layout changes needed.

### Changed
- **Hero now leads with the product name.** Previously the headline never
  actually said "MotionStudio" — only the small nav wordmark did. Flipped
  so "MotionStudio" (set in the display face, accent-colored second half)
  is the dominant hero line, with the original pitch ("Motion graphics,
  frame by frame — built in your browser") as a supporting subhead. Nav
  wordmark also sized up and set in the display face for more presence.

Files: `features/landing/LandingPage.tsx`, `features/landing/components/
ProductTour.tsx` (new).

---

## [2026-07-24] — Landing page redesign

### Changed
- **Rebuilt the landing page** — previously a single-viewport nav + two-column
  (pitch/features left, permanently-docked auth form right) layout that read
  more like a login gate than a marketing page. Now a full scrolling page:
  hero → features → stats → auth → footer, with "Sign in" in the nav
  scrolling down to the auth section instead of it eating a fixed 400px
  column on every view.
- **Hero headline set in a new display face** (`Bricolage Grotesque
  Variable`, via `@fontsource-variable/bricolage-grotesque`) paired against
  the app's existing Geist body/UI font — deliberate two-face pairing
  instead of reusing the editor's font everywhere, which would've made the
  marketing page feel like an extension of the settings panel rather than
  its own surface.
- **Feature cards restyled to look like the app's own layer rows** (colored
  left accent bar, icon chip, monospace technical tag — `spring() ·
  easing`, `AWS Lambda · 1080p`, etc.) instead of generic icon+title+desc
  cards, grounding each feature in something concrete from the real product
  rather than templated SaaS-landing-page phrasing.
- **Hero background reuses the actual canvas editor's dot-grid pattern**
  (`DOT_GRID`, copied from `CanvasPanel.tsx`) instead of a generic gradient
  blob — an honest visual callback to the real editing surface.

### Added
- **`TimelineSignature.tsx`** — the page's signature element: a real,
  frame-driven timeline scrubber (timecode counter, moving playhead,
  keyframe diamonds that flash on an accent red as the playhead crosses
  them, an easing-curve hint above the track). Hand-rolled with
  `requestAnimationFrame` rather than importing the actual Remotion
  `<Player>`, since a marketing page that loads before anyone's signed in
  shouldn't carry that dependency weight just for a decorative loop.
  Demonstrates the product's core idea (frame-accurate, keyframe-driven
  motion) instead of just describing it in copy. Respects
  `prefers-reduced-motion` — parks on a static frame instead of animating.
- **`--font-display` token** in `index.css`, scoped to the landing page's
  hero only (not applied globally, so the rest of the app's type system is
  untouched).

Files: `features/landing/LandingPage.tsx`, `features/landing/components/
TimelineSignature.tsx` (new), `index.css`, `package.json`
(`@fontsource-variable/bricolage-grotesque`).

---

## [2026-07-24] — Empty-canvas onboarding

### Added
- **A brand-new project's canvas now shows an actionable prompt instead of
  passive `16:9 · 30 fps` text.** Previously all the "how do I add
  something" affordances lived in the top toolbar, which a first-time user
  has no particular reason to look at first — the canvas itself, the biggest
  and most central thing on screen, said nothing. Now it shows "Nothing here
  yet — add your first element" with **Add Text** / **Add Background**
  buttons (same actions as the toolbar, same auto-select behavior from the
  usability pass earlier today) plus a hint about dragging media in from the
  Assets panel. Disappears the moment the canvas has any element.
  Implemented in `CanvasPanel.tsx` since it already owns the empty-canvas
  render path and has direct access to the canvas engine.

### Fixed
- The new buttons initially added an element but never selected it — the
  click bubbled up to the stage's own `onClick`, which deselects on any
  click outside an element, immediately undoing the selection the button
  had just set. Added `e.stopPropagation()`, same pattern already used by
  `AssetCard`'s remove button for the identical reason.

Files: `features/workspace/components/CanvasPanel.tsx`.

---

## [2026-07-24] — Bigger Stock media thumbnails, fix broken local vercel dev routing

### Fixed
- **`vercel dev` was serving the app's own `index.html` for every static
  asset request**, including the JS bundle itself — `vercel.json`'s catch-all
  SPA rewrite (`"source": "/(.*)", "destination": "/index.html"`) had no
  exclusion for `/assets/*`, so `vercel dev` (unlike production Vercel's
  documented filesystem-first precedence) applied it to every request
  regardless of whether a matching static file existed. Confirmed via curl:
  requesting the JS bundle returned 475 bytes of HTML instead of the real
  ~1.6MB file, `Content-Disposition: inline; filename="index.html"` on a
  `.js` URL. The app rendered a blank page with no console error, which is
  what made this easy to miss. Rewrite now explicitly excludes
  `assets/`, `favicon.svg`, and `icons.svg`. This is what made testing
  Stock search (which needs `vercel dev` for its `/api/*` route) impossible
  earlier this session — the plain `npm run dev` server can't reach the API,
  and `vercel dev` was silently broken.

### Changed
- **Stock media results (Pexels search) redesigned from a cramped 2-column
  grid to a single-column list of larger cards.** The old layout put
  `aspect-video` thumbnails at roughly 90×50px inside the ~220px-wide asset
  sidebar — too small to judge a photo/video before importing it. Cards are
  now full sidebar width (~4x the area). Photographer credit moved from a
  hover-only `title` tooltip to a visible caption on the card itself, same
  reasoning as the toolbar tooltip audit earlier — hover-only info is easy
  to miss and isn't discoverable on first use. Video results now get a small
  play-icon badge, matching the existing `AssetCard` treatment for regular
  video assets. Verified live end-to-end with a real Pexels search + import.

Files: `vercel.json`, `features/workspace/components/AssetsPanel.tsx`
(`StockTab`).

---

## [2026-07-24] — Shrink canvas letterboxing to use more of the panel

### Changed
- **`CanvasPanel`'s fit-to-container padding dropped from 48px to 20px per
  side.** The canvas frame is sized by `Math.min(availW/compW,
  availH/compH)` inside the available panel area minus this padding — 48px
  was sized generously for Moveable's resize handles (small circles that sit
  right at the frame edge), but that's more room than the handles actually
  need. Measured before/after in a 1032×593 canvas area: 46% → 51% fit scale.
  Verified handles still render uncropped at the tightest corner (a
  full-bleed shader element, x/y at 0, width/height at the full composition
  size) at the new padding.

Files: `features/workspace/components/CanvasPanel.tsx`.

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
