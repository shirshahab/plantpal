import type { DbClient } from "./client";
import { safeDb } from "./client";

export interface DbHealthReport {
  id: string;
  user_id: string;
  plant_id: string | null;
  photo_url: string;
  issues: unknown[];
  overall_health: string | null;
  created_at: string;
}

export interface HealthReportSummary {
  id: string;
  plantId: string | null;
  photoUrl: string;
  issue: string;
  severity: string | null;
  createdAt: string;
}

function summarize(row: DbHealthReport): HealthReportSummary {
  const first = Array.isArray(row.issues) ? row.issues[0] : null;
  const issueObj = first as { likely_issue?: string; issue_detected?: string } | null;
  const issue =
    issueObj?.likely_issue ??
    issueObj?.issue_detected ??
    (typeof first === "string" ? first : "Health scan");

  return {
    id: row.id,
    plantId: row.plant_id,
    photoUrl: row.photo_url,
    issue,
    severity: row.overall_health,
    createdAt: row.created_at,
  };
}

export async function getHealthReports(
  db: DbClient,
  userId: string,
  limit = 50
): Promise<HealthReportSummary[]> {
  const { data } = await safeDb(async () => {
    const res = await db
      .from("health_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return { data: (res.data ?? []) as DbHealthReport[], error: res.error };
  });
  return (data ?? []).map(summarize);
}

export async function getHealthReportsForPlant(
  db: DbClient,
  userId: string,
  plantId: string
): Promise<HealthReportSummary[]> {
  const { data } = await safeDb(async () => {
    const res = await db
      .from("health_reports")
      .select("*")
      .eq("user_id", userId)
      .eq("plant_id", plantId)
      .order("created_at", { ascending: false });
    return { data: (res.data ?? []) as DbHealthReport[], error: res.error };
  });
  return (data ?? []).map(summarize);
}
