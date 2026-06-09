"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  EXPECTED_PROJECT_REF,
  getProjectRefFromUrl,
  getSupabasePublicConfig,
  isMockMode,
  maskAnonKey,
} from "@/lib/supabase/config";
import {
  runSupabaseDiagnostics,
  type SupabaseDiagnostics,
} from "@/lib/supabase/diagnostics";

interface ServerDiagnostics extends SupabaseDiagnostics {
  source: "server";
  expectedProjectRef: string;
  projectRefMatches: boolean;
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        ok
          ? "inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
          : "inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
      }
    >
      {ok ? "OK" : "FAIL"}
    </span>
  );
}

function DiagnosticsPanel({
  title,
  data,
}: {
  title: string;
  data: SupabaseDiagnostics & {
    expectedProjectRef?: string;
    projectRefMatches?: boolean;
    source?: string;
  };
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Supabase URL</dt>
          <dd className="text-right font-mono text-gray-900 break-all">{data.url || "(missing)"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Project ref</dt>
          <dd className="text-right font-mono">
            {data.projectRef ?? "(unknown)"}
            {data.projectRefMatches !== undefined && (
              <span className={data.projectRefMatches ? " text-green-700" : " text-red-700"}>
                {data.projectRefMatches ? " ✓ matches expected" : ` ✗ expected ${data.expectedProjectRef}`}
              </span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Anon key (preview)</dt>
          <dd className="text-right font-mono text-gray-700">{data.anonKeyPreview}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Mock mode</dt>
          <dd>{data.mockMode ? "Yes (localStorage)" : "No (Supabase)"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Auth session</dt>
          <dd>
            <StatusBadge ok={data.auth.hasSession} />
            {data.auth.hasSession ? (
              <span className="ml-2 text-gray-700">Logged in</span>
            ) : (
              <span className="ml-2 text-gray-700">Not logged in</span>
            )}
          </dd>
        </div>
        {data.auth.userId && (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">User ID</dt>
            <dd className="text-right font-mono text-xs break-all">{data.auth.userId}</dd>
          </div>
        )}
        {data.auth.email && (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Email</dt>
            <dd className="text-right">{data.auth.email}</dd>
          </div>
        )}
        {data.auth.authError && (
          <div>
            <dt className="text-gray-500 mb-1">Auth error</dt>
            <dd className="rounded-lg bg-red-50 p-3 font-mono text-xs text-red-700 whitespace-pre-wrap">
              {data.auth.authError}
            </dd>
          </div>
        )}
      </dl>

      <h3 className="mt-6 mb-3 text-sm font-semibold text-gray-900">Table probes</h3>
      <div className="space-y-3">
        {data.tables.length === 0 ? (
          <p className="text-sm text-gray-500">No table probes (mock mode or loading failed).</p>
        ) : (
          data.tables.map((probe) => (
            <div
              key={probe.table}
              className="rounded-xl border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-sm font-medium">{probe.table}</span>
                <StatusBadge ok={probe.ok} />
              </div>
              <p className="text-xs text-gray-600">
                HTTP {probe.status ?? "—"}
                {probe.rowCount !== null ? ` · ${probe.rowCount} row(s) visible` : ""}
              </p>
              {probe.error && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-red-50 p-2 text-xs text-red-800 whitespace-pre-wrap">
                  {[
                    probe.error.message,
                    probe.error.code ? `Code: ${probe.error.code}` : null,
                    probe.error.details ? `Details: ${probe.error.details}` : null,
                    probe.error.hint ? `Hint: ${probe.error.hint}` : null,
                  ]
                    .filter(Boolean)
                    .join("\n")}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default function SupabaseDebugPage() {
  const [clientData, setClientData] = useState<SupabaseDiagnostics | null>(null);
  const [serverData, setServerData] = useState<ServerDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runChecks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { url, key } = getSupabasePublicConfig();
      const projectRef = getProjectRefFromUrl(url);
      const mockMode = isMockMode();

      if (!mockMode) {
        const supabase = createClient();
        const clientDiagnostics = await runSupabaseDiagnostics(supabase, {
          url,
          anonKeyPreview: maskAnonKey(key),
          mockMode: false,
          projectRef,
        });
        setClientData(clientDiagnostics);
      } else {
        setClientData({
          url: url || "(missing)",
          projectRef,
          anonKeyPreview: maskAnonKey(key),
          mockMode: true,
          auth: {
            hasSession: false,
            userId: null,
            email: null,
            authError: "Mock mode — env vars missing or invalid",
          },
          tables: [],
        });
      }

      const res = await fetch("/api/debug/supabase", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Server probe failed: HTTP ${res.status}`);
      }
      setServerData((await res.json()) as ServerDiagnostics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/dashboard" className="text-sm text-green-700 hover:underline">
            ← Back to app
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Supabase debug</h1>
          <p className="mt-2 text-sm text-gray-600">
            Expected project: <code className="font-mono">{EXPECTED_PROJECT_REF}</code>.
            No secret keys are shown.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={runChecks}
            disabled={loading}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Running…" : "Re-run checks"}
          </button>
          <Link
            href="/login"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
          >
            Login page
          </Link>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 whitespace-pre-wrap">
            {error}
          </div>
        )}

        {serverData && (
          <DiagnosticsPanel
            title="Server probe (uses cookies + env at runtime)"
            data={{
              ...serverData,
              expectedProjectRef: serverData.expectedProjectRef,
              projectRefMatches: serverData.projectRefMatches,
            }}
          />
        )}

        {clientData && (
          <DiagnosticsPanel
            title="Browser probe (client bundle env + browser session)"
            data={{
              ...clientData,
              expectedProjectRef: EXPECTED_PROJECT_REF,
              projectRefMatches: clientData.projectRef === EXPECTED_PROJECT_REF,
            }}
          />
        )}

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <h2 className="font-semibold mb-2">How to read this</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              If table probes show <strong>OK</strong> but Add Plant still fails, log out and back in.
            </li>
            <li>
              If probes show <strong>PGRST205</strong>, restart <code>npm run dev</code> and hard-refresh.
            </li>
            <li>
              If project ref does not match, fix <code>.env.local</code> and restart the dev server.
            </li>
            <li>
              If not logged in, go to Login first — RLS requires an authenticated session to insert plants.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
