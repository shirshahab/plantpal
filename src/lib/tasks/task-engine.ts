import type { Plant } from "@/lib/types";
import type { AICarePlanResponse } from "@/lib/types/ai";
import type { PlantMission } from "@/lib/types/care-goals";
import type { LocationProfile } from "@/lib/types/location";
import { generateWeatherAwareTasks } from "@/lib/location/climate-rules";
import type { WeatherSnapshot } from "@/lib/types/phase6";
import type {
  CareScheduleHint,
  PlantTask,
  ReminderSettings,
  TaskGroups,
  TaskPriority,
  TaskSource,
  TaskStateRecord,
  TaskType,
} from "@/lib/types/tasks";
import { daysSince } from "@/lib/plants/utils";
import { LESSONS } from "@/lib/education/lessons";
import { dedupeTodayTasks } from "@/lib/tasks/dedupe-tasks";
import {
  generateWeeklyCheckTask,
  shouldGenerateWeeklyCheck,
} from "@/lib/tasks/weekly-check";

export interface GeneratePlantTasksInput {
  plants: Plant[];
  careSchedules: CareScheduleHint[];
  aiPlans: Record<string, AICarePlanResponse | null>;
  missions: PlantMission[];
  weather: WeatherSnapshot | null;
  locationProfile: LocationProfile | null;
  today: Date;
  taskStates: Record<string, TaskStateRecord>;
  reminders: ReminderSettings;
  completedLessonIds: string[];
  passedQuizIds: string[];
  /** Pre-built tasks from other systems (e.g. health Recovery Plans). */
  extraTasks?: PlantTask[];
}

/** Local-timezone YYYY-MM-DD key. Using toISOString here would shift the
 * date for evening users (UTC rollover) and mislabel tasks as overdue. */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD key as local midnight (new Date(str) would be UTC). */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function applyState(task: PlantTask, states: Record<string, TaskStateRecord>): PlantTask {
  const s = states[task.id];
  if (!s) return task;
  return {
    ...task,
    status: s.status,
    completedAt: s.completedAt ?? null,
    snoozedUntil: s.snoozedUntil ?? null,
  };
}

function isSnoozed(task: PlantTask, today: Date): boolean {
  if (task.status !== "snoozed" || !task.snoozedUntil) return false;
  return new Date(task.snoozedUntil) > today;
}

function makeTask(
  partial: Omit<PlantTask, "status" | "completedAt"> & { status?: PlantTask["status"] }
): PlantTask {
  return {
    status: "pending",
    completedAt: null,
    ...partial,
  };
}

function waterPriority(plant: Plant, waterDays: number): TaskPriority {
  if (waterDays >= plant.waterFrequencyDays + 2) return "urgent";
  if (waterDays >= plant.waterFrequencyDays) return "high";
  return "medium";
}

function missionTaskType(type: string): TaskType {
  const map: Record<string, TaskType> = {
    water: "water",
    fertilize: "fertilize",
    prune: "prune",
    inspect: "weekly_check",
    photo: "take_growth_photo",
    repot: "repot",
  };
  return map[type] ?? "weekly_check";
}

