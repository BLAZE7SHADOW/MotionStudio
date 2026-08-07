import { useEffect } from 'react';

/**
 * Sets the document title, description, canonical URL and the OG/Twitter
 * copies of both, for the one route currently mounted — then puts back
 * whatever was there before on unmount.
 *
 * No `react-helmet`/`next-seo`: with exactly two routes that need this
 * (`LandingPage`, `ContactPage` — `DashboardPage` and `EditorPage` are
 * private and `noindex` via the shell they're served from, see
 * `scripts/prerender.mjs`), a dependency buys nothing a dozen lines of
 * `document.querySelector` don't already do.
 *
 * The restore-on-unmount is what stops a client-side navigation away from
 * one of these two routes leaving its title/meta stuck forever on whatever
 * comes next — `index.html`'s static tags become the fallback again, the
 * same as before either route ever mounted.
 */

const SITE_URL = 'https://motionstudio-six.vercel.app';

/** Tag selector + the attribute that carries its value, for every tag this
    hook keeps in sync. Declarative on purpose: adding a tag is a row here,
    not a new branch of get/set/restore logic. */
const TAGS = [
  { selector: 'meta[name="description"]', attr: 'content', key: 'description' },
  { selector: 'link[rel="canonical"]', attr: 'href', key: 'url' },
  { selector: 'meta[property="og:title"]', attr: 'content', key: 'title' },
  { selector: 'meta[property="og:description"]', attr: 'content', key: 'description' },
  { selector: 'meta[property="og:url"]', attr: 'content', key: 'url' },
  { selector: 'meta[name="twitter:title"]', attr: 'content', key: 'title' },
  { selector: 'meta[name="twitter:description"]', attr: 'content', key: 'description' },
] as const;

export interface PageMeta {
  title: string;
  description: string;
  /** Path only, e.g. `/contact` — joined with the site origin to build the
      canonical URL and `og:url`/`twitter:url` alike. */
  path: string;
}

export function usePageMeta({ title, description, path }: PageMeta): void {
  useEffect(() => {
    const values = { title, description, url: `${SITE_URL}${path}` };
    const prevTitle = document.title;
    const prevValues = TAGS.map(({ selector, attr }) => document.querySelector(selector)?.getAttribute(attr) ?? null);

    document.title = title;
    for (const { selector, attr, key } of TAGS) {
      document.querySelector(selector)?.setAttribute(attr, values[key]);
    }

    return () => {
      document.title = prevTitle;
      TAGS.forEach(({ selector, attr }, i) => {
        const prev = prevValues[i];
        if (prev !== null) document.querySelector(selector)?.setAttribute(attr, prev);
      });
    };
  }, [title, description, path]);
}
