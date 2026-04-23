"use client";

import type { Job, PipelineStep } from "@/lib/types";

interface Props {
  jobs: Job[];
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

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export function ResultsTable({ jobs }: Props) {
  if (jobs.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No jobs yet. Paste URLs above and click Generate.
      </p>
    );
  }

  return (
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
                </span>
              </td>
              <td className="px-4 py-3">
                {job.thumbnailPath ? (
                  <img
                    src={job.thumbnailPath}
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
                      onClick={() => copyToClipboard(job.title!)}
                      className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                    >
                      Title
                    </button>
                  )}
                  {job.tags && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(job.tags!.join(", "))}
                      className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                    >
                      Tags
                    </button>
                  )}
                  {job.description && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(job.description!)}
                      className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                    >
                      Desc
                    </button>
                  )}
                  {job.videoPath && (
                    <a
                      href={`/api/download-video?path=${encodeURIComponent(job.videoPath)}`}
                      className="rounded border border-zinc-700 px-2 py-1 text-xs text-blue-400 hover:border-blue-500"
                    >
                      Download
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
