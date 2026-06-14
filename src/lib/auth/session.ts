import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

export interface ClientSessionSnapshot {
  session: Session | null;
  user: User | null;
  sessionExists: boolean;
  userIdExists: boolean;
  source: "getSession" | "signIn" | "none";
  errorMessage: string | null;
}

/** Prefer getSession for client-side gates — does not hit the auth server. */
export async function readClientSession(
  supabase: SupabaseClient
): Promise<ClientSessionSnapshot> {
  const { data, error } = await supabase.auth.getSession();
  const session = data.session ?? null;
  const user = session?.user ?? null;
  return {
    session,
    user,
    sessionExists: session !== null,
    userIdExists: Boolean(user?.id),
    source: "getSession",
    errorMessage: error?.message ?? null,
  };
}

/** True when a key belongs to Supabase auth storage — never purge these. */
export function isSupabaseAuthStorageKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.startsWith("sb-") ||
    lower.startsWith("supabase") ||
    lower.includes("supabase.auth")
  );
}

export function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  if (next.startsWith("/login") || next.startsWith("/signup")) return null;
  return next;
}

export function resolvePostAuthPath(input: {
  onboardingComplete: boolean;
  next: string | null;
}): string {
  if (!input.onboardingComplete) return "/onboarding";
  const next = safeNextPath(input.next);
  return next ?? "/dashboard";
}
