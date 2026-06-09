"use client";

import Link from "next/link";
import { Plus, ScanLine } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/mobile/install-prompt";
import { FounderModeBadge } from "@/components/settings/founder-mode-badge";

export function DashboardEmptyState() {
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeader
        title="Dashboard"
        description="Your PlantPal command center"
        action={<FounderModeBadge />}
      />
      <InstallPrompt />
      <Card padding="lg" className="text-center border-green-100 bg-gradient-to-b from-green-50/80 to-white">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto text-3xl">
          🌱
        </div>
        <h2 className="text-xl font-bold text-gray-900 mt-4">Let&apos;s add your first plant.</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
          Your first plant unlocks daily tasks, garden health, and personalized care.
        </p>
        <div className="flex flex-col gap-3 mt-6">
          <Link href="/scanner">
            <Button size="lg" className="w-full touch-manipulation">
              <ScanLine className="w-4 h-4" />
              Scan Plant
            </Button>
          </Link>
          <Link href="/plants/new">
            <Button variant="secondary" size="lg" className="w-full touch-manipulation">
              <Plus className="w-4 h-4" />
              Add Plant Manually
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
