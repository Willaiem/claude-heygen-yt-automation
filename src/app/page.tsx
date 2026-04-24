"use client";

import { useState } from "react";
import { AvatarSelector } from "@/components/AvatarSelector";
import { NicheSelector } from "@/components/NicheSelector";
import { UrlInput } from "@/components/UrlInput";
import { ResultsTable } from "@/components/ResultsTable";
import type { HeyGenAvatar, Job } from "@/lib/types";

export default function Home() {
  const [selectedAvatar, setSelectedAvatar] = useState<HeyGenAvatar | null>(
    null,
  );
  const [selectedNiche, setSelectedNiche] = useState("health");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (urls: string[]) => {
    if (!selectedAvatar || urls.length === 0) return;
    setIsGenerating(true);
    // TODO(phase 5): call generate() action, subscribe to SSE progress
    setIsGenerating(false);
  };

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
          disabled={!selectedAvatar || isGenerating}
        />
      </section>

      <section>
        <ResultsTable jobs={jobs} />
      </section>
    </main>
  );
}
