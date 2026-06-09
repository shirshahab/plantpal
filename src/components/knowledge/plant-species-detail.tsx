import Link from "next/link";
import Image from "next/image";
import { Plus, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlantSpeciesDetail } from "@/lib/knowledge/types";
import { PLANT_TYPE_LABELS } from "@/lib/knowledge/types";
import { SuitabilityScoreCard } from "@/components/climate/suitability-score-card";

export function PlantSpeciesDetailView({ plant }: { plant: PlantSpeciesDetail }) {
  const addHref = `/plants/new?speciesId=${encodeURIComponent(plant.id)}&name=${encodeURIComponent(plant.common_name)}`;

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title={plant.common_name}
        description={plant.scientific_name}
        action={
          <Link
            href={addHref}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-medium rounded-xl bg-green-600 text-white hover:bg-green-700 shadow-sm touch-manipulation min-h-[52px]"
          >
            <Plus className="w-5 h-5" />
            Add to My Garden
          </Link>
        }
      />

      <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden bg-green-50">
        <Image
          src={plant.image_url}
          alt={plant.common_name}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 896px"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge>{PLANT_TYPE_LABELS[plant.type]}</Badge>
        <Badge variant="info">{plant.family}</Badge>
        <Badge variant="outline">
          Zone {plant.hardiness_zone_min}–{plant.hardiness_zone_max}
        </Badge>
        <Badge variant="outline">{plant.maintenance_level}</Badge>
      </div>

      <SuitabilityScoreCard species={plant} />

      <Section title="About">
        <p className="text-gray-600 leading-relaxed">{plant.description}</p>
      </Section>

      <div className="grid sm:grid-cols-3 gap-4">
        <InfoCard label="Sunlight" value={plant.sunlight} />
        <InfoCard label="Watering" value={plant.watering} />
        <InfoCard label="Soil preference" value={plant.soil_preference} />
      </div>

      {plant.fertilizers.length > 0 && (
        <Section title="Fertilizer recommendations">
          <ul className="space-y-2">
            {plant.fertilizers.map((f) => (
              <li key={f.id} className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{f.name}</span>
                <span className="text-gray-400"> · {f.npk_ratio}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{f.application_frequency}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {plant.pests.length > 0 && (
        <Section title="Pest risks">
          <div className="space-y-3">
            {plant.pests.map((p) => (
              <Card key={p.id} padding="md" className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <RiskBadge level={p.risk_level} />
                </div>
                <p className="text-gray-500">{p.signs}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {plant.diseases.length > 0 && (
        <Section title="Disease risks">
          <div className="space-y-3">
            {plant.diseases.map((d) => (
              <Card key={d.id} padding="md" className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{d.name}</span>
                  <RiskBadge level={d.risk_level} />
                </div>
                <p className="text-gray-500">{d.symptoms}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {plant.care_guide && (
        <Section title="Care guide">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <GuideBlock title="Watering" text={plant.care_guide.watering_guide} />
            <GuideBlock title="Sunlight" text={plant.care_guide.sunlight_guide} />
            <GuideBlock title="Soil" text={plant.care_guide.soil_guide} />
            <GuideBlock title="Fertilizer" text={plant.care_guide.fertilizer_guide} />
            <GuideBlock title="Pruning" text={plant.care_guide.pruning_guide} />
            <GuideBlock title="Repotting" text={plant.care_guide.repotting_guide} />
            <GuideBlock title="Seasonal care" text={plant.care_guide.seasonal_care} />
            <GuideBlock title="Beginner tips" text={plant.care_guide.beginner_tips} />
          </div>
          {plant.care_guide.common_problems && (
            <Card padding="md" className="mt-4 bg-amber-50 border-amber-100">
              <div className="flex gap-2 text-sm text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{plant.care_guide.common_problems}</p>
              </div>
            </Card>
          )}
        </Section>
      )}

      <div className="pb-8">
        <Link
          href={addHref}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 text-base font-medium rounded-xl bg-green-600 text-white hover:bg-green-700 shadow-sm touch-manipulation min-h-[52px]"
        >
          <Plus className="w-5 h-5" />
          Add to My Garden
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="md">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </Card>
  );
}

function GuideBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-gray-600">{text}</p>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors =
    level === "high"
      ? "bg-red-100 text-red-700"
      : level === "low"
        ? "bg-green-100 text-green-700"
        : "bg-amber-100 text-amber-700";
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${colors}`}>
      {level} risk
    </span>
  );
}
