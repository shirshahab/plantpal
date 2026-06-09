/**
 * Beta launch override — when enabled, all users get Plus-level access
 * and upgrade prompts are hidden.
 *
 * Set NEXT_PUBLIC_BETA_UNLOCK_ALL=true in .env.local (client + build time).
 * Server routes may also read BETA_UNLOCK_ALL=true.
 */
export function isBetaUnlockAll(): boolean {
  return (
    process.env.NEXT_PUBLIC_BETA_UNLOCK_ALL === "true" ||
    process.env.BETA_UNLOCK_ALL === "true"
  );
}
