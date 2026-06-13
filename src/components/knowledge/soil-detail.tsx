import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SoilType } from "@/lib/knowledge/types";

export function SoilDetailView({ soil }: { soil: SoilType }) {
  return (
    <div className="space-y-8 max-w-4xl">
      <Link
        href="/database/soils"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to soils
      </Link>

      <PageHeader title={soil.name} description={soil.description} />

      <div className="flex flex-wrap gap-2">
        <Badge variant="info">{soil.texture}</Badge>
        <Badge variant="outline">pH {soil.ph_min} to {soil.ph_max}</Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <InfoCard label="Drainage" value={soil.drainage} />
        <InfoCard label="Water retention" value={soil.water_retention} />
        <InfoCard label="Best plants" value={soil.best_for} className="sm:col-span-2" />
      </div>

      <Section title="Pros">
        <p className="text-gray-600 leading-relaxed">{soil.pros}</p>
      </Section>

      <Section title="Cons">
        <p className="text-gray-600 leading-relaxed">{soil.cons}</p>
      </Section>

      <Section title="Amendments">
        <Card padding="md" className="text-sm text-gray-600">
          {soil.amendments}
        </Card>
      </Section>
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

function InfoCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Card padding="md" className={className}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-800">{value}</p>
    </Card>
  );
}
