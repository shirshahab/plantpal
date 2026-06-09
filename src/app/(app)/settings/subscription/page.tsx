"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SubscriptionSettingsPanel } from "@/components/billing/subscription-settings-panel";
import { Button } from "@/components/ui/button";

export default function SubscriptionSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/settings">
        <Button variant="ghost" size="sm" className="-ml-2 touch-manipulation">
          <ChevronLeft className="w-4 h-4" />
          Settings
        </Button>
      </Link>
      <PageHeader
        title="Subscription"
        description="Your plan, usage, and feature access."
      />
      <SubscriptionSettingsPanel />
    </div>
  );
}
