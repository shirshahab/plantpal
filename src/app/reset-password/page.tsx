"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isMockMode } from "@/lib/supabase/config";
import { PlantPalLogo } from "@/components/brand/plantpal-logo";
import { reportFeatureFailure } from "@/lib/errors/report-error";

/**
 * Landing page for Supabase password-recovery links. The auth callback has
 * already exchanged the code for a session, so the user just sets a new
 * password here.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    if (isMockMode()) {
      setHasSession(true);
      return;
    }
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    if (isMockMode()) {
      router.push("/dashboard");
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      reportFeatureFailure("auth", updateError.message, "auth_failure");
      setError(
        updateError.message.toLowerCase().includes("different from the old")
          ? "New password must be different from your old one."
          : "Couldn't update your password. The reset link may have expired — request a new one from the sign-in page."
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 mb-6">
            <PlantPalLogo size="lg" />
          </Link>
          <h1 className="font-heading text-3xl font-bold text-brand-text">
            Set a new password
          </h1>
          <p className="text-gray-500 mt-2">Choose a new password for your account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 p-8 border border-gray-100">
          {hasSession === false ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                This reset link has expired or was already used.
              </p>
              <Link href="/login">
                <Button className="w-full" size="lg">
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="new-password"
                label="New password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                id="confirm-password"
                label="Confirm new password"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
              />

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                disabled={hasSession === null}
                className="w-full"
                size="lg"
              >
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
