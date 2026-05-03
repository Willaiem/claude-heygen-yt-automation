import {
  type JobRenderProps,
  type ResolvedSlide,
  type Slide,
  type SlidePlan,
  type WordTimestamp,
} from "@/lib/types";

const FPS = 30;

const DEFAULT_LAYOUT_BY_TYPE: Record<Slide["type"], "pip" | "cover"> = {
  title: "pip",
  bullets: "pip",
  stat: "pip",
  diagram: "pip",
  steps: "pip",
  warning_grid: "cover",
  action_grid: "cover",
};

interface ResolveParams {
  plan: SlidePlan;
  sceneWords: WordTimestamp[][];
  videoPaths: string[];
  slideImagePaths: string[][];
  baseUrl: string;
}

export function resolveSlideTiming(params: ResolveParams): JobRenderProps {
  const scenes: JobRenderProps["scenes"] = [];

  for (let sceneIndex = 0; sceneIndex < params.videoPaths.length; sceneIndex++) {
    const words = params.sceneWords[sceneIndex] ?? [];
    const durationSec = sceneDurationSec(words);
    const planForScene =
      params.plan.scenes.find((scene) => scene.sceneIndex === sceneIndex) ??
      { sceneIndex, slides: [] };
    const slidePathsForScene = (params.slideImagePaths[sceneIndex] ?? []).map(
      (path) => buildAssetUrl(params.baseUrl, path),
    );

    const resolvedSlides = resolveSceneSlides({
      slides: planForScene.slides,
      words,
      durationSec,
      slidePathsForScene,
    });

    scenes.push({
      videoUrl: buildAssetUrl(params.baseUrl, params.videoPaths[sceneIndex]),
      durationSec,
      slides: resolvedSlides,
    });
  }

  return { scenes };
}

interface SceneResolveInput {
  slides: Slide[];
  words: WordTimestamp[];
  durationSec: number;
  slidePathsForScene: string[];
}

function resolveSceneSlides(input: SceneResolveInput): ResolvedSlide[] {
  const out: ResolvedSlide[] = [];
  let pathCursor = 0;

  for (const slide of input.slides) {
    const panelCount = panelCountFor(slide);
    const slicedPaths = input.slidePathsForScene.slice(
      pathCursor,
      pathCursor + panelCount,
    );
    pathCursor += panelCount;

    const startSec = matchPhraseStart(input.words, slide.startPhrase);
    const resolvedStart = startSec ?? input.durationSec / 2;

    let endSec: number;
    if (slide.end.kind === "hold") {
      endSec = resolvedStart + slide.end.seconds;
    } else {
      const matched = matchPhraseStart(input.words, slide.end.phrase);
      endSec = matched ?? Math.min(input.durationSec, resolvedStart + 5);
    }
    if (endSec <= resolvedStart) endSec = resolvedStart + 0.5;
    if (endSec > input.durationSec) endSec = input.durationSec;

    if (startSec === null) {
      console.warn(
        `[resolve-slide-timing] startPhrase not matched for slide ${slide.id}; falling back to scene midpoint`,
      );
    }

    const layout = slide.layout ?? DEFAULT_LAYOUT_BY_TYPE[slide.type];
    const startFrame = Math.round(resolvedStart * FPS);
    const endFrame = Math.max(startFrame + 1, Math.round(endSec * FPS));

    out.push({
      ...slide,
      layout,
      startFrame,
      endFrame,
      resolvedImagePaths: panelCount > 0 ? slicedPaths : undefined,
    } as ResolvedSlide);
  }

  return out;
}

function panelCountFor(slide: Slide): number {
  switch (slide.type) {
    case "diagram":
      return 1;
    case "steps":
      return slide.steps.length;
    case "warning_grid":
      return slide.panels.length;
    case "action_grid":
      return slide.actions.length;
    case "title":
    case "bullets":
    case "stat":
      return 0;
  }
}

function matchPhraseStart(
  words: WordTimestamp[],
  phrase: string,
): number | null {
  if (words.length === 0) return null;
  const target = normalizeTokens(phrase);
  if (target.length === 0) return null;

  const haystack = words.map((wordEntry) => normalizeWord(wordEntry.word));

  for (let i = 0; i + target.length <= haystack.length; i++) {
    let allMatch = true;
    for (let j = 0; j < target.length; j++) {
      if (haystack[i + j] !== target[j]) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return words[i].start;
  }
  return null;
}

function normalizeTokens(s: string): string[] {
  return s
    .split(/\s+/)
    .map(normalizeWord)
    .filter((token) => token.length > 0);
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
}

function sceneDurationSec(words: WordTimestamp[]): number {
  if (words.length === 0) return 0;
  return words[words.length - 1].end;
}

function buildAssetUrl(baseUrl: string, absolutePath: string): string {
  return `${baseUrl}/api/file?path=${encodeURIComponent(absolutePath)}`;
}
