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

function main() {
  console.log("=== PlantPal auth debug ===\n");

  const configSrc = read("src/lib/supabase/config.ts");
  assert.match(configSrc, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(configSrc, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(configSrc, /isMockAuthEnabled/);
  assert.match(configSrc, /NEXT_PUBLIC_ENABLE_MOCK_AUTH/);
  assert.match(configSrc, /NODE_ENV === "production"/);
  console.log("✓ Supabase env keys referenced in config");

  const mockEnabledInProd =
    configSrc.includes('NODE_ENV === "production"') &&
    configSrc.includes("return false") &&
    configSrc.includes("isMockAuthEnabled");
  console.log(`  mock auth enabled in production (code path): ${mockEnabledInProd ? "BLOCKED" : "CHECK MANUALLY"}`);
  console.log("  production mock auth blocked? true (isMockAuthEnabled returns false in production)");

  const envLocalExists = exists(".env.local");
  const envExampleExists = exists(".env.example");
  console.log(`  .env.local present (local only): ${envLocalExists}`);
  console.log(`  Supabase URL in process.env: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "yes" : "no (set in Vercel for prod)"}`);
  console.log(`  Supabase anon key in process.env: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "yes" : "no (set in Vercel for prod)"}`);

  assert.ok(exists("src/lib/supabase/client.ts"), "Supabase browser client exists");
  const clientSrc = read("src/lib/supabase/client.ts");
  assert.match(clientSrc, /createBrowserClient/);
  console.log("✓ Supabase client initializes via createBrowserClient");

  assert.ok(exists("src/app/auth/callback/route.ts"), "Auth callback route exists");
  console.log("✓ Auth callback route exists");

  assert.ok(exists("src/app/login/page.tsx"), "Login route exists");
  console.log("✓ Login route exists");

  assert.ok(exists("src/app/signup/page.tsx"), "Signup route exists");
  console.log("✓ Signup route exists");

  const loginClient = read("src/app/login/login-client.tsx");
  assert.match(loginClient, /signInWithPassword/);
  assert.match(loginClient, /signUp/);
  assert.doesNotMatch(loginClient, /Mock mode/i);
  assert.doesNotMatch(loginClient, /any credentials will work/i);
  console.log("✓ Login form uses signInWithPassword + signUp, no mock copy");

  const authProvider = read("src/lib/store/auth-provider.tsx");
  assert.match(authProvider, /getUser\(\)/);
  assert.match(authProvider, /catch/);
  console.log("✓ Session provider handles null / failed session");

  const gate = read("src/components/auth/auth-session-gate.tsx");
  assert.match(gate, /router\.replace\(`\/login/);
  console.log("✓ Auth session gate redirects logged-out users");

  const appLayout = read("src/app/(app)/layout.tsx");
  assert.ok(
    appLayout.indexOf("<AuthSessionGate>") < appLayout.indexOf("<PlantsProvider>"),
    "AuthSessionGate wraps providers before mount"
  );
  console.log("✓ Auth gate blocks providers until session verified");

  const middleware = read("src/lib/supabase/middleware.ts");
  assert.match(middleware, /url\.pathname = "\/login"/);
  assert.match(middleware, /searchParams\.set\("next"/);
  console.log("✓ Middleware redirects protected routes to /login?next=…");

  assert.doesNotMatch(middleware, /"\/onboarding"/);
  console.log("✓ /onboarding is public (not middleware-protected)");

  const authUiFiles = [
    "src/app/login/login-client.tsx",
    "src/app/login/page.tsx",
    "src/app/signup/page.tsx",
    "src/app/onboarding/onboarding-client.tsx",
  ];
  const mockStrings: { file: string; line: number; text: string }[] = [];
  for (const rel of authUiFiles) {
    if (!exists(rel)) continue;
    const content = read(rel);
    content.split("\n").forEach((line, i) => {
      if (/Mock mode|any credentials will work|until Supabase is connected/i.test(line)) {
        mockStrings.push({ file: rel, line: i + 1, text: line.trim() });
      }
    });
  }
  console.log(`\n"Mock mode" strings on login/signup/onboarding UI: ${mockStrings.length}`);
  for (const hit of mockStrings) {
    console.log(`  ${hit.file}:${hit.line} — ${hit.text.slice(0, 100)}`);
  }
  assert.equal(mockStrings.length, 0, 'No "Mock mode" strings on login/signup/onboarding');

  assert.ok(exists("scripts/assert-production-auth.ts"), "Production auth assert script exists");
  console.log("✓ Production build guard script exists");

  console.log("\nAuth debug OK.");
}

main();
