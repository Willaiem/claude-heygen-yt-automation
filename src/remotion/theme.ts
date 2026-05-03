export const theme = {
  colors: {
    navy: "#0e2a4d",
    navyDeep: "#08203d",
    skyBg: "#cfe7f5",
    skyBgSoft: "#e6f2fa",
    accent: "#d83a3a",
    accentSoft: "#f06b6b",
    warning: "#f6a623",
    text: "#0e2a4d",
    textSoft: "#36527a",
    textOnDark: "#ffffff",
    panelBg: "#ffffff",
    panelBorder: "#0e2a4d",
  },
  font: {
    family:
      '"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    headingWeight: 800,
    bodyWeight: 500,
  },
  fps: 30,
  width: 1920,
  height: 1080,
  enterFrames: 6,
  exitFrames: 5,
  pip: {
    sizePct: 18,
    insetPct: 4,
  },
} as const;

export type Theme = typeof theme;
