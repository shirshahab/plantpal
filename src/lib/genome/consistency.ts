import type { PlantCareLog } from "@/lib/types/tasks";

export interface ConsistencyMetric {
  score: number;
  label: string;
  detail: string;
}

function daysSince(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000);
}

function logsInWindow(
  logs: PlantCareLog[],
  actionTypes: string[],
  windowDays: number,
  now = new Date()
): number {
  const cutoff = now.getTime() - windowDays * 86400000;
  return logs.filter(
    (l) =>
      actionTypes.includes(l.actionType) &&
      new Date(l.createdAt).getTime() >= cutoff
  ).length;
}

export function computeWateringConsistency(
  lastWateredAt: string | null,
  careLogs: PlantCareLog[],
  missedWaterTasks: number,
  now = new Date()
): ConsistencyMetric {
  const recentLogs = logsInWindow(careLogs, ["water"], 30, now);
  const days = daysSince(lastWateredAt, now);

  let score = 40;
  if (days !== null) {
    if (days <= 2) score += 35;
    else if (days <= 4) score += 25;
    else if (days <= 7) score += 10;
    else score -= 20;
  }
  score += Math.min(20, recentLogs * 5);
  score -= missedWaterTasks * 12;
  score = Math.max(0, Math.min(100, score));

  const label =
    score >= 75 ? "Excellent" : score >= 55 ? "Good" : score >= 35 ? "Irregular" : "Needs attention";

  const detail =
    days === null
      ? "No watering logged yet. Mark watering to track consistency."
      : days <= 3
        ? `Last watered ${days === 0 ? "today" : `${days}d ago`} · ${recentLogs} logs this month`
        : `Last watered ${days}d ago: ${missedWaterTasks > 0 ? `${missedWaterTasks} missed task(s)` : "consider watering soon"}`;

  return { score, label, detail };
}

export function computeFertilizerConsistency(
  lastFertilizedAt: string | null,
  careLogs: PlantCareLog[],
  missedFertTasks: number,
  now = new Date()
): ConsistencyMetric {
  const recentLogs = logsInWindow(careLogs, ["fertilize"], 90, now);
  const days = daysSince(lastFertilizedAt, now);

  let score = 35;
  if (days !== null) {
    if (days <= 21) score += 35;
    else if (days <= 45) score += 20;
    else if (days <= 60) score += 5;
    else score -= 15;
  }
  score += Math.min(25, recentLogs * 10);
  score -= missedFertTasks * 10;
  score = Math.max(0, Math.min(100, score));

  const label =
    score >= 70 ? "On schedule" : score >= 50 ? "Fair" : score >= 30 ? "Overdue" : "Not tracked";

  const detail =
    days === null
      ? "No fertilizer logged. Most plants benefit from seasonal feeding."
      : `Last fed ${days}d ago · ${recentLogs} feeding(s) in 90 days`;

  return { score, label, detail };
}

export function computePhotoProgress(
  photoCount: number,
  growthEntryCount: number,
  lastGrowthPhotoAt: string | null,
  healthScanCount: number,
  now = new Date()
): ConsistencyMetric {
  let score = 10;
  score += Math.min(35, photoCount * 7);
  score += Math.min(25, growthEntryCount * 8);
  score += Math.min(20, healthScanCount * 10);

  const growthDays = daysSince(lastGrowthPhotoAt, now);
  if (growthDays !== null && growthDays <= 30) score += 15;
  else if (growthDays !== null && growthDays <= 60) score += 8;

  score = Math.max(0, Math.min(100, score));

  const label =
    score >= 70 ? "Rich timeline" : score >= 45 ? "Building" : score >= 25 ? "Early" : "Add photos";

  const detail =
    photoCount === 0
      ? "Upload growth photos to start visual progress tracking."
      : `${photoCount} photo(s) · ${growthEntryCount} growth log(s) · ${healthScanCount} health scan(s)`;

  return { score, label, detail };
}
