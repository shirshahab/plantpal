import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./config";
import {
  applySubscriptionMiddleware,
  ensureSubscriptionCookie,
} from "@/lib/billing/subscription-middleware";
import { safeNextPath } from "@/lib/auth/session";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    let response = NextResponse.next({ request });
    response = applySubscriptionMiddleware(request, response);
    response = ensureSubscriptionCookie(request, response);
    return response;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session cookies — do not use this for protected-route redirects.
  // Client-side AuthSessionGate reads the same browser session without a
  // server/client mismatch when cookies lag behind signInWithPassword.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  if (user && isAuthPage) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    const dest = next ?? "/onboarding";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  supabaseResponse = applySubscriptionMiddleware(request, supabaseResponse);
  supabaseResponse = ensureSubscriptionCookie(request, supabaseResponse);

  return supabaseResponse;
}
