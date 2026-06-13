"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { NewPlantInput, Plant, UpdatePlantInput } from "@/lib/types";
import {
  DEFAULT_PHOTO_FIELDS,
  DEFAULT_SIZE_FIELDS,
} from "@/lib/plants/plant-size";
import { getPlaceholderImageUrl } from "@/lib/plants/plant-placeholders";
import { cleanupLocalPlantData } from "@/lib/plants/remove-plant-cleanup";
import { generateGoalBasedCarePlan } from "@/lib/plants";
import { getGoalsByIds } from "@/lib/mock/plant-goals";
import { createClient } from "@/lib/supabase/client";
import {
  mapDbPlantToPlant,
  mapPlantInputToDb,
  mapPlantUpdateToDb,
  withPlantDefaults,
} from "@/lib/supabase/mappers";
import { inferHardinessZone } from "@/lib/location/location-service";
import { friendlySaveError } from "@/lib/errors/user-messages";
import { canAddPlantCount } from "@/lib/billing/account-tiers";
import { isBetaUnlocked } from "@/lib/billing/beta-unlock";
import { loadMockSubscription } from "@/lib/billing/subscription-state";
import { emitAwardXp } from "@/lib/academy/xp-events";
import { publishActivityEvent } from "@/lib/social/events";
import { useAuth } from "@/lib/store/auth-provider";
import type { DbPlant } from "@/lib/types";
import { readLocalJson } from "@/lib/storage/safe-local-storage";

const STORAGE_KEY = "plantpal-plants";

interface PlantsContextValue {
  plants: Plant[];
  loading: boolean;
  isMockMode: boolean;
  addPlant: (input: NewPlantInput, photoFile?: File | null) => Promise<Plant>;
  updatePlant: (id: string, patch: UpdatePlantInput, photoFile?: File | null) => Promise<Plant>;
  removePlant: (id: string) => Promise<void>;
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
    const parsed = readLocalJson(STORAGE_KEY, [] as Partial<Plant>[]);
    setPlants(parsed.map((p) => withPlantDefaults(p as Plant)));
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
      const bypassLimits = isBetaUnlocked();
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
      const careStub: Plant = withPlantDefaults({
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
        sizeType: input.sizeType ?? "unknown",
        nurseryContainerSize: input.nurseryContainerSize ?? null,
        heightFeet: input.heightFeet ?? null,
        heightInches: input.heightInches ?? null,
        potDiameterInches: input.potDiameterInches ?? null,
        trunkDiameterInches: input.trunkDiameterInches ?? null,
        plantedDate: input.plantedDate ?? null,
      });
      const carePlan = generateGoalBasedCarePlan(
        careStub,
        goals,
        input.zipCode,
        "healthy",
        input.speciesCare ?? null
      );
      const care = {
        waterFrequencyDays: carePlan.waterFrequencyDays,
        fertilizeFrequencyWeeks: carePlan.fertilizeFrequencyWeeks,
        pruneSchedule: carePlan.pruneSchedule,
        wateringInstructions: carePlan.wateringInstructions,
        fertilizingInstructions: carePlan.fertilizingInstructions,
        pruningInstructions: carePlan.pruningInstructions,
      };

      const photoStatus = input.photoStatus ?? (photoFile || input.image.startsWith("data:") ? "real_photo" : DEFAULT_PHOTO_FIELDS.photoStatus);
      const placeholderImageType = input.placeholderImageType ?? null;
      const displayImage =
        photoStatus === "placeholder" && placeholderImageType
          ? getPlaceholderImageUrl(placeholderImageType)
          : input.image;

