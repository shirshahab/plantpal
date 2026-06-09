"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  CloudOff,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchIntegrationsHealth } from "@/lib/integrations/client";
import type { IntegrationHealthCard, IntegrationStatus } from "@/lib/types/integrations";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  IntegrationStatus,
  { label: string; variant: "success" | "warning" | "outline" | "danger"; icon: React.ElementType }
> = {
  connected: { label: "Connected", variant: "success", icon: CheckCircle2 },
  missing_key: { label: "Missing API key", variant: "warning", icon: KeyRound },
  error: { label: "Error", variant: "danger", icon: AlertCircle },
  mock_fallback: { label: "Mock fallback active", variant: "outline", icon: CloudOff },
};

export default function IntegrationsSettingsPage() {
  const [cards, setCards] = useState<IntegrationHealthCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrationsHealth()
      .then(setCards)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Integrations"
        description="External data sources and API health — keys are never shown here."
        action={
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Settings
            </Button>
          </Link>
        }
      />

      {loading && (
        <p className="text-sm text-gray-500">Checking integration status…</p>
      )}

      <div className="grid gap-3">
        {cards.map((item) => {
          const config = STATUS_CONFIG[item.status];
          const Icon = config.icon;
          return (
            <Card key={item.id}>
              <CardContent className="flex items-start gap-4 py-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    item.status === "connected" ? "bg-green-50" : "bg-gray-50"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      item.status === "connected" ? "text-green-600" : "text-gray-500"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-900">{item.name}</h2>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{item.message}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="py-4 text-sm text-gray-600 space-y-2">
          <p className="font-medium text-gray-900">Environment variables</p>
          <p>
            Add keys to <code className="text-xs bg-gray-100 px-1 rounded">.env.local</code> and
            restart the dev server. See <code className="text-xs bg-gray-100 px-1 rounded">.env.local.example</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
