"use client";

import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ACCESS_OVERRIDE_EVENT,
  isFounderMode,
  setFounderModeEnabled,
} from "@/lib/billing/beta-unlock";
import { useSubscription } from "@/lib/store/subscription-provider";

export function FounderModeSection() {
  const { founderMode: founderFromContext, betaUnlockAll } = useSubscription();
  const [founder, setFounder] = useState(false);

  useEffect(() => {
    setFounder(isFounderMode());
    const sync = () => setFounder(isFounderMode());
    window.addEventListener(ACCESS_OVERRIDE_EVENT, sync);
    return () => window.removeEventListener(ACCESS_OVERRIDE_EVENT, sync);
  }, []);

  const active = founder || founderFromContext;

  function toggleFounderMode() {
    const next = !active;
    setFounderModeEnabled(next);
    setFounder(next);
  }

  return (
    <div className="rounded-xl border border-amber-200/80 bg-white/70 px-4 py-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-gray-900 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-600" />
            Founder Mode
          </p>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Unlocks all Plus and Pro features, removes limits and upgrade prompts for testing.
          </p>
        </div>
        <Badge variant={active ? "success" : "outline"}>
          {active ? "Active" : "Off"}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-700">
          Status:{" "}
          <span className={active ? "font-medium text-green-700" : "text-gray-500"}>
            {active ? "Active" : "Inactive"}
          </span>
        </p>
        <Button
          variant={active ? "secondary" : "primary"}
          size="sm"
          onClick={toggleFounderMode}
          className="touch-manipulation shrink-0"
        >
          {active ? "Turn OFF" : "Turn ON"}
        </Button>
      </div>

      {active && (
        <p className="text-xs text-green-800 bg-green-50 rounded-lg px-3 py-2 leading-relaxed">
          Founder Mode Active — all features unlocked, paywalls hidden.
        </p>
      )}

      {betaUnlockAll && !active && (
        <p className="text-xs text-amber-800">
          BETA_UNLOCK_ALL env is also active — full access from server config.
        </p>
      )}
    </div>
  );
}
