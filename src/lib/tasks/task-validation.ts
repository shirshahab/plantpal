/**
 * Action-based task validation. Tasks cannot be marked complete unless the
 * real action happened (or the user confirms a care action like watering).
 */

import type { PlantTask, TaskType } from "@/lib/types/tasks";
import { isRecoveryTask } from "@/lib/health/recovery-tasks";

export type RequiredAction =
  | "start_lesson"
  | "take_photo"
  | "mark_watered"
  | "mark_pruned"
  | "mark_fed"
  | "weekly_check"
  | "inspect_plant"
  | "none";

export type CompletionSource =
  | "manual_confirm"
  | "lesson_quiz_passed"
  | "photo_uploaded"
  | "health_scan"
  | "care_log";

export interface TaskActionConfig {
  requiredAction: RequiredAction;
  validationRequired: boolean;
  primaryLabel: string;
  href: string | null;
  allowSkip: boolean;
  allowManualComplete: boolean;
  /** True only when user explicitly chose a scan/photo flow */
  opensScanner: boolean;
}

const ACTION_BY_TYPE: Record<TaskType, Omit<TaskActionConfig, "href" | "opensScanner"> & { href?: string | null }> = {
  complete_lesson: {
    requiredAction: "start_lesson",
    validationRequired: true,
    primaryLabel: "Go to Lesson",
    allowSkip: false,
    allowManualComplete: false,
  },
  take_growth_photo: {
    requiredAction: "take_photo",
    validationRequired: true,
    primaryLabel: "Take Photo",
    allowSkip: false,
    allowManualComplete: false,
  },
  scan: {
    requiredAction: "inspect_plant",
    validationRequired: true,
    primaryLabel: "Mark Checked",
    allowSkip: false,
    allowManualComplete: false,
  },
  inspect: {
    requiredAction: "inspect_plant",
    validationRequired: true,
    primaryLabel: "Mark Checked",
    allowSkip: false,
    allowManualComplete: false,
  },
  weekly_check: {
    requiredAction: "weekly_check",
    validationRequired: true,
    primaryLabel: "Start Check",
    allowSkip: false,
    allowManualComplete: false,
  },
  water: {
    requiredAction: "mark_watered",
    validationRequired: true,
    primaryLabel: "Mark Watered",
    allowSkip: false,
    allowManualComplete: false,
  },
  prune: {
    requiredAction: "mark_pruned",
    validationRequired: true,
    primaryLabel: "Mark Pruned",
    allowSkip: false,
    allowManualComplete: false,
  },
  fertilize: {
    requiredAction: "mark_fed",
    validationRequired: true,
    primaryLabel: "Mark Fed",
    allowSkip: false,
    allowManualComplete: false,
  },
  repot: {
    requiredAction: "none",
    validationRequired: true,
    primaryLabel: "Mark Repotted",
    allowSkip: false,
    allowManualComplete: false,
  },
  harvest: {
    requiredAction: "none",
    validationRequired: false,
    primaryLabel: "Mark Harvested",
    allowSkip: false,
    allowManualComplete: true,
  },
};

function lessonHref(task: PlantTask): string {
  const lessonId = task.metadata?.lessonId as string | undefined;
  if (lessonId) return `/academy/lesson/${lessonId}`;
  const href = task.metadata?.href as string | undefined;
  return href ?? "/academy";
}

function growthPhotoHref(task: PlantTask): string | null {
  if (task.plantId) return `/plants/${task.plantId}#growth`;
  return null;
}

function recoveryReportHref(task: PlantTask): string | null {
  const id = task.metadata?.healthReportId as string | undefined;
  if (id) return `/doctor/pro/report/${id}`;
  return null;
}

export function isExplicitScannerTask(task: PlantTask): boolean {
  return (
    task.metadata?.openScanner === true ||
    (task.taskType === "take_growth_photo" && task.metadata?.useScanner === true)
  );
}

/** Whether primary action routes to /scanner (for debug checks). */
export function taskPrimaryRoutesToScanner(task: PlantTask): boolean {
  return getTaskActionConfig(task).opensScanner;
}

export function isLessonStarted(lessonId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(`plantpal-lesson-started-${lessonId}`) === "1";
  } catch {
    return false;
  }
}

export function markLessonStarted(lessonId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`plantpal-lesson-started-${lessonId}`, "1");
  } catch {
    /* ignore */
  }
}

