import OpenAI from "openai";

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim() ?? "";
  return key.length > 10 && !key.includes("paste_");
}

export function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function chatJSON<T>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.35,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");

  return JSON.parse(content) as T;
}

/** Vision analysis — image as base64 data URL or public URL. */
export async function visionJSON<T>(
  systemPrompt: string,
  userText: string,
  imageDataUrl: string
): Promise<T> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: imageDataUrl, detail: "low" } },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.35,
    max_tokens: 1400,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty vision response from OpenAI");

  return JSON.parse(content) as T;
}
