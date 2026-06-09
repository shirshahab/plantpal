"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { GrowthEntry, HarvestEntry, PlantRarity } from "@/lib/types/phase6";
import { MOCK_GROWTH_ENTRIES } from "@/lib/mock/growth";
import { MOCK_HARVEST_ENTRIES } from "@/lib/mock/harvest";
import {
  ACHIEVEMENT_DEFINITIONS,
  buildAchievements,
} from "@/lib/mock/achievements";
import type { Achievement } from "@/lib/types/phase6";
import type { Plant } from "@/lib/types";
import { emitAwardXp } from "@/lib/academy/xp-events";
import { calculateGardenScore } from "@/lib/scoring";
import { usePlants } from "./plants-provider";

const KEYS = {
  growth: "plantpal-growth",
  harvest: "plantpal-harvest",
  achievements: "plantpal-achievements",
  savedTips: "plantpal-saved-tips",
  rarity: "plantpal-rarity",
  stats: "plantpal-stats",
};

interface EngagementStats {
  scans: number;
  wateringStreak: number;
  firstPlantDate: string | null;
}

interface EngagementContextValue {
  growthEntries: GrowthEntry[];
  harvestEntries: HarvestEntry[];
  achievements: Achievement[];
  savedTipIds: string[];
  rarityMap: Record<string, PlantRarity>;
  stats: EngagementStats;
  addGrowthEntry: (entry: Omit<GrowthEntry, "id" | "createdAt" | "userId">) => void;
  addHarvestEntry: (entry: Omit<HarvestEntry, "id" | "createdAt" | "userId">) => void;
  getGrowthForPlant: (plantId: string) => GrowthEntry[];
  unlockAchievement: (id: string) => void;
  toggleSaveTip: (tipId: string) => void;
  recordScan: () => void;
  recordWatering: () => void;
  setPlantRarity: (plantId: string, rarity: PlantRarity) => void;
  syncAchievements: () => void;
}

