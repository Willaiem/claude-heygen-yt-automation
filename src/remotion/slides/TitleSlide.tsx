import { theme } from "../theme";
import { EnterExit } from "./_primitives";
import { SlideBackground } from "./SlideBackground";

export type TitleSlideProps = {
  text: string;
  subtitle?: string;
  durationInFrames: number;
} & Record<string, unknown>;

export function TitleSlide({ text, subtitle, durationInFrames }: TitleSlideProps) {
  return (
    <SlideBackground bg={theme.colors.navy}>
      <EnterExit durationInFrames={durationInFrames}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.colors.textOnDark,
            fontFamily: theme.font.family,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontWeight: 900,
                fontSize: 132,
                lineHeight: 1,
                letterSpacing: -2,
              }}
            >
              {text}
            </div>
            {subtitle ? (
              <div
                style={{
                  marginTop: 28,
                  fontSize: 48,
                  fontWeight: 500,
                  color: theme.colors.skyBg,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
      </EnterExit>
    </SlideBackground>
  );
}
