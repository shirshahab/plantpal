"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { generatePlantTasks, getTasksForDate } from "@/lib/tasks/task-engine";
import { getTodayFocusTasks } from "@/lib/tasks/dedupe-tasks";
import type {
  PlantCareLog,
  PlantTask,
  TaskGroups,
  TaskStateRecord,
  TaskType,
} from "@/lib/types/tasks";
import { usePlants } from "@/lib/store/plants-provider";
import { useJourney } from "@/lib/store/journey-provider";
import { useAiResults } from "@/lib/store/ai-provider";
import { useEducation } from "@/lib/store/education-provider";
import { useReminders } from "@/lib/store/reminders-provider";
import { useAuth } from "@/lib/store/auth-provider";
import { useSync } from "@/lib/store/sync-provider";
import { useWeather } from "@/lib/hooks/use-weather";
import { getLocationProfile } from "@/lib/location/location-service";
import { useToast } from "@/lib/store/toast-provider";
import { emitAwardXp } from "@/lib/academy/xp-events";
import { xpForEvent } from "@/lib/academy/xp";
import { queueCompletionBurst } from "@/components/gamification/xp-toast-queue";
import {
  validateTaskCompletion,
  type CompletionSource,
  pickRandomCopy,
  WATER_COMPLETE_COPY,
  FERTILIZE_COMPLETE_COPY,
  WEEKLY_CHECK_COMPLETE_COPY,
  LESSON_COMPLETE_COPY,
} from "@/lib/tasks/task-validation";
import {
  LESSON_COMPLETED_EVENT,
  PHOTO_UPLOADED_EVENT,
  HEALTH_SCAN_EVENT,
} from "@/lib/tasks/task-events";
import { recordNotificationEvent } from "@/lib/notifications/notification-analytics";
import {
  canUseSupabase,
  completeTask as dbCompleteTask,
  createCareLog,
  getCareLogs,
  getDb,
  getTaskStates,
  skipTask as dbSkipTask,
  snoozeTask as dbSnoozeTask,
  upsertGeneratedTasks,
} from "@/lib/db";
import { appendGenomeEvent } from "@/lib/genome/storage";
import {
  getActiveHealthReports,
  HEALTH_REPORTS_CHANGED_EVENT,
} from "@/lib/health/report-storage";
import { buildRecoveryTasks } from "@/lib/health/recovery-tasks";
import type { ProHealthReport } from "@/lib/types/health";

const STATES_KEY = "plantpal-task-states";
const LOGS_KEY = "plantpal-care-logs";

interface CompleteTaskOptions {
  validated?: boolean;
  source?: CompletionSource;
  silentToast?: boolean;
}

interface TasksContextValue {
  ready: boolean;
  groups: TaskGroups;
  topTasks: PlantTask[];
  careLogs: PlantCareLog[];
  completeTask: (task: PlantTask, options?: CompleteTaskOptions) => Promise<void>;
  skipTask: (task: PlantTask) => void;
  snoozeTask: (task: PlantTask, days?: number) => void;
  getTasksForDay: (day: Date) => PlantTask[];
  refreshTasks: () => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { user, isMockMode } = useAuth();
  const { useCloud, markPending, markSynced, markFailed } = useSync();
  const {
    plants,
    markWatered,
    markFertilized,
    markCareAction,
  } = usePlants();
  const { getTodaysMissions, completeMission } = useJourney();
  const { getCarePlan } = useAiResults();
  const { progress } = useEducation();
  const { settings: reminders, ready: remindersReady } = useReminders();
  const { toast } = useToast();

  const [taskStates, setTaskStates] = useState<Record<string, TaskStateRecord>>({});
  const [careLogs, setCareLogs] = useState<PlantCareLog[]>([]);
  const [ready, setReady] = useState(false);
  const syncGenRef = useRef<string>("");

