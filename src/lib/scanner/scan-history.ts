import type {
  IdentificationProvider,
  PlantIdentificationResponse,
  AIResponseSource,
} from "@/lib/types/ai";
import {
  buildScanHistoryThumbnail,
  isLocalPreviewSizeOk,
} from "@/lib/scanner/scan-history-thumbnail";
import {
  safeGetLocalStorageItem,
  safeRemoveLocalStorageItem,
  safeSetLocalStorageItem,
  isStorageQuotaError,
} from "@/lib/storage/safe-local-storage";

export const STORAGE_KEY = "plantpal-scan-history";
const STORAGE_VERSION = 3;
/** Offline / logged-out: keep only recent lightweight metadata. */
const MAX_LOCAL_ENTRIES = 10;
/** Purge entire blob if legacy payload exceeds ~200 KB. */
const BLOATED_PAYLOAD_BYTES = 200 * 1024;

export const SCAN_HISTORY_QUOTA_MESSAGE = "Scan saved without photo preview.";

export interface ScanHistoryEntry {
  id: string;
  createdAt: string;
  plantName: string;
  scientificName: string;
  confidenceScore: number;
  source: AIResponseSource;
  identificationProvider: IdentificationProvider;
  addedToGarden: boolean;
  plantId?: string | null;
  /** Supabase Storage HTTPS URL when logged in. */
  thumbnailUrl?: string | null;
  /** Offline-only tiny preview (data URL ≤30 KB). Never stored when logged in. */
  localPreviewUrl?: string | null;
}

export interface SaveScanHistoryResult {
  entry: ScanHistoryEntry;
  warning?: string;
}

interface StoredScanHistory {
  version: number;
  entries: ScanHistoryEntry[];
}

interface LegacyScanHistoryEntry {
  id?: string;
  createdAt?: string;
  photoUrl?: string;
  photoUrls?: string[];
  topMatch?: string;
  plantName?: string;
  scientificName?: string;
  confidenceScore?: number;
  source?: AIResponseSource;
  identificationProvider?: IdentificationProvider;
  addedToGarden?: boolean;
  plantId?: string | null;
  friendlyHeadline?: string;
  thumbnailUrl?: string | null;
  remotePhotoUrl?: string | null;
  localPreviewUrl?: string | null;
  photoCount?: number;
}

function isHttpsUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && (url.startsWith("https://") || url.startsWith("http://"));
}

function stripLocalDataUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith("data:")) return null;
  return isLocalPreviewSizeOk(url) ? url : null;
}

function slimEntry(entry: ScanHistoryEntry): ScanHistoryEntry {
  const thumbnailUrl = isHttpsUrl(entry.thumbnailUrl) ? entry.thumbnailUrl : null;
  const localPreviewUrl =
    thumbnailUrl ? null : stripLocalDataUrl(entry.localPreviewUrl ?? entry.thumbnailUrl);
  return {
    id: entry.id,
    createdAt: entry.createdAt,
    plantName: entry.plantName,
    scientificName: entry.scientificName,
    confidenceScore: entry.confidenceScore,
    source: entry.source,
    identificationProvider: entry.identificationProvider,
    addedToGarden: entry.addedToGarden,
    plantId: entry.plantId ?? null,
    thumbnailUrl,
    localPreviewUrl,
  };
}

