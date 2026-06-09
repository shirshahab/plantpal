"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bug, Lightbulb, MessageSquare, X } from "lucide-react";
import { BetaFeedbackForm } from "@/components/feedback/send-feedback-button";
import type { BetaFeedbackCategory } from "@/lib/feedback/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FeedbackPanel({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Send Feedback</h2>
            <p className="text-sm text-gray-500">Report bugs or request features</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <BetaFeedbackForm />
      </CardContent>
    </Card>
  );
}

const QUICK_ACTIONS: { id: BetaFeedbackCategory; label: string; icon: React.ElementType }[] = [
  { id: "bug", label: "Report bug", icon: Bug },
  { id: "missing_feature", label: "Request feature", icon: Lightbulb },
];

export function FloatingFeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<BetaFeedbackCategory | undefined>();

  const hiddenOnPages = ["/login", "/onboarding", "/signup"];
  if (hiddenOnPages.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setCategory(undefined);
          setOpen(true);
        }}
        className="fixed bottom-24 md:bottom-8 right-4 z-40 w-12 h-12 rounded-full bg-green-600 text-white shadow-lg shadow-green-900/20 flex items-center justify-center touch-manipulation hover:bg-green-700 transition-colors safe-bottom"
        aria-label="Send feedback"
      >
        <MessageSquare className="w-5 h-5" />
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
              <h3 className="font-semibold text-gray-900">Feedback</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => setCategory(action.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium touch-manipulation transition-colors",
                      category === action.id
                        ? "border-green-500 bg-green-50 text-green-800"
                        : "border-gray-100 hover:border-green-200 text-gray-700"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {action.label}
                  </button>
                );
              })}
            </div>

            <BetaFeedbackForm
              key={category ?? "general"}
              defaultCategory={category}
              onSuccess={() => setTimeout(() => setOpen(false), 1500)}
            />
          </div>
        </div>
      )}
    </>
  );
}
