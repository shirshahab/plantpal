import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isProtectedRoute } from "@/lib/auth/protected-routes";

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => {
    const name = cookie.name.toLowerCase();
    return name.startsWith("sb-") || name.includes("supabase");
  });
}

/**
 * Temporary auth diagnostics — safe booleans only, no secrets.
 * GET /api/debug/auth-state?path=/dashboard
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "/";
  const pathname = path.startsWith("/") ? path.split("?")[0] : `/${path.split("?")[0]}`;

  return NextResponse.json({
    ok: true,
    supabaseConfigured: isSupabaseConfigured(),
    authCookiePresent: hasSupabaseAuthCookie(request),
    requestUrl: request.nextUrl.pathname + request.nextUrl.search,
    middlewareWouldProtect: isProtectedRoute(pathname),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}
