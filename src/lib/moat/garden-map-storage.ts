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

export function getDefaultDemoSpaces(): GardenSpace[] {
  const now = new Date().toISOString();
  return [
    {
      id: "demo-backyard",
      name: "Backyard Oasis",
      type: "backyard",
      photoUrl: null,
      zones: [
        {
          id: "zone-roses",
          name: "Rose Bed #1",
          x: 0.1,
          y: 0.55,
          width: 0.35,
          height: 0.3,
          sunExposure: "full_sun",
          shadeHours: 2,
        },
        {
          id: "zone-lemon",
          name: "West Fence Lemon",
          x: 0.65,
          y: 0.2,
          width: 0.25,
          height: 0.45,
          sunExposure: "full_sun",
          shadeHours: 1,
        },
      ],
      placements: [
        {
          id: "pl-lemon",
          zoneId: "zone-lemon",
          plantId: null,
          label: "West Fence Lemon Tree",
          sunExposure: "full_sun",
          waterSchedule: "Deep water weekly",
          fertilizerSchedule: "Citrus feed monthly (Mar–Sep)",
          healthScore: 88,
          x: 0.72,
          y: 0.35,
        },
        {
          id: "pl-rose",
          zoneId: "zone-roses",
          plantId: null,
          label: "Rose Bed #1",
          sunExposure: "full_sun",
          waterSchedule: "2–3× per week",
          fertilizerSchedule: "Rose food every 6 weeks",
          healthScore: 79,
          x: 0.25,
          y: 0.65,
        },
        {
          id: "pl-monstera",
          zoneId: "zone-roses",
          plantId: null,
          label: "Indoor Monstera Corner",
          sunExposure: "partial_sun",
          waterSchedule: "When top inch dry",
          fertilizerSchedule: "Balanced liquid monthly",
          healthScore: 92,
          x: 0.15,
          y: 0.75,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function seedGardenMapIfEmpty(): void {
  if (readRaw().length === 0) {
    writeRaw(getDefaultDemoSpaces());
  }
}