  const loadLocal = useCallback(() => {
    try {
      const states = localStorage.getItem(STATES_KEY);
      const logs = localStorage.getItem(LOGS_KEY);
      if (states) setTaskStates(JSON.parse(states) as Record<string, TaskStateRecord>);
      if (logs) setCareLogs(JSON.parse(logs) as PlantCareLog[]);
    } catch {
      /* defaults */
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    if (canUseSupabase(user?.id) && !isMockMode) {
      markPending();
      const db = getDb();
      const [remoteStates, logs] = await Promise.all([
        getTaskStates(db, user.id),
        getCareLogs(db, user.id),
      ]);
      setTaskStates(remoteStates);
      setCareLogs(logs);
      localStorage.setItem(STATES_KEY, JSON.stringify(remoteStates));
      localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
      markSynced();
    } else {
      loadLocal();
    }
  }, [user?.id, isMockMode, loadLocal, markPending, markSynced]);

  useEffect(() => {
    async function init() {
      await refreshTasks();
      setReady(true);
    }
    init();
  }, [refreshTasks]);

  const persistStatesLocal = useCallback((next: Record<string, TaskStateRecord>) => {
    setTaskStates(next);
    localStorage.setItem(STATES_KEY, JSON.stringify(next));
  }, []);

  const appendCareLogLocal = useCallback((log: PlantCareLog) => {
    setCareLogs((prev) => {
      const next = [log, ...prev].slice(0, 200);
      localStorage.setItem(LOGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Active health reports drive Recovery Plan follow-up tasks.
  const [healthReports, setHealthReports] = useState<ProHealthReport[]>([]);
  useEffect(() => {
    const load = () => setHealthReports(getActiveHealthReports());
    load();
    window.addEventListener(HEALTH_REPORTS_CHANGED_EVENT, load);
    return () => window.removeEventListener(HEALTH_REPORTS_CHANGED_EVENT, load);
  }, []);

  const recoveryTasks = useMemo(
    () => buildRecoveryTasks(healthReports, new Date()),
    [healthReports]
  );

  const zip = plants[0]?.zipCode ?? "91107";
  const locationProfile = useMemo(() => getLocationProfile(zip), [zip]);
  const { weather } = useWeather(zip);

  const aiPlans = useMemo(() => {
    const map: Record<string, ReturnType<typeof getCarePlan>> = {};
    for (const p of plants) {
      map[p.id] = getCarePlan(p.id);
    }
    return map;
  }, [plants, getCarePlan]);

  const missions = useMemo(
    () => getTodaysMissions(plants),
    [getTodaysMissions, plants]
  );

  const groups = useMemo(() => {
    if (!remindersReady) {
      return { dueToday: [], upcoming: [], overdue: [], completed: [] };
    }
    return generatePlantTasks({
      plants,
      careSchedules: [],
      aiPlans,
      missions,
      weather,
      locationProfile,
      today: new Date(),
      taskStates,
      reminders,
      completedLessonIds: progress.completedLessons,
      passedQuizIds: progress.passedQuizzes,
      extraTasks: recoveryTasks,
    });
  }, [
    plants,
    aiPlans,
    missions,
    weather,
    taskStates,
    reminders,
    locationProfile,
    progress.completedLessons,
    progress.passedQuizzes,
    remindersReady,
    recoveryTasks,
  ]);

  // Sync generated tasks to Supabase (deduped by task_key)
  useEffect(() => {
    if (!ready || !canUseSupabase(user?.id) || isMockMode) return;

    const toSync = [...groups.overdue, ...groups.dueToday, ...groups.upcoming];
    const fingerprint = toSync.map((t) => t.id).sort().join("|").slice(0, 500);
    if (fingerprint === syncGenRef.current) return;
    syncGenRef.current = fingerprint;

    const timer = setTimeout(async () => {
      markPending();
      const err = await upsertGeneratedTasks(getDb(), user!.id, toSync);
      if (err) markFailed(err);
      else markSynced();
    }, 1200);

    return () => clearTimeout(timer);
  }, [groups, ready, user?.id, isMockMode, markPending, markSynced, markFailed]);

  const topTasks = useMemo(() => {
    return getTodayFocusTasks(groups, plants);
  }, [groups, plants]);

  const completeTask = useCallback(
    async (task: PlantTask, options?: CompleteTaskOptions) => {
      const validation = validateTaskCompletion(task, {
        validated: options?.validated,
        source: options?.source,
      });
      if (!validation.ok) {
        toast(validation.reason ?? "Complete the action first.");
        return;
      }

      if (taskStates[task.id]?.status === "completed") return;

      const now = new Date().toISOString();
      const nextStates = {
        ...taskStates,
        [task.id]: { status: "completed" as const, completedAt: now },
      };
      persistStatesLocal(nextStates);

      recordNotificationEvent("completed", task.id, task.taskType);

      if (canUseSupabase(user?.id) && !isMockMode) {
        markPending();
        const db = getDb();
        const err = await dbCompleteTask(db, user.id, task);
        if (err) {
          markFailed(err);
          toast("Saved locally. Cloud sync will retry");
        } else {
          markSynced();
        }
      }

      if (task.plantId) {
        if (task.taskType === "water") {
          await markWatered(task.plantId);
        } else if (task.taskType === "fertilize") {
          await markFertilized(task.plantId);
        } else if (task.taskType === "prune") {
          await markCareAction(task.plantId, "lastPrunedAt");
        } else if (task.taskType === "repot") {
          await markCareAction(task.plantId, "lastRepottedAt");
        } else if (task.taskType === "scan" || task.taskType === "inspect" || task.taskType === "weekly_check") {
          await markCareAction(task.plantId, "lastHealthScanAt");
        } else if (task.taskType === "take_growth_photo") {
          await markCareAction(task.plantId, "lastGrowthPhotoAt");
        }

        const localLog: PlantCareLog = {
          id: crypto.randomUUID(),
          plantId: task.plantId,
          actionType: task.taskType,
          notes: task.title,
          photoUrl: null,
          createdAt: now,
        };

        if (canUseSupabase(user?.id) && !isMockMode) {
          const { log, error } = await createCareLog(getDb(), user.id, {
            plantId: task.plantId,
            actionType: task.taskType,
            notes: task.title,
          });
          if (log) appendCareLogLocal(log);
          else if (!error) appendCareLogLocal(localLog);
          else appendCareLogLocal(localLog);
        } else {
          appendCareLogLocal(localLog);
        }

        appendGenomeEvent(task.plantId, "task_completed", {
          taskType: task.taskType,
          title: task.title,
        });
      }

      const missionId = task.metadata?.missionId as string | undefined;
      if (missionId) completeMission(missionId);

      const skipTaskXp = options?.source === "lesson_quiz_passed";
      let xpAmount = 0;
      if (!skipTaskXp) {
        emitAwardXp("task_completed", { silent: true });
        xpAmount = xpForEvent("task_completed");
      }

      if (!options?.silentToast) {
        let message = task.title;
        if (options?.source === "lesson_quiz_passed") {
          message = LESSON_COMPLETE_COPY;
        } else if (task.taskType === "water") {
          message = pickRandomCopy(WATER_COMPLETE_COPY);
        } else if (task.taskType === "fertilize") {
          message = pickRandomCopy(FERTILIZE_COMPLETE_COPY);
        } else if (task.taskType === "weekly_check") {
          message = WEEKLY_CHECK_COMPLETE_COPY;
        }
        queueCompletionBurst(xpAmount, [message]);
      }
    },
    [
      taskStates,
      persistStatesLocal,
      user?.id,
      isMockMode,
      markPending,
      markSynced,
      markFailed,
      markWatered,
      markFertilized,
      markCareAction,
      appendCareLogLocal,
      completeMission,
      toast,
    ]
  );

  const completeTasksForLesson = useCallback(
    async (lessonId: string) => {
      const pending = [
        ...groups.overdue,
        ...groups.dueToday,
        ...groups.upcoming,
      ].filter(
        (t) =>
          t.taskType === "complete_lesson" &&
          t.metadata?.lessonId === lessonId &&
          t.status === "pending"
      );
      for (const task of pending) {
        await completeTask(task, {
          validated: true,
          source: "lesson_quiz_passed",
          silentToast: true,
        });
      }
    },
    [groups, completeTask]
  );

  useEffect(() => {
    const onLesson = (event: Event) => {
      const lessonId = (event as CustomEvent<{ lessonId: string }>).detail?.lessonId;
      if (lessonId) void completeTasksForLesson(lessonId);
    };
    const onPhoto = (event: Event) => {
      const { plantId, photoType } = (
        event as CustomEvent<{ plantId: string; photoType: string }>
      ).detail;
      if (!plantId || photoType === "health_scan") return;
      const pending = [...groups.overdue, ...groups.dueToday, ...groups.upcoming].filter(
        (t) =>
          t.plantId === plantId &&
          t.taskType === "take_growth_photo" &&
          t.status === "pending"
      );
      for (const task of pending) {
        void completeTask(task, { validated: true, source: "photo_uploaded" });
      }
    };
    const onScan = (event: Event) => {
      const plantId = (event as CustomEvent<{ plantId: string | null }>).detail?.plantId;
      const pending = [...groups.overdue, ...groups.dueToday, ...groups.upcoming].filter(
        (t) =>
          (t.taskType === "scan" ||
            t.taskType === "inspect" ||
            t.taskType === "weekly_check") &&
          t.status === "pending" &&
          (!plantId || t.plantId === plantId || !t.plantId)
      );
      for (const task of pending.slice(0, 1)) {
        void completeTask(task, { validated: true, source: "health_scan" });
      }
    };

    window.addEventListener(LESSON_COMPLETED_EVENT, onLesson);
    window.addEventListener(PHOTO_UPLOADED_EVENT, onPhoto);
    window.addEventListener(HEALTH_SCAN_EVENT, onScan);
    return () => {
      window.removeEventListener(LESSON_COMPLETED_EVENT, onLesson);
      window.removeEventListener(PHOTO_UPLOADED_EVENT, onPhoto);
      window.removeEventListener(HEALTH_SCAN_EVENT, onScan);
    };
  }, [completeTasksForLesson, completeTask, groups]);

  const skipTask = useCallback(
    async (task: PlantTask) => {
      const now = new Date().toISOString();
      persistStatesLocal({
        ...taskStates,
        [task.id]: { status: "skipped", completedAt: now },
      });

      if (canUseSupabase(user?.id) && !isMockMode) {
        markPending();
        const err = await dbSkipTask(getDb(), user.id, task);
        if (err) markFailed(err);
        else markSynced();
      }

      toast("Task skipped");
    },
    [taskStates, persistStatesLocal, user?.id, isMockMode, markPending, markSynced, markFailed, toast]
  );

  const snoozeTask = useCallback(
    async (task: PlantTask, days = 1) => {
      const until = new Date();
      until.setDate(until.getDate() + days);
      const untilIso = until.toISOString();
      const newDue = untilIso.slice(0, 10);

      persistStatesLocal({
        ...taskStates,
        [task.id]: { status: "snoozed", snoozedUntil: untilIso },
      });

      if (canUseSupabase(user?.id) && !isMockMode) {
        markPending();
        const err = await dbSnoozeTask(getDb(), user.id, task, untilIso, newDue);
        if (err) markFailed(err);
        else markSynced();
      }

      toast(`Snoozed until ${until.toLocaleDateString()}`);
    },
    [taskStates, persistStatesLocal, user?.id, isMockMode, markPending, markSynced, markFailed, toast]
  );

  const getTasksForDay = useCallback(
    (day: Date) => getTasksForDate(groups, day),
    [groups]
  );

  return (
    <TasksContext.Provider
      value={{
        ready: ready && remindersReady,
        groups,
        topTasks,
        careLogs,
        completeTask,
        skipTask,
        snoozeTask,
        getTasksForDay,
        refreshTasks,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