export function generatePlantTasks(input: GeneratePlantTasksInput): TaskGroups {
  const {
    plants,
    missions,
    weather,
    today,
    taskStates,
    reminders,
    completedLessonIds,
    passedQuizIds,
    locationProfile,
  } = input;

  const todayStart = startOfDay(today);
  const todayStr = dateKey(todayStart);
  const raw: PlantTask[] = [];

  const heatAlert = weather?.alerts.some((a) => a.type === "heat") ?? false;
  const rainAlert = weather?.alerts.some((a) => a.type === "rain") ?? false;

  for (const plant of plants) {
    // When no care has been logged yet, anchor schedules to the day the plant
    // was added — a brand-new plant should never start with overdue tasks.
    const ageDays = daysSince(plant.createdAt) ?? 0;
    const waterDays = daysSince(plant.lastWateredAt) ?? ageDays;
    const fertDays = daysSince(plant.lastFertilizedAt) ?? ageDays;
    const fertDueDays = plant.fertilizeFrequencyWeeks * 7;

    if (reminders.watering) {
      const waterAnchor = plant.lastWateredAt ?? plant.createdAt;
      const due = waterDays >= plant.waterFrequencyDays;
      const overdue = waterDays > plant.waterFrequencyDays;
      const dueDate = dateKey(
        addDays(startOfDay(new Date(waterAnchor)), plant.waterFrequencyDays)
      );

      if (due || overdue) {
        const skipForRain = rainAlert && !overdue && plant.locationType === "outdoor";
        if (!skipForRain) {
          let priority = waterPriority(plant, waterDays);
          if (heatAlert && plant.locationType === "outdoor") {
            priority = priority === "medium" ? "high" : "urgent";
          }
          raw.push(
            makeTask({
              id: `water-${plant.id}-${dueDate}`,
              plantId: plant.id,
              plantName: plant.name,
              title: `Water ${plant.name}`,
              description:
                plant.lastWateredAt === null
                  ? "Check the top inch of soil first. Plants drink. They do not enjoy drowning."
                  : heatAlert
                    ? `Heat alert: last watered ${waterDays} day(s) ago. Check soil today.`
                    : "Check the top inch of soil first. Plants drink. They do not enjoy drowning.",
              taskType: "water",
              priority,
              dueDate,
              source: "care_schedule",
              whyItMatters: "Consistent watering keeps roots healthy and prevents stress.",
            })
          );
        }
      }
    }

    if (reminders.fertilizer && !heatAlert) {
      const fertAnchor = plant.lastFertilizedAt ?? plant.createdAt;
      const overdue = fertDays >= fertDueDays;
      const dueDate = dateKey(
        addDays(startOfDay(new Date(fertAnchor)), fertDueDays)
      );

      if (overdue || dueDate === todayStr) {
        raw.push(
          makeTask({
            id: `fertilize-${plant.id}-${dueDate}`,
            plantId: plant.id,
            plantName: plant.name,
            title: `Feed ${plant.name}`,
            description: "Time for nutrients. Tiny plant buffet.",
            taskType: "fertilize",
            priority: overdue ? "high" : "medium",
            dueDate: overdue ? todayStr : dueDate,
            source: "care_schedule",
            whyItMatters: "Nutrients support leaves, flowers, and fruit based on your goals.",
          })
        );
      }
    }

    if (plant.healthStatus === "critical") {
      raw.push(
        makeTask({
          id: `scan-${plant.id}-${todayStr}`,
          plantId: plant.id,
          plantName: plant.name,
          title: `Urgent check: ${plant.name}`,
          description: "This plant needs attention now. Look at leaves, soil, and roots if you can.",
          taskType: "scan",
          priority: "urgent",
          dueDate: todayStr,
          source: "care_schedule",
          whyItMatters: "Critical status means waiting makes recovery harder.",
        })
      );
    }

    if (
      reminders.healthCheck &&
      ageDays >= 3 &&
      shouldGenerateWeeklyCheck(plant, taskStates, todayStart)
    ) {
      raw.push(makeTask(generateWeeklyCheckTask(plant, todayStart)));
    }

    if (plant.photoStatus === "needs_photo") {
      raw.push(
        makeTask({
          id: `add-photo-${plant.id}`,
          plantId: plant.id,
          plantName: plant.name,
          title: `Add a photo of ${plant.name}`,
          description: "Capture a real photo when you're near the plant.",
          taskType: "take_growth_photo",
          priority: "medium",
          dueDate: todayStr,
          source: "manual",
          whyItMatters: "A photo helps ID issues and track growth over time.",
        })
      );
    }

  }

  if (reminders.missions && plants.length > 5) {
    for (const m of missions) {
      if (m.status !== "active") continue;
      if (m.taskType === "inspect" || m.taskType === "photo") continue;
      raw.push(
        makeTask({
          id: `mission-${m.id}`,
          plantId: m.plantId,
          plantName: plants.find((p) => p.id === m.plantId)?.name ?? "Plant",
          title: m.title,
          description: m.description,
          taskType: missionTaskType(m.taskType),
          priority: "medium",
          dueDate: todayStr,
          source: "goal_mission",
          whyItMatters: "Completing missions moves you toward your plant goals.",
          metadata: { missionId: m.id, rewardPoints: m.rewardPoints },
        })
      );
    }
  }

  if (weather && locationProfile) {
    const weatherTasks = generateWeatherAwareTasks(weather, plants, locationProfile, todayStr)
      .sort((a, b) => {
        const rank = { urgent: 0, high: 1, medium: 2, low: 3 };
        return rank[a.priority] - rank[b.priority];
      })
      .slice(0, 1);
    raw.push(...weatherTasks);
  } else if (weather?.alerts?.length) {
    const alert = weather.alerts[0];
    raw.push(
      makeTask({
        id: `weather-${todayStr}-0`,
        plantId: null,
        plantName: "Garden",
        title: alert.title,
        description: alert.wateringAdjustment || alert.message,
        taskType: "water",
        priority: alert.severity === "critical" ? "urgent" : "high",
        dueDate: todayStr,
        source: "weather",
        whyItMatters: alert.message,
      })
    );
  }

  if (input.extraTasks?.length) {
    raw.push(...input.extraTasks);
  }

  const nextLesson = LESSONS.find(
    (l) => !passedQuizIds.includes(l.id) && !completedLessonIds.includes(l.id)
  );
  if (nextLesson && plants.length > 3) {
    raw.push(
      makeTask({
        id: `lesson-${nextLesson.id}-${todayStr}`,
        plantId: null,
        plantName: "Learn",
        title: nextLesson.title,
        description: "Pass the quiz to clear this task. Planty is watching.",
        taskType: "complete_lesson",
        priority: "low",
        dueDate: todayStr,
        source: "manual",
        whyItMatters: "Small daily learning builds confident plant care habits.",
        metadata: {
          lessonId: nextLesson.id,
          href: `/academy/lesson/${nextLesson.id}`,
        },
      })
    );
  }

  const withState = raw.map((t) => applyState(t, taskStates));
  const active = withState.filter(
    (t) => t.status !== "completed" && t.status !== "skipped" && !isSnoozed(t, todayStart)
  );
  const dedupedActive = dedupeTodayTasks(active, plants);
  const completed = withState.filter((t) => t.status === "completed");
  const snoozedPending = withState.filter((t) => isSnoozed(t, todayStart));

  const dueToday: PlantTask[] = [];
  const overdue: PlantTask[] = [];
  const upcoming: PlantTask[] = [];

  for (const task of dedupedActive) {
    const due = parseDateKey(task.dueDate);
    if (due.getTime() < todayStart.getTime()) {
      overdue.push(task);
    } else if (due.getTime() === todayStart.getTime()) {
      dueToday.push(task);
    } else {
      upcoming.push(task);
    }
  }

  upcoming.push(...snoozedPending);

  const priorityOrder: Record<TaskPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const sortFn = (a: PlantTask, b: PlantTask) =>
    priorityOrder[a.priority] - priorityOrder[b.priority];

  return {
    dueToday: dueToday.sort(sortFn),
    overdue: overdue.sort(sortFn),
    upcoming: upcoming.sort(sortFn),
    completed: completed.sort(
      (a, b) =>
        new Date(b.completedAt ?? 0).getTime() -
        new Date(a.completedAt ?? 0).getTime()
    ),
  };
}

/** Tasks for a specific calendar day (for /calendar). */
export function getTasksForDate(groups: TaskGroups, day: Date): PlantTask[] {
  const key = dateKey(day);
  const all = [...groups.dueToday, ...groups.upcoming, ...groups.overdue, ...groups.completed];
  return all.filter((t) => t.dueDate.slice(0, 10) === key);
}
