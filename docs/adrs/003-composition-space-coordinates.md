# ADR-003: Composition-space Coordinates

**Status:** Accepted
**Date:** 2026-07 (Sprint 3)

## Context

An element sits at some `x, y` with some `width, height, fontSize`. But *in
what coordinate space?* The editor canvas is a small box (maybe 800px wide);
the final video is 1920px wide. If an element stores `x: 100` relative to the
editor box, that same element renders in the wrong place — and at the wrong
size — when Remotion composes at native resolution. Editor and export drift
apart: **not WYSIWYG.**

## Decision

Elements are **always stored in composition space** — the real output
resolution derived from aspect ratio:

| Aspect ratio | Composition size |
|--------------|------------------|
| 16:9         | 1920 × 1080      |
| 9:16         | 1080 × 1920      |
| 1:1          | 1080 × 1080      |

The editor renders a **scaled view** of this space. It measures its viewport,
computes `scale = min(availW / compW, availH / compH)`, and renders every
element at `composition × scale` via a single shared function:

```ts
textElementStyle(el, scale)   // multiplies every geometric property by scale
```

Remotion renders the same elements at `scale = 1` (native). Because both paths
multiply by the same factor, the editor is a pixel-accurate preview of the
export.

### Interaction under scale

`react-moveable` operates in the editor's display space. On commit, values are
divided back by `scale` before being written to the store:

```ts
onDragEnd:  updateElement(id, { x: left / scale, y: top / scale })
onResizeEnd: updateElement(id, { width: w / scale, ... })
```

Rotation is scale-invariant and stored directly.

## Reasoning

- **WYSIWYG is non-negotiable** for a video editor. Storing in composition
  space is the only way editor and render agree.
- **One scale number** drives the whole viewport (position, size, font), the
  same way Remotion's `<Player>` scales its composition internally.
- **Zoom/pan later is trivial** — it's just another factor into `scale` and an
  offset, without touching stored data.

## Consequences

- The editor must measure its viewport (`ResizeObserver`) before it can render.
- New element defaults are composition-scale (e.g. text `fontSize: 96`,
  centered via composition dimensions), not editor-box-scale.
- Changing aspect ratio changes composition size; existing element coordinates
  are not remapped (acceptable pre-persistence; revisit if needed).

## Related

- ADR-002 (Remotion rendering — the consumer that must match the editor)
