"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { useOptionalAuth } from "@/lib/store/auth-provider";
import { readClientSession } from "@/lib/auth/session";
import { resolveOnboardingCompleteForUser } from "@/lib/auth/onboarding-state";
import {
  getAuthTraceLog,
  getAuthTraceMeta,
  isAuthDebugEnabled,
} from "@/lib/auth/lifecycle-trace";

interface DebugPanelState {
  sessionExists: boolean;
  userEmail: string | null;
  authLoading: boolean;
  onboardingComplete: boolean;
  redirectTarget: string;
  lastAuthError: string | null;
  ownerUserId: string | null;
}

function computeRedirectTarget(input: {
  sessionExists: boolean;
  onboardingComplete: boolean;
}): string {
  if (!input.sessionExists) return "/login";
  if (!input.onboardingComplete) return "/onboarding";
  return "/dashboard";
}

export function AuthDebugPanel() {
  const searchParams = useSearchParams();
  const enabled =
    process.env.NODE_ENV === "development" || searchParams.get("debugAuth") === "1";
  if (!enabled) return null;
  return <AuthDebugPanelInner />;
}

function AuthDebugPanelInner() {
  const auth = useOptionalAuth();
  const [open, setOpen] = useState(true);
  const [state, setState] = useState<DebugPanelState | null>(null);
  const [traceTick, setTraceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTraceTick((t) => t + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function read() {
      const authLoading = auth ? auth.loading || !auth.sessionReady : false;
      const userId = auth?.user?.id ?? null;
      const cloudOnboarded = auth?.cloudOnboardingComplete === true;
      const onboardingComplete = resolveOnboardingCompleteForUser(userId, cloudOnboarded);

      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          setState({
            sessionExists: false,
            userEmail: null,
            authLoading,
            onboardingComplete: false,
            redirectTarget: "/login",
            lastAuthError: null,
            ownerUserId: loadUserProfile().ownerUserId ?? null,
          });
        }
        return;
      }

      const supabase = createClient();
      const snapshot = await readClientSession(supabase);

      if (!cancelled) {
        setState({
          sessionExists: snapshot.sessionExists,
          userEmail: snapshot.user?.email ?? null,
          authLoading,
          onboardingComplete,
          redirectTarget: computeRedirectTarget({
            sessionExists: snapshot.sessionExists,
            onboardingComplete,
          }),
          lastAuthError: snapshot.errorMessage,
          ownerUserId: loadUserProfile().ownerUserId ?? null,
        });
      }
    }

    void read();
    const interval = setInterval(() => void read(), 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [auth, traceTick]);

  if (!state) return null;

  const trace = isAuthDebugEnabled() ? getAuthTraceLog().slice(-6) : [];
  const meta = getAuthTraceMeta();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-2 z-[90] rounded-full bg-gray-900/80 text-white text-[10px] px-2 py-1"
      >
        auth debug
      </button>
    );
  }

  const Row = ({ label, value, ok }: { label: string; value: string; ok?: boolean }) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-400">{label}</span>
      <span className={ok === undefined ? "text-gray-200" : ok ? "text-green-400" : "text-red-400"}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="fixed bottom-24 left-2 z-[90] rounded-xl bg-gray-900/90 text-white text-[10px] font-mono px-3 py-2 space-y-1 w-64 max-h-[50vh] overflow-y-auto shadow-lg">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-300">AUTH DEBUG</span>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400">
          ×
        </button>
      </div>
      {!auth && (
        <p className="text-amber-400 text-[9px]">no AuthProvider on this route</p>
      )}
      <Row label="session" value={state.sessionExists ? "yes" : "no"} ok={state.sessionExists} />
      <Row label="email" value={state.userEmail ?? "none"} ok={!!state.userEmail} />
      <Row label="loading" value={state.authLoading ? "yes" : "no"} ok={!state.authLoading} />
      <Row
        label="onboarded"
        value={state.onboardingComplete ? "yes" : "no"}
        ok={state.onboardingComplete}
      />
      <Row label="redirect" value={state.redirectTarget} />
      <Row label="last error" value={state.lastAuthError ?? "none"} ok={!state.lastAuthError} />
      <Row
        label="owner id"
        value={state.ownerUserId ? state.ownerUserId.slice(0, 8) : "none"}
      />
      {meta.lastRedirect && <Row label="last go" value={meta.lastRedirect} />}
      {trace.length > 0 && (
        <div className="pt-1 border-t border-gray-700 mt-1 space-y-0.5">
          <p className="text-gray-500">trace</p>
          {trace.map((entry) => (
            <p key={entry.ts} className="text-[9px] text-gray-300 truncate">
              {entry.event} s={entry.hasSession ? "1" : "0"} → {entry.redirectTarget ?? entry.reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
