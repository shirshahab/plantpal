import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type DbClient = SupabaseClient;

export function getDb(): DbClient {
  return createClient();
}

export function canUseSupabase(userId: string | undefined | null): userId is string {
  return isSupabaseConfigured() && !!userId;
}

export interface DbResult<T> {
  data: T;
  error: string | null;
}

export async function safeDb<T>(
  fn: () => Promise<{ data: T; error: { message: string } | null }>
): Promise<DbResult<T>> {
  try {
    const { data, error } = await fn();
    if (error) return { data: null as T, error: error.message };
    return { data, error: null };
  } catch (e) {
    return {
      data: null as T,
      error: e instanceof Error ? e.message : "Database error",
    };
  }
}
