# MotionStudio — project rules for Claude

## Living docs (MANDATORY — never skip)

Four docs at the repo root, plus the in-app release notes, must ALWAYS reflect
the current state of the project and stay consistent with each other — never let
one describe a feature another doesn't know about:

- `README.md` — public front page + portfolio/resume source
- `CHANGELOG.md` — detailed history + portfolio/resume source
- `ARCHITECTURE.md` — engineering decisions deep-dive
- `USER_GUIDE.md` — how to use every feature
- `motionStudio/src/content/releases.ts` — the in-app "What's new", written for users

At the end of any change that ships a feature, fixes a bug, or alters behavior,
check ALL FOUR and update every one the change touches — in the same commit or an
immediately following `docs:` commit. A stale claim (e.g. "not built yet" for
something that shipped) is a bug.

1. **After every feature, fix, or refactor: append a `CHANGELOG.md` entry.**
   - Format: `## [YYYY-MM-DD] — Title` with `### Added / Changed / Fixed` bullets,
     newest entry at the top (right under the intro block).
   - Be detailed: what changed, why it changed, and key files/modules touched.
   - Include it in the same commit as the change, or an immediately following
     `docs:` commit — never leave it for later.

2. **Update `README.md` whenever the surface changes** — new user-facing features,
   architecture shifts, stack additions, setup/env changes, or stats (line count,
   engine count, effect count).
   - Keep it ≤ ~180 lines. Edit existing sections in place; do not append new
     sections unless the architecture genuinely grew a new area.
   - Tone: clean, precise, professional. It is both a portfolio artifact and the
     public face of the repo.

3. **Update `ARCHITECTURE.md`** when a change invalidates one of its claims —
   stack table, architecture narrative, export story, trade-offs, war stories.

4. **Update `USER_GUIDE.md`** when a change alters what the user sees or does —
   new features, changed flows, new limitations, removed restrictions.

5. **Update `motionStudio/src/content/releases.ts`** whenever a change ships
   something a **user** would notice. This is the in-app "What's new" dialog, and
   it is NOT `CHANGELOG.md`:
   - `CHANGELOG.md` is for whoever maintains the code — root causes, module
     names, decisions. `releases.ts` is for the person using the app.
   - Write it in their terms: what they can now do, or what stopped being
     broken. Never name a file, function or internal concept.
   - Add to the newest entry if it's the same day; otherwise add a new entry at
     the top with today's date as `id`. Ids must be unique and only move
     forward — the id doubles as the "have they seen it" marker.
   - Purely internal work (refactors, lint, docs, test scaffolding) gets a
     `CHANGELOG.md` entry and **no** `releases.ts` entry.
   - A stale "What's new" is worse than none: it advertises that nobody is
     minding the product. Treat a missing entry as a bug, same as a stale README.

## Conventions

- Small, logically-grouped commits; one concern per commit.
- No `Co-Authored-By` footer in commit messages.
- **Never `git push` without asking the user first.**
- Explain/teach decisions when making changes — the owner is learning the codebase.

## Layout

- `motionStudio/` — the Vite app (run all npm commands here)
- `api/` — Vercel serverless functions
- Root — docs (`README.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, `USER_GUIDE.md`, `docs/adrs/`)
