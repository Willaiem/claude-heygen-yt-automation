import { z } from "zod";

const TtsChunkSchema = z.object({
  audio_url: z.string().nullish(),
  sequence_number: z.number(),
  duration: z.number().nullish(),
  word_timestamps: z
    .array(
      z.object({
        word: z.string(),
        start: z.number(),
        end: z.number(),
      }),
    )
    .nullish(),
});
type TtsChunk = z.infer<typeof TtsChunkSchema>;

const PrivateSubmitResponseSchema = z.object({
  code: z.number(),
  data: z.object({ video_id: z.string() }).nullish(),
  msg: z.string().nullish(),
  message: z.string().nullish(),
});

interface SubmitParams {
  scenes: string[];
  avatarId: string;
  voiceId: string;
  title?: string;
}

export async function submitHeyGen(params: SubmitParams): Promise<string[]> {
  const cookie = process.env.HEYGEN_COOKIE;
  if (!cookie) {
    throw new Error("HEYGEN_COOKIE not configured in .env.local");
  }
  if (params.scenes.length === 0) {
    throw new Error("submitHeyGen: scenes array is empty");
  }

  const videoIds: string[] = [];
  for (let i = 0; i < params.scenes.length; i++) {
    const scene = params.scenes[i];
    const audio = await generateTts(scene, params.voiceId, cookie);
    const videoId = await submitShortcut({
      cookie,
      scene,
      audio,
      avatarId: params.avatarId,
      voiceId: params.voiceId,
      title:
        params.scenes.length > 1
          ? `${params.title ?? "Avatar Video"} (${i + 1}/${params.scenes.length})`
          : (params.title ?? "Avatar Video"),
    });
    videoIds.push(videoId);
  }
  return videoIds;
}

interface TtsResult {
  audioUrl: string;
  duration: number;
  words: Array<{ word: string; start: number; end: number }>;
}

async function generateTts(
  text: string,
  voiceId: string,
  cookie: string,
): Promise<TtsResult> {
  const ssml = buildSsml(text, voiceId);
  const res = await fetch(
    "https://api2.heygen.com/v2/online/text_to_speech.stream",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({
        text_type: "ssml",
        text: ssml,
        voice_id: voiceId,
        settings: {
          voice_engine_settings: {
            engine_type: "elevenLabsV3",
            stability: 1,
          },
        },
        voice_engine: "elevenLabsV3",
      }),
    },
  );
  if (!res.ok || !res.body) {
    throw new Error(`HeyGen TTS responded ${res.status}: ${await res.text()}`);
  }

  const chunks = await readNdjson(res.body, TtsChunkSchema);
  const finalChunk = chunks.find((c) => c.sequence_number === -1);
  if (!finalChunk?.audio_url) {
    throw new Error("HeyGen TTS stream did not yield a final audio_url");
  }
  const duration =
    finalChunk.duration ??
    chunks.reduce((acc, c) => Math.max(acc, c.duration ?? 0), 0);

  const words = chunks
    .flatMap((c) => c.word_timestamps ?? [])
    .filter((w) => w.word !== "<end>")
    .map((w) => ({ word: w.word, start: w.start, end: w.end }));

  return { audioUrl: finalChunk.audio_url, duration, words };
}

interface SubmitShortcutParams {
  cookie: string;
  scene: string;
  audio: TtsResult;
  avatarId: string;
  voiceId: string;
  title: string;
}

async function submitShortcut(p: SubmitShortcutParams): Promise<string> {
  const body = {
    video_title: p.title,
    video_orientation: "landscape",
    resolution: "720p",
    avatar_id: p.avatarId,
    source_type: "avatar_video_shortcut_modal",
    fit: "cover",
    audio_data: {
      audio_type: "tts",
      audio_url: p.audio.audioUrl,
      duration: p.audio.duration,
      words: [
        { word: "<start>", start_time: 0, end_time: 0 },
        ...p.audio.words.map((w) => ({
          word: w.word,
          start_time: w.start,
          end_time: w.end,
        })),
        {
          word: "<end>",
          start_time: p.audio.duration,
          end_time: p.audio.duration,
        },
      ],
      text: p.scene,
      voice_id: p.voiceId,
    },
    avatar_settings: {
      use_avatar_iv_model: false,
      use_unlimited_mode: true,
    },
    enable_caption: false,
    create_new_avatar: false,
  };

  const res = await fetch(
    "https://api2.heygen.com/v2/avatar/shortcut/submit",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: p.cookie },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(
      `HeyGen submit responded ${res.status}: ${await res.text()}`,
    );
  }
  const parsed = PrivateSubmitResponseSchema.parse(await res.json());
  if (parsed.code !== 100 || !parsed.data?.video_id) {
    throw new Error(
      `HeyGen submit error: ${parsed.message ?? parsed.msg ?? `code ${parsed.code}`}`,
    );
  }
  return parsed.data.video_id;
}

function buildSsml(text: string, voiceId: string): string {
  return `<speak><voice name="${escapeXml(voiceId)}"><prosody rate="1" pitch="0%">${escapeXml(text)}</prosody></voice></speak>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function readNdjson<T>(
  stream: ReadableStream<Uint8Array>,
  schema: z.ZodType<T>,
): Promise<T[]> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const out: T[] = [];
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) out.push(schema.parse(JSON.parse(line)));
    }
  }
  if (buffer.trim()) out.push(schema.parse(JSON.parse(buffer.trim())));
  return out;
}
