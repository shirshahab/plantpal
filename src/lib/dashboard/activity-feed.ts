export type ActivityKind =
  | "plant_added"
  | "scan_completed"
  | "task_completed"
  | "photo_uploaded"
  | "badge_unlocked";

export interface ActivityFeedItem {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle?: string;
  emoji: string;
  at: string;
  href?: string;
}

const KIND_EMOJI: Record<ActivityKind, string> = {
  plant_added: "🌱",
  scan_completed: "🔍",
  task_completed: "✅",
  photo_uploaded: "📸",
  badge_unlocked: "🏅",
};

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function buildActivityFeed(input: {
  plants: { id: string; name: string; createdAt: string; lastGrowthPhotoAt?: string | null }[];
  scanHistory: { id: string; plantName: string; createdAt: string }[];
  careLogs: { id: string; plantId: string; actionType: string; createdAt: string }[];
  plantNameById: Record<string, string>;
  growthEntries: { id: string; plantId: string; caption?: string; createdAt: string }[];
  badgeUnlocks: { id: string; title: string; at: string }[];
}): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [];

  for (const p of input.plants) {
    items.push({
      id: `plant-${p.id}`,
      kind: "plant_added",
      title: `Added ${p.name}`,
      emoji: KIND_EMOJI.plant_added,
      at: p.createdAt,
      href: `/plants/${p.id}`,
    });
    if (p.lastGrowthPhotoAt) {
      items.push({
        id: `photo-${p.id}-${p.lastGrowthPhotoAt}`,
        kind: "photo_uploaded",
        title: `Progress photo: ${p.name}`,
        emoji: KIND_EMOJI.photo_uploaded,
        at: p.lastGrowthPhotoAt,
        href: `/plants/${p.id}`,
      });
    }
  }

  for (const s of input.scanHistory) {
    items.push({
      id: `scan-${s.id}`,
      kind: "scan_completed",
      title: `Identified ${s.plantName}`,
      subtitle: "Plant Camera",
      emoji: KIND_EMOJI.scan_completed,
      at: s.createdAt,
      href: "/scanner/history",
    });
  }

  for (const log of input.careLogs) {
    items.push({
      id: `log-${log.id}`,
      kind: "task_completed",
      title: `${log.actionType}: ${input.plantNameById[log.plantId] ?? "Plant"}`,
      emoji: KIND_EMOJI.task_completed,
      at: log.createdAt,
      href: input.plantNameById[log.plantId]
        ? `/plants/${log.plantId}`
        : "/today",
    });
  }

  for (const g of input.growthEntries) {
    items.push({
      id: `growth-${g.id}`,
      kind: "photo_uploaded",
      title: g.caption ? `Photo: ${g.caption}` : "Growth photo added",
      subtitle: input.plantNameById[g.plantId],
      emoji: KIND_EMOJI.photo_uploaded,
      at: g.createdAt,
      href: `/plants/${g.plantId}`,
    });
  }

  for (const b of input.badgeUnlocks) {
    items.push({
      id: `badge-${b.id}`,
      kind: "badge_unlocked",
      title: `Badge earned: ${b.title}`,
      emoji: KIND_EMOJI.badge_unlocked,
      at: b.at,
      href: "/achievements",
    });
  }

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function firstName(fullName: string | null | undefined): string | null {
  if (!fullName?.trim()) return null;
  return fullName.trim().split(/\s+/)[0] ?? null;
}
