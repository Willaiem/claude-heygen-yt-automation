import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const THUMBS_DIR = join(process.cwd(), "output", "thumbnails");

const RESOLUTIONS = ["maxresdefault", "hqdefault", "mqdefault"] as const;

export interface CompetitorThumbnail {
  path: string;
  url: string;
}

export async function fetchCompetitorThumbnail(
  videoId: string,
): Promise<CompetitorThumbnail> {
  await mkdir(THUMBS_DIR, { recursive: true });

  let lastStatus = 0;
  for (const resolution of RESOLUTIONS) {
    const url = `https://img.youtube.com/vi/${videoId}/${resolution}.jpg`;
    const response = await fetch(url);
    if (!response.ok) {
      lastStatus = response.status;
      continue;
    }
    const buf = Buffer.from(await response.arrayBuffer());
    const path = join(THUMBS_DIR, `competitor_${videoId}.jpg`);
    await writeFile(path, buf);
    return { path, url };
  }

  throw new Error(
    `No thumbnail available for ${videoId} (last status ${lastStatus})`,
  );
}
