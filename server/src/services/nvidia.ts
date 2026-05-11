import OpenAI from "openai";

export const MODEL = "meta/llama-4-maverick-17b-128e-instruct";

function getClient(): OpenAI {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY environment variable is not set");
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1",
  });
}

// Standard two-message call (system + user)
export interface NvidiaCallOptions {
  maxTokens?: number;
}

export async function callNvidia(
  systemPrompt: string,
  userPrompt: string,
  fullMessages?: Array<{ role: string; content: string }>,
  options?: NvidiaCallOptions
): Promise<string> {
  const client = getClient();

  const messages = fullMessages
    ? fullMessages.map(m => ({ role: m.role as any, content: m.content }))
    : [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userPrompt },
      ];

  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: options?.maxTokens ?? 4096,
  });
  return response.choices[0]?.message?.content || "";
}

// ─── Model Health Check ──────────────────────────────────────────────────────
// Sends a minimal 1-token request to verify the model is live.
// Returns a status object — never throws.
export interface ModelHealthResult {
  ok: boolean;
  model: string;
  latencyMs: number | null;
  error: string | null;
  checkedAt: string;
}

export async function checkModelHealth(): Promise<ModelHealthResult> {
  const checkedAt = new Date().toISOString();

  if (!process.env.NVIDIA_API_KEY) {
    return { ok: false, model: MODEL, latencyMs: null, error: "NVIDIA_API_KEY not set", checkedAt };
  }

  const start = Date.now();
  try {
    const client = getClient();
    await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 1,
    });
    return { ok: true, model: MODEL, latencyMs: Date.now() - start, error: null, checkedAt };
  } catch (err: any) {
    const status = err?.status ?? err?.statusCode ?? null;
    const msg =
      status === 410
        ? `Model "${MODEL}" has been removed from NVIDIA NIM (410 Gone). Update MODEL in nvidia.ts.`
        : status === 401
        ? "NVIDIA_API_KEY is invalid or expired."
        : status === 429
        ? "NVIDIA API rate limit hit during health check."
        : err?.message ?? "Unknown error";
    return { ok: false, model: MODEL, latencyMs: Date.now() - start, error: msg, checkedAt };
  }
}

// Run on startup — logs clearly so Render logs show the issue immediately
export async function runStartupHealthCheck(): Promise<void> {
  console.log(`[health] Checking NVIDIA NIM model: ${MODEL} ...`);
  const result = await checkModelHealth();
  if (result.ok) {
    console.log(`[health] ✓ Model OK — ${result.latencyMs}ms`);
  } else {
    console.error(`[health] ✗ Model UNAVAILABLE — ${result.error}`);
  }
}
