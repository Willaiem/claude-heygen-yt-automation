import { NicheConfigSchema, type NicheConfig } from "@/lib/types";

export const NICHES: NicheConfig[] = [
  NicheConfigSchema.parse({
    id: "health",
    name: "Health",
    promptTone:
      "Authoritative but approachable health commentary. Cite mechanisms and studies in plain language, emphasize practical takeaways, and avoid sensationalism. Use a calm, curious, evidence-first voice.",
    defaultTags: [
      "health",
      "wellness",
      "nutrition",
      "longevity",
      "science",
    ],
  }),
  NicheConfigSchema.parse({
    id: "politics",
    name: "Politics",
    promptTone:
      "Sharp, analytical political commentary. Explain incentives and historical context, keep claims factual, and frame tradeoffs honestly. Use a confident, skeptical, narrative voice.",
    defaultTags: [
      "politics",
      "news",
      "analysis",
      "commentary",
      "policy",
    ],
  }),
];

export function getNiche(id: string): NicheConfig {
  const niche = NICHES.find((n) => n.id === id);
  if (!niche) throw new Error(`Unknown niche: ${id}`);
  return niche;
}
