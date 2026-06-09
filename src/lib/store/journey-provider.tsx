"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Plant } from "@/lib/types";
import type { AIGoalPlanResponse } from "@/lib/types/ai";
import type {
  PlantGoal,
  PlantJourneySummary,
  PlantMilestone,
  PlantMission,
  UserPlantGoal,
} from "@/lib/types/care-goals";
import { getGoalById, getGoalsByIds } from "@/lib/mock/plant-goals";
import {
  computeJourneyProgress,
  generateGoalBasedCarePlan,
  generateMilestonesForPlant,
  generateMissionsForPlant,
  getCurrentStage,
  getNextMilestone,
} from "@/lib/plants/goal-care";
import { useAuth } from "@/lib/store/auth-provider";

const GOALS_KEY = "plantpal-user-plant-goals";
const MILESTONES_KEY = "plantpal-plant-milestones";
const MISSIONS_KEY = "plantpal-plant-missions";

interface JourneyContextValue {
  ready: boolean;
  getPlantGoals: (plantId: string) => PlantGoal[];
  getPrimaryGoal: (plantId: string) => PlantGoal | null;
  getMilestones: (plantId: string) => PlantMilestone[];
  getMissions: (plantId: string) => PlantMission[];
  getTodaysMissions: (plants: Plant[]) => PlantMission[];
  getJourneySummary: (plant: Plant) => PlantJourneySummary;
  getCarePlan: (plant: Plant) => ReturnType<typeof generateGoalBasedCarePlan>;
  initPlantJourney: (
    plant: Plant,
    goalIds: string[],
    primaryGoalId?: string
  ) => void;
  updatePlantGoals: (
    plant: Plant,
    goalIds: string[],
    primaryGoalId?: string
  ) => void;
  completeMission: (missionId: string) => void;
  skipMission: (missionId: string) => void;
  completeMilestone: (milestoneId: string) => void;
  applyAiGoalPlan: (plantId: string, plan: AIGoalPlanResponse) => void;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "local-user";
  const [ready, setReady] = useState(false);
  const [userGoals, setUserGoals] = useState<UserPlantGoal[]>([]);
  const [milestones, setMilestones] = useState<PlantMilestone[]>([]);
  const [missions, setMissions] = useState<PlantMission[]>([]);

  useEffect(() => {
    setUserGoals(loadJson<UserPlantGoal[]>(GOALS_KEY, []));
    setMilestones(loadJson<PlantMilestone[]>(MILESTONES_KEY, []));
    setMissions(loadJson<PlantMission[]>(MISSIONS_KEY, []));
    setReady(true);
  }, []);

  const persistGoals = useCallback((next: UserPlantGoal[]) => {
    setUserGoals(next);
    localStorage.setItem(GOALS_KEY, JSON.stringify(next));
  }, []);

  const persistMilestones = useCallback((next: PlantMilestone[]) => {
    setMilestones(next);
    localStorage.setItem(MILESTONES_KEY, JSON.stringify(next));
  }, []);

