/** Deterministic daily seed for local rotation (stable within a calendar day). */
export function getDailySeed(city: string, zone: string, date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}|${city.trim().toLowerCase()}|${zone.trim().toLowerCase()}`;
}

export function seedIndex(seed: string, max: number): number {
  if (max <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % max;
}

export function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = seedIndex(`${seed}|${i}`, i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
