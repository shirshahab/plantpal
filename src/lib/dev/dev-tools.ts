import { MOCK_PLANTS } from "@/lib/mock/plants";
import {
  PROFILE_STORAGE_KEY,
  DEMO_MODE_KEY,
} from "@/lib/profile/user-profile";
import { DEFAULT_PROFILE } from "@/lib/types/profile";
import { seedDemoGarden } from "@/lib/demo/seed-demo-garden";

/** All localStorage keys used by PlantPal providers. */
export const PLANTPAL_STORAGE_KEYS = [
  "plantpal-plants",
  "plantpal-education",
  "plantpal-reminders",
  "plantpal-task-states",
  "plantpal-care-logs",
  "plantpal-photo-history",
  "plantpal-user-plant-goals",
  "plantpal-plant-milestones",
  "plantpal-plant-missions",
  "plantpal-ai-results",
  "plantpal-growth",
  "plantpal-harvest",
  "plantpal-achievements",
  "plantpal-saved-tips",
  "plantpal-rarity",
  "plantpal-stats",
  "plantpal-genomes",
  "plantpal-waitlist-signups",
  "plantpal-install-dismissed",
  "plantpal-qa-checklist",
  "plantpal-founder-mode",
  "plantpal-scan-history",
  PROFILE_STORAGE_KEY,
  DEMO_MODE_KEY,
] as const;

export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Show raw scanner API errors in UI (dev, /debug/*, or ?scanner_debug=1). */
export function isScannerDebugUI(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (typeof window === "undefined") return false;
  if (window.location.pathname.startsWith("/debug")) return true;
  return new URLSearchParams(window.location.search).get("scanner_debug") === "1";
}

export function clearLocalData(): void {
  for (const key of PLANTPAL_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
  localStorage.setItem("plantpal-plants", JSON.stringify(MOCK_PLANTS));
}

export function resetOnboarding(): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));
  localStorage.removeItem(DEMO_MODE_KEY);
}

export function resetAiCache(): void {
  localStorage.removeItem("plantpal-ai-results");
}

export function resetTasks(): void {
  localStorage.removeItem("plantpal-task-states");
  localStorage.removeItem("plantpal-care-logs");
  localStorage.removeItem("plantpal-tasks");
}

export function resetGenome(): void {
  localStorage.removeItem("plantpal-genomes");
}

export { clearScanHistory } from "@/lib/scanner/scan-history";

export function loadDemoGarden(zip = "91107"): boolean {
  return seedDemoGarden(zip);
}
