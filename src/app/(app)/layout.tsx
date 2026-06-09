import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/lib/store/auth-provider";
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
import { ToastProvider } from "@/lib/store/toast-provider";
import { GenomeProvider } from "@/lib/store/genome-provider";
import { SubscriptionProvider } from "@/lib/store/subscription-provider";
import { UpgradeModalProvider } from "@/components/billing/upgrade-modal-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SyncProvider>
        <PlantsProvider>
        <SubscriptionProvider>
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
                          <GenomeProvider>
                            <AppShell>{children}</AppShell>
                          </GenomeProvider>
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
        </SubscriptionProvider>
      </PlantsProvider>
      </SyncProvider>
    </AuthProvider>
  );
}
