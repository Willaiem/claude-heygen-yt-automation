import { z } from "zod";

import { buildSlidePlannerPrompt } from "@/lib/prompts/slide-planner";
import {
  SlideSchema,
  type NicheConfig,
  type Slide,
  type SlidePlan,
  type WordTimestamp,
} from "@/lib/types";

const ScenePlanResponseSchema = z.object({
  slides: z.array(SlideSchema).max(8),
});

interface PlanSlidesParams {
  niche: NicheConfig;
  title: string;
  scenes: string[];
  sceneWords: WordTimestamp[][];
  runClaude: <T>(prompt: string, schema: z.ZodType<T>, label: string) => Promise<T>;
}

export async function planSlides(params: PlanSlidesParams): Promise<SlidePlan> {
  const out: SlidePlan = { scenes: [] };
  for (let sceneIndex = 0; sceneIndex < params.scenes.length; sceneIndex++) {
    const scene = params.scenes[sceneIndex];
    const words = params.sceneWords[sceneIndex] ?? [];
    const prompt = buildSlidePlannerPrompt({
      niche: params.niche,
      scene,
      sceneIndex,
      sceneWords: words,
      title: params.title,
    });
    const parsed = await params.runClaude(
      prompt,
      ScenePlanResponseSchema,
      `slide plan for scene ${sceneIndex + 1}`,
    );
    out.scenes.push({ sceneIndex, slides: parsed.slides as Slide[] });
  }
  return out;
}
