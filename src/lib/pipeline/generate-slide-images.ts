import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";
import { z } from "zod";

import type { Slide, SlidePlan } from "@/lib/types";

const FAL_ENDPOINT = "https://fal.run/openai/gpt-image-2";

const FalResponseSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string(),
        content_type: z.string().optional(),
      }),
    )
    .min(1),
});

interface GenerateSlideImagesParams {
  jobId: string;
  plan: SlidePlan;
}

interface PromptTask {
  sceneIndex: number;
  slideIndex: number;
  panelIndex: number;
  prompt: string;
  imageSize: { width: number; height: number };
}

export async function generateSlideImages(
  params: GenerateSlideImagesParams,
): Promise<string[][]> {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    throw new Error("FAL_KEY not configured in .env.local");
  }
  const outDir = join(process.cwd(), "output", "slide-images", params.jobId);
  await mkdir(outDir, { recursive: true });

  const tasks = collectTasks(params.plan);
  if (tasks.length === 0) {
    return params.plan.scenes.map(() => []);
  }

  const results = await Promise.all(
    tasks.map((task) => runOne(apiKey, outDir, task)),
  );

  // Result shape: outer = scenes; inner = flat list of every image path for that
  // scene, in (slideIndex, panelIndex) order. Slide assembly happens in
  // resolve-slide-timing where we have the original slide structure to slot the
  // paths back into.
  const perScene: string[][] = params.plan.scenes.map(() => []);
  for (let i = 0; i < tasks.length; i++) {
    perScene[tasks[i].sceneIndex].push(results[i]);
  }
  return perScene;
}

function collectTasks(plan: SlidePlan): PromptTask[] {
  const tasks: PromptTask[] = [];
  for (const scene of plan.scenes) {
    for (let slideIndex = 0; slideIndex < scene.slides.length; slideIndex++) {
      const slide = scene.slides[slideIndex];
      const panels = panelsFor(slide);
      for (let panelIndex = 0; panelIndex < panels.length; panelIndex++) {
        tasks.push({
          sceneIndex: scene.sceneIndex,
          slideIndex,
          panelIndex,
          prompt: panels[panelIndex],
          imageSize:
            slide.type === "diagram"
              ? { width: 1536, height: 1024 }
              : { width: 1024, height: 1024 },
        });
      }
    }
  }
  return tasks;
}

function panelsFor(slide: Slide): string[] {
  switch (slide.type) {
    case "diagram":
      return [slide.imagePrompt];
    case "steps":
      return slide.steps.map((step) => step.imagePrompt);
    case "warning_grid":
      return slide.panels.map((panel) => panel.imagePrompt);
    case "action_grid":
      return slide.actions.map((action) => action.imagePrompt);
    case "title":
    case "bullets":
    case "stat":
      return [];
  }
}

async function runOne(
  apiKey: string,
  outDir: string,
  task: PromptTask,
): Promise<string> {
  const res = await fetch(FAL_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Key ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      prompt: task.prompt,
      image_size: task.imageSize,
      quality: "high",
      num_images: 1,
      output_format: "png",
    }),
  });
  if (!res.ok) {
    throw new Error(
      `fal.ai openai/gpt-image-2 (scene ${task.sceneIndex} slide ${task.slideIndex} panel ${task.panelIndex}) responded ${res.status}: ${await res.text()}`,
    );
  }
  const parsed = FalResponseSchema.parse(await res.json());
  const imageUrl = parsed.images[0].url;

  const filename = `${task.sceneIndex}_${task.slideIndex}_${task.panelIndex}.png`;
  const outPath = join(outDir, filename);
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok || !imageRes.body) {
    throw new Error(`Slide image download failed ${imageRes.status}`);
  }
  await pipeline(
    Readable.fromWeb(imageRes.body as unknown as WebReadableStream<Uint8Array>),
    createWriteStream(outPath),
  );
  return outPath;
}
