import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  selectComposition,
} from "@remotion/renderer";

import type { JobRenderProps } from "@/lib/types";

const COMPOSITION_ID = "JobComposition";
const FINAL_DIR = join(process.cwd(), "output", "final");

interface GlobalCache {
  __remotionBundle?: Promise<string>;
}

const cached = globalThis as typeof globalThis & GlobalCache;

function getBundle(): Promise<string> {
  if (!cached.__remotionBundle) {
    cached.__remotionBundle = bundle({
      entryPoint: join(process.cwd(), "src", "remotion", "index.ts"),
      webpackOverride: (config) => config,
    });
  }
  return cached.__remotionBundle;
}

interface RenderFinalParams {
  jobRenderProps: JobRenderProps;
  videoId: string;
  onProgress?: (progress: number) => void;
}

export async function renderFinal(
  params: RenderFinalParams,
): Promise<string> {
  await mkdir(FINAL_DIR, { recursive: true });

  const serveUrl = await getBundle();

  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps: params.jobRenderProps,
  });

  const outPath = join(FINAL_DIR, `${params.videoId}.mp4`);
  const propsDumpPath = join(FINAL_DIR, `${params.videoId}.props.json`);
  await writeFile(
    propsDumpPath,
    JSON.stringify(params.jobRenderProps, null, 2),
    "utf8",
  );

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 18,
    outputLocation: outPath,
    inputProps: params.jobRenderProps,
    onProgress: params.onProgress
      ? ({ progress }) => params.onProgress!(progress)
      : undefined,
  });

  return outPath;
}
