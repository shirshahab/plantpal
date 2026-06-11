"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadUserProfile } from "@/lib/profile/user-profile";

interface DebugState {
  session: boolean;
  userId: string | null;
  profileRow: "yes" | "no" | "error" | "n/a";
  onboardingComplete: boolean;
  mode: "cloud" | "local";
}

/**
 * Development-only auth state readout. Renders nothing in production.
 * Shows: session detected, user id, cloud profile row, onboarding flag, mode.
 */
export function AuthDebug() {
  const [state, setState] = useState<DebugState | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    let cancelled = false;

    async function read() {
      const configured = isSupabaseConfigured();
      const local = loadUserProfile();

      if (!configured) {
        if (!cancelled) {
          setState({
            session: false,
            userId: null,
            profileRow: "n/a",
            onboardingComplete: local.onboardingComplete,
            mode: "local",
          });
        }
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let profileRow: DebugState["profileRow"] = "n/a";
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();
        profileRow = error ? (error.code === "PGRST116" ? "no" : "error") : data ? "yes" : "no";
      }

      if (!cancelled) {
        setState({
          session: !!user,
          userId: user?.id ?? null,
          profileRow,
          onboardingComplete: loadUserProfile().onboardingComplete,
          mode: "cloud",
        });
      }
    }

    void read();
    const interval = setInterval(() => void read(), 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (process.env.NODE_ENV !== "development" || !state) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-32 left-2 z-[90] rounded-full bg-gray-900/80 text-white text-[10px] px-2 py-1"
      >
        auth
      </button>
    );
  }

  const Row = ({ label, ok, value }: { label: string; ok: boolean; value?: string }) => (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className={ok ? "text-green-400" : "text-red-400"}>
        {value ?? (ok ? "yes" : "no")}
      </span>
    </div>
  );

  return (
    <div className="fixed bottom-32 left-2 z-[90] rounded-xl bg-gray-900/90 text-white text-[10px] font-mono px-3 py-2 space-y-1 w-48 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-300">AUTH DEBUG (dev)</span>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400">
          ×
        </button>
      </div>
      <Row label="session" ok={state.session} />
      <Row label="user id" ok={!!state.userId} value={state.userId ? state.userId.slice(0, 8) : "none"} />
      <Row
        label="profile row"
        ok={state.profileRow === "yes"}
        value={state.profileRow}
      />
      <Row label="onboarded" ok={state.onboardingComplete} />
      <Row label="mode" ok={state.mode === "cloud"} value={state.mode} />
    </div>
  );
}
