import buildInfoJson from "./build-info.generated.json";

export interface BuildInfo {
  commit: string;
  branch: string;
  builtAt: string;
  version: string;
  build: {
    supabaseUrlConfigured: boolean;
    supabaseAnonKeyConfigured: boolean;
    vercelEnv: string | null;
  };
}

/** Build-time metadata (git commit, branch, timestamp). */
export function getBuildInfo(): BuildInfo {
  return buildInfoJson as BuildInfo;
}

/** Runtime env presence — no secret values. */
export function getRuntimeAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  return {
    supabaseUrlConfigured: Boolean(url && url.startsWith("https://") && url.includes("supabase")),
    supabaseAnonKeyConfigured: Boolean(anonKey && anonKey.length >= 20 && !anonKey.includes("paste_")),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  };
}
