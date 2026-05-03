import { z } from "zod";

export const PipelineStepSchema = z.enum([
  "queued",
  "fetching_transcript",
  "fetching_thumbnail",
  "generating_script",
  "splitting_scenes",
  "submitting_heygen",
  "polling_heygen",
  "downloading_video",
  "generating_thumbnail",
  "planning_slides",
  "generating_slide_images",
  "resolving_slide_timing",
  "editing",
  "completed",
  "slides_failed",
  "editing_failed",
  "failed",
]);
export type PipelineStep = z.infer<typeof PipelineStepSchema>;

export const WordTimestampSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
});
export type WordTimestamp = z.infer<typeof WordTimestampSchema>;

const SlideEndSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("phrase"), phrase: z.string() }),
  z.object({ kind: z.literal("hold"), seconds: z.number() }),
]);
export type SlideEnd = z.infer<typeof SlideEndSchema>;

const SlideBaseSchema = z.object({
  id: z.string(),
  startPhrase: z.string(),
  end: SlideEndSchema,
  layout: z.enum(["pip", "cover"]).optional(),
});

const CalloutPositionSchema = z.enum([
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "left",
  "right",
  "top",
  "bottom",
]);
export type CalloutPosition = z.infer<typeof CalloutPositionSchema>;

const CalloutSchema = z.object({
  text: z.string(),
  position: CalloutPositionSchema,
});

export const TitleSlideSchema = SlideBaseSchema.extend({
  type: z.literal("title"),
  text: z.string(),
  subtitle: z.string().optional(),
});

export const BulletsSlideSchema = SlideBaseSchema.extend({
  type: z.literal("bullets"),
  heading: z.string().optional(),
  bullets: z.array(z.string()).min(1).max(5),
});

export const StatSlideSchema = SlideBaseSchema.extend({
  type: z.literal("stat"),
  value: z.string(),
  label: z.string(),
});

export const DiagramSlideSchema = SlideBaseSchema.extend({
  type: z.literal("diagram"),
  title: z.string(),
  subtitle: z.string().optional(),
  imagePrompt: z.string(),
  callouts: z.array(CalloutSchema),
  bottomCaption: z.string().optional(),
});

export const StepsSlideSchema = SlideBaseSchema.extend({
  type: z.literal("steps"),
  title: z.string(),
  subtitle: z.string().optional(),
  steps: z
    .array(
      z.object({
        imagePrompt: z.string(),
        label: z.string(),
        caption: z.string(),
      }),
    )
    .length(3),
  footerCaption: z.string().optional(),
});

export const WarningGridSlideSchema = SlideBaseSchema.extend({
  type: z.literal("warning_grid"),
  title: z.string(),
  subtitle: z.string().optional(),
  panels: z
    .array(
      z.object({
        imagePrompt: z.string(),
        label: z.string(),
        caption: z.string(),
        boldFooter: z.string().optional(),
      }),
    )
    .length(4),
  footerBanner: z.string().optional(),
  bottomCaption: z.string().optional(),
});

export const ActionGridSlideSchema = SlideBaseSchema.extend({
  type: z.literal("action_grid"),
  title: z.string(),
  subtitle: z.string().optional(),
  actions: z
    .array(
      z.object({
        number: z.number(),
        imagePrompt: z.string(),
        label: z.string(),
        description: z.string(),
      }),
    )
    .min(5)
    .max(6),
  bottomCaption: z.string().optional(),
});

export const SlideSchema = z.discriminatedUnion("type", [
  TitleSlideSchema,
  BulletsSlideSchema,
  StatSlideSchema,
  DiagramSlideSchema,
  StepsSlideSchema,
  WarningGridSlideSchema,
  ActionGridSlideSchema,
]);
export type Slide = z.infer<typeof SlideSchema>;
export type SlideType = Slide["type"];

export const SlidePlanSchema = z.object({
  scenes: z.array(
    z.object({
      sceneIndex: z.number(),
      slides: z.array(SlideSchema).max(8),
    }),
  ),
});
export type SlidePlan = z.infer<typeof SlidePlanSchema>;

