# MotionStudio — project rules for Claude

## Living docs (MANDATORY — never skip)

`README.md` and `CHANGELOG.md` at the repo root are the source of truth for the
owner's resume and portfolio, and the first thing visitors read. They must always
reflect the current state of the project.

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

3. `ARCHITECTURE.md` is the deep-dive companion — update it when a change
   invalidates one of its claims (stack table, architecture narrative, export story).

## Conventions

- Small, logically-grouped commits; one concern per commit.
- No `Co-Authored-By` footer in commit messages.
- **Never `git push` without asking the user first.**
- Explain/teach decisions when making changes — the owner is learning the codebase.

## Layout

- `motionStudio/` — the Vite app (run all npm commands here)
- `api/` — Vercel serverless functions
- Root — docs (`README.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, `USER_GUIDE.md`, `docs/adrs/`)
