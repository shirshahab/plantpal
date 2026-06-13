import { NextResponse } from "next/server";
import { requireDebugTooling } from "@/lib/dev/dev-only";
import {
  fetchF5BotFeed,
  isF5BotConfigured,
  isF5BotEnabled,
} from "@/lib/intelligence/f5bot";
import { getDashboardIntelligenceContext } from "@/lib/intelligence/dashboard-insights";
import { validatePlantyMessages, ALL_PLANTY_MESSAGES } from "@/lib/copy/planty-messages-system";
import { auditPlantPalCopy } from "@/lib/copy/audit-copy";
import { getTrendingPlants } from "@/lib/local/trending-plants";
import { buildGrowerPulse } from "@/lib/local/grower-pulse";
import { todayTaskLimit } from "@/lib/tasks/dedupe-tasks";
import { findScannerTaskRoutes } from "@/lib/tasks/task-validation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

interface Check {
  name: string;
  status: "ok" | "warning" | "error";
  details: string;
}

export async function GET() {
  requireDebugTooling();

  const checks: Check[] = [];

  checks.push({
    name: "F5BOT_ENABLED",
    status: isF5BotEnabled() ? "ok" : "warning",
    details: isF5BotEnabled() ? "Enabled" : "Disabled or not configured",
  });

  checks.push({
    name: "F5Bot feed URL",
    status: isF5BotConfigured() ? "ok" : "warning",
    details: isF5BotConfigured() ? "F5BOT_JSON_FEED_URL present" : "Missing feed URL",
  });

  if (isF5BotConfigured()) {
    const { items, connected, error } = await fetchF5BotFeed();
    checks.push({
      name: "F5Bot feed fetch",
      status: connected ? "ok" : "error",
      details: connected ? `${items.length} items fetched` : error ?? "Fetch failed",
    });
  }

  let recentMentionCount = 0;
  if (isSupabaseConfigured()) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (url && key) {
      const admin = createClient(url, key, { auth: { persistSession: false } });
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const { error, count } = await admin
        .from("plant_intelligence_mentions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since.toISOString());
      recentMentionCount = count ?? 0;
      checks.push({
        name: "Intelligence mentions table",
        status: error ? "warning" : "ok",
        details: error ? error.message : `${recentMentionCount} mentions in last 7 days`,
      });
    }
  } else {
    checks.push({
      name: "Intelligence mentions table",
      status: "warning",
      details: "Supabase not configured",
    });
  }

  const intel = await getDashboardIntelligenceContext({ city: "Pasadena", zone: "10a", zipCode: "91107" });
  checks.push({
    name: "Dashboard intelligence source",
    status: intel.source === "f5bot" ? "ok" : "warning",
    details: `${intel.source}; ${intel.recentMentionCount} recent rows`,
  });
  checks.push({
    name: "Mentioned plants extracted",
    status: intel.mentionedPlants.length > 0 ? "ok" : "warning",
    details: intel.mentionedPlants.length
      ? intel.mentionedPlants.slice(0, 4).join(", ")
      : "None (fallback trending)",
  });
  checks.push({
    name: "F5 topics extracted",
    status: intel.f5Topics.length > 0 ? "ok" : "warning",
    details: intel.f5Topics.length ? intel.f5Topics.slice(0, 4).join(", ") : "None",
  });

  const trending = getTrendingPlants({
    zipCode: "91107",
    limit: 5,
    mentionedPlants: intel.mentionedPlants,
  });
  checks.push({
    name: "Trending plants generator",
    status: trending.length >= 4 ? "ok" : "warning",
    details: `${trending.length} daily items for Pasadena`,
  });

  const pulse = buildGrowerPulse({
    zipCode: "91107",
    f5Topics: intel.topicCounts,
    topProblems: intel.topProblems,
    hasIntelligenceData: intel.source === "f5bot",
  });
  checks.push({
    name: "Grower pulse generator",
    status: pulse.lines.length >= 3 ? "ok" : "warning",
    details: `${pulse.lines.length} pulse lines`,
  });

  checks.push({
    name: "Today task caps",
    status: todayTaskLimit(1) === 2 && todayTaskLimit(6) === 5 ? "ok" : "warning",
    details: "1 plant=2, 6+=5",
  });

  const scannerRoutes = findScannerTaskRoutes();
  checks.push({
    name: "Task scanner routes",
    status: scannerRoutes.length === 0 ? "ok" : "warning",
    details:
      scannerRoutes.length === 0
        ? "No default task types route to /scanner"
        : scannerRoutes.map((r) => r.taskType).join(", "),
  });

  const plantyValidation = validatePlantyMessages();
  checks.push({
    name: "Planty moods",
    status: plantyValidation.ok ? "ok" : "error",
    details: plantyValidation.ok
      ? `${ALL_PLANTY_MESSAGES.length} messages checked`
      : plantyValidation.errors.slice(0, 3).join("; "),
  });

  const copyAudit = auditPlantPalCopy();
  checks.push({
    name: "Copy audit",
    status: copyAudit.blockingCount === 0 ? (copyAudit.warningCount ? "warning" : "ok") : "warning",
    details: `${copyAudit.violationCount} violations (${copyAudit.blockingCount} blocking); top: ${
      copyAudit.topFiles[0]?.file ?? "none"
    }`,
  });

  const ok = checks.every((c) => c.status !== "error");

  return NextResponse.json({
    ok,
    checks,
    dashboardIntelligence: intel,
    copyAudit: {
      violationCount: copyAudit.violationCount,
      blockingCount: copyAudit.blockingCount,
      warningCount: copyAudit.warningCount,
      topFiles: copyAudit.topFiles,
    },
  });
}
