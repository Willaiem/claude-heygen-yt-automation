import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

const VIDEOS_DIR = join(process.cwd(), "output", "videos");

export async function downloadVideo(
  url: string,
  videoId: string,
): Promise<string> {
  await mkdir(VIDEOS_DIR, { recursive: true });

  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Video download failed ${res.status}`);
  }

  const outPath = join(VIDEOS_DIR, `${videoId}.mp4`);
  await pipeline(
    Readable.fromWeb(res.body as unknown as WebReadableStream<Uint8Array>),
    createWriteStream(outPath),
  );
  return outPath;
}
