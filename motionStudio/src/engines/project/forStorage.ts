import type { Project } from './types';

/**
 * A project as it should be written to storage — local *or* cloud.
 *
 * An asset's `url` is a `blob:` string: a pointer into the memory of the tab
 * that created it. It dies with that tab. Persisting one therefore saves a
 * value that is **guaranteed** to be invalid by the time anything reads it
 * back, and that is the whole of this bug:
 *
 *   1. the editor opens and `rehydrateAssets` mints working URLs from the bytes
 *      in IndexedDB — correct, and about 500ms in
 *   2. the Supabase load lands a second later, and `setProjects` replaces the
 *      whole projects array with the stored copy — dead URLs and all
 *
 * Step 2 always wins because it is slower, so the repair was thrown away on
 * every reload and every project with media showed "Re-upload needed" while its
 * files sat safely in IndexedDB and S3.
 *
 * Blanking on the way out fixes the cause rather than the race: an empty url is
 * already the codebase's word for "unresolved, go and find it" — `rehydrate`
 * fills it from the local blob or the S3 `storageUrl`, and `ElementRenderer`
 * and the web renderer both already skip on it.
 *
 * Returns the same object when there is nothing to strip, so persisting an
 * asset-free project stays free.
 */
export function forStorage(project: Project): Project {
  if (!project.assets.some((a) => a.url?.startsWith('blob:'))) return project;
  return {
    ...project,
    assets: project.assets.map((a) => (a.url?.startsWith('blob:') ? { ...a, url: '' } : a)),
  };
}
