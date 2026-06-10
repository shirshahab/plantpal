import { requireDebugTooling } from "@/lib/dev/dev-only";

/** All /debug/* pages are development-only — 404 in production builds. */
export default function DebugLayout({ children }: { children: React.ReactNode }) {
  requireDebugTooling();
  return <>{children}</>;
}
