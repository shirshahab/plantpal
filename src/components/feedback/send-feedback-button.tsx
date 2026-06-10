"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitBetaFeedback } from "@/lib/feedback/submit-feedback";
import {
  BETA_FEEDBACK_CATEGORIES,
  type BetaFeedbackCategory,
} from "@/lib/feedback/types";
import { cn } from "@/lib/utils";

interface BetaFeedbackFormProps {
  onSuccess?: () => void;
  className?: string;
  defaultCategory?: BetaFeedbackCategory;
}

export function BetaFeedbackForm({
  onSuccess,
  className,
  defaultCategory,
}: BetaFeedbackFormProps) {
  const pathname = usePathname();
  const [category, setCategory] = useState<BetaFeedbackCategory | null>(
    defaultCategory ?? null
  );
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<"supabase" | "local" | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await submitBetaFeedback({
      category: category ?? undefined,
      improvement: note,
      route: pathname,
    });

    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Could not send feedback.");
      return;
    }

    setSent(result.storage);
    setNote("");
    setCategory(null);
    onSuccess?.();
    setTimeout(() => setSent(null), 4000);
  }

  if (sent) {
    return (
      <p className={cn("text-sm text-green-600 bg-green-50 rounded-xl px-4 py-3", className)}>
        {sent === "supabase"
          ? "Thanks — your feedback was sent to the team."
          : "Thanks — saved on this device. It will be sent when you're back online."}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">What type of feedback?</p>
        <div className="flex flex-wrap gap-2">
          {BETA_FEEDBACK_CATEGORIES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setCategory(opt.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium border touch-manipulation transition-colors",
                category === opt.id
                  ? "border-green-600 bg-green-50 text-green-800"
                  : "border-gray-200 bg-white text-gray-600 hover:border-green-200"
              )}
            >
              <span aria-hidden>{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        id="beta-feedback-note"
        label="Tell us more (optional)"
        placeholder="What happened? What would make it better?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="text-base"
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <Button
        type="submit"
        loading={loading}
        disabled={!category && !note.trim()}
        className="w-full sm:w-auto touch-manipulation"
      >
        Send Feedback
      </Button>
    </form>
  );
}

interface SendFeedbackButtonProps {
  className?: string;
  variant?: "inline" | "chip";
  defaultCategory?: BetaFeedbackCategory;
}

export function SendFeedbackButton({
  className,
  variant = "chip",
  defaultCategory,
}: SendFeedbackButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 touch-manipulation transition-colors",
          variant === "chip"
            ? "rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:border-green-200"
            : "text-sm text-green-700 font-medium hover:text-green-800",
          className
        )}
        aria-label="Send feedback"
      >
        <MessageSquare className={variant === "chip" ? "w-3.5 h-3.5 text-green-600" : "w-4 h-4"} />
        Send Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 pb-8 sm:pb-5 max-h-[90vh] overflow-y-auto safe-bottom shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Send Feedback</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Help us improve the beta — we read every note.
            </p>
            <BetaFeedbackForm
              defaultCategory={defaultCategory}
              onSuccess={() => setTimeout(() => setOpen(false), 1500)}
            />
          </div>
        </div>
      )}
    </>
  );
}
