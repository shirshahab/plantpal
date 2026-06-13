"use client";

import { useState, useEffect } from "react";
import type { Plant } from "@/lib/types";
import { useJourney } from "@/lib/store/journey-provider";
import { GoalPicker } from "@/components/journey/goal-picker";
import { Button } from "@/components/ui/button";
import { useOverlay } from "@/lib/navigation/use-overlay";

interface EditGoalsModalProps {
  plant: Plant;
  open: boolean;
  onClose: () => void;
}

export function EditGoalsModal({ plant, open, onClose }: EditGoalsModalProps) {
  const { getPlantGoals, getPrimaryGoal, updatePlantGoals } = useJourney();
  useOverlay(`edit-goals-${plant.id}`, open, onClose);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const goals = getPlantGoals(plant.id);
      const primary = getPrimaryGoal(plant.id);
      setSelectedIds(goals.map((g) => g.id));
      setPrimaryId(primary?.id ?? goals[0]?.id ?? null);
    }
  }, [open, plant.id, getPlantGoals, getPrimaryGoal]);

  if (!open) return null;

  async function handleSave() {
    if (selectedIds.length === 0) return;
    setSaving(true);
    updatePlantGoals(plant, selectedIds, primaryId ?? undefined);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 z-10">
          <h2 className="text-lg font-bold text-gray-900">Edit goals</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Update what you&apos;re trying to achieve with {plant.name}.
          </p>
        </div>
        <div className="p-5">
          <GoalPicker
            selectedIds={selectedIds}
            primaryId={primaryId}
            onChange={(ids, primary) => {
              setSelectedIds(ids);
              setPrimaryId(primary);
            }}
            compact
          />
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            loading={saving}
            disabled={selectedIds.length === 0}
            onClick={handleSave}
          >
            Save goals
          </Button>
        </div>
      </div>
    </div>
  );
}
