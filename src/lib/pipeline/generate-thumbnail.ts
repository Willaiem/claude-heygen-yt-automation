import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { z } from "zod";

const THUMBS_DIR = join(process.cwd(), "output", "thumbnails");
const FAL_ENDPOINT = "https://fal.run/openai/gpt-image-2";

const FalResponseSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string(),
        content_type: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      }),
    )
    .min(1),
});

interface GenerateThumbnailParams {
  videoId: string;
  title: string;
  faceImageUrl: string;
  competitorThumbUrl: string;
}

export async function generateThumbnail(
  params: GenerateThumbnailParams,
): Promise<string> {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    throw new Error("FAL_KEY not configured in .env.local");
  }
  await mkdir(THUMBS_DIR, { recursive: true });

  const res = await fetch(FAL_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Key ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      prompt: buildPrompt(params.title),
      image_urls: [params.faceImageUrl, params.competitorThumbUrl],
      image_size: { width: 1536, height: 1024 },
      quality: "high",
      num_images: 1,
      output_format: "png",
    }),
  });

  if (!res.ok) {
    throw new Error(
      `fal.ai openai/gpt-image-2 responded ${res.status}: ${await res.text()}`,
    );
  }

  const parsed = FalResponseSchema.parse(await res.json());
  const imageUrl = parsed.images[0].url;

  const outPath = join(THUMBS_DIR, `${params.videoId}.png`);
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok || !imageRes.body) {
    throw new Error(`Thumbnail download failed ${imageRes.status}`);
  }
  await pipeline(
    Readable.fromWeb(imageRes.body as unknown as WebReadableStream<Uint8Array>),
    createWriteStream(outPath),
  );
  return outPath;
}

function buildPrompt(title: string): string {
  return [
    "Create a bold YouTube thumbnail in the style of the second reference image (the competitor thumbnail).",
    "Use the face from the first reference image as the main subject — keep facial identity, skin tone, and hair faithful to the reference.",
    `Overlay large, high-contrast text with the headline: "${title}". Keep text to at most 4–5 words; shorten if needed.`,
    "High-drama lighting, saturated colors, clean composition, 16:9 landscape framing, no watermarks, no logos.",
  ].join(" ");
}
