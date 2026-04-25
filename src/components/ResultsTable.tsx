"use client";

import { useEffect, useRef, useState } from "react";
import type { Job, PipelineStep } from "@/lib/types";

interface Props {
  jobs: Job[];
  onRetry?: (jobId: string) => void;
  retryingIds?: Set<string>;
}

const STEP_LABELS: Record<PipelineStep, string> = {
  queued: "Queued",
  fetching_transcript: "Fetching transcript",
  fetching_thumbnail: "Fetching thumbnail",
  generating_script: "Generating script",
  splitting_scenes: "Splitting scenes",
  submitting_heygen: "Submitting to HeyGen",
  polling_heygen: "Rendering video",
  downloading_video: "Downloading video",
  generating_thumbnail: "Generating thumbnail",
  completed: "Completed",
  failed: "Failed",
};

export function ResultsTable({ jobs, onRetry, retryingIds }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`${label} copied`);
    } catch {
      setToast(`Failed to copy ${label.toLowerCase()}`);
    }
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 1500);
  };

  if (jobs.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No jobs yet. Paste URLs above and click Generate.
      </p>
    );
  }

  return (
    <>
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900 text-xs text-zinc-400">
          <tr>
            <th className="px-4 py-3">Video</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Thumbnail</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-zinc-900/50">
              <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                {job.videoId}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs ${
                      job.step === "completed"
                        ? "text-green-400"
                        : job.step === "failed"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {job.step !== "completed" && job.step !== "failed" && (
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                    )}
                    {STEP_LABELS[job.step]}
                    {job.step !== "completed" &&
                      job.step !== "failed" &&
                      job.step !== "queued" && (
                        <span className="text-zinc-500">{job.progress}%</span>
                      )}
                  </span>
                  {job.step === "failed" && job.error && (
                    <span
                      className="max-w-xs truncate text-[10px] text-red-300/80"
                      title={job.error}
                    >
                      {job.error}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                {job.thumbnailPath ? (
                  <img
                    src={`/api/file?path=${encodeURIComponent(job.thumbnailPath)}`}
                    alt="Thumbnail"
                    className="h-12 w-20 rounded object-cover"
                  />
                ) : (
                  <span className="text-xs text-zinc-600">—</span>
                )}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-zinc-300">
                {job.title ?? "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {job.title && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(job.title!, "Title")}
                      className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                    >
                      Title
                    </button>
                  )}
                  {job.tags && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(job.tags!.join(", "), "Tags")}
                      className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                    >
                      Tags
                    </button>
                  )}
                  {job.description && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(job.description!, "Description")}
                      className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                    >
                      Desc
                    </button>
                  )}
                  {job.videoPaths?.[0] && (
                    <a
                      href={`/api/file?path=${encodeURIComponent(job.videoPaths[0])}&download=1`}
                      className="rounded border border-zinc-700 px-2 py-1 text-xs text-blue-400 hover:border-blue-500"
                    >
                      {job.videoPaths.length > 1
                        ? `Download (1/${job.videoPaths.length})`
                        : "Download"}
                    </a>
                  )}
                  {job.step === "failed" && onRetry && (
                    <button
                      type="button"
                      onClick={() => onRetry(job.id)}
                      disabled={retryingIds?.has(job.id)}
                      className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:border-red-400 disabled:opacity-50"
                    >
                      {retryingIds?.has(job.id) ? "Retrying…" : "Retry"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {toast && (
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-50 rounded-md border border-zinc-700 bg-zinc-900/95 px-4 py-2 text-sm text-zinc-100 shadow-lg"
      >
        {toast}
      </div>
    )}
    </>
  );
}
