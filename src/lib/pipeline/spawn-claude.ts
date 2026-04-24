import { spawn } from "node:child_process";
import { z } from "zod";

const ClaudeCliOutputSchema = z.object({
  type: z.string().optional(),
  subtype: z.string().optional(),
  is_error: z.boolean().optional(),
  result: z.string().optional(),
});

export const ClaudeScriptSchema = z.object({
  script: z.string().min(1),
  title: z.string().min(1),
  tags: z.array(z.string()),
  description: z.string().min(1),
});
export type ClaudeScript = z.infer<typeof ClaudeScriptSchema>;

export async function spawnClaude(prompt: string): Promise<ClaudeScript> {
  const raw = await runCli(prompt);
  const inner = extractInner(raw);
  const stripped = stripFences(inner);
  try {
    return ClaudeScriptSchema.parse(JSON.parse(stripped));
  } catch (e) {
    throw new Error(
      `Failed to parse Claude output as ClaudeScript: ${(e as Error).message}\n--- first 500 chars ---\n${stripped.slice(0, 500)}`,
    );
  }
}

function runCli(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // shell:true lets Windows resolve `claude.cmd` via PATH.
    const proc = spawn("claude", ["-p", "--output-format", "json"], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`claude CLI exited ${code}: ${stderr.trim()}`));
        return;
      }
      resolve(stdout);
    });

    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

function extractInner(raw: string): string {
  const trimmed = raw.trim();
  try {
    const parsed = ClaudeCliOutputSchema.parse(JSON.parse(trimmed));
    if (parsed.is_error) {
      throw new Error(`Claude CLI reported error: ${parsed.result ?? "unknown"}`);
    }
    if (parsed.result) return parsed.result;
  } catch {
    // Not the CLI wrapper — fall through and treat the stdout as the payload itself.
  }
  return trimmed;
}

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/, "")
    .trim();
}
