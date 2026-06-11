"use client";

import { useEffect, useState } from "react";

interface StorageDebugData {
  authUserPresent: boolean;
  profilePresent: boolean;
  counts: Record<string, number | null>;
  supabaseConfigured: boolean;
  serviceRoleConfigured: boolean;
  storageBucket: { ok: boolean; detail: string };
  localStorageKeysKnown: string[];
  missingIndexesWarning: string[];
}

function detectLocalKeys(): string[] {
  const found: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("plantpal-")) found.push(key);
    }
  } catch {
    /* ignore */
  }
  return found.sort();
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-900 w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-600 font-mono break-all">{value}</span>
    </div>
  );
}

export default function StorageDebugPage() {
  const [data, setData] = useState<StorageDebugData | null>(null);
  const [localKeys, setLocalKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalKeys(detectLocalKeys());
    fetch("/api/debug/storage")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((json) => setData(json as StorageDebugData))
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Storage Health Check</h1>
        <p className="text-sm text-gray-500 mt-1">
          Dev only. Verifies Supabase tables, bucket access, and localStorage keys.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <>
          <section className="bg-white rounded-2xl border border-gray-100 px-4 py-2">
            <Row label="Auth user" value={data.authUserPresent ? "present" : "missing"} />
            <Row label="Profile row" value={data.profilePresent ? "present" : "missing"} />
            <Row label="Supabase" value={data.supabaseConfigured ? "configured" : "mock/local"} />
            <Row label="Service role" value={data.serviceRoleConfigured ? "set" : "missing"} />
            <Row
              label="plant-photos bucket"
              value={`${data.storageBucket.ok ? "OK" : "FAIL"}: ${data.storageBucket.detail}`}
            />
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Cloud counts</h2>
            <div className="bg-white rounded-2xl border border-gray-100 px-4 py-2">
              {Object.entries(data.counts).map(([k, v]) => (
                <Row key={k} label={k} value={v === null ? "n/a (not signed in)" : String(v)} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              localStorage keys detected ({localKeys.length})
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
              {localKeys.length === 0 ? (
                <p className="text-sm text-gray-500">No plantpal-* keys in this browser.</p>
              ) : (
                <ul className="text-xs font-mono text-gray-700 space-y-1">
                  {localKeys.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Known keys: {data.localStorageKeysKnown.length} documented in dev-tools.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Warnings</h2>
            <ul className="text-sm text-amber-800 space-y-1">
              {data.missingIndexesWarning.map((w) => (
                <li key={w}>• {w}</li>
              ))}
              {!data.profilePresent && data.authUserPresent && (
                <li>• Profile row missing. Run repair on login or migration 028.</li>
              )}
              {localKeys.includes("plantpal-plants") && data.authUserPresent && (
                <li>• plantpal-plants still in localStorage while signed in. Migration may be pending.</li>
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
