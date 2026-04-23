"use client";

import { useRef, useState } from "react";

interface Props {
  onUploaded: (path: string | null) => void;
}

export function FaceUploader({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-face", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { path } = await res.json();
      onUploaded(path);
    } catch {
      setPreview(null);
      onUploaded(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-400">Face Image</label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:border-blue-500 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : preview ? "Change" : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {preview && (
        <img
          src={preview}
          alt="Face preview"
          className="h-10 w-10 rounded-full border border-zinc-700 object-cover"
        />
      )}
    </div>
  );
}
