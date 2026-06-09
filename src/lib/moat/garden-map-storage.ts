import type { GardenSpace, GardenSpaceType, GardenZone, ZonePlantPlacement } from "./garden-map-types";

const STORAGE_KEY = "plantpal-garden-map";

function readRaw(): GardenSpace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GardenSpace[]) : [];
  } catch {
    return [];
  }
}

function writeRaw(spaces: GardenSpace[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(spaces));
}

export function getGardenSpaces(): GardenSpace[] {
  return readRaw();
}

export function createGardenSpace(input: {
  name: string;
  type: GardenSpaceType;
  photoUrl?: string | null;
}): GardenSpace {
  const now = new Date().toISOString();
  const space: GardenSpace = {
    id: crypto.randomUUID(),
    name: input.name,
    type: input.type,
    photoUrl: input.photoUrl ?? null,
    zones: [],
    placements: [],
    createdAt: now,
    updatedAt: now,
  };
  writeRaw([space, ...readRaw()]);
  return space;
}

export function updateGardenSpace(id: string, patch: Partial<GardenSpace>): GardenSpace | null {
  const all = readRaw();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  writeRaw(all);
  return all[idx];
}

export function addZone(spaceId: string, zone: Omit<GardenZone, "id">): GardenZone | null {
  const all = readRaw();
  const idx = all.findIndex((s) => s.id === spaceId);
  if (idx === -1) return null;
  const newZone: GardenZone = { ...zone, id: crypto.randomUUID() };
  all[idx].zones.push(newZone);
  all[idx].updatedAt = new Date().toISOString();
  writeRaw(all);
  return newZone;
}

export function addPlacement(
  spaceId: string,
  placement: Omit<ZonePlantPlacement, "id">
): ZonePlantPlacement | null {
  const all = readRaw();
  const idx = all.findIndex((s) => s.id === spaceId);
  if (idx === -1) return null;
  const p: ZonePlantPlacement = { ...placement, id: crypto.randomUUID() };
  all[idx].placements.push(p);
  all[idx].updatedAt = new Date().toISOString();
  writeRaw(all);
  return p;
}

/**
 * One-time cleanup: remove the legacy auto-seeded demo garden map
 * so new/returning users only see spaces they created themselves.
 */
export function purgeDemoGardenMap(): void {
  const all = readRaw();
  const cleaned = all.filter((s) => s.id !== "demo-backyard");
  if (cleaned.length !== all.length) {
    writeRaw(cleaned);
  }
}
