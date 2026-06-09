"use client";

import { Camera, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { usePlants } from "@/lib/store/plants-provider";
import { calculatePlantHealthScore, getScoreLabel } from "@/lib/scoring";
import { needsWaterToday } from "@/lib/plant-utils";

export default function ARPage() {
  const { plants } = usePlants();
  const overlays = plants.slice(0, 3).map((p, i) => ({
    name: p.name,
    score: calculatePlantHealthScore(p),
    status: needsWaterToday(p)
      ? "Needs water"
      : p.healthStatus === "needs_attention"
        ? "Check leaves"
        : `${getScoreLabel(calculatePlantHealthScore(p))}`,
    top: 20 + i * 25,
    left: 10 + i * 15,
  }));

  if (overlays.length === 0) {
    overlays.push(
      { name: "Meyer Lemon Tree", score: 92, status: "Thriving", top: 25, left: 15 },
      { name: "Japanese Maple", score: 68, status: "Needs water", top: 50, left: 30 },
      { name: "Bougainvillea", score: 74, status: "Check leaves", top: 70, left: 20 },
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeader
        title="AR Garden"
        description="Point your camera at your yard to see plant health overlays."
      />

      <Card padding="none" className="overflow-hidden relative">
        <div className="relative h-80 bg-gradient-to-b from-green-900/80 to-green-950 flex items-center justify-center">
          <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1416879595882-337324a7f4f9?w=800&h=600&fit=crop')] bg-cover bg-center" />
          <Camera className="w-12 h-12 text-white/40 relative z-10" />

          {overlays.map((o) => (
            <div
              key={o.name}
              className="absolute z-20 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-xs border border-white/20 max-w-[180px]"
              style={{ top: `${o.top}%`, left: `${o.left}%` }}
            >
              <p className="font-semibold">{o.name}</p>
              <p className="text-green-300">{o.score}/100</p>
              <p className="text-white/70">{o.status}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="md" className="flex gap-3 items-start">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-900">Concept preview</p>
          <p className="mt-1">
            Real AR will use your camera to label plants, show health scores, and surface care alerts in your yard.
          </p>
        </div>
      </Card>
    </div>
  );
}
