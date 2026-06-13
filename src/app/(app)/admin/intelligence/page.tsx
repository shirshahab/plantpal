"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Sprout } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isFounderModeEnabled } from "@/lib/billing/beta-unlock";
import { isDevEnvironment } from "@/lib/dev/dev-tools";

interface IntelligenceResponse {
  ok: boolean;
  configured?: boolean;
  enabled?: boolean;
  feedConfigured?: boolean;
  error?: string;
  note?: string;
  totalMentions?: number;
  pulseLines?: string[];
  topTopics?: { label: string; count: number }[];
  topProblems?: { label: string; count: number }[];
  topPlants?: { label: string; count: number }[];
  contentIdeas?: { title: string; contentAngle: string; topic: string }[];
  latestMentions?: {
    id: string;
    title: string;
    url: string;
    source_type: string;
    topic: string | null;
    plant_type: string | null;
    problem_type: string | null;
    published_at: string | null;
    matched_keyword: string;
  }[];
}

function RankList({ title, items, empty }: { title: string; items: { label: string; count: number }[]; empty: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.map(({ label, count }) => (
              <li key={label} className="flex justify-between text-sm">
                <span className="text-gray-800 capitalize">{label}</span>
                <span className="font-medium text-emerald-700">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Internal trend intelligence — what the internet is doing to plants this week. */
export default function AdminIntelligencePage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [data, setData] = useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAllowed(isDevEnvironment() || isFounderModeEnabled());
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/intelligence");
      const json = (await res.json()) as IntelligenceResponse;
      if (!json.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load intelligence");
    } finally {
      setLoading(false);
    }
  }

  async function syncFeed() {
    setSyncing(true);
    setError("");
    try {
      const res = await fetch("/api/intelligence/f5bot/sync", {
        method: "POST",
        headers: { "x-f5bot-secret": prompt("F5Bot webhook secret:") ?? "" },
      });
      const json = (await res.json()) as { ok: boolean; error?: string; ingested?: number };
      if (!json.ok) throw new Error(json.error ?? "Sync failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
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

  return (
    <div className="max-w-5xl mx-auto pb-24 space-y-6">
      <PageHeader
        title="Plant Intelligence"
        description="What gardeners are yelling about online — translated for humans."
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={() => void syncFeed()} disabled={syncing}>
          Pull F5Bot feed
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {data?.note && <p className="text-sm text-amber-700">{data.note}</p>}

      {data?.pulseLines && data.pulseLines.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-4 space-y-1">
            {data.pulseLines.map((line) => (
              <p key={line} className="text-sm font-medium text-emerald-900">
                {line}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-gray-900">{data?.totalMentions ?? "—"}</p>
            <p className="text-xs text-gray-500">mentions tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-gray-900">
              {data?.enabled ? "F5Bot live" : "F5Bot off"}
            </p>
            <p className="text-xs text-gray-500">
              {data?.feedConfigured ? "Feed configured" : "No feed URL yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            <p className="text-sm text-gray-700">Your tiny plant lawyer is on duty.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <RankList
          title="Top topics"
          items={data?.topTopics ?? []}
          empty="No topics yet. Sync the feed or wait for webhooks."
        />
        <RankList
          title="Top plant problems"
          items={data?.topProblems ?? []}
          empty="No problems classified yet."
        />
        <RankList
          title="Plants in the news"
          items={data?.topPlants ?? []}
          empty="No plant names spotted yet."
        />
      </div>

      {data?.contentIdeas && data.contentIdeas.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Content angles worth writing</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.contentIdeas.map((idea) => (
              <div key={idea.topic} className="border-b border-gray-100 pb-3 last:border-0">
                <p className="font-medium text-gray-900">{idea.title}</p>
                <p className="text-sm text-gray-600 mt-1">{idea.contentAngle}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Latest mentions</h2>
        </CardHeader>
        <CardContent>
          {(data?.latestMentions ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">Nothing ingested yet. Hit sync or configure the webhook.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data?.latestMentions?.map((m) => (
                <li key={m.id} className="py-3 first:pt-0">
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-emerald-800 hover:underline inline-flex items-center gap-1"
                  >
                    {m.title}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-xs text-gray-500 mt-1">
                    {m.source_type}
                    {m.plant_type ? ` · ${m.plant_type}` : ""}
                    {m.topic ? ` · ${m.topic}` : ""}
                    {m.problem_type ? ` · ${m.problem_type}` : ""}
                    {m.published_at ? ` · ${new Date(m.published_at).toLocaleDateString()}` : ""}
                  </p>
                  {m.matched_keyword && (
                    <p className="text-xs text-gray-400 mt-0.5">Keyword: {m.matched_keyword}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
