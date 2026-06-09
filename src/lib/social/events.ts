import type {
  ActivityFeedEvent,
  FeedEventType,
  FeedVisibility,
  Friend,
  FriendRequest,
  SocialChallenge,
  SocialNotification,
} from "./types";
import { EVENT_EMOJI } from "./constants";

const FEED_KEY = "plantpal-social-feed";
const FRIENDS_KEY = "plantpal-social-friends";
const REQUESTS_KEY = "plantpal-social-requests";
const CHALLENGES_KEY = "plantpal-social-challenges";
const NOTIFICATIONS_KEY = "plantpal-social-notifications";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function loadLocalFeed(): ActivityFeedEvent[] {
  return read<ActivityFeedEvent[]>(FEED_KEY, []);
}

export function saveLocalFeed(events: ActivityFeedEvent[]): void {
  write(FEED_KEY, events);
}

export function loadLocalFriends(): Friend[] {
  return read<Friend[]>(FRIENDS_KEY, []);
}

export function loadLocalRequests(): FriendRequest[] {
  return read<FriendRequest[]>(REQUESTS_KEY, []);
}

export function loadLocalChallenges(): SocialChallenge[] {
  return read<SocialChallenge[]>(CHALLENGES_KEY, []);
}

export function loadLocalNotifications(): SocialNotification[] {
  return read<SocialNotification[]>(NOTIFICATIONS_KEY, []);
}

export function appendLocalFeedEvent(
  event: Omit<ActivityFeedEvent, "id" | "createdAt">
): ActivityFeedEvent {
  const full: ActivityFeedEvent = {
    ...event,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const existing = loadLocalFeed();
  saveLocalFeed([full, ...existing].slice(0, 100));
  return full;
}

export function appendLocalNotification(
  notification: Omit<SocialNotification, "id" | "createdAt" | "readAt">
): void {
  const full: SocialNotification = {
    ...notification,
    id: crypto.randomUUID(),
    readAt: null,
    createdAt: new Date().toISOString(),
  };
  write(NOTIFICATIONS_KEY, [full, ...loadLocalNotifications()].slice(0, 50));
}

export interface PublishEventInput {
  userId: string;
  eventType: FeedEventType;
  title: string;
  body?: string;
  visibility?: FeedVisibility;
  groupId?: string | null;
  payload?: Record<string, unknown>;
  actorName?: string;
}

/** Publish activity to API (Supabase) with localStorage fallback. */
export async function publishActivityEvent(input: PublishEventInput): Promise<void> {
  const body = {
    eventType: input.eventType,
    title: input.title,
    body: input.body ?? "",
    visibility: input.visibility ?? "friends",
    groupId: input.groupId ?? null,
    payload: input.payload ?? {},
    emoji: EVENT_EMOJI[input.eventType],
  };

  appendLocalFeedEvent({
    userId: input.userId,
    eventType: input.eventType,
    visibility: input.visibility ?? "friends",
    groupId: input.groupId ?? null,
    title: input.title,
    body: input.body ?? "",
    emoji: EVENT_EMOJI[input.eventType],
    payload: input.payload ?? {},
    actor: input.actorName
      ? {
          id: input.userId,
          fullName: input.actorName,
          email: null,
          avatarUrl: null,
        }
      : undefined,
  });

  try {
    await fetch("/api/social/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* local fallback already saved */
  }
}

export function relativeSocialTime(iso: string): string {
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

export function formatFeedLine(actorName: string, title: string): string {
  const trimmed = title.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("added ") ||
    lower.startsWith("completed ") ||
    lower.startsWith("earned ") ||
    lower.startsWith("uploaded ") ||
    lower.startsWith("harvested ") ||
    lower.startsWith("diagnosed ") ||
    lower.startsWith("reached ")
  ) {
    return `${actorName} ${trimmed}`;
  }
  return `${actorName} — ${trimmed}`;
}
