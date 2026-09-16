/**
 * Turns an AWS/Remotion failure into something worth showing a person.
 *
 * The render path used to return `(e as Error).message` verbatim, so users were
 * shown things like:
 *
 *   AWS Concurrency limit reached (Original Error: Rate Exceeded.). See
 *   https://www.remotion.dev/docs/lambda/troubleshooting/rate-limit for tips
 *   at Object.T9 [as callFunctionStreaming] (/var/task/index.js:80:7276)
 *
 * which tells them nothing they can act on, names our internals, and links them
 * to our infrastructure vendor's troubleshooting docs as if the capacity of our
 * AWS account were their problem to solve. Three separate failures of the same
 * kind: the message was written for whoever is on call, and it was sent to the
 * one person who can't use it.
 *
 * So: a sentence for the user, the original preserved in the server log. The
 * raw text is never lost — it moves to where it is useful.
 */

interface Translated {
  /** Safe to render in the UI. */
  message: string;
  /** Whether trying the same thing again could plausibly work. */
  retryable: boolean;
}

const FALLBACK: Translated = {
  message: 'The cloud render failed. Try again, and use Browser Export if it keeps failing.',
  retryable: true,
};

/* Matched against the raw text because that is all AWS and Remotion reliably
   give us — error classes differ across the SDK, the Lambda client, and errors
   serialised out of the render itself. Ordered most specific first. */
const PATTERNS: { test: RegExp; result: Translated }[] = [
  {
    test: /concurrency limit|rate exceeded|too many requests|throttl/i,
    result: {
      message: 'Too many renders are running right now. Wait a minute and try again.',
      retryable: true,
    },
  },
  {
    test: /timed? ?out|timeout/i,
    result: {
      message:
        'The render took too long and was stopped. Try a shorter video, or split it into parts.',
      retryable: false,
    },
  },
  {
    test: /access ?denied|not authorized|invalid.*credential|signature|expired token/i,
    result: {
      // Deliberately not "check your permissions" — these are *our* credentials.
      // Telling a user to fix an account they have no access to is worse than
      // telling them nothing.
      message: 'Cloud rendering is temporarily unavailable. Use Browser Export, or try again later.',
      retryable: false,
    },
  },
  {
    test: /no such bucket|nosuchkey|404|not found/i,
    result: {
      message: 'Cloud rendering is temporarily unavailable. Use Browser Export, or try again later.',
      retryable: false,
    },
  },
  {
    test: /out of memory|memory limit|enospc|no space left/i,
    result: {
      message:
        'This project is too heavy for a cloud render. Try fewer effects, or a shorter duration.',
      retryable: false,
    },
  },
  {
    test: /failed to fetch|could not (load|fetch)|net::|econnreset|socket hang up/i,
    result: {
      message:
        "The render couldn't load one of your media files. Check the Assets panel for a file marked \"Not uploaded\".",
      retryable: true,
    },
  },
];

/**
 * @param stage where it happened, so the log line says which call failed
 * @param context identifiers worth having in the log (renderId, user id)
 */
export function translateRenderError(
  error: unknown,
  stage: string,
  context: Record<string, string | undefined> = {},
): Translated {
  const raw = error instanceof Error ? (error.stack ?? error.message) : String(error);

  // The whole point of the translation: this is the only place the detail
  // survives, so it must be complete rather than tidy.
  console.error(`[render] ${stage} failed`, { ...context, raw });

  const match = PATTERNS.find((p) => p.test.test(raw));
  return match ? match.result : FALLBACK;
}
