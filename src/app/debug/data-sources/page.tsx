"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DataSourceRuntime } from "@/lib/data-sources/runtime";

interface DataSourcesPayload {
  ok: boolean;
  generatedAt: string;
  summary: Record<string, boolean | string>;
  cache: { size: number };
  sources: DataSourceRuntime[];
}

const LAYER_LABELS: Record<string, string> = {
  real_api: "Real API",
  supabase: "Supabase database",
  seed: "Internal seed data",
  mock: "Mock fallback",
};

function ConfigBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={
        configured
          ? "inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
          : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
      }
    >
      {configured ? "Configured" : "Not configured"}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
          : "inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
      }
    >
      {active ? "Active" : "Inactive / fallback"}
    </span>
  );
}

export default function DataSourcesDebugPage() {
  const [data, setData] = useState<DataSourcesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/debug/data-sources", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as DataSourcesPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/dashboard" className="text-sm text-green-700 hover:underline">
            ← Back to app
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Data source status</h1>
          <p className="mt-2 text-sm text-gray-600">
            Which integrations are configured, active, and what served the last request. Secret keys
            are never shown.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <Link
            href="/debug/supabase"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
          >
            Supabase debug
          </Link>
          <Link
            href="/settings/integrations"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
          >
            Integrations settings
          </Link>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {data && (
          <>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Runtime summary</h2>
              <p className="text-gray-500 mb-2">
                Generated {new Date(data.generatedAt).toLocaleString()} · Server cache entries:{" "}
                {data.cache.size}
              </p>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(data.summary).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-xs text-gray-500 uppercase tracking-wide">{key}</dt>
                    <dd className="font-medium text-gray-900 mt-1">
                      {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Feature data sources</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Source</th>
                      <th className="px-4 py-3 font-medium">Feature</th>
                      <th className="px-4 py-3 font-medium">Configured</th>
                      <th className="px-4 py-3 font-medium">Active</th>
                      <th className="px-4 py-3 font-medium">Last layer</th>
                      <th className="px-4 py-3 font-medium">Fallback</th>
                      <th className="px-4 py-3 font-medium">Last error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.sources.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs">{row.feature}</td>
                        <td className="px-4 py-3">
                          <ConfigBadge configured={row.configured} />
                        </td>
                        <td className="px-4 py-3">
                          <ActiveBadge active={row.active} />
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.lastSource ? LAYER_LABELS[row.lastSource] ?? row.lastSource : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {row.fallbackUsed ? (
                            <span className="text-amber-700 text-xs font-medium">Yes</span>
                          ) : (
                            <span className="text-gray-400 text-xs">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-red-600 max-w-[180px] truncate">
                          {row.lastError ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="px-5 py-3 text-xs text-gray-400 border-t border-gray-100">
                Last-used timestamps update after API routes run in this server instance. Restart dev
                server to reset runtime memory.
              </p>
            </section>
          </>
        )}

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <h2 className="font-semibold mb-2">Testing checklist</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>No keys: app uses mock fallbacks — run a plant search, weather, and price check.</li>
            <li>OpenAI only: AI features live; weather and prices stay mock.</li>
            <li>OpenWeather: visit /today for live weather badge.</li>
            <li>Perenual: plant search shows Perenual badge; import saves to Supabase.</li>
            <li>SerpAPI: price checker shows live shopping results.</li>
          </ul>
          <p className="mt-3">
            Full setup guide: <code className="font-mono text-xs">API_SETUP.md</code> in the repo root.
          </p>
        </section>
      </div>
    </div>
  );
}
