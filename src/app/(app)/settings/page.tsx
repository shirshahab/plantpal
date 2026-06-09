"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, RotateCcw, Globe } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { BetaBadge } from "@/components/brand/beta-badge";
import { FeedbackPanel } from "@/components/feedback/feedback-panel";
import { AccountTierCard } from "@/components/subscription/account-tier-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal";
import { SyncStatusBadge } from "@/components/sync/sync-status-badge";
import { DeveloperToolsSection } from "@/components/settings/developer-tools";
import { FounderModeBadge } from "@/components/settings/founder-mode-badge";
import { MOCK_PLANTS } from "@/lib/mock/plants";
import { useAuth } from "@/lib/store/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { loadUserProfile } from "@/lib/profile/user-profile";
import {
  GROW_TYPE_OPTIONS,
  EXPERIENCE_OPTIONS,
  MAIN_GOAL_OPTIONS,
} from "@/lib/types/profile";
import { seedDemoGarden } from "@/lib/demo/seed-demo-garden";

export default function SettingsPage() {
  const { user, isMockMode } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEduOpen, setResetEduOpen] = useState(false);
  const [profile, setProfile] = useState(loadUserProfile);

  useEffect(() => {
    if (isMockMode) {
      setFullName("Jane Gardener");
      setEmail("jane@example.com");
      return;
    }
    if (!user) return;

    setEmail(user.email ?? "");

    async function loadProfile() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single();
      if (data?.full_name) setFullName(data.full_name);
    }
    loadProfile();
  }, [user, isMockMode]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    if (isMockMode) {
      setSaved(true);
      setLoading(false);
      setTimeout(() => setSaved(false), 2500);
      return;
    }

    if (!user) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    setLoading(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  function handleResetEducation() {
    localStorage.removeItem("plantpal-education");
    setResetEduOpen(false);
    window.location.reload();
  }

  function handleResetData() {
    localStorage.setItem("plantpal-plants", JSON.stringify(MOCK_PLANTS));
    setResetOpen(false);
    window.location.reload();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and app preferences"
        action={
          <div className="flex items-center gap-2">
            <FounderModeBadge />
            <BetaBadge />
            <SyncStatusBadge />
          </div>
        }
      />

      <FeedbackPanel />

      <AccountTierCard />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Profile</h2>
              <p className="text-sm text-gray-500">Update your personal info</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              id="fullName"
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              id="email"
              label="Email"
              value={email}
              disabled
              className="opacity-60"
            />
            {saved && (
              <p className="text-sm text-green-600">Profile saved successfully</p>
            )}
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Your preferences</h2>
          <p className="text-sm text-gray-500 mt-1">From onboarding — update anytime</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {profile.onboardingComplete ? (
            <>
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">ZIP:</span>{" "}
                {profile.zipCode || "Not set"}
                {profile.demoMode && (
                  <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Demo mode
                  </span>
                )}
              </p>
              {profile.experienceLevel && (
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Experience:</span>{" "}
                  {EXPERIENCE_OPTIONS.find((e) => e.id === profile.experienceLevel)?.label}
                </p>
              )}
              {profile.mainGoal && (
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Goal:</span>{" "}
                  {MAIN_GOAL_OPTIONS.find((g) => g.id === profile.mainGoal)?.label}
                </p>
              )}
              {profile.growTypes.length > 0 && (
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Growing:</span>{" "}
                  {profile.growTypes
                    .map((id) => GROW_TYPE_OPTIONS.find((g) => g.id === id)?.label)
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-500">Complete onboarding to personalize your experience.</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/onboarding">
              <Button variant="outline" size="sm">
                {profile.onboardingComplete ? "Update preferences" : "Start onboarding"}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                seedDemoGarden(profile.zipCode || "91107");
                window.location.reload();
              }}
            >
              Explore Demo Garden
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-sage/15 flex items-center justify-center">
              <Globe className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Marketing site</h2>
              <p className="text-sm text-gray-500">Return to the public PlantPal website</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/">
            <Button variant="outline">Back to Website</Button>
          </Link>
          <Link href="/features">
            <Button variant="outline">Features</Button>
          </Link>
          <Link href="/waitlist">
            <Button variant="outline">Join Waitlist</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-500 mt-1">API keys, weather, plant database, and price search</p>
        </CardHeader>
        <CardContent>
          <Link href="/settings/integrations">
            <Button variant="outline">Integration health</Button>
          </Link>
          <Link href="/setup" className="ml-2 inline-block mt-2 sm:mt-0">
            <Button variant="outline">Setup checker</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-500 mt-1">Daily care reminders and task alerts</p>
        </CardHeader>
        <CardContent>
          <Link href="/settings/reminders">
            <Button variant="outline">Reminder settings</Button>
          </Link>
        </CardContent>
      </Card>

      {isMockMode && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Demo Data</h2>
            <p className="text-sm text-gray-500 mt-1">
              Reset local demo plants and learning progress
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={() => setResetOpen(true)}>
              <RotateCcw className="w-4 h-4" />
              Reset Mock Plants
            </Button>
            <Button variant="outline" onClick={() => setResetEduOpen(true)}>
              <RotateCcw className="w-4 h-4" />
              Reset Learning Progress
            </Button>
          </CardContent>
        </Card>
      )}

      <DeveloperToolsSection />

      <ConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleResetData}
        title="Reset mock data?"
        description="This will restore the 5 default plants and remove any plants you added."
        confirmLabel="Reset"
      />

      <ConfirmModal
        open={resetEduOpen}
        onClose={() => setResetEduOpen(false)}
        onConfirm={handleResetEducation}
        title="Reset learning progress?"
        description="This will clear all completed lessons and reset your care level to Seedling."
        confirmLabel="Reset"
      />
    </div>
  );
}
