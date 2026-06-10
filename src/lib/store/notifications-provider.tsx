"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppNotification, NotificationPrefs } from "@/lib/types/notifications";
import { buildAppNotifications } from "@/lib/notifications/notification-engine";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  getNotificationPrefs,
  getReadMap,
  markDigestSent,
  markNotificationsRead,
  saveNotificationPrefs,
  wasDigestSent,
} from "@/lib/notifications/notification-store";
import { pushPermission, showLocalNotification } from "@/lib/notifications/push";
import { useTasks } from "@/lib/store/tasks-provider";
import { usePlants } from "@/lib/store/plants-provider";
import { useAcademy } from "@/lib/store/academy-provider";
import { useReminders } from "@/lib/store/reminders-provider";
import { useSocialNotifications } from "@/lib/social/hooks";
import { useWeather } from "@/lib/hooks/use-weather";
import { loadUserProfile } from "@/lib/profile/user-profile";

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  prefs: NotificationPrefs;
  markRead: (id: string) => void;
  markAllRead: () => void;
  updatePrefs: (patch: Partial<NotificationPrefs>) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function localDayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { groups, ready: tasksReady } = useTasks();
  const { plants } = usePlants();
  const { progress } = useAcademy();
  const { settings } = useReminders();
  const { unread: friendUnread } = useSocialNotifications();

  const [zipCode, setZipCode] = useState("");
  const [prefs, setPrefs] = useState<NotificationPrefs>(getNotificationPrefs);
  const [readVersion, setReadVersion] = useState(0);
  const [dayKey, setDayKey] = useState(() => localDayKey());

  const { weather } = useWeather(zipCode || plants[0]?.zipCode || "");

  useEffect(() => {
    setZipCode(loadUserProfile().zipCode);
    setPrefs(getNotificationPrefs());
  }, []);

  // Re-render when read state / prefs change anywhere in the app.
  useEffect(() => {
    const onChange = () => {
      setPrefs(getNotificationPrefs());
      setReadVersion((v) => v + 1);
    };
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
  }, []);

  // Roll over to a new day without a reload (stable IDs are day-scoped).
  useEffect(() => {
    const interval = setInterval(() => {
      const key = localDayKey();
      setDayKey((prev) => (prev === key ? prev : key));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const notifications = useMemo(() => {
    if (!tasksReady) return [];
    const built = buildAppNotifications({
      todayKey: dayKey,
      taskGroups: groups,
      plants,
      streak: {
        current: progress.currentStreak,
        lastActiveDate: progress.lastActiveDate,
      },
      friendUnread,
      weather: weather ?? null,
      reminders: settings,
      prefs,
    });
    const readMap = getReadMap();
    return built.map((n) => ({ ...n, read: Boolean(readMap[n.id]) }));
    // readVersion forces a re-merge after markRead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tasksReady,
    dayKey,
    groups,
    plants,
    progress.currentStreak,
    progress.lastActiveDate,
    friendUnread,
    weather,
    settings,
    prefs,
    readVersion,
  ]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markRead = useCallback((id: string) => {
    markNotificationsRead([id]);
  }, []);

  const markAllRead = useCallback(() => {
    markNotificationsRead(notifications.map((n) => n.id));
  }, [notifications]);

  const updatePrefs = useCallback((patch: Partial<NotificationPrefs>) => {
    setPrefs(saveNotificationPrefs(patch));
  }, []);

  // Daily scheduled reminder: once per day at/after the user's reminder time,
  // push a local notification digest (PWA/mobile) of unread alerts.
  useEffect(() => {
    if (!tasksReady || !settings.notificationsEnabled) return;
    if (pushPermission() !== "granted") return;

    const check = async () => {
      const now = new Date();
      const key = localDayKey(now);
      if (wasDigestSent("push", key)) return;

      const [h, m] = (settings.reminderTime || "09:00").split(":").map(Number);
      const due = new Date(now);
      due.setHours(h || 9, m || 0, 0, 0);
      if (now < due) return;

      const unread = notifications.filter((n) => !n.read);
      if (unread.length === 0) return;

      const top = unread[0];
      const title =
        unread.length === 1 ? top.title : `${top.title} (+${unread.length - 1} more)`;
      const sent = await showLocalNotification(title, top.body, top.href);
      if (sent) markDigestSent("push", key);
    };

    void check();
    const interval = setInterval(() => void check(), 60_000);
    return () => clearInterval(interval);
  }, [tasksReady, settings.notificationsEnabled, settings.reminderTime, notifications]);

  // Email fallback: when push isn't available, queue a daily email digest.
  useEffect(() => {
    if (!tasksReady || !prefs.emailFallback || !prefs.emailAddress) return;
    const perm = pushPermission();
    if (perm === "granted") return; // push covers it

    const key = localDayKey();
    if (wasDigestSent("email", key)) return;

    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    markDigestSent("email", key); // optimistic — avoid duplicate sends on re-render
    void fetch("/api/notifications/email-digest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: prefs.emailAddress,
        items: unread.map((n) => ({ title: n.title, body: n.body })),
      }),
    }).catch(() => {
      /* best effort */
    });
  }, [tasksReady, prefs.emailFallback, prefs.emailAddress, notifications]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, prefs, markRead, markAllRead, updatePrefs }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
