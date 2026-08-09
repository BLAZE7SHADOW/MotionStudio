/**
 * Where a newly inserted element should land when it isn't given an
 * explicit position — the toolbar's "Add text"/"Add block" buttons, and the
 * click-to-add path for images/videos.
 *
 * Left alone, every insert computes the same centered `x`/`y` from canvas
 * size, so clicking "Add text" three times stacks three elements exactly on
 * top of each other with no visual cue more than one exists. This offsets
 * each repeat diagonally — the same "cascade" PowerPoint/Slides/Figma use
 * for repeated paste — and never lets the offset push the element past the
 * canvas edge: every candidate is clamped to the canvas bounds before it is
 * even considered, not checked afterward.
 */

const CASCADE_STEP = 32; // composition-space px

export function cascadePosition(
  existing: { x: number; y: number; width: number; height: number }[],
  defaultX: number,
  defaultY: number,
  w: number,
  h: number,
  compW: number,
  compH: number,
): { x: number; y: number } {
  const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), Math.max(0, max));
  const at = (n: number) => ({
    x: clamp(defaultX + n * CASCADE_STEP, compW - w),
    y: clamp(defaultY + n * CASCADE_STEP, compH - h),
  });

  let n = 0;
  for (;;) {
    const candidate = at(n);
    const occupied = existing.some(
      (el) => el.x === candidate.x && el.y === candidate.y && el.width === w && el.height === h,
    );
    // Once the clamp pins both axes, no further n can move the candidate —
    // stop here rather than looping forever on an exhausted cascade.
    const next = at(n + 1);
    const atEdge = candidate.x === next.x && candidate.y === next.y;
    if (!occupied || atEdge) return candidate;
    n++;
  }
}
