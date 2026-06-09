export const EXPECTED_PROJECT_REF = "fxmxkmqgxlhggqngsxja";

/** Returns true when Supabase env vars are set and look valid. */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !key) return false;
  if (url.includes("paste_") || key.includes("paste_")) return false;
  if (!url.startsWith("https://") || !url.includes("supabase")) return false;
  if (key.length < 20) return false;

  return true;
}

/** True when running without Supabase — uses localStorage + mock data. */
export function isMockMode(): boolean {
  return !isSupabaseConfigured();
}

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  return { url, key };
}

export function getProjectRefFromUrl(url: string): string | null {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

/** Safe preview for UI — never expose the full key. */
export function maskAnonKey(key: string): string {
  if (!key) return "(missing)";
  if (key.length <= 16) return `${key.slice(0, 4)}…`;
  return `${key.slice(0, 16)}… (${key.length} chars)`;
}
