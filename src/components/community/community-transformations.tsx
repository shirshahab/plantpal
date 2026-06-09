import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { GalleryItem } from "@/lib/types/phase6";

export function CommunityTransformations({
  items,
}: {
  items: GalleryItem[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.id} padding="md" className="space-y-3">
          <div>
            <p className="font-semibold text-gray-900">{item.plantName}</p>
            <p className="text-xs text-green-600">{item.daysBetween} days apart</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-gray-400 uppercase mb-1">Before</p>
              <div className="relative h-28 sm:h-32 rounded-xl overflow-hidden bg-green-50">
                <Image
                  src={item.beforeUrl}
                  alt="Before"
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase mb-1">After</p>
              <div className="relative h-28 sm:h-32 rounded-xl overflow-hidden bg-green-50">
                <Image
                  src={item.afterUrl}
                  alt="After"
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{item.note}</p>
          <div className="flex items-center gap-1 text-xs text-gray-300 pt-1">
            <ArrowRight className="w-3 h-3" />
            Full story coming soon
          </div>
        </Card>
      ))}
    </div>
  );
}
