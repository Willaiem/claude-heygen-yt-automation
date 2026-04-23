# YouTube Automation Pipeline

Turn any YouTube video into an original video on your own HeyGen avatar — with a matching thumbnail, title, tags, and description — from a single URL.

## What it does

Paste a competitor's YouTube URL and the pipeline:

1. Fetches the transcript via youtube-transcript.io
2. Spawns Claude Code CLI to rewrite it as an original ~15,000-character script
3. Splits the script into HeyGen-compatible scenes (max 4,800 chars each)
4. Submits to HeyGen API and polls until the video renders
5. Generates a branded thumbnail via ChatGPT `gpt-4o` with your face composited in
6. Produces YouTube-ready title, tags, and description

Supports batch processing — paste multiple URLs and they queue up automatically.

## Tech Stack

| Layer | Technology |
|---|---|
| Web app | Next.js (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Video rendering | HeyGen v2 API |
| Script writing | Claude Code CLI (`child_process.spawn`) |
| Thumbnails | OpenAI `gpt-4o` (ChatGPT image generation via chat completions) |
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
HEYGEN_API_KEY=sk_V2_hgu_...
OPENAI_API_KEY=sk-...
YOUTUBE_TRANSCRIPT_API_TOKEN=...
```

3. Create output directories (if they don't exist):

```bash
mkdir -p output/videos output/thumbnails public/references
```

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **Upload your face image** — click the upload button in the config bar (persisted to disk, one-time setup)
2. **Select a HeyGen avatar** — fetched from your HeyGen account
3. **Pick a niche** — Health or Politics (controls script tone and default tags)
4. **Paste YouTube URLs** — one per line
5. **Click Generate** — watch progress via SSE as each pipeline step completes
6. **Copy metadata** — use the copy buttons for title, tags, and description when uploading to YouTube Studio

## Project Structure

```
claude-heygen-yt-automation/
├── src/
│   ├── app/                    # Next.js pages + API routes
│   │   ├── page.tsx            # Single-page UI
│   │   └── api/                # avatars, generate, progress, upload-face, etc.
│   ├── components/             # AvatarSelector, NicheSelector, FaceUploader, etc.
│   ├── lib/
│   │   ├── queue.ts            # In-memory job queue + orchestrator
│   │   ├── niches.ts           # Niche configs
│   │   └── pipeline/           # fetch-transcript, spawn-claude, heygen-*, etc.
│   └── hooks/
│       └── useSSE.ts           # Client-side SSE hook
├── remotion/                   # Remotion setup for video post-processing
├── output/
│   ├── videos/                 # Downloaded MP4s
│   └── thumbnails/             # Generated thumbnails
├── public/references/          # Uploaded face images
├── ROADMAP.md                  # Implementation progress tracker
└── CLAUDE_YOUTUBE_AUTOMATION.md # Original blueprint reference
```

## Remotion (post-processing)

Remotion lives in `remotion/` for future video post-processing (intros, outros, overlays). To use it independently:

```bash
cd remotion
npm install
npx remotion studio
```

## License

MIT
