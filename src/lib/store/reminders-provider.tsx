"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReminderSettings } from "@/lib/types/tasks";
import { DEFAULT_REMINDER_SETTINGS as DEFAULTS } from "@/lib/types/tasks";
import { readLocalJson } from "@/lib/storage/safe-local-storage";
import { useAuth } from "@/lib/store/auth-provider";
import { useSync } from "@/lib/store/sync-provider";
import {
  canUseSupabase,
  getDb,
  getDefaultReminders,
  getReminderSettings,
  updateReminderSettings,
} from "@/lib/db";

const STORAGE_KEY = "plantpal-reminders";

interface RemindersContextValue {
  settings: ReminderSettings;
  ready: boolean;
  updateSettings: (patch: Partial<ReminderSettings>) => void;
  requestNotificationPermission: () => Promise<NotificationPermission | "unsupported">;
}

const RemindersContext = createContext<RemindersContextValue | null>(null);

function readPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const { user, isMockMode } = useAuth();
  const { markPending, markSynced, markFailed } = useSync();
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  const persistLocal = useCallback((next: ReminderSettings) => {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    async function load() {
      const permission = readPermission();

      if (canUseSupabase(user?.id) && !isMockMode) {
        markPending();
        const remote = await getReminderSettings(getDb(), user.id);
        if (remote) {
          persistLocal({ ...remote, notificationPermission: permission });
        } else {
          const merged = readLocalJson(STORAGE_KEY, null as Partial<ReminderSettings> | null);
          const settings = merged
            ? { ...DEFAULTS, ...merged }
            : getDefaultReminders();
          persistLocal({ ...settings, notificationPermission: permission });
          await updateReminderSettings(getDb(), user.id, settings);
        }
        markSynced();
      } else {
        const stored = readLocalJson(STORAGE_KEY, null as Partial<ReminderSettings> | null);
        if (stored) {
          setSettings({
            ...DEFAULTS,
            ...stored,
            notificationPermission: permission,
          });
        } else {
          setSettings((s) => ({ ...s, notificationPermission: permission }));
        }
      }
      setReady(true);
    }
    load();
  }, [user?.id, isMockMode, persistLocal, markPending, markSynced]);

  const updateSettings = useCallback(
    async (patch: Partial<ReminderSettings>) => {
      const next = { ...settings, ...patch };
      persistLocal(next);

      if (canUseSupabase(user?.id) && !isMockMode) {
        markPending();
        const err = await updateReminderSettings(getDb(), user.id, next);
        if (err) markFailed(err);
        else markSynced();
      }
    },
    [settings, persistLocal, user?.id, isMockMode, markPending, markSynced, markFailed]
  );

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      updateSettings({ notificationPermission: "unsupported" });
      return "unsupported";
    }
    const perm = await Notification.requestPermission();
    updateSettings({
      notificationPermission: perm,
      notificationsEnabled: perm === "granted",
    });
    return perm;
  }, [updateSettings]);

  return (
    <RemindersContext.Provider
      value={{ settings, ready, updateSettings, requestNotificationPermission }}
    >
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error("useReminders must be used within RemindersProvider");
  return ctx;
}
