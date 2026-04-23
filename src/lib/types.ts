// ── Pipeline step identifiers ──────────────────────────────────────
export type PipelineStep =
  | "queued"
  | "fetching_transcript"
  | "fetching_thumbnail"
  | "generating_script"
  | "splitting_scenes"
  | "submitting_heygen"
  | "polling_heygen"
  | "downloading_video"
  | "generating_thumbnail"
  | "completed"
  | "failed";

// ── Job ────────────────────────────────────────────────────────────
export interface Job {
  id: string;
  url: string;
  videoId: string;
  step: PipelineStep;
  progress: number; // 0-100
  error?: string;

  // Outputs — populated as pipeline progresses
  transcript?: string;
  script?: string;
  title?: string;
  description?: string;
  tags?: string[];
  scenes?: string[];
  heygenVideoId?: string;
  videoPath?: string;
  thumbnailPath?: string;
  competitorThumbPath?: string;
}

// ── Batch (one "Generate" click) ───────────────────────────────────
export interface Batch {
  id: string;
  avatarId: string;
  voiceId: string;
  niche: string;
  faceImagePath?: string;
  jobs: Job[];
  createdAt: number;
}

// ── HeyGen types ───────────────────────────────────────────────────
export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url: string;
  voice_id?: string;
}

// ── Niche config ───────────────────────────────────────────────────
export interface NicheConfig {
  id: string;
  name: string;
  promptTone: string;
  defaultTags: string[];
}

// ── SSE event ──────────────────────────────────────────────────────
export interface SSEEvent {
  type: "job_update" | "batch_complete" | "error";
  batchId: string;
  jobId?: string;
  data: Partial<Job>;
}

// ── API payloads ───────────────────────────────────────────────────
export interface GenerateRequest {
  urls: string[];
  avatarId: string;
  voiceId: string;
  niche: string;
  faceImagePath?: string;
}

export interface GenerateResponse {
  batchId: string;
  jobs: Pick<Job, "id" | "url" | "videoId" | "step">[];
}
