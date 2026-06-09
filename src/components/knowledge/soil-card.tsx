import Link from "next/link";
import { ChevronRight, Droplets } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SoilType } from "@/lib/knowledge/types";

export function SoilCard({ soil }: { soil: SoilType }) {
  return (
    <Link href={`/database/soils/${soil.id}`}>
      <Card
        padding="md"
        className="h-full hover:shadow-md transition-shadow group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5 text-amber-700" />
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1 group-hover:text-green-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mt-3">{soil.name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{soil.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="outline" className="text-[10px]">
            {soil.drainage} drainage
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            pH {soil.ph_min}–{soil.ph_max}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
