import type { GenomeEvent, GenomeEventType, PlantGenomeRecord } from "./types";

const STORAGE_KEY = "plantpal-genomes";

function loadAll(): Record<string, PlantGenomeRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PlantGenomeRecord>) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, PlantGenomeRecord>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getGenomeRecord(plantId: string): PlantGenomeRecord {
  const all = loadAll();
  return all[plantId] ?? { plantId, events: [], lastComputedAt: null };
}

export function saveGenomeRecord(record: PlantGenomeRecord): void {
  const all = loadAll();
  all[record.plantId] = record;
  saveAll(all);
}

export function appendGenomeEvent(
  plantId: string,
  type: GenomeEventType,
  payload: Record<string, unknown> = {}
): GenomeEvent {
  const record = getGenomeRecord(plantId);
  const event: GenomeEvent = {
    id: `ge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    plantId,
    type,
    payload,
    recordedAt: new Date().toISOString(),
  };
  record.events = [...record.events.slice(-99), event];
  saveGenomeRecord(record);
  return event;
}

export function clearAllGenomes(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export { STORAGE_KEY as GENOME_STORAGE_KEY };
