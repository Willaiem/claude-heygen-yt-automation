import { Img } from "remotion";

import { theme } from "../theme";
import {
  EnterExit,
  FooterCaption,
  HeaderBar,
  NumberedBadge,
  PanelCard,
} from "./_primitives";
import { SlideBackground } from "./SlideBackground";

export type ActionGridSlideProps = {
  title: string;
  subtitle?: string;
  actions: Array<{
    number: number;
    imageSrc?: string;
    label: string;
    description: string;
  }>;
  bottomCaption?: string;
  durationInFrames: number;
} & Record<string, unknown>;

export function ActionGridSlide({
  title,
  subtitle,
  actions,
  bottomCaption,
  durationInFrames,
}: ActionGridSlideProps) {
  const cols = actions.length <= 5 ? 5 : 3;
  return (
    <SlideBackground>
      <EnterExit durationInFrames={durationInFrames}>
        <HeaderBar title={title} subtitle={subtitle} />
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 32,
            marginTop: 56,
            paddingTop: 32,
          }}
        >
          {actions.map((action, index) => (
            <div key={index} style={{ position: "relative", height: "100%" }}>
              <NumberedBadge number={action.number} />
              <PanelCard style={{ height: "100%" }}>
                <div
                  style={{ flex: 1, position: "relative", overflow: "hidden" }}
                >
                  {action.imageSrc ? (
                    <Img
                      src={action.imageSrc}
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
                    padding: "16px 20px",
                    backgroundColor: theme.colors.navy,
                    color: theme.colors.textOnDark,
                    fontFamily: theme.font.family,
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 800 }}>
                    {action.label}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 500 }}>
                    {action.description}
                  </div>
                </div>
              </PanelCard>
            </div>
          ))}
        </div>
        {bottomCaption ? <FooterCaption text={bottomCaption} /> : null}
      </EnterExit>
    </SlideBackground>
  );
}
