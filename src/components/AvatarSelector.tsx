"use client";

import { useEffect, useState } from "react";
import type { HeyGenAvatar } from "@/lib/types";

interface Props {
  selected: HeyGenAvatar | null;
  onSelect: (avatar: HeyGenAvatar | null) => void;
}

export function AvatarSelector({ selected, onSelect }: Props) {
  const [avatars, setAvatars] = useState<HeyGenAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/avatars")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch avatars");
        return r.json();
      })
      .then((data: HeyGenAvatar[]) => {
        setAvatars(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-400">Avatar</label>
      <select
        className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
        value={selected?.avatar_id ?? ""}
        onChange={(e) => {
          const avatar = avatars.find((a) => a.avatar_id === e.target.value);
          onSelect(avatar ?? null);
        }}
        disabled={loading}
      >
        <option value="">
          {loading ? "Loading..." : error ? "Error loading" : "Select avatar"}
        </option>
        {avatars.map((a) => (
          <option key={a.avatar_id} value={a.avatar_id}>
            {a.avatar_name}
          </option>
        ))}
      </select>
    </div>
  );
}
