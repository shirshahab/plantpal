"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ActivityFeedEvent,
  ActivityReactionType,
  FeedFilter,
  Friend,
  FriendRequest,
  SocialChallenge,
  SocialNotification,
  SocialProfile,
} from "@/lib/social/types";
import { loadLocalFeed } from "@/lib/social/events";

interface FriendsState {
  friends: Friend[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export function useSocialFeed(filter: FeedFilter = "all") {
  const [events, setEvents] = useState<ActivityFeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/social/feed?filter=${filter}&limit=20`);
      const json = (await res.json()) as { ok: boolean; events?: ActivityFeedEvent[] };
      if (json.ok && json.events?.length) {
        setEvents(json.events);
      } else {
        setEvents(loadLocalFeed());
      }
    } catch {
      setEvents(loadLocalFeed());
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { events, loading, refresh };
}

export function useFriends() {
  const [state, setState] = useState<FriendsState>({
    friends: [],
    incoming: [],
    outgoing: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/friends");
      const json = (await res.json()) as FriendsState & { ok: boolean };
      if (json.ok) {
        setState({
          friends: json.friends ?? [],
          incoming: json.incoming ?? [],
          outgoing: json.outgoing ?? [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, loading, refresh };
}

export function useActiveChallenges() {
  const [challenges, setChallenges] = useState<SocialChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/social/challenges");
      const json = (await res.json()) as { ok: boolean; challenges?: SocialChallenge[] };
      if (json.ok) setChallenges(json.challenges ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { challenges, loading, refresh };
}

export async function joinChallenge(
  templateIndex: number,
  scope: "personal" | "family" = "personal"
): Promise<boolean> {
  const res = await fetch("/api/social/challenges", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "join", templateIndex, scope }),
  });
  const json = (await res.json()) as { ok: boolean };
  return json.ok;
}

export function useSocialNotifications() {
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/social/notifications");
      const json = (await res.json()) as {
        ok: boolean;
        notifications?: SocialNotification[];
        unread?: number;
      };
      if (json.ok) {
        setNotifications(json.notifications ?? []);
        setUnread(json.unread ?? 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { notifications, unread, refresh };
}

export async function searchUsers(q: string): Promise<SocialProfile[]> {
  if (q.length < 2) return [];
  const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
  const json = (await res.json()) as { ok: boolean; users?: SocialProfile[] };
  return json.users ?? [];
}

export async function sendFriendRequest(userId: string): Promise<boolean> {
  const res = await fetch("/api/friends", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "send_request", userId }),
  });
  const json = (await res.json()) as { ok: boolean };
  return json.ok;
}

export async function acceptFriendRequest(requestId: string): Promise<boolean> {
  const res = await fetch("/api/friends", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "accept", requestId }),
  });
  const json = (await res.json()) as { ok: boolean };
  return json.ok;
}

export async function declineFriendRequest(requestId: string): Promise<boolean> {
  const res = await fetch("/api/friends", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "decline", requestId }),
  });
  const json = (await res.json()) as { ok: boolean };
  return json.ok;
}

export async function removeFriend(userId: string): Promise<boolean> {
  const res = await fetch("/api/friends", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "remove", userId }),
  });
  const json = (await res.json()) as { ok: boolean };
  return json.ok;
}

export async function toggleReaction(
  feedId: string,
  reactionType: ActivityReactionType,
  remove: boolean
): Promise<void> {
  await fetch("/api/social/reactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedId, reactionType, remove }),
  });
}

export async function postComment(feedId: string, body: string): Promise<boolean> {
  const res = await fetch("/api/social/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedId, body }),
  });
  const json = (await res.json()) as { ok: boolean };
  return json.ok;
}
