/**
 * Apply Supabase SQL migrations directly via Postgres.
 *
 * Usage:
 *   Set SUPABASE_DB_PASSWORD in .env.local (Database password from Supabase dashboard)
 *   npm run db:apply
 *
 * Optional: SUPABASE_PROJECT_REF (defaults to fxmxkmqgxlhggqngsxja)
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import pg from "pg";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const PROJECT_REF =
  process.env.SUPABASE_PROJECT_REF ?? "fxmxkmqgxlhggqngsxja";
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error(
    "Missing SUPABASE_DB_PASSWORD in .env.local\n\n" +
      "Get it from Supabase → Project Settings → Database → Database password\n" +
      "(This is NOT the API secret key — it's the password you set when creating the project.)"
  );
  process.exit(1);
}

const encoded = encodeURIComponent(password);
const connectionString =
  process.env.DATABASE_URL ??
  `postgresql://postgres.${PROJECT_REF}:${encoded}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

const files = [
  "supabase/migrations/002_phase2_schema.sql",
  "supabase/migrations/003_knowledge_engine.sql",
  "supabase/seeds/004_knowledge_seed.sql",
];

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`Connecting to Supabase project ${PROJECT_REF}...`);
  await client.connect();
  console.log("Connected.\n");

  for (const file of files) {
    const path = join(process.cwd(), file);
    if (!existsSync(path)) {
      console.warn(`Skip missing file: ${file}`);
      continue;
    }
    const sql = readFileSync(path, "utf8");
    console.log(`Applying ${file} (${(sql.length / 1024).toFixed(1)} KB)...`);
    try {
      await client.query(sql);
      console.log(`  ✓ ${file}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        console.log(`  ~ ${file} (partially applied — continuing)`);
      } else {
        throw err;
      }
    }
  }

  const { rows } = await client.query(
    "SELECT COUNT(*)::int AS n FROM plant_species"
  );
  console.log(`\nDone. plant_species count: ${rows[0]?.n ?? 0}`);
  await client.end();
}

main().catch((err) => {
  console.error("\nMigration failed:", err instanceof Error ? err.message : err);
  console.error(
    "\nIf connection failed, verify SUPABASE_DB_PASSWORD in .env.local."
  );
  process.exit(1);
});
