import { requireDebugTooling } from "@/lib/dev/dev-only";

/** Internal QA checklist is development-only — 404 in production builds. */
export default function QaLayout({ children }: { children: React.ReactNode }) {
  requireDebugTooling();
  return <>{children}</>;
}
