"use client";

import Link from "next/link";
import { Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Lesson } from "@/lib/education/types";
import { cn } from "@/lib/utils";

const difficultyVariant = {
  Beginner: "success" as const,
  Intermediate: "warning" as const,
  Advanced: "danger" as const,
};

interface LessonCardProps {
  lesson: Lesson;
  completed?: boolean;
  compact?: boolean;
}

export function LessonCard({ lesson, completed, compact }: LessonCardProps) {
  return (
    <Link href={`/learn/${lesson.id}`}>
      <Card
        hover
        className={cn("h-full", completed && "border-green-200 bg-green-50/30")}
      >
        <CardContent className={cn("space-y-3", compact ? "py-4" : "py-5")}>
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl shrink-0">
              {lesson.icon}
            </div>
            {completed && (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 leading-snug">
              {lesson.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {lesson.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={difficultyVariant[lesson.difficulty]}>
              {lesson.difficulty}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {lesson.estimatedMinutes} min
            </span>
            {completed && (
              <Badge variant="default">Completed</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
