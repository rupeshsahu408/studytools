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

export async function callNvidia(systemPrompt: string, userPrompt: string, jsonMode = true): Promise<string> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 8000,
  });
  return response.choices[0]?.message?.content || "";
}
