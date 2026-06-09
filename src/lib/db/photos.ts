import type { PhotoType } from "@/lib/types/ai";
import type { DbClient } from "./client";
import { safeDb } from "./client";

export interface DbPlantPhoto {
  id: string;
  user_id: string;
  plant_id: string | null;
  photo_url: string;
  photo_type: string;
  notes: string;
  metadata: Record<string, unknown>;
  is_primary: boolean;
  created_at: string;
}

export interface StoredPlantPhoto {
  id: string;
  userId: string;
  plantId: string | null;
  photoUrl: string;
  photoType: PhotoType;
  notes: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

function mapPhoto(row: DbPlantPhoto): StoredPlantPhoto {
  return {
    id: row.id,
    userId: row.user_id,
    plantId: row.plant_id,
    photoUrl: row.photo_url,
    photoType: (row.photo_type as PhotoType) ?? "profile",
    notes: row.notes ?? "",
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export async function getPlantPhotos(
  db: DbClient,
  userId: string
): Promise<StoredPlantPhoto[]> {
  const { data } = await safeDb(async () => {
    const res = await db
      .from("plant_photos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(300);
    return { data: (res.data ?? []) as DbPlantPhoto[], error: res.error };
  });
  return (data ?? []).map(mapPhoto);
}

export async function getPhotosForPlant(
  db: DbClient,
  userId: string,
  plantId: string
): Promise<StoredPlantPhoto[]> {
  const { data } = await safeDb(async () => {
    const res = await db
      .from("plant_photos")
      .select("*")
      .eq("user_id", userId)
      .eq("plant_id", plantId)
      .order("created_at", { ascending: false });
    return { data: (res.data ?? []) as DbPlantPhoto[], error: res.error };
  });
  return (data ?? []).map(mapPhoto);
}

export async function createPlantPhoto(
  db: DbClient,
  userId: string,
  input: {
    plantId: string | null;
    photoUrl: string;
    photoType: PhotoType;
    notes?: string;
    metadata?: Record<string, unknown>;
    isPrimary?: boolean;
  }
): Promise<{ photo: StoredPlantPhoto | null; error: string | null }> {
  const { data, error } = await safeDb(async () => {
    const res = await db
      .from("plant_photos")
      .insert({
        user_id: userId,
        plant_id: input.plantId,
        photo_url: input.photoUrl,
        photo_type: input.photoType,
        notes: input.notes ?? "",
        metadata: input.metadata ?? {},
        is_primary: input.isPrimary ?? input.photoType === "profile",
      })
      .select()
      .single();
    return { data: res.data as DbPlantPhoto | null, error: res.error };
  });

  if (error || !data) return { photo: null, error };
  return { photo: mapPhoto(data), error: null };
}

export async function getScannerPhotos(
  db: DbClient,
  userId: string
): Promise<StoredPlantPhoto[]> {
  const { data } = await safeDb(async () => {
    const res = await db
      .from("plant_photos")
      .select("*")
      .eq("user_id", userId)
      .in("photo_type", ["identification", "health_scan", "nursery_tag", "growth"])
      .order("created_at", { ascending: false })
      .limit(100);
    return { data: (res.data ?? []) as DbPlantPhoto[], error: res.error };
  });
  return (data ?? []).map(mapPhoto);
}
