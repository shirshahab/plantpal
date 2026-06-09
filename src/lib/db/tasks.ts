import type { PlantTask, TaskStateRecord } from "@/lib/types/tasks";
import type { DbClient } from "./client";
import { safeDb } from "./client";
import { buildTaskKey, dbStatusFromState, stateFromDbRow } from "@/lib/tasks/task-key";

export interface DbPlantTask {
  id: string;
  user_id: string;
  plant_id: string | null;
  task_key: string;
  title: string;
  description: string;
  task_type: string;
  priority: string;
  due_date: string;
  completed_at: string | null;
  skipped_at: string | null;
  snoozed_until: string | null;
  source: string;
  why_it_matters: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function rowToState(row: DbPlantTask): TaskStateRecord | null {
  return stateFromDbRow(row);
}

export async function getTaskStates(
  db: DbClient,
  userId: string
): Promise<Record<string, TaskStateRecord>> {
  const { data, error } = await safeDb(async () => {
    const res = await db
      .from("plant_tasks")
      .select("*")
      .eq("user_id", userId)
      .or("completed_at.not.is.null,skipped_at.not.is.null,snoozed_until.not.is.null");
    return { data: (res.data ?? []) as DbPlantTask[], error: res.error };
  });

  if (error || !data) return {};

  const states: Record<string, TaskStateRecord> = {};
  for (const row of data) {
    const state = rowToState(row);
    if (state && row.task_key) {
      states[row.task_key] = state;
    }
  }
  return states;
}

export async function getTasks(db: DbClient, userId: string): Promise<DbPlantTask[]> {
  const { data } = await safeDb(async () => {
    const res = await db
      .from("plant_tasks")
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: true });
    return { data: (res.data ?? []) as DbPlantTask[], error: res.error };
  });
  return data ?? [];
}

function taskToRow(userId: string, task: PlantTask): Omit<DbPlantTask, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    plant_id: task.plantId,
    task_key: buildTaskKey(task),
    title: task.title,
    description: task.description,
    task_type: task.taskType,
    priority: task.priority,
    due_date: task.dueDate.slice(0, 10),
    completed_at: task.completedAt,
    skipped_at: null,
    snoozed_until: task.snoozedUntil ?? null,
    source: task.source,
    why_it_matters: task.whyItMatters,
    metadata: task.metadata ?? {},
  };
}

/** Upsert generated tasks without overwriting terminal states. */
export async function upsertGeneratedTasks(
  db: DbClient,
  userId: string,
  tasks: PlantTask[]
): Promise<string | null> {
  if (tasks.length === 0) return null;

  const rows = tasks.slice(0, 80).map((t) => ({
    ...taskToRow(userId, t),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await db.from("plant_tasks").upsert(rows, {
    onConflict: "user_id,task_key",
    ignoreDuplicates: true,
  });

  return error?.message ?? null;
}

export async function updateTaskState(
  db: DbClient,
  userId: string,
  task: PlantTask,
  state: TaskStateRecord
): Promise<string | null> {
  const statusFields = dbStatusFromState(state);
  const row = {
    ...taskToRow(userId, { ...task, ...state, completedAt: statusFields.completed_at ?? statusFields.skipped_at }),
    ...statusFields,
    updated_at: new Date().toISOString(),
  };

  const { error } = await db.from("plant_tasks").upsert(row, {
    onConflict: "user_id,task_key",
  });

  return error?.message ?? null;
}

export async function completeTask(
  db: DbClient,
  userId: string,
  task: PlantTask
): Promise<string | null> {
  return updateTaskState(db, userId, task, {
    status: "completed",
    completedAt: new Date().toISOString(),
  });
}

export async function skipTask(
  db: DbClient,
  userId: string,
  task: PlantTask
): Promise<string | null> {
  return updateTaskState(db, userId, task, {
    status: "skipped",
    completedAt: new Date().toISOString(),
  });
}

export async function snoozeTask(
  db: DbClient,
  userId: string,
  task: PlantTask,
  snoozedUntil: string,
  newDueDate: string
): Promise<string | null> {
  const row = {
    ...taskToRow(userId, task),
    due_date: newDueDate.slice(0, 10),
    snoozed_until: snoozedUntil,
    completed_at: null,
    skipped_at: null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await db.from("plant_tasks").upsert(row, {
    onConflict: "user_id,task_key",
  });

  return error?.message ?? null;
}
