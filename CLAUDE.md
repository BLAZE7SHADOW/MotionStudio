# MotionStudio — project rules for Claude

## Living docs (MANDATORY — never skip)

Four docs at the repo root must ALWAYS reflect the current state of the project
and stay consistent with each other — never let one describe a feature another
doesn't know about:

- `README.md` — public front page + portfolio/resume source
- `CHANGELOG.md` — detailed history + portfolio/resume source
- `ARCHITECTURE.md` — engineering decisions deep-dive
- `USER_GUIDE.md` — how to use every feature

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

## Conventions

- Small, logically-grouped commits; one concern per commit.
- No `Co-Authored-By` footer in commit messages.
- **Never `git push` without asking the user first.**
- Explain/teach decisions when making changes — the owner is learning the codebase.

## Layout

- `motionStudio/` — the Vite app (run all npm commands here)
- `api/` — Vercel serverless functions
- Root — docs (`README.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, `USER_GUIDE.md`, `docs/adrs/`)
