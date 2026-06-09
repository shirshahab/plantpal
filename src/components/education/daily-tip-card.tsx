"use client";

import Link from "next/link";
import { ArrowRight, Lightbulb, Bookmark, BookmarkCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDailyTip } from "@/lib/education/tips";
import { enrichTip } from "@/lib/education/tip-utils";
import { useEngagement } from "@/lib/store/engagement-provider";

export function DailyTipCard() {
  const tip = enrichTip(getDailyTip());
  const { savedTipIds, toggleSaveTip } = useEngagement();
  const saved = savedTipIds.includes(tip.id);

  return (
    <Card padding="md" className="bg-gradient-to-r from-amber-50/80 to-white border-amber-100">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              Today&apos;s Plant Tip
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1.5">&ldquo;{tip.text}&rdquo;</p>
          </div>
          <div className="text-sm space-y-2">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Why it matters</p>
              <p className="text-gray-600 mt-0.5">{tip.whyItMatters}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/80 border border-amber-100">
              <p className="text-xs font-medium text-amber-700 uppercase">Action today</p>
              <p className="text-gray-700 mt-0.5">{tip.actionToday}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/learn/${tip.lessonId}`}>
              <Button variant="ghost" size="sm" className="text-amber-700 hover:bg-amber-50 px-0">
                Related lesson
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="touch-manipulation"
              onClick={() => toggleSaveTip(tip.id)}
            >
              {saved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-amber-600" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  Save tip
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
