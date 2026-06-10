"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, Bell, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isFounderModeEnabled } from "@/lib/billing/beta-unlock";
import { isDevEnvironment } from "@/lib/dev/dev-tools";

interface AnalyticsResponse {
  ok: boolean;
  configured?: boolean;
  note?: string;
  error?: string;
  windowDays?: number;
  sampleSize?: number;
  totals?: Record<string, number>;
  funnel?: {
    signups: number;
    onboardingComplete: number;
    firstPlant: number;
    firstScan: number;
    firstLesson: number;
  };
  dailySessions?: { day: string; sessions: number }[];
  notifications?: { sent: number; opened: number; remindersCompleted: number };
}

const FUNNEL_STEPS: { key: keyof NonNullable<AnalyticsResponse["funnel"]>; label: string }[] = [
  { key: "signups", label: "Signed up" },
  { key: "onboardingComplete", label: "Completed onboarding" },
  { key: "firstPlant", label: "Added a plant" },
  { key: "firstScan", label: "Ran a scan" },
  { key: "firstLesson", label: "Completed a lesson" },
];

/** Founder-only growth dashboard: funnel, retention proxy, notifications. */
export default function AdminAnalyticsPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAllowed(isDevEnvironment() || isFounderModeEnabled());
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/analytics");
      const json = (await res.json()) as AnalyticsResponse;
      if (!json.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (allowed) void load();
  }, [allowed]);

  if (allowed === null) return null;
  if (!allowed) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-gray-500">
        This page isn&apos;t available.
      </div>
    );
  }

  const maxSessions = Math.max(1, ...(data?.dailySessions?.map((d) => d.sessions) ?? [1]));
  const funnelMax = Math.max(1, data?.funnel?.signups ?? 1);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Growth Analytics"
        description={`Last ${data?.windowDays ?? 30} days · founder view`}
        action={
          <Button variant="outline" size="sm" onClick={() => void load()} loading={loading}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      />

      {error && (
        <Card>
          <CardContent className="py-6 text-center space-y-3">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {data && data.configured === false && (
        <Card>
          <CardContent className="py-6 text-sm text-gray-600">
            {data.note ??
              "Connect Supabase and set SUPABASE_SERVICE_ROLE_KEY to see live analytics."}
          </CardContent>
        </Card>
      )}

      {data?.funnel && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Activation funnel</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {FUNNEL_STEPS.map((step) => {
              const value = data.funnel?.[step.key] ?? 0;
              return (
                <div key={step.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{step.label}</span>
                    <span className="font-semibold text-gray-900">{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${Math.round((value / funnelMax) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {data?.dailySessions && data.dailySessions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Daily sessions (return visits)</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-28">
              {data.dailySessions.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{d.sessions}</span>
                  <div
                    className="w-full rounded-t bg-green-400"
                    style={{ height: `${Math.max(4, (d.sessions / maxSessions) * 88)}px` }}
                  />
                  <span className="text-[9px] text-gray-400">{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data?.notifications && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Notification engagement</h2>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Sent", value: data.notifications.sent },
              { label: "Opened", value: data.notifications.opened },
              { label: "Reminders done", value: data.notifications.remindersCompleted },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-gray-50 py-3">
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data?.totals && Object.keys(data.totals).length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">All events ({data.sampleSize})</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {Object.entries(data.totals)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([name, count]) => (
                  <div key={name} className="flex justify-between text-sm">
                    <span className="text-gray-600 font-mono text-xs">{name}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
