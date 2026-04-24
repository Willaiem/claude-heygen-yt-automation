"use server";

import {
  HeyGenAvatarListResponseSchema,
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
