"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw, Trash2, Sparkles, Database, Wrench, Dna, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  clearLocalData,
  clearScanHistory,
  isDevEnvironment,
  loadDemoGarden,
  resetAiCache,
  resetOnboarding,
  resetTasks,
  resetGenome,
} from "@/lib/dev/dev-tools";
import {
  ACCESS_OVERRIDE_EVENT,
  isFounderModeEnabled,
  setFounderModeEnabled,
} from "@/lib/billing/beta-unlock";
import { useSubscription } from "@/lib/store/subscription-provider";

export function DeveloperToolsSection() {
  const { betaUnlockAll, founderMode } = useSubscription();
  const [founder, setFounder] = useState(false);

  useEffect(() => {
    setFounder(isFounderModeEnabled());
    const sync = () => setFounder(isFounderModeEnabled());
    window.addEventListener(ACCESS_OVERRIDE_EVENT, sync);
    return () => window.removeEventListener(ACCESS_OVERRIDE_EVENT, sync);
  }, []);

  if (!isDevEnvironment()) return null;

  function reload() {
    window.location.reload();
  }

  function toggleFounderMode() {
    const next = !founder;
    setFounderModeEnabled(next);
    setFounder(next);
  }

  return (
    <Card className="border-dashed border-amber-200 bg-amber-50/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-gray-900">Developer Tools</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">Development only — not shown in production builds.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-amber-200/80 bg-white/70 px-4 py-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600" />
                Enable Founder Mode
              </p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Unlimited access, all plans unlocked, upgrade prompts hidden. Stored locally in
                this browser.
              </p>
            </div>
            <Badge variant={founder || betaUnlockAll ? "success" : "outline"}>
              {founder || betaUnlockAll ? "Active" : "Off"}
            </Badge>
          </div>
          <Button
            variant={founder ? "secondary" : "primary"}
            size="sm"
            onClick={toggleFounderMode}
            className="touch-manipulation"
          >
            {founder ? "Disable Founder Mode" : "Enable Founder Mode"}
          </Button>
          {betaUnlockAll && !founderMode && (
            <p className="text-xs text-amber-800">
              BETA_UNLOCK_ALL env is also active — full access from server config.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadDemoGarden("91107");
            reload();
          }}
        >
          <Sparkles className="w-4 h-4" />
          Load Demo Garden
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm("Clear all local PlantPal data?")) {
              clearLocalData();
              reload();
            }
          }}
        >
          <Trash2 className="w-4 h-4" />
          Clear Local Data
        </Button>
        <Button variant="outline" size="sm" onClick={() => { resetOnboarding(); reload(); }}>
          <RotateCcw className="w-4 h-4" />
          Reset Onboarding
        </Button>
        <Button variant="outline" size="sm" onClick={() => { resetAiCache(); reload(); }}>
          <Database className="w-4 h-4" />
          Reset AI Cache
        </Button>
        <Button variant="outline" size="sm" onClick={() => { resetTasks(); reload(); }}>
          <RotateCcw className="w-4 h-4" />
          Reset Tasks
        </Button>
        <Button variant="outline" size="sm" onClick={() => { resetGenome(); reload(); }}>
          <Dna className="w-4 h-4" />
          Reset Genome
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm("Clear local plant scan history? Photos in Supabase are not deleted.")) {
              clearScanHistory();
              reload();
            }
          }}
        >
          <Trash2 className="w-4 h-4" />
          Clear Scan History
        </Button>
        <Link href="/setup">
          <Button variant="outline" size="sm" className="w-full">
            Run Setup Check
          </Button>
        </Link>
        </div>
      </CardContent>
    </Card>
  );
}
