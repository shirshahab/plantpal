"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth-provider";
import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen";
import { traceAuthEvent } from "@/lib/auth/lifecycle-trace";

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
 * Blocks protected routes until session is confirmed.
 * Profile hydration runs in parallel — it must not trigger login redirects.
 */
export function AuthSessionGate({ children }: { children: React.ReactNode }) {
  const { user, loading, sessionReady, isMockMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  const checking = loading || !sessionReady;
  const needsAuth = !isMockMode && sessionReady && !user && !isPublicAppPath(pathname);

  useEffect(() => {
    if (checking || !needsAuth) return;
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    const next =
      pathname && pathname !== "/login"
        ? `?next=${encodeURIComponent(pathname)}`
        : "";
    traceAuthEvent({
      event: "REDIRECT_TO_LOGIN",
      hasSession: false,
      redirectTarget: `/login${next}`,
      reason: "no session on protected route",
    });
    router.replace(`/login${next}`);
  }, [checking, needsAuth, pathname, router]);

  useEffect(() => {
    redirectedRef.current = false;
  }, [pathname, user]);

  if (checking || needsAuth) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}
