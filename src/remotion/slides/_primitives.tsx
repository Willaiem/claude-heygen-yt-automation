import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { theme } from "../theme";
import type { CalloutPosition } from "@/lib/types";

export function HeaderBar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        color: theme.colors.navy,
        fontFamily: theme.font.family,
      }}
    >
      <div
        style={{
          fontWeight: theme.font.headingWeight,
          fontSize: 84,
          letterSpacing: -1,
          lineHeight: 1.05,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            marginTop: 12,
            fontWeight: theme.font.bodyWeight,
            fontSize: 36,
            color: theme.colors.textSoft,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export function FooterCaption({ text }: { text: string }) {
  return (
    <div
      style={{
        marginTop: 32,
        textAlign: "center",
        fontFamily: theme.font.family,
        fontWeight: 700,
        fontSize: 36,
        color: theme.colors.navy,
      }}
    >
      {text}
    </div>
  );
}

export function PanelCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        backgroundColor: theme.colors.panelBg,
        borderRadius: 24,
        border: `4px solid ${theme.colors.panelBorder}`,
        boxShadow: "0 18px 32px rgba(8, 32, 61, 0.18)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SirenBadge({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 22px",
        borderRadius: 999,
        backgroundColor: theme.colors.accent,
        color: theme.colors.textOnDark,
        fontFamily: theme.font.family,
        fontWeight: 800,
        fontSize: 28,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}
    >
      <span style={{ fontSize: 32, lineHeight: 1 }}>!</span>
      {label}
    </div>
  );
}

export function NumberedBadge({ number }: { number: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: -28,
        left: -28,
        width: 80,
        height: 80,
        borderRadius: "50%",
        backgroundColor: theme.colors.accent,
        color: theme.colors.textOnDark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: theme.font.family,
        fontWeight: 900,
        fontSize: 44,
        boxShadow: "0 8px 18px rgba(216, 58, 58, 0.4)",
      }}
    >
      {number}
    </div>
  );
}

const calloutStyleByPosition: Record<CalloutPosition, CSSProperties> = {
  "top-left": { top: "8%", left: "6%" },
  "top-right": { top: "8%", right: "6%" },
  "bottom-left": { bottom: "8%", left: "6%" },
  "bottom-right": { bottom: "8%", right: "6%" },
  left: { top: "50%", left: "4%", transform: "translateY(-50%)" },
  right: { top: "50%", right: "4%", transform: "translateY(-50%)" },
  top: { top: "4%", left: "50%", transform: "translateX(-50%)" },
  bottom: { bottom: "4%", left: "50%", transform: "translateX(-50%)" },
};

export function CalloutPill({
  text,
  position,
}: {
  text: string;
  position: CalloutPosition;
}) {
  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: theme.colors.navy,
        color: theme.colors.textOnDark,
        padding: "12px 22px",
        borderRadius: 14,
        fontFamily: theme.font.family,
        fontWeight: 700,
        fontSize: 28,
        maxWidth: 400,
        boxShadow: "0 10px 22px rgba(8, 32, 61, 0.3)",
        ...calloutStyleByPosition[position],
      }}
    >
      {text}
    </div>
  );
}

export function EnterExit({
  children,
  durationInFrames,
}: {
  children: ReactNode;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.round(0.2 * fps);
  const exitFrames = Math.round(0.15 * fps);

  const enterOpacity = interpolate(frame, [0, enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - exitFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = Math.min(enterOpacity, exitOpacity);

  const translateY = interpolate(frame, [0, enterFrames], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}
