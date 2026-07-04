# ADR-001: Project as Aggregate Root

**Status:** Accepted
**Date:** 2026-07 (Sprint 2)

## Context

MotionStudio is composed of independent engines (Project, Editor, Canvas,
Rendering, and later Timeline, Assets, Animation). Each engine owns a slice of
domain logic. The open question was: **where does element data live?**

Two options were considered:

1. Each engine owns its own state store (Canvas Engine holds `elements`,
   Timeline Engine holds `tracks`, etc.), keyed by project id.
2. The Project owns everything; engines expose *actions* that operate on the
   active project's slice.

## Decision

The **Project is the aggregate root**. A project owns its canvas, and will own
its timeline, assets, animations, and metadata:

```ts
interface Project {
  id, name, aspectRatio, fps, durationInFrames, createdAt, updatedAt
  canvas: { elements: CanvasElement[] }
  // future: timeline, assets, animations, aiMetadata
}
```

Engines do **not** hold element state. The Canvas Engine is a thin service
layer (`useCanvasEngine`) that reads the active project and writes back through
`useProjectStore.updateProject`. The active project is identified by
`activeProjectId` on the Project store, set by `EditorPage` on mount.

## Reasoning

- **No migrations.** When multi-project persistence (cloud) lands, we serialize
  one `Project` object. Nothing is scattered across engine stores.
- **No sync bugs.** There is exactly one source of truth for element data.
  Engines can't drift out of sync because they don't hold duplicate state.
- **Engine isolation.** The Canvas Engine doesn't know what a "project" is
  beyond reading the active one — it just owns element operations.

## Consequences

- Engine action hooks read `activeProjectId` and short-circuit when null.
- `updateProject` accepts partial slice updates (`{ canvas: {...} }`).
- Every future engine follows the same pattern: own the *verbs*, not the *data*.

## Related

- ADR-002 (Remotion Rendering Engine)
- ADR-003 (Composition-space coordinates)
