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
  subscriptionKey: number = 0,
): UseSSEResult {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [isComplete, setIsComplete] = useState(false);

  const initialJobsRef = useRef(initialJobs);
  initialJobsRef.current = initialJobs;

  useEffect(() => {
    if (!batchId) return;

    // On a fresh batch, replace seed jobs entirely.
    // On reconnect (subscriptionKey bump for the same batch), keep the live jobs
    // and let the server's snapshot re-send each job's current state.
    if (subscriptionKey === 0) {
      setJobs(initialJobsRef.current);
    }
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
  }, [batchId, subscriptionKey]);

  return { jobs, isComplete };
}
