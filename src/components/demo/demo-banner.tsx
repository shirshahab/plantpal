"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isDemoMode, saveUserProfile } from "@/lib/profile/user-profile";
import { useState, useEffect } from "react";

export function DemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isDemoMode());
  }, []);

  if (!visible) return null;

  function dismiss() {
    saveUserProfile({ demoMode: false });
    setVisible(false);
  }

  return (
    <Card
      padding="md"
      className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/80"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">Demo Garden active</p>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
            Pre-loaded Pasadena garden for pitching.{" "}
            <Link href="/demo-script" className="text-amber-700 underline">
              View demo script
            </Link>
          </p>
          <Link href="/plants/new">
            <Button size="sm" variant="outline" className="mt-2 h-8 text-xs">
              Add your own plant
            </Button>
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="p-1 rounded-lg hover:bg-amber-100 text-amber-600"
          aria-label="Dismiss demo banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
