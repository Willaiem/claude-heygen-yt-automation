import type { NicheConfig, WordTimestamp } from "@/lib/types";

interface BuildPromptParams {
  niche: NicheConfig;
  scene: string;
  sceneIndex: number;
  sceneWords: WordTimestamp[];
  title: string;
}

const APPROX_SECONDS_PER_SLIDE = 15;

export function buildSlidePlannerPrompt(params: BuildPromptParams): string {
  const sceneDurationSec = sceneDuration(params.sceneWords);
  const targetSlides = Math.max(
    1,
    Math.min(8, Math.round(sceneDurationSec / APPROX_SECONDS_PER_SLIDE)),
  );

  return [
    `You are an editorial designer planning AI infographic slide overlays for a ${params.niche.name} avatar-narrated YouTube video titled "${params.title}".`,
    `Tone: ${params.niche.promptTone}.`,
    "",
    `This is scene ${params.sceneIndex + 1}. Audio duration is ~${sceneDurationSec.toFixed(1)}s. Target ~${targetSlides} slides (hard max 8).`,
    "",
    "Slide types and required props:",
    '- title: { text, subtitle? }',
    '- bullets: { heading?, bullets[1..5] }',
    '- stat: { value, label }',
    '- diagram: { title, subtitle?, imagePrompt, callouts[{text,position}], bottomCaption? }',
    '- steps: { title, subtitle?, steps[3]{ imagePrompt, label, caption }, footerCaption? }',
    '- warning_grid: { title, subtitle?, panels[4]{ imagePrompt, label, caption, boldFooter? }, footerBanner?, bottomCaption? }',
    '- action_grid: { title, subtitle?, actions[5..6]{ number, imagePrompt, label, description }, bottomCaption? }',
    "",
    "Common fields on every slide:",
    '- id: short unique slug',
    '- type: one of the seven above',
    '- startPhrase: an EXACT substring of the scene narration where the slide should appear',
    '- end: { kind: "phrase", phrase: "<exact substring>" } OR { kind: "hold", seconds: <number> }',
    '- layout (optional): "pip" (avatar shrinks to top-right circle) or "cover" (avatar hidden). Defaults: steps→pip, warning_grid/action_grid→cover, others→pip',
    "",
    "Image prompt rules:",
    "- imagePrompt is a complete text-to-image prompt. Be vivid, concrete, branded (clean editorial illustration, on-brand health-style palette).",
    "- Diagrams render at 1536x1024. Grid panels render at 1024x1024.",
    "- Do NOT include text-in-image instructions; on-screen text comes from the slide props, not the image.",
    "",
    "Slide pacing rules:",
    "- Slides should not overlap. Order them in narration order.",
    `- Aim for ~1 slide per ${APPROX_SECONDS_PER_SLIDE}s of audio. Hard cap 8 slides.`,
    "- startPhrase / end.phrase must be exact lowercased substrings (we match case-insensitively, but no paraphrasing).",
    "",
    'Output format: a single JSON object exactly: { "slides": Slide[] }',
    "Return ONLY the JSON object. No markdown fences, no prose before or after.",
    "",
    "--- SCENE NARRATION ---",
    params.scene,
  ].join("\n");
}

function sceneDuration(words: WordTimestamp[]): number {
  if (words.length === 0) return 0;
  return words[words.length - 1].end;
}
