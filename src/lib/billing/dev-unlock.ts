/**
 * Development-only full feature unlock. Never active in production unless
 * ALLOW_PROD_BETA_UNLOCK=true (emergency staging only).
 */

function parseEnvFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

/** True when dev unlock env is set and production guard allows it. */
export function isDevUnlockAllFeatures(): boolean {
  if (process.env.NODE_ENV === "production") {
    if (!parseEnvFlag(process.env.ALLOW_PROD_BETA_UNLOCK)) return false;
  }

  return (
    parseEnvFlag(process.env.DEV_UNLOCK_ALL_FEATURES) ||
    parseEnvFlag(process.env.NEXT_PUBLIC_DEV_UNLOCK_ALL_FEATURES) ||
    parseEnvFlag(process.env.NEXT_PUBLIC_BETA_UNLOCK_ALL) ||
    parseEnvFlag(process.env.BETA_UNLOCK_ALL)
  );
}
