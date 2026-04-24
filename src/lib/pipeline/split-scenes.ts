export const HEYGEN_SCENE_CHAR_LIMIT = 4800;

export function splitScenes(
  script: string,
  maxChars: number = HEYGEN_SCENE_CHAR_LIMIT,
): string[] {
  if (maxChars <= 0) throw new Error("maxChars must be positive");

  const sentences = script.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [];
  const scenes: string[] = [];
  let current = "";

  for (const raw of sentences) {
    const sentence = raw;
    if (sentence.length > maxChars) {
      if (current.trim()) {
        scenes.push(current.trim());
        current = "";
      }
      for (let i = 0; i < sentence.length; i += maxChars) {
        scenes.push(sentence.slice(i, i + maxChars).trim());
      }
      continue;
    }
    if (current.length + sentence.length > maxChars && current.trim()) {
      scenes.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim()) scenes.push(current.trim());
  return scenes;
}
