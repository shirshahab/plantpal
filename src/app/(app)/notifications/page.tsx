"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellOff, CheckCheck, Clock, Settings, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TYPE_META } from "@/components/notifications/notification-center";
import { useNotifications } from "@/lib/store/notifications-provider";
import { getNotificationHistory } from "@/lib/notifications/notification-store";
import { recordNotificationEvent } from "@/lib/notifications/notification-analytics";
import {
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_CATEGORY_OF,
  type AppNotification,
  type NotificationCategory,
  type NotificationHistoryEntry,
} from "@/lib/types/notifications";
import { cn } from "@/lib/utils";

type Filter = "all" | NotificationCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "care", label: NOTIFICATION_CATEGORY_LABELS.care },
  { id: "health", label: NOTIFICATION_CATEGORY_LABELS.health },
  { id: "academy", label: NOTIFICATION_CATEGORY_LABELS.academy },
  { id: "friends", label: NOTIFICATION_CATEGORY_LABELS.friends },
  { id: "challenges", label: NOTIFICATION_CATEGORY_LABELS.challenges },
  { id: "weather", label: NOTIFICATION_CATEGORY_LABELS.weather },
  { id: "system", label: NOTIFICATION_CATEGORY_LABELS.system },
];

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, dismiss } =
    useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const [history, setHistory] = useState<NotificationHistoryEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    setHistory(getNotificationHistory());
  }, [notifications]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? notifications
        : notifications.filter((n) => NOTIFICATION_CATEGORY_OF[n.type] === filter),
    [notifications, filter]
  );

  // History: past entries no longer in today's live list, matching the filter.
  const pastEntries = useMemo(() => {
    const liveIds = new Set(notifications.map((n) => n.id));
    return history
      .filter((e) => !liveIds.has(e.id))
      .filter((e) => filter === "all" || NOTIFICATION_CATEGORY_OF[e.type] === filter)
      .slice(0, 30);
  }, [history, notifications, filter]);

  function openNotification(n: AppNotification) {
    markRead(n.id);
    recordNotificationEvent("opened", n.id, n.type);
    router.push(n.href);
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-4">
      <PageHeader
        title="Notifications"
        description="Reminders, alerts, and updates from your garden"
        action={
          <Link href="/settings/notifications">
            <Button variant="secondary" size="sm" className="touch-manipulation">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
        }
      />

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation",
              filter === f.id
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-green-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {unreadCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
          className="touch-manipulation"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all read ({unreadCount})
        </Button>
      )}

      {visible.length === 0 ? (
        <Card padding="md" className="text-center py-10">
          <BellOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-900">You&apos;re all caught up</p>
          <p className="text-sm text-gray-500 mt-1">
            {filter === "all"
              ? "Care reminders, health alerts, and friend updates will show up here."
              : `No ${FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} notifications right now.`}
          </p>
        </Card>
      ) : (
        <Card padding="none" className="divide-y divide-gray-50 overflow-hidden">
          {visible.map((n) => {
            const meta = TYPE_META[n.type];
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3",
                  n.read ? "bg-white" : "bg-green-50/50"
                )}
              >
                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  className="flex items-start gap-3 flex-1 min-w-0 text-left touch-manipulation"
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
                          n.read
                            ? "font-medium text-gray-700"
                            : "font-semibold text-gray-900"
                        )}
                      >
                        {n.title}
                      </span>
                      {n.priority === "high" && !n.read && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 rounded-full px-1.5 py-0.5">
                          Urgent
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">{n.body}</span>
                    {n.actionLabel && (
                      <span className="inline-block text-xs font-medium text-green-700 mt-1">
                        {n.actionLabel} →
                      </span>
                    )}
                    <span className="block text-[10px] text-gray-400 mt-1">
                      {NOTIFICATION_CATEGORY_LABELS[NOTIFICATION_CATEGORY_OF[n.type]]} ·{" "}
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => dismiss(n.id)}
                  className="mt-1 w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors shrink-0 touch-manipulation"
                  aria-label={`Delete notification: ${n.title}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </Card>
      )}

      {pastEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5 px-1">
            <Clock className="w-3.5 h-3.5" />
            Earlier
          </p>
          <Card padding="none" className="divide-y divide-gray-50 overflow-hidden">
            {pastEntries.map((e) => {
              const meta = TYPE_META[e.type];
              const Icon = meta.icon;
              return (
                <div key={e.id} className="flex items-start gap-3 px-4 py-3 opacity-70">
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
                    <span className="block text-sm font-medium text-gray-700 truncate">
                      {e.title}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">{e.body}</span>
                    <span className="block text-[10px] text-gray-400 mt-1">
                      {timeAgo(e.createdAt)}
                    </span>
                  </span>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
