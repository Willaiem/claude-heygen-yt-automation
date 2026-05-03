import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";

import {
  type JobRenderProps,
  JobRenderPropsSchema,
} from "@/lib/types";
import { AvatarLayer } from "../avatar/AvatarLayer";
import { SlideRenderer } from "../slides/SlideRenderer";
import { theme } from "../theme";

export function JobComposition(props: JobRenderProps) {
  const { fps } = useVideoConfig();
  let cumulative = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {props.scenes.map((scene, sceneIndex) => {
        const sceneFrames = Math.max(1, Math.round(scene.durationSec * fps));
        const from = cumulative;
        cumulative += sceneFrames;
        return (
          <Sequence
            key={sceneIndex}
            from={from}
            durationInFrames={sceneFrames}
            premountFor={fps}
          >
            <AbsoluteFill style={{ backgroundColor: theme.colors.skyBg }}>
              <AvatarLayer videoUrl={scene.videoUrl} slides={scene.slides} />
              {scene.slides.map((slide) => {
                const duration = Math.max(1, slide.endFrame - slide.startFrame);
                return (
                  <Sequence
                    key={slide.id}
                    from={slide.startFrame}
                    durationInFrames={duration}
                    premountFor={Math.round(fps * 0.5)}
                  >
                    <SlideRenderer slide={slide} />
                  </Sequence>
                );
              })}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

export const calculateJobCompositionMetadata: CalculateMetadataFunction<
  JobRenderProps
> = ({ props }) => {
  const parsed = JobRenderPropsSchema.parse(props);
  const totalSec = parsed.scenes.reduce(
    (sum, scene) => sum + scene.durationSec,
    0,
  );
  return {
    durationInFrames: Math.max(1, Math.ceil(totalSec * theme.fps)),
    fps: theme.fps,
    width: theme.width,
    height: theme.height,
  };
};
