import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Completes Supabase email confirmation / magic links.
 * Exchanges the code in the URL for a session cookie, then sends the
 * user into the app. Without this route, confirmation links land on a
 * page that never logs the user in.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/onboarding";

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    console.error("[auth/callback] exchange failed:", error.message);
    return NextResponse.redirect(
      new URL("/login?error=confirmation_failed", url.origin)
    );
  }

  return NextResponse.redirect(new URL("/login", url.origin));
}
