import { notFound } from "next/navigation";

/**
 * Debug tools ship in dev builds only. Set PLANTPAL_DEBUG_TOOLS=1 to
 * re-enable them on a deployed environment (e.g. a staging preview).
 */
export function isDebugToolingEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" || process.env.PLANTPAL_DEBUG_TOOLS === "1"
  );
}

/** Server-side guard for debug pages/layouts — 404s in production. */
export function requireDebugTooling(): void {
  if (!isDebugToolingEnabled()) notFound();
}
