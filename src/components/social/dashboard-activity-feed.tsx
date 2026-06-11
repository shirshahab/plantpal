"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeedItemCard } from "@/components/social/feed-item-card";
import { FEED_FILTERS } from "@/lib/social/constants";
import type { FeedFilter } from "@/lib/social/types";
import { useSocialFeed } from "@/lib/social/hooks";
import { cn } from "@/lib/utils";

export function DashboardActivityFeed() {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const { events, loading, refresh } = useSocialFeed(filter);

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">PlantPal Circles</h2>
          <p className="text-xs text-gray-500 mt-0.5">Friends, family & garden milestones</p>
        </div>
        <Link href="/friends">
          <Button variant="ghost" size="sm" className="text-green-600 touch-manipulation">
            <Users className="w-4 h-4" />
            Friends
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-3">
        {FEED_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium touch-manipulation transition-colors",
              filter === f.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-green-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card padding="md" className="text-center text-sm text-gray-500">
          Loading your circle…
        </Card>
      ) : events.length === 0 ? (
        <Card padding="md" className="text-center">
          <p className="text-2xl mb-1">🌻</p>
          <p className="text-sm font-medium text-gray-900">
            Plants are more fun when other people are also trying not to kill them.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Add friends to see their garden wins, share yours, and keep each other honest.
          </p>
          <Link href="/invite" className="inline-block mt-3">
            <Button size="sm" className="touch-manipulation">
              Invite a friend <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.slice(0, 8).map((event) => (
            <FeedItemCard key={event.id} event={event} onUpdate={() => void refresh()} />
          ))}
        </div>
      )}

      <Link href="/feed" className="inline-block mt-3 w-full">
        <Button variant="outline" size="sm" className="w-full touch-manipulation">
          View the full feed
        </Button>
      </Link>
    </section>
  );
}
