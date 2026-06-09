import OpenAI from "openai";
import { isOpenAIKeyConfigured, getOpenAIKey } from "@/lib/integrations/env-config";

export function isOpenAIConfigured(): boolean {
  return isOpenAIKeyConfigured();
}

export function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: getOpenAIKey() });
}

function parseModelJson<T>(content: string): T {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) return JSON.parse(fenced[1]!.trim()) as T;
    throw new Error(`OpenAI returned invalid JSON: ${trimmed.slice(0, 200)}`);
  }
}

function formatOpenAiError(error: unknown): string {
  if (error && typeof error === "object") {
    const err = error as { status?: number; message?: string; error?: { message?: string } };
    const msg = err.message ?? err.error?.message;
    if (err.status && msg) return `OpenAI HTTP ${err.status}: ${msg}`;
    if (msg) return msg;
  }
  return error instanceof Error ? error.message : String(error);
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

  return parseModelJson<T>(content);
}

/** Vision analysis — one or more base64 data URLs. */
export async function visionJSON<T>(
  systemPrompt: string,
  userText: string,
  imageDataUrl: string | string[],
  options?: { detail?: "low" | "high" | "auto" }
): Promise<T> {
  const urls = Array.isArray(imageDataUrl) ? imageDataUrl : [imageDataUrl];
  const client = getOpenAIClient();
  const detail = options?.detail ?? "low";

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            ...urls.map((url) => ({
              type: "image_url" as const,
              image_url: { url, detail },
            })),
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.35,
      max_tokens: 1600,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty vision response from OpenAI");

    return parseModelJson<T>(content);
  } catch (error) {
    throw new Error(formatOpenAiError(error));
  }
}
