"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Lightbulb,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { AcademyQuizBlock } from "@/components/academy/academy-quiz";
import { LessonCompleteModal } from "@/components/academy/lesson-complete-modal";
import { Planty } from "@/components/academy/planty";
import { getAcademyLessonById } from "@/lib/academy/lessons";
import { getPathForLesson } from "@/lib/academy/paths";
import { useAcademy } from "@/lib/store/academy-provider";
import { markLessonStarted } from "@/lib/tasks/task-validation";

export default function AcademyLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const lesson = getAcademyLessonById(lessonId);
  const { completeLesson, isLessonComplete, syncBadgesAndCertificates } = useAcademy();
  const [showCelebration, setShowCelebration] = useState(false);
  const [completionResult, setCompletionResult] = useState<
    ReturnType<typeof completeLesson>
  >(null);
  const path = lesson ? getPathForLesson(lesson.id) : null;
  const complete = lesson ? isLessonComplete(lesson.id) : false;

  useEffect(() => {
    if (lesson) markLessonStarted(lesson.id);
  }, [lesson]);

  if (!lesson) {
    return (
      <EmptyState
        icon="📖"
        title="Lesson not found"
        description="This lesson doesn't exist or may have been moved."
        actionLabel="Back to Academy"
        actionHref="/academy"
      />
    );
  }

  const quiz = lesson.academyQuiz ?? {
    type: "multiple_choice" as const,
    question: lesson.quiz.question,
    options: lesson.quiz.options,
    correctIndex: lesson.quiz.correctIndex,
    explanation: lesson.quiz.explanation,
  };

  function handlePass() {
    const result = completeLesson(lessonId);
    syncBadgesAndCertificates();
    if (result) {
      setCompletionResult(result);
      setShowCelebration(true);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {showCelebration && completionResult && (
        <LessonCompleteModal
          result={completionResult}
          onClose={() => setShowCelebration(false)}
        />
      )}

      <Link
        href={path ? `/academy/${path.id}` : "/academy"}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        {path?.title ?? "Academy"}
      </Link>

      <Planty mood="tip" message={lesson.plantyMoment ?? lesson.introduction} />

      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl shrink-0">
          {lesson.icon}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline">{path?.title ?? "Academy"}</Badge>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {lesson.estimatedMinutes} min
            </span>
            {complete && (
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{lesson.title}</h1>
          <p className="text-gray-500 mt-2">{lesson.description}</p>
        </div>
      </div>

      {lesson.whyItMatters && (
        <Card padding="md" className="border-brand-primary/20 bg-green-50/40">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-brand-primary" />
            <h2 className="font-semibold text-gray-900">Why it matters</h2>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{lesson.whyItMatters}</p>
        </Card>
      )}

      <Card padding="md">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary mb-2">
          Introduction
        </p>
        <p className="text-gray-700 leading-relaxed">{lesson.introduction}</p>
      </Card>

      <Card padding="md">
        <div className="prose prose-sm max-w-none">
          {lesson.content.split("\n\n").map((para, i) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
              {para}
            </p>
          ))}
        </div>
      </Card>

      {lesson.realWorldExample && (
        <Card padding="md" className="border-blue-100 bg-blue-50/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-2">
            Real-world example
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{lesson.realWorldExample}</p>
        </Card>
      )}

      <Card padding="md" className="border-purple-100 bg-purple-50/30">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-gray-900">Planty says</h2>
        </div>
        <ul className="space-y-2">
          {lesson.funFacts.map((fact) => (
            <li
              key={fact}
              className="text-sm text-gray-700 pl-4 relative before:content-['🌿'] before:absolute before:left-0"
            >
              {fact}
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="md" className="border-green-100 bg-green-50/30">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">Key takeaways</h2>
        </div>
        <ul className="space-y-2">
          {lesson.keyTakeaways.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="md" className="border-amber-100 bg-amber-50/30">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-gray-900">Common beginner mistakes</h2>
        </div>
        <ul className="space-y-2">
          {lesson.commonMistakes.map((item) => (
            <li
              key={item}
              className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0"
            >
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="md" className="border-blue-100 bg-blue-50/30">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Do this today</h2>
        </div>
        <p className="text-sm text-gray-700">{lesson.actionStep}</p>
      </Card>

      <AcademyQuizBlock quiz={quiz} onPass={handlePass} alreadyComplete={complete} />

      <Card padding="md" className="border-brand-sage/30">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Summary</p>
        <p className="text-sm text-gray-700 leading-relaxed">{lesson.summary}</p>
      </Card>

      {!complete && (
        <Planty mood="happy" message="Pass the quiz to earn +75 XP and keep your streak!" />
      )}
    </div>
  );
}
