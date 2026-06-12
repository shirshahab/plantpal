/**
 * Action-based task validation. Tasks cannot be marked complete unless the
 * real action happened (or the user confirms a care action like watering).
 */

import type { PlantTask, TaskType } from "@/lib/types/tasks";

export type RequiredAction =
  | "start_lesson"
  | "take_photo"
  | "mark_watered"
  | "mark_pruned"
  | "mark_fed"
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
  confirmMessage?: string;
}

const ACTION_BY_TYPE: Record<TaskType, Omit<TaskActionConfig, "href"> & { href?: string | null }> = {
  complete_lesson: {
    requiredAction: "start_lesson",
    validationRequired: true,
    primaryLabel: "Start Lesson",
    allowSkip: false,
    allowManualComplete: false,
  },
  take_growth_photo: {
    requiredAction: "take_photo",
    validationRequired: true,
    primaryLabel: "Take Photo",
    allowSkip: true,
    allowManualComplete: false,
  },
  scan: {
    requiredAction: "inspect_plant",
    validationRequired: true,
    primaryLabel: "Inspect Plant",
    href: "/scanner",
    allowSkip: true,
    allowManualComplete: false,
  },
  inspect: {
    requiredAction: "inspect_plant",
    validationRequired: true,
    primaryLabel: "Inspect Plant",
    allowSkip: true,
    allowManualComplete: false,
  },
  water: {
    requiredAction: "mark_watered",
    validationRequired: true,
    primaryLabel: "Mark Watered",
    allowSkip: true,
    allowManualComplete: false,
    confirmMessage: "Did you water this plant?",
  },
  prune: {
    requiredAction: "mark_pruned",
    validationRequired: true,
    primaryLabel: "Mark Pruned",
    allowSkip: true,
    allowManualComplete: false,
    confirmMessage: "Did you prune this plant?",
  },
  fertilize: {
    requiredAction: "mark_fed",
    validationRequired: true,
    primaryLabel: "Mark Fed",
    allowSkip: true,
    allowManualComplete: false,
    confirmMessage: "Did you feed this plant?",
  },
  repot: {
    requiredAction: "none",
    validationRequired: true,
    primaryLabel: "Mark Repotted",
    allowSkip: true,
    allowManualComplete: false,
    confirmMessage: "Did you repot this plant?",
  },
  harvest: {
    requiredAction: "none",
    validationRequired: false,
    primaryLabel: "Mark Harvested",
    allowSkip: true,
    allowManualComplete: true,
  },
};

function lessonHref(task: PlantTask): string {
  const lessonId = task.metadata?.lessonId as string | undefined;
  if (lessonId) return `/academy/lesson/${lessonId}`;
  const href = task.metadata?.href as string | undefined;
  return href ?? "/academy";
}

function photoHref(task: PlantTask): string | null {
  if (task.plantId) return `/plants/${task.plantId}#growth`;
  return "/scanner";
}

function inspectHref(task: PlantTask): string | null {
  if (task.taskType === "scan") return "/scanner";
  if (task.plantId) return `/plants/${task.plantId}`;
  return "/scanner";
}

/** Whether the user has opened this lesson in the current browser session. */
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
  let href = base.href ?? null;

  if (task.taskType === "complete_lesson") {
    href = lessonHref(task);
    const lessonId = task.metadata?.lessonId as string | undefined;
    const label =
      lessonId && isLessonStarted(lessonId) ? "Continue Lesson" : "Start Lesson";
    return { ...base, href, primaryLabel: label };
  }
  if (task.taskType === "take_growth_photo") href = photoHref(task);
  if (task.taskType === "scan" || task.taskType === "inspect") href = inspectHref(task);
  if (task.plantId && !href) {
    href = `/plants/${task.plantId}`;
  }

  return { ...base, href };
}

/** Manual "Done" tap is never allowed for validated task types. */
export function canManuallyCompleteTask(task: PlantTask): boolean {
  return getTaskActionConfig(task).allowManualComplete;
}

export function validateTaskCompletion(
  task: PlantTask,
  options?: { validated?: boolean; source?: CompletionSource }
): { ok: boolean; reason?: string } {
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
