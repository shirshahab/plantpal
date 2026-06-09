import type { LandscapePropertyProfile } from "./types";
import { lookupZipRecord } from "@/lib/location/usda-zones";

const STORAGE_KEY = "plantpal-landscape-property";

export function defaultPropertyProfile(zipCode = ""): LandscapePropertyProfile {
  const record = zipCode.length === 5 ? lookupZipRecord(zipCode) : null;
  return {
    zipCode,
    hardinessZone: record?.usdaZone ?? "",
    sunExposure: "mixed",
    yardSize: "medium",
    budgetTier: "tier_2",
    maintenancePreference: "medium",
  };
}

export function loadPropertyProfile(): LandscapePropertyProfile {
  if (typeof window === "undefined") return defaultPropertyProfile();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const profile = loadUserProfileZip();
      return profile ?? defaultPropertyProfile();
    }
    return { ...defaultPropertyProfile(), ...JSON.parse(raw) } as LandscapePropertyProfile;
  } catch {
    return defaultPropertyProfile();
  }
}

function loadUserProfileZip(): LandscapePropertyProfile | null {
  try {
    const userRaw = localStorage.getItem("plantpal-user-profile");
    if (!userRaw) return null;
    const parsed = JSON.parse(userRaw) as { zipCode?: string };
    if (parsed.zipCode?.length === 5) {
      return defaultPropertyProfile(parsed.zipCode);
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function savePropertyProfile(profile: LandscapePropertyProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export async function syncPropertyProfileRemote(
  profile: LandscapePropertyProfile
): Promise<boolean> {
  try {
    const res = await fetch("/api/landscape/property-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });
    const json = (await res.json()) as { ok: boolean };
    return json.ok;
  } catch {
    return false;
  }
}

export async function fetchPropertyProfileRemote(): Promise<LandscapePropertyProfile | null> {
  try {
    const res = await fetch("/api/landscape/property-profile");
    const json = (await res.json()) as { ok: boolean; profile?: LandscapePropertyProfile };
    return json.ok && json.profile ? json.profile : null;
  } catch {
    return null;
  }
}
