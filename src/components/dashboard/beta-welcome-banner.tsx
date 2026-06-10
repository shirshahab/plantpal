"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FlaskConical, X } from "lucide-react";
import { Card } from "@/components/ui/card";

const DISMISS_KEY = "plantpal-beta-welcome-dismissed";

/** One-time banner pointing new beta testers at the tester guide. */
export function BetaWelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(DISMISS_KEY) !== "1");
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <Card padding="md" className="border-violet-100 bg-gradient-to-br from-violet-50/60 to-white relative">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <FlaskConical className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">Welcome to the PlantPal beta</p>
          <p className="text-sm text-gray-500 mt-1">
            You&apos;re one of the first 20 growers. The 15-minute tester guide shows what to
            try — and your feedback shapes what we build next.
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <Link
              href="/tester-guide"
              className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 hover:text-violet-800"
            >
              Open tester guide
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/beta-start"
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              What to test
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
