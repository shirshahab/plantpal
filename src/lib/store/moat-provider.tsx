"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { emitAwardXp } from "@/lib/academy/xp-events";
import { loadUserProfile } from "@/lib/profile/user-profile";
import type { GardenSpace, GardenSpaceType, GardenZone, ZonePlantPlacement } from "@/lib/moat/garden-map-types";
import {
  addPlacement,
  addZone,
  createGardenSpace,
  getGardenSpaces,
  purgeDemoGardenMap,
  updateGardenSpace,
} from "@/lib/moat/garden-map-storage";
import { calculateGardenMapHealth, type GardenHealthBreakdown } from "@/lib/moat/garden-health";
import {
  completeMission,
  loadMissionState,
  type MissionState,
} from "@/lib/moat/community-missions";
import {
  createHousehold,
  loadHousehold,
  type FamilyHousehold,
} from "@/lib/moat/family-data";
import {
  generateSeasonalTasks,
  groupTasksByHorizon,
  type SeasonalTask,
} from "@/lib/moat/seasonal-engine";
import { getRecommendedProducts, type MarketplaceProduct } from "@/lib/moat/marketplace-catalog";
import { usePlants } from "@/lib/store/plants-provider";

interface MoatContextValue {
  ready: boolean;
  spaces: GardenSpace[];
  gardenHealth: GardenHealthBreakdown;
  plantLabels: string[];
  refreshSpaces: () => void;
  createSpace: (name: string, type: GardenSpaceType, photoUrl?: string | null) => GardenSpace;
  updateSpace: (id: string, patch: Partial<GardenSpace>) => void;
  addSpaceZone: (spaceId: string, zone: Omit<GardenZone, "id">) => void;
  addSpacePlacement: (spaceId: string, placement: Omit<ZonePlantPlacement, "id">) => void;
  missions: MissionState;
  completeCommunityMission: (missionId: string) => void;
  household: FamilyHousehold | null;
  createFamilyHousehold: (name: string, memberName: string) => FamilyHousehold;
  seasonalTasks: SeasonalTask[];
  seasonalGrouped: ReturnType<typeof groupTasksByHorizon>;
  completeSeasonalTask: (taskId: string) => void;
  completedSeasonalIds: string[];
  recommendedProducts: MarketplaceProduct[];
}

const MoatContext = createContext<MoatContextValue | null>(null);

const SEASONAL_DONE_KEY = "plantpal-seasonal-completed";

function loadCompletedSeasonal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEASONAL_DONE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveCompletedSeasonal(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEASONAL_DONE_KEY, JSON.stringify(ids));
}

export function MoatProvider({ children }: { children: React.ReactNode }) {
  const { plants } = usePlants();
  const [ready, setReady] = useState(false);
  const [spaces, setSpaces] = useState<GardenSpace[]>([]);
  const [missions, setMissions] = useState<MissionState>(() => loadMissionState());
  const [household, setHousehold] = useState<FamilyHousehold | null>(null);
  const [completedSeasonalIds, setCompletedSeasonalIds] = useState<string[]>([]);
  const [zipCode, setZipCode] = useState("");

  const refreshSpaces = useCallback(() => {
    purgeDemoGardenMap();
    setSpaces(getGardenSpaces());
  }, []);

  useEffect(() => {
    refreshSpaces();
    setMissions(loadMissionState());
    setCompletedSeasonalIds(loadCompletedSeasonal());
    setZipCode(loadUserProfile().zipCode);
    setHousehold(loadHousehold());
    setReady(true);
  }, [refreshSpaces]);

  const createFamilyHousehold = useCallback((name: string, memberName: string) => {
    const created = createHousehold(name, memberName);
    setHousehold(created);
    return created;
  }, []);

  const plantLabels = useMemo(() => {
    const fromPlants = plants.map((p) => p.name);
    const fromMap = spaces.flatMap((s) => s.placements.map((p) => p.label));
    return [...new Set([...fromPlants, ...fromMap])];
  }, [plants, spaces]);

  const gardenHealth = useMemo(
    () =>
      calculateGardenMapHealth(
        spaces,
        plants,
        missions.daily.filter((m) => m.status !== "pending").length,
        missions.weekly.find((m) => m.id === "wm-photos")?.progress ?? 0
      ),
    [spaces, plants, missions]
  );

  const seasonalTasks = useMemo(
    () =>
      generateSeasonalTasks({
        zipCode,
        plantLabels,
      }),
    [zipCode, plantLabels]
  );

  const seasonalGrouped = useMemo(
    () => groupTasksByHorizon(seasonalTasks),
    [seasonalTasks]
  );

  const recommendedProducts = useMemo(
    () => getRecommendedProducts(plantLabels),
    [plantLabels]
  );

  const createSpace = useCallback(
    (name: string, type: GardenSpaceType, photoUrl?: string | null) => {
      const space = createGardenSpace({ name, type, photoUrl });
      refreshSpaces();
      emitAwardXp("garden_map_updated");
      return space;
    },
    [refreshSpaces]
  );

  const updateSpace = useCallback(
    (id: string, patch: Partial<GardenSpace>) => {
      updateGardenSpace(id, patch);
      refreshSpaces();
    },
    [refreshSpaces]
  );

  const addSpaceZone = useCallback(
    (spaceId: string, zone: Omit<GardenZone, "id">) => {
      addZone(spaceId, zone);
      refreshSpaces();
    },
    [refreshSpaces]
  );

  const addSpacePlacement = useCallback(
    (spaceId: string, placement: Omit<ZonePlantPlacement, "id">) => {
      addPlacement(spaceId, placement);
      refreshSpaces();
    },
    [refreshSpaces]
  );

  const completeCommunityMission = useCallback((missionId: string) => {
    setMissions((prev) => {
      const { state, xpEarned } = completeMission(prev, missionId);
      if (xpEarned > 0) {
        const mission = [...state.daily, ...state.weekly].find((m) => m.id === missionId);
        emitAwardXp(
          mission?.cadence === "weekly" ? "weekly_mission_completed" : "daily_mission_completed"
        );
      }
      return state;
    });
  }, []);

  const completeSeasonalTask = useCallback((taskId: string) => {
    setCompletedSeasonalIds((prev) => {
      if (prev.includes(taskId)) return prev;
      const next = [...prev, taskId];
      saveCompletedSeasonal(next);
      emitAwardXp("seasonal_task_completed");
      return next;
    });
  }, []);

  const value = useMemo<MoatContextValue>(
    () => ({
      ready,
      spaces,
      gardenHealth,
      plantLabels,
      refreshSpaces,
      createSpace,
      updateSpace,
      addSpaceZone,
      addSpacePlacement,
      missions,
      completeCommunityMission,
      household,
      createFamilyHousehold,
      seasonalTasks,
      seasonalGrouped,
      completeSeasonalTask,
      completedSeasonalIds,
      recommendedProducts,
    }),
    [
      ready,
      spaces,
      gardenHealth,
      plantLabels,
      refreshSpaces,
      createSpace,
      updateSpace,
      addSpaceZone,
      addSpacePlacement,
      missions,
      completeCommunityMission,
      household,
      createFamilyHousehold,
      seasonalTasks,
      seasonalGrouped,
      completeSeasonalTask,
      completedSeasonalIds,
      recommendedProducts,
    ]
  );

  return <MoatContext.Provider value={value}>{children}</MoatContext.Provider>;
}

export function useMoat(): MoatContextValue {
  const ctx = useContext(MoatContext);
  if (!ctx) throw new Error("useMoat must be used within MoatProvider");
  return ctx;
}
