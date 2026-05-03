import { theme } from "../theme";
import { EnterExit } from "./_primitives";
import { SlideBackground } from "./SlideBackground";

export type StatSlideProps = {
  value: string;
  label: string;
  durationInFrames: number;
} & Record<string, unknown>;

export function StatSlide({ value, label, durationInFrames }: StatSlideProps) {
  return (
    <SlideBackground>
      <EnterExit durationInFrames={durationInFrames}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: theme.font.family,
            color: theme.colors.text,
          }}
        >
          <div
            style={{
              fontSize: 320,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: -8,
              color: theme.colors.accent,
            }}
          >
            {value}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 56,
              fontWeight: 700,
              textAlign: "center",
              maxWidth: "70%",
              lineHeight: 1.15,
            }}
          >
            {label}
          </div>
        </div>
      </EnterExit>
    </SlideBackground>
  );
}
