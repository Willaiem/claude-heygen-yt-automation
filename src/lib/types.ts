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
  "completed",
  "failed",
]);
export type PipelineStep = z.infer<typeof PipelineStepSchema>;

export const JobSchema = z.object({
  id: z.string(),
  url: z.string(),
  videoId: z.string(),
  step: PipelineStepSchema,
  progress: z.number(), // 0-100
  error: z.string().optional(),

  transcript: z.string().optional(),
  script: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  scenes: z.array(z.string()).optional(),
  heygenVideoIds: z.array(z.string()).optional(),
  videoPaths: z.array(z.string()).optional(),
  thumbnailPath: z.string().optional(),
  competitorThumbPath: z.string().optional(),
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
  .transform((g) => ({
    avatarId: g.id,
    avatarName: g.name,
    previewImageUrl: g.preview_image ?? "",
    voiceId: g.default_voice_id ?? undefined,
    faceImageUrl: g.photo_identity_s3_url ?? undefined,
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
