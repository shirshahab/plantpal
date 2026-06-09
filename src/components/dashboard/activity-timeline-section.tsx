"use client";

import Link from "next/link";
import { relativeTime, type ActivityFeedItem } from "@/lib/dashboard/activity-feed";
import { Card } from "@/components/ui/card";

export function DashboardActivityTimeline({ items }: { items: ActivityFeedItem[] }) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-3 px-0.5">Recent plant activity</h2>
      <Card padding="none" className="divide-y divide-gray-50 overflow-hidden">
        {items.slice(0, 6).map((item) => {
          const inner = (
            <div className="flex items-start gap-3 px-4 py-3.5">
              <span className="text-xl shrink-0 w-8 text-center">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                )}
              </div>
              <span className="text-[10px] text-gray-400 shrink-0 pt-0.5">
                {relativeTime(item.at)}
              </span>
            </div>
          );

          return item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className="block hover:bg-green-50/50 transition-colors"
            >
              {inner}
            </Link>
          ) : (
            <div key={item.id}>{inner}</div>
          );
        })}
      </Card>
    </section>
  );
}
