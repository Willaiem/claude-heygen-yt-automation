# YouTube Automation Pipeline — Roadmap

> **Keep this file updated.** Mark items as they're completed. This is the single source of truth for project progress.

---

## Architecture

- **Next.js app at root**, Remotion in `remotion/` subfolder for future post-processing
- **Single page UI**: avatar selector + niche dropdown + face upload + multi-URL input + results table
- **Queue-based**: sequential Claude Code CLI spawning, parallel HeyGen polling
- **SSE** for real-time progress
- **Local only** — no auth

**Env keys:** `HEYGEN_API_KEY`, `OPENAI_API_KEY`, `YOUTUBE_TRANSCRIPT_API_TOKEN`

---

## Pipeline Flow (per URL)

1. Fetch transcript — `youtube-transcript.io` API
2. Fetch competitor thumbnail — `img.youtube.com/vi/{id}/maxresdefault.jpg`
3. Spawn Claude Code CLI — writes ~15k char script + metadata (title, tags, description)
4. Split script — sentence boundaries, max 4,800 chars/scene
5. Submit to HeyGen — `POST /v2/video/generate`
6. Poll HeyGen — every 30s until complete
7. Download MP4 — save to `output/videos/`
8. Generate thumbnail — ChatGPT `gpt-4o` with face ref + competitor thumbnail
9. SSE updates at each step

---

## Phase 0: Scaffolding

- [ ] Move Remotion files to `remotion/` subfolder with own `package.json`
- [ ] Initialize Next.js at root (TypeScript, Tailwind, App Router, src dir)
- [ ] Create directories: `output/videos/`, `output/thumbnails/`, `public/references/`
- [ ] Create `.env.local` with placeholder keys
- [ ] Update `.gitignore` (`output/`, `public/references/*`, `.env.local`)
- [ ] Define shared types in `src/lib/types.ts`

## Phase 1: UI Shell

- [ ] `layout.tsx` — minimal root layout
- [ ] `page.tsx` — three-section layout (config bar | URL input | results table)
- [ ] `AvatarSelector.tsx` — dropdown, fetches from HeyGen API
- [ ] `NicheSelector.tsx` — dropdown (health, politics)
- [ ] `FaceUploader.tsx` — file upload with preview, persists to disk
- [ ] `UrlInput.tsx` — multi-line textarea + Generate button
- [ ] `ResultsTable.tsx` — status, thumbnail preview, copy buttons, download, resubmit

## Phase 2: Foundation API Routes

- [ ] `GET /api/avatars` — fetch HeyGen `/v2/avatars`, cache via `globalThis`
- [ ] `POST /api/upload-face` — multipart form → `public/references/`
- [ ] Wire `AvatarSelector` to `/api/avatars`
- [ ] Wire `FaceUploader` to `/api/upload-face`

## Phase 3: Pipeline Modules

- [ ] `src/lib/pipeline/fetch-transcript.ts` — POST to `youtube-transcript.io/api/transcripts`
- [ ] `src/lib/pipeline/fetch-competitor-thumb.ts` — download from `img.youtube.com`
- [ ] `src/lib/pipeline/spawn-claude.ts` — `child_process.spawn("claude", ["-p", "--output-format", "json"])`, pipe prompt via stdin
- [ ] `src/lib/pipeline/split-scenes.ts` — sentence-boundary splitter, max 4,800 chars
- [ ] `src/lib/pipeline/heygen-submit.ts` — POST `/v2/video/generate`
- [ ] `src/lib/pipeline/heygen-poll.ts` — 30s interval polling
- [ ] `src/lib/pipeline/download-video.ts` — fetch MP4 → `output/videos/`
- [ ] `src/lib/pipeline/generate-thumbnail.ts` — ChatGPT `gpt-4o` with face + competitor images
- [ ] `src/lib/niches.ts` — niche configs (health, politics)

## Phase 4: Queue + Orchestration

- [ ] `src/lib/queue.ts` — in-memory `JobQueue` (EventEmitter, `globalThis` singleton, sequential Claude gating, parallel HeyGen polling)
- [ ] `POST /api/generate` — accept `{ urls[], avatarId, voiceId, niche, faceImage }`, create batch, return `batchId`
- [ ] `GET /api/progress` — SSE via `ReadableStream`, subscribe to queue events

## Phase 5: Wire Frontend

- [ ] `src/hooks/useSSE.ts` — `EventSource` wrapper hook
- [ ] Connect Generate button → `POST /api/generate`
- [ ] Connect `ResultsTable` to SSE progress stream
- [ ] Copy-to-clipboard for title, tags, description
- [ ] Download links for MP4s
- [ ] Thumbnail previews in results table

## Phase 6: Polish

- [ ] `POST /api/resubmit` — retry failed jobs
- [ ] Error states and loading indicators
- [ ] YouTube URL parsing utility (`youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`)

---

## File Structure

```
claude-heygen-yt-automation/
├── .env.local
├── next.config.ts
├── package.json
├── tsconfig.json
├── remotion/
│   ├── remotion.config.ts
│   ├── package.json
│   └── src/
├── public/references/              # Uploaded face images
├── output/
│   ├── videos/                     # Downloaded MP4s
│   └── thumbnails/                 # Generated thumbnails
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── avatars/route.ts
│   │       ├── upload-face/route.ts
│   │       ├── generate/route.ts
│   │       ├── progress/route.ts
│   │       ├── download-video/route.ts
│   │       └── resubmit/route.ts
│   ├── components/
│   │   ├── AvatarSelector.tsx
│   │   ├── NicheSelector.tsx
│   │   ├── FaceUploader.tsx
│   │   ├── UrlInput.tsx
│   │   └── ResultsTable.tsx
│   ├── lib/
│   │   ├── queue.ts
│   │   ├── niches.ts
│   │   ├── types.ts
│   │   ├── sse.ts
│   │   ├── env.ts
│   │   └── pipeline/
│   │       ├── fetch-transcript.ts
│   │       ├── fetch-competitor-thumb.ts
│   │       ├── spawn-claude.ts
│   │       ├── split-scenes.ts
│   │       ├── heygen-submit.ts
│   │       ├── heygen-poll.ts
│   │       ├── download-video.ts
│   │       └── generate-thumbnail.ts
│   └── hooks/
│       └── useSSE.ts
```

---

## Key Decisions

- Queue singleton via `globalThis` (survives Next.js HMR)
- Claude CLI prompt piped via stdin (avoids Windows 32k char cmd limit)
- Voice tied to avatar (no separate voice selector)
- Niches: `{ id, name, promptTone, defaultTags }` in config file
- No database — in-memory state, lost on restart
- Thumbnail face matching via `gpt-4o` chat completions with image inputs

## Risks

1. **gpt-4o face matching** — may not reliably reproduce faces. Fallback: composite (AI background + real photo overlay)
2. **Claude CLI output parsing** — may wrap in markdown code blocks. Handle with explicit prompt + regex
3. **HeyGen avatar/voice coupling** — verify `/v2/avatars` includes voice info; may need `/v2/voices` + mapping

---

## Verification Checklist

- [ ] `npm run dev` → page loads at `localhost:3000`
- [ ] Avatar dropdown populates from HeyGen
- [ ] Face upload persists in `public/references/`, survives reload
- [ ] Single URL → full pipeline → MP4 + thumbnail + metadata
- [ ] Multi-URL → all queue and process with SSE progress
- [ ] Failed job → resubmit works
- [ ] `cd remotion && npx remotion studio` still works
