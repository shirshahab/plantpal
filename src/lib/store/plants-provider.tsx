"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { NewPlantInput, Plant } from "@/lib/types";
import { MOCK_PLANTS } from "@/lib/mock/plants";
import { generateGoalBasedCarePlan } from "@/lib/plants";
import { getGoalsByIds } from "@/lib/mock/plant-goals";
import { createClient } from "@/lib/supabase/client";
import {
  mapDbPlantToPlant,
  mapPlantInputToDb,
} from "@/lib/supabase/mappers";
import { inferHardinessZone } from "@/lib/location/location-service";
import { friendlySaveError } from "@/lib/errors/user-messages";
import { canAddPlantCount } from "@/lib/billing/account-tiers";
import { isBetaUnlocked } from "@/lib/billing/beta-unlock";
import { loadMockSubscription } from "@/lib/billing/subscription-state";
import { isDemoMode } from "@/lib/profile/user-profile";
import { emitAwardXp } from "@/lib/academy/xp-events";
import { useAuth } from "@/lib/store/auth-provider";
import type { DbPlant } from "@/lib/types";

const STORAGE_KEY = "plantpal-plants";

interface PlantsContextValue {
  plants: Plant[];
  loading: boolean;
  isMockMode: boolean;
  addPlant: (input: NewPlantInput, photoFile?: File | null) => Promise<Plant>;
  getPlant: (id: string) => Plant | undefined;
  markWatered: (id: string) => Promise<void>;
  markFertilized: (id: string) => Promise<void>;
  markCareAction: (
    id: string,
    field: "lastPrunedAt" | "lastRepottedAt" | "lastHealthScanAt" | "lastGrowthPhotoAt"
  ) => Promise<void>;
  refreshPlants: () => Promise<void>;
}

const PlantsContext = createContext<PlantsContextValue | null>(null);

