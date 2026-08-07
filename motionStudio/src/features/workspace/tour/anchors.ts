import type { HelpId } from '@/content/help';

/**
 * Turning a `HelpId` into a selector that is actually on screen right now.
 *
 * Pointing driver.js at a missing element gives a popover floating over
 * nothing, so both the quick start and the helper dots resolve against the live
 * DOM rather than trusting that a panel exists. Half the ids here belong to
 * sections that only render while something is selected — Sound needs a music
 * clip, Effects needs text — so "not mounted" is the normal case, not an error.
 *
 * Anchors are `data-tour` attributes rather than class names, so restyling a
 * panel can't silently break either surface.
 */

const selector = (id: HelpId) => `[data-tour="${id}"]`;

/** The control, or null when it isn't rendered. */
export function anchorFor(id: HelpId): string | null {
  return document.querySelector(selector(id)) ? selector(id) : null;
}
