import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

/** Standalone onboarding — no app providers; must not require AuthProvider to render. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <OnboardingShell>{children}</OnboardingShell>;
}
