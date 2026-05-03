import { Img } from "remotion";

import { theme } from "../theme";
import { EnterExit, FooterCaption, HeaderBar, PanelCard } from "./_primitives";
import { SlideBackground } from "./SlideBackground";

export type StepsSlideProps = {
  title: string;
  subtitle?: string;
  steps: Array<{ imageSrc?: string; label: string; caption: string }>;
  footerCaption?: string;
  durationInFrames: number;
} & Record<string, unknown>;

export function StepsSlide({
  title,
  subtitle,
  steps,
  footerCaption,
  durationInFrames,
}: StepsSlideProps) {
  return (
    <SlideBackground>
      <EnterExit durationInFrames={durationInFrames}>
        <HeaderBar title={title} subtitle={subtitle} />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "stretch",
            justifyContent: "center",
            gap: 24,
            marginTop: 32,
          }}
        >
          {steps.map((step, index) => (
            <div
              key={index}
              style={{ display: "flex", alignItems: "center", flex: 1 }}
            >
              <PanelCard style={{ flex: 1, height: "100%" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  {step.imageSrc ? (
                    <Img
                      src={step.imageSrc}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: theme.colors.skyBgSoft,
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    padding: "20px 24px",
                    backgroundColor: theme.colors.navy,
                    color: theme.colors.textOnDark,
                    fontFamily: theme.font.family,
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1 }}>
                    {step.label.toUpperCase()}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 22, fontWeight: 500 }}>
                    {step.caption}
                  </div>
                </div>
              </PanelCard>
              {index < steps.length - 1 ? (
                <div
                  style={{
                    width: 60,
                    fontSize: 80,
                    color: theme.colors.accent,
                    textAlign: "center",
                    fontWeight: 900,
                    lineHeight: 1,
                  }}
                >
                  →
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {footerCaption ? <FooterCaption text={footerCaption} /> : null}
      </EnterExit>
    </SlideBackground>
  );
}
