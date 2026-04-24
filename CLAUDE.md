# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Two separate Node packages live in this repo. Root `package.json` is the Next.js web app; `remotion/package.json` is an isolated Remotion project for future post-processing. `tsconfig.json` excludes `remotion/`, so typechecks from root don't cover it.

**Root (Next.js app)**
- `npm run dev` — start dev server on `localhost:3000`
- `npm run build` — Next production build
- `npm run start` — serve production build
- `npm run lint` — `next lint`
- `npx tsc --noEmit` — typecheck only (no lint)

**Remotion (`cd remotion` first)**
- `npm run dev` — `remotion studio`
- `npm run build` — `remotion bundle`
- `npm run lint` — `eslint src && tsc`

## Architecture

The repo is a local-only batch processor that turns YouTube URLs into avatar-narrated videos with branded thumbnails and metadata. One-click flow: UI → `generate()` server action → job queue → per-URL pipeline → SSE progress back to UI.

**Server actions vs route handlers.** RPC-style calls (fetch avatars, kick off a batch, resubmit a failed job) live as server actions in `src/app/actions.ts`. Route handlers under `src/app/api/` are reserved for things actions can't do: streaming (`GET /api/progress` — SSE) and binary file responses (video downloads). When adding a new endpoint, default to a server action; only reach for a route handler if you need a `Response` object directly.

**Pipeline (per URL), implemented as composable modules under `src/lib/pipeline/`:**
1. Fetch transcript (youtube-transcript.io)
2. Fetch competitor thumbnail (`img.youtube.com/vi/{id}/maxresdefault.jpg`)
3. Spawn Claude Code CLI — it writes a ~15k-char script + title/tags/description
4. Split script at sentence boundaries into scenes (≤4,800 chars each, HeyGen limit)
5. Submit to HeyGen → poll every 30s → download MP4 into `output/videos/`
6. Generate thumbnail via OpenAI `gpt-4o` using the avatar's face + competitor thumbnail

**Orchestration (`src/lib/queue.ts`, Phase 4):**
- In-memory `JobQueue` attached to `globalThis` so it survives Next.js HMR (required — no DB, state is lost on restart).
- **Sequential** gating on Claude CLI spawns (one at a time, to avoid thrashing local CPU / hitting rate limits).
- **Parallel** HeyGen polling — multiple jobs can be rendering server-side simultaneously.
- Progress flows out via an `EventEmitter` that `/api/progress` subscribes to and forwards as SSE.

### Non-obvious conventions

- **HeyGen avatar list uses private `api2.heygen.com` endpoints with cookie auth, not the public `api.heygen.com` API-key endpoints.** The private endpoint returns `photo_identity_s3_url` and `default_voice_id`, which the public API doesn't. The cookie string lives in `HEYGEN_COOKIE` (env). See the HEYGEN API REFERENCE block in `ROADMAP.md` for the exact request/response shapes — the roadmap is the source of truth for these reverse-engineered endpoints.
- **Avatar URLs are signed S3 links with ~7-day Expires params.** Any cache of the avatars response must use a short TTL (current value: 5 minutes in the `getAvatars` action in `src/app/actions.ts`). Never cache indefinitely.
- **Face image is the selected avatar's `photo_identity_s3_url`, surfaced on `HeyGenAvatar.face_image_url`.** There is no user-upload surface (there used to be, it was removed). Thumbnail generation reads the face off the avatar.
- **Claude CLI prompt is piped via stdin, not passed as a CLI arg.** Windows `cmd` has a ~32k-char argv limit and prompts are much longer than that. Use `child_process.spawn("claude", ["-p", "--output-format", "json"])` and write the prompt to `stdin`.
- **Claude CLI output may be wrapped in markdown code blocks.** Parser in `spawn-claude.ts` should strip fences before `JSON.parse`. The JSON shape is `{ script, title, tags, description }`.
- **Voice is coupled to avatar** — no separate voice selector. `voice_id` comes from the avatar's `default_voice_id`.
- **Niches (`src/lib/niches.ts`)** are plain config objects: `{ id, name, promptTone, defaultTags }`. Add a new niche by adding an entry; the UI picks up `id`/`name` automatically.

### Shared types

All cross-boundary types live in `src/lib/types.ts`. Notable shapes:
- `Job` — carries everything produced along the pipeline; progresses through `PipelineStep` enum values
- `Batch` — one "Generate" click; references its jobs and the selected avatar/voice/niche
- `SSEEvent` — wire format for `/api/progress`
- `HeyGenAvatar` — `{ avatar_id, avatar_name, preview_image_url, voice_id?, face_image_url? }`

## Workflow

- **`ROADMAP.md` is the single source of truth for project progress.** Check off items there as they land. Phases 0–1 and the avatars portion of Phase 2 are done; Phases 3–6 are not. When scope changes, update ROADMAP (strike out removed items, add key-decision notes) — don't silently drop them.
- Commit message style from existing history: lowercase conventional-commit prefix (`chore:`, `feat:`). Keep subjects short; use the body for the why. **Do not add a `Co-Authored-By: Claude ...` trailer** — the user's existing commits don't have it and they've asked to keep it that way.
- Path alias `@/*` → `src/*` (see `tsconfig.json`).
- Repo root is a git repo; `remotion/` has its own `node_modules` and `package-lock.json` but is not a separate git repo.
