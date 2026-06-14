"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth-provider";
import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen";
import { createClient } from "@/lib/supabase/client";
import { readClientSession } from "@/lib/auth/session";
import { logAuth, logRedirect, patchAuthDiagnostic } from "@/lib/auth/auth-log";

const PUBLIC_APP_PREFIXES = [
  "/login",
  "/signup",
  "/onboarding",
  "/auth",
  "/offline",
  "/qa",
  "/debug",
];

function isPublicAppPath(pathname: string): boolean {
  return PUBLIC_APP_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * Session-only gate. Never redirect to /login if getSession() still has a session.
 */
export function AuthSessionGate({ children }: { children: React.ReactNode }) {
  const { user, loading, sessionReady, isMockMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);
  const [storedSession, setStoredSession] = useState<boolean | null>(null);

  const checking = loading || !sessionReady;

  useEffect(() => {
    patchAuthDiagnostic({
      authLoading: checking,
      userId: user?.id ?? null,
      sessionExists: Boolean(user),
    });
  }, [checking, user]);

  useEffect(() => {
    if (checking || isMockMode || isPublicAppPath(pathname) || user) {
      setStoredSession(null);
      return;
    }

    let cancelled = false;
    void readClientSession(createClient()).then((snap) => {
      if (cancelled) return;
      setStoredSession(snap.sessionExists);
      patchAuthDiagnostic({
        sessionExists: snap.sessionExists,
        userId: snap.user?.id ?? null,
      });
      logAuth("ROUTE_DECISION", {
        sessionExists: snap.sessionExists,
        userId: snap.user?.id ?? null,
        reason: `AuthSessionGate path=${pathname} providerUser=no`,
      });

      if (snap.sessionExists) {
        return;
      }

      if (redirectedRef.current) return;
      redirectedRef.current = true;
      const next =
        pathname && pathname !== "/login"
          ? `?next=${encodeURIComponent(pathname)}`
          : "";
      logRedirect(`/login${next}`, "AuthSessionGate: no session in storage");
      router.replace(`/login${next}`);
    });

    return () => {
      cancelled = true;
    };
  }, [checking, user, pathname, router, isMockMode]);

  useEffect(() => {
    redirectedRef.current = false;
  }, [pathname]);

  if (checking) {
    return <AuthLoadingScreen />;
  }

  if (isMockMode || isPublicAppPath(pathname)) {
    return <>{children}</>;
  }

  if (user) {
    return <>{children}</>;
  }

  if (storedSession === null || storedSession === true) {
    return <AuthLoadingScreen message="Restoring your session…" />;
  }

  return <AuthLoadingScreen />;
}
