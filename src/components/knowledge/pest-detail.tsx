import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import type { Pest } from "@/lib/knowledge/types";

export function PestDetailView({ pest }: { pest: Pest }) {
  return (
    <div className="space-y-8 max-w-4xl">
      <Link
        href="/database/pests"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to pests
      </Link>

      <PageHeader title={pest.name} description={pest.description} />

      <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-gray-100">
        <Image
          src={pest.image_url}
          alt={pest.name}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 896px"
        />
      </div>

      <Section title="Identification">
        <Card padding="md">
          <p className="text-sm font-medium text-gray-900 mb-1">Signs to look for</p>
          <p className="text-gray-600">{pest.signs}</p>
        </Card>
      </Section>

      <Section title="Affected plants">
        <p className="text-gray-600 leading-relaxed">{pest.affected_plants}</p>
      </Section>

      <div className="grid sm:grid-cols-2 gap-4">
        <Section title="Treatment">
          <Card padding="md" className="bg-green-50 border-green-100 h-full">
            <p className="text-sm text-gray-700">{pest.treatment}</p>
          </Card>
        </Section>
        <Section title="Prevention">
          <Card padding="md" className="bg-blue-50 border-blue-100 h-full">
            <p className="text-sm text-gray-700">{pest.prevention}</p>
          </Card>
        </Section>
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
