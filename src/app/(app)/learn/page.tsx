"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { CareLevelCard } from "@/components/education/care-level-card";
import { LessonCard } from "@/components/education/lesson-card";
import { LoadingState } from "@/components/loading-state";
import { LESSONS } from "@/lib/education/lessons";
import { LESSON_CATEGORIES } from "@/lib/education/types";
import { useEducation } from "@/lib/store/education-provider";
import { cn } from "@/lib/utils";

export default function LearnPage() {
  const { isLessonComplete, loading, progress } = useEducation();
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");

  if (loading) {
    return <LoadingState fullPage message="Loading lessons..." />;
  }

  const filtered =
    activeCategory === "all"
      ? LESSONS
      : LESSONS.filter((l) => l.category === activeCategory);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Learn Plant Care"
        description="Understand your plants — not just track them. Short lessons, real knowledge."
      />

      <CareLevelCard />

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
            activeCategory === "all"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:border-green-200"
          )}
        >
          All ({LESSONS.length})
        </button>
        {LESSON_CATEGORIES.map((cat) => {
          const count = LESSONS.filter((l) => l.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeCategory === cat
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-green-200"
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {activeCategory === "all" ? (
        LESSON_CATEGORIES.map((category) => {
          const categoryLessons = LESSONS.filter(
            (l) => l.category === category
          );
          if (categoryLessons.length === 0) return null;
          return (
            <section key={category}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    completed={isLessonComplete(lesson.id)}
                  />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              completed={isLessonComplete(lesson.id)}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 pb-4">
        {progress.completedLessons.length} of {LESSONS.length} lessons completed
      </p>
    </div>
  );
}