export function getTaskActionConfig(task: PlantTask): TaskActionConfig {
  const base = ACTION_BY_TYPE[task.taskType];
  let href: string | null = base.href ?? null;
  let primaryLabel = base.primaryLabel;
  let opensScanner = false;

  if (task.source === "weather") {
    return {
      ...base,
      primaryLabel: "Got It",
      href: null,
      opensScanner: false,
    };
  }

  if (isRecoveryTask(task)) {
    const reportHref = recoveryReportHref(task);
    if (task.taskType === "scan" && reportHref) {
      return {
        ...base,
        primaryLabel: "View Plan",
        href: reportHref,
        opensScanner: false,
      };
    }
    if (task.taskType === "take_growth_photo") {
      return {
        ...base,
        primaryLabel: "Take Photo",
        href: growthPhotoHref(task),
        opensScanner: false,
      };
    }
    return {
      ...base,
      primaryLabel: "Mark Checked",
      href: null,
      opensScanner: false,
    };
  }

  if (task.taskType === "complete_lesson") {
    href = lessonHref(task);
    const lessonId = task.metadata?.lessonId as string | undefined;
    primaryLabel =
      lessonId && isLessonStarted(lessonId) ? "Continue Lesson" : "Go to Lesson";
    return { ...base, href, primaryLabel, opensScanner: false };
  }

  if (task.taskType === "take_growth_photo") {
    href = growthPhotoHref(task);
    if (isExplicitScannerTask(task)) {
      href = "/scanner?tab=progress";
      opensScanner = true;
    }
    return { ...base, href, primaryLabel: "Take Photo", opensScanner };
  }

  if (task.taskType === "scan" || task.taskType === "inspect") {
    return {
      ...base,
      primaryLabel: "Mark Checked",
      href: null,
      opensScanner: false,
    };
  }

  if (task.taskType === "weekly_check") {
    return { ...base, primaryLabel: "Start Check", href: null, opensScanner: false };
  }

  return { ...base, href, primaryLabel, opensScanner: false };
}

export function canManuallyCompleteTask(task: PlantTask): boolean {
  return getTaskActionConfig(task).allowManualComplete;
}

export function validateTaskCompletion(
  task: PlantTask,
  options?: { validated?: boolean; source?: CompletionSource }
): { ok: boolean; reason?: string } {
  if (task.taskType === "complete_lesson" && options?.source !== "lesson_quiz_passed") {
    return { ok: false, reason: "Pass the quiz to clear this task." };
  }
  if (options?.validated) return { ok: true };
  const config = getTaskActionConfig(task);
  if (!config.validationRequired || config.allowManualComplete) {
    return { ok: true };
  }
  return {
    ok: false,
    reason: `Use "${config.primaryLabel}" to finish this task.`,
  };
}

export function taskMatchesPlantAction(
  task: PlantTask,
  plantId: string,
  types: TaskType[]
): boolean {
  return task.plantId === plantId && types.includes(task.taskType) && task.status === "pending";
}

export const WATER_COMPLETE_COPY = [
  "Nice. This plant has withdrawn its complaint.",
  "Water logged. Nobody died today.",
  "Hydration entered into evidence.",
] as const;

export const FERTILIZE_COMPLETE_COPY = [
  "Fed. This plant may now stop being dramatic.",
] as const;

export const WEEKLY_CHECK_COMPLETE_COPY =
  "Weekly check complete. Planty found no crimes. For now.";

export const LESSON_COMPLETE_COPY =
  "Lesson passed. Your plant lawyer is impressed.";

export function pickRandomCopy(lines: readonly string[]): string {
  const idx = Math.floor(Date.now() / 86_400_000) % lines.length;
  return lines[idx] ?? lines[0];
}

/** Debug: scan task configs for accidental /scanner routes. */
export function findScannerTaskRoutes(): { taskType: TaskType; label: string }[] {
  const types = Object.keys(ACTION_BY_TYPE) as TaskType[];
  const issues: { taskType: TaskType; label: string }[] = [];
  for (const taskType of types) {
    const sample = {
      id: "debug",
      plantId: "p1",
      plantName: "Test",
      title: "Test",
      description: "",
      taskType,
      priority: "medium" as const,
      dueDate: "2026-01-01",
      completedAt: null,
      status: "pending" as const,
      source: "care_schedule" as const,
      whyItMatters: "",
    };
    if (taskPrimaryRoutesToScanner(sample)) {
      issues.push({ taskType, label: getTaskActionConfig(sample).primaryLabel });
    }
  }
  return issues;
}