  const persistMissions = useCallback((next: PlantMission[]) => {
    setMissions(next);
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(next));
  }, []);

  const getPlantGoalRecords = useCallback(
    (plantId: string) =>
      userGoals
        .filter((g) => g.plantId === plantId)
        .sort((a, b) => a.priority - b.priority),
    [userGoals]
  );

  const getPlantGoals = useCallback(
    (plantId: string) => {
      const ids = getPlantGoalRecords(plantId).map((g) => g.goalId);
      return getGoalsByIds(ids);
    },
    [getPlantGoalRecords]
  );

  const getPrimaryGoal = useCallback(
    (plantId: string) => {
      const records = getPlantGoalRecords(plantId);
      const primary = records.find((r) => r.isPrimary) ?? records[0];
      return primary ? getGoalById(primary.goalId) ?? null : null;
    },
    [getPlantGoalRecords]
  );

  const getMilestones = useCallback(
    (plantId: string) =>
      milestones
        .filter((m) => m.plantId === plantId)
        .sort(
          (a, b) =>
            new Date(a.targetDate ?? 0).getTime() -
            new Date(b.targetDate ?? 0).getTime()
        ),
    [milestones]
  );

  const getMissions = useCallback(
    (plantId: string) =>
      missions.filter((m) => m.plantId === plantId && m.status === "active"),
    [missions]
  );

  const getCarePlan = useCallback(
    (plant: Plant) => {
      const goals = getPlantGoals(plant.id);
      return generateGoalBasedCarePlan(
        plant,
        goals,
        plant.zipCode,
        plant.healthStatus
      );
    },
    [getPlantGoals]
  );

  const getJourneySummary = useCallback(
    (plant: Plant): PlantJourneySummary => {
      const selectedGoals = getPlantGoals(plant.id);
      const primaryGoal = getPrimaryGoal(plant.id);
      const plantMilestones = getMilestones(plant.id);
      const activeMissions = getMissions(plant.id);
      const carePlan = getCarePlan(plant);

      return {
        primaryGoal,
        selectedGoals,
        currentStage: getCurrentStage(plant, selectedGoals),
        nextMilestone: getNextMilestone(plantMilestones),
        activeMissions,
        progressPercent: computeJourneyProgress(plantMilestones),
        carePlan,
      };
    },
    [getPlantGoals, getPrimaryGoal, getMilestones, getMissions, getCarePlan]
  );

  const getTodaysMissions = useCallback(
    (plants: Plant[]) => {
      const plantIds = new Set(plants.map((p) => p.id));
      return missions.filter(
        (m) => m.status === "active" && plantIds.has(m.plantId)
      );
    },
    [missions]
  );

  const buildUserGoalRecords = useCallback(
    (plantId: string, goalIds: string[], primaryGoalId?: string) => {
      const primary = primaryGoalId ?? goalIds[0];
      return goalIds.map((goalId, index) => ({
        id: crypto.randomUUID(),
        userId,
        plantId,
        goalId,
        priority: index + 1,
        isPrimary: goalId === primary,
        createdAt: new Date().toISOString(),
      }));
    },
    [userId]
  );

  const initPlantJourney = useCallback(
    (plant: Plant, goalIds: string[], primaryGoalId?: string) => {
      if (goalIds.length === 0) return;

      const goals = getGoalsByIds(goalIds);
      const records = buildUserGoalRecords(plant.id, goalIds, primaryGoalId);

      persistGoals([
        ...userGoals.filter((g) => g.plantId !== plant.id),
        ...records,
      ]);

      const newMilestones = generateMilestonesForPlant(
        plant.id,
        userId,
        plant,
        goals
      );
      persistMilestones([
        ...milestones.filter((m) => m.plantId !== plant.id),
        ...newMilestones,
      ]);

      const newMissions = generateMissionsForPlant(
        plant.id,
        userId,
        plant,
        goals
      );
      persistMissions([
        ...missions.filter((m) => m.plantId !== plant.id),
        ...newMissions,
      ]);
    },
    [
      buildUserGoalRecords,
      milestones,
      missions,
      persistGoals,
      persistMilestones,
      persistMissions,
      userGoals,
      userId,
    ]
  );

  const updatePlantGoals = useCallback(
    (plant: Plant, goalIds: string[], primaryGoalId?: string) => {
      if (goalIds.length === 0) {
        persistGoals(userGoals.filter((g) => g.plantId !== plant.id));
        return;
      }

      const goals = getGoalsByIds(goalIds);
      const records = buildUserGoalRecords(plant.id, goalIds, primaryGoalId);
      persistGoals([
        ...userGoals.filter((g) => g.plantId !== plant.id),
        ...records,
      ]);

      const newMilestones = generateMilestonesForPlant(
        plant.id,
        userId,
        plant,
        goals
      );
      persistMilestones([
        ...milestones.filter((m) => m.plantId !== plant.id),
        ...newMilestones,
      ]);

      const newMissions = generateMissionsForPlant(
        plant.id,
        userId,
        plant,
        goals
      );
      persistMissions([
        ...missions.filter((m) => m.plantId !== plant.id),
        ...newMissions,
      ]);
    },
    [
      buildUserGoalRecords,
      milestones,
      missions,
      persistGoals,
      persistMilestones,
      persistMissions,
      userGoals,
      userId,
    ]
  );

  const completeMission = useCallback(
    (missionId: string) => {
      const now = new Date().toISOString();
      persistMissions(
        missions.map((m) =>
          m.id === missionId
            ? { ...m, status: "completed" as const, completedAt: now }
            : m
        )
      );
    },
    [missions, persistMissions]
  );

  const skipMission = useCallback(
    (missionId: string) => {
      persistMissions(
        missions.map((m) =>
          m.id === missionId ? { ...m, status: "skipped" as const } : m
        )
      );
    },
    [missions, persistMissions]
  );

  const completeMilestone = useCallback(
    (milestoneId: string) => {
      const now = new Date().toISOString();
      const updated = milestones.map((m) => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          status: "completed" as const,
          completedAt: now,
        };
      });

      const completed = updated.find((m) => m.id === milestoneId);
      if (completed) {
        const nextUp = updated.find(
          (m) =>
            m.plantId === completed.plantId &&
            m.status === "upcoming" &&
            m.id !== milestoneId
        );
        if (nextUp) {
          const idx = updated.findIndex((m) => m.id === nextUp.id);
          updated[idx] = { ...nextUp, status: "in_progress" };
        }
      }

      persistMilestones(updated);
    },
    [milestones, persistMilestones]
  );

  const applyAiGoalPlan = useCallback(
    (plantId: string, plan: AIGoalPlanResponse) => {
      const now = new Date().toISOString();
      const newMilestone: PlantMilestone = {
        id: crypto.randomUUID(),
        plantId,
        userId,
        title: plan.next_milestone.title,
        description: plan.next_milestone.description,
        targetDate: null,
        completedAt: null,
        status: "in_progress",
        createdAt: now,
      };

      const newMissions: PlantMission[] = plan.missions.map((m) => ({
        id: crypto.randomUUID(),
        plantId,
        userId,
        title: m.title,
        description: m.description,
        season: m.season,
        taskType: (m.task_type as PlantMission["taskType"]) || "custom",
        rewardPoints: 10,
        completedAt: null,
        status: "active",
        createdAt: now,
      }));

      persistMilestones([
        ...milestones.filter(
          (m) => !(m.plantId === plantId && m.status !== "completed")
        ),
        newMilestone,
      ]);
      persistMissions([
        ...missions.filter(
          (m) => !(m.plantId === plantId && m.status === "active")
        ),
        ...newMissions,
      ]);
    },
    [milestones, missions, persistMilestones, persistMissions, userId]
  );

  const value = useMemo(
    () => ({
      ready,
      getPlantGoals,
      getPrimaryGoal,
      getMilestones,
      getMissions,
      getTodaysMissions,
      getJourneySummary,
      getCarePlan,
      initPlantJourney,
      updatePlantGoals,
      completeMission,
      skipMission,
      completeMilestone,
      applyAiGoalPlan,
    }),
    [
      ready,
      getPlantGoals,
      getPrimaryGoal,
      getMilestones,
      getMissions,
      getTodaysMissions,
      getJourneySummary,
      getCarePlan,
      initPlantJourney,
      updatePlantGoals,
      completeMission,
      skipMission,
      completeMilestone,
      applyAiGoalPlan,
    ]
  );

  return (
    <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>
  );
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used within JourneyProvider");
  return ctx;
}
