"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Leaf, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BetaBadge } from "@/components/brand/beta-badge";
import { cn } from "@/lib/utils";
import { saveUserProfile } from "@/lib/profile/user-profile";
import { trackEvent } from "@/lib/analytics/track";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  capturePendingReferral,
  getPendingReferral,
  redeemReferral,
  clearPendingReferral,
} from "@/lib/referrals/index";
import {
  GROW_TYPE_OPTIONS,
  EXPERIENCE_OPTIONS,
  MAIN_GOAL_OPTIONS,
  type GrowType,
  type ExperienceLevel,
  type MainGoal,
} from "@/lib/types/profile";

const STEPS = [
  "Welcome",
  "Experience",
  "Location",
  "Garden type",
  "Your goals",
  "First plant",
];

export default function OnboardingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [growTypes, setGrowTypes] = useState<GrowType[]>([]);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [zipCode, setZipCode] = useState("");
  const [mainGoal, setMainGoal] = useState<MainGoal | null>(null);
  const [referralMessage, setReferralMessage] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) capturePendingReferral(ref);
  }, [searchParams]);

  function toggleGrow(id: GrowType) {
    setGrowTypes((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  function canContinue(): boolean {
    switch (step) {
      case 1:
        return experience !== null;
      case 2:
        return /^\d{5}$/.test(zipCode.trim());
      case 3:
        return growTypes.length > 0;
      case 4:
        return mainGoal !== null;
      default:
        return true;
    }
  }

  /** Stable per-device key so referral redemption can't repeat on reload. */
  function getReferralUserKey(): string {
    const KEY = "plantpal-referral-user-key";
    let key = localStorage.getItem(KEY);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(KEY, key);
    }
    return key;
  }

  /** Best-effort mirror of onboarding answers to the cloud profile. */
  function syncProfileToCloud() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      void supabase
        .from("profiles")
        .update({
          zip_code: zipCode.trim(),
          experience_level: experience,
          main_goal: mainGoal,
          grow_types: growTypes,
          onboarding_complete: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .then(({ error }) => {
          if (error) console.warn("[onboarding] profile sync skipped:", error.message);
        });
    });
  }

  function persistProfile(extra: { firstPlantAdded?: boolean } = {}) {
    saveUserProfile({
      onboardingComplete: true,
      growTypes,
      experienceLevel: experience,
      zipCode: zipCode.trim(),
      mainGoal,
      completedAt: new Date().toISOString(),
      ...extra,
    });

    syncProfileToCloud();

    trackEvent("onboarding_complete", {
      experience: experience ?? "unknown",
      gardenTypes: growTypes.join(","),
      goal: mainGoal ?? "unknown",
    });

    const pendingRef = getPendingReferral();
    if (pendingRef) {
      const result = redeemReferral(pendingRef, getReferralUserKey());
      if (result.trialGranted) {
        setReferralMessage(result.message);
      }
      clearPendingReferral();
    }
  }

  function handleAddPlant() {
    persistProfile();
    router.push("/plants/new?first=1");
  }

  function handleScanPlant() {
    persistProfile();
    router.push("/scanner");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/80 via-white to-[#f8faf8] flex flex-col">
      <header className="px-4 py-5 flex items-center justify-between max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">PlantPal</span>
          <BetaBadge />
        </div>
      </header>

      <div className="px-4 max-w-lg mx-auto w-full mb-4">
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-green-500" : "bg-gray-200"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
      </div>

      <main className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full">
        {referralMessage && (
          <Card padding="md" className="mb-4 bg-green-50 border-green-100">
            <p className="text-sm text-green-800">{referralMessage}</p>
          </Card>
        )}

        {step === 0 && (
          <div className="text-center pt-8 space-y-6 page-enter">
            <div className="w-20 h-20 rounded-3xl bg-green-100 flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Welcome to PlantPal
              </h1>
              <p className="text-gray-500 mt-3 leading-relaxed">
                Your smart plant care coach. Track every plant, know what to do today,
                and get local advice for your climate.
              </p>
            </div>
            <ul className="text-left space-y-3 text-sm text-gray-600">
              {[
                "Daily tasks tailored to your garden",
                "Photo scanner for ID and health checks",
                "Local weather and climate intelligence",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 page-enter">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gardening experience</h1>
              <p className="text-gray-500 mt-1 text-sm">We&apos;ll calibrate advice to match.</p>
            </div>
            <div className="space-y-3">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setExperience(opt.id)}
                  className={cn(
                    "w-full p-4 rounded-2xl border text-left transition-all touch-manipulation",
                    experience === opt.id
                      ? "border-green-400 bg-green-50 ring-1 ring-green-200"
                      : "border-gray-100 bg-white hover:border-green-200"
                  )}
                >
                  <p className="font-semibold text-gray-900">{opt.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 page-enter">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your location</h1>
              <p className="text-gray-500 mt-1 text-sm">
                ZIP code powers local weather, frost alerts, and climate-matched care.
              </p>
            </div>
            <Input
              label="ZIP code"
              placeholder="e.g. 91107"
              inputMode="numeric"
              maxLength={5}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              className="text-lg py-3"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 page-enter">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">What type of garden?</h1>
              <p className="text-gray-500 mt-1 text-sm">Select all that apply.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GROW_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleGrow(opt.id)}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all touch-manipulation",
                    growTypes.includes(opt.id)
                      ? "border-green-400 bg-green-50 ring-1 ring-green-200"
                      : "border-gray-100 bg-white hover:border-green-200"
                  )}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <p className="font-medium text-gray-900 mt-2 text-sm">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 page-enter">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your goals</h1>
              <p className="text-gray-500 mt-1 text-sm">What matters most right now?</p>
            </div>
            <div className="space-y-2">
              {MAIN_GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMainGoal(opt.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all touch-manipulation",
                    mainGoal === opt.id
                      ? "border-green-400 bg-green-50 ring-1 ring-green-200"
                      : "border-gray-100 bg-white hover:border-green-200"
                  )}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="font-medium text-gray-900">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5 page-enter">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Add your first plant
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Every PlantPal garden starts with one plant — that&apos;s where tasks and care plans begin.
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={handleScanPlant}>
              Scan Plant
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button variant="outline" className="w-full" size="lg" onClick={handleAddPlant}>
              Add Plant Manually
            </Button>

            <Card padding="md" className="border-gray-100 bg-gray-50/50">
              <p className="text-sm text-gray-600 leading-relaxed">
                Point your camera at any plant to identify it instantly, or add it manually —
                tasks and care plans start the moment your first plant is in.
              </p>
            </Card>
          </div>
        )}
      </main>

      {step < 5 && (
        <footer className="px-4 pb-8 max-w-lg mx-auto w-full flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue()}
            className="flex-1"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        </footer>
      )}

      <p className="text-center text-xs text-gray-400 pb-6">
        Already have an account?{" "}
        <Link href="/login" className="text-green-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
