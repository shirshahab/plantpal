/**
 * Writes build metadata consumed by /api/debug/build-info.
 * Prefers Vercel git env vars when present.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "src/lib/build/build-info.generated.json");

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvLocal();

function safeGit(cmd: string): string | null {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, "package.json"), "utf8")
    ) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

const info = {
  commit:
    process.env.VERCEL_GIT_COMMIT_SHA ??
    safeGit("git rev-parse HEAD") ??
    "unknown",
  branch:
    process.env.VERCEL_GIT_COMMIT_REF ??
    safeGit("git branch --show-current") ??
    "unknown",
  builtAt: new Date().toISOString(),
  version: readPackageVersion(),
  build: {
    supabaseUrlConfigured: Boolean(url && url.startsWith("https://")),
    supabaseAnonKeyConfigured: Boolean(anonKey && anonKey.length >= 20),
    vercelEnv: process.env.VERCEL_ENV ?? null,
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(info, null, 2)}\n`);
console.log(`✓ Wrote build info (${info.commit.slice(0, 7)} on ${info.branch})`);
