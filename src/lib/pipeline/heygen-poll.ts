import { z } from "zod";

const DownloadQueueResponseSchema = z.object({
  code: z.number(),
  data: z
    .object({
      workflow_id: z.string(),
      status: z.string().nullish(),
      download_url: z.string().nullish(),
    })
    .nullish(),
  message: z.string().nullish(),
  msg: z.string().nullish(),
});

const DownloadStatusResponseSchema = z.object({
  code: z.number(),
  data: z
    .object({
      workflow_id: z.string(),
      status: z.enum(["SCHEDULED", "RUNNING", "COMPLETED", "FAILED"]),
      download_url: z.string().nullish(),
      error: z
        .union([
          z.null(),
          z.string(),
          z.object({ message: z.string().nullish() }),
        ])
        .nullish(),
    })
    .nullish(),
  message: z.string().nullish(),
  msg: z.string().nullish(),
});

interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
  onTick?: (videoId: string, status: string) => void;
}

export async function pollHeyGen(
  videoIds: string[],
  opts: PollOptions = {},
): Promise<string[]> {
  const cookie = process.env.HEYGEN_COOKIE;
  if (!cookie) {
    throw new Error("HEYGEN_COOKIE not configured in .env.local");
  }
  return Promise.all(videoIds.map((id) => pollOne(id, cookie, opts)));
}

async function pollOne(
  videoId: string,
  cookie: string,
  opts: PollOptions,
): Promise<string> {
  const workflowId = await queueDownload(videoId, cookie);
  const intervalMs = opts.intervalMs ?? 30_000;
  const timeoutMs = opts.timeoutMs ?? 30 * 60_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(
      `https://api2.heygen.com/v1/pacific/collaboration/video.download/status?workflow_id=${encodeURIComponent(workflowId)}`,
      { headers: { cookie }, cache: "no-store" },
    );
    if (!res.ok) {
      throw new Error(`HeyGen download status responded ${res.status}`);
    }
    const parsed = DownloadStatusResponseSchema.parse(await res.json());
    const data = parsed.data;
    if (!data) {
      throw new Error(
        `HeyGen download status missing data: ${parsed.message ?? parsed.msg ?? ""}`,
      );
    }
    opts.onTick?.(videoId, data.status);

    if (data.status === "COMPLETED") {
      if (!data.download_url) {
        throw new Error("HeyGen download completed without download_url");
      }
      return data.download_url;
    }
    if (data.status === "FAILED") {
      const msg =
        typeof data.error === "string"
          ? data.error
          : (data.error?.message ?? "unknown");
      throw new Error(`HeyGen download failed: ${msg}`);
    }

    await sleep(intervalMs);
  }

  throw new Error(`HeyGen poll timed out for ${videoId} after ${timeoutMs}ms`);
}

async function queueDownload(
  videoId: string,
  cookie: string,
): Promise<string> {
  const res = await fetch(
    "https://api2.heygen.com/v1/pacific/collaboration/video.download",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({
        video_id: videoId,
        resolution: "1080p",
        resource_type: "heygen_video",
        with_captions: false,
      }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`HeyGen queue download responded ${res.status}`);
  }
  const parsed = DownloadQueueResponseSchema.parse(await res.json());
  if (parsed.code !== 100 || !parsed.data?.workflow_id) {
    throw new Error(
      `HeyGen queue download error: ${parsed.message ?? parsed.msg ?? `code ${parsed.code}`}`,
    );
  }
  return parsed.data.workflow_id;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