export function PlantsProvider({ children }: { children: React.ReactNode }) {
  const { user, isMockMode, loading: authLoading } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMockPlants = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPlants(JSON.parse(stored) as Plant[]);
      } else {
        setPlants(MOCK_PLANTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PLANTS));
      }
    } catch {
      setPlants(MOCK_PLANTS);
    }
  }, []);

  const persistMock = useCallback((next: Plant[]) => {
    setPlants(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const fetchSupabasePlants = useCallback(async () => {
    if (!user) {
      setPlants([]);
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("plants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load plants:", error.code, error.message);
      return;
    }
    setPlants((data as DbPlant[]).map(mapDbPlantToPlant));
  }, [user]);

  const refreshPlants = useCallback(async () => {
    if (isMockMode) {
      loadMockPlants();
    } else {
      await fetchSupabasePlants();
    }
  }, [isMockMode, loadMockPlants, fetchSupabasePlants]);

  useEffect(() => {
    if (authLoading) return;

    async function init() {
      setLoading(true);
      if (isMockMode) {
        loadMockPlants();
      } else {
        await fetchSupabasePlants();
      }
      setLoading(false);
    }
    init();
  }, [authLoading, isMockMode, user, loadMockPlants, fetchSupabasePlants]);

  const addPlant = useCallback(
    async (
      input: NewPlantInput,
      photoFile?: File | null
    ): Promise<Plant> => {
      const bypassLimits = isDemoMode() || isBetaUnlocked();
      const sub = loadMockSubscription();
      if (
        !canAddPlantCount(sub.tier, plants.length, {
          betaUnlockAll: isBetaUnlocked(),
          bypassLimits,
        })
      ) {
        throw new Error("Free plan limit reached. Upgrade to PlantPal Plus to add more plants.");
      }

      const goals = getGoalsByIds(input.goalIds);
      const careStub: Plant = {
        id: "temp",
        name: input.name,
        species: input.species,
        image: input.image,
        locationType: input.locationType,
        plantingType: input.plantingType,
        zipCode: input.zipCode,
        sunExposure: input.sunExposure,
        healthStatus: "healthy",
        healthNotes: "",
        lastWateredAt: null,
        lastFertilizedAt: null,
        createdAt: new Date().toISOString(),
        waterFrequencyDays: 7,
        fertilizeFrequencyWeeks: 8,
        pruneSchedule: "Early spring",
        wateringInstructions: "",
        fertilizingInstructions: "",
        pruningInstructions: "",
      };
      const carePlan = generateGoalBasedCarePlan(
        careStub,
        goals,
        input.zipCode,
        "healthy"
      );
      const care = {
        waterFrequencyDays: carePlan.waterFrequencyDays,
        fertilizeFrequencyWeeks: carePlan.fertilizeFrequencyWeeks,
        pruneSchedule: carePlan.pruneSchedule,
        wateringInstructions: carePlan.wateringInstructions,
        fertilizingInstructions: carePlan.fertilizingInstructions,
        pruningInstructions: carePlan.pruningInstructions,
      };

      if (isMockMode) {
        const plant: Plant = {
          id: crypto.randomUUID(),
          ...input,
          ...care,
          hardinessZone: inferHardinessZone(input.zipCode),
          healthStatus: "healthy",
          healthNotes: "Newly added — monitor for the first two weeks.",
          lastWateredAt: null,
          lastFertilizedAt: null,
          createdAt: new Date().toISOString(),
        };
        persistMock([plant, ...plants]);
        emitAwardXp("plant_added");
        return plant;
      }

      if (!user) throw new Error("You must be logged in to add a plant.");

      const supabase = createClient();
      let photoUrl = input.image;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("plant-photos")
          .upload(path, photoFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("plant-photos")
            .getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      }

      const row = mapPlantInputToDb(
        { ...input, image: photoUrl },
        user.id,
        {
          waterFrequencyDays: care.waterFrequencyDays,
          fertilizeFrequencyWeeks: care.fertilizeFrequencyWeeks,
          pruneSchedule: care.pruneSchedule,
        }
      );
      row.hardiness_zone = inferHardinessZone(input.zipCode);

      const { data, error } = await supabase
        .from("plants")
        .insert(row)
        .select()
        .single();

      if (error) throw new Error(friendlySaveError(error));

      const fullPlant: Plant = {
        ...mapDbPlantToPlant(data as DbPlant),
        wateringInstructions: care.wateringInstructions,
        fertilizingInstructions: care.fertilizingInstructions,
        pruningInstructions: care.pruningInstructions,
      };

      if (photoUrl) {
        await supabase.from("plant_photos").insert({
          plant_id: fullPlant.id,
          user_id: user.id,
          photo_url: photoUrl,
          photo_type: "profile",
          is_primary: true,
        });
      }

      setPlants((prev) => [fullPlant, ...prev]);
      emitAwardXp("plant_added");
      return fullPlant;
    },
    [isMockMode, plants, persistMock, user]
  );

  const getPlant = useCallback(
    (id: string) => plants.find((p) => p.id === id),
    [plants]
  );

  const markWatered = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();

      if (isMockMode) {
        persistMock(
          plants.map((p) =>
            p.id === id ? { ...p, lastWateredAt: now } : p
          )
        );
        return;
      }

      const supabase = createClient();
      const { error } = await supabase
        .from("plants")
        .update({ last_watered_at: now })
        .eq("id", id);

      if (error) throw new Error(friendlySaveError(error));

      setPlants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, lastWateredAt: now } : p))
      );
    },
    [isMockMode, plants, persistMock]
  );

  const markFertilized = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();

      if (isMockMode) {
        persistMock(
          plants.map((p) =>
            p.id === id ? { ...p, lastFertilizedAt: now } : p
          )
        );
        return;
      }

      const supabase = createClient();
      const { error } = await supabase
        .from("plants")
        .update({ last_fertilized_at: now })
        .eq("id", id);

      if (error) throw new Error(friendlySaveError(error));

      setPlants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, lastFertilizedAt: now } : p))
      );
    },
    [isMockMode, plants, persistMock]
  );

  const DB_FIELD_MAP = {
    lastPrunedAt: "last_pruned_at",
    lastRepottedAt: "last_repotted_at",
    lastHealthScanAt: "last_health_scan_at",
    lastGrowthPhotoAt: "last_growth_photo_at",
  } as const;

  const markCareAction = useCallback(
    async (
      id: string,
      field: keyof typeof DB_FIELD_MAP
    ) => {
      const now = new Date().toISOString();
      const dbField = DB_FIELD_MAP[field];

      if (isMockMode) {
        persistMock(
          plants.map((p) =>
            p.id === id ? { ...p, [field]: now } : p
          )
        );
        return;
      }

      const supabase = createClient();
      const { error } = await supabase
        .from("plants")
        .update({ [dbField]: now })
        .eq("id", id);

      if (error) throw new Error(friendlySaveError(error));

      setPlants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: now } : p))
      );
    },
    [isMockMode, plants, persistMock]
  );

  return (
    <PlantsContext.Provider
      value={{
        plants,
        loading: loading || authLoading,
        isMockMode,
        addPlant,
        getPlant,
        markWatered,
        markFertilized,
        markCareAction,
        refreshPlants,
      }}
    >
      {children}
    </PlantsContext.Provider>
  );
}

export function usePlants() {
  const ctx = useContext(PlantsContext);
  if (!ctx) throw new Error("usePlants must be used within PlantsProvider");
  return ctx;
}
