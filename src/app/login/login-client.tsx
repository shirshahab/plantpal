"use client";

import { useState, useEffect, useRef } from "react";
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
import { ensureProfileForUser } from "@/lib/profile/user-profile";
import { hydrateProfileFromCloud } from "@/lib/profile/cloud-profile";
import { trackEvent } from "@/lib/analytics/track";
import { reportFeatureFailure } from "@/lib/errors/report-error";
import { clearPlantPalAppState } from "@/lib/auth/clear-app-state";
import {
  logAuth,
  logRedirect,
  startSessionWatchdog,
  patchAuthDiagnostic,
} from "@/lib/auth/auth-log";
import { AuthDebugPanel } from "@/components/dev/auth-debug-panel";

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
  const redirectingRef = useRef(false);

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

  async function finishWithSession(userId: string | undefined, isSignup: boolean) {
    const supabase = createClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData.session;

    logAuth("SESSION_AFTER_SIGNIN", {
      sessionExists: Boolean(session),
      userId: session?.user?.id ?? userId ?? null,
      error: sessionError?.message,
    });

    if (!session?.user) {
      patchAuthDiagnostic({
        sessionExists: false,
        errorMessage: "Session was not created",
      });
      setError("Session was not created. Try signing in again.");
      return;
    }

    ensureProfileForUser(session.user.id);
    patchAuthDiagnostic({
      sessionExists: true,
      userId: session.user.id,
      authLoading: false,
    });

    void hydrateProfileFromCloud().then((snapshot) => {
      logAuth("PROFILE_CHECK", {
        sessionExists: true,
        userId: session.user.id,
        profileLoadResult: snapshot.status,
        onboardingComplete: snapshot.onboardingComplete ?? false,
        error: snapshot.error,
      });
      patchAuthDiagnostic({
        profileLoadResult: snapshot.status,
        onboardingComplete: snapshot.onboardingComplete ?? false,
      });
    });

    if (isSignup) {
      trackEvent("signup", { method: mockAuth ? "mock" : "email" });
    } else {
      trackEvent("login", { method: mockAuth ? "mock" : "email" });
    }

    if (redirectingRef.current) return;
    redirectingRef.current = true;

    logRedirect("/dashboard", "login success - session confirmed");
    startSessionWatchdog(async () => {
      const { data } = await supabase.auth.getSession();
      return Boolean(data.session?.user?.id);
    });

    router.replace("/dashboard");
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
        logRedirect("/dashboard", "mock auth");
        router.replace("/dashboard");
        setLoading(false);
      }, 400);
      return;
    }

    const supabase = createClient();
    logAuth("SIGN_IN_START", { mode });

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
        logAuth("SIGN_IN_START", { error: signUpError.message, success: false });
        reportFeatureFailure("auth", signUpError.message, "auth_failure");
        setError(friendlyAuthError(signUpError.message, false));
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

      logAuth("SIGN_IN_SUCCESS", { userId: data.user?.id, mode: "signup" });
      await finishWithSession(data.user?.id, true);
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        logAuth("SIGN_IN_START", { error: signInError.message, success: false });
        reportFeatureFailure("auth", signInError.message, "auth_failure");
        setError(friendlyAuthError(signInError.message, true));
        patchAuthDiagnostic({ errorMessage: signInError.message });
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setShowResend(true);
        }
        setLoading(false);
        return;
      }

      logAuth("SIGN_IN_SUCCESS", { userId: data.user?.id, mode: "login" });
      await finishWithSession(data.user?.id, false);
    }

    setLoading(false);
  }

  function handleClearAppState() {
    const removed = clearPlantPalAppState();
    setNotice(`Cleared ${removed} PlantPal app keys (Supabase auth keys untouched).`);
    setError("");
  }

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

          {debugAuth && (
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={handleClearAppState}
              >
                Clear PlantPal local app state
              </Button>
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
