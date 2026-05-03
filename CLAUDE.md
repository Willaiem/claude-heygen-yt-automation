# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Single Node package. Next.js app and Remotion compositions share one `package.json` and `node_modules`. Remotion sources live under `src/remotion/`; `@remotion/bundler` and `@remotion/renderer` are flagged as `serverExternalPackages` in `next.config.ts` so Next leaves them out of its bundle.

- `npm run dev` — start Next dev server on `localhost:3000`
- `npm run build` — Next production build
- `npm run start` — serve production build
- `npm run lint` — `next lint` (covers `src/remotion/` since it lives under `src/`)
- `npx tsc --noEmit` — typecheck the entire repo (no `remotion/` exclusion anymore)
- `npm run remotion:studio` — launch Remotion Studio against `src/remotion/index.ts`
- `npm run remotion:bundle` — bundle Remotion compositions

## Architecture

The repo is a local-only batch processor that turns YouTube URLs into avatar-narrated videos with branded thumbnails and metadata. One-click flow: UI → `generate()` server action → job queue → per-URL pipeline → SSE progress back to UI.

**Server actions vs route handlers.** RPC-style calls (fetch avatars, kick off a batch, resubmit a failed job) live as server actions in `src/app/actions.ts`. Route handlers under `src/app/api/` are reserved for things actions can't do: streaming (`GET /api/progress` — SSE) and binary file responses (video downloads). When adding a new endpoint, default to a server action; only reach for a route handler if you need a `Response` object directly.

**Pipeline (per URL), implemented as composable modules under `src/lib/pipeline/`:**
1. Fetch transcript (youtube-transcript.io)
2. Fetch competitor thumbnail (`img.youtube.com/vi/{id}/maxresdefault.jpg`)
3. Spawn Claude Code CLI — it writes a ~15k-char script + title/tags/description
4. Split script at sentence boundaries into scenes (≤4,800 chars each, HeyGen limit)
5. Submit to HeyGen — TTS stream + per-scene `avatar/shortcut/submit`. Captures `sceneWords` (per-scene `WordTimestamp[]`) at the same time, used later for slide timing.
6. **Two-branch fork** runs in parallel:
   - Branch A: poll HeyGen every 30s → download MP4s into `output/videos/` → generate thumbnail via fal.ai using the avatar's face + competitor thumbnail.
   - Branch B: spawn Claude CLI per scene to produce a `SlidePlan` (planning_slides) → fire fal.ai text-to-image for every panel in parallel (generating_slide_images). Branch B finishes inside Branch A's HeyGen poll window in practice, so wall-clock cost is ~zero.
7. Resolve slide timing — fuzzy-match each slide's `startPhrase`/`end.phrase` against the captured `sceneWords` and convert to frames at 30 fps.
8. Render final 1920×1080 H.264 MP4 via Remotion (programmatic SSR through `@remotion/bundler` + `@remotion/renderer`) into `output/final/`.

**Orchestration (`src/lib/queue.ts`, Phases 4 + 7):**
- In-memory `JobQueue` attached to `globalThis` so it survives Next.js HMR (required — no DB, state is lost on restart).
- **Sequential** gating on Claude CLI spawns (one at a time) via a shared `claudeChain`. Both the script-generation and slide-planner spawns flow through the same chain — `runClaudeSerial<T>(prompt, schema, label)` is generic and parses each response with the caller's zod schema.
- **Parallel** HeyGen polling and parallel fal.ai image generation. Multiple jobs can be rendering server-side simultaneously.
- **Parallel branches per job** (Branch A vs Branch B) joined via `Promise.all`, then sequential `resolving_slide_timing` → `editing` (Remotion render).
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

### Remotion editing (Phase 7)

