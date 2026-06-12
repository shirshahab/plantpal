"use client";

/**
 * Cloud <-> local profile sync.
 *
 * The auth session lives in Supabase cookies, but onboarding state is gated
 * by localStorage (plantpal-user-profile). These helpers keep the two in
 * sync on EVERY sign-in path (password login, email confirmation, refresh,
 * middleware redirect), not just the login form submit.
 */

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  loadUserProfile,
  saveUserProfile,
} from "@/lib/profile/user-profile";
import type { UserProfile } from "@/lib/types/profile";

export interface CloudProfileSnapshot {
  /** "local" = Supabase not configured, "no-user" = no session. */
  status: "local" | "no-user" | "ok" | "error";
  userId?: string;
  /** True when a profiles row exists for this user. */
  profileExists?: boolean;
  onboardingComplete?: boolean;
  /** Where the onboarding flag came from after hydration. */
  onboardingSource?: "cloud" | "local" | "none";
  error?: string;
}

interface CloudProfileRow {
  onboarding_complete: boolean | null;
  zip_code: string | null;
  experience_level: string | null;
  main_goal: string | null;
  grow_types: string[] | null;
  email: string | null;
}

/** "No rows" from .single() is expected when the signup trigger missed. */
const NO_ROWS_CODE = "PGRST116";

/**
 * Pull the cloud profile into localStorage. If the cloud says onboarding is
 * done, the local flag is set so guards stop sending the user to onboarding.
 * If the LOCAL profile says onboarding is done but the cloud doesn't, the
 * local state is pushed up instead (heals an earlier failed sync).
 *
 * Returns a snapshot instead of swallowing errors.
 */
export async function hydrateProfileFromCloud(): Promise<CloudProfileSnapshot> {
  if (!isSupabaseConfigured()) return { status: "local" };

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { status: "no-user" };

    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_complete, zip_code, experience_level, main_goal, grow_types, email")
      .eq("id", user.id)
      .single<CloudProfileRow>();

    if (error && error.code !== NO_ROWS_CODE) {
      return { status: "error", userId: user.id, error: error.message };
    }

    // Self-heal: if the signup trigger missed (no row) or left email empty,
    // write the minimal identity row now. Without it this user is invisible
    // to friend search by email.
    if (!data || !data.email) {
      const { error: healError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? null,
          ...(user.user_metadata?.full_name
            ? { full_name: user.user_metadata.full_name as string }
            : {}),
        },
        { onConflict: "id" }
      );
      if (healError) {
        console.warn("[profile] identity self-heal failed:", healError.message);
      }
    }

    const local = loadUserProfile();

    if (data?.onboarding_complete) {
      // Cloud wins: restore onboarding state for this browser.
      saveUserProfile({
        onboardingComplete: true,
        ...(typeof data.zip_code === "string" && data.zip_code
          ? { zipCode: data.zip_code }
          : {}),
        ...(data.experience_level
          ? { experienceLevel: data.experience_level as UserProfile["experienceLevel"] }
          : {}),
        ...(data.main_goal
          ? { mainGoal: data.main_goal as UserProfile["mainGoal"] }
          : {}),
        ...(Array.isArray(data.grow_types)
          ? { growTypes: data.grow_types as UserProfile["growTypes"] }
          : {}),
      });
      return {
        status: "ok",
        userId: user.id,
        profileExists: true,
        onboardingComplete: true,
        onboardingSource: "cloud",
      };
    }

    if (local.onboardingComplete) {
      // Local wins only when cloud has not recorded completion yet.
      await syncProfileToCloud({
        zipCode: local.zipCode,
        experienceLevel: local.experienceLevel,
        mainGoal: local.mainGoal,
        growTypes: local.growTypes,
      });
      return {
        status: "ok",
        userId: user.id,
        profileExists: data !== null,
        onboardingComplete: true,
        onboardingSource: "local",
      };
    }

    return {
      status: "ok",
      userId: user.id,
      profileExists: data !== null,
      onboardingComplete: false,
      onboardingSource: "none",
    };
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Profile hydration failed",
    };
  }
}

export interface SyncProfileInput {
  zipCode: string;
  experienceLevel: UserProfile["experienceLevel"];
  mainGoal: UserProfile["mainGoal"];
  growTypes: UserProfile["growTypes"];
}

export interface SyncProfileResult {
  ok: boolean;
  /** "skipped" when Supabase isn't configured or there is no session. */
  skipped?: "not-configured" | "no-user";
  error?: string;
}

/**
 * Write onboarding answers + completion to the cloud profile.
 * Upserts so a missing profiles row (failed signup trigger) is created
 * instead of silently updating zero rows.
 */
export async function syncProfileToCloud(
  input: SyncProfileInput
): Promise<SyncProfileResult> {
  if (!isSupabaseConfigured()) return { ok: true, skipped: "not-configured" };

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: true, skipped: "no-user" };

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        zip_code: input.zipCode.trim(),
        experience_level: input.experienceLevel,
        main_goal: input.mainGoal,
        grow_types: input.growTypes,
        onboarding_complete: true,
        onboarding_completed_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Profile save failed",
    };
  }
}
