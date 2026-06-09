"use client";

import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Plant } from "@/lib/types";
import { getLessonsForPlant } from "@/lib/education/utils";
import { useEducation } from "@/lib/store/education-provider";
import { LessonCard } from "./lesson-card";

interface PlantLessonsSectionProps {
  plant: Plant;
}

export function PlantLessonsSection({ plant }: PlantLessonsSectionProps) {
  const { isLessonComplete } = useEducation();
  const lessons = getLessonsForPlant(plant);

  if (lessons.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Learn About This Plant
            </h2>
          </div>
          <Link
            href="/learn"
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
          >
            All lessons
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Recommended lessons based on {plant.name}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              completed={isLessonComplete(lesson.id)}
              compact
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
