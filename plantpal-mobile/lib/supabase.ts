import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig, isSupabaseConfigured } from "./config";
import { secureStorage } from "./secure-storage";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    const { url, anonKey } = getSupabaseConfig();
    client = createClient(url, anonKey, {
      auth: {
        storage: secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
