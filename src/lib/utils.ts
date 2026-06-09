import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntilNext(
  lastDate: string | null,
  frequencyDays: number | null
): number | null {
  if (!lastDate || !frequencyDays) return null;
  const last = new Date(lastDate);
  const next = new Date(last);
  next.setDate(next.getDate() + frequencyDays);
  const diff = Math.ceil(
    (next.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

export function isOverdue(
  lastDate: string | null,
  frequencyDays: number | null
): boolean {
  const days = daysUntilNext(lastDate, frequencyDays);
  return days !== null && days <= 0;
}
