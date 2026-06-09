"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SetupCheckItem, SetupCheckReport, SetupStatus } from "@/lib/setup/types";
import { cn } from "@/lib/utils";
import { PlantPalLogo } from "@/components/brand/plantpal-logo";
import {
  IntegrationHealthCardView,
  IntegrationHealthSummary,
} from "@/components/integrations/integration-health-card";

const STATUS_ICON: Record<SetupStatus, React.ElementType> = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
  skip: MinusCircle,
};

const STATUS_STYLE: Record<SetupStatus, string> = {
  ok: "text-green-600 bg-green-50",
  warn: "text-amber-600 bg-amber-50",
  fail: "text-red-600 bg-red-50",
  skip: "text-gray-400 bg-gray-50",
};

const STATUS_LABEL: Record<SetupStatus, string> = {
  ok: "OK",
  warn: "Optional / mock",
  fail: "Needs fix",
  skip: "Skipped",
};

function CheckRow({ check }: { check: SetupCheckItem }) {
  const Icon = STATUS_ICON[check.status];
  return (
    <Card padding="sm" className="border-gray-100">
      <div className="flex items-start gap-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", STATUS_STYLE[check.status])}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-medium text-gray-900 text-sm">{check.label}</p>
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", STATUS_STYLE[check.status])}>
              {STATUS_LABEL[check.status]}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{check.message}</p>
          {check.fix && (
            <p className="text-xs text-green-800 mt-2 bg-green-50 rounded-lg px-2 py-1.5 leading-relaxed">
              Fix: {check.fix}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function SetupPage() {
  const [report, setReport] = useState<SetupCheckReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/check", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data?: SetupCheckReport; error?: string };
      if (!json.ok || !json.data) throw new Error(json.error ?? "Check failed");
      setReport(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Setup check failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8faf8]">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-700">
            <ArrowLeft className="w-4 h-4" />
            Back to app
          </Link>
          <div className="flex items-center gap-2">
            <PlantPalLogo showWordmark={false} size="sm" />
            <span className="font-heading font-semibold text-brand-text">Setup</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Setup checker</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Verifies Supabase, auth, tables, storage, and server API keys. Secrets are never shown.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={runCheck} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {loading ? "Checking…" : report ? "Re-run checks" : "Run checks"}
          </Button>
          <Link href="/debug/data-sources">
            <Button variant="outline" size="sm">Data sources debug</Button>
          </Link>
          <Link href="/settings/integrations">
            <Button variant="outline" size="sm">Integrations</Button>
          </Link>
          <Link href="/qa">
            <Button variant="outline" size="sm">QA checklist</Button>
          </Link>
        </div>

        {!report && !loading && !error && (
          <Card padding="md" className="text-center text-sm text-gray-600">
            Tap <strong>Run checks</strong> to verify your environment.
          </Card>
        )}

        {error && (
          <Card padding="md" className="border-red-200 bg-red-50 text-sm text-red-800">
            {error}
          </Card>
        )}

        {report && (
          <>
            <Card padding="md" className={cn(
              "border",
              report.overall === "ok" && "border-green-200 bg-green-50/50",
              report.overall === "warn" && "border-amber-200 bg-amber-50/50",
              report.overall === "fail" && "border-red-200 bg-red-50/50"
            )}>
              <CardContent className="py-0">
                <p className="font-semibold text-gray-900">
                  Overall: {report.overall === "ok" ? "Ready to test" : report.overall === "warn" ? "Works with mock fallbacks" : "Fix required items"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Mode: {report.mode === "mock" ? "Local mock (browser storage)" : "Supabase cloud"}
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {report.checks.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </div>

            {report.integrations && report.integrations.length > 0 && (
              <section className="space-y-3 pt-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">API integrations</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Live probes — configured, reachable, live data vs fallback.
                  </p>
                </div>
                {report.integrationSummary && (
                  <IntegrationHealthSummary
                    total={report.integrations.length}
                    configured={report.integrationSummary.configured}
                    live={report.integrationSummary.live}
                    fallback={report.integrationSummary.fallback}
                  />
                )}
                <div className="grid gap-3">
                  {report.integrations.map((item) => (
                    <IntegrationHealthCardView key={item.id} item={item} />
                  ))}
                </div>
                <Link href="/settings/integrations">
                  <Button variant="outline" size="sm" className="w-full">
                    Open integrations settings
                  </Button>
                </Link>
              </section>
            )}
          </>
        )}

        <Card padding="md" className="text-sm text-gray-600 space-y-2">
          <p className="font-medium text-gray-900">First-time Supabase setup</p>
          <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
            <li>Copy <code className="bg-gray-100 px-1 rounded">.env.local.example</code> → <code className="bg-gray-100 px-1 rounded">.env.local</code></li>
            <li>Paste Supabase URL + anon key from Settings → API</li>
            <li>Run <code className="bg-gray-100 px-1 rounded">supabase/FIX_RUN_THIS.sql</code> in SQL Editor</li>
            <li>Restart <code className="bg-gray-100 px-1 rounded">npm run dev</code></li>
            <li>Sign up at <Link href="/login" className="text-green-600 underline">/login</Link> and re-run this page</li>
          </ol>
        </Card>
      </main>
    </div>
  );
}
