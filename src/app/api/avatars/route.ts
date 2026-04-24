import { NextResponse } from "next/server";
import type { HeyGenAvatar } from "@/lib/types";

// HeyGen signs preview/face URLs with an Expires query param (~7 days).
// A short TTL keeps the list snappy but well ahead of signature expiry.
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: HeyGenAvatar[];
  expiresAt: number;
}

const globalWithCache = globalThis as typeof globalThis & {
  __avatarsCache?: CacheEntry;
};

interface HeyGenAvatarGroup {
  id: string;
  name: string;
  preview_image: string | null;
  default_voice_id: string | null;
  photo_identity_s3_url: string | null;
}

interface HeyGenAvatarGroupListResponse {
  code: number;
  data?: {
    avatar_groups?: HeyGenAvatarGroup[];
  };
  msg?: string | null;
  message?: string | null;
}

export async function GET() {
  const cached = globalWithCache.__avatarsCache;
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const cookie = process.env.HEYGEN_COOKIE;
  if (!cookie) {
    return NextResponse.json(
      { error: "HEYGEN_COOKIE not configured in .env.local" },
      { status: 500 },
    );
  }

  let res: Response;
  try {
    res = await fetch(
      "https://api2.heygen.com/v2/avatar_group.private.list?limit=50&page=1",
      { headers: { cookie }, cache: "no-store" },
    );
  } catch (err) {
    return NextResponse.json(
      { error: `HeyGen request failed: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `HeyGen responded ${res.status}` },
      { status: 502 },
    );
  }

  const body = (await res.json()) as HeyGenAvatarGroupListResponse;
  if (body.code !== 100 || !body.data?.avatar_groups) {
    return NextResponse.json(
      { error: body.message ?? body.msg ?? "Unexpected HeyGen response" },
      { status: 502 },
    );
  }

  const avatars: HeyGenAvatar[] = body.data.avatar_groups.map((g) => ({
    avatar_id: g.id,
    avatar_name: g.name,
    preview_image_url: g.preview_image ?? "",
    voice_id: g.default_voice_id ?? undefined,
    face_image_url: g.photo_identity_s3_url ?? undefined,
  }));

  globalWithCache.__avatarsCache = {
    data: avatars,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return NextResponse.json(avatars);
}