const EngagementContext = createContext<EngagementContextValue | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function EngagementProvider({ children }: { children: React.ReactNode }) {
  const { plants } = usePlants();
  const [growthEntries, setGrowthEntries] = useState<GrowthEntry[]>([]);
  const [harvestEntries, setHarvestEntries] = useState<HarvestEntry[]>([]);
  const [unlocked, setUnlocked] = useState<Record<string, string>>({});
  const [savedTipIds, setSavedTipIds] = useState<string[]>([]);
  const [rarityMap, setRarityMap] = useState<Record<string, PlantRarity>>({});
  const [stats, setStats] = useState<EngagementStats>({
    scans: 0,
    wateringStreak: 0,
    firstPlantDate: null,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setGrowthEntries(loadJson(KEYS.growth, MOCK_GROWTH_ENTRIES));
    setHarvestEntries(loadJson(KEYS.harvest, MOCK_HARVEST_ENTRIES));
    setUnlocked(loadJson(KEYS.achievements, {}));
    setSavedTipIds(loadJson(KEYS.savedTips, []));
    setRarityMap(loadJson(KEYS.rarity, {}));
    setStats(
      loadJson(KEYS.stats, {
        scans: 0,
        wateringStreak: 3,
        firstPlantDate: null,
      })
    );
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEYS.growth, JSON.stringify(growthEntries));
  }, [growthEntries, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEYS.harvest, JSON.stringify(harvestEntries));
  }, [harvestEntries, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEYS.achievements, JSON.stringify(unlocked));
  }, [unlocked, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEYS.savedTips, JSON.stringify(savedTipIds));
  }, [savedTipIds, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEYS.rarity, JSON.stringify(rarityMap));
  }, [rarityMap, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEYS.stats, JSON.stringify(stats));
  }, [stats, ready]);

  const unlockAchievement = useCallback((id: string) => {
    setUnlocked((prev) => {
      if (prev[id]) return prev;
      return { ...prev, [id]: new Date().toISOString() };
    });
  }, []);

  const syncAchievements = useCallback(() => {
    const now = new Date().toISOString();
    setUnlocked((prev) => {
      const next = { ...prev };
      const unlock = (id: string) => {
        if (!next[id]) next[id] = now;
      };

      if (plants.length >= 1) unlock("first-plant");
      if (plants.length >= 10) unlock("plants-10");
      if (plants.length >= 25) unlock("plants-25");

      const hasTree = plants.some(
        (p) =>
          p.species.toLowerCase().includes("tree") ||
          p.name.toLowerCase().includes("tree")
      );
      if (hasTree) unlock("first-tree");

      const hasCitrus = plants.some((p) =>
        /citrus|lemon|lime|orange|grapefruit|kumquat/i.test(`${p.name} ${p.species}`)
      );
      if (hasCitrus) unlock("citrus-expert");

      const garden = calculateGardenScore(plants);
      if (garden.score >= 80) unlock("garden-80");
      if (garden.score >= 90) unlock("garden-90");

      if (stats.scans >= 1) unlock("first-scan");
      if (stats.wateringStreak >= 7) unlock("water-streak-7");

      return next;
    });
  }, [plants, stats.scans, stats.wateringStreak]);

  useEffect(() => {
    if (ready) syncAchievements();
  }, [ready, plants, stats, syncAchievements]);

  const achievements = useMemo(
    () => buildAchievements(unlocked),
    [unlocked]
  );

  const addGrowthEntry = useCallback(
    (entry: Omit<GrowthEntry, "id" | "createdAt" | "userId">) => {
      const newEntry: GrowthEntry = {
        ...entry,
        id: crypto.randomUUID(),
        userId: "local",
        createdAt: new Date().toISOString(),
      };
      setGrowthEntries((prev) => [newEntry, ...prev]);
      unlockAchievement("first-growth-photo");
      emitAwardXp("growth_photo");
    },
    [unlockAchievement]
  );

  const addHarvestEntry = useCallback(
    (entry: Omit<HarvestEntry, "id" | "createdAt" | "userId">) => {
      const newEntry: HarvestEntry = {
        ...entry,
        id: crypto.randomUUID(),
        userId: "local",
        createdAt: new Date().toISOString(),
      };
      setHarvestEntries((prev) => [newEntry, ...prev]);
    },
    []
  );

  const getGrowthForPlant = useCallback(
    (plantId: string) =>
      growthEntries
        .filter((e) => e.plantId === plantId)
        .sort(
          (a, b) =>
            new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
        ),
    [growthEntries]
  );

  const toggleSaveTip = useCallback((tipId: string) => {
    setSavedTipIds((prev) =>
      prev.includes(tipId) ? prev.filter((id) => id !== tipId) : [...prev, tipId]
    );
  }, []);

  const recordScan = useCallback(() => {
    setStats((s) => ({ ...s, scans: s.scans + 1 }));
    unlockAchievement("first-scan");
    unlockAchievement("pest-hunter");
    emitAwardXp("diagnosis_completed");
  }, [unlockAchievement]);

  const recordWatering = useCallback(() => {
    setStats((s) => ({ ...s, wateringStreak: s.wateringStreak + 1 }));
  }, []);

  const setPlantRarity = useCallback((plantId: string, rarity: PlantRarity) => {
    setRarityMap((prev) => ({ ...prev, [plantId]: rarity }));
    if (rarity.level !== "Common") unlockAchievement("bonsai-beginner");
  }, [unlockAchievement]);

  return (
    <EngagementContext.Provider
      value={{
        growthEntries,
        harvestEntries,
        achievements,
        savedTipIds,
        rarityMap,
        stats,
        addGrowthEntry,
        addHarvestEntry,
        getGrowthForPlant,
        unlockAchievement,
        toggleSaveTip,
        recordScan,
        recordWatering,
        setPlantRarity,
        syncAchievements,
      }}
    >
      {children}
    </EngagementContext.Provider>
  );
}

export function useEngagement() {
  const ctx = useContext(EngagementContext);
  if (!ctx) throw new Error("useEngagement must be used within EngagementProvider");
  return ctx;
}

export { ACHIEVEMENT_DEFINITIONS };
