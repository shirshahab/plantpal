"use client";

import { HelpCircle, Heart, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CommunityQuestion } from "@/lib/mock/community";

function Avatar({ label }: { label: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold flex items-center justify-center shrink-0">
      {label}
    </div>
  );
}

export function CommunityQuestionsList({ questions }: { questions: CommunityQuestion[] }) {
  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <Card
          key={q.id}
          padding="md"
          className="hover:border-violet-100 transition-colors cursor-default"
        >
          <div className="flex gap-3">
            <Avatar label={q.avatar} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-gray-900 text-sm">{q.author}</span>
                <span className="text-xs text-gray-400">· {q.location}</span>
                <span className="text-xs text-gray-400">· {q.timeAgo}</span>
                <Badge
                  variant="outline"
                  className={
                    q.status === "answered"
                      ? "text-[10px] text-green-700 border-green-200 bg-green-50"
                      : "text-[10px] text-violet-700 border-violet-200 bg-violet-50"
                  }
                >
                  {q.status === "answered" ? "Answered" : "Open"}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mt-2 leading-snug">
                {q.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed line-clamp-2">
                {q.body}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {q.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {q.answers} answers
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {q.cheers}
                </span>
                <span className="inline-flex items-center gap-1 text-gray-300">
                  <HelpCircle className="w-3 h-3" />
                  Reply soon
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
