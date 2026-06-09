"use client";

import Image from "next/image";
import { Share2, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { MOCK_GALLERY } from "@/lib/mock/gallery";
import { useEngagement } from "@/lib/store/engagement-provider";
import { usePlants } from "@/lib/store/plants-provider";

export default function GalleryPage() {
  const { growthEntries } = useEngagement();
  const { plants } = usePlants();

  const fromGrowth = growthEntries
    .filter((e, i, arr) => arr.findIndex((x) => x.plantId === e.plantId) === i)
    .slice(0, 2)
    .map((e, i) => {
      const plant = plants.find((p) => p.id === e.plantId);
      const later = growthEntries.find((x) => x.plantId === e.plantId && x.id !== e.id);
      if (!plant || !later) return null;
      return {
        id: `gen-${i}`,
        plantId: e.plantId,
        plantName: plant.name,
        beforeUrl: e.photoUrl,
        afterUrl: later.photoUrl,
        daysBetween: Math.ceil(
          (new Date(later.entryDate).getTime() - new Date(e.entryDate).getTime()) / 86400000
        ),
        note: later.note,
      };
    })
    .filter(Boolean);

  const items = [...(fromGrowth as typeof MOCK_GALLERY), ...MOCK_GALLERY];
  const hasUserGrowth = fromGrowth.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Before & After"
        description="Plant transformations worth sharing."
      />

      {!hasUserGrowth && plants.length === 0 ? (
        <EmptyState
          icon="📸"
          title="No progress photos yet"
          description="Take your first progress photo from the Plant Camera to track growth over time."
          actionLabel="Take Progress Photo"
          actionHref="/scanner"
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card key={item.id} padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{item.plantName}</p>
                <p className="text-xs text-green-600">{item.daysBetween} days apart</p>
              </div>
              <Button variant="ghost" size="sm" disabled title="Coming soon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-1">Before</p>
                <div className="relative h-32 rounded-xl overflow-hidden bg-green-50">
                  <Image src={item.beforeUrl} alt="Before" fill className="object-cover" sizes="200px" />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-1">After</p>
                <div className="relative h-32 rounded-xl overflow-hidden bg-green-50">
                  <Image src={item.afterUrl} alt="After" fill className="object-cover" sizes="200px" />
                </div>
              </div>
            </div>
            <div className="flex items-start gap-1 text-sm text-gray-600">
              <ArrowRight className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              {item.note}
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
