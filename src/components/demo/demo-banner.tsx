"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, RotateCcw, LogOut, Sprout } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isDemoMode } from "@/lib/profile/user-profile";
import { seedDemoGarden, exitDemoGarden } from "@/lib/demo/seed-demo-garden";
import { useState, useEffect } from "react";

export function DemoBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isDemoMode());
  }, []);

  if (!visible) return null;

  function handleReset() {
    seedDemoGarden(loadUserProfileZip());
    window.location.reload();
  }

  function handleExit() {
    exitDemoGarden();
    setVisible(false);
    router.push("/plants/new");
  }

  function handleStartOwn() {
    exitDemoGarden();
    setVisible(false);
    router.push("/plants/new");
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
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              You are viewing a demo garden.
            </p>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              Sample plants, tasks, and care plans for exploring PlantPal. Your changes
              won&apos;t affect a real garden until you start your own.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="h-8 text-xs touch-manipulation" onClick={handleStartOwn}>
              <Sprout className="w-3.5 h-3.5" />
              Start your own garden
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs touch-manipulation" onClick={handleReset}>
              <RotateCcw className="w-3.5 h-3.5" />
              Reset demo
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs touch-manipulation" onClick={handleExit}>
              <LogOut className="w-3.5 h-3.5" />
              Exit demo
            </Button>
          </div>
          <Link href="/demo-script" className="text-xs text-amber-700 underline inline-block">
            View demo script
          </Link>
        </div>
      </div>
    </Card>
  );
}

function loadUserProfileZip(): string {
  if (typeof window === "undefined") return "91107";
  try {
    const raw = localStorage.getItem("plantpal-user-profile");
    if (!raw) return "91107";
    const profile = JSON.parse(raw) as { zipCode?: string };
    return profile.zipCode || "91107";
  } catch {
    return "91107";
  }
}
