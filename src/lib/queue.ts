import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";

import { getNiche } from "@/lib/niches";
import { downloadVideo } from "@/lib/pipeline/download-video";
import { fetchCompetitorThumbnail } from "@/lib/pipeline/fetch-competitor-thumb";
import { fetchTranscript } from "@/lib/pipeline/fetch-transcript";
import { generateThumbnail } from "@/lib/pipeline/generate-thumbnail";
import { pollHeyGen } from "@/lib/pipeline/heygen-poll";
import { submitHeyGen } from "@/lib/pipeline/heygen-submit";
import {
  spawnClaude,
  type ClaudeScript,
} from "@/lib/pipeline/spawn-claude";
import { splitScenes } from "@/lib/pipeline/split-scenes";
import type {
  Batch,
  Job,
  NicheConfig,
  SSEEvent,
} from "@/lib/types";
import { parseYouTubeUrl } from "@/lib/youtube";

interface CreateBatchInput {
  avatarId: string;
  voiceId: string;
  niche: string;
  faceImageUrl?: string;
  urls: string[];
}

export type QueueListener = (event: SSEEvent) => void;

export class JobQueue extends EventEmitter {
  private batches = new Map<string, Batch>();
  // Shared chain that serializes Claude CLI spawns across all jobs.
  private claudeChain: Promise<unknown> = Promise.resolve();

  constructor() {
    super();
    this.setMaxListeners(0);
  }

  createBatch(input: CreateBatchInput): Batch {
    if (input.urls.length === 0) {
      throw new Error("createBatch: urls is empty");
    }
    const batch: Batch = {
      id: randomUUID(),
      avatarId: input.avatarId,
      voiceId: input.voiceId,
      niche: input.niche,
      faceImageUrl: input.faceImageUrl,
      jobs: input.urls.map((url) => ({
        id: randomUUID(),
        url,
        videoId: parseYouTubeUrl(url),
        step: "queued" as const,
        progress: 0,
      })),
      createdAt: Date.now(),
    };
    this.batches.set(batch.id, batch);
    return batch;
  }

  getBatch(batchId: string): Batch | undefined {
    return this.batches.get(batchId);
  }

  startBatch(batchId: string): void {
    const batch = this.batches.get(batchId);
    if (!batch) throw new Error(`Unknown batch: ${batchId}`);
    Promise.all(batch.jobs.map((job) => this.runJob(batch, job))).finally(() => {
      this.emitEvent({ type: "batch_complete", batchId: batch.id, data: {} });
    });
  }

  resubmitJob(batchId: string, jobId: string): void {
    const batch = this.batches.get(batchId);
    if (!batch) throw new Error(`Unknown batch: ${batchId}`);
    const job = batch.jobs.find((candidate) => candidate.id === jobId);
    if (!job) throw new Error(`Unknown job: ${jobId}`);
    job.step = "queued";
    job.progress = 0;
    job.error = undefined;
    this.emitJob(batchId, job);
    this.runJob(batch, job);
  }

  subscribe(listener: QueueListener): void {
    this.on("event", listener);
  }

  unsubscribe(listener: QueueListener): void {
    this.off("event", listener);
  }

