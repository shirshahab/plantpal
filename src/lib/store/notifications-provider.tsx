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
import type { SocialNotification } from "@/lib/social/types";
import {
  buildAppNotifications,
  type ActiveHealthReportSummary,
} from "@/lib/notifications/notification-engine";
import {
  HEALTH_REPORTS_CHANGED_EVENT,
  getActiveHealthReports,
} from "@/lib/health/report-storage";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  appendNotificationHistory,
  dismissNotifications,
  getDismissedMap,
  getNotificationPrefs,
  getReadMap,
  markDigestSent,
  markNotificationsRead,
  saveNotificationPrefs,
  wasDigestSent,
} from "@/lib/notifications/notification-store";
import {
  pushPermission,
  registerPushToken,
  showLocalNotification,
} from "@/lib/notifications/push";
import { recordNotificationEvent } from "@/lib/notifications/notification-analytics";
import { useTasks } from "@/lib/store/tasks-provider";
import { usePlants } from "@/lib/store/plants-provider";
import { useAcademy } from "@/lib/store/academy-provider";
import { useReminders } from "@/lib/store/reminders-provider";
import { useActiveChallenges, useSocialNotifications } from "@/lib/social/hooks";
import { useWeather } from "@/lib/hooks/use-weather";
import { isOnboardingComplete, loadUserProfile } from "@/lib/profile/user-profile";

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  prefs: NotificationPrefs;
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Remove a notification from the list (persists for daily IDs). */
  dismiss: (id: string) => void;
  dismissAll: () => void;
  updatePrefs: (patch: Partial<NotificationPrefs>) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function localDayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Smart timing: never deliver push overnight (9pm–7am local). */
function isWithinDeliveryHours(d: Date = new Date()): boolean {
  const hour = d.getHours();
  return hour >= 7 && hour < 21;
}

