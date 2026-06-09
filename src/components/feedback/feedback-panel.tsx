"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { submitBetaFeedback } from "@/lib/feedback/submit-feedback";
import { cn } from "@/lib/utils";

export function FeedbackPanel({ className }: { className?: string }) {
  const pathname = usePathname();
  const [tried, setTried] = useState("");
  const [confused, setConfused] = useState("");
  const [improvement, setImprovement] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await submitBetaFeedback({
      tried,
      confused,
      improvement,
      route: pathname,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Could not send feedback.");
      return;
    }
    setSent(true);
    setTried("");
    setConfused("");
    setImprovement("");
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Send Feedback</h2>
            <p className="text-sm text-gray-500">Help us improve the beta experience</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-green-600 bg-green-50 rounded-xl px-4 py-3">
            Thanks — your feedback was saved.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="feedback-tried"
              label="What did you try?"
              placeholder="e.g. Added my first plant and generated a care plan"
              value={tried}
              onChange={(e) => setTried(e.target.value)}
            />
            <Input
              id="feedback-confused"
              label="What confused you?"
              placeholder="e.g. I wasn't sure where to find Today tasks"
              value={confused}
              onChange={(e) => setConfused(e.target.value)}
            />
            <Input
              id="feedback-improvement"
              label="What would make this better?"
              placeholder="e.g. Clearer next step after scanning"
              value={improvement}
              onChange={(e) => setImprovement(e.target.value)}
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <Button type="submit" loading={loading} className="w-full sm:w-auto">
              Send Feedback
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export function FloatingFeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tried, setTried] = useState("");
  const [confused, setConfused] = useState("");
  const [improvement, setImprovement] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await submitBetaFeedback({
      tried,
      confused,
      improvement,
      route: pathname,
    });
    setLoading(false);
    if (result.ok) {
      setSent(true);
      setTried("");
      setConfused("");
      setImprovement("");
      setTimeout(() => {
        setSent(false);
        setOpen(false);
      }, 2000);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed z-40 md:hidden left-4 bottom-[5.5rem]",
          "flex items-center gap-1.5 px-3 py-2 rounded-full",
          "bg-white border border-gray-200 shadow-md text-xs font-medium text-gray-700",
          "touch-manipulation hover:bg-gray-50"
        )}
        aria-label="Send feedback"
      >
        <MessageSquare className="w-3.5 h-3.5 text-green-600" />
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-8 max-h-[85vh] overflow-y-auto safe-bottom">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Send Feedback</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sent ? (
              <p className="text-sm text-green-600">Thanks for your feedback!</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  id="float-tried"
                  label="What did you try?"
                  value={tried}
                  onChange={(e) => setTried(e.target.value)}
                />
                <Input
                  id="float-confused"
                  label="What confused you?"
                  value={confused}
                  onChange={(e) => setConfused(e.target.value)}
                />
                <Input
                  id="float-improvement"
                  label="What would make this better?"
                  value={improvement}
                  onChange={(e) => setImprovement(e.target.value)}
                />
                <Button type="submit" loading={loading} className="w-full">
                  Send Feedback
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
