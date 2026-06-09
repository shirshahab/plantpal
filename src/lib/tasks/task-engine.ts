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
import { calculatePlantHealthScore } from "@/lib/scoring";
import { LESSONS } from "@/lib/education/lessons";

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
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
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

function waterPriority(plant: Plant): TaskPriority {
  const days = daysSince(plant.lastWateredAt);
  if (days === null || days >= plant.waterFrequencyDays + 2) return "urgent";
  if (days >= plant.waterFrequencyDays) return "high";
  return "medium";
}

function missionTaskType(type: string): TaskType {
  const map: Record<string, TaskType> = {
    water: "water",
    fertilize: "fertilize",
    prune: "prune",
    inspect: "inspect",
    photo: "take_growth_photo",
    repot: "repot",
  };
  return map[type] ?? "inspect";
}

function seasonalTasks(month: number, plant: Plant): PlantTask[] {
  const tasks: PlantTask[] = [];
  const due = dateKey(new Date());

  if (month >= 2 && month <= 4) {
    tasks.push(
      makeTask({
        id: `seasonal-spring-feed-${plant.id}-${due}`,
        plantId: plant.id,
        plantName: plant.name,
        title: `Spring feeding for ${plant.name}`,
        description: "Active growth season — a light feed may help.",
        taskType: "fertilize",
        priority: "medium",
        dueDate: due,
        source: "seasonal",
        whyItMatters: "Spring is when most plants wake up and need nutrients.",
      })
    );
  }
  if (month >= 8 && month <= 10 && plant.locationType === "outdoor") {
    tasks.push(
      makeTask({
        id: `seasonal-fall-prep-${plant.id}-${due}`,
        plantId: plant.id,
        plantName: plant.name,
        title: `Fall prep for ${plant.name}`,
        description: "Check mulch and reduce feeding as growth slows.",
        taskType: "inspect",
        priority: "low",
        dueDate: due,
        source: "seasonal",
        whyItMatters: "Outdoor plants need a gentle transition before cooler weather.",
      })
    );
  }
  if (month === 11 || month === 0) {
    tasks.push(
      makeTask({
        id: `seasonal-winter-check-${plant.id}-${due}`,
        plantId: plant.id,
        plantName: plant.name,
        title: `Winter check on ${plant.name}`,
        description: "Watch for overwatering and cold drafts indoors.",
        taskType: "inspect",
        priority: "low",
        dueDate: due,
        source: "seasonal",
        whyItMatters: "Winter stress is common — catch it early.",
      })
    );
  }
  return tasks;
}