const resolvedSlideFields = {
  startFrame: z.number(),
  endFrame: z.number(),
  layout: z.enum(["pip", "cover"]),
  resolvedImagePaths: z.array(z.string()).optional(),
} as const;

export const ResolvedSlideSchema = z.discriminatedUnion("type", [
  TitleSlideSchema.extend(resolvedSlideFields),
  BulletsSlideSchema.extend(resolvedSlideFields),
  StatSlideSchema.extend(resolvedSlideFields),
  DiagramSlideSchema.extend(resolvedSlideFields),
  StepsSlideSchema.extend(resolvedSlideFields),
  WarningGridSlideSchema.extend(resolvedSlideFields),
  ActionGridSlideSchema.extend(resolvedSlideFields),
]);
export type ResolvedSlide = z.infer<typeof ResolvedSlideSchema>;

export const JobRenderPropsSchema = z.object({
  scenes: z.array(
    z.object({
      videoUrl: z.string(),
      durationSec: z.number(),
      slides: z.array(ResolvedSlideSchema),
    }),
  ),
});
export type JobRenderProps = z.infer<typeof JobRenderPropsSchema>;

export const JobSchema = z.object({
  id: z.string(),
  url: z.string(),
  videoId: z.string(),
  step: PipelineStepSchema,
  progress: z.number(), // 0-100
  error: z.string().optional(),
  editError: z.string().optional(),

  transcript: z.string().optional(),
  script: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  scenes: z.array(z.string()).optional(),
  sceneWords: z.array(z.array(WordTimestampSchema)).optional(),
  heygenVideoIds: z.array(z.string()).optional(),
  videoPaths: z.array(z.string()).optional(),
  thumbnailPath: z.string().optional(),
  competitorThumbPath: z.string().optional(),
  competitorThumbUrl: z.string().optional(),
  slidePlan: SlidePlanSchema.optional(),
  slideImagePaths: z.array(z.array(z.string())).optional(),
  finalVideoPath: z.string().optional(),
});
export type Job = z.infer<typeof JobSchema>;

export const BatchSchema = z.object({
  id: z.string(),
  avatarId: z.string(),
  voiceId: z.string(),
  niche: z.string(),
  faceImageUrl: z.string().optional(),
  jobs: z.array(JobSchema),
  createdAt: z.number(),
});
export type Batch = z.infer<typeof BatchSchema>;

export const HeyGenAvatarGroupSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    preview_image: z.string().nullish(),
    default_voice_id: z.string().nullish(),
    photo_identity_s3_url: z.string().nullish(),
  })
  .transform((group) => ({
    avatarId: group.id,
    avatarName: group.name,
    previewImageUrl: group.preview_image ?? "",
    voiceId: group.default_voice_id ?? undefined,
    faceImageUrl: group.photo_identity_s3_url ?? undefined,
  }));

export type HeyGenAvatar = z.infer<typeof HeyGenAvatarGroupSchema>;

export const HeyGenAvatarListResponseSchema = z.object({
  code: z.number(),
  data: z
    .object({
      avatar_groups: z.array(HeyGenAvatarGroupSchema),
    })
    .nullish(),
  msg: z.string().nullish(),
  message: z.string().nullish(),
});

export const NicheConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  promptTone: z.string(),
  defaultTags: z.array(z.string()),
});
export type NicheConfig = z.infer<typeof NicheConfigSchema>;

export const SSEEventSchema = z.object({
  type: z.enum(["job_update", "batch_complete", "error"]),
  batchId: z.string(),
  jobId: z.string().optional(),
  data: JobSchema.partial(),
});
export type SSEEvent = z.infer<typeof SSEEventSchema>;

export const GenerateRequestSchema = z.object({
  urls: z.array(z.string()),
  avatarId: z.string(),
  voiceId: z.string(),
  niche: z.string(),
  faceImageUrl: z.string().optional(),
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const GenerateResponseSchema = z.object({
  batchId: z.string(),
  jobs: z.array(
    JobSchema.pick({ id: true, url: true, videoId: true, step: true }),
  ),
});
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
