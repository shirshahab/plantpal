"use client";

import { CheckCircle2, XCircle, MinusCircle, CloudOff, KeyRound, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IntegrationHealthCard, IntegrationStatus } from "@/lib/types/integrations";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  IntegrationStatus,
  { label: string; variant: "success" | "warning" | "outline" | "danger"; icon: React.ElementType }
> = {
  connected: { label: "Live data", variant: "success", icon: CheckCircle2 },
  missing_key: { label: "No key", variant: "warning", icon: KeyRound },
  error: { label: "Unreachable", variant: "danger", icon: WifiOff },
  mock_fallback: { label: "Fallback active", variant: "outline", icon: CloudOff },
};

function BoolRow({
  label,
  value,
  goodWhenTrue = true,
}: {
  label: string;
  value: boolean | null;
  goodWhenTrue?: boolean;
}) {
  if (value === null) {
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-400 flex items-center gap-1">
          <MinusCircle className="w-3 h-3" /> —
        </span>
      </div>
    );
  }
  const ok = goodWhenTrue ? value : !value;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span
        className={cn(
          "flex items-center gap-1 font-medium",
          ok ? "text-green-700" : "text-amber-700"
        )}
      >
        {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}

export function IntegrationHealthCardView({ item }: { item: IntegrationHealthCard }) {
  const config = STATUS_CONFIG[item.status];
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              item.usingLive ? "bg-green-50" : "bg-gray-50"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5",
                item.usingLive ? "text-green-600" : "text-gray-500"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-semibold text-gray-900">{item.name}</h2>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            {item.envVar && (
              <p className="text-[10px] font-mono text-gray-400 mt-1 truncate">{item.envVar}</p>
            )}
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.message}</p>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 space-y-1.5">
          <BoolRow label="Key configured" value={item.configured} />
          <BoolRow label="API reachable" value={item.reachable} />
          <BoolRow label="Using live data" value={item.usingLive} />
          <BoolRow label="Fallback active" value={item.fallbackActive} goodWhenTrue={false} />
        </div>

        {item.reachable === true && item.authOk === true && item.usingLive && (
          <p className="text-xs text-green-700 flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            Verified at {item.checkedAt ? new Date(item.checkedAt).toLocaleTimeString() : "just now"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function IntegrationHealthSummary({
  live,
  configured,
  total,
  fallback,
}: {
  live: number;
  configured: number;
  total: number;
  fallback: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <SummaryCell label="Integrations" value={String(total)} />
      <SummaryCell label="Keys set" value={String(configured)} accent="text-green-700" />
      <SummaryCell label="Live data" value={String(live)} accent="text-green-700" />
      <SummaryCell label="Fallbacks" value={String(fallback)} accent="text-amber-700" />
    </div>
  );
}

function SummaryCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className={cn("text-lg font-bold text-gray-900", accent)}>{value}</p>
    </div>
  );
}
