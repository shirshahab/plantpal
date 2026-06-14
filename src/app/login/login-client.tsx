"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { isMockAuthEnabled, isSupabaseConfigured } from "@/lib/supabase/config";
import { PlantPalLogo } from "@/components/brand/plantpal-logo";
import { BRAND } from "@/lib/brand/tokens";
import { capturePendingReferral } from "@/lib/referrals/index";
import { isOnboardingComplete, ensureProfileForUser } from "@/lib/profile/user-profile";
import {
  hydrateProfileFromCloud,
  type CloudProfileSnapshot,
} from "@/lib/profile/cloud-profile";
import { trackEvent } from "@/lib/analytics/track";
import { reportFeatureFailure } from "@/lib/errors/report-error";
import { readClientSession, resolvePostAuthPath, safeNextPath } from "@/lib/auth/session";
import { AuthDebugPanel } from "@/components/dev/auth-debug-panel";

interface LoginAuthDiag {
  authError: string | null;
  sessionExists: boolean;
  userIdExists: boolean;
  nextParam: string | null;
  redirectTarget: string | null;
}

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mockAuth = isMockAuthEnabled();
  const supabaseReady = isSupabaseConfigured();
  const debugAuth = searchParams.get("debugAuth") === "1";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [authDiag, setAuthDiag] = useState<LoginAuthDiag | null>(null);
  const redirectingRef = useRef(false);

  const redirectAfterAuth = useCallback(
    (snapshot: CloudProfileSnapshot, isSignup: boolean, sessionOk: boolean) => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;

      const next = safeNextPath(searchParams.get("next"));
      const onboarded =
        snapshot.onboardingComplete === true || isOnboardingComplete();
      const target = resolvePostAuthPath({ onboardingComplete: onboarded, next });

      if (isSignup) {
        trackEvent("signup", { method: mockAuth ? "mock" : "email" });
      } else {
        trackEvent("login", { method: mockAuth ? "mock" : "email" });
      }

      setAuthDiag({
        authError: null,
        sessionExists: sessionOk,
        userIdExists: Boolean(snapshot.userId),
        nextParam: next,
        redirectTarget: target,
      });

      if (process.env.NODE_ENV === "development" || debugAuth) {
        console.info("[login] redirect", {
          sessionExists: sessionOk,
          userIdExists: Boolean(snapshot.userId),
          next,
          target,
          onboarded,
        });
      }

      router.replace(target);
    },
    [debugAuth, mockAuth, router, searchParams]
  );

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) capturePendingReferral(ref);
    if (searchParams.get("signup") === "1") setMode("signup");
    if (searchParams.get("error") === "confirmation_failed") {
      setError(
        "That confirmation link expired or was already used. Try signing in, or sign up again to get a fresh link."
      );
    }
    if (searchParams.get("confirmed") === "1") {
      setNotice("Email confirmed! Sign in below.");
    }
  }, [searchParams]);

  function friendlyAuthError(message: string, isLogin: boolean): string {
    const m = message.toLowerCase();
    if (isLogin && m.includes("invalid login credentials")) {
      return "That login did not work. Check your email and password.";
    }
    if (m.includes("email not confirmed")) {
      return "Your email isn't confirmed yet. Check your inbox for the confirmation link, then sign in.";
    }
    if (m.includes("rate limit")) {
      return "Too many attempts. Wait a minute and try again.";
    }
    if (isLogin) {
      return "That login did not work. Check your email and password.";
    }
    return message;
  }

  async function handleForgotPassword() {
    if (!supabaseReady) return;
    if (!email) {
      setError("Enter your email above first, then tap “Forgot password?” again.");
      return;
    }
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (resetError) {
      reportFeatureFailure("auth", resetError.message, "auth_failure");
      setError(friendlyAuthError(resetError.message, true));
    } else {
      setError("");
      setNotice(
        `Password reset link sent to ${email}. Check your inbox (and spam), then follow the link.`
      );
    }
  }

  async function handleResendConfirmation() {
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (resendError) {
      setError(friendlyAuthError(resendError.message, true));
    } else {
      setNotice(`Confirmation email re-sent to ${email}. Check your inbox (and spam).`);
      setShowResend(false);
    }
  }

  async function confirmSessionBeforeRedirect(
    supabase: ReturnType<typeof createClient>,
    userId?: string
  ): Promise<boolean> {
    const snapshot = await readClientSession(supabase);
    if (userId) ensureProfileForUser(userId);
    if (snapshot.errorMessage) {
      setAuthDiag({
        authError: snapshot.errorMessage,
        sessionExists: snapshot.sessionExists,
        userIdExists: snapshot.userIdExists,
        nextParam: safeNextPath(searchParams.get("next")),
        redirectTarget: null,
      });
    }
    return snapshot.sessionExists;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setShowResend(false);
    setLoading(true);
    redirectingRef.current = false;

    if (!supabaseReady && !mockAuth) {
      setError("Sign-in is not available right now. Please try again later.");
      setLoading(false);
      return;
    }

    if (mockAuth) {
      setTimeout(() => {
        redirectAfterAuth({ status: "local", onboardingComplete: false }, mode === "signup", true);
        setLoading(false);
      }, 400);
      return;
    }

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpError) {
        reportFeatureFailure("auth", signUpError.message, "auth_failure");
        setError(friendlyAuthError(signUpError.message, false));
        setAuthDiag({
          authError: signUpError.message,
          sessionExists: false,
          userIdExists: false,
          nextParam: safeNextPath(searchParams.get("next")),
          redirectTarget: null,
        });
        setLoading(false);
        return;
      }

      if (data.user && data.user.identities?.length === 0) {
        setError("This email is already registered. Sign in instead.");
        setMode("login");
        setLoading(false);
        return;
      }

      if (!data.session) {
        trackEvent("signup", { method: "email", pendingConfirmation: true });
        setNotice("Check your email to confirm your account.");
        setMode("login");
        setLoading(false);
        return;
      }

      const sessionOk = await confirmSessionBeforeRedirect(supabase, data.user?.id);
      if (!sessionOk) {
        setError("Sign-in succeeded but the session did not persist. Try again.");
        setLoading(false);
        return;
      }

      const snapshot = await hydrateProfileFromCloud();
      redirectAfterAuth(snapshot, true, sessionOk);
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        reportFeatureFailure("auth", signInError.message, "auth_failure");
        const friendly = friendlyAuthError(signInError.message, true);
        setError(friendly);
        setAuthDiag({
          authError: signInError.message,
          sessionExists: false,
          userIdExists: false,
          nextParam: safeNextPath(searchParams.get("next")),
          redirectTarget: null,
        });
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setShowResend(true);
        }
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError("That login did not work. Check your email and password.");
        setAuthDiag({
          authError: "signInWithPassword returned no session",
          sessionExists: false,
          userIdExists: false,
          nextParam: safeNextPath(searchParams.get("next")),
          redirectTarget: null,
        });
        setLoading(false);
        return;
      }

      const sessionOk = await confirmSessionBeforeRedirect(supabase, data.user?.id);
      if (!sessionOk) {
        setError("Sign-in succeeded but the session did not persist. Try again.");
        setLoading(false);
        return;
      }

      const snapshot = await hydrateProfileFromCloud();
      if (snapshot.error) {
        console.warn("[login] profile hydration warning:", snapshot.error);
      }
      redirectAfterAuth(snapshot, false, sessionOk);
    }

    setLoading(false);
  }

  const showLoginDiag =
    (process.env.NODE_ENV === "development" || debugAuth) && authDiag !== null;

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 mb-6">
            <PlantPalLogo size="lg" />
            <span className="text-sm font-medium text-brand-primary font-heading">{BRAND.tagline}</span>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-brand-text">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-gray-500 mt-2">
            {mode === "login"
              ? "Sign in to your PlantPal account"
              : "Start tracking your plants today"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 p-8 border border-gray-100">
          {!supabaseReady && !mockAuth && (
            <div className="bg-amber-50 text-amber-900 text-sm px-4 py-3 rounded-xl mb-4">
              Sign-in is temporarily unavailable. Please try again later.
            </div>
          )}

          {showLoginDiag && authDiag && (
            <div className="bg-gray-900 text-gray-100 text-[10px] font-mono rounded-xl px-3 py-2 mb-4 space-y-1">
              <p className="text-gray-400 font-semibold">LOGIN AUTH DIAG</p>
              <p>error: {authDiag.authError ?? "none"}</p>
              <p>session: {authDiag.sessionExists ? "yes" : "no"}</p>
              <p>user id: {authDiag.userIdExists ? "yes" : "no"}</p>
              <p>next: {authDiag.nextParam ?? "none"}</p>
              <p>redirect: {authDiag.redirectTarget ?? "pending"}</p>
            </div>
          )}

          <div className="flex rounded-xl bg-gray-50 p-1 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                  mode === m
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Input
                id="name"
                label="Full Name"
                placeholder="Jane Gardener"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {mode === "login" && supabaseReady && (
              <div className="text-right -mt-1">
                <button
                  type="button"
                  onClick={() => void handleForgotPassword()}
                  className="text-xs font-medium text-green-700 hover:text-green-800 underline-offset-2 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {notice && (
              <div className="bg-green-50 text-green-800 text-sm px-4 py-3 rounded-xl">
                {notice}
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl space-y-2">
                <p>{error}</p>
                {showResend && (
                  <button
                    type="button"
                    onClick={() => void handleResendConfirmation()}
                    className="font-semibold underline"
                  >
                    Resend confirmation email
                  </button>
                )}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
              disabled={!supabaseReady && !mockAuth}
            >
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Your plants are saved securely to your account
          </p>

          <p className="text-center text-xs text-gray-400 mt-3">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-gray-600">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-gray-600">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <AuthDebugPanel />
    </div>
  );
}
