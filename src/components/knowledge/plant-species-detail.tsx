import Link from "next/link";
import { Plus, AlertTriangle, ExternalLink } from "lucide-react";
import { SafeImage } from "@/components/plants/plant-image";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlantSpeciesDetail } from "@/lib/knowledge/types";
import { PLANT_TYPE_LABELS } from "@/lib/knowledge/types";
import { SuitabilityScoreCard } from "@/components/climate/suitability-score-card";

export function PlantSpeciesDetailView({ plant }: { plant: PlantSpeciesDetail }) {
  const addHref = `/plants/new?speciesId=${encodeURIComponent(plant.id)}&name=${encodeURIComponent(plant.common_name)}`;
  const images = [plant.image_url, ...(plant.secondary_images ?? [])].filter(Boolean);

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

      <div className={images.length > 1 ? "grid sm:grid-cols-2 gap-3" : ""}>
        {images.slice(0, 2).map((src, i) => (
          <div
            key={src}
            className={`relative rounded-2xl overflow-hidden bg-green-50 ${
              i === 0 ? "h-56 sm:h-72 sm:col-span-2" : "h-40"
            }`}
          >
            <SafeImage
              src={src}
              alt={i === 0 ? plant.common_name : `${plant.common_name} ${i + 1}`}
              plantText={`${plant.common_name} ${plant.scientific_name} ${plant.type}`}
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge>{PLANT_TYPE_LABELS[plant.type]}</Badge>
        <Badge variant="info">{plant.family}</Badge>
        <Badge variant="outline">
          USDA Zone {plant.hardiness_zone_min}–{plant.hardiness_zone_max}
        </Badge>
        <Badge variant="outline">{plant.growth_rate} growth</Badge>
        <Badge variant="outline">{plant.maintenance_level} maintenance</Badge>
      </div>

      <SuitabilityScoreCard species={plant} />

      <Section title="About">
        <p className="text-gray-600 leading-relaxed">{plant.description}</p>
      </Section>

      <Section title="Quick facts">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard label="Scientific name" value={plant.scientific_name} />
          <InfoCard label="USDA zones" value={`${plant.hardiness_zone_min}–${plant.hardiness_zone_max}`} />
          <InfoCard label="Growth rate" value={plant.growth_rate} />
          <InfoCard label="Mature height" value={plant.mature_height} />
          <InfoCard label="Mature width" value={plant.mature_width} />
          <InfoCard label="Toxicity" value={plant.toxicity} />
        </div>
      </Section>

      <Section title="Growing requirements">
        <div className="grid sm:grid-cols-3 gap-4">
          <InfoCard label="Sun requirements" value={plant.sunlight} />
          <InfoCard label="Water requirements" value={plant.watering} />
          <InfoCard label="Soil preferences" value={plant.soil_preference} />
        </div>
      </Section>

      <div className="grid sm:grid-cols-2 gap-4">
        <Section title="Flowering">
          <p className="text-gray-600 leading-relaxed text-sm">{plant.flowering_info}</p>
        </Section>
        <Section title="Fruiting">
          <p className="text-gray-600 leading-relaxed text-sm">{plant.fruiting_info}</p>
        </Section>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Section title="Pollinator value">
          <p className="text-gray-600 leading-relaxed text-sm">{plant.pollinator_value}</p>
        </Section>
        <Section title="Companion plants">
          <p className="text-gray-600 leading-relaxed text-sm">{plant.companion_plants}</p>
        </Section>
      </div>

      {plant.soils.length > 0 && (
        <Section title="Recommended soils">
          <div className="grid sm:grid-cols-2 gap-3">
            {plant.soils.map((s) => (
              <Link key={s.id} href={`/database/soils/${s.id}`}>
                <Card padding="md" className="hover:shadow-md transition-shadow h-full">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{s.drainage} drainage · {s.water_retention}</p>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {plant.fertilizers.length > 0 && (
        <Section title="Fertilizer recommendations">
          <div className="space-y-2">
            {plant.fertilizers.map((f) => (
              <Link key={f.id} href={`/database/fertilizers/${f.id}`}>
                <Card padding="md" className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-medium text-gray-900 text-sm">{f.name}</span>
                      <span className="text-gray-400 text-sm"> · NPK {f.npk_ratio}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{f.application_frequency}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {plant.pests.length > 0 && (
        <Section title="Common pests">
          <div className="space-y-3">
            {plant.pests.map((p) => (
              <Link key={p.id} href={`/database/pests/${p.id}`}>
                <Card padding="md" className="hover:shadow-md transition-shadow text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <RiskBadge level={p.risk_level} />
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                  </div>
                  <p className="text-gray-500">{p.signs}</p>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {plant.diseases.length > 0 && (
        <Section title="Common diseases">
          <div className="space-y-3">
            {plant.diseases.map((d) => (
              <Card key={d.id} padding="md" className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{d.name}</span>
                  <RiskBadge level={d.risk_level} />
                </div>
                <p className="text-gray-500">{d.symptoms}</p>
                {d.treatment && (
                  <p className="text-xs text-green-700 mt-2">Treatment: {d.treatment}</p>
                )}
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
