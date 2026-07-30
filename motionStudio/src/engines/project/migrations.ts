import type { Project } from './types';
import { ensureScenes } from './scenes';

/**
 * Versioned project-schema migrations.
 *
 * We already had a version — but on the *store envelope*, via zustand
 * `persist`'s `version` (`store.ts`). That covers IndexedDB and nothing else.
 * A project pushed to Supabase and pulled back down arrives as a bare `Project`
 * with no version anywhere on it, so the cloud path could only run
 * `ensureScenes` and hope. That works today because there is exactly one
 * migration and it happens to be idempotent; the second one will have no way
 * to know whether a given cloud project has already had it.
 *
 * So the version belongs on the project, where it travels with the data.
 *
 * **Adding a migration:** bump `CURRENT_SCHEMA_VERSION`, append a step whose
 * `to` equals the new number, and add a case to `tests/migrations.test.mjs`.
 * Steps must be pure and idempotent — they run at every entry point, and one
 * that is not idempotent will eventually run twice on somebody's project.
 */

/**
 * History of the shape:
 *
 *  0 → pre-shots. No `scenes`, no `sceneId` on elements.
 *  1 → shots. Every project has an ordered `scenes[]`; every element either
 *      names a shot or spans them all.
 *
 * Later additions — `beatGrid`, `Scene.transition`, `Animation.source` — are
 * all optional and read as absent, so they need no step and no bump. A version
 * is for changes that would be *misread* by older code, not for every addition.
 */
export const CURRENT_SCHEMA_VERSION = 1;

interface Migration {
  /** The version this step produces. */
  to: number;
  /** Why it exists, for whoever reads a bug report about it. */
  why: string;
  migrate: (project: Project) => Project;
}

const MIGRATIONS: Migration[] = [
  {
    to: 1,
    why: 'Shots. A pre-shots project becomes a one-shot project spanning its whole length — exactly how it already behaved — without touching any element timing.',
    migrate: ensureScenes,
  },
];

/**
 * True when a project claims a schema this build does not know about.
 *
 * Happens for real: two devices, one updated. Passing such a project through
 * the migration chain would do nothing (no step matches) and then stamp it
 * with *our* lower version, quietly telling the next load it is older than it
 * is. Callers must instead leave it alone and refuse to overwrite it.
 */
export function isFromFuture(project: Project): boolean {
  return (project.schemaVersion ?? 0) > CURRENT_SCHEMA_VERSION;
}

/**
 * Brings a project up to the current schema. Safe to run at every entry point
 * and safe to run twice.
 *
 * A project from a newer build is returned untouched and unstamped — see
 * `isFromFuture`.
 */
export function migrateProject(project: Project): Project {
  if (isFromFuture(project)) return project;

  const from = project.schemaVersion ?? 0;
  let next = project;
  for (const step of MIGRATIONS) {
    if (step.to > from) next = step.migrate(next);
  }

  // Stamp even when no step ran: an unversioned project that already has the
  // current shape is version 1, and saying so is what lets the *next*
  // migration skip it.
  return next.schemaVersion === CURRENT_SCHEMA_VERSION
    ? next
    : { ...next, schemaVersion: CURRENT_SCHEMA_VERSION };
}
