"use client";

import Link from "next/link";
import { CheckCircle2, Sparkles, ListTodo, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function FirstPlantSuccess({ plantId }: { plantId: string }) {
  return (
    <Card padding="md" className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/80">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Your plant is now in PlantPal.
            </h2>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              Generate a care plan or jump to Today to see what to do next.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Link href={`/plants/${plantId}#ai-coach`}>
              <Button className="w-full touch-manipulation" size="sm">
                <Sparkles className="w-4 h-4" />
                Generate care plan
              </Button>
            </Link>
            <Link href="/today">
              <Button variant="secondary" className="w-full touch-manipulation" size="sm">
                <ListTodo className="w-4 h-4" />
                View Today tasks
              </Button>
            </Link>
            <Link href="/plants/new">
              <Button variant="outline" className="w-full touch-manipulation" size="sm">
                <Plus className="w-4 h-4" />
                Add another plant
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
