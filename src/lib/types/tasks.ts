export type TaskType =
  | "water"
  | "fertilize"
  | "prune"
  | "repot"
  | "inspect"
  | "scan"
  | "harvest"
  | "take_growth_photo"
  | "complete_lesson";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "pending" | "completed" | "skipped" | "snoozed";

export type TaskSource =
  | "care_schedule"
  | "ai_plan"
  | "goal_mission"
  | "weather"
  | "manual"
  | "seasonal";

export interface PlantTask {
  id: string;
  plantId: string | null;
  plantName: string;
  title: string;
  description: string;
  taskType: TaskType;
  priority: TaskPriority;
  dueDate: string;
  completedAt: string | null;
  status: TaskStatus;
  source: TaskSource;
  whyItMatters: string;
  snoozedUntil?: string | null;
  metadata?: Record<string, unknown>;
}

export interface TaskGroups {
  dueToday: PlantTask[];
  upcoming: PlantTask[];
  overdue: PlantTask[];
  completed: PlantTask[];
}

export interface CareScheduleHint {
  plantId: string;
  next7Days?: string[];
  seasonalTasks?: string[];
}

export interface ReminderSettings {
  reminderTime: string;
  watering: boolean;
  fertilizer: boolean;
  healthCheck: boolean;
  growthPhoto: boolean;
  missions: boolean;
  notificationsEnabled: boolean;
  notificationPermission: NotificationPermission | "unsupported";
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  reminderTime: "09:00",
  watering: true,
  fertilizer: true,
  healthCheck: true,
  growthPhoto: true,
  missions: true,
  notificationsEnabled: false,
  notificationPermission: "default",
};

export interface PlantCareLog {
  id: string;
  plantId: string;
  actionType: TaskType | string;
  notes: string;
  photoUrl: string | null;
  createdAt: string;
}

export interface TaskStateRecord {
  status: TaskStatus;
  completedAt?: string | null;
  snoozedUntil?: string | null;
}
