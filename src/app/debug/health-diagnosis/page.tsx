"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProDiagnosisResult } from "@/lib/types/health";

function BoolBadge({ value, label }: { value: boolean; label: string }) {
  return (
    <span
      className={
        value
          ? "inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800"
          : "inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800"
      }
    >
      {label}: {value ? "Yes" : "No"}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="text-xs bg-gray-950 text-green-100 rounded-lg p-3 overflow-x-auto max-h-80 whitespace-pre-wrap break-all">
      {value == null ? "null" : JSON.stringify(value, null, 2)}
    </pre>
  );
}

const TEST_PAYLOADS: Record<string, Record<string, unknown>> = {
  "Powdery mildew": {
    species: "Bougainvillea",
    growthStage: "flowering",
    locationType: "outdoor",
    zipCode: "91107",
    photos: [],
    symptoms: ["white_powder", "mold_fungus"],
    environment: {
      temperature: "70-85F",
      humidity: "high humidity",
      airflow: "poor airflow / stagnant",
      lightIntensity: "direct sun / full sun",
      wateringFrequency: "every 3 days",
      fertilizerUsed: "",
      pruningHistory: "dense canopy, not pruned recently",
    },
  },
  "Spider mites": {
    species: "Tomato",
    growthStage: "fruiting",
    locationType: "indoor",
    zipCode: "91107",
    photos: [],
    symptoms: ["speckling", "webbing", "pests_visible"],
    environment: {
      temperature: "hot, around 90F",
      humidity: "low humidity, dry",
      airflow: "moderate airflow",
      lightIntensity: "grow lights",
      wateringFrequency: "every 2 days",
      fertilizerUsed: "",
      pruningHistory: "",
    },
  },
  Overwatering: {
    species: "Fiddle Leaf Fig",
    growthStage: "mature",
    locationType: "indoor",
    zipCode: "91107",
    photos: [],
    symptoms: ["yellow_leaves", "soggy_soil", "wilting"],
    environment: {
      temperature: "72F",
      humidity: "moderate",
      airflow: "moderate airflow",
      lightIntensity: "low light",
      wateringFrequency: "daily",
      fertilizerUsed: "none",
      pruningHistory: "",
    },
  },
  "Nutrient burn": {
    species: "Pepper",
    growthStage: "vegetative",
    locationType: "indoor",
    zipCode: "91107",
    photos: [],
    symptoms: ["nutrient_burn", "brown_spots", "curling_leaves"],
    environment: {
      temperature: "78F",
      humidity: "55%",
      airflow: "good airflow",
      lightIntensity: "grow lights",
      wateringFrequency: "every 2 days",
      fertilizerUsed: "full-strength liquid fertilizer 3 days ago",
      pruningHistory: "",
    },
  },
  "Commercial mode": {
    species: "high-value crop",
    growthStage: "flowering",
    locationType: "indoor",
    zipCode: "91107",
    photos: [],
    symptoms: ["white_powder", "mold_fungus"],
    environment: {
      temperature: "75F",
      humidity: "high humidity",
      airflow: "poor airflow / stagnant",
      lightIntensity: "grow lights",
      wateringFrequency: "drip, daily",
      fertilizerUsed: "feed schedule, normal",
      pruningHistory: "dense canopy",
    },
    commercial: {
      enabled: true,
      plantCount: 20,
      roomName: "Flower Room B",
      cropType: "high-value crop",
      estimatedCropValue: "",
      affectedPercent: 15,
      growthPhase: "week 4 of flower",
      harvestTimeline: "3 weeks",
    },
  },
};

export default function HealthDiagnosisDebugPage() {
  const [keyDetected, setKeyDetected] = useState<boolean | null>(null);
  const [plantnetDetected, setPlantnetDetected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProDiagnosisResult | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [sentBytes, setSentBytes] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/ai/pro-diagnosis", { cache: "no-store" });
        const json = (await res.json()) as {
          openaiKeyDetected?: boolean;
          plantnetKeyDetected?: boolean;
        };
        setKeyDetected(Boolean(json.openaiKeyDetected));
        setPlantnetDetected(Boolean(json.plantnetKeyDetected));
      } catch {
        setKeyDetected(false);
        setPlantnetDetected(false);
      }
    })();
  }, []);

  async function runTest(name: string) {
    setLoading(name);
    setError(null);
    setResult(null);
    const body = JSON.stringify(TEST_PAYLOADS[name]);
    setSentBytes(new TextEncoder().encode(body).length);
    try {
      const res = await fetch("/api/ai/pro-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      setResponseStatus(res.status);
      const json = (await res.json()) as
        | { ok: true; data: ProDiagnosisResult }
        | { ok: false; error: string };
      if (json.ok) setResult(json.data);
      else setError(json.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Health Diagnosis Debug</h1>
          <Link href="/doctor/pro" className="text-sm text-green-600 font-medium">
            Open /doctor/pro →
          </Link>
        </div>

        <Section title="Environment">
          {keyDetected === null ? (
            <p className="text-sm text-gray-400">Checking…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <BoolBadge value={keyDetected} label="OpenAI key detected" />
              <BoolBadge value={plantnetDetected ?? false} label="Pl@ntNet key detected" />
            </div>
          )}
          <p className="text-xs text-gray-400">
            Without a key, all diagnoses use the rule-based fallback (no mock data).
          </p>
        </Section>

        <Section title="Test cases">
          <div className="flex flex-wrap gap-2">
            {Object.keys(TEST_PAYLOADS).map((name) => (
              <button
                key={name}
                type="button"
                disabled={loading !== null}
                onClick={() => runTest(name)}
                className="rounded-full bg-gray-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50"
              >
                {loading === name ? "Running…" : name}
              </button>
            ))}
          </div>
        </Section>

        {(result || error) && (
          <Section title="Request">
            <div className="flex flex-wrap gap-2">
              {responseStatus !== null && (
                <BoolBadge value={responseStatus === 200} label={`HTTP ${responseStatus}`} />
              )}
              {sentBytes !== null && (
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                  Payload: {(sentBytes / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </Section>
        )}

        {error && (
          <Section title="Error">
            <p className="text-sm text-red-600">{error}</p>
          </Section>
        )}

        {result && (
          <>
            <Section title="AI status">
              <div className="flex flex-wrap gap-2">
                <BoolBadge value={result.debug.openaiKeyDetected} label="Key detected" />
                <BoolBadge value={result.debug.aiStatus === "ok"} label="AI response ok" />
                <BoolBadge
                  value={result.debug.plantnetStatus === "ok"}
                  label={`Pl@ntNet ${result.debug.plantnetStatus ?? "skipped"}`}
                />
                <BoolBadge value={result.debug.fallbackUsed} label="Fallback used" />
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                  Images: {result.debug.imageCount}
                </span>
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                  Server payload: {(result.debug.payloadBytes / 1024).toFixed(1)} KB
                </span>
              </div>
            </Section>
            <Section title="Structured diagnosis">
              <JsonBlock value={result.diagnosis} />
            </Section>
            <Section title="Second opinion">
              <JsonBlock value={result.secondOpinion} />
            </Section>
            <Section title="Remedy plan">
              <JsonBlock value={result.remedyPlan} />
            </Section>
            <Section title="Prognosis">
              <JsonBlock value={result.prognosis} />
            </Section>
            {result.commercialAssessment && (
              <Section title="Commercial assessment">
                <JsonBlock value={result.commercialAssessment} />
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
