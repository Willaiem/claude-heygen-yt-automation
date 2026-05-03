import "./index.css";
import { Composition, Folder } from "remotion";

import {
  JobComposition,
  calculateJobCompositionMetadata,
} from "./compositions/JobComposition";
import { sampleJobRenderProps } from "./fixtures/sample-job";
import { ActionGridSlide } from "./slides/ActionGridSlide";
import { BulletsSlide } from "./slides/BulletsSlide";
import { DiagramSlide } from "./slides/DiagramSlide";
import { StatSlide } from "./slides/StatSlide";
import { StepsSlide } from "./slides/StepsSlide";
import { TitleSlide } from "./slides/TitleSlide";
import { WarningGridSlide } from "./slides/WarningGridSlide";
import {
  actionGridDefaults,
  bulletsDefaults,
  diagramDefaults,
  statDefaults,
  stepsDefaults,
  titleDefaults,
  warningGridDefaults,
} from "./slides/design-defaults";
import { theme } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="JobComposition"
        component={JobComposition}
        durationInFrames={1}
        fps={theme.fps}
        width={theme.width}
        height={theme.height}
        defaultProps={sampleJobRenderProps}
        calculateMetadata={calculateJobCompositionMetadata}
      />
      <Composition
        id="JobPreview"
        component={JobComposition}
        durationInFrames={1}
        fps={theme.fps}
        width={theme.width}
        height={theme.height}
        defaultProps={sampleJobRenderProps}
        calculateMetadata={calculateJobCompositionMetadata}
      />
      <Folder name="SlideDesigns">
        <Composition
          id="TitleSlideDesign"
          component={TitleSlide}
          durationInFrames={titleDefaults.durationInFrames}
          fps={theme.fps}
          width={theme.width}
          height={theme.height}
          defaultProps={titleDefaults}
        />
        <Composition
          id="BulletsSlideDesign"
          component={BulletsSlide}
          durationInFrames={bulletsDefaults.durationInFrames}
          fps={theme.fps}
          width={theme.width}
          height={theme.height}
          defaultProps={bulletsDefaults}
        />
        <Composition
          id="StatSlideDesign"
          component={StatSlide}
          durationInFrames={statDefaults.durationInFrames}
          fps={theme.fps}
          width={theme.width}
          height={theme.height}
          defaultProps={statDefaults}
        />
        <Composition
          id="DiagramSlideDesign"
          component={DiagramSlide}
          durationInFrames={diagramDefaults.durationInFrames}
          fps={theme.fps}
          width={theme.width}
          height={theme.height}
          defaultProps={diagramDefaults}
        />
        <Composition
          id="StepsSlideDesign"
          component={StepsSlide}
          durationInFrames={stepsDefaults.durationInFrames}
          fps={theme.fps}
          width={theme.width}
          height={theme.height}
          defaultProps={stepsDefaults}
        />
        <Composition
          id="WarningGridSlideDesign"
          component={WarningGridSlide}
          durationInFrames={warningGridDefaults.durationInFrames}
          fps={theme.fps}
          width={theme.width}
          height={theme.height}
          defaultProps={warningGridDefaults}
        />
        <Composition
          id="ActionGridSlideDesign"
          component={ActionGridSlide}
          durationInFrames={actionGridDefaults.durationInFrames}
          fps={theme.fps}
          width={theme.width}
          height={theme.height}
          defaultProps={actionGridDefaults}
        />
      </Folder>
    </>
  );
};
