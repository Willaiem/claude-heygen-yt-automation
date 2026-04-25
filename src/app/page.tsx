"use client";

import { useState } from "react";

import { generate, resubmit } from "@/app/actions";
import { AvatarSelector } from "@/components/AvatarSelector";
import { NicheSelector } from "@/components/NicheSelector";
import { ResultsTable } from "@/components/ResultsTable";
import { UrlInput } from "@/components/UrlInput";
import { useSSE } from "@/hooks/useSSE";
import type { HeyGenAvatar, Job } from "@/lib/types";

export default function Home() {
  const [selectedAvatar, setSelectedAvatar] = useState<HeyGenAvatar | null>(
    null,
  );
  const [selectedNiche, setSelectedNiche] = useState("health");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [seedJobs, setSeedJobs] = useState<Job[]>([]);
  const [subscriptionKey, setSubscriptionKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const { jobs, isComplete } = useSSE(batchId, seedJobs, subscriptionKey);
  const isRunning = batchId !== null && !isComplete;

  const handleGenerate = async (urls: string[]) => {
    if (!selectedAvatar?.voiceId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await generate({
        urls,
        avatarId: selectedAvatar.avatarId,
        voiceId: selectedAvatar.voiceId,
        niche: selectedNiche,
        faceImageUrl: selectedAvatar.faceImageUrl,
      });
      const seeded: Job[] = response.jobs.map((stub) => ({
        ...stub,
        progress: 0,
      }));
      setSeedJobs(seeded);
      setSubscriptionKey(0);
      setBatchId(response.batchId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    if (!batchId) return;
    setError(null);
    setRetryingIds((prev) => {
      const next = new Set(prev);
      next.add(jobId);
      return next;
    });
    try {
      await resubmit({ batchId, jobId });
      setSubscriptionKey((value) => value + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const canGenerate = Boolean(selectedAvatar?.voiceId);
  const generateLabel = isSubmitting
    ? "Submitting…"
    : isRunning
      ? "Running…"
      : "Generate";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold tracking-tight">
        YT Automation Pipeline
      </h1>

      <section className="mb-8 flex flex-wrap items-end gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <AvatarSelector
          selected={selectedAvatar}
          onSelect={setSelectedAvatar}
        />
        <NicheSelector selected={selectedNiche} onSelect={setSelectedNiche} />
      </section>

      <section className="mb-8">
        <UrlInput
          onGenerate={handleGenerate}
          disabled={!canGenerate || isSubmitting || isRunning}
          label={generateLabel}
        />
        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
      </section>

      <section>
        <ResultsTable
          jobs={jobs}
          onRetry={handleRetry}
          retryingIds={retryingIds}
        />
      </section>
    </main>
  );
}
