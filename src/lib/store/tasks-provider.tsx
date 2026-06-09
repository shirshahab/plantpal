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

const STATES_KEY = "plantpal-task-states";
const LOGS_KEY = "plantpal-care-logs";

interface TasksContextValue {
  ready: boolean;
  groups: TaskGroups;
  topTasks: PlantTask[];
  careLogs: PlantCareLog[];
  completeTask: (task: PlantTask) => Promise<void>;
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
    remindersReady,
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
    return [...groups.overdue, ...groups.dueToday].slice(0, 3);
  }, [groups]);

  const completeTask = useCallback(
    async (task: PlantTask) => {
      const now = new Date().toISOString();
      const nextStates = {
        ...taskStates,
        [task.id]: { status: "completed" as const, completedAt: now },
      };
      persistStatesLocal(nextStates);

      if (canUseSupabase(user?.id) && !isMockMode) {
        markPending();
        const db = getDb();
        const err = await dbCompleteTask(db, user.id, task);
        if (err) {
          markFailed(err);
          toast("Saved locally — cloud sync will retry");
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
        } else if (task.taskType === "scan") {
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

      toast(`Done: ${task.title}`);
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
