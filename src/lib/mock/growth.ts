export function daysSincePlantStart(createdAt: string, entryDate: string): number {
  const start = new Date(createdAt).getTime();
  const entry = new Date(entryDate).getTime();
  return Math.max(1, Math.ceil((entry - start) / 86400000));
}
