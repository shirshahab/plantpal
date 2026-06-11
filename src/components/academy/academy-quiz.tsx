"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AcademyQuiz } from "@/lib/academy/quiz-types";
import { cn } from "@/lib/utils";

interface AcademyQuizBlockProps {
  quiz: AcademyQuiz;
  onPass: () => void;
  alreadyComplete?: boolean;
}

const QUIZ_LABELS: Record<AcademyQuiz["type"], string> = {
  multiple_choice: "Quick Quiz",
  true_false: "True or False",
  matching: "Match the Pairs",
  scenario: "Scenario Challenge",
  image_identify: "Identify the Issue",
};

export function AcademyQuizBlock({
  quiz,
  onPass,
  alreadyComplete,
}: AcademyQuizBlockProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [trueFalse, setTrueFalse] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(alreadyComplete ?? false);

  function handlePass() {
    setPassed(true);
    onPass();
  }

  function checkAnswer(): boolean {
    if (quiz.type === "true_false") return trueFalse === quiz.correct;
    if (quiz.type === "matching") {
      return quiz.pairs.every((_, i) => matches[i] === i);
    }
    const idx = selected ?? -1;
    return idx === quiz.correctIndex;
  }

  function handleSubmit() {
    setSubmitted(true);
    if (checkAnswer()) handlePass();
  }

  function handleRetry() {
    setSelected(null);
    setTrueFalse(null);
    setMatches({});
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
              Quiz passed. Check your celebration below for XP and streak updates.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const isCorrect = submitted && checkAnswer();
  const isWrong = submitted && !isCorrect;

  return (
    <Card padding="md">
      <h3 className="font-semibold text-gray-900 mb-1">{QUIZ_LABELS[quiz.type]}</h3>
      {quiz.type === "scenario" && (
        <p className="text-xs text-gray-500 mb-3 italic">{quiz.context}</p>
      )}
      <p className="text-sm text-gray-700 mb-4">{quiz.question}</p>

      {quiz.type === "image_identify" && (
        <div className="mb-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 aspect-video flex flex-col items-center justify-center text-gray-400">
          <ImageIcon className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">{quiz.placeholderLabel}</p>
          <p className="text-xs mt-1">Image quiz coming soon. Use the options below</p>
        </div>
      )}

      {quiz.type === "true_false" && (
        <div className="flex gap-3 mb-4">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              type="button"
              disabled={submitted && isCorrect}
              onClick={() => !submitted && setTrueFalse(val)}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                trueFalse === val && !submitted && "border-green-500 bg-green-50 text-green-800",
                submitted && val === quiz.correct && "border-green-500 bg-green-50 text-green-800",
                submitted && trueFalse === val && val !== quiz.correct && "border-red-300 bg-red-50"
              )}
            >
              {val ? "True" : "False"}
            </button>
          ))}
        </div>
      )}

      {quiz.type === "matching" && (
        <div className="space-y-3 mb-4">
          {quiz.pairs.map((pair, i) => (
            <div key={pair.left} className="flex items-center gap-2 text-sm">
              <span className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                {pair.left}
              </span>
              <span className="text-gray-400">→</span>
              <select
                disabled={submitted && isCorrect}
                value={matches[i] ?? ""}
                onChange={(e) =>
                  setMatches((m) => ({ ...m, [i]: Number(e.target.value) }))
                }
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
              >
                <option value="">Pick match…</option>
                {quiz.pairs.map((p, j) => (
                  <option key={p.right} value={j}>
                    {p.right}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {(quiz.type === "multiple_choice" ||
        quiz.type === "scenario" ||
        quiz.type === "image_identify") && (
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
                submitted && i === quiz.correctIndex && "border-green-500 bg-green-50 text-green-800",
                submitted && selected === i && i !== quiz.correctIndex && "border-red-300 bg-red-50 text-red-800"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}

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
          disabled={
            quiz.type === "true_false"
              ? trueFalse === null
              : quiz.type === "matching"
                ? Object.keys(matches).length < quiz.pairs.length
                : selected === null
          }
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
