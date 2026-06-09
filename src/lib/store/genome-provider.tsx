"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Plant } from "@/lib/types";
import {
  appendGenomeEvent,
  computePlantGenome,
  getGenomeRecord,
  saveGenomeRecord,
  type GenomeComputeInput,
  type GenomeEventType,
  type PlantGenomeState,
} from "@/lib/genome";
import { useEngagement } from "./engagement-provider";
import { usePhotos } from "./photos-provider";
import { usePlants } from "./plants-provider";
import { useTasks } from "./tasks-provider";

interface WeatherSlice {
  tempF?: number;
  tempHighF?: number;
  alerts?: { type: string; severity: string }[];
}

interface GenomeContextValue {
  ready: boolean;
  recordEvent: (
    plantId: string,
    type: GenomeEventType,
    payload?: Record<string, unknown>
  ) => void;
  getGenome: (plantId: string, weather?: WeatherSlice) => PlantGenomeState | null;
  recompute: (plantId: string, weather?: WeatherSlice) => PlantGenomeState | null;
}

const GenomeContext = createContext<GenomeContextValue | null>(null);

function buildInput(
  plant: Plant,
  growthHeights: number[],
  growthEntryCount: number,
  photoCount: number,
  healthScanCount: number,
  tasksCompleted: number,
  events: ReturnType<typeof getGenomeRecord>["events"],
  weather?: WeatherSlice
): GenomeComputeInput {
  return {
    plantId: plant.id,
    plantCreatedAt: plant.createdAt,
    plantName: plant.name,
    species: plant.species,
    healthStatus: plant.healthStatus,
    zipCode: plant.zipCode,
    locationType: plant.locationType,
    lastWateredAt: plant.lastWateredAt,
    lastHealthScanAt: plant.lastHealthScanAt ?? null,
    lastGrowthPhotoAt: plant.lastGrowthPhotoAt ?? null,
    growthHeights,
    growthEntryCount,
    photoCount,
    healthScanCount,
    tasksCompleted,
    events,
    tempF: weather?.tempF,
    tempHighF: weather?.tempHighF,
    weatherAlerts: weather?.alerts,
  };
}

export function GenomeProvider({ children }: { children: React.ReactNode }) {
  const { plants } = usePlants();
  const { getGrowthForPlant } = useEngagement();
  const { getPhotosForPlant } = usePhotos();
  const { careLogs } = useTasks();
  const [tick, setTick] = useState(0);

  const recordEvent = useCallback(
    (plantId: string, type: GenomeEventType, payload: Record<string, unknown> = {}) => {
      appendGenomeEvent(plantId, type, payload);
      setTick((t) => t + 1);
    },
    []
  );

  const computeForPlant = useCallback(
    (plantId: string, weather?: WeatherSlice): PlantGenomeState | null => {
      const plant = plants.find((p) => p.id === plantId);
      if (!plant) return null;

      const growth = getGrowthForPlant(plantId);
      const heights = growth
        .filter((g) => g.heightInches != null)
        .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
        .map((g) => g.heightInches!);

      const photos = getPhotosForPlant(plantId);
      const healthScans = photos.filter((p) => p.photoType === "health_scan").length;
      const tasksCompleted = careLogs.filter((l) => l.plantId === plantId).length;

      const record = getGenomeRecord(plantId);
      const input = buildInput(
        plant,
        heights,
        growth.length,
        photos.length,
        healthScans || (plant.lastHealthScanAt ? 1 : 0),
        tasksCompleted,
        record.events,
        weather
      );

      const state = computePlantGenome(input);
      saveGenomeRecord({
        ...record,
        lastComputedAt: state.computedAt,
        cachedState: state,
      });
      return state;
    },
    [plants, getGrowthForPlant, getPhotosForPlant, careLogs, tick]
  );

  const value = useMemo<GenomeContextValue>(
    () => ({
      ready: true,
      recordEvent,
      getGenome: computeForPlant,
      recompute: computeForPlant,
    }),
    [recordEvent, computeForPlant]
  );

  return <GenomeContext.Provider value={value}>{children}</GenomeContext.Provider>;
}

export function useGenome() {
  const ctx = useContext(GenomeContext);
  if (!ctx) throw new Error("useGenome must be used within GenomeProvider");
  return ctx;
}

export function usePlantGenome(
  plant: Plant | null | undefined,
  weather?: WeatherSlice
): {
  genome: PlantGenomeState | null;
  loading: boolean;
  recordEvent: GenomeContextValue["recordEvent"];
} {
  const { recompute, recordEvent, ready } = useGenome();

  const genome = useMemo(() => {
    if (!plant || !ready) return null;
    return recompute(plant.id, weather);
  }, [plant, ready, recompute, weather?.tempF, weather?.tempHighF, weather?.alerts?.length]);

  return { genome, loading: !ready, recordEvent };
}
