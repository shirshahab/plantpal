/**
 * Recovery Plan tasks — small, grouped follow-ups generated from active
 * health reports. Deliberately capped: a diagnosis adds at most 3–4 gentle
 * check-ins, never a wall of work.
 */
import type { PlantTask } from "@/lib/types/tasks";
import type { HealthIssueId, ProHealthReport } from "@/lib/types/health";

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

function clampToToday(due: string, todayStr: string): string {
  return due < todayStr ? todayStr : due;
}

/** Issue-specific middle task — one targeted check, not a checklist. */
function issueCheckTask(issueId: HealthIssueId | null): {
  title: string;
  description: string;
} | null {
  switch (issueId) {
    case "spider_mites":
    case "thrips":
    case "whiteflies":
    case "aphids":
    case "mealybugs":
    case "scale":
      return {
        title: "Check leaf undersides",
        description: "Look for pests, eggs, or webbing returning on the undersides.",
      };
    case "powdery_mildew":
    case "poor_airflow":
    case "botrytis_risk":
      return {
        title: "Improve airflow",
        description: "Confirm air is moving gently around the plant and humidity stays moderate.",
      };
    case "root_rot":
    case "overwatering":
      return {
        title: "Check soil moisture",
        description: "Soil should be drying between waterings — water only when the top inch is dry.",
      };
    case "nutrient_burn":
      return {
        title: "Watch leaf tips",
        description: "Existing burn won't reverse — confirm no new tips are browning.",
      };
    default:
      return null;
  }
}

const MAX_REPORTS_WITH_TASKS = 3;

export function buildRecoveryTasks(
  reports: ProHealthReport[],
  today: Date
): PlantTask[] {
  const todayStr = dateKey(today);
  const tasks: PlantTask[] = [];

  for (const report of reports.slice(0, MAX_REPORTS_WITH_TASKS)) {
    const meta = { recovery: true, healthReportId: report.id };
    const base = {
      plantId: report.plantId,
      plantName: report.species,
      status: "pending" as const,
      completedAt: null,
      source: "manual" as const,
      metadata: meta,
    };

    // 1. Rescan 48 hours after diagnosis.
    tasks.push({
      ...base,
      id: `recovery-rescan-${report.id}`,
      title: `Rescan ${report.species}`,
      description: `Re-check the ${report.diagnosis.likelyIssue.toLowerCase()} signs and update the report.`,
      taskType: "scan",
      priority: report.diagnosis.severity === "severe" ? "urgent" : "high",
      dueDate: clampToToday(addDays(report.createdAt, 2), todayStr),
      whyItMatters: "A 48-hour rescan shows whether the remedy plan is working.",
    });

    // 2. One issue-specific check (if the issue has one).
    const check = issueCheckTask(report.diagnosis.issueId);
    if (check) {
      tasks.push({
        ...base,
        id: `recovery-check-${report.id}`,
        title: `${check.title}: ${report.species}`,
        description: check.description,
        taskType: "inspect",
        priority: "medium",
        dueDate: clampToToday(addDays(report.createdAt, 1), todayStr),
        whyItMatters: "Targeted checks catch a relapse before it spreads.",
      });
    }

    // 3. Progress photo one week in.
    tasks.push({
      ...base,
      id: `recovery-photo-${report.id}`,
      title: `Progress photo: ${report.species}`,
      description: "Photograph the same affected areas to compare against the diagnosis.",
      taskType: "take_growth_photo",
      priority: "low",
      dueDate: clampToToday(addDays(report.createdAt, 7), todayStr),
      whyItMatters: "Side-by-side photos make recovery (or relapse) obvious.",
    });
  }

  return tasks;
}

export function isRecoveryTask(task: PlantTask): boolean {
  return task.metadata?.recovery === true;
}