export function generatePlantTasks(input: GeneratePlantTasksInput): TaskGroups {
  const {
    plants,
    aiPlans,
    missions,
    weather,
    today,
    taskStates,
    reminders,
    completedLessonIds,
    locationProfile,
  } = input;

  const todayStart = startOfDay(today);
  const todayStr = dateKey(todayStart);
  const month = today.getMonth();
  const raw: PlantTask[] = [];

  const heatAlert = weather?.alerts.some((a) => a.type === "heat") ?? false;
  const rainAlert = weather?.alerts.some((a) => a.type === "rain") ?? false;

  for (const plant of plants) {
    const waterDays = daysSince(plant.lastWateredAt);
    const fertDays = daysSince(plant.lastFertilizedAt);
    const fertDueDays = plant.fertilizeFrequencyWeeks * 7;
    const healthScore = calculatePlantHealthScore(plant);

    if (reminders.watering) {
      const due =
        waterDays === null || waterDays >= plant.waterFrequencyDays;
      const overdue = waterDays !== null && waterDays > plant.waterFrequencyDays;
      const dueDate = overdue
        ? dateKey(addDays(todayStart, -1))
        : waterDays === null
          ? todayStr
          : dateKey(addDays(new Date(plant.lastWateredAt!), plant.waterFrequencyDays));

      if (due || overdue) {
        if (rainAlert && !overdue && plant.locationType === "outdoor") {
          continue;
        }
        let priority = waterPriority(plant);
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
              waterDays === null
                ? "No watering logged yet — check soil moisture."
                : heatAlert
                  ? `Heat alert — last watered ${waterDays} day(s) ago. Check soil today.`
                  : `Last watered ${waterDays} day(s) ago.`,
            taskType: "water",
            priority,
            dueDate,
            source: "care_schedule",
            whyItMatters: "Consistent watering keeps roots healthy and prevents stress.",
          })
        );
      }
    }

    if (reminders.fertilizer) {
      const dueSoon =
        fertDays === null || fertDays >= fertDueDays - 3;
      const overdue = fertDays !== null && fertDays >= fertDueDays;
      if (dueSoon && !heatAlert) {
        const dueDate = overdue
          ? dateKey(addDays(todayStart, -2))
          : dateKey(addDays(todayStart, 3));
        raw.push(
          makeTask({
            id: `fertilize-${plant.id}-${dueDate}`,
            plantId: plant.id,
            plantName: plant.name,
            title: `Fertilize ${plant.name}`,
            description: `Feed every ${plant.fertilizeFrequencyWeeks} weeks during active growth.`,
            taskType: "fertilize",
            priority: overdue ? "high" : "medium",
            dueDate,
            source: "care_schedule",
            whyItMatters: "Nutrients support leaves, flowers, and fruit based on your goals.",
          })
        );
      }
    }

    if (reminders.healthCheck && (healthScore < 75 || plant.healthStatus !== "healthy")) {
      raw.push(
        makeTask({
          id: `scan-${plant.id}-${todayStr}`,
          plantId: plant.id,
          plantName: plant.name,
          title: `Health check: ${plant.name}`,
          description: "Score is lower than usual — inspect leaves and soil.",
          taskType: "scan",
          priority: plant.healthStatus === "critical" ? "urgent" : "high",
          dueDate: todayStr,
          source: "care_schedule",
          whyItMatters: "Catching problems early makes recovery much easier.",
        })
      );
    }

    if (reminders.growthPhoto) {
      const photoDays = daysSince(plant.lastGrowthPhotoAt ?? null);
      const interval = healthScore >= 80 ? 30 : 14;
      if (photoDays === null || photoDays >= interval) {
        raw.push(
          makeTask({
            id: `photo-${plant.id}-${todayStr}`,
            plantId: plant.id,
            plantName: plant.name,
            title: `Growth photo: ${plant.name}`,
            description: "Snap from the same angle to track progress.",
            taskType: "take_growth_photo",
            priority: "low",
            dueDate: todayStr,
            source: "goal_mission",
            whyItMatters: "Photos help you see slow growth you'd otherwise miss.",
          })
        );
      }
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

    const ai = aiPlans[plant.id];
    if (ai?.next_7_days?.length) {
      ai.next_7_days.slice(0, 2).forEach((tip, i) => {
        raw.push(
          makeTask({
            id: `ai-${plant.id}-${todayStr}-${i}`,
            plantId: plant.id,
            plantName: plant.name,
            title: tip.slice(0, 60),
            description: tip,
            taskType: "inspect",
            priority: "medium",
            dueDate: todayStr,
            source: "ai_plan",
            whyItMatters: "From your AI care plan — tailored to this plant.",
          })
        );
      });
    }

    raw.push(...seasonalTasks(month, plant));
  }

  if (reminders.missions) {
    for (const m of missions) {
      if (m.status !== "active") continue;
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
    raw.push(...generateWeatherAwareTasks(weather, plants, locationProfile, todayStr));
  } else if (weather?.alerts?.length) {
    weather.alerts.forEach((alert, i) => {
      raw.push(
        makeTask({
          id: `weather-${todayStr}-${i}`,
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
    });
  }

  const nextLesson = LESSONS.find((l) => !completedLessonIds.includes(l.id));
  if (nextLesson) {
    raw.push(
      makeTask({
        id: `lesson-${nextLesson.id}-${todayStr}`,
        plantId: null,
        plantName: "Learn",
        title: `Complete lesson: ${nextLesson.title}`,
        description: nextLesson.description,
        taskType: "complete_lesson",
        priority: "low",
        dueDate: todayStr,
        source: "manual",
        whyItMatters: "Small daily learning builds confident plant care habits.",
        metadata: { lessonId: nextLesson.id, href: `/learn/${nextLesson.id}` },
      })
    );
  }

  const withState = raw.map((t) => applyState(t, taskStates));
  const active = withState.filter(
    (t) => t.status !== "completed" && t.status !== "skipped" && !isSnoozed(t, todayStart)
  );
  const completed = withState.filter((t) => t.status === "completed");
  const snoozedPending = withState.filter((t) => isSnoozed(t, todayStart));

  const dueToday: PlantTask[] = [];
  const overdue: PlantTask[] = [];
  const upcoming: PlantTask[] = [];

  for (const task of active) {
    const due = startOfDay(new Date(task.dueDate));
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
  return all.filter((t) => dateKey(new Date(t.dueDate)) === key);
}
