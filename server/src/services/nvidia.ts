import OpenAI from "openai";

export const MODEL = "meta/llama-4-scout-17b-16e-instruct";

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
export async function callNvidia(
  systemPrompt: string,
  userPrompt: string,
  fullMessages?: Array<{ role: string; content: string }>
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
    max_tokens: 8000,
  });
  return response.choices[0]?.message?.content || "";
}
