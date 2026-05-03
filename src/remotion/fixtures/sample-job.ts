import type { JobRenderProps } from "@/lib/types";

export const sampleJobRenderProps: JobRenderProps = {
  scenes: [
    {
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      durationSec: 12,
      slides: [
        {
          id: "intro-title",
          type: "title",
          text: "Welcome",
          subtitle: "A sample preview",
          startPhrase: "",
          end: { kind: "hold", seconds: 3 },
          layout: "cover",
          startFrame: 30,
          endFrame: 120,
        },
        {
          id: "key-bullets",
          type: "bullets",
          heading: "Three things to know",
          bullets: ["Stays sharp at 1920x1080", "Renders fast", "Easy to theme"],
          startPhrase: "",
          end: { kind: "hold", seconds: 4 },
          layout: "pip",
          startFrame: 150,
          endFrame: 270,
        },
      ],
    },
  ],
};