function migrateLegacyEntry(raw: LegacyScanHistoryEntry): ScanHistoryEntry | null {
  if (!raw.id || !raw.createdAt) return null;

  const legacyPhoto = typeof raw.photoUrl === "string" ? raw.photoUrl : "";
  const supabaseUrl =
    (isHttpsUrl(raw.remotePhotoUrl) ? raw.remotePhotoUrl : null) ??
    (isHttpsUrl(raw.thumbnailUrl) ? raw.thumbnailUrl : null) ??
    (isHttpsUrl(legacyPhoto) ? legacyPhoto : null);

  const localPreview =
    supabaseUrl ? null : stripLocalDataUrl(raw.localPreviewUrl ?? raw.thumbnailUrl ?? legacyPhoto);

  return slimEntry({
    id: raw.id,
    createdAt: raw.createdAt,
    plantName: raw.plantName ?? raw.topMatch ?? "Unknown plant",
    scientificName: raw.scientificName ?? "",
    confidenceScore: raw.confidenceScore ?? 0,
    source: raw.source ?? "mock",
    identificationProvider: raw.identificationProvider ?? "mock",
    addedToGarden: raw.addedToGarden ?? false,
    plantId: raw.plantId ?? null,
    thumbnailUrl: supabaseUrl,
    localPreviewUrl: localPreview,
  });
}

function parseStored(raw: string): ScanHistoryEntry[] {
  const parsed = JSON.parse(raw) as StoredScanHistory | LegacyScanHistoryEntry[];

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => migrateLegacyEntry(item as LegacyScanHistoryEntry))
      .filter((e): e is ScanHistoryEntry => e !== null)
      .map(slimEntry);
  }

  if (parsed && typeof parsed === "object" && Array.isArray(parsed.entries)) {
    return parsed.entries.map((e) => slimEntry(e as ScanHistoryEntry));
  }

  return [];
}

function readAll(): ScanHistoryEntry[] {
  const raw = safeGetLocalStorageItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return parseStored(raw);
  } catch {
    return [];
  }
}

function metadataOnly(entries: ScanHistoryEntry[]): ScanHistoryEntry[] {
  return entries.map((e) => ({
    ...e,
    thumbnailUrl: isHttpsUrl(e.thumbnailUrl) ? e.thumbnailUrl : null,
    localPreviewUrl: null,
  }));
}

function persist(entries: ScanHistoryEntry[]): { ok: boolean; quotaExceeded: boolean } {
  const trimmed = entries.slice(0, MAX_LOCAL_ENTRIES).map(slimEntry);
  const payload: StoredScanHistory = { version: STORAGE_VERSION, entries: trimmed };
  const serialized = JSON.stringify(payload);

  let result = safeSetLocalStorageItem(STORAGE_KEY, serialized);
  if (result.ok) return { ok: true, quotaExceeded: false };

  if (!result.quotaExceeded) return { ok: false, quotaExceeded: false };

  const metaOnly = metadataOnly(trimmed);
  result = safeSetLocalStorageItem(
    STORAGE_KEY,
    JSON.stringify({ version: STORAGE_VERSION, entries: metaOnly })
  );
  if (result.ok) return { ok: true, quotaExceeded: true };

  safeRemoveLocalStorageItem(STORAGE_KEY);
  result = safeSetLocalStorageItem(
    STORAGE_KEY,
    JSON.stringify({ version: STORAGE_VERSION, entries: metaOnly.slice(0, 3) })
  );
  return { ok: result.ok, quotaExceeded: true };
}

function isBloatedPayload(raw: string): boolean {
  if (raw.length > BLOATED_PAYLOAD_BYTES) return true;
  return (
    raw.includes('"photoUrl":"data:') ||
    raw.includes('"photoUrls":["data:') ||
    /"photoUrl":"data:[^"]{50000,}/.test(raw)
  );
}

/** Purge legacy base64 blobs on load — never throws. */
export function migrateScanHistoryStorage(): boolean {
  try {
    const raw = safeGetLocalStorageItem(STORAGE_KEY);
    if (!raw) return false;

    if (isBloatedPayload(raw)) {
      console.warn("[scan-history] purging bloated local scan history");
      safeRemoveLocalStorageItem(STORAGE_KEY);
      try {
        const entries = parseStored(raw).map(slimEntry).slice(0, MAX_LOCAL_ENTRIES);
        if (entries.length > 0) {
          persist(metadataOnly(entries));
        }
      } catch {
        /* metadata-only recovery failed — history cleared */
      }
      return true;
    }

    const needsRewrite =
      !raw.includes(`"version":${STORAGE_VERSION}`) ||
      raw.includes('"remotePhotoUrl"') ||
      raw.includes('"photoUrl"');

    if (needsRewrite) {
      const entries = readAll();
      persist(entries);
      console.info("[scan-history] migrated scan history to v3 metadata-only storage");
      return true;
    }

    return false;
  } catch (e) {
    console.error("[scan-history] migration failed", e);
    safeRemoveLocalStorageItem(STORAGE_KEY);
    return false;
  }
}

