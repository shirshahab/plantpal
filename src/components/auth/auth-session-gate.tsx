"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth-provider";
import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen";

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

/** Blocks protected app routes until session is verified; redirects logged-out users to /login. */
export function AuthSessionGate({ children }: { children: React.ReactNode }) {
  const { user, loading, profileReady, isMockMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const checking = loading || (!isMockMode && !profileReady);
  const needsAuth = !isMockMode && !user && !isPublicAppPath(pathname);

  useEffect(() => {
    if (checking) return;
    if (needsAuth) {
      const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [checking, needsAuth, pathname, router]);

  if (checking || needsAuth) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}
