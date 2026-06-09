"use client";

import { PageHeader } from "@/components/page-header";
import { BillingDashboard } from "@/components/billing/billing-dashboard";

export default function BillingPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-4">
      <PageHeader
        title="Billing & usage"
        description="Your plan, monthly limits, and PlantPal Pro features."
      />
      <BillingDashboard />
    </div>
  );
}
