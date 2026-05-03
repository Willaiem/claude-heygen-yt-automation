import { Img } from "remotion";

import { theme } from "../theme";
import {
  EnterExit,
  FooterCaption,
  HeaderBar,
  PanelCard,
  SirenBadge,
} from "./_primitives";
import { SlideBackground } from "./SlideBackground";

export type WarningGridSlideProps = {
  title: string;
  subtitle?: string;
  panels: Array<{
    imageSrc?: string;
    label: string;
    caption: string;
    boldFooter?: string;
  }>;
  footerBanner?: string;
  bottomCaption?: string;
  durationInFrames: number;
} & Record<string, unknown>;

export function WarningGridSlide({
  title,
  subtitle,
  panels,
  footerBanner,
  bottomCaption,
  durationInFrames,
}: WarningGridSlideProps) {
  return (
    <SlideBackground>
      <EnterExit durationInFrames={durationInFrames}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <SirenBadge label="Emergency Signs" />
        </div>
        <HeaderBar title={title} subtitle={subtitle} />
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 24,
            marginTop: 32,
          }}
        >
          {panels.map((panel, index) => (
            <PanelCard key={index} style={{ height: "100%" }}>
              <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                {panel.imageSrc ? (
                  <Img
                    src={panel.imageSrc}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                  padding: "16px 22px",
                  backgroundColor: theme.colors.navy,
                  color: theme.colors.textOnDark,
                  fontFamily: theme.font.family,
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 800 }}>{panel.label}</div>
                <div style={{ marginTop: 6, fontSize: 20, fontWeight: 500 }}>
                  {panel.caption}
                </div>
                {panel.boldFooter ? (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 22,
                      fontWeight: 800,
                      color: theme.colors.accentSoft,
                    }}
                  >
                    {panel.boldFooter}
                  </div>
                ) : null}
              </div>
            </PanelCard>
          ))}
        </div>
        {footerBanner ? (
          <div
            style={{
              marginTop: 28,
              padding: "16px 28px",
              backgroundColor: theme.colors.accent,
              color: theme.colors.textOnDark,
              borderRadius: 14,
              textAlign: "center",
              fontFamily: theme.font.family,
              fontWeight: 800,
              fontSize: 32,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {footerBanner}
          </div>
        ) : null}
        {bottomCaption ? <FooterCaption text={bottomCaption} /> : null}
      </EnterExit>
    </SlideBackground>
  );
}
