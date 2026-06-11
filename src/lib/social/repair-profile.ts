/**
 * Profile repair: ensures every auth user has a searchable profiles row.
 *
 * Runs on login (client) and during friend search (server). If auth.users
 * exists but profiles is missing or has a NULL email, we upsert the row
 * from auth metadata so friend search works immediately.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface ProfileRepairResult {
  ok: boolean;
  repaired: boolean;
  profileExists: boolean;
  error?: string;
}

/** Client-side repair for the signed-in user. Call on every login. */
export async function repairProfileOnLogin(): Promise<ProfileRepairResult> {
  if (!isSupabaseConfigured()) {
    return { ok: true, repaired: false, profileExists: false };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: true, repaired: false, profileExists: false };

    const { data: existing } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const needsRepair =
      !existing || !existing.email || existing.email.trim() === "";

    if (!needsRepair) {
      return { ok: true, repaired: false, profileExists: true };
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          existing?.full_name ??
          null,
      },
      { onConflict: "id" }
    );

    if (error) {
      return { ok: false, repaired: false, profileExists: Boolean(existing), error: error.message };
    }

    return { ok: true, repaired: true, profileExists: true };
  } catch (err) {
    return {
      ok: false,
      repaired: false,
      profileExists: false,
      error: err instanceof Error ? err.message : "Profile repair failed",
    };
  }
}

/**
 * Server-side repair using service role. Used when friend search finds no
 * profile for an email that exists in auth.users.
 */
export async function repairProfileByUserId(userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return false;

  try {
    const admin = createSupabaseClient(url, key, { auth: { persistSession: false } });
    const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(userId);
    if (authErr || !authUser.user) return false;

    const u = authUser.user;
    const { error } = await admin.from("profiles").upsert(
      {
        id: u.id,
        email: u.email ?? null,
        full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
      },
      { onConflict: "id" }
    );
    return !error;
  } catch {
    return false;
  }
}

/** Derive a display username from email or name (profiles has no username col yet). */
export function deriveUsername(
  email: string | null | undefined,
  fullName: string | null | undefined
): string {
  if (fullName?.trim()) {
    return fullName.trim().toLowerCase().replace(/\s+/g, ".");
  }
  if (email) {
    return email.split("@")[0].toLowerCase();
  }
  return "gardener";
}