- **Bundle is cached on `globalThis`.** First `renderFinal` call runs `@remotion/bundler`'s `bundle({ entryPoint: "src/remotion/index.ts" })` (which downloads Chromium ~150 MB on cold start) and stashes the resulting `serveUrl` Promise on `globalThis.__remotionBundle`. Subsequent renders reuse it.
- **Render input is `JobRenderProps` — fully resolved.** All slide timing (in frames), all video URLs (`${baseUrl}/api/file?path=…`), and all slide image URLs are baked into the props before render time. Remotion's Chromium fetches every asset through the same `/api/file` route handler. Set `RENDER_BASE_URL` env if the dev server is on a non-default port; defaults to `http://localhost:3000`.
- **Debug fixture is dumped beside the MP4.** Each render also writes `output/final/{videoId}.props.json` — copy that into `src/remotion/fixtures/sample-job.ts` to reproduce the exact render in Remotion Studio without re-running the pipeline.
- **Two-branch failure modes are intentionally hybrid.** Planner failure → `step: "slides_failed"`, plan replaced with empty slides per scene, render proceeds → "bare-stitched" final video. Image-gen failure → job `failed` (broken slides look worse than no slides). Render failure → `step: "editing_failed"` + `editError` set, job NOT marked `failed`, per-scene MP4s + thumbnail still usable in the UI; `reedit()` re-runs only `resolving_slide_timing` + `editing`.
- **`Slide` is a discriminated union over 7 types.** `title`, `bullets`, `stat` are text-only; `diagram`, `steps`, `warning_grid`, `action_grid` carry per-panel `imagePrompt`s. The planner emits `Slide`s; `generate-slide-images.ts` walks the plan flattening to one fal.ai task per panel (diagram=1, steps=3, warning_grid=4, action_grid=5–6). `resolve-slide-timing.ts` slices the resulting per-scene `string[]` back into per-slide groups using each slide's `panelCount`.
- **Slide layout is per-frame on `AvatarLayer`.** Default = full-frame; `pip` shrinks the avatar's `<OffthreadVideo>` to a top-right circle (~18% width); `cover` reduces it to 1×1 px with `opacity: 0` so the audio keeps playing while the slide visually fills the frame. The active slide is found via `useCurrentFrame()` against each slide's `startFrame`/`endFrame`.

### Shared types

All cross-boundary types live in `src/lib/types.ts`. **Every exported type is `z.infer`'d from a zod schema in the same file — schema is the source of truth, types are derived. Edit the schema, never the type.** Boundary schemas (HeyGen payload, SSE wire, `GenerateRequest`) are expected to be `.parse()`'d where data enters the system; internal schemas (`Job`, `Batch`, `NicheConfig`) exist so the shape is declared once and available for validation if/when needed. Notable shapes:
- `Job` — carries everything produced along the pipeline; progresses through `PipelineStep` enum values. Phase 7 added `sceneWords`, `slidePlan`, `slideImagePaths`, `finalVideoPath`, `editError`.
- `Batch` — one "Generate" click; references its jobs and the selected avatar/voice/niche
- `SSEEvent` — wire format for `/api/progress`
- `HeyGenAvatar` — `{ avatarId, avatarName, previewImageUrl, voiceId?, faceImageUrl? }` (inferred from `HeyGenAvatarGroupSchema`)
- `Slide` — discriminated union over 7 types (`title` / `bullets` / `stat` / `diagram` / `steps` / `warning_grid` / `action_grid`). Each variant extends a base of `{ id, startPhrase, end, layout? }`; `end` is itself a discriminated union over `{ kind: "phrase", phrase }` vs `{ kind: "hold", seconds }`.
- `SlidePlan` — `{ scenes: { sceneIndex, slides: Slide[].max(8) }[] }` — the planner's output.
- `JobRenderProps` — fully resolved input bundle handed to `JobComposition`. Per scene: `{ videoUrl, durationSec, slides: ResolvedSlide[] }`. Each `ResolvedSlide` extends its `Slide` variant with `{ startFrame, endFrame, layout, resolvedImagePaths? }`. Built once in `resolve-slide-timing.ts` and dumped to `output/final/{videoId}.props.json` for debugging.

## Code style

- **Default to no comments.** Keep a comment only when the WHY isn't obvious from the code itself — math, regex, hidden invariants, workarounds for specific bugs, subtle constraints a reader would otherwise miss. Strip anything that restates WHAT the code does, describes structure that's already visible, or references a past task/PR. If removing the comment wouldn't confuse a careful reader, delete it. This applies to existing comments too — when editing a file, prune excessive commentary you come across.
- **No one-letter variable names.** Including arrow-function parameters, `.map`/`.filter`/`.reduce` callbacks, catch bindings, and destructured aliases. Use a descriptive name even for trivial callbacks (`items.map((item) => ...)`, not `items.map((x) => ...)`). The only exception is conventional loop counters in classic `for` loops (`i`, `j`, `k`). This applies to existing code too — when editing a file, rename any one-letter locals you come across.

## Workflow

- **`ROADMAP.md` is the single source of truth for project progress.** Check off items there as they land. Phases 0–7 are done end-to-end (scaffolding → UI → pipeline → queue → frontend wire-up → polish → Remotion editing). When scope changes, update ROADMAP (strike out removed items, add key-decision notes) — don't silently drop them. **Update ROADMAP after every sub-phase finishes**, not in a single batch at the end of a multi-phase task — it's the only way the user can see real-time progress.
- Commit message style from existing history: lowercase conventional-commit prefix (`chore:`, `feat:`). Keep subjects short; use the body for the why. **Do not add a `Co-Authored-By: Claude ...` trailer** — the user's existing commits don't have it and they've asked to keep it that way.
- Path alias `@/*` → `src/*` (see `tsconfig.json`).
- Repo root is a git repo with a single `node_modules` and `package-lock.json` shared by Next and Remotion.
