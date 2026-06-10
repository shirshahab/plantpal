"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { isMockMode } from "@/lib/supabase/config";
import { PlantPalLogo } from "@/components/brand/plantpal-logo";
import { BRAND } from "@/lib/brand/tokens";
import { capturePendingReferral } from "@/lib/referrals/index";
import { isOnboardingComplete, saveUserProfile } from "@/lib/profile/user-profile";
import type { UserProfile } from "@/lib/types/profile";
import { trackEvent } from "@/lib/analytics/track";
import { reportFeatureFailure } from "@/lib/errors/report-error";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mock = isMockMode();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) capturePendingReferral(ref);
    if (searchParams.get("signup") === "1") setMode("signup");
    if (searchParams.get("error") === "confirmation_failed") {
      setError("That confirmation link expired or was already used. Try signing in — or sign up again to get a fresh link.");
    }
    if (searchParams.get("confirmed") === "1") {
      setNotice("Email confirmed! Sign in below.");
    }
  }, [searchParams]);

  /**
   * Cross-device fix: restore onboarding state from the server profile so a
   * returning user on a new browser isn't forced through onboarding again.
   */
  async function hydrateProfileFromCloud() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_complete, zip_code, experience_level, main_goal, grow_types")
        .eq("id", user.id)
        .single();
      if (data?.onboarding_complete) {
        saveUserProfile({
          onboardingComplete: true,
          ...(typeof data.zip_code === "string" && data.zip_code
            ? { zipCode: data.zip_code }
            : {}),
          ...(data.experience_level
            ? { experienceLevel: data.experience_level as UserProfile["experienceLevel"] }
            : {}),
          ...(data.main_goal ? { mainGoal: data.main_goal as UserProfile["mainGoal"] } : {}),
          ...(Array.isArray(data.grow_types)
            ? { growTypes: data.grow_types as UserProfile["growTypes"] }
            : {}),
        });
      }
    } catch {
      /* non-fatal — local onboarding flow still works */
    }
  }

  function postAuthRedirect(isSignup: boolean) {
    if (isSignup) {
      trackEvent("signup", { method: mock ? "mock" : "email" });
      router.push("/onboarding");
    } else if (!isOnboardingComplete()) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  /** Translate raw Supabase auth errors into clear, actionable copy. */
  function friendlyAuthError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes("email not confirmed")) {
      return "Your email isn't confirmed yet. Check your inbox for the confirmation link, then sign in.";
    }
    if (m.includes("invalid login credentials")) {
      return "Email or password is incorrect. If you just signed up, confirm your email first.";
    }
    if (m.includes("rate limit")) {
      return "Too many attempts — wait a minute and try again.";
    }
    return message;
  }

  async function handleForgotPassword() {
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
      setError(friendlyAuthError(resetError.message));
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
      setError(friendlyAuthError(resendError.message));
    } else {
      setNotice(`Confirmation email re-sent to ${email}. Check your inbox (and spam).`);
      setShowResend(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setShowResend(false);
    setLoading(true);

    if (mock) {
      setTimeout(() => {
        postAuthRedirect(mode === "signup");
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
        setError(friendlyAuthError(signUpError.message));
        setLoading(false);
        return;
      }

      // Supabase returns success with empty identities when the email is
      // already registered (anti-enumeration).
      if (data.user && data.user.identities?.length === 0) {
        setError("This email is already registered. Sign in instead.");
        setMode("login");
        setLoading(false);
        return;
      }

      // No session means the project requires email confirmation — the user
      // is NOT logged in yet. Don't pretend they are.
      if (!data.session) {
        trackEvent("signup", { method: "email", pendingConfirmation: true });
        setNotice(
          `Almost there! We sent a confirmation link to ${email}. Click it, then sign in here.`
        );
        setMode("login");
        setLoading(false);
        return;
      }

      postAuthRedirect(true);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        reportFeatureFailure("auth", signInError.message, "auth_failure");
        setError(friendlyAuthError(signInError.message));
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setShowResend(true);
        }
        setLoading(false);
        return;
      }
      await hydrateProfileFromCloud();
      postAuthRedirect(false);
    }

    setLoading(false);
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

            {mode === "login" && !mock && (
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

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            {mock
              ? "Mock mode — any credentials will work until Supabase is connected"
              : "Your plants are saved securely to your account"}
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
    </div>
  );
}
