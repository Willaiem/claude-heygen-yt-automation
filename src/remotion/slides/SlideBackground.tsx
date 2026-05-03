import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";

import { theme } from "../theme";

export function SlideBackground({
  children,
  pad = 80,
  bg = theme.colors.skyBg,
}: {
  children: ReactNode;
  pad?: number;
  bg?: string;
}) {
  const style: CSSProperties = {
    backgroundColor: bg,
    padding: pad,
    display: "flex",
    flexDirection: "column",
  };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
}
