/**
 * Local PlantPal diagnostics: F5Bot, trending, pulse, Planty, tasks, copy audit.
 * Usage: npm run debug:plantpal
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fetchF5BotFeed, isF5BotConfigured, isF5BotEnabled } from "../src/lib/intelligence/f5bot";
import { getDashboardIntelligenceContext } from "../src/lib/intelligence/dashboard-insights";
import { validatePlantyMessages, ALL_PLANTY_MESSAGES, pickPlantyMessage } from "../src/lib/copy/planty-messages-system";
import { auditPlantPalCopy } from "../src/lib/copy/audit-copy";
import { getTrendingPlants } from "../src/lib/local/trending-plants";
import { buildGrowerPulse } from "../src/lib/local/grower-pulse";
import { findScannerTaskRoutes } from "../src/lib/tasks/task-validation";
import { todayTaskLimit } from "../src/lib/tasks/dedupe-tasks";

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
  console.log("=== PlantPal debug ===\n");

  console.log("F5Bot enabled:", isF5BotEnabled());
  console.log("F5Bot configured:", isF5BotConfigured());
  if (isF5BotConfigured()) {
    const { items, connected, error } = await fetchF5BotFeed();
    console.log("F5Bot feed:", connected ? `${items.length} items` : error);
  }

  const intel = await getDashboardIntelligenceContext({
    city: "Pasadena",
    zone: "10a",
    zipCode: "91107",
  });
  console.log("\nDashboard intelligence:", intel.source);
  console.log(" Recent mentions (7d):", intel.recentMentionCount);
  console.log(" Mentioned plants:", intel.mentionedPlants.length ? intel.mentionedPlants.join(", ") : "(none)");
  console.log(" F5 topics:", intel.f5Topics.length ? intel.f5Topics.join(", ") : "(none)");
  console.log(" Top problems:", intel.topProblems.length ? intel.topProblems.join(", ") : "(none)");

  const trending = getTrendingPlants({
    zipCode: "91107",
    limit: 5,
    mentionedPlants: intel.mentionedPlants,
  });
  console.log("\nTrending (Pasadena):", trending.length, "plants");
  console.log(" Sample:", trending[0]?.name, "-", trending[0]?.reason);

  const pulse = buildGrowerPulse({
    zipCode: "91107",
    f5Topics: intel.topicCounts,
    topProblems: intel.topProblems,
    hasIntelligenceData: intel.source === "f5bot",
  });
  console.log("\nGrower pulse:", pulse.lines.length, "lines");
  pulse.lines.forEach((l) => console.log(" ", l.emoji, l.text));
  console.log(" Footer:", pulse.footer);

  const planty = validatePlantyMessages();
  console.log("\nPlanty messages:", planty.ok ? "OK" : planty.errors.join("; "));
  const sample = pickPlantyMessage("today_tasks", { taskCount: 0, city: "Pasadena", zone: "10a" });
  console.log(" Today empty sample:", sample.text, `[${sample.mood}]`);

  const scannerIssues = findScannerTaskRoutes();
  console.log("\nTask scanner routes:", scannerIssues.length ? scannerIssues : "none");
  console.log("Today caps: 1 plant =", todayTaskLimit(1), ", 6+ =", todayTaskLimit(6));
  console.log("\nTotal Planty catalog:", planty.count ?? ALL_PLANTY_MESSAGES.length);

  const copyAudit = auditPlantPalCopy();
  console.log("\nCopy audit:", copyAudit.violationCount, "violations");
  console.log(" Blocking:", copyAudit.blockingCount, "| Warnings:", copyAudit.warningCount);
  if (copyAudit.topFiles.length) {
    console.log(" Top file:", copyAudit.topFiles[0]?.file, `(${copyAudit.topFiles[0]?.count})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
