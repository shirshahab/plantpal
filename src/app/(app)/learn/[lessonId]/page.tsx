"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LessonQuizBlock } from "@/components/education/lesson-quiz";
import { getLessonById } from "@/lib/education/lessons";
import { useEducation } from "@/lib/store/education-provider";

const difficultyVariant = {
  Beginner: "success" as const,
  Intermediate: "warning" as const,
  Advanced: "danger" as const,
};

export default function LessonDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const lesson = getLessonById(lessonId);
  const { completeLesson, isLessonComplete } = useEducation();

  if (!lesson) {
    return (
      <EmptyState
        icon="📖"
        title="Lesson not found"
        description="This lesson doesn't exist or may have been moved."
        actionLabel="Browse Lessons"
        actionHref="/learn"
      />
    );
  }

  const complete = isLessonComplete(lesson.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <Link
        href="/learn"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to lessons
      </Link>

      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl shrink-0">
          {lesson.icon}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline">{lesson.category}</Badge>
            <Badge variant={difficultyVariant[lesson.difficulty]}>
              {lesson.difficulty}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {lesson.estimatedMinutes} min read
            </span>
            {complete && (
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {lesson.title}
          </h1>
          <p className="text-gray-500 mt-2">{lesson.description}</p>
        </div>
      </div>

      <Card padding="md">
        <div className="prose prose-sm max-w-none">
          {lesson.content.split("\n\n").map((para, i) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
              {para}
            </p>
          ))}
        </div>
      </Card>

      <Card padding="md" className="border-green-100 bg-green-50/30">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">Key Takeaways</h2>
        </div>
        <ul className="space-y-2">
          {lesson.keyTakeaways.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-gray-700"
            >
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="md" className="border-amber-100 bg-amber-50/30">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-gray-900">Common Mistakes</h2>
        </div>
        <ul className="space-y-2">
          {lesson.commonMistakes.map((item) => (
            <li key={item} className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="md" className="border-blue-100 bg-blue-50/30">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Action Step</h2>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {lesson.actionStep}
        </p>
      </Card>

      <LessonQuizBlock
        quiz={lesson.quiz}
        onPass={() => completeLesson(lesson.id)}
        alreadyComplete={complete}
      />
    </div>
  );
}
