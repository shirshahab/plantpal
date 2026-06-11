"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getPathById } from "@/lib/academy/paths";
import { getAcademyLessonById } from "@/lib/academy/lessons";
import { useAcademy } from "@/lib/store/academy-provider";
import { useSubscription } from "@/lib/store/subscription-provider";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { UPGRADE_COPY } from "@/lib/subscription/types";
import { cn } from "@/lib/utils";

export default function AcademyPathPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = use(params);
  const path = getPathById(pathId);
  const { isLessonComplete, progress } = useAcademy();
  const { canAccessAcademyPath, betaUnlockAll } = useSubscription();

  if (!path) {
    return (
      <EmptyState
        icon="📚"
        title="Path not found"
        description="This learning path doesn't exist."
        actionLabel="Back to Academy"
        actionHref="/academy"
      />
    );
  }

  if (!canAccessAcademyPath(pathId) && !betaUnlockAll) {
    const copy = UPGRADE_COPY.full_academy;
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Link
          href="/academy"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Academy
        </Link>
        <UpgradePrompt title={copy.title} message={copy.message} lockLabel={copy.lockLabel} />
      </div>
    );
  }

  const completed = path.lessonIds.filter((id) => isLessonComplete(id)).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <Link
        href="/academy"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Academy
      </Link>

      <div className="flex items-start gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
          style={{ backgroundColor: `${path.color}25` }}
        >
          {path.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{path.title}</h1>
          <p className="text-gray-500 mt-1">{path.description}</p>
          <p className="text-sm text-gray-400 mt-2">
            {completed}/{path.lessonIds.length} lessons · {path.kidSafe ? "Kid-safe" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {path.lessonIds.map((lessonId, index) => {
          const lesson = getAcademyLessonById(lessonId);
          const done = isLessonComplete(lessonId);
          if (!lesson) return null;

          return (
            <Link key={lessonId} href={`/academy/lesson/${lessonId}`}>
              <Card
                padding="md"
                className={cn(
                  "flex items-center gap-4 touch-manipulation hover:border-brand-primary/30 transition-colors",
                  done && "bg-green-50/40 border-green-100"
                )}
              >
                <span className="text-xs font-bold text-gray-300 w-6">{index + 1}</span>
                <span className="text-2xl">{lesson.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{lesson.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {lesson.estimatedMinutes} min · +75 XP
                  </p>
                </div>
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    Start
                  </Badge>
                )}
              </Card>
            </Link>
          );
        })}
      </div>

      {completed === path.lessonIds.length && path.certificateId && (
        <Card padding="md" className="border-brand-primary bg-green-50 text-center">
          <p className="text-lg font-semibold text-brand-primary">Path complete!</p>
          <p className="text-sm text-gray-600 mt-1">
            Certificate earned. View it in your Trophy Room.
          </p>
          <Link href="/academy/trophies" className="text-sm text-brand-primary font-medium mt-2 inline-block">
            View certificates →
          </Link>
        </Card>
      )}
    </div>
  );
}
