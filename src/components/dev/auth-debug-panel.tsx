"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useOptionalAuth } from "@/lib/store/auth-provider";
import { readClientSession } from "@/lib/auth/session";
import { resolveOnboardingCompleteForUser } from "@/lib/auth/onboarding-state";
import {
  getAuthDiagnosticState,
  getAuthLogEntries,
  isAuthDebugEnabled,
  patchAuthDiagnostic,
} from "@/lib/auth/auth-log";

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
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function read() {
      const diag = getAuthDiagnosticState();
      const authLoading = auth ? auth.loading || !auth.sessionReady : diag.authLoading;
      const userId = auth?.user?.id ?? diag.userId;

      if (!isSupabaseConfigured()) {
        patchAuthDiagnostic({ authLoading, userId: null, sessionExists: false });
        return;
      }

      const snapshot = await readClientSession(createClient());
      if (cancelled) return;

      const onboardingComplete = resolveOnboardingCompleteForUser(
        snapshot.user?.id ?? userId,
        auth?.cloudOnboardingComplete
      );

      patchAuthDiagnostic({
        sessionExists: snapshot.sessionExists,
        userId: snapshot.user?.id ?? userId ?? null,
        authLoading,
        onboardingComplete,
        errorMessage: snapshot.errorMessage,
        profileLoadResult: auth?.profileSnapshot?.status ?? diag.profileLoadResult,
      });
    }

    void read();
    const interval = setInterval(() => void read(), 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [auth]);

  const diag = getAuthDiagnosticState();
  const logs = isAuthDebugEnabled() ? getAuthLogEntries().slice(-8) : [];

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
    <div className="flex items-start justify-between gap-2">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span
        className={`text-right break-all ${ok === undefined ? "text-gray-200" : ok ? "text-green-400" : "text-red-400"}`}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div className="fixed bottom-24 left-2 z-[90] rounded-xl bg-gray-900/95 text-white text-[10px] font-mono px-3 py-2 space-y-1 w-72 max-h-[55vh] overflow-y-auto shadow-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-300">AUTH DEBUG</span>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400">
          ×
        </button>
      </div>
      <Row label="route" value={diag.currentRoute || "-"} />
      <Row label="session" value={diag.sessionExists ? "yes" : "no"} ok={diag.sessionExists} />
      <Row
        label="user id"
        value={diag.userId ? `${diag.userId.slice(0, 8)}…` : "none"}
        ok={!!diag.userId}
      />
      <Row label="auth loading" value={diag.authLoading ? "yes" : "no"} ok={!diag.authLoading} />
      <Row
        label="onboarded"
        value={diag.onboardingComplete ? "yes" : "no"}
        ok={diag.onboardingComplete}
      />
      <Row label="last redirect" value={diag.lastRedirectReason ?? "none"} />
      <Row label="last event" value={diag.lastAuthEvent ?? "none"} />
      <Row label="profile" value={diag.profileLoadResult ?? "pending"} />
      <Row label="error" value={diag.errorMessage ?? "none"} ok={!diag.errorMessage} />
      {logs.length > 0 && (
        <div className="pt-1 border-t border-gray-700 mt-1 space-y-0.5">
          <p className="text-gray-500">[plantpal-auth]</p>
          {logs.map((entry) => (
            <p key={entry.ts} className="text-[9px] text-gray-300 break-all">
              {entry.event}{" "}
              {entry.detail.reason ? String(entry.detail.reason).slice(0, 40) : ""}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
