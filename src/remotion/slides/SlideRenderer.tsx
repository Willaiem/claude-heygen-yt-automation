import type { ResolvedSlide } from "@/lib/types";
import { ActionGridSlide } from "./ActionGridSlide";
import { BulletsSlide } from "./BulletsSlide";
import { DiagramSlide } from "./DiagramSlide";
import { StatSlide } from "./StatSlide";
import { StepsSlide } from "./StepsSlide";
import { TitleSlide } from "./TitleSlide";
import { WarningGridSlide } from "./WarningGridSlide";

interface Props {
  slide: ResolvedSlide;
}

export function SlideRenderer({ slide }: Props) {
  const durationInFrames = Math.max(1, slide.endFrame - slide.startFrame);
  const paths = slide.resolvedImagePaths ?? [];

  switch (slide.type) {
    case "title":
      return (
        <TitleSlide
          text={slide.text}
          subtitle={slide.subtitle}
          durationInFrames={durationInFrames}
        />
      );
    case "bullets":
      return (
        <BulletsSlide
          heading={slide.heading}
          bullets={slide.bullets}
          durationInFrames={durationInFrames}
        />
      );
    case "stat":
      return (
        <StatSlide
          value={slide.value}
          label={slide.label}
          durationInFrames={durationInFrames}
        />
      );
    case "diagram":
      return (
        <DiagramSlide
          title={slide.title}
          subtitle={slide.subtitle}
          imageSrc={paths[0]}
          callouts={slide.callouts}
          bottomCaption={slide.bottomCaption}
          durationInFrames={durationInFrames}
        />
      );
    case "steps":
      return (
        <StepsSlide
          title={slide.title}
          subtitle={slide.subtitle}
          steps={slide.steps.map((step, index) => ({
            label: step.label,
            caption: step.caption,
            imageSrc: paths[index],
          }))}
          footerCaption={slide.footerCaption}
          durationInFrames={durationInFrames}
        />
      );
    case "warning_grid":
      return (
        <WarningGridSlide
          title={slide.title}
          subtitle={slide.subtitle}
          panels={slide.panels.map((panel, index) => ({
            label: panel.label,
            caption: panel.caption,
            boldFooter: panel.boldFooter,
            imageSrc: paths[index],
          }))}
          footerBanner={slide.footerBanner}
          bottomCaption={slide.bottomCaption}
          durationInFrames={durationInFrames}
        />
      );
    case "action_grid":
      return (
        <ActionGridSlide
          title={slide.title}
          subtitle={slide.subtitle}
          actions={slide.actions.map((action, index) => ({
            number: action.number,
            label: action.label,
            description: action.description,
            imageSrc: paths[index],
          }))}
          bottomCaption={slide.bottomCaption}
          durationInFrames={durationInFrames}
        />
      );
  }
}
