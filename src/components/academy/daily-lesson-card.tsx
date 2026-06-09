"use client";

import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAcademy } from "@/lib/store/academy-provider";
import { usePlants } from "@/lib/store/plants-provider";
import { pickDailyLesson } from "@/lib/academy/daily-lesson";
import { getAcademyLessonById } from "@/lib/academy/lessons";

export function DailyLessonCard() {
  const { progress } = useAcademy();
  const { plants } = usePlants();

  const dailyId = pickDailyLesson(progress.completedLessons, plants);
  const lesson = dailyId ? getAcademyLessonById(dailyId) : null;

  if (!lesson || progress.completedLessons.includes(lesson.id)) return null;

  return (
    <Card padding="md" className="border-amber-200 bg-gradient-to-br from-amber-50/80 to-white">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
          Today&apos;s 3-Minute Lesson
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl">{lesson.icon}</span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{lesson.title}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              Picked for your garden & season
            </p>
          </div>
        </div>
        <Link href={`/academy/lesson/${lesson.id}`}>
          <Button size="sm" variant="secondary">
            Start
          </Button>
        </Link>
      </div>
    </Card>
  );
}
