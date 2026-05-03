import type { CSSProperties } from "react";
import { OffthreadVideo, useCurrentFrame } from "remotion";

import type { ResolvedSlide } from "@/lib/types";
import { theme } from "../theme";

interface Props {
  videoUrl: string;
  slides: ResolvedSlide[];
}

export function AvatarLayer({ videoUrl, slides }: Props) {
  const frame = useCurrentFrame();
  const active = slides.find(
    (slide) => frame >= slide.startFrame && frame < slide.endFrame,
  );
  const layout = active?.layout ?? "full";
  const style = avatarStyleFor(layout);
  return <OffthreadVideo src={videoUrl} style={style} />;
}

function avatarStyleFor(layout: "full" | "pip" | "cover"): CSSProperties {
  if (layout === "cover") {
    // Visually hidden, audio still plays.
    return {
      position: "absolute",
      width: 1,
      height: 1,
      opacity: 0,
      pointerEvents: "none",
    };
  }
  if (layout === "pip") {
    return {
      position: "absolute",
      top: `${theme.pip.insetPct}%`,
      right: `${theme.pip.insetPct}%`,
      width: `${theme.pip.sizePct}%`,
      aspectRatio: "1 / 1",
      borderRadius: "50%",
      objectFit: "cover",
      objectPosition: "center top",
      border: `6px solid ${theme.colors.panelBg}`,
      boxShadow: "0 12px 28px rgba(8, 32, 61, 0.45)",
      zIndex: 100,
    };
  }
  return {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };
}
