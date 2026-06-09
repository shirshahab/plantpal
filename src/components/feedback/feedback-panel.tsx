"use client";

import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BetaFeedbackForm } from "@/components/feedback/send-feedback-button";

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
            <p className="text-sm text-gray-500">Help us improve the beta experience</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <BetaFeedbackForm />
      </CardContent>
    </Card>
  );
}

export function FloatingFeedbackButton() {
  const pathname = usePathname();
  const hiddenOnPages = [
    "/dashboard",
    "/scanner",
    "/plants/new",
    "/academy",
  ];
  const isPlantDetail = pathname.startsWith("/plants/") && pathname !== "/plants/new";
  if (hiddenOnPages.some((p) => pathname === p || pathname.startsWith(p + "/")) || isPlantDetail) {
    return null;
  }

  return null;
}
