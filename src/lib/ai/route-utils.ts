import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AIApiResponse } from "@/lib/types/ai";

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
