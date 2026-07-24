# MotionStudio

**A browser-based motion graphics editor built on [Remotion](https://remotion.dev)** — compose text, image, video, audio, and shader backgrounds on a frame-accurate timeline, animate with keyframes and 22 text effects, and export to MP4 in the browser or on the cloud.

**Live demo → [motionstudio-six.vercel.app](https://motionstudio-six.vercel.app/)**

Built by [Shivam Govind Rao](https://shivamgovindrao.com/) · [get in touch](https://motionstudio-six.vercel.app/#contact)

---

## What it is

MotionStudio is a full video compositor that runs in the browser. You place elements on a canvas, arrange them on a timeline, animate them per-property, and export real video. The editor preview, the in-browser export, and the AWS Lambda cloud render all run the **same React composition** — what you see while editing is exactly what renders.

~5K+ lines of strict TypeScript · 7 engines · 85+ logically-grouped commits · 5 element types.

## Features

- **Canvas editing** — drag / resize / rotate / inline text edit, layer ordering, drag-and-drop asset placement
- **Frame-accurate timeline** — per-element clips (move/trim), scrubbing, time-based playback clock
- **Keyframe animation** — opacity, position, scale, rotation via `interpolate`/`spring`, with presets and a draggable keyframe strip
- **22 text effects** — Remocn animation components (per-character rise, typewriter, glitch, shimmer, highlights…), lazy-loaded per effect
- **18 shader backgrounds** — full-bleed, frame-synced WebGL backdrops (gradients, noise, warp, particles…), lazy-loaded per preset
- **Media** — image, video (`OffthreadVideo`), audio elements with library, probing, and thumbnails
- **Stock media** — search and import free Pexels photos/videos directly into a project (server-proxied, auth-gated)
- **One-click backgrounds** — turn any image/video into a full-canvas background (resize, reposition, send to back)
- **Two export paths** — in-browser WebCodecs (free, Chrome/Edge) and Remotion Lambda cloud render (any device, 1080p)
- **Accounts & sync** — Google OAuth / email / guest; projects auto-save to Supabase and restore on any device
- **Persistence** — project JSON in localStorage + cloud, asset bytes in IndexedDB, S3 for cloud renders
- **Responsive landing + auth, desktop-only editor** — sign up from any device; the dashboard and editor gate below 1024px with a "use a bigger screen" message

## Architecture

Two layers, one rule:

```
engines/    own DATA + LOGIC   (no UI)      project · editor · canvas · rendering
features/   own UI             (compose)    · timeline · animation · asset · export
```

**The `Project` is the aggregate root.** One object owns all data — elements, assets, settings — mutated through a single `updateProject` point. Undo/redo, autosave, and cloud sync all hook that one point and cover every edit automatically.

**One rendering pipeline everywhere:**

```
MotionComposition → <Sequence> per element → ElementRenderer → Text/Image/Video/Audio renderer
        ▲                        ▲                          ▲
  editor <Player>       WebCodecs export             Remotion Lambda
```

Deep dives: [ARCHITECTURE.md](ARCHITECTURE.md) · [docs/adrs/](docs/adrs/) · [USER_GUIDE.md](USER_GUIDE.md)

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Video engine | Remotion | Frames, `<Sequence>`, `<Player>`, Lambda rendering — the product renders real video |
| Frontend | React 19 · TypeScript (strict) · Vite | Fast, typed, modern |
| State | Zustand (+ persist) | One `create()` → hook + selectors; zero boilerplate |
| Styling | Tailwind v4 + shadcn/ui | Token-driven dark UI, accessible primitives |
| Canvas interactions | react-moveable | Solved drag/resize/rotate handles |
| Browser export | WebCodecs + Mediabunny | Frame-perfect encode + MP4 mux, no server |
| Text effects & shaders | Remocn (+ `@paper-design/shaders-react`) | Copy-paste Remotion animation components and frame-synced WebGL backgrounds |
| Backend | Vercel Functions · Supabase · AWS (Lambda, S3) | Auth, quota, cloud render, asset storage |
| Analytics | PostHog · Vercel Analytics | Product + performance insight |

## Backend

- **Auth (Supabase)** — Google OAuth, email/password, anonymous guest (1 free cloud render); device-ID cookie prevents guest abuse; account switches wipe local state for isolation
- **API (Vercel Functions)** — `/api/render` runs a 4-gate guard: JWT → device → monthly quota → Lambda; `/api/quota` reports usage; `/api/upload-url` issues presigned S3 PUTs; `/api/contact` sends messages via Resend
- **Cloud render (Remotion Lambda)** — headless render on AWS, returns an S3 URL. **Two separate deploy targets:** pushing to Vercel never rebuilds this — after any change reachable from `src/remotion/index.ts`, run `npm run deploy:lambda-site` to re-upload the bundle Lambda actually executes
- **Cloud sync (Supabase)** — projects upsert as JSONB rows (RLS per user), auto-saved 2 s after any edit

## Getting started

```bash
git clone <repo-url> && cd MotionStudio/motionStudio
npm install
npm run dev          # http://localhost:5173
```

Frontend env (`motionStudio/.env.local`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_POSTHOG_KEY=          # optional
VITE_POSTHOG_HOST=         # optional
```

API env (Vercel project settings — only needed for cloud renders / stock search):

```
SUPABASE_URL=              SUPABASE_SERVICE_ROLE_KEY=
REMOTION_FUNCTION_NAME=    REMOTION_SERVE_URL=    REMOTION_BUCKET_NAME=
S3_ASSETS_BUCKET=          PEXELS_API_KEY=
```

The editor, timeline, animation, and browser export work fully offline/local — no backend required.

## Project structure

```
api/                    Vercel serverless functions (render, quota, upload-url, _lib guards)
motionStudio/
  src/
    engines/            data + logic: project, editor, canvas, rendering, timeline,
                        animation, asset, export
    features/           UI: landing, dashboard, workspace (canvas/timeline/panels)
    components/remocn/  22 text-effect components
    remotion/           composition entry for Lambda/CLI rendering
docs/adrs/              architecture decision records
```

## Docs

[USER_GUIDE.md](USER_GUIDE.md) — how to use every feature · [ARCHITECTURE.md](ARCHITECTURE.md) — engineering decisions and war stories · [CHANGELOG.md](CHANGELOG.md) — detailed history
