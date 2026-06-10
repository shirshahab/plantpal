/**
 * Diagnosis feedback loop — client storage + Supabase sync.
 *
 * Users mark diagnoses correct/wrong and plants improved/worse. The
 * aggregate accuracy per issue is sent with future diagnosis requests so
 * the engine can calibrate its confidence.
 */
import { canUseSupabase, getDb, safeDb } from "@/lib/db/client";
import type {
  DiagnosisFeedback,
  FeedbackOutcome,
  FeedbackSignals,
  FeedbackVerdict,
  HealthIssueId,
} from "@/lib/types/health";

const FEEDBACK_KEY = "plantpal-diagnosis-feedback";
const MAX_LOCAL = 100;

function readAll(): DiagnosisFeedback[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DiagnosisFeedback[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: DiagnosisFeedback[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(items.slice(0, MAX_LOCAL)));
  } catch {
    // Non-fatal.
  }
}

export function getFeedbackForReport(healthReportId: string): DiagnosisFeedback | null {
  return readAll().find((f) => f.healthReportId === healthReportId) ?? null;
}

export function saveDiagnosisFeedback(
  healthReportId: string,
  issueId: HealthIssueId | null,
  update: { verdict?: FeedbackVerdict; outcome?: FeedbackOutcome },
  userId?: string | null
): DiagnosisFeedback {
  const all = readAll();
  const now = new Date().toISOString();
  let entry = all.find((f) => f.healthReportId === healthReportId);

  if (entry) {
    if (update.verdict !== undefined) entry.verdict = update.verdict;
    if (update.outcome !== undefined) entry.outcome = update.outcome;
    entry.updatedAt = now;
  } else {
    entry = {
      id: crypto.randomUUID(),
      healthReportId,
      issueId,
      verdict: update.verdict ?? null,
      outcome: update.outcome ?? null,
      createdAt: now,
      updatedAt: now,
    };
    all.unshift(entry);
  }

  writeAll(all);
  void syncToSupabase(entry, userId);
  return entry;
}

/** Per-issue accuracy stats for confidence calibration. */
export function buildFeedbackSignals(): FeedbackSignals {
  const issueStats: FeedbackSignals["issueStats"] = {};
  for (const f of readAll()) {
    if (!f.issueId || !f.verdict) continue;
    const stats = (issueStats[f.issueId] ??= { correct: 0, wrong: 0 });
    if (f.verdict === "correct") stats.correct += 1;
    else stats.wrong += 1;
  }
  return { issueStats };
}

async function syncToSupabase(
  feedback: DiagnosisFeedback,
  userId?: string | null
): Promise<void> {
  if (!canUseSupabase(userId)) return;
  const db = getDb();
  await safeDb(async () => {
    const res = await db.from("diagnosis_feedback").upsert(
      {
        id: feedback.id,
        user_id: userId,
        health_report_id: feedback.healthReportId,
        issue_id: feedback.issueId,
        verdict: feedback.verdict,
        outcome: feedback.outcome,
        created_at: feedback.createdAt,
        updated_at: feedback.updatedAt,
      },
      { onConflict: "id" }
    );
    return { data: res.data, error: res.error };
  });
}
