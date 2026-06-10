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
  Leaf,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/lib/store/notifications-provider";
import type { AppNotification, AppNotificationType } from "@/lib/types/notifications";
import { cn } from "@/lib/utils";

const TYPE_META: Record<
  AppNotificationType,
  { icon: typeof Bell; bg: string; fg: string }
> = {
  water: { icon: Droplets, bg: "bg-blue-50", fg: "text-blue-600" },
  fertilize: { icon: Leaf, bg: "bg-emerald-50", fg: "text-emerald-600" },
  recovery: { icon: HeartPulse, bg: "bg-rose-50", fg: "text-rose-600" },
  streak: { icon: Flame, bg: "bg-orange-50", fg: "text-orange-600" },
  friend: { icon: Users, bg: "bg-violet-50", fg: "text-violet-600" },
  weather: { icon: CloudSun, bg: "bg-sky-50", fg: "text-sky-600" },
  pest_risk: { icon: Bug, bg: "bg-amber-50", fg: "text-amber-600" },
};

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: AppNotification;
  onOpen: (n: AppNotification) => void;
}) {
  const meta = TYPE_META[notification.type];
  const Icon = meta.icon;

  return (
    <button
      onClick={() => onOpen(notification)}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors touch-manipulation",
        notification.read ? "bg-white hover:bg-gray-50" : "bg-green-50/50 hover:bg-green-50"
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
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm truncate",
              notification.read ? "font-medium text-gray-700" : "font-semibold text-gray-900"
            )}
          >
            {notification.title}
          </span>
          {notification.priority === "high" && !notification.read && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 rounded-full px-1.5 py-0.5">
              Urgent
            </span>
          )}
        </span>
        <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">
          {notification.body}
        </span>
      </span>
      {!notification.read && (
        <span className="mt-2 w-2 h-2 rounded-full bg-green-600 shrink-0" aria-hidden />
      )}
    </button>
  );
}

export function NotificationCenter() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const openNotification = (n: AppNotification) => {
    markRead(n.id);
    setOpen(false);
    router.push(n.href);
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
        <div className="absolute right-0 top-11 z-50 w-[min(92vw,380px)] rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">Notifications</p>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800 rounded-lg px-2 py-1 hover:bg-green-50 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <Link
                href="/settings/reminders"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="Notification settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50">
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
                <NotificationRow key={n.id} notification={n} onOpen={openNotification} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
