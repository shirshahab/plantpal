/**
 * Auth / session recovery debug checks.
 * Usage: npm run debug:auth
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function main() {
  console.log("=== PlantPal auth debug ===\n");

  assert.ok(exists("src/lib/supabase/config.ts"), "Supabase config module exists");
  const configSrc = read("src/lib/supabase/config.ts");
  assert.match(configSrc, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(configSrc, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  console.log("✓ Supabase env keys referenced");

  assert.ok(exists("src/app/auth/callback/route.ts"), "Auth callback route exists");
  console.log("✓ Auth callback route exists");

  assert.ok(exists("src/app/login/page.tsx"), "Login route exists");
  console.log("✓ Login route exists");

  const authProvider = read("src/lib/store/auth-provider.tsx");
  assert.match(authProvider, /getUser\(\)/);
  assert.match(authProvider, /catch/);
  console.log("✓ Session provider handles null / failed session");

  const gate = read("src/components/auth/auth-session-gate.tsx");
  assert.match(gate, /router\.replace\(`\/login/);
  console.log("✓ Auth session gate redirects logged-out users");

  const appLayout = read("src/app/(app)/layout.tsx");
  assert.match(appLayout, /AuthSessionGate/);
  assert.ok(
    appLayout.indexOf("<AuthSessionGate>") < appLayout.indexOf("<PlantsProvider>"),
    "AuthSessionGate wraps providers before mount"
  );
  console.log("✓ Auth gate blocks providers until session verified");

  const loading = read("src/components/auth/auth-loading-screen.tsx");
  assert.match(loading, /Checking your garden paperwork/);
  console.log("✓ Auth loading screen copy present");

  const safeStorage = read("src/lib/storage/safe-local-storage.ts");
  assert.match(safeStorage, /readLocalJson/);
  assert.match(safeStorage, /removeLocalKey/);
  console.log("✓ Safe localStorage parse wrappers exist");

  const profile = read("src/lib/profile/user-profile.ts");
  assert.match(profile, /catch/);
  console.log("✓ Profile loader has parse fallback");

  const errorPage = read("src/app/error.tsx");
  assert.match(errorPage, /\/login/);
  console.log("✓ Error page offers login recovery");

  const onboardingClient = read("src/app/onboarding/onboarding-client.tsx");
  assert.doesNotMatch(onboardingClient, /useAuth\(\)/);
  console.log("✓ Onboarding page does not require AuthProvider hooks");

  assert.ok(exists("src/app/onboarding/layout.tsx"), "Onboarding layout exists");
  const onboardingLayout = read("src/app/onboarding/layout.tsx");
  assert.match(onboardingLayout, /OnboardingShell/);
  console.log("✓ Onboarding has standalone safe layout");

  const authDebug = read("src/components/dev/auth-debug.tsx");
  assert.match(authDebug, /useOptionalAuth/);
  assert.match(authDebug, /NODE_ENV !== "development"/);
  console.log("✓ AuthDebug safe outside AuthProvider");

  assert.ok(exists("src/app/signup/page.tsx"), "Signup route exists");
  console.log("✓ Signup route exists");

  const middleware = read("src/lib/supabase/middleware.ts");
  assert.match(middleware, /url\.pathname = "\/login"/);
  console.log("✓ Middleware redirects protected routes to /login");

  assert.doesNotMatch(middleware, /"\/onboarding"/);
  console.log("✓ /onboarding is public (not middleware-protected)");

  const onboardingGuard = read("src/components/onboarding/onboarding-guard.tsx");
  assert.match(onboardingGuard, /"\/onboarding"/);
  console.log("✓ OnboardingGuard bypasses /onboarding");

  console.log("\nAuth debug OK.");
}

main();