if (typeof window !== "undefined") {
  migrateScanHistoryStorage();
}

export function getScanHistoryDisplayUrl(entry: ScanHistoryEntry): string | null {
  return entry.thumbnailUrl ?? entry.localPreviewUrl ?? null;
}

export function getScanHistory(): ScanHistoryEntry[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function clearScanHistory(): void {
  safeRemoveLocalStorageItem(STORAGE_KEY);
}

function buildEntryFromInput(
  input: {
    result: PlantIdentificationResponse;
    supabasePhotoUrl?: string | null;
    localPreviewUrl?: string | null;
  },
  id?: string
): ScanHistoryEntry {
  return slimEntry({
    id: id ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    plantName: input.result.common_name,
    scientificName: input.result.scientific_name,
    confidenceScore: input.result.confidence_score,
    source: input.result.source,
    identificationProvider: input.result.identification_provider,
    addedToGarden: false,
    plantId: null,
    thumbnailUrl: input.supabasePhotoUrl ?? null,
    localPreviewUrl: input.supabasePhotoUrl ? null : (input.localPreviewUrl ?? null),
  });
}

/** Save lightweight scan metadata — never throws; never blocks identification. */
export async function saveScanToHistory(input: {
  photoUrl: string;
  photoUrls?: string[];
  result: PlantIdentificationResponse;
  friendlyHeadline?: string;
  /** Supabase Storage URL from identify API when logged in. */
  remotePhotoUrl?: string | null;
}): Promise<SaveScanHistoryResult> {
  try {
    const supabasePhotoUrl = isHttpsUrl(input.remotePhotoUrl) ? input.remotePhotoUrl : null;
    let localPreviewUrl: string | null = null;

    if (!supabasePhotoUrl && input.photoUrl.startsWith("data:")) {
      if (isLocalPreviewSizeOk(input.photoUrl)) {
        localPreviewUrl = input.photoUrl;
      } else {
        localPreviewUrl = await buildScanHistoryThumbnail(input.photoUrl);
      }
    }

    const entry = buildEntryFromInput({
      result: input.result,
      supabasePhotoUrl,
      localPreviewUrl,
    });

    const { ok, quotaExceeded } = persist([entry, ...readAll()]);

    let warning: string | undefined;
    if (quotaExceeded || !ok) {
      warning = SCAN_HISTORY_QUOTA_MESSAGE;
    } else if (!entry.thumbnailUrl && !entry.localPreviewUrl && input.photoUrl.startsWith("data:")) {
      warning = SCAN_HISTORY_QUOTA_MESSAGE;
    }

    return { entry, warning };
  } catch (error) {
    console.error("[scan-history] save failed", error);
    const entry = buildEntryFromInput({
      result: input.result,
      supabasePhotoUrl: isHttpsUrl(input.remotePhotoUrl) ? input.remotePhotoUrl : null,
    });
    if (isStorageQuotaError(error)) {
      safeRemoveLocalStorageItem(STORAGE_KEY);
      persist([entry]);
    }
    return { entry, warning: SCAN_HISTORY_QUOTA_MESSAGE };
  }
}

export function markScanAddedToGarden(scanId: string, plantId?: string | null): void {
  const all = readAll();
  const idx = all.findIndex((e) => e.id === scanId);
  if (idx === -1) return;
  all[idx] = { ...all[idx], addedToGarden: true, plantId: plantId ?? null };
  persist(all);
}
