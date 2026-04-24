import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, extname, isAbsolute, relative, resolve } from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OUTPUT_DIR = resolve(process.cwd(), "output");

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(request: NextRequest): Promise<Response> {
  const requested = request.nextUrl.searchParams.get("path");
  if (!requested) return new Response("path required", { status: 400 });

  const absolute = resolve(requested);
  const rel = relative(OUTPUT_DIR, absolute);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    return new Response("forbidden", { status: 403 });
  }

  let size: number;
  try {
    const stats = await stat(absolute);
    if (!stats.isFile()) {
      return new Response("not a file", { status: 400 });
    }
    size = stats.size;
  } catch {
    return new Response("not found", { status: 404 });
  }

  const contentType =
    CONTENT_TYPES[extname(absolute).toLowerCase()] ?? "application/octet-stream";
  const forceDownload = request.nextUrl.searchParams.get("download") === "1";

  const webStream = Readable.toWeb(
    createReadStream(absolute),
  ) as unknown as WebReadableStream<Uint8Array>;

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Length": size.toString(),
    "Cache-Control": "no-store",
  };
  if (forceDownload) {
    headers["Content-Disposition"] = `attachment; filename="${basename(absolute)}"`;
  }

  return new Response(webStream as unknown as BodyInit, { headers });
}
