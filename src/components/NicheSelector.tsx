"use client";

const NICHES = [
  { id: "health", name: "Health" },
  { id: "politics", name: "Politics" },
];

interface Props {
  selected: string;
  onSelect: (niche: string) => void;
}

export function NicheSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-400">Niche</label>
      <select
        className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
      >
        {NICHES.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name}
          </option>
        ))}
      </select>
    </div>
  );
}
