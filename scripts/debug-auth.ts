/**
 * Auth / session / production login debug checks.
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

function grepNoAutoSignOut(src: string, file: string): void {
  assert.doesNotMatch(src, /signOut\(\{\s*scope:\s*"local"/, `${file}: no scoped local signOut`);
  assert.doesNotMatch(
    src,
    /getUser\(\)[\s\S]{0,200}await supabase\.auth\.signOut/,
    `${file}: no signOut after getUser failure`
  );
}

function main() {
  console.log("=== PlantPal auth debug ===\n");

  const configSrc = read("src/lib/supabase/config.ts");
  assert.match(configSrc, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(configSrc, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(configSrc, /isMockAuthEnabled/);
  console.log("✓ Supabase env keys referenced in config");

  assert.ok(exists("src/lib/auth/onboarding-state.ts"), "user-scoped onboarding module");
  const onboardingState = read("src/lib/auth/onboarding-state.ts");
  assert.match(onboardingState, /plantpal-onboarding:/);
  console.log("✓ Onboarding scoped per userId (plantpal-onboarding:{userId})");

  assert.ok(exists("src/lib/auth/lifecycle-trace.ts"));
  console.log("✓ Auth lifecycle trace module exists");

  const loginClient = read("src/app/login/login-client.tsx");
  assert.match(loginClient, /signInWithPassword/);
  assert.match(loginClient, /getSession|readClientSession/);
  assert.match(loginClient, /clearPlantPalAppState/);
  console.log("✓ Login confirms session before redirect");

  const authProvider = read("src/lib/store/auth-provider.tsx");
  assert.match(authProvider, /queueMicrotask/);
  assert.match(authProvider, /onAuthStateChange/);
  assert.doesNotMatch(authProvider, /signOut\(\{ scope: "local" \}/);
  grepNoAutoSignOut(authProvider, "auth-provider.tsx");
  console.log("✓ AuthProvider defers sync; no automatic signOut");

  const onboardingShell = read("src/components/onboarding/onboarding-shell.tsx");
  grepNoAutoSignOut(onboardingShell, "onboarding-shell.tsx");
  console.log("✓ OnboardingShell never auto signOut");

  const gate = read("src/components/auth/auth-session-gate.tsx");
  assert.match(gate, /sessionReady/);
  assert.doesNotMatch(gate, /profileReady/);
  console.log("✓ AuthSessionGate waits for session only (not profile hydration)");

  const protectedProviders = read("src/components/auth/protected-app-providers.tsx");
  assert.ok(
    protectedProviders.indexOf("PlantsProvider") > 0,
    "ProtectedAppProviders wraps data providers"
  );
  console.log("✓ Protected data providers mount only after session");

  const appLayout = read("src/app/(app)/layout.tsx");
  assert.ok(
    appLayout.indexOf("<AuthProvider>") < appLayout.indexOf("<AuthSessionGate>"),
    "AuthProvider mounts first"
  );
  assert.ok(
    appLayout.indexOf("<AuthSessionGate>") < appLayout.indexOf("<ProtectedAppProviders>"),
    "AuthSessionGate before protected providers"
  );
  console.log("✓ Provider order: AuthProvider → AuthSessionGate → ProtectedAppProviders");

  const middleware = read("src/lib/supabase/middleware.ts");
  assert.doesNotMatch(middleware, /isProtected|PROTECTED_PREFIXES/);
  console.log("✓ Middleware does not redirect protected routes (client gate handles auth)");

  const userProfile = read("src/lib/profile/user-profile.ts");
  assert.match(userProfile, /isOnboardingComplete\(userId/);
  console.log("✓ isOnboardingComplete requires userId");

  assert.ok(exists("src/app/api/debug/auth-state/route.ts"));
  console.log("✓ /api/debug/auth-state endpoint exists");

  const authUiFiles = [
    "src/app/login/login-client.tsx",
    "src/app/onboarding/onboarding-client.tsx",
  ];
  for (const rel of authUiFiles) {
    grepNoAutoSignOut(read(rel), rel);
  }
  console.log("✓ Login/onboarding UI never auto signOut");

  console.log("\nAuth debug OK.");
}

main();
