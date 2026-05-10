import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export const MODEL = "meta/llama-4-scout-17b-16e-instruct";

export async function callNvidia(systemPrompt: string, userPrompt: string, jsonMode = true): Promise<string> {
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

export default client;
