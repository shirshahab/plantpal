import Constants from "expo-constants";

function read(key: string): string {
  return (
    (Constants.expoConfig?.extra?.[key] as string | undefined) ??
    process.env[key] ??
    ""
  ).trim();
}

/** Next.js PlantPal deployment — all AI/weather routes live here. */
export function getApiBaseUrl(): string {
  const url =
    read("EXPO_PUBLIC_API_BASE_URL") ||
    read("EXPO_PUBLIC_API_URL") ||
    (Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL as string | undefined) ||
    (Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL as string | undefined) ||
    "";
  if (!url) {
    return __DEV__ ? "http://localhost:3000" : "https://getplantpal.com";
  }
  return url.replace(/\/$/, "");
}

export function getSupabaseConfig() {
  return {
    url: read("EXPO_PUBLIC_SUPABASE_URL"),
    anonKey: read("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return url.startsWith("https://") && anonKey.length > 20;
}

export const APP_SCHEME = "plantpal";
