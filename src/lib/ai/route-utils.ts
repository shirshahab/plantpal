import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AIApiResponse } from "@/lib/types/ai";

import {
  FRIENDLY_ANALYSIS_FAILED,
  FRIENDLY_PAYLOAD_TOO_LARGE,
} from "@/lib/ai/messages";

export { FRIENDLY_ANALYSIS_FAILED, FRIENDLY_PAYLOAD_TOO_LARGE };

export function aiSuccess<T>(data: T, saved: boolean) {
  return NextResponse.json({ ok: true, data, saved } satisfies AIApiResponse<T>);
}

export function aiError(message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: message } satisfies AIApiResponse<never>,
    { status }
  );
}

export async function getAuthUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export function requireString(
  obj: Record<string, unknown>,
  key: string
): string | null {
  const val = obj[key];
  if (typeof val !== "string" || !val.trim()) return null;
  return val.trim();
}

export function optionalString(
  obj: Record<string, unknown>,
  key: string
): string | undefined {
  const val = obj[key];
  return typeof val === "string" ? val.trim() : undefined;
}

export function stringArray(obj: Record<string, unknown>, key: string): string[] {
  const val = obj[key];
  if (!Array.isArray(val)) return [];
  return val.filter((x): x is string => typeof x === "string");
}

function openAiErrorShape(error: unknown): {
  status?: number;
  headers?: Record<string, string>;
  bodyPreview: string;
} | null {
  if (!error || typeof error !== "object") return null;
  const err = error as {
    status?: number;
    headers?: Record<string, string> | Headers;
    message?: string;
    error?: { message?: string };
  };
  if (typeof err.status !== "number") return null;
  const headers =
    err.headers instanceof Headers
      ? Object.fromEntries(err.headers.entries())
      : err.headers;
  const bodyPreview = err.message ?? err.error?.message ?? String(error);
  return { status: err.status, headers, bodyPreview: bodyPreview.slice(0, 200) };
}

/** Server-side log when vision / identification fails. */
export function logAnalysisFailure(
  routeLabel: string,
  error: unknown,
  context: { payloadBytes?: number } = {}
): "vercel" | "openai" | "unknown" {
  const openAi = openAiErrorShape(error);
  if (openAi) {
    console.error(`[${routeLabel}] OpenAI rejected request`, {
      payloadBytes: context.payloadBytes,
      status: openAi.status,
      headers: openAi.headers ?? {},
      bodyPreview: openAi.bodyPreview,
      rejectionSource: "openai",
    });
    return "openai";
  }

  const message = error instanceof Error ? error.message : String(error);
  const rejectionSource = /request entity too large/i.test(message)
    ? "vercel"
    : /openai|vision|api key|rate limit|429|413/i.test(message)
      ? "openai"
      : "unknown";

  console.error(`[${routeLabel}] analysis failed`, {
    payloadBytes: context.payloadBytes,
    message: message.slice(0, 200),
    rejectionSource,
  });
  return rejectionSource;
}
