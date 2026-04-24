"use server";

import { getQueue } from "@/lib/queue";
import {
  GenerateRequestSchema,
  HeyGenAvatarListResponseSchema,
  type GenerateRequest,
  type GenerateResponse,
  type HeyGenAvatar,
} from "@/lib/types";

// Signed HeyGen URLs expire after ~7 days — TTL must stay well below that.
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: HeyGenAvatar[];
  expiresAt: number;
}

const globalWithCache = globalThis as typeof globalThis & {
  __avatarsCache?: CacheEntry;
};

export async function getAvatars(): Promise<HeyGenAvatar[]> {
  const cached = globalWithCache.__avatarsCache;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const cookie = process.env.HEYGEN_COOKIE;
  if (!cookie) {
    throw new Error("HEYGEN_COOKIE not configured in .env.local");
  }

  const res = await fetch(
    "https://api2.heygen.com/v2/avatar_group.private.list?limit=50&page=1",
    { headers: { cookie }, cache: "no-store" },
  );

  if (!res.ok) {
    throw new Error(`HeyGen responded ${res.status}`);
  }

  const body = HeyGenAvatarListResponseSchema.parse(await res.json());
  if (body.code !== 100 || !body.data?.avatar_groups) {
    throw new Error(body.message ?? body.msg ?? "Unexpected HeyGen response");
  }

  const avatars = body.data.avatar_groups;

  globalWithCache.__avatarsCache = {
    data: avatars,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return avatars;
}

export async function generate(
  input: GenerateRequest,
): Promise<GenerateResponse> {
  const parsed = GenerateRequestSchema.parse(input);
  if (parsed.urls.length === 0) {
    throw new Error("generate: urls is empty");
  }

  const queue = getQueue();
  const batch = queue.createBatch({
    avatarId: parsed.avatarId,
    voiceId: parsed.voiceId,
    niche: parsed.niche,
    faceImageUrl: parsed.faceImageUrl,
    urls: parsed.urls,
  });
  queue.startBatch(batch.id);

  return {
    batchId: batch.id,
    jobs: batch.jobs.map((job) => ({
      id: job.id,
      url: job.url,
      videoId: job.videoId,
      step: job.step,
    })),
  };
}
