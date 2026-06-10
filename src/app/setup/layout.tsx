import { requireDebugTooling } from "@/lib/dev/dev-only";

/** Setup checker is development-only — 404 in production builds. */
export default function SetupLayout({ children }: { children: React.ReactNode }) {
  requireDebugTooling();
  return <>{children}</>;
}
