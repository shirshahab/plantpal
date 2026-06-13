"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Bug,
  CheckCheck,
  CloudSun,
  Droplets,
  Flame,
  HeartPulse,
  Info,
  Leaf,
  Scissors,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/lib/store/notifications-provider";
import { recordNotificationEvent } from "@/lib/notifications/notification-analytics";
import type { AppNotification, AppNotificationType } from "@/lib/types/notifications";
import { useToast } from "@/lib/store/toast-provider";
import { useOverlay } from "@/lib/navigation/use-overlay";
import { cn } from "@/lib/utils";

export const TYPE_META: Record<
  AppNotificationType,
  { icon: typeof Bell; bg: string; fg: string }
> = {
  water: { icon: Droplets, bg: "bg-blue-50", fg: "text-blue-600" },
  fertilize: { icon: Leaf, bg: "bg-emerald-50", fg: "text-emerald-600" },
  care: { icon: Scissors, bg: "bg-teal-50", fg: "text-teal-600" },
  recovery: { icon: HeartPulse, bg: "bg-rose-50", fg: "text-rose-600" },
  streak: { icon: Flame, bg: "bg-orange-50", fg: "text-orange-600" },
  friend: { icon: Users, bg: "bg-violet-50", fg: "text-violet-600" },
  challenge: { icon: Trophy, bg: "bg-yellow-50", fg: "text-yellow-600" },
  weather: { icon: CloudSun, bg: "bg-sky-50", fg: "text-sky-600" },
  pest_risk: { icon: Bug, bg: "bg-amber-50", fg: "text-amber-600" },
  system: { icon: Info, bg: "bg-gray-100", fg: "text-gray-600" },
};

function NotificationRow({
  notification,
  onOpen,
  onDismiss,
}: {
  notification: AppNotification;
  onOpen: (n: AppNotification) => void;
  onDismiss: (n: AppNotification) => void;
}) {
  const meta = TYPE_META[notification.type];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-1 pr-1 transition-colors",
        notification.read ? "bg-white" : "bg-green-50/50"
      )}
    >
      <button
        onClick={() => onOpen(notification)}
        className={cn(
          "flex-1 flex items-start gap-3 px-4 py-3 text-left touch-manipulation min-w-0",
          notification.read ? "hover:bg-gray-50" : "hover:bg-green-50"
        )}
      >
        <span
          className={cn(
            "mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
            meta.bg,
            meta.fg
          )}
        >
          <Icon className="w-4 h-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span
              className={cn(
                "text-sm break-words line-clamp-2 min-w-0",
                notification.read ? "font-medium text-gray-700" : "font-semibold text-gray-900"
              )}
            >
              {notification.title}
            </span>
            {notification.priority === "high" && !notification.read && (
              <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 rounded-full px-1.5 py-0.5">
                Urgent
              </span>
            )}
          </span>
          <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2 break-words">
            {notification.body}
          </span>
        </span>
        {!notification.read && (
          <span className="mt-1.5 w-2 h-2 rounded-full bg-green-600 shrink-0" aria-hidden />
        )}
      </button>
      <button
        type="button"
        onClick={() => onDismiss(notification)}
        className="mt-2 mr-1 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 touch-manipulation shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function NotificationCenter() {
  const { notifications, unreadCount, markRead, markAllRead, dismiss, dismissAll } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useOverlay("notification-center", open, () => setOpen(false));

  const closeSheet = (message?: string) => {
    setOpen(false);
    if (message) toast(message);
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || window.innerWidth >= 768) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const openNotification = (n: AppNotification) => {
    dismiss(n.id);
    recordNotificationEvent("opened", n.id, n.type);
    closeSheet();
    router.push(n.href);
  };

  const dismissNotification = (n: AppNotification) => {
    dismiss(n.id);
    recordNotificationEvent("completed", n.id, n.type);
    const remaining = notifications.filter((x) => x.id !== n.id).length;
    closeSheet(remaining === 0 ? "Case closed." : "Case closed.");
  };

  const handleMarkAllRead = () => {
    markAllRead();
    closeSheet("No new complaints.");
  };

  const handleClearAll = () => {
    if (notifications.length === 0) {
      closeSheet();
      return;
    }
    dismissAll();
    closeSheet("Case closed.");
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative inline-flex items-center justify-center w-9 h-9 rounded-xl transition-colors touch-manipulation",
          open
            ? "bg-green-100 text-green-700"
            : "bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700"
        )}
        aria-label={
          unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"
        }
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] w-full flex-col rounded-t-2xl border border-gray-100 bg-white shadow-xl",
              "md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-11 md:max-h-none md:w-[380px] md:rounded-2xl"
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <p className="font-semibold text-gray-900 text-sm">Notifications</p>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800 rounded-lg px-2 py-1.5 hover:bg-green-50 transition-colors touch-manipulation"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={handleClearAll}
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors touch-manipulation"
                    >
                      Clear all
                    </button>
                  </>
                )}
                <Link
                  href="/settings/notifications"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors touch-manipulation"
                  aria-label="Notification settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors touch-manipulation"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-gray-50 md:max-h-[60vh]">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <BellOff className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">All caught up</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Reminders and alerts will show up here.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onOpen={openNotification}
                    onDismiss={dismissNotification}
                  />
                ))
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block shrink-0 text-center text-xs font-medium text-green-700 hover:text-green-800 hover:bg-green-50 px-4 py-3 border-t border-gray-100 transition-colors pb-[max(12px,env(safe-area-inset-bottom))]"
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