  private async runJob(batch: Batch, job: Job): Promise<void> {
    const niche = getNiche(batch.niche);
    try {
      this.patch(batch.id, job.id, {
        step: "fetching_transcript",
        progress: 5,
      });
      const transcript = await fetchTranscript(job.videoId);
      this.patch(batch.id, job.id, { transcript });

      this.patch(batch.id, job.id, {
        step: "fetching_thumbnail",
        progress: 15,
      });
      const competitor = await fetchCompetitorThumbnail(job.videoId);
      this.patch(batch.id, job.id, {
        competitorThumbPath: competitor.path,
        competitorThumbUrl: competitor.url,
      });

      this.patch(batch.id, job.id, {
        step: "generating_script",
        progress: 25,
      });
      const script = await this.runClaudeSerial(buildClaudePrompt(transcript, niche));
      this.patch(batch.id, job.id, {
        script: script.script,
        title: script.title,
        tags: script.tags,
        description: script.description,
      });

      this.patch(batch.id, job.id, {
        step: "splitting_scenes",
        progress: 45,
      });
      const scenes = splitScenes(script.script);
      this.patch(batch.id, job.id, { scenes });

      this.patch(batch.id, job.id, {
        step: "submitting_heygen",
        progress: 55,
      });
      const heygenVideoIds = await submitHeyGen({
        scenes,
        avatarId: batch.avatarId,
        voiceId: batch.voiceId,
        title: script.title,
      });
      this.patch(batch.id, job.id, { heygenVideoIds });

      this.patch(batch.id, job.id, {
        step: "polling_heygen",
        progress: 65,
      });
      const downloadUrls = await pollHeyGen(heygenVideoIds);

      this.patch(batch.id, job.id, {
        step: "downloading_video",
        progress: 80,
      });
      const videoPaths = await Promise.all(
        downloadUrls.map((url, sceneIndex) =>
          downloadVideo(
            url,
            scenes.length > 1
              ? `${job.videoId}_${sceneIndex}`
              : job.videoId,
          ),
        ),
      );
      this.patch(batch.id, job.id, { videoPaths });

      if (batch.faceImageUrl) {
        this.patch(batch.id, job.id, {
          step: "generating_thumbnail",
          progress: 92,
        });
        const thumbnailPath = await generateThumbnail({
          videoId: job.videoId,
          title: script.title,
          faceImageUrl: batch.faceImageUrl,
          competitorThumbUrl: competitor.url,
        });
        this.patch(batch.id, job.id, { thumbnailPath });
      }

      this.patch(batch.id, job.id, { step: "completed", progress: 100 });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.patch(batch.id, job.id, { step: "failed", error: message });
    }
  }

  private runClaudeSerial(prompt: string): Promise<ClaudeScript> {
    const next = this.claudeChain.then(() => spawnClaude(prompt));
    // Swallow rejections on the chain itself so one failure doesn't poison
    // subsequent gated calls; the original promise still rejects to the caller.
    this.claudeChain = next.catch(() => undefined);
    return next;
  }

  private patch(batchId: string, jobId: string, patch: Partial<Job>): void {
    const batch = this.batches.get(batchId);
    if (!batch) return;
    const job = batch.jobs.find((candidate) => candidate.id === jobId);
    if (!job) return;
    Object.assign(job, patch);
    this.emitJob(batchId, job);
  }

  private emitJob(batchId: string, job: Job): void {
    this.emitEvent({
      type: "job_update",
      batchId,
      jobId: job.id,
      data: job,
    });
  }

  private emitEvent(ev: SSEEvent): void {
    this.emit("event", ev);
  }
}

function buildClaudePrompt(transcript: string, niche: NicheConfig): string {
  return [
    "You are a YouTube scriptwriter. Rewrite the source transcript below into an ORIGINAL script for our channel — same topic, different structure, fresh angles, added commentary. Do not copy phrasing.",
    "",
    `Niche voice: ${niche.promptTone}`,
    "",
    "Requirements:",
    "- Script length: ~15,000 characters (soft target; 12,000–18,000 acceptable).",
    "- Plain narration only — no speaker labels, no stage directions, no markdown.",
    "- Title: catchy YouTube title, ≤70 chars.",
    `- Tags: 8–15 relevant tags. Seed with these niche defaults where they fit: ${niche.defaultTags.join(", ")}.`,
    "- Description: 150–300 word YouTube description with a hook and a soft CTA.",
    "",
    'Output format: a single JSON object with exactly these keys: { "script", "title", "tags", "description" }.',
    "- script: string",
    "- title: string",
    "- tags: string[]",
    "- description: string",
    "Return ONLY the JSON object. No markdown fences, no prose before or after.",
    "",
    "--- SOURCE TRANSCRIPT ---",
    transcript,
  ].join("\n");
}

const globalWithQueue = globalThis as typeof globalThis & {
  __jobQueue?: JobQueue;
};

export function getQueue(): JobQueue {
  if (!globalWithQueue.__jobQueue) {
    globalWithQueue.__jobQueue = new JobQueue();
  }
  return globalWithQueue.__jobQueue;
}
