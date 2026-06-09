import Link from "next/link";
import { ChevronRight, FlaskConical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Fertilizer } from "@/lib/knowledge/types";
import { FERTILIZER_TYPE_LABELS } from "@/lib/knowledge/types";

export function FertilizerCard({ fertilizer }: { fertilizer: Fertilizer }) {
  return (
    <Link href={`/database/fertilizers/${fertilizer.id}`}>
      <Card
        padding="md"
        className="h-full hover:shadow-md transition-shadow group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5 text-green-600" />
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1 group-hover:text-green-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mt-3">{fertilizer.name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{fertilizer.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="default" className="text-[10px]">
            {FERTILIZER_TYPE_LABELS[fertilizer.type]}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            NPK {fertilizer.npk_ratio}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
