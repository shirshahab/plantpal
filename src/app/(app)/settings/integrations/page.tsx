"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  fetchIntegrationsHealth,
  type IntegrationsHealthResponse,
} from "@/lib/integrations/client";
import {
  IntegrationHealthCardView,
  IntegrationHealthSummary,
} from "@/components/integrations/integration-health-card";

export default function IntegrationsSettingsPage() {
  const [health, setHealth] = useState<IntegrationsHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIntegrationsHealth();
      setHealth(data);
    } catch {
      setError("Could not load integration status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = health?.summary;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Integrations"
        description="Live API status — keys are never shown, only whether each service is configured and reachable."
        action={
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Settings
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Probing APIs…" : "Refresh status"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-sm text-red-800">{error}</CardContent>
        </Card>
      )}

      {loading && !health && (
        <p className="text-sm text-gray-500">Running live API probes (may take a few seconds)…</p>
      )}

      {summary && (
        <IntegrationHealthSummary
          total={summary.total}
          configured={summary.configured}
          live={summary.live}
          fallback={summary.fallback}
        />
      )}

      <div className="grid gap-3">
        {health?.cards.map((item) => (
          <IntegrationHealthCardView key={item.id} item={item} />
        ))}
      </div>

      <Card>
        <CardContent className="py-4 text-sm text-gray-600">
          <p>
            When a service is temporarily unavailable, PlantPal automatically falls back to
            its built-in plant library so the app keeps working.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
