"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActivityFeedEvent, ActivityReactionType } from "@/lib/social/types";
import { REACTION_OPTIONS } from "@/lib/social/constants";
import { formatFeedLine, relativeSocialTime } from "@/lib/social/events";
import { toggleReaction, postComment } from "@/lib/social/hooks";
import { cn } from "@/lib/utils";

interface FeedItemCardProps {
  event: ActivityFeedEvent;
  onUpdate?: () => void;
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-sm font-bold text-green-700">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function FeedItemCard({ event, onUpdate }: FeedItemCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const actorName = event.actor?.fullName ?? "Gardener";
  const line = formatFeedLine(actorName, event.title);

  async function handleReaction(type: ActivityReactionType) {
    const removing = event.userReaction === type;
    await toggleReaction(event.id, type, removing);
    onUpdate?.();
  }

  async function handleComment() {
    if (!comment.trim()) return;
    setSubmitting(true);
    const ok = await postComment(event.id, comment.trim());
    setSubmitting(false);
    if (ok) {
      setComment("");
      onUpdate?.();
    }
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <Avatar name={actorName} url={event.actor?.avatarUrl} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 leading-snug">
            <span className="font-semibold">{actorName}</span>{" "}
            <span>{event.title.startsWith(actorName) ? event.title.replace(actorName, "").trim() : event.title}</span>
          </p>
          {!event.title.includes(actorName) && (
            <p className="text-xs text-gray-500 mt-0.5 sr-only">{line}</p>
          )}
          {event.body && <p className="text-xs text-gray-600 mt-1">{event.body}</p>}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-lg" aria-hidden>{event.emoji}</span>
            <span className="text-[10px] text-gray-400">{relativeSocialTime(event.createdAt)}</span>
            {(event.commentCount ?? 0) > 0 && (
              <span className="text-[10px] text-gray-400">
                · {event.commentCount} comment{(event.commentCount ?? 0) === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-3 border-t border-gray-50 pt-2">
        {REACTION_OPTIONS.map((r) => {
          const count = event.reactionCounts?.[r.id] ?? 0;
          const active = event.userReaction === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => void handleReaction(r.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors touch-manipulation",
                active
                  ? "bg-green-100 text-green-800 ring-1 ring-green-200"
                  : "bg-gray-50 text-gray-600 hover:bg-green-50"
              )}
            >
              <span>{r.emoji}</span>
              <span className="hidden sm:inline">{r.label}</span>
              {count > 0 && <span className="text-[10px] opacity-70">{count}</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-gray-50 text-gray-600 hover:bg-green-50 touch-manipulation ml-auto"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Comment
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-3 space-y-2 border-t border-gray-50 pt-2">
          <div className="flex gap-2">
            <Input
              placeholder="Looks amazing!"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-sm"
            />
            <Button size="sm" loading={submitting} disabled={!comment.trim()} onClick={() => void handleComment()}>
              Post
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
