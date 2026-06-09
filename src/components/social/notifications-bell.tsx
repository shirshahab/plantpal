"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useSocialNotifications } from "@/lib/social/hooks";
import { cn } from "@/lib/utils";

export function SocialNotificationsBell() {
  const { unread } = useSocialNotifications();

  return (
    <Link
      href="/friends"
      className={cn(
        "relative inline-flex items-center justify-center w-9 h-9 rounded-xl",
        "bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors touch-manipulation"
      )}
      aria-label={unread > 0 ? `${unread} unread notifications` : "Social notifications"}
    >
      <Bell className="w-4 h-4" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
