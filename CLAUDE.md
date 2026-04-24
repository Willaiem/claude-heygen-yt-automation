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

- **All HeyGen calls use private `api2.heygen.com` endpoints with cookie auth.** No public API key is used anywhere. The avatar list needs the private endpoint because it exposes `photo_identity_s3_url` and `default_voice_id`; the submit/poll pipeline modules use the private endpoints too so there's only one credential (`HEYGEN_COOKIE`) and one auth model across the codebase. See the HEYGEN API REFERENCE block in `ROADMAP.md` for the exact request/response shapes — the roadmap is the source of truth for these reverse-engineered endpoints.
- **Private submit flow is per-scene, not per-video.** `POST /v2/avatar/shortcut/submit` takes a single `audio_data` (one clip), unlike the public `/v2/video/generate` which accepts a `video_inputs[]` array. So `submitHeyGen` returns `string[]` (one `video_id` per scene) and `pollHeyGen` takes a `string[]`. Each scene is first TTS-generated via `POST /v2/online/text_to_speech.stream` — NDJSON stream, final chunk has `sequence_number: -1` and holds the `audio_url`; `word_timestamps` must be aggregated from intermediate chunks. Poll uses `/v1/pacific/collaboration/video.download` → `workflow_id` → poll `.../status` until `COMPLETED`.
- **Avatar URLs are signed S3 links with ~7-day Expires params.** Any cache of the avatars response must use a short TTL (current value: 5 minutes in the `getAvatars` action in `src/app/actions.ts`). Never cache indefinitely.
- **Face image is the selected avatar's `photo_identity_s3_url`, surfaced on `HeyGenAvatar.faceImageUrl`.** There is no user-upload surface (there used to be, it was removed). Thumbnail generation reads the face off the avatar.
- **HeyGen responses are parsed and normalized to camelCase at the boundary via zod.** The schemas live in `src/lib/types.ts` and the `HeyGenAvatar` DTO type is `z.infer`'d from the schema's `.transform()` output — schema is the single source of truth, so the runtime validator and compile-time type cannot drift. `src/app/actions.ts` just imports `HeyGenAvatarListResponseSchema` and calls `.parse`; no downstream code ever sees the raw snake_case shape.
- **Claude CLI prompt is piped via stdin, not passed as a CLI arg.** Windows `cmd` has a ~32k-char argv limit and prompts are much longer than that. Use `child_process.spawn("claude", ["-p", "--output-format", "json"])` and write the prompt to `stdin`.
- **Claude CLI output may be wrapped in markdown code blocks.** Parser in `spawn-claude.ts` should strip fences before `JSON.parse`. The JSON shape is `{ script, title, tags, description }`.
- **Voice is coupled to avatar** — no separate voice selector. `voiceId` on the DTO comes from the avatar group's `default_voice_id`.
- **Niches (`src/lib/niches.ts`)** are plain config objects: `{ id, name, promptTone, defaultTags }`. Add a new niche by adding an entry; the UI picks up `id`/`name` automatically.

### Shared types

All cross-boundary types live in `src/lib/types.ts`. **Every exported type is `z.infer`'d from a zod schema in the same file — schema is the source of truth, types are derived. Edit the schema, never the type.** Boundary schemas (HeyGen payload, SSE wire, `GenerateRequest`) are expected to be `.parse()`'d where data enters the system; internal schemas (`Job`, `Batch`, `NicheConfig`) exist so the shape is declared once and available for validation if/when needed. Notable shapes:
- `Job` — carries everything produced along the pipeline; progresses through `PipelineStep` enum values
- `Batch` — one "Generate" click; references its jobs and the selected avatar/voice/niche
- `SSEEvent` — wire format for `/api/progress`
- `HeyGenAvatar` — `{ avatarId, avatarName, previewImageUrl, voiceId?, faceImageUrl? }` (inferred from `HeyGenAvatarGroupSchema`)

## Code style

- **Default to no comments.** Keep a comment only when the WHY isn't obvious from the code itself — math, regex, hidden invariants, workarounds for specific bugs, subtle constraints a reader would otherwise miss. Strip anything that restates WHAT the code does, describes structure that's already visible, or references a past task/PR. If removing the comment wouldn't confuse a careful reader, delete it. This applies to existing comments too — when editing a file, prune excessive commentary you come across.

## Workflow

- **`ROADMAP.md` is the single source of truth for project progress.** Check off items there as they land. Phases 0–1 and the avatars portion of Phase 2 are done; Phases 3–6 are not. When scope changes, update ROADMAP (strike out removed items, add key-decision notes) — don't silently drop them.
- Commit message style from existing history: lowercase conventional-commit prefix (`chore:`, `feat:`). Keep subjects short; use the body for the why. **Do not add a `Co-Authored-By: Claude ...` trailer** — the user's existing commits don't have it and they've asked to keep it that way.
- Path alias `@/*` → `src/*` (see `tsconfig.json`).
- Repo root is a git repo; `remotion/` has its own `node_modules` and `package-lock.json` but is not a separate git repo.
