"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LessonQuiz } from "@/lib/education/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/store/toast-provider";

interface LessonQuizProps {
  quiz: LessonQuiz;
  onPass: () => void;
  alreadyComplete?: boolean;
}

export function LessonQuizBlock({
  quiz,
  onPass,
  alreadyComplete,
}: LessonQuizProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(alreadyComplete ?? false);

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === quiz.correctIndex) {
      setPassed(true);
      onPass();
      toast("Lesson completed.");
    }
  }

  function handleRetry() {
    setSelected(null);
    setSubmitted(false);
  }

  if (passed || alreadyComplete) {
    return (
      <Card padding="md" className="bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">Lesson Complete!</p>
            <p className="text-sm text-green-700 mt-0.5">
              Great job. You passed the quiz and earned progress toward your
              next care level.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const isCorrect = submitted && selected === quiz.correctIndex;
  const isWrong = submitted && selected !== quiz.correctIndex;

  return (
    <Card padding="md">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Quiz</h3>
      <p className="text-sm text-gray-700 mb-4">{quiz.question}</p>

      <div className="space-y-2 mb-4">
        {quiz.options.map((option, i) => (
          <button
            key={option}
            type="button"
            disabled={submitted && isCorrect}
            onClick={() => !submitted && setSelected(i)}
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
              selected === i && !submitted
                ? "border-green-500 bg-green-50 text-green-800"
                : "border-gray-200 hover:border-green-200 hover:bg-green-50/50",
              submitted &&
                i === quiz.correctIndex &&
                "border-green-500 bg-green-50 text-green-800",
              submitted &&
                selected === i &&
                i !== quiz.correctIndex &&
                "border-red-300 bg-red-50 text-red-800"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {isWrong && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-800 text-sm mb-4">
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Not quite. Here&apos;s why:</p>
            <p className="mt-1 opacity-90">{quiz.explanation}</p>
          </div>
        </div>
      )}

      {!submitted ? (
        <Button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full sm:w-auto"
        >
          Check Answer
        </Button>
      ) : isWrong ? (
        <Button variant="secondary" onClick={handleRetry}>
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
      ) : null}
    </Card>
  );
}
