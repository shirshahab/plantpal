"use client";

import { useEffect } from "react";
import { SyncProvider } from "@/lib/store/sync-provider";
import { PlantsProvider } from "@/lib/store/plants-provider";
import { AcademyProvider } from "@/lib/store/academy-provider";
import { EducationProvider } from "@/lib/store/education-provider";
import { EngagementProvider } from "@/lib/store/engagement-provider";
import { JourneyProvider } from "@/lib/store/journey-provider";
import { AiProvider } from "@/lib/store/ai-provider";
import { PhotosProvider } from "@/lib/store/photos-provider";
import { RemindersProvider } from "@/lib/store/reminders-provider";
import { TasksProvider } from "@/lib/store/tasks-provider";
import { NotificationsProvider } from "@/lib/store/notifications-provider";
import { ToastProvider } from "@/lib/store/toast-provider";
import { GenomeProvider } from "@/lib/store/genome-provider";
import { SubscriptionProvider } from "@/lib/store/subscription-provider";
import { AnalyticsProvider } from "@/lib/store/analytics-provider";
import { UpgradeModalProvider } from "@/components/billing/upgrade-modal-provider";
import { FounderHydrator } from "@/components/billing/founder-hydrator";
import { MoatProvider } from "@/lib/store/moat-provider";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { BackHandler } from "@/components/navigation/back-handler";
import { AppShell } from "@/components/app-shell";
import { AuthDebug } from "@/components/dev/auth-debug";
import { useAuth } from "@/lib/store/auth-provider";
import { logAuth } from "@/lib/auth/auth-log";

/**
 * Data providers that require a confirmed Supabase session.
 * Skipped entirely when logged out — avoids fetch races and redirect loops.
 */
export function ProtectedAppProviders({ children }: { children: React.ReactNode }) {
  const { user, loading, sessionReady, isMockMode } = useAuth();

  useEffect(() => {
    if (user || isMockMode) {
      logAuth("ROUTE_DECISION", { reason: "ProtectedAppProviders mounted", userId: user?.id });
    }
  }, [user, isMockMode]);

  if (loading || !sessionReady) return null;
  if (!user && !isMockMode) return null;

  return (
    <SyncProvider>
      <PlantsProvider>
        <SubscriptionProvider>
          <AnalyticsProvider>
            <FounderHydrator />
            <UpgradeModalProvider>
              <JourneyProvider>
                <AiProvider>
                  <EngagementProvider>
                    <EducationProvider>
                      <RemindersProvider>
                        <PhotosProvider>
                          <ToastProvider>
                            <AcademyProvider>
                              <TasksProvider>
                                <NotificationsProvider>
                                  <MoatProvider>
                                    <GenomeProvider>
                                      <OnboardingGuard>
                                        <BackHandler />
                                        <AppShell>{children}</AppShell>
                                        <AuthDebug />
                                      </OnboardingGuard>
                                    </GenomeProvider>
                                  </MoatProvider>
                                </NotificationsProvider>
                              </TasksProvider>
                            </AcademyProvider>
                          </ToastProvider>
                        </PhotosProvider>
                      </RemindersProvider>
                    </EducationProvider>
                  </EngagementProvider>
                </AiProvider>
              </JourneyProvider>
            </UpgradeModalProvider>
          </AnalyticsProvider>
        </SubscriptionProvider>
      </PlantsProvider>
    </SyncProvider>
  );
}
