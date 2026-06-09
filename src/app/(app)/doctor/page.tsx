"use client";

import { useState } from "react";
import Image from "next/image";
import { Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { usePlants } from "@/lib/store/plants-provider";
import { useJourney } from "@/lib/store/journey-provider";
import { useAiResults } from "@/lib/store/ai-provider";
import { useToast } from "@/lib/store/toast-provider";
import { requestDoctor } from "@/lib/ai/client";
import { buildDoctorRequest } from "@/lib/ai/build-request";
import { friendlyAiError } from "@/lib/errors/user-messages";
import { AiDoctorDisplay } from "@/components/ai/ai-doctor-display";

export default function DoctorPage() {
  const { plants } = usePlants();
  const { getPlantGoals, getPrimaryGoal } = useJourney();
  const { getLatestDoctor, saveDoctorReport } = useAiResults();
  const { toast } = useToast();
  const [plantId, setPlantId] = useState(plants[0]?.id ?? "");
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const plant = plants.find((p) => p.id === plantId);
  const report = plant ? getLatestDoctor(plant.id) : null;

  async function handleAsk() {
    if (!issue.trim() || !plant) return;
    setLoading(true);
    setError(null);

    const goals = getPlantGoals(plant.id);
    const primary = getPrimaryGoal(plant.id);
    const res = await requestDoctor(
      buildDoctorRequest(plant, issue.trim(), goals, primary)
    );

    setLoading(false);

    if (!res.ok) {
      setError(friendlyAiError(res.error, "Plant Doctor"));
      return;
    }

    saveDoctorReport(plant.id, res.data);
    setSaved(res.saved);
    toast(
      res.data.source === "ai"
        ? "Diagnosis ready."
        : "Diagnosis ready (mock mode)."
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Plant Doctor"
        description="Describe what's wrong — get a diagnosis-style action plan."
      />

      <Card padding="md" className="bg-green-50/50 border-green-100">
        <p className="text-sm text-gray-600">
          PlantPal answers based on your plant type, ZIP code, health status, and
          selected goals. Uses likely/possible language — not medical certainty.
        </p>
      </Card>

      <Card padding="md" className="space-y-4">
        <Select
          label="Select plant"
          value={plantId}
          onChange={(e) => setPlantId(e.target.value)}
          options={[
            { value: "", label: "Choose a plant…" },
            ...plants.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
        <Input
          label="Describe the issue"
          placeholder="Yellow leaves on new growth, sticky residue…"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
        />
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        <Button
          className="w-full touch-manipulation"
          loading={loading}
          disabled={!plantId || !issue.trim()}
          onClick={handleAsk}
        >
          <Stethoscope className="w-5 h-5" />
          Ask Plant Doctor
        </Button>
      </Card>

      {report && plant && (
        <Card padding="md" className="space-y-4 border-green-100">
          <div className="flex gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-green-50">
              <Image
                src={plant.image}
                alt={plant.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{plant.name}</p>
              {getPrimaryGoal(plant.id) && (
                <p className="text-xs text-gray-400 mt-1">
                  Goal: {getPrimaryGoal(plant.id)?.name}
                </p>
              )}
            </div>
          </div>
          <AiDoctorDisplay report={report} saved={saved} />
        </Card>
      )}

      {!plants.length && (
        <p className="text-sm text-gray-500 text-center py-8">
          Add a plant first to use Plant Doctor.
        </p>
      )}
    </div>
  );
}
