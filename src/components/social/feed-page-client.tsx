"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeedItemCard } from "@/components/social/feed-item-card";
import { FEED_FILTERS } from "@/lib/social/constants";
import type { FeedFilter } from "@/lib/social/types";
import { useSocialFeed } from "@/lib/social/hooks";
import { cn } from "@/lib/utils";

export function FeedPageClient() {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const { events, loading, refresh } = useSocialFeed(filter);

  return (
    <div className="max-w-lg mx-auto pb-4 page-enter">
      <PageHeader
        title="Feed"
        description="What everyone is growing, saving, and not killing."
        action={
          <Link href="/friends">
            <Button variant="outline" size="sm" className="touch-manipulation">
              <Users className="w-4 h-4" />
              Friends
            </Button>
          </Link>
        }
        className="mb-4"
      />

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-4">
        {FEED_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium touch-manipulation transition-colors",
              filter === f.id
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-green-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card padding="md" className="text-center text-sm text-gray-500">
          Loading the feed…
        </Card>
      ) : events.length === 0 ? (
        <Card padding="lg" className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <UserPlus className="w-6 h-6 text-green-700" />
          </div>
          <p className="text-sm font-semibold text-gray-900">
            Plants are more fun when other people are also trying not to kill them.
          </p>
          <p className="text-xs text-gray-500">
            Add friends to see their garden wins here. Your own activity shows up too.
          </p>
          <Link href="/invite" className="inline-block">
            <Button className="touch-manipulation">Invite a friend</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <FeedItemCard key={event.id} event={event} onUpdate={() => void refresh()} />
          ))}
        </div>
      )}
    </div>
  );
}
