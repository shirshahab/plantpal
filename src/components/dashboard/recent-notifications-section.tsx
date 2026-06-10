"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BellRing, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TYPE_META } from "@/components/notifications/notification-center";
import { useNotifications } from "@/lib/store/notifications-provider";
import { recordNotificationEvent } from "@/lib/notifications/notification-analytics";
import { cn } from "@/lib/utils";

const MAX_ITEMS = 3;

/** Dashboard card: the latest unread reminders and alerts at a glance. */
export function DashboardRecentNotifications() {
  const { notifications, unreadCount, markRead } = useNotifications();
  const router = useRouter();

  const recent = notifications.filter((n) => !n.read).slice(0, MAX_ITEMS);

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-green-600" />
          <h2 className="font-semibold text-gray-900">Recent notifications</h2>
        </div>
        <Link
          href="/notifications"
          className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="flex items-center gap-3 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-gray-500">You&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {recent.map((n) => {
            const meta = TYPE_META[n.type];
            const Icon = meta.icon;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  markRead(n.id);
                  recordNotificationEvent("opened", n.id, n.type);
                  router.push(n.href);
                }}
                className="w-full flex items-start gap-3 rounded-xl px-2 py-2 text-left hover:bg-green-50/60 transition-colors touch-manipulation"
              >
                <span
                  className={cn(
                    "mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    meta.bg,
                    meta.fg
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {n.title}
                    </span>
                    {n.priority === "high" && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 rounded-full px-1.5 py-0.5">
                        Urgent
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-gray-500 line-clamp-2">{n.body}</span>
                  {n.actionLabel && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 mt-1">
                      {n.actionLabel}
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </span>
              </button>
            );
          })}
          {unreadCount > MAX_ITEMS && (
            <p className="text-xs text-gray-400 px-2 pt-1">
              +{unreadCount - MAX_ITEMS} more in your notification center
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
