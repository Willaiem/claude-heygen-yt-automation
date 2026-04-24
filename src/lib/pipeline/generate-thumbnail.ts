import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const THUMBS_DIR = join(process.cwd(), "output", "thumbnails");

const ImageEditResponseSchema = z.object({
  data: z
    .array(z.object({ b64_json: z.string() }))
    .min(1),
});

interface GenerateThumbnailParams {
  videoId: string;
  title: string;
  faceImageUrl: string;
  competitorThumbPath: string;
}

export async function generateThumbnail(
  params: GenerateThumbnailParams,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured in .env.local");
  }
  await mkdir(THUMBS_DIR, { recursive: true });

  const [faceBuf, competitorBuf] = await Promise.all([
    fetchAsBuffer(params.faceImageUrl),
    readFile(params.competitorThumbPath),
  ]);

  const prompt = buildPrompt(params.title);

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("prompt", prompt);
  form.append("size", "1536x1024");
  form.append("n", "1");
  form.append(
    "image[]",
    new Blob([new Uint8Array(faceBuf)], { type: "image/jpeg" }),
    "face.jpg",
  );
  form.append(
    "image[]",
    new Blob([new Uint8Array(competitorBuf)], { type: "image/jpeg" }),
    "competitor.jpg",
  );

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`OpenAI images/edits responded ${res.status}: ${await res.text()}`);
  }

  const parsed = ImageEditResponseSchema.parse(await res.json());
  const png = Buffer.from(parsed.data[0].b64_json, "base64");
  const outPath = join(THUMBS_DIR, `${params.videoId}.png`);
  await writeFile(outPath, png);
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

async function fetchAsBuffer(url: string): Promise<Buffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
