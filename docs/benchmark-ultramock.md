# Benchmark — Ultramock

A teardown of [ultramock.io](https://www.ultramock.io/), captured **2026-07-28**,
kept as a reference target while we improve MotionStudio.

**How to use this doc.** The checklists below are the scorecard. Tick items as we
ship them and note the date. When something here turns out to be wrong, or we
deliberately choose not to do it, say so inline rather than deleting it — a
rejected idea with a reason is worth more than a silent gap.

**What Ultramock is.** A browser tool that turns a screenshot into a cinematic
device mockup — image or short video. Built by Josh Millgate with Ben Lang,
launched ~March 2026, went viral on X. Free tier is metered in "captures";
Pro was $29.99 one-time, moving to a subscription.

---

## 1. Method (so this is re-runnable)

Everything below is read off shipped artifacts, not marketing copy:

```bash
curl -sS -D headers.txt https://www.ultramock.io/ -o page.html   # framework, hosting
curl -sS .../_next/static/chunks/webpack-*.js                    # the chunk map
# then fetch every chunk id in the map and grep the concatenation
```

That yields ~1.53 MB of their JS. Claims here are grepped, not guessed.

---

## 2. Their stack

| Area | Ultramock | MotionStudio |
|---|---|---|
| Framework | Next.js App Router, prerendered, Vercel | Vite + React SPA, Vercel |
| Styling | Tailwind v4.2.2, **3.7 KB** total CSS | Tailwind v4 + `studio-*` tokens |
| Fonts | Geist + Geist Mono | Geist / Inter / Bricolage |
| Animation | **framer-motion** (`motionValue`, `framerAppearId`) | Remotion interpolation |
| Scene | **CSS 3D transforms** (`perspective()`, `matrix3d`) on DOM | Remotion compositions |
| Effects | Bespoke **WebGL** renderer, lazy + Pro-gated | `@paper-design/shaders-react` |
| Export | Client-side render; server only meters | Client canvas / web-renderer / Lambda |
| Errors | Sentry, release = git SHA | — |
| Payments | Stripe | — |
| Code splitting | 24 lazy chunks (~810 KB) | ~621 KB gzipped bundle |

### They do not use Remotion

Grepped across all 1.53 MB:

```
remotion 0 · @remotion 0 · useCurrentFrame 0 · AbsoluteFill 0
useVideoConfig 0 · delayRender 0 · registerRoot 0 · renderMedia 0 · lambda 0
```

(The 12 `Composition` hits are React's own IME `onCompositionStart` events.)

**Read this the right way: our rendering stack is strictly more capable than
theirs.** Remotion + Lambda + WebCodecs beats CSS 3D + client canvas on raw
power. The gap is entirely product and interface — which is the good news,
because that is the cheaper gap to close.

### Their export architecture

`POST /api/capture` carries only `{fingerprint, pngRequested, transparentRequested}`
— **no scene data**. It is purely a quota gate returning **HTTP 402** when
exhausted. The local render and the authorization call are fired *concurrently*,
so the paywall adds no latency to a successful export.

---

## 3. The honest framing — read before feeling behind

**Ultramock has no direct manipulation.** No selection handles, no bounding
boxes, no rulers, no grid. You never drag anything on the canvas; you drag
*dials* in the right panel and the canvas is a pure preview.

That is a category difference, not a polish difference:

- **Ultramock is a parametric renderer** — one fixed scene, a fixed property set,
  many dials.
- **MotionStudio is a compositor** — arbitrary elements, arbitrary positions,
  direct manipulation.

Much of our visual noise (moveable handles, selection boxes, the z-index fight
we patched with `isolation: isolate`) is **the cost of a capability they do not
have**. Their narrowness buys a large share of their polish. Compare technique,
not surface area.

---

## 4. Scorecard

Legend: `[x]` shipped · `[~]` partial · `[ ]` missing

### A. The shot model

- [x] **Scenes / "shots"** — their model is `timeline: { scenes: [...] }`,
      sequential, `+ ADD SHOT` appends. Internally `scenes`, called "shots" in UI.
      *(2026-07-28 — `engines/project/scenes.ts` + `ShotStrip`. We keep elements
      flat with absolute frames + a `sceneId` rather than nesting, which left
      the entire render path untouched.)*
- [x] **Drill-in navigation** — `< SEQUENCE │ 1 2 │ + ADD SHOT` breadcrumb;
      double-click a shot to enter and edit it. This is the answer to timeline
      row explosion: a two-level timeline.
      *(2026-07-28 — single click rather than double, since our sequence view is
      a separate level rather than always-on. Double-click renames instead.)*
- [x] **Per-shot timeline** — the ruler is scoped to the shot
      (`00:00.00 / 00:03.00`), not the whole video.
      *(2026-07-28 — `TimelineScale.originFrame`. Ruler labels stay absolute so
      you still know where you are in the whole video.)*
- [x] **Explicit scope split** — "Background & scene settings apply to all shots"
      vs "Effects apply to the selected shot, not all shots."
- [x] **Shared duration budget** — *"Couldn't add a shot for this video. Free up
      some duration first."*
      *(2026-07-28 — adding extends the video instead, refused past 90s with the
      same kind of message. Deliberate: subdividing would resize shots the user
      had already set.)*

> Their tour copy, verbatim: *"Here's the new shot, sitting right after the
> first. It picks up where you left…"* and *"Double-click any shot to drill back
> in and animate it — exactly like the timeline you already know."*

### B. Control design

- [x] **Gesture chips printed on the control** — `TILT X `​`DRAG`​,
      `ZOOM `​`SCROLL`​, `PAN X `​`SPACE DRAG`. The interaction is a chip inside
      the row. No tooltip, no hover delay, no tour step needed.
      *(2026-07-28 — `components/ui/scrub-input.tsx`. Only `DRAG` so far; we
      have no scroll- or space-drag gestures to advertise yet.)*
- [x] **Row-as-slider** — the row background fills to show value. Label, gesture
      hint, fill and editable number in one ~32px row. No separate slider+input.
      *(2026-07-28 — same control. Fill draws only when `min`/`max` are given,
      so unbounded values like X don't imply a range that doesn't exist.)*
- [x] **Sections collapsed by default, all headers visible** — BLUR, SCENE,
      3D DEVICES, BORDER, EFFECTS are single header rows; only CAMERA is open.
      The whole capability surface is legible at a glance.
      *(2026-07-28 — Transform, Layer and Motion now default closed. Note only
      those three are collapsible at all: Text, Effects, Shader, Sound and the
      block sections pass no children and render as plain labels.)*
- [~] **Per-section ↺ reset** on every header.
      *(2026-07-28 — built, but deliberately only on Motion. "Reset" needs one
      obvious meaning: on Transform it would have to leave the authored
      position and size alone, making it a partial reset wearing an absolute
      label. Revisit when a section owns settings rather than geometry.)*
- [ ] **Animated-property markers** — small accent diamonds on exactly the
      keyframed dials, so you can see what is animated without expanding anything.
- [ ] **`MANUAL │ PRESETS` segmented control** — presets for beginners, dials for
      experts, neither buried. Also the answer to our 34-effect `<select>`.
- [ ] **Additive effect stack** — `+` to add, each row gets an eye (mute) and a
      minus (remove).

### C. Visual system

- [x] **Exactly one accent colour**, used only for the primary verb and live
      state — active shot chip, `+ ADD KF`, capture button, playhead, keyframes.
      Everything else greyscale. This discipline is most of why it reads as
      expensive.
      *(2026-07-28 — rule written at the token definition in `index.css`; four
      decorative usages removed. Most existing accent was already legitimate.)*
- [ ] **All-caps micro-labels**, one consistent size, everywhere.
- [x] Geist font family.
- [ ] A stylesheet small enough to be uninteresting (theirs: 3.7 KB).

### D. Perceived performance

- [ ] **Hand-written skeleton in the prerendered HTML** — a grey wireframe with
      correct panel widths and a spinner, `aria-label="Loading editor"`, painting
      before any JS runs. Their body has zero real content and ~49 KB of skeleton.
- [ ] **Theme read from localStorage inline, before paint** — no flash of the
      wrong theme.
- [~] **Aggressive code splitting** — 24 lazy chunks.

### E. Onboarding

- [x] Editor tour, restart tour, skip tour.
- [~] **Tour steps that make you act** — *"Give it a go — add a second shot."*
      *(2026-07-28 — the new shots step does this; the other 14 still narrate.)*
- [ ] **Contextual toasts at the moment of confusion**, with **DON'T SHOW AGAIN**.
      *(2026-07-28 — the specific one they needed, "effects apply to the
      selected shot, not all shots", does **not** apply to us and was
      deliberately skipped: we have no global-vs-per-shot split, because
      background is still a single project-level setting. Revisit if per-shot
      backgrounds ever ship. The pattern itself is still worth having for
      something else.)*
- [x] Templates; use template; save as template.
- [ ] **Templates deep-linkable by URL** (`?template=cmqic15au00004lpenr29kwjz`).
- [~] Keyboard shortcuts sheet.

### F. Trust and resilience — our weakest area

- [x] **Multi-tab safety** — "Project open elsewhere" / "Take over here" /
      "Open read-only" / "Can't replace the scene while the project is
      read-only".
      *(2026-07-28 — `lib/projectLock.ts` + `useProjectLock`. Guard sits on
      `updateProject`/`undo`/`redo` and on the cloud autosave, which pushed
      every project from every tab and was the worst vector. Lock logic
      covered by a headless test — 12 cases including crashed-tab recovery.)*
- [ ] **Offline save states** — "Saving disabled until connection restored",
      "Save failed: no internet connection", "Saved just now", "Up to date".
- [ ] **Mobile honesty** — "Rotate your device for a wide screen experience.",
      "Full timeline available on desktop", "Video mode currently only on
      desktop." They degrade explicitly instead of hiding.
- [ ] **Destructive confirmations that name the consequence** — "Adding this
      video will replace the images on every shot."
- [~] Missing-media handling — we have the tile; they add "Original media file
      not found on this device."

### G. Monetization

- [ ] **Meter the thing that costs money.** They meter *captures*; we should
      meter *cloud renders*.
- [ ] **Quota permanently visible in the toolbar** (`CAPTURES 3 / 3`), never
      buried in a menu.
- [ ] **HTTP 402** for quota exhaustion.
- [ ] **Anonymous fingerprint quota** — 3 captures with no account, 3 more for
      signing up. The wow is free; you pay to keep it.
- [ ] **Gates at the moment of value, never at the door** — watermark, video
      export, transparent PNG, larger exports, custom sizes, 3D models, save
      project.
- [ ] **Concurrent render + authorize**, so the paywall never adds latency.

### H. Growth

- [x] Feedback form; changelog / what's-new.
- [ ] **Discord + X links in-product.**
- [ ] **Waitlist for the next version** (`/api/waitlist`) — captures intent
      before the feature exists.
- [ ] **"Made by" / "Special thanks to"** — a face on the product.
- [ ] **Paste-first input** — "Drag & drop or paste", plus a quick-capture
      shortcut. Lower friction than any file picker.
- [ ] Rich OG image and full keyword meta (they rank for "mockup generator").

### I. Engineering hygiene

- [ ] **Sentry with release = git SHA.**
- [ ] **First-party analytics** — `/api/events/client`, `export_attempt`,
      `/api/export-completed`.
- [ ] **Project schema migrations** (`/api/migrations/projects`) — needed the day
      we ship shots.
- [ ] **A payload-size instrument** — they log
      `[measure-snapshot] raw= gzip= dialCount= breakdown=` per section, so they
      watch how large a serialized project gets.
- [ ] ~~Origin-lock anti-clone with signed domain tokens~~ — **deliberately
      skipped.** It suits a paid product; it is overhead for ours.

---

## 5. Their API surface

Useful as a shape to compare ours against:

```
/api/capture              quota gate for export (402 when exhausted)
/api/checkout             Stripe
/api/projects  /api/projects/:id
/api/templates /api/templates/:id
/api/migrations/projects  project schema migrations
/api/events/client        first-party analytics
/api/export-completed     export telemetry
/api/waitlist             next-version intent capture
/api/status  /api/use-case
```

---

## 6. Order of attack

1. **Gesture chips on controls** (B) — about a day; retires several tour steps;
   this is the "everything is in front" feeling, concretely.
2. **Collapse Properties into headers + row-as-slider** (B) — the biggest
   available reduction in visual noise.
3. **One-accent-colour audit** (C) — nearly free, and most of the perceived
   quality gap.
4. **Multi-tab guard** (F) — this is a live data-loss bug, not a polish item.
5. **The shot model with drill-in** (A) — the large one, independently validated
   by a shipped product.

---

## 7. Progress log

Append a line whenever something above is ticked.

| Date | Item | Notes |
|---|---|---|
| 2026-07-28 | — | Benchmark captured. Nothing ticked yet. |
| 2026-07-28 | B — gesture chips, row-as-slider | `ScrubInput`. All 16 numeric call sites upgraded via `NumInput`/`MiniNum`, which became wrappers. |
| 2026-07-28 | C — one accent colour | Rule written at the token definition in `index.css`. Four decorative usages removed; the rest were already legitimate. |
| 2026-07-28 | B — default-closed sections, section reset | Transform/Layer/Motion default closed. Reset built on Motion only, where it has one meaning. |
| 2026-07-28 | F — multi-tab safety | `projectLock.ts`. Guard on `updateProject`/`undo`/`redo` + the cloud autosave. 12 headless tests pass. |
| 2026-07-28 | A — shot model, stage 1 | `scenes.ts` + migration, invisible. Flat elements + `sceneId`, not nested — render path untouched. `npm test` added (57 assertions). |
| 2026-07-28 | A — shot model, stage 2 | `ShotStrip` + `SequenceTrack` + `TimelineScale.originFrame`. Section A now complete. 71 assertions. |
| 2026-07-28 | A — shot reorder + 3 live bugs | Drag to reorder. Three bugs found by running the app in a browser, none caught by types or tests. Next: beat detection, its own plan. |