      if (isMockMode) {
        const { speciesCare: _speciesCare, ...inputFields } = input;
        void _speciesCare;
        const plant: Plant = {
          id: crypto.randomUUID(),
          ...inputFields,
          image: displayImage,
          ...care,
          ...DEFAULT_SIZE_FIELDS,
          sizeType: input.sizeType ?? DEFAULT_SIZE_FIELDS.sizeType,
          nurseryContainerSize: input.nurseryContainerSize ?? null,
          heightFeet: input.heightFeet ?? null,
          heightInches: input.heightInches ?? null,
          potDiameterInches: input.potDiameterInches ?? null,
          trunkDiameterInches: input.trunkDiameterInches ?? null,
          estimatedAgeMonths: input.estimatedAgeMonths ?? null,
          plantedDate: input.plantedDate ?? null,
          purchaseDate: input.purchaseDate ?? null,
          purchasePrice: input.purchasePrice ?? null,
          purchaseStore: input.purchaseStore ?? null,
          photoStatus,
          placeholderImageType,
          hardinessZone: inferHardinessZone(input.zipCode),
          healthStatus: "healthy",
          healthNotes: input.notes ?? "Newly added. Monitor for the first two weeks.",
          lastWateredAt: null,
          lastFertilizedAt: null,
          createdAt: new Date().toISOString(),
        };
        persistMock([plant, ...plants]);
        emitAwardXp("plant_added");
        void publishActivityEvent({
          userId: user?.id ?? "local-user",
          eventType: "plant_added",
          title: `added ${plant.name}`,
          payload: { plantId: plant.id },
          actorName: user?.user_metadata?.full_name as string | undefined,
        });
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
        {
          ...input,
          image: photoUrl,
          photoStatus,
          placeholderImageType,
        },
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

      if (photoUrl && photoStatus === "real_photo") {
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
      void publishActivityEvent({
        userId: user.id,
        eventType: "plant_added",
        title: `added ${fullPlant.name}`,
        payload: { plantId: fullPlant.id },
        actorName: user.user_metadata?.full_name as string | undefined,
      });
      return fullPlant;
    },
    [isMockMode, plants, persistMock, user]
  );

  const getPlant = useCallback(
    (id: string) => plants.find((p) => p.id === id),
    [plants]
  );

  const updatePlant = useCallback(
    async (
      id: string,
      patch: UpdatePlantInput,
      photoFile?: File | null
    ): Promise<Plant> => {
      const existing = plants.find((p) => p.id === id);
      if (!existing) throw new Error("Plant not found");

      let image = patch.image ?? existing.image;
      let photoStatus = patch.photoStatus ?? existing.photoStatus;
      let placeholderImageType =
        patch.placeholderImageType !== undefined
          ? patch.placeholderImageType
          : existing.placeholderImageType;

      if (photoFile) {
        photoStatus = "real_photo";
        placeholderImageType = null;
      }

      if (!isMockMode && user && photoFile) {
        const supabase = createClient();
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("plant-photos")
          .upload(path, photoFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("plant-photos")
            .getPublicUrl(path);
          image = urlData.publicUrl;
        }
      } else if (photoFile) {
        image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(photoFile);
        });
      }

      if (photoStatus === "placeholder" && placeholderImageType) {
        image = getPlaceholderImageUrl(placeholderImageType);
      }

      const merged: Plant = {
        ...existing,
        ...patch,
        name: patch.name ?? existing.name,
        image,
        photoStatus,
        placeholderImageType,
      };

      if (isMockMode) {
        persistMock(plants.map((p) => (p.id === id ? merged : p)));
        return merged;
      }

      if (!user) throw new Error("You must be logged in to edit a plant.");

      const supabase = createClient();
      const row = mapPlantUpdateToDb({
        ...patch,
        image,
        photoStatus,
        placeholderImageType,
      });

      const { data, error } = await supabase
        .from("plants")
        .update(row)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(friendlySaveError(error));

      const updated = mapDbPlantToPlant(data as DbPlant);
      setPlants((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...updated,
                wateringInstructions: p.wateringInstructions,
                fertilizingInstructions: p.fertilizingInstructions,
                pruningInstructions: p.pruningInstructions,
              }
            : p
        )
      );
      return updated;
    },
    [isMockMode, plants, persistMock, user]
  );

  const removePlant = useCallback(
    async (id: string) => {
      if (isMockMode) {
        persistMock(plants.filter((p) => p.id !== id));
        cleanupLocalPlantData(id);
        return;
      }

      if (!user) throw new Error("You must be logged in to remove a plant.");

      const supabase = createClient();
      const { error } = await supabase.from("plants").delete().eq("id", id);
      if (error) throw new Error(friendlySaveError(error));

      cleanupLocalPlantData(id);
      setPlants((prev) => prev.filter((p) => p.id !== id));
    },
    [isMockMode, plants, persistMock, user]
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
        updatePlant,
        removePlant,
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
