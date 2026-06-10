"use client";

import { useState } from "react";
import { Sparkles, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DESIGN_STUDIO_STYLES,
  buildMockDesignConcept,
  type DesignStudioStyle,
  type DesignStudioConcept,
} from "@/lib/moat/design-studio-styles";

const SPACE_OPTIONS = [
  { id: "backyard", label: "Backyard", emoji: "🌳" },
  { id: "front_yard", label: "Front Yard", emoji: "🏡" },
  { id: "planter", label: "Planter", emoji: "🪴" },
  { id: "patio", label: "Patio", emoji: "☀️" },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DesignStudioHub() {
  const [space, setSpace] = useState("backyard");
  const [style, setStyle] = useState<DesignStudioStyle | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [concept, setConcept] = useState<DesignStudioConcept | null>(null);
  const [generating, setGenerating] = useState(false);

  async function handleUpload(file: File) {
    setBeforeUrl(await readFileAsDataUrl(file));
  }

  async function handleGenerate() {
    if (!style) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    const spaceLabel = SPACE_OPTIONS.find((s) => s.id === space)?.label ?? "Yard";
    const result = buildMockDesignConcept(style, spaceLabel);
    result.beforeImageUrl = beforeUrl;
    result.afterImageUrl = null;
    setConcept(result);
    setGenerating(false);
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto page-enter">
      <PageHeader
        title="Design Studio"
        description="Upload your space · pick a style · get a concept plan"
      />

      <Card padding="md">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Your space
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SPACE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSpace(opt.id)}
              className={`rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-all ${
                space === opt.id
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-green-50"
              }`}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <Card padding="md">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Upload photo
        </p>
        <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-8 cursor-pointer hover:border-green-300 transition-colors">
          {beforeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={beforeUrl} alt="Your space" className="max-h-40 rounded-xl object-cover" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-300" />
              <span className="text-sm text-gray-500">Backyard, front yard, patio…</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload(f);
            }}
          />
        </label>
      </Card>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          Design style
        </p>
        <div className="grid gap-2">
          {DESIGN_STUDIO_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={`rounded-2xl px-4 py-3 text-left transition-all ${
                style === s.id
                  ? "bg-green-600 text-white shadow-lg scale-[1.01]"
                  : "bg-white border border-gray-100 hover:border-green-200"
              }`}
            >
              <span className="text-lg mr-2">{s.emoji}</span>
              <span className="font-semibold">{s.label}</span>
              <p className={`text-xs mt-0.5 ${style === s.id ? "text-green-100" : "text-gray-500"}`}>
                {s.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!style || generating}
        onClick={() => void handleGenerate()}
      >
        <Sparkles className="w-5 h-5" />
        {generating ? "Generating concept…" : "Generate design"}
      </Button>

      {concept && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card padding="md" className="bg-gradient-to-br from-green-50 to-white border-green-100">
            <h2 className="text-lg font-bold text-gray-900">{concept.title}</h2>
            <p className="text-sm text-gray-600 mt-2">{concept.summary}</p>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <div className="rounded-xl bg-white p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase">Est. cost</p>
                <p className="font-bold text-gray-900">{concept.estimatedCost}</p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase">Maintenance</p>
                <p className="font-bold text-gray-900">{concept.maintenanceLevel}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card padding="none" className="overflow-hidden">
              <p className="text-[10px] font-bold text-gray-400 uppercase px-3 pt-3">Before</p>
              <div className="aspect-square bg-gray-100 m-3 rounded-xl flex items-center justify-center overflow-hidden">
                {concept.beforeImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={concept.beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-sm">Your photo</span>
                )}
              </div>
            </Card>
            <Card padding="none" className="overflow-hidden">
              <p className="text-[10px] font-bold text-green-600 uppercase px-3 pt-3">After (Concept)</p>
              <div className="aspect-square bg-gradient-to-br from-emerald-100 to-green-200 m-3 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                <Sparkles className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-xs font-medium text-green-800">
                  OpenAI render placeholder
                </p>
                <p className="text-[10px] text-green-600/70 mt-1">
                  Connect DALL·E / gpt-image-1 here
                </p>
              </div>
            </Card>
          </div>

          <Card padding="md">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Recommended plants
            </p>
            <div className="flex flex-wrap gap-2">
              {concept.recommendedPlants.map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-green-50 text-green-700 text-xs font-medium px-3 py-1"
                >
                  {p}
                </span>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Shopping list
            </p>
            <div className="space-y-2">
              {concept.shoppingList.map((item) => (
                <div
                  key={item.item}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.item}</p>
                    <p className="text-xs text-gray-400">Qty {item.qty}</p>
                  </div>
                  <span className="text-green-600 font-semibold text-xs">{item.estPrice}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
