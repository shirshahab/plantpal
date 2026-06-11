"use client";

import { useState } from "react";
import { BadgeCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/store/auth-provider";
import {
  saveExpertReviewRequest,
  listExpertReviewRequests,
} from "@/lib/health/report-storage";

const URGENCIES = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
] as const;

interface RequestExpertReviewProps {
  plantId?: string | null;
  healthReportId?: string | null;
  /** e.g. species name. Helps route to the right expert later. */
  cropType?: string;
  /** Prefill from the diagnosis context. */
  defaultDescription?: string;
  photos?: string[];
  className?: string;
}

/**
 * "Request Expert Review" entry point. Stores the request (local + Supabase)
 * and shows a pending state. No expert marketplace yet, and the copy says so.
 */
export function RequestExpertReview({
  plantId = null,
  healthReportId = null,
  cropType,
  defaultDescription = "",
  photos,
  className,
}: RequestExpertReviewProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState(defaultDescription);
  const [requested, setRequested] = useState(() =>
    healthReportId
      ? listExpertReviewRequests().some((r) => r.healthReportId === healthReportId)
      : false
  );

  function submit() {
    saveExpertReviewRequest(
      {
        healthReportId,
        plantId,
        urgency,
        notes: description.trim(),
        cropType,
        photos,
      },
      user?.id ?? null
    );
    setRequested(true);
    setOpen(false);
  }

  if (requested) {
    return (
      <Card padding="md" className={cn("border-violet-100 bg-violet-50/40", className)}>
        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-violet-600" />
          Expert review requested
        </p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Expert review coming soon. We&apos;ll use these requests to prioritize
          early access.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="md" className={cn("border-violet-100 bg-violet-50/30 space-y-3", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-left touch-manipulation"
        aria-expanded={open}
      >
        <span>
          <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-violet-600" />
            Need a human set of eyes? Request expert review.
          </span>
          <span className="block text-xs text-gray-500 mt-0.5">
            Expert review coming soon. Requests help us prioritize early access.
          </span>
        </span>
        <ChevronDown
          className={cn("w-4 h-4 text-gray-400 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Urgency</label>
            <div className="flex gap-2">
              {URGENCIES.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUrgency(u.id)}
                  aria-pressed={urgency === u.id}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-sm touch-manipulation transition-colors",
                    urgency === u.id
                      ? "border-violet-300 bg-violet-100/60 text-violet-900 font-medium"
                      : "border-gray-200 bg-white text-gray-600"
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="expert-review-description"
              className="text-xs font-medium text-gray-500 mb-1.5 block"
            >
              What should the expert look at?
            </label>
            <textarea
              id="expert-review-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the problem, what you tried, and how fast it's spreading."
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white resize-none"
            />
          </div>
          <Button size="sm" onClick={submit} className="touch-manipulation">
            Submit request
          </Button>
        </div>
      )}
    </Card>
  );
}
