"use client";

import Link from "next/link";
import { RotateCcw, Trash2, Sparkles, Database, Wrench, Dna } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  clearLocalData,
  isDevEnvironment,
  loadDemoGarden,
  resetAiCache,
  resetOnboarding,
  resetTasks,
  resetGenome,
} from "@/lib/dev/dev-tools";

export function DeveloperToolsSection() {
  if (!isDevEnvironment()) return null;

  function reload() {
    window.location.reload();
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
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
        <Link href="/setup">
          <Button variant="outline" size="sm" className="w-full">
            Run Setup Check
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
