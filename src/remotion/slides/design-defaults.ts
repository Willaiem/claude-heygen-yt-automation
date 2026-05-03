import type {
  ActionGridSlideProps,
} from "./ActionGridSlide";
import type { BulletsSlideProps } from "./BulletsSlide";
import type { DiagramSlideProps } from "./DiagramSlide";
import type { StatSlideProps } from "./StatSlide";
import type { StepsSlideProps } from "./StepsSlide";
import type { TitleSlideProps } from "./TitleSlide";
import type { WarningGridSlideProps } from "./WarningGridSlide";

const STUDIO_SLIDE_FRAMES = 150;

export const titleDefaults: TitleSlideProps = {
  text: "Heart Attack Warning Signs",
  subtitle: "Don't ignore these symptoms",
  durationInFrames: STUDIO_SLIDE_FRAMES,
};

export const bulletsDefaults: BulletsSlideProps = {
  heading: "Top causes",
  bullets: [
    "Sustained high blood pressure",
    "Untreated cholesterol levels",
    "Family history of cardiac events",
    "Chronic stress and poor sleep",
  ],
  durationInFrames: STUDIO_SLIDE_FRAMES,
};

export const statDefaults: StatSlideProps = {
  value: "697K",
  label: "Heart attack deaths in the U.S. each year",
  durationInFrames: STUDIO_SLIDE_FRAMES,
};

export const diagramDefaults: DiagramSlideProps = {
  title: "Where the pain shows up",
  subtitle: "Common heart-attack pain referral zones",
  imageSrc: undefined,
  callouts: [
    { text: "Jaw / left arm", position: "top-left" },
    { text: "Center chest pressure", position: "top-right" },
    { text: "Upper back", position: "bottom-left" },
    { text: "Stomach / nausea", position: "bottom-right" },
  ],
  bottomCaption: "Pain often radiates — not just chest.",
  durationInFrames: STUDIO_SLIDE_FRAMES,
};

export const stepsDefaults: StepsSlideProps = {
  title: "If you suspect a heart attack",
  subtitle: "Three steps in the first 5 minutes",
  steps: [
    { label: "Call 911", caption: "Don't drive yourself", imageSrc: undefined },
    {
      label: "Chew aspirin",
      caption: "If not allergic, 325 mg",
      imageSrc: undefined,
    },
    {
      label: "Stay calm",
      caption: "Sit down, slow your breathing",
      imageSrc: undefined,
    },
  ],
  footerCaption: "Time is heart muscle. Act fast.",
  durationInFrames: STUDIO_SLIDE_FRAMES,
};

export const warningGridDefaults: WarningGridSlideProps = {
  title: "Four signs to never ignore",
  panels: [
    {
      label: "Crushing chest pressure",
      caption: "Lasts more than a few minutes",
      boldFooter: "Not just sharp pain",
      imageSrc: undefined,
    },
    {
      label: "Shortness of breath",
      caption: "Even while sitting still",
      imageSrc: undefined,
    },
    {
      label: "Cold sweats",
      caption: "Sudden, with no exertion",
      imageSrc: undefined,
    },
    {
      label: "Nausea or dizziness",
      caption: "Especially if combined with above",
      imageSrc: undefined,
    },
  ],
  footerBanner: "Call emergency services immediately",
  durationInFrames: STUDIO_SLIDE_FRAMES,
};

export const actionGridDefaults: ActionGridSlideProps = {
  title: "Five habits that protect your heart",
  actions: [
    {
      number: 1,
      label: "Move daily",
      description: "30 minutes brisk walking",
      imageSrc: undefined,
    },
    {
      number: 2,
      label: "Eat whole foods",
      description: "Less ultra-processed",
      imageSrc: undefined,
    },
    {
      number: 3,
      label: "Sleep 7-8 hours",
      description: "Consistent schedule",
      imageSrc: undefined,
    },
    {
      number: 4,
      label: "Manage stress",
      description: "Breathing, breaks, hobbies",
      imageSrc: undefined,
    },
    {
      number: 5,
      label: "Annual check-ups",
      description: "Know your numbers",
      imageSrc: undefined,
    },
  ],
  bottomCaption: "Small habits, compounded over years.",
  durationInFrames: STUDIO_SLIDE_FRAMES,
};