/** Map a Supabase social notification row into the unified app format. */
function socialToAppNotification(row: SocialNotification): AppNotification {
  const isChallenge = row.notificationType === "challenge_completed";
  return {
    id: `social-${row.id}`,
    type: isChallenge ? "challenge" : "friend",
    title: row.title,
    body: row.body,
    href: row.link ?? "/friends",
    priority: "normal",
    createdAt: row.createdAt,
    read: Boolean(row.readAt),
  };
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { groups, ready: tasksReady } = useTasks();
  const { plants } = usePlants();
  const { progress } = useAcademy();
  const { settings } = useReminders();
  const { notifications: socialRows, refresh: refreshSocial } = useSocialNotifications();
  const { challenges } = useActiveChallenges();

  const [zipCode, setZipCode] = useState("");
  const [prefs, setPrefs] = useState<NotificationPrefs>(getNotificationPrefs);
  const [readVersion, setReadVersion] = useState(0);
  const [dayKey, setDayKey] = useState(() => localDayKey());
  // New users get zero notifications until they finish setup.
  const [setupComplete, setSetupComplete] = useState(false);
  const [healthReports, setHealthReports] = useState<ActiveHealthReportSummary[]>([]);

  const { weather } = useWeather(zipCode || plants[0]?.zipCode || "");

  useEffect(() => {
    setZipCode(loadUserProfile().zipCode);
    setPrefs(getNotificationPrefs());
    setSetupComplete(isOnboardingComplete());
  }, []);

  // Active diagnoses give recovery reminders their specific copy
  // ("day 3 of your recovery plan", issue names).
  useEffect(() => {
    const load = () =>
      setHealthReports(
        getActiveHealthReports().map((r) => ({
          id: r.id,
          species: r.species,
          issueLabel: r.diagnosis.likelyIssue,
          createdAt: r.createdAt,
        }))
      );
    load();
    window.addEventListener(HEALTH_REPORTS_CHANGED_EVENT, load);
    return () => window.removeEventListener(HEALTH_REPORTS_CHANGED_EVENT, load);
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
    // No spam for brand-new accounts: stay silent until onboarding is done
    // (or the user has added a plant, which implies setup happened).
    if (!setupComplete && plants.length === 0) return [];

    // Individual social rows replace the engine's aggregate friend alert.
    const recentSocial = prefs.paused
      ? []
      : socialRows
          .filter((row) => {
            if (row.notificationType === "challenge_completed") {
              return prefs.challengeUpdates;
            }
            return prefs.friendActivity;
          })
          .slice(0, 10)
          .map(socialToAppNotification);

    const built = buildAppNotifications({
      todayKey: dayKey,
      taskGroups: groups,
      plants,
      streak: {
        current: progress.currentStreak,
        lastActiveDate: progress.lastActiveDate,
      },
      friendUnread: 0, // individual rows shown instead of an aggregate
      challenges,
      activeHealthReports: healthReports,
      weather: weather ?? null,
      reminders: settings,
      prefs,
    });

    const readMap = getReadMap();
    const dismissed = getDismissedMap();
    const merged = [...built, ...recentSocial]
      .filter((n) => !dismissed[n.id])
      .map((n) => ({ ...n, read: n.read || Boolean(readMap[n.id]) }));

    // Urgent first, then newest.
    return merged.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
    // readVersion forces a re-merge after markRead/dismiss.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tasksReady,
    setupComplete,
    dayKey,
    groups,
    plants,
    progress.currentStreak,
    progress.lastActiveDate,
    socialRows,
    challenges,
    healthReports,
    weather,
    settings,
    prefs,
    readVersion,
  ]);

  // Keep a rolling local history of everything the user has been shown.
  useEffect(() => {
    if (notifications.length > 0) appendNotificationHistory(notifications);
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markSocialRead = useCallback(
    (appId: string) => {
      const rowId = appId.replace(/^social-/, "");
      void fetch("/api/social/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id: rowId }),
      })
        .then(() => refreshSocial())
        .catch(() => {
          /* best effort */
        });
    },
    [refreshSocial]
  );

  const markRead = useCallback(
    (id: string) => {
      markNotificationsRead([id]);
      if (id.startsWith("social-")) markSocialRead(id);
    },
    [markSocialRead]
  );

  const markAllRead = useCallback(() => {
    markNotificationsRead(notifications.map((n) => n.id));
    if (notifications.some((n) => n.id.startsWith("social-"))) {
      void fetch("/api/social/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read" }),
      })
        .then(() => refreshSocial())
        .catch(() => {
          /* best effort */
        });
    }
  }, [notifications, refreshSocial]);

  const dismiss = useCallback(
    (id: string) => {
      dismissNotifications([id]);
      markNotificationsRead([id]);
      if (id.startsWith("social-")) markSocialRead(id);
    },
    [markSocialRead]
  );

  const dismissAll = useCallback(() => {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;
    dismissNotifications(ids);
    markNotificationsRead(ids);
    if (notifications.some((n) => n.id.startsWith("social-"))) {
      void fetch("/api/social/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read" }),
      })
        .then(() => refreshSocial())
        .catch(() => {
          /* best effort */
        });
    }
  }, [notifications, refreshSocial]);

  const updatePrefs = useCallback((patch: Partial<NotificationPrefs>) => {
    setPrefs(saveNotificationPrefs(patch));
  }, []);

  // Register this device for server push once permission is granted
  // (no-op until a VAPID key is configured — infrastructure first).
  useEffect(() => {
    if (settings.notificationsEnabled && pushPermission() === "granted") {
      void registerPushToken();
    }
  }, [settings.notificationsEnabled]);

  // Daily scheduled reminder: once per day at/after the user's reminder time,
  // push a local notification digest (PWA/mobile) of unread alerts.
  // Smart timing: never fires overnight (9pm–7am local).
  useEffect(() => {
    if (!tasksReady || !settings.notificationsEnabled || prefs.paused) return;
    if (pushPermission() !== "granted") return;

    const check = async () => {
      const now = new Date();
      if (!isWithinDeliveryHours(now)) return;

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
      if (sent) {
        markDigestSent("push", key);
        recordNotificationEvent("sent", top.id, top.type);
      }
    };

    void check();
    const interval = setInterval(() => void check(), 60_000);
    return () => clearInterval(interval);
  }, [tasksReady, settings.notificationsEnabled, settings.reminderTime, prefs.paused, notifications]);

  // Email fallback: when push isn't available, queue a daily email digest.
  useEffect(() => {
    if (!tasksReady || prefs.paused || !prefs.emailFallback || !prefs.emailAddress) return;
    const perm = pushPermission();
    if (perm === "granted") return; // push covers it
    if (!isWithinDeliveryHours()) return;

    const key = localDayKey();
    if (wasDigestSent("email", key)) return;

    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    markDigestSent("email", key); // optimistic — avoid duplicate sends on re-render
    recordNotificationEvent("sent", unread[0].id, "email-digest");
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
  }, [tasksReady, prefs.paused, prefs.emailFallback, prefs.emailAddress, notifications]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        prefs,
        markRead,
        markAllRead,
        dismiss,
        dismissAll,
        updatePrefs,
      }}
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
