"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { PhotoType } from "@/lib/types/ai";
import {
  dataUrlToBlob,
  uploadPlantPhotoClient,
} from "@/lib/storage/plant-photos";
import { useAuth } from "@/lib/store/auth-provider";
import { useSync } from "@/lib/store/sync-provider";
import {
  canUseSupabase,
  createPlantPhoto,
  getDb,
  getPlantPhotos,
  type StoredPlantPhoto,
} from "@/lib/db";
import { appendGenomeEvent } from "@/lib/genome/storage";

export type { StoredPlantPhoto } from "@/lib/db/photos";
export type PhotoFilter = "all" | PhotoType;

const STORAGE_KEY = "plantpal-photo-history";

interface AddPhotoInput {
  plantId: string | null;
  photoUrl: string;
  photoType: PhotoType;
  notes?: string;
  metadata?: Record<string, unknown>;
  file?: Blob | File | null;
}

interface PhotosContextValue {
  ready: boolean;
  photos: StoredPlantPhoto[];
  addPhoto: (input: AddPhotoInput) => Promise<StoredPlantPhoto>;
  getPhotosForPlant: (plantId: string, filter?: PhotoFilter) => StoredPlantPhoto[];
  refreshPhotos: () => Promise<void>;
}

const PhotosContext = createContext<PhotosContextValue | null>(null);

export function PhotosProvider({ children }: { children: React.ReactNode }) {
  const { user, isMockMode } = useAuth();
  const { markPending, markSynced, markFailed } = useSync();
  const [photos, setPhotos] = useState<StoredPlantPhoto[]>([]);
  const [ready, setReady] = useState(false);

  const persistLocal = useCallback((next: StoredPlantPhoto[]) => {
    setPhotos(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const loadLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPhotos(JSON.parse(raw) as StoredPlantPhoto[]);
    } catch {
      /* empty */
    }
  }, []);

  const refreshPhotos = useCallback(async () => {
    if (canUseSupabase(user?.id) && !isMockMode) {
      markPending();
      const db = getDb();
      const remote = await getPlantPhotos(db, user.id);
      setPhotos(remote);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
      markSynced();
    } else {
      loadLocal();
    }
  }, [user?.id, isMockMode, loadLocal, markPending, markSynced]);

  useEffect(() => {
    async function init() {
      await refreshPhotos();
      setReady(true);
    }
    init();
  }, [refreshPhotos]);

  const addPhoto = useCallback(
    async (input: AddPhotoInput): Promise<StoredPlantPhoto> => {
      let photoUrl = input.photoUrl;
      const userId = user?.id ?? "local";

      if (canUseSupabase(user?.id) && !isMockMode) {
        markPending();
        const supabase = getDb();

        if (input.file) {
          const uploaded = await uploadPlantPhotoClient(
            supabase,
            user.id,
            input.file,
            input.photoType
          );
          if (uploaded) photoUrl = uploaded;
        } else if (input.photoUrl.startsWith("data:")) {
          const blob = dataUrlToBlob(input.photoUrl);
          const uploaded = await uploadPlantPhotoClient(
            supabase,
            user.id,
            blob,
            input.photoType
          );
          if (uploaded) photoUrl = uploaded;
        }

        const { photo, error } = await createPlantPhoto(supabase, user.id, {
          plantId: input.plantId,
          photoUrl,
          photoType: input.photoType,
          notes: input.notes,
          metadata: input.metadata,
          isPrimary: input.photoType === "profile",
        });

        if (photo) {
          persistLocal([photo, ...photos]);
          if (input.plantId) {
            appendGenomeEvent(
              input.plantId,
              input.photoType === "health_scan" ? "health_scan" : "photo_added",
              { photoType: input.photoType }
            );
          }
          markSynced();
          return photo;
        }
        if (error) markFailed(error);
      }

      const record: StoredPlantPhoto = {
        id: crypto.randomUUID(),
        userId,
        plantId: input.plantId,
        photoUrl,
        photoType: input.photoType,
        notes: input.notes ?? "",
        metadata: input.metadata ?? {},
        createdAt: new Date().toISOString(),
      };

      persistLocal([record, ...photos]);
      if (input.plantId) {
        appendGenomeEvent(
          input.plantId,
          input.photoType === "health_scan" ? "health_scan" : "photo_added",
          { photoType: input.photoType }
        );
      }
      return record;
    },
    [user?.id, isMockMode, photos, persistLocal, markPending, markSynced, markFailed]
  );

  const getPhotosForPlant = useCallback(
    (plantId: string, filter: PhotoFilter = "all") => {
      return photos.filter((p) => {
        if (p.plantId !== plantId) return false;
        if (filter === "all") return true;
        return p.photoType === filter;
      });
    },
    [photos]
  );

  return (
    <PhotosContext.Provider
      value={{ ready, photos, addPhoto, getPhotosForPlant, refreshPhotos }}
    >
      {children}
    </PhotosContext.Provider>
  );
}

export function usePhotos() {
  const ctx = useContext(PhotosContext);
  if (!ctx) throw new Error("usePhotos must be used within PhotosProvider");
  return ctx;
}
