import { z } from "zod";

const TranscriptResponseSchema = z.array(
  z.object({
    id: z.string(),
    tracks: z
      .array(
        z.object({
          transcript: z
            .array(
              z.object({
                text: z.string(),
              }),
            )
            .nullish(),
        }),
      )
      .nullish(),
  }),
);

export async function fetchTranscript(videoId: string): Promise<string> {
  const token = process.env.YOUTUBE_TRANSCRIPT_API_TOKEN;
  if (!token) {
    throw new Error("YOUTUBE_TRANSCRIPT_API_TOKEN not configured in .env.local");
  }

  const res = await fetch("https://www.youtube-transcript.io/api/transcripts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${token}`,
    },
    body: JSON.stringify({ ids: [videoId] }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`youtube-transcript.io responded ${res.status}`);
  }

  const body = TranscriptResponseSchema.parse(await res.json());
  const entry = body.find((e) => e.id === videoId) ?? body[0];
  const segments = entry?.tracks?.[0]?.transcript;

  if (!segments?.length) {
    throw new Error(`No transcript returned for ${videoId}`);
  }

  return segments
    .map((s) => s.text.trim())
    .filter(Boolean)
    .join(" ");
}
