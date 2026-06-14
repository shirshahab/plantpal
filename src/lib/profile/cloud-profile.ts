"use client";

/**
 * Cloud <-> local profile sync.
 * Onboarding completion is scoped per user via plantpal-onboarding:{userId}.
 */

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  loadUserProfile,
  saveUserProfile,
  ensureProfileForUser,
} from "@/lib/profile/user-profile";
import {
  isOnboardingCompleteForUser,
  markUserOnboardingComplete,
} from "@/lib/auth/onboarding-state";
import { traceAuthEvent } from "@/lib/auth/lifecycle-trace";
import type { UserProfile } from "@/lib/types/profile";

export interface CloudProfileSnapshot {
  status: "local" | "no-user" | "ok" | "error";
  userId?: string;
  profileExists?: boolean;
  onboardingComplete?: boolean;
  onboardingSource?: "cloud" | "scoped-local" | "none";
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

const NO_ROWS_CODE = "PGRST116";

function scopedLocalOnboardingComplete(userId: string): boolean {
  const profile = loadUserProfile();
  if (profile.ownerUserId !== userId) return isOnboardingCompleteForUser(userId);
  return isOnboardingCompleteForUser(userId) || profile.onboardingComplete === true;
}

export async function hydrateProfileFromCloud(): Promise<CloudProfileSnapshot> {
  if (!isSupabaseConfigured()) return { status: "local" };

  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return { status: "no-user" };

    ensureProfileForUser(user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_complete, zip_code, experience_level, main_goal, grow_types, email")
      .eq("id", user.id)
      .single<CloudProfileRow>();

    if (error && error.code !== NO_ROWS_CODE) {
      console.warn("[profile] cloud read failed:", error.message);
      const onboardingComplete = scopedLocalOnboardingComplete(user.id);
      traceAuthEvent({
        event: "PROFILE_LOADED",
        hasSession: true,
        userId: user.id,
        onboardingComplete,
        reason: `cloud read failed: ${error.message}`,
      });
      return {
        status: "ok",
        userId: user.id,
        profileExists: false,
        onboardingComplete,
        onboardingSource: onboardingComplete ? "scoped-local" : "none",
        error: error.message,
      };
    }

    if (!data) {
      const { error: createError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? null,
          ...(user.user_metadata?.full_name
            ? { full_name: user.user_metadata.full_name as string }
            : {}),
        },
        { onConflict: "id" }
      );
      if (createError) {
        console.warn("[profile] profile create failed:", createError.message);
      } else {
        traceAuthEvent({
          event: "PROFILE_CREATED",
          hasSession: true,
          userId: user.id,
          onboardingComplete: false,
          reason: "missing profiles row",
        });
      }
    } else if (!data.email) {
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

    if (data?.onboarding_complete) {
      markUserOnboardingComplete(user.id);
      saveUserProfile({
        ownerUserId: user.id,
        onboardingComplete: true,
        ...(typeof data.zip_code === "string" && data.zip_code
          ? { zipCode: data.zip_code }
          : {}),
        ...(data.experience_level
          ? { experienceLevel: data.experience_level as UserProfile["experienceLevel"] }
          : {}),
        ...(data.main_goal ? { mainGoal: data.main_goal as UserProfile["mainGoal"] } : {}),
        ...(Array.isArray(data.grow_types)
          ? { growTypes: data.grow_types as UserProfile["growTypes"] }
          : {}),
      });
      traceAuthEvent({
        event: "PROFILE_LOADED",
        hasSession: true,
        userId: user.id,
        onboardingComplete: true,
        reason: "cloud onboarding complete",
      });
      return {
        status: "ok",
        userId: user.id,
        profileExists: true,
        onboardingComplete: true,
        onboardingSource: "cloud",
      };
    }

    const localComplete = scopedLocalOnboardingComplete(user.id);
    const local = loadUserProfile();

    if (localComplete && local.ownerUserId === user.id && local.onboardingComplete) {
      await syncProfileToCloud({
        zipCode: local.zipCode,
        experienceLevel: local.experienceLevel,
        mainGoal: local.mainGoal,
        growTypes: local.growTypes,
      });
      traceAuthEvent({
        event: "PROFILE_LOADED",
        hasSession: true,
        userId: user.id,
        onboardingComplete: true,
        reason: "scoped local synced to cloud",
      });
      return {
        status: "ok",
        userId: user.id,
        profileExists: data !== null,
        onboardingComplete: true,
        onboardingSource: "scoped-local",
      };
    }

    traceAuthEvent({
      event: "ONBOARDING_STATUS",
      hasSession: true,
      userId: user.id,
      onboardingComplete: false,
      reason: "incomplete",
    });

    return {
      status: "ok",
      userId: user.id,
      profileExists: data !== null,
      onboardingComplete: false,
      onboardingSource: "none",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Profile hydration failed";
    console.warn("[profile] hydration error:", message);
    return {
      status: "ok",
      onboardingComplete: false,
      onboardingSource: "none",
      error: message,
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
  skipped?: "not-configured" | "no-user";
  error?: string;
}

export async function syncProfileToCloud(
  input: SyncProfileInput
): Promise<SyncProfileResult> {
  if (!isSupabaseConfigured()) return { ok: true, skipped: "not-configured" };

  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
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

    markUserOnboardingComplete(user.id);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Profile save failed",
    };
  }
}
