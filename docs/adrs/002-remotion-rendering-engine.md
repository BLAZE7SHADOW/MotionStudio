# ADR-002: Remotion as the Rendering Engine

**Status:** Accepted
**Date:** 2026-07 (Sprint 3)

## Context

MotionStudio is a browser-based **video composition** platform. It needs a
frame model, playback, and eventually export to real video files. Two paths:

1. Build our own renderer, frame clock, timeline model, and export pipeline.
2. Build on **Remotion**, which already owns fps, frames, `<Sequence>`,
   `<Player>`, and `renderMedia()`.

## Decision

Remotion is the rendering engine. We introduce `src/engines/rendering/` which
owns the mapping from element data → frames:

```
rendering/
  style.ts                     textElementStyle(el, scale)
  components/
    renderers/TextRenderer     one element type → pixels
    ElementRenderer            dispatch by el.type
    MotionComposition          Remotion root: <Sequence> per element
```

The **same `MotionComposition` and element renderers** drive both the editor's
`<Player>` preview and (later) `renderMedia()` export. Remotion owns time; we
own the scene description.

### Single renderer, two consumers

```
        CanvasElement[]
               │
        ElementRenderer  ← shared
        ┌──────┴──────┐
   Editor preview   renderMedia() export
   (<Player>)        (Sprint 7)
```

## Reasoning

- **We are not a rendering research project.** Building a frame-accurate
  renderer + encoder is months of work Remotion has already solved.
- **The temporal model is Remotion's.** Elements use `startFrame` /
  `durationInFrames`, mapped 1:1 to `<Sequence>`. Our timeline (Sprint 4) is a
  UI over this model, not a parallel invention.
- **Export is nearly free later.** `renderMedia()` consumes the same
  composition the editor previews.

## Consequences

- `remotion` and `@remotion/player` are hard dependencies.
- Element renderers must stay Remotion-compatible (pure, deterministic per
  frame — no side effects, no reading wall-clock time).
- Animation (Sprint 6) uses Remotion primitives (`interpolate`, `spring`,
  `useCurrentFrame`) rather than a custom animation system.
- Bundle size grows; code-splitting the editor vs player is a later concern.

## Related

- ADR-001 (Project as aggregate root — supplies the data)
- ADR-003 (Composition-space coordinates — makes preview match export)
