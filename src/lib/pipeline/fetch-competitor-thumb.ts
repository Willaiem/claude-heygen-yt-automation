import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const THUMBS_DIR = join(process.cwd(), "output", "thumbnails");

const RESOLUTIONS = ["maxresdefault", "hqdefault", "mqdefault"] as const;

export async function fetchCompetitorThumbnail(
  videoId: string,
): Promise<string> {
  await mkdir(THUMBS_DIR, { recursive: true });

  let lastStatus = 0;
  for (const res of RESOLUTIONS) {
    const response = await fetch(
      `https://img.youtube.com/vi/${videoId}/${res}.jpg`,
    );
    if (!response.ok) {
      lastStatus = response.status;
      continue;
    }
    const buf = Buffer.from(await response.arrayBuffer());
    const outPath = join(THUMBS_DIR, `competitor_${videoId}.jpg`);
    await writeFile(outPath, buf);
    return outPath;
  }

  throw new Error(
    `No thumbnail available for ${videoId} (last status ${lastStatus})`,
  );
}
