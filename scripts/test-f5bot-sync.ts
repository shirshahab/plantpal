/**
 * Local test: fetch F5Bot JSON feed and print normalized sample.
 * Usage: npm run test:f5bot
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fetchF5BotFeed, isF5BotEnabled } from "../src/lib/intelligence/f5bot";

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

async function main() {
  console.log("F5Bot enabled:", isF5BotEnabled());
  console.log("Feed URL set:", Boolean(process.env.F5BOT_JSON_FEED_URL));

  const { items, connected, error } = await fetchF5BotFeed();
  if (!connected) {
    console.error("Feed fetch failed:", error);
    process.exit(1);
  }

  console.log("Items fetched:", items.length);
  if (items[0]) {
    console.log("\nFirst normalized item:");
    console.log(JSON.stringify(items[0], null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
