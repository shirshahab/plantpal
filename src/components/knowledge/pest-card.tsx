import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Pest } from "@/lib/knowledge/types";

export function PestCard({ pest }: { pest: Pest }) {
  return (
    <Link href={`/database/pests/${pest.id}`}>
      <Card
        padding="none"
        className="overflow-hidden h-full hover:shadow-md transition-shadow group"
      >
        <div className="relative h-32 bg-gray-100">
          <Image
            src={pest.image_url}
            alt={pest.name}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900">{pest.name}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pest.signs}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1 group-hover:text-green-600" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
