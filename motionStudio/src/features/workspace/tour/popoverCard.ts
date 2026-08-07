import type { HelpEntry } from '@/content/help';

/**
 * The inside of a walkthrough card, as HTML.
 *
 * driver.js writes `popover.title` and `popover.description` with `innerHTML`,
 * which is what lets a step be a laid-out card — emoji headline, one sentence,
 * a row of chips, a live "your turn" line — instead of a paragraph of prose in
 * a box. The old tour was the paragraph, and it read like a manual.
 *
 * **Everything here is our own static copy from `content/help.ts`.** No user
 * text, no project name, no file name reaches these strings, which is why they
 * are concatenated rather than escaped. If that ever stops being true — a card
 * that quotes what the user typed, say — escape at the interpolation, do not
 * assume this comment still holds.
 *
 * Kept as pure string in, string out so it can be read and tested without a
 * browser, and so the walkthrough's rendering has no opinion about React.
 */

/** Where the user is in the step's action. `null` for a card with no action. */
export type TryState = 'waiting' | 'done';

export interface CardOptions {
  /** What to go and do. Omit for a card that just explains. */
  prompt?: string;
  /** The reward line, swapped in once they've done it. */
  done?: string;
  state?: TryState;
  /** Include the long-form answer. Helper dots do; the quick start doesn't. */
  includeMore?: boolean;
}

/** Emoji plus headline. Goes in driver's title slot. */
export function renderTitle(entry: HelpEntry): string {
  return `<span class="ms-card-emoji">${entry.emoji}</span><span class="ms-card-title">${entry.title}</span>`;
}

/** Sentence, chips, and the action row. Goes in driver's description slot. */
export function renderCard(entry: HelpEntry, opts: CardOptions = {}): string {
  const parts = [`<p class="ms-card-line">${entry.line}</p>`];

  if (entry.chips?.length) {
    const chips = entry.chips
      .map(
        (c) =>
          `<span class="ms-chip"><span class="ms-chip-emoji">${c.emoji}</span>${c.text}</span>`,
      )
      .join('');
    parts.push(`<div class="ms-card-chips">${chips}</div>`);
  }

  if (opts.includeMore && entry.more) {
    parts.push(`<p class="ms-card-more">${entry.more}</p>`);
  }

  if (opts.prompt) {
    // aria-live so the ✅ is announced rather than only seen — the whole point
    // of the row is that it changes on its own, with no click to signpost it.
    const done = opts.state === 'done';
    const mark = done ? '✅' : '<span class="ms-try-dot"></span>';
    const text = done ? (opts.done ?? '') : opts.prompt;
    parts.push(
      `<div class="ms-card-try" data-state="${done ? 'done' : 'waiting'}" aria-live="polite">` +
        `<span class="ms-try-mark">${mark}</span><span>${text}</span></div>`,
    );
  }

  return parts.join('');
}
