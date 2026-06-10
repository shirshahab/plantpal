/**
 * Health report storage — localStorage-first with best-effort Supabase sync
 * (pro_health_reports / expert_review_requests tables).
 */
import { canUseSupabase, getDb, safeDb } from "@/lib/db/client";
import type {
  HealthReportStatus,
  ProHealthReport,
} from "@/lib/types/health";

const REPORTS_KEY = "plantpal-health-reports";
const EXPERT_KEY = "plantpal-expert-review-requests";
const MAX_LOCAL_REPORTS = 25;

/** Fired whenever reports change so tasks/dashboard can refresh. */
export const HEALTH_REPORTS_CHANGED_EVENT = "plantpal-health-reports-changed";

function notifyChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(HEALTH_REPORTS_CHANGED_EVENT));
  }
}

export interface ExpertReviewRequest {
  id: string;
  healthReportId: string;
  plantId: string | null;
  urgency: "low" | "medium" | "high";
  notes: string;
  status: "pending";
  createdAt: string;
}

function readJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — non-fatal.
  }
}

export function listHealthReports(): ProHealthReport[] {
  return readJson<ProHealthReport>(REPORTS_KEY).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getHealthReport(id: string): ProHealthReport | null {
  return listHealthReports().find((r) => r.id === id) ?? null;
}

/** Reports still needing attention (drive dashboard alerts + recovery tasks). */
export function getActiveHealthReports(): ProHealthReport[] {
  return listHealthReports().filter(
    (r) => r.status === "active" || r.status === "monitoring" || r.status === "escalated"
  );
}

export function saveHealthReport(report: ProHealthReport, userId?: string | null): void {
  const reports = readJson<ProHealthReport>(REPORTS_KEY).filter((r) => r.id !== report.id);
  reports.unshift(report);
  writeJson(REPORTS_KEY, reports.slice(0, MAX_LOCAL_REPORTS));
  notifyChanged();
  void syncReportToSupabase(report, userId);
  void syncHealthFollowups(report, userId);
}

export function updateHealthReportStatus(
  id: string,
  status: HealthReportStatus,
  userId?: string | null
): ProHealthReport | null {
  const reports = readJson<ProHealthReport>(REPORTS_KEY);
  const report = reports.find((r) => r.id === id);
  if (!report) return null;
  report.status = status;
  report.updatedAt = new Date().toISOString();
  writeJson(REPORTS_KEY, reports);
  notifyChanged();
  void syncReportToSupabase(report, userId);
  return report;
}

async function syncReportToSupabase(
  report: ProHealthReport,
  userId?: string | null
): Promise<void> {
  if (!canUseSupabase(userId)) return;
  const db = getDb();
  await safeDb(async () => {
    const res = await db.from("pro_health_reports").upsert(
      {
        id: report.id,
        user_id: userId,
        plant_id: report.plantId,
        species: report.species,
        photos: report.photoSlots,
        symptoms: report.symptoms,
        environment: report.environment,
        diagnosis: report.diagnosis,
        remedy_plan: report.remedyPlan,
        prognosis: report.prognosis,
        commercial_context: report.commercialContext,
        severity: report.diagnosis.severity,
        confidence: report.diagnosis.confidence,
        status: report.status,
        created_at: report.createdAt,
        updated_at: report.updatedAt,
      },
      { onConflict: "id" }
    );
    return { data: res.data, error: res.error };
  });
}

/**
 * Mirror the diagnosis follow-up schedule (rescan +2d, symptom check +1d,
 * progress photo +7d) into the health_followups table. These drive the
 * recovery reminders shown in the notification center.
 */
async function syncHealthFollowups(
  report: ProHealthReport,
  userId?: string | null
): Promise<void> {
  if (!canUseSupabase(userId)) return;
  const db = getDb();

  const addDays = (iso: string, n: number): string => {
    const d = new Date(iso);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const base = {
    user_id: userId,
    report_id: report.id,
    plant_id: report.plantId,
    plant_name: report.species,
    issue_label: report.diagnosis.likelyIssue,
  };

  const rows = [
    {
      ...base,
      id: `rescan-${report.id}`,
      kind: "rescan",
      due_date: addDays(report.createdAt, 2),
    },
    {
      ...base,
      id: `check-${report.id}`,
      kind: "symptom_check",
      due_date: addDays(report.createdAt, 1),
    },
    {
      ...base,
      id: `photo-${report.id}`,
      kind: "recovery_step",
      due_date: addDays(report.createdAt, 7),
    },
  ];

  await safeDb(async () => {
    const res = await db.from("health_followups").upsert(rows, { onConflict: "id" });
    return { data: res.data, error: res.error };
  });
}

// ── Expert review requests ─────────────────────────────────────────────────

export function saveExpertReviewRequest(
  request: Omit<ExpertReviewRequest, "id" | "status" | "createdAt">,
  userId?: string | null
): ExpertReviewRequest {
  const full: ExpertReviewRequest = {
    ...request,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const all = readJson<ExpertReviewRequest>(EXPERT_KEY);
  all.unshift(full);
  writeJson(EXPERT_KEY, all.slice(0, 50));
  void syncExpertRequestToSupabase(full, userId);
  return full;
}

export function hasExpertReviewRequest(healthReportId: string): boolean {
  return readJson<ExpertReviewRequest>(EXPERT_KEY).some(
    (r) => r.healthReportId === healthReportId
  );
}

export function listExpertReviewRequests(): ExpertReviewRequest[] {
  return readJson<ExpertReviewRequest>(EXPERT_KEY).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getExpertReviewRequest(
  healthReportId: string
): ExpertReviewRequest | null {
  return (
    readJson<ExpertReviewRequest>(EXPERT_KEY).find(
      (r) => r.healthReportId === healthReportId
    ) ?? null
  );
}

async function syncExpertRequestToSupabase(
  request: ExpertReviewRequest,
  userId?: string | null
): Promise<void> {
  if (!canUseSupabase(userId)) return;
  const db = getDb();
  await safeDb(async () => {
    const res = await db.from("expert_review_requests").insert({
      id: request.id,
      user_id: userId,
      health_report_id: request.healthReportId,
      plant_id: request.plantId,
      urgency: request.urgency,
      notes: request.notes,
      status: request.status,
      created_at: request.createdAt,
    });
    return { data: res.data, error: res.error };
  });
}
