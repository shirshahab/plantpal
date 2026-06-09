import type { PlantTask, TaskStateRecord, TaskStatus } from "@/lib/types/tasks";

/** Stable fingerprint — matches task-engine id format. */
export function buildTaskKey(task: Pick<PlantTask, "id">): string {
  return task.id;
}

export function taskKeyFromParts(
  plantId: string | null,
  taskType: string,
  dueDate: string,
  source: string,
  suffix = ""
): string {
  const plant = plantId ?? "global";
  const date = dueDate.slice(0, 10);
  return suffix ? `${taskType}-${plant}-${date}-${source}-${suffix}` : `${taskType}-${plant}-${date}`;
}

export function stateFromDbRow(row: {
  completed_at: string | null;
  skipped_at: string | null;
  snoozed_until: string | null;
  due_date: string;
}): TaskStateRecord | null {
  if (row.completed_at) {
    return { status: "completed", completedAt: row.completed_at };
  }
  if (row.skipped_at) {
    return { status: "skipped", completedAt: row.skipped_at };
  }
  if (row.snoozed_until && new Date(row.snoozed_until) > new Date()) {
    return { status: "snoozed", snoozedUntil: row.snoozed_until };
  }
  return null;
}

export function dbStatusFromState(state: TaskStateRecord): {
  completed_at: string | null;
  skipped_at: string | null;
  snoozed_until: string | null;
} {
  if (state.status === "completed") {
    return {
      completed_at: state.completedAt ?? new Date().toISOString(),
      skipped_at: null,
      snoozed_until: null,
    };
  }
  if (state.status === "skipped") {
    return {
      completed_at: null,
      skipped_at: state.completedAt ?? new Date().toISOString(),
      snoozed_until: null,
    };
  }
  if (state.status === "snoozed") {
    return {
      completed_at: null,
      skipped_at: null,
      snoozed_until: state.snoozedUntil ?? null,
    };
  }
  return { completed_at: null, skipped_at: null, snoozed_until: null };
}

export function mergeTaskStates(
  local: Record<string, TaskStateRecord>,
  remote: Record<string, TaskStateRecord>
): Record<string, TaskStateRecord> {
  return { ...local, ...remote };
}

export function isTerminalStatus(status: TaskStatus): boolean {
  return status === "completed" || status === "skipped";
}
