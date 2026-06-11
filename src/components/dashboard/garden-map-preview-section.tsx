"use client";

import Link from "next/link";
import { ArrowRight, Map, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoat } from "@/lib/store/moat-provider";
import { GARDEN_SPACE_ICONS, GARDEN_SPACE_LABELS } from "@/lib/moat/garden-map-types";

export function DashboardGardenMapPreview() {
  const { ready, spaces } = useMoat();

  if (!ready) return null;

  const hasMap = spaces.length > 0 && spaces.some((s) => s.zones.length > 0 || s.placements.length > 0);
  const primary = spaces[0];

  if (!hasMap) {
    return (
      <Card padding="md" className="border-dashed border-green-200 bg-green-50/30">
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Map className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-semibold text-gray-900">Build your digital garden</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
            Map zones, place plants, and get personalized seasonal care.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-center">
            <Link href="/garden-map">
              <Button size="sm" className="w-full sm:w-auto">
                Create Garden Map
              </Button>
            </Link>
            <Link href="/garden-map/designer">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Add Zone
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const avgHealth =
    primary.placements.length > 0
      ? Math.round(
          primary.placements.reduce((s, p) => s + p.healthScore, 0) / primary.placements.length
        )
      : null;

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{GARDEN_SPACE_ICONS[primary.type]}</span>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Garden map</p>
            <p className="font-semibold text-gray-900">{primary.name}</p>
          </div>
        </div>
        {avgHealth != null && (
          <span className="text-sm font-bold text-green-600">{avgHealth}/100</span>
        )}
      </div>

      <div className="space-y-2">
        {primary.zones.slice(0, 4).map((zone) => {
          const count = primary.placements.filter((p) => p.zoneId === zone.id).length;
          const zoneHealth =
            count > 0
              ? Math.round(
                  primary.placements
                    .filter((p) => p.zoneId === zone.id)
                    .reduce((s, p) => s + p.healthScore, 0) / count
                )
              : null;
          return (
            <div
              key={zone.id}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-gray-800 truncate">{zone.name}</span>
              <span className="text-xs text-gray-500 shrink-0 ml-2">
                {count} plant{count !== 1 ? "s" : ""}
                {zoneHealth != null ? ` · ${zoneHealth}%` : ""}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-2">
        {GARDEN_SPACE_LABELS[primary.type]} · {primary.zones.length} zones ·{" "}
        {primary.placements.length} plants
      </p>

      <Link href="/garden-map" className="inline-block mt-3">
        <Button variant="secondary" size="sm">
          Open Garden Map
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </Card>
  );
}
