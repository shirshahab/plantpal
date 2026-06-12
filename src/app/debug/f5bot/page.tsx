"use client";

import { useCallback, useEffect, useState } from "react";
import type { F5BotDashboardStats, F5BotMentionRow } from "@/lib/intelligence/f5bot";

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`}
    />
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function RankList({
  title,
  items,
  labelKey,
}: {
  title: string;
  items: { label: string; count: number }[];
  labelKey: string;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No data yet. Run an import.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate pr-2">{item.label}</span>
              <span className="font-mono text-gray-500 shrink-0">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MentionList({ title, mentions }: { title: string; mentions: F5BotMentionRow[] }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">{title}</h2>
      {mentions.length === 0 ? (
        <p className="text-sm text-gray-400">None yet.</p>
      ) : (
        <ul className="space-y-3">
          {mentions.map((m) => (
            <li key={m.url} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-green-700 hover:underline line-clamp-2"
              >
                {m.title}
              </a>
              <p className="text-xs text-gray-500 mt-1">
                {[m.detected_category, m.detected_issue, m.detected_plant, m.subreddit ? `r/${m.subreddit}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {m.summary && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{m.summary}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function F5BotDebugPage() {
  const [stats, setStats] = useState<F5BotDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/debug/f5bot");
      if (!res.ok) throw new Error("Failed to load stats");
      const json = (await res.json()) as { stats: F5BotDashboardStats };
      setStats(json.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runImport() {
    setImporting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/debug/f5bot", { method: "POST" });
      const json = (await res.json()) as {
        ok: boolean;
        import?: { imported: number; skipped: number; total: number; error?: string };
        stats?: F5BotDashboardStats;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.import?.error ?? "Import failed");
      }
      setStats(json.stats ?? null);
      setMessage(
        `Imported ${json.import?.imported ?? 0} new mentions (${json.import?.skipped ?? 0} duplicates skipped).`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const topKeywords = stats?.topKeywords.map((k) => ({ label: k.keyword, count: k.count })) ?? [];
  const topIssues = stats?.topIssues.map((i) => ({ label: i.issue, count: i.count })) ?? [];
  const topPlants = stats?.topPlants.map((p) => ({ label: p.plant, count: p.count })) ?? [];
  const topCategories =
    stats?.topCategories.map((c) => ({ label: c.category, count: c.count })) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">F5Bot Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">
            Reddit mention pipeline for marketing intelligence. Dev only. Feed URLs stay server-side.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runImport()}
          disabled={importing}
          className="px-4 py-2 rounded-xl bg-green-700 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-50"
        >
          {importing ? "Importing…" : "Run import now"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      {loading && !stats ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : stats ? (
        <>
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
            <StatusDot ok={stats.feedConnected} />
            <span className="text-sm text-gray-700">
              Feed {stats.feedConfigured ? (stats.feedConnected ? "connected" : "configured but unreachable") : "not configured"}
            </span>
            {stats.lastImportAt && (
              <span className="text-xs text-gray-400 ml-auto">
                Last import: {new Date(stats.lastImportAt).toLocaleString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total mentions" value={stats.totalMentions} />
            <StatCard label="Today" value={stats.mentionsToday} />
            <StatCard label="Competitors" value={stats.competitorMentions.length} />
            <StatCard label="Content ops" value={stats.contentOpportunities.length} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <RankList title="Top keywords" items={topKeywords} labelKey="keyword" />
            <RankList title="Top mentioned problems" items={topIssues} labelKey="issue" />
            <RankList title="Top mentioned plants" items={topPlants} labelKey="plant" />
            <RankList title="Top categories" items={topCategories} labelKey="category" />
          </div>

          <section className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Fastest growing topics (7d vs prior 7d)</h2>
            {stats.fastestGrowingTopics.length === 0 ? (
              <p className="text-sm text-gray-400">Need more history for growth trends.</p>
            ) : (
              <ul className="space-y-2">
                {stats.fastestGrowingTopics.map((t) => (
                  <li key={t.topic} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{t.topic}</span>
                    <span className="text-green-700 font-medium">
                      +{t.growth}% ({t.recent} recent)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="grid md:grid-cols-2 gap-4">
            <MentionList title="Competitor mentions" mentions={stats.competitorMentions} />
            <MentionList title="Content opportunities" mentions={stats.contentOpportunities} />
          </div>

          <MentionList title="Latest 20 mentions" mentions={stats.latestMentions} />
        </>
      ) : null}
    </div>
  );
}
