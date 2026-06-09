import type {
  IdentificationProvider,
  PlantIdentificationResponse,
  AIResponseSource,
} from "@/lib/types/ai";

const STORAGE_KEY = "plantpal-scan-history";
const MAX_ENTRIES = 50;

export interface ScanHistoryEntry {
  id: string;
  createdAt: string;
  photoUrl: string;
  photoUrls: string[];
  topMatch: string;
  scientificName: string;
  confidenceScore: number;
  source: AIResponseSource;
  identificationProvider: IdentificationProvider;
  addedToGarden: boolean;
  plantId?: string | null;
  friendlyHeadline?: string;
}

function readAll(): ScanHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScanHistoryEntry[];
  } catch {
    return [];
  }
}

function writeAll(entries: ScanHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function getScanHistory(): ScanHistoryEntry[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveScanToHistory(input: {
  photoUrl: string;
  photoUrls?: string[];
  result: PlantIdentificationResponse;
  friendlyHeadline?: string;
}): ScanHistoryEntry {
  const entry: ScanHistoryEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    photoUrl: input.photoUrl,
    photoUrls: input.photoUrls?.length ? input.photoUrls : [input.photoUrl],
    topMatch: input.result.common_name,
    scientificName: input.result.scientific_name,
    confidenceScore: input.result.confidence_score,
    source: input.result.source,
    identificationProvider: input.result.identification_provider,
    addedToGarden: false,
    friendlyHeadline: input.friendlyHeadline,
  };

  const all = readAll();
  writeAll([entry, ...all]);
  return entry;
}

export function markScanAddedToGarden(scanId: string, plantId?: string | null): void {
  const all = readAll();
  const idx = all.findIndex((e) => e.id === scanId);
  if (idx === -1) return;
  all[idx] = { ...all[idx], addedToGarden: true, plantId: plantId ?? null };
  writeAll(all);
}
