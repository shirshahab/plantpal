export const EXPECTED_PROJECT_REF = "fxmxkmqgxlhggqngsxja";

function parseEnvFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

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

/**
 * Dev-only fake auth bypass. Requires explicit opt-in:
 * NODE_ENV=development AND NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
 * Never enabled in production.
 */
export function isMockAuthEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return parseEnvFlag(process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH);
}

/** @deprecated Use isMockAuthEnabled — true only when dev mock auth flag is explicitly on. */
export function isMockMode(): boolean {
  return isMockAuthEnabled();
}

/** Throws during production builds if mock auth is enabled. */
export function assertProductionAuthConfig(): void {
  if (process.env.NODE_ENV === "production" && isMockAuthEnabled()) {
    throw new Error(
      "[auth] NEXT_PUBLIC_ENABLE_MOCK_AUTH must not be enabled in production"
    );
  }
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
