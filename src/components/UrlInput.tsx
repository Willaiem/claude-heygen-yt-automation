"use client";

import { useState } from "react";

interface Props {
  onGenerate: (urls: string[]) => void;
  disabled: boolean;
}

export function UrlInput({ onGenerate, disabled }: Props) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const urls = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (urls.length > 0) {
      onGenerate(urls);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-zinc-400">
        YouTube URLs (one per line)
      </label>
      <textarea
        className="h-32 w-full resize-y rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-blue-500"
        placeholder={"https://youtube.com/watch?v=...\nhttps://youtu.be/..."}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || text.trim().length === 0}
        className="self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600"
      >
        Generate
      </button>
    </div>
  );
}
