"use client";

import { useState } from "react";

import { generate } from "@/app/actions";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { jobs, isComplete } = useSSE(batchId, seedJobs);
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
      setBatchId(response.batchId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGenerate = Boolean(selectedAvatar?.voiceId);

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
        />
        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
      </section>

      <section>
        <ResultsTable jobs={jobs} />
      </section>
    </main>
  );
}
