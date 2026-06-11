"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Map, Plus, PenTool } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GardenHealthCard } from "@/components/moat/garden-health-card";
import { PlantPlacementCard } from "@/components/moat/plant-placement-card";
import { useMoat } from "@/lib/store/moat-provider";
import {
  GARDEN_SPACE_ICONS,
  GARDEN_SPACE_LABELS,
  type GardenSpaceType,
} from "@/lib/moat/garden-map-types";

const SPACE_TYPES = Object.keys(GARDEN_SPACE_LABELS) as GardenSpaceType[];

export function GardenMapHub() {
  const { ready, spaces, gardenHealth, createSpace } = useMoat();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<GardenSpaceType>("backyard");

  const allPlacements = useMemo(
    () => spaces.flatMap((s) => s.placements),
    [spaces]
  );

  if (!ready) {
    return (
      <div className="space-y-4 animate-pulse max-w-lg mx-auto">
        <div className="h-8 bg-gray-100 rounded-lg w-2/3" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  function handleCreate() {
    const name = newName.trim() || GARDEN_SPACE_LABELS[newType];
    createSpace(name, newType);
    setNewName("");
    setShowCreate(false);
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto page-enter">
      <PageHeader
        title="My Garden"
        description="Your digital twin: zones, plants, and health at a glance"
        action={
          <Link href="/garden-map/designer">
            <Button variant="secondary" size="sm">
              <PenTool className="w-4 h-4" />
              Designer
            </Button>
          </Link>
        }
      />

      <GardenHealthCard health={gardenHealth} />

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Your spaces
          </p>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="text-xs font-semibold text-green-600 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add space
          </button>
        </div>

        {showCreate && (
          <Card padding="md" className="mb-3 border-green-100 bg-green-50/30">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Space name (optional)"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm mb-3"
            />
            <div className="grid grid-cols-2 gap-2 mb-3">
              {SPACE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewType(type)}
                  className={`rounded-xl px-2 py-2 text-xs font-medium text-left transition-colors ${
                    newType === type
                      ? "bg-green-600 text-white"
                      : "bg-white border border-gray-100 text-gray-700"
                  }`}
                >
                  {GARDEN_SPACE_ICONS[type]} {GARDEN_SPACE_LABELS[type]}
                </button>
              ))}
            </div>
            <Button size="sm" className="w-full" onClick={handleCreate}>
              Create space
            </Button>
          </Card>
        )}

        {spaces.length === 0 && !showCreate && (
          <Card padding="md" className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-2xl mx-auto mb-3">
              🗺️
            </div>
            <p className="font-semibold text-gray-900">Map your garden</p>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
              Create a space, like a backyard, balcony, or raised bed, then place
              your plants to see zone-by-zone health.
            </p>
            <Button size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />
              Create your first space
            </Button>
          </Card>
        )}

        <div className="space-y-3">
          {spaces.map((space) => (
            <Link key={space.id} href={`/garden-map/designer?space=${space.id}`}>
              <Card padding="md" className="hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl">
                    {GARDEN_SPACE_ICONS[space.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{space.name}</p>
                    <p className="text-xs text-gray-500">
                      {GARDEN_SPACE_LABELS[space.type]} · {space.zones.length} zones ·{" "}
                      {space.placements.length} plants
                    </p>
                  </div>
                  <Map className="w-4 h-4 text-gray-300" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {allPlacements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
            Plant cards
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {allPlacements.map((p) => (
              <PlantPlacementCard key={p.id} placement={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
