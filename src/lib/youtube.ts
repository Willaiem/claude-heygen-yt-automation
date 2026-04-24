const ID = /([A-Za-z0-9_-]{11})/;

const PATTERNS: RegExp[] = [
  new RegExp(`(?:youtube\\.com\\/watch\\?(?:[^#]*&)?v=)${ID.source}`),
  new RegExp(`(?:youtu\\.be\\/)${ID.source}`),
  new RegExp(`(?:youtube\\.com\\/shorts\\/)${ID.source}`),
  new RegExp(`(?:youtube\\.com\\/embed\\/)${ID.source}`),
  new RegExp(`(?:youtube\\.com\\/live\\/)${ID.source}`),
];

export function parseYouTubeUrl(input: string): string {
  const trimmed = input.trim();
  for (const pattern of PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  throw new Error(`Could not parse YouTube video id from: ${input}`);
}
