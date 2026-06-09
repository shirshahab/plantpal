import OpenAI from "openai";
import { isOpenAIKeyConfigured, getOpenAIKey } from "@/lib/integrations/env-config";

import { redactSecrets } from "./redact-secrets";

export const OPENAI_VISION_MODEL = "gpt-4o-mini";
const LOG = "[openai]";

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

function logVisionRequest(imageCount: number, detail: string): void {
  console.info(`${LOG} vision request`, {
    model: OPENAI_VISION_MODEL,
    imageCount,
    detail,
  });
}

export async function chatJSON<T>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: OPENAI_VISION_MODEL,
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

  logVisionRequest(urls.length, detail);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]!;
    const valid = /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(
      url.replace(/\s/g, "")
    );
    if (!valid) {
      console.error(`${LOG} invalid image data URL at index ${i}`, {
        prefix: url.slice(0, 40),
        length: url.length,
      });
      throw new Error(
        `Image encoding failed — image ${i + 1} is not a valid base64 data URL (jpg, png, webp).`
      );
    }
  }

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_VISION_MODEL,
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

    console.info(`${LOG} vision ok`, {
      model: OPENAI_VISION_MODEL,
      imageCount: urls.length,
      tokens: response.usage?.total_tokens ?? null,
    });

    return parseModelJson<T>(content);
  } catch (error) {
    const message = formatOpenAiError(error);
    console.error(`${LOG} vision failed`, {
      model: OPENAI_VISION_MODEL,
      imageCount: urls.length,
      error: message,
    });
    throw new Error(redactSecrets(message));
  }
}
