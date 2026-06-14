"use client";

import { useEffect, useState } from "react";
import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen";
import { createClient } from "@/lib/supabase/client";
import { isMockMode, isSupabaseConfigured } from "@/lib/supabase/config";
import { purgeCorruptPlantPalStorage } from "@/lib/storage/safe-local-storage";

/**
 * Lightweight onboarding wrapper — verifies session state without mounting app providers.
 * Onboarding is public; logged-out users can complete local steps and sign up later.
 */
export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const mock = isMockMode();
  const [ready, setReady] = useState(mock);

  useEffect(() => {
    if (mock) return;

    let cancelled = false;

    async function bootstrap() {
      try {
        purgeCorruptPlantPalStorage();
        if (!isSupabaseConfigured()) {
          if (!cancelled) setReady(true);
          return;
        }

        const supabase = createClient();
        const { error } = await supabase.auth.getUser();
        if (error) {
          console.warn("[onboarding] session check failed:", error.message);
          await supabase.auth.signOut({ scope: "local" });
        }
      } catch (err) {
        console.warn("[onboarding] bootstrap recovery:", err);
        purgeCorruptPlantPalStorage();
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [mock]);

  if (!ready) {
    return <AuthLoadingScreen message="Checking your garden paperwork…" />;
  }

  return <>{children}</>;
}
