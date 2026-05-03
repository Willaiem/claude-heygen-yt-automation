import { Img } from "remotion";

import type { CalloutPosition } from "@/lib/types";
import { theme } from "../theme";
import { CalloutPill, EnterExit, FooterCaption, HeaderBar } from "./_primitives";
import { SlideBackground } from "./SlideBackground";

export type DiagramSlideProps = {
  title: string;
  subtitle?: string;
  imageSrc?: string;
  callouts: Array<{ text: string; position: CalloutPosition }>;
  bottomCaption?: string;
  durationInFrames: number;
} & Record<string, unknown>;

export function DiagramSlide({
  title,
  subtitle,
  imageSrc,
  callouts,
  bottomCaption,
  durationInFrames,
}: DiagramSlideProps) {
  return (
    <SlideBackground>
      <EnterExit durationInFrames={durationInFrames}>
        <HeaderBar title={title} subtitle={subtitle} />
        <div
          style={{
            flex: 1,
            position: "relative",
            marginTop: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {imageSrc ? (
            <Img
              src={imageSrc}
              style={{
                maxWidth: "82%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: 18,
                boxShadow: "0 18px 32px rgba(8, 32, 61, 0.18)",
              }}
            />
          ) : (
            <div
              style={{
                width: "82%",
                height: "100%",
                borderRadius: 18,
                backgroundColor: theme.colors.skyBgSoft,
                border: `4px dashed ${theme.colors.navy}`,
              }}
            />
          )}
          {callouts.map((callout, index) => (
            <CalloutPill
              key={index}
              text={callout.text}
              position={callout.position}
            />
          ))}
        </div>
        {bottomCaption ? <FooterCaption text={bottomCaption} /> : null}
      </EnterExit>
    </SlideBackground>
  );
}
