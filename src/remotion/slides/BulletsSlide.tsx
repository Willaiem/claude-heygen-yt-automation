import { theme } from "../theme";
import { EnterExit, HeaderBar } from "./_primitives";
import { SlideBackground } from "./SlideBackground";

export type BulletsSlideProps = {
  heading?: string;
  bullets: string[];
  durationInFrames: number;
} & Record<string, unknown>;

export function BulletsSlide({
  heading,
  bullets,
  durationInFrames,
}: BulletsSlideProps) {
  return (
    <SlideBackground>
      <EnterExit durationInFrames={durationInFrames}>
        {heading ? <HeaderBar title={heading} /> : null}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 28,
            marginTop: heading ? 48 : 0,
            paddingLeft: 80,
            paddingRight: 80,
          }}
        >
          {bullets.map((bullet, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 28,
                fontFamily: theme.font.family,
                fontSize: 48,
                fontWeight: 600,
                color: theme.colors.text,
                lineHeight: 1.25,
              }}
            >
              <div
                style={{
                  flex: "0 0 18px",
                  height: 18,
                  marginTop: 24,
                  borderRadius: "50%",
                  backgroundColor: theme.colors.accent,
                }}
              />
              <div>{bullet}</div>
            </div>
          ))}
        </div>
      </EnterExit>
    </SlideBackground>
  );
}
