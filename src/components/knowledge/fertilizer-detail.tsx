import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Fertilizer } from "@/lib/knowledge/types";
import { FERTILIZER_TYPE_LABELS } from "@/lib/knowledge/types";

export function FertilizerDetailView({ fertilizer }: { fertilizer: Fertilizer }) {
  return (
    <div className="space-y-8 max-w-4xl">
      <Link
        href="/database/fertilizers"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to fertilizers
      </Link>

      <PageHeader title={fertilizer.name} description={fertilizer.description} />

      <div className="flex flex-wrap gap-2">
        <Badge>{FERTILIZER_TYPE_LABELS[fertilizer.type]}</Badge>
        <Badge variant="outline">NPK {fertilizer.npk_ratio}</Badge>
        <Badge variant="info">{fertilizer.season}</Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <InfoCard label="NPK ratio" value={fertilizer.npk_ratio} />
        <InfoCard label="Frequency" value={fertilizer.application_frequency} />
        <InfoCard label="Best plants" value={fertilizer.best_for} className="sm:col-span-2" />
      </div>

      <Section title="Usage">
        <p className="text-gray-600 leading-relaxed">{fertilizer.usage}</p>
      </Section>

      {fertilizer.warning_notes && (
        <Card padding="md" className="bg-amber-50 border-amber-100 text-sm text-amber-900">
          <p className="font-medium mb-1">Important</p>
          <p>{fertilizer.warning_notes}</p>
        </Card>
      )}
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
