"use client";

import { useEffect, useRef, useState } from "react";

import { SSEEventSchema, type Job } from "@/lib/types";

export interface UseSSEResult {
  jobs: Job[];
  isComplete: boolean;
}

export function useSSE(
  batchId: string | null,
  initialJobs: Job[],
): UseSSEResult {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [isComplete, setIsComplete] = useState(false);

  const initialJobsRef = useRef(initialJobs);
  initialJobsRef.current = initialJobs;

  useEffect(() => {
    if (!batchId) return;

    setJobs(initialJobsRef.current);
    setIsComplete(false);

    const source = new EventSource(
      `/api/progress?batchId=${encodeURIComponent(batchId)}`,
    );

    source.onmessage = (message) => {
      try {
        const event = SSEEventSchema.parse(JSON.parse(message.data));
        if (event.type === "job_update" && event.jobId) {
          const targetJobId = event.jobId;
          setJobs((prev) =>
            prev.map((job) =>
              job.id === targetJobId ? { ...job, ...event.data } : job,
            ),
          );
        } else if (event.type === "batch_complete") {
          setIsComplete(true);
          source.close();
        }
      } catch {
        // Ignore malformed events; the server is the source of truth.
      }
    };

    return () => source.close();
  }, [batchId]);

  return { jobs, isComplete };
}
