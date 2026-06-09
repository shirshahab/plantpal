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
import { isOnboardingComplete } from "@/lib/profile/user-profile";
import { trackEvent } from "@/lib/analytics/track";

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

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) capturePendingReferral(ref);
    if (searchParams.get("signup") === "1") setMode("signup");
  }, [searchParams]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (signUpError) {
        setError(signUpError.message);
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
        setError(signInError.message);
        setLoading(false);
        return;
      }
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

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
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
        </div>
      </div>
    </div>
  );
}
