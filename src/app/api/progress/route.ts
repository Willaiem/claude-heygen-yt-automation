import type { NextRequest } from "next/server";

import { getQueue, type QueueListener } from "@/lib/queue";
import type { SSEEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  const batchId = request.nextUrl.searchParams.get("batchId");
  if (!batchId) {
    return new Response("batchId required", { status: 400 });
  }

  const queue = getQueue();
  const batch = queue.getBatch(batchId);
  if (!batch) {
    return new Response("batch not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (ev: SSEEvent) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(ev)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      for (const job of batch.jobs) {
        send({ type: "job_update", batchId, jobId: job.id, data: job });
      }

      const listener: QueueListener = (ev) => {
        if (ev.batchId !== batchId) return;
        send(ev);
        if (ev.type === "batch_complete" && !closed) {
          closed = true;
          queue.unsubscribe(listener);
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      };
      queue.subscribe(listener);

      request.signal.addEventListener("abort", () => {
        if (closed) return;
        closed = true;
        queue.unsubscribe(listener);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
