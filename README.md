# YouTube Automation Pipeline

Turn any YouTube video into an original video on your own HeyGen avatar — with a matching thumbnail, title, tags, and description — from a single URL.

## What it does

Paste a competitor's YouTube URL and the pipeline:

1. Fetches the transcript via youtube-transcript.io
2. Downloads the competitor's `maxresdefault` thumbnail off `img.youtube.com` (used later as a thumbnail reference)
3. Spawns Claude Code CLI to rewrite it as an original ~15,000-character script with title, tags, and description
4. Splits the script into HeyGen-compatible scenes (max 4,800 chars each)
5. Per scene: streams TTS via HeyGen's private text-to-speech endpoint, then submits the resulting audio to `POST /v2/avatar/shortcut/submit`
6. Polls each scene's HeyGen workflow until the rendered MP4 is ready, downloads it to `output/videos/`
7. Generates a branded thumbnail via fal.ai `openai/gpt-image-2`, conditioning on the avatar's portrait + the competitor thumbnail
8. Streams every step back to the UI via SSE; failed jobs can be retried in place

Supports batch processing — paste multiple URLs and they queue up automatically.

## Tech Stack

| Layer | Technology |
|---|---|
| Web app | Next.js (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Video rendering | HeyGen private `api2.heygen.com` endpoints (cookie auth) |
| Script writing | Claude Code CLI (`child_process.spawn`, prompt over stdin) |
| Thumbnails | fal.ai `openai/gpt-image-2` (multi-image edit, public URLs in) |
| Transcripts | youtube-transcript.io API |
| Video post-processing | Remotion (in `remotion/` subfolder, for future use) |
| Progress updates | Server-Sent Events (SSE) |

## Prerequisites

- **Node.js v20+**
- **Claude Code CLI** — installed and authenticated on the machine
- API keys (see below)

## Setup

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd claude-heygen-yt-automation
npm install
```

2. Create `.env.local` in the project root:

```
HEYGEN_COOKIE=...               # cookie string for api2.heygen.com private endpoints
FAL_KEY=...                     # fal.ai key for openai/gpt-image-2 thumbnail generation
YOUTUBE_TRANSCRIPT_API_TOKEN=...
```

> All HeyGen calls use the private `api2.heygen.com` endpoints with cookie auth — no public HeyGen API key is used. Grab the cookie from any authenticated HeyGen request via DevTools.

3. Create output directories (if they don't exist):

```bash
mkdir -p output/videos output/thumbnails
```

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **Select a HeyGen avatar** — fetched from your HeyGen account; the avatar's own portrait (`photo_identity_s3_url`) is reused as the face reference for thumbnail generation. The avatar's `default_voice_id` is also picked up automatically (no separate voice selector).
2. **Pick a niche** — Health or Politics (controls script tone and default tags)
3. **Paste YouTube URLs** — one per line
4. **Click Generate** — watch progress and per-step percentages via SSE as each pipeline stage completes
5. **Copy metadata / download MP4** — use the copy buttons for title, tags, and description; the Download link serves the rendered MP4 from `output/videos/` via `/api/file`
6. **Retry failures** — if a job lands in `failed`, the row exposes the error message and a Retry button that re-queues that single job

## Project Structure

```
claude-heygen-yt-automation/
├── src/
│   ├── app/
│   │   ├── page.tsx            # Single-page UI
│   │   ├── actions.ts          # server actions: getAvatars, generate, resubmit
│   │   └── api/
│   │       ├── progress/       # SSE stream of job_update / batch_complete events
│   │       └── file/           # binary file server for output/ (videos + thumbnails)
│   ├── components/             # AvatarSelector, NicheSelector, UrlInput, ResultsTable
│   ├── lib/
│   │   ├── queue.ts            # In-memory JobQueue (globalThis singleton, EventEmitter)
│   │   ├── niches.ts           # Niche configs (id, promptTone, defaultTags)
│   │   ├── youtube.ts          # parseYouTubeUrl helper
│   │   ├── types.ts            # zod schemas — single source of truth, types are z.infer'd
│   │   └── pipeline/           # fetch-transcript, fetch-competitor-thumb, spawn-claude,
│   │                           # split-scenes, heygen-submit, heygen-poll, download-video,
│   │                           # generate-thumbnail
│   └── hooks/
│       └── useSSE.ts           # Client-side SSE hook
├── remotion/                   # Remotion setup for video post-processing (separate package)
├── output/
│   ├── videos/                 # Downloaded MP4s
│   └── thumbnails/             # Generated thumbnails (and competitor refs)
├── CLAUDE.md                   # Project conventions for Claude Code
└── ROADMAP.md                  # Implementation progress + reverse-engineered API reference
```

## Architecture notes

- **In-memory queue, no database.** `JobQueue` lives on `globalThis` so it survives Next.js HMR; restart the dev server and all state is lost.
- **Server actions over route handlers.** RPC-style calls (`getAvatars`, `generate`, `resubmit`) live as server actions. Route handlers are reserved for things actions can't do — SSE streaming (`/api/progress`) and binary responses (`/api/file`).
- **Sequential Claude CLI, parallel HeyGen.** Claude spawns are gated through a shared promise chain (one CLI at a time); HeyGen scene polling runs in parallel via `Promise.all`.
- **Per-scene HeyGen submit.** `/v2/avatar/shortcut/submit` takes a single audio clip, so each scene becomes its own `video_id`. Jobs carry `heygenVideoIds: string[]` and `videoPaths: string[]`; concatenation is left for Remotion.
- **Schema is the source of truth.** Every cross-boundary type is `z.infer`'d from a zod schema in `src/lib/types.ts` — edit the schema, never the type.

## Remotion (post-processing)

Remotion lives in `remotion/` for future video post-processing (intros, outros, overlays). To use it independently:

```bash
cd remotion
npm install
npx remotion studio
```

## License

MIT
