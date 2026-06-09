"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { compressImageFile } from "@/lib/scanner/compress-image";
import type { ScannerDebugReport } from "@/lib/scanner/scanner-debug";

function BoolBadge({ value, label }: { value: boolean; label: string }) {
  return (
    <span
      className={
        value
          ? "inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800"
          : "inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800"
      }
    >
      {label}: {value ? "Yes" : "No"}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="text-xs bg-gray-950 text-green-100 rounded-lg p-3 overflow-x-auto max-h-80 whitespace-pre-wrap break-all">
      {value == null ? "null" : JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function ScannerDebugPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ScannerDebugReport | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);

  const runDebug = useCallback(async (dataUrl: string) => {
    setLoading(true);
    setError(null);
    setReport(null);
    setFailureReason(null);

    try {
      const res = await fetch("/api/debug/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl, photoRoles: ["whole"] }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        report?: ScannerDebugReport;
        failureReason?: string | null;
        error?: string;
      };

      if (json.report) setReport(json.report);
      setFailureReason(json.failureReason ?? json.error ?? null);

      if (!res.ok && !json.report) {
        setError(json.error ?? `HTTP ${res.status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Debug request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  async function onFile(file: File) {
    try {
      const dataUrl = await compressImageFile(file);
      setPreview(dataUrl);
      await runDebug(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read image");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/scanner" className="text-sm text-green-700 hover:underline">
            ← Back to scanner
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Scanner debug</h1>
          <p className="text-sm text-gray-600 mt-1">
            Upload a photo to trace OpenAI and PlantNet requests. Errors are shown in full — nothing
            is hidden.
          </p>
        </div>

        <Section title="Submit test image">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={loading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
            className="block w-full text-sm"
          />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="max-h-48 rounded-lg border" />
          )}
          {loading && <p className="text-sm text-gray-500">Running live identification debug…</p>}
          {error && (
            <p className="text-sm text-red-700 font-medium bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}
        </Section>

        {report && (
          <>
            <Section title="API keys (server)">
              <div className="flex flex-wrap gap-2">
                <BoolBadge value={report.environment.openaiKeyDetected} label="OpenAI Key Detected" />
                <BoolBadge
                  value={report.environment.plantnetKeyDetected}
                  label="PlantNet Key Detected"
                />
              </div>
              <p className="text-xs text-gray-500">
                Env: {report.environment.nodeEnv}
                {report.environment.onVercel ? " · Vercel" : " · local"}
                {report.environment.openaiKeyPrefix &&
                  ` · OpenAI ${report.environment.openaiKeyPrefix}`}
                {report.environment.plantnetKeyPrefix &&
                  ` · PlantNet ${report.environment.plantnetKeyPrefix}`}
              </p>
              {report.environment.scannerDemoMode && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  SCANNER_DEMO_MODE is enabled — production scanner returns demo data, not live ID.
                </p>
              )}
            </Section>

            <Section title="Images">
              {report.images.map((img) => (
                <div key={img.index} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                  <p className="font-medium">
                    Image {img.index + 1}
                    {img.role ? ` (${img.role})` : ""}
                  </p>
                  <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                    <li>Count in payload: {report.payload.count}</li>
                    <li>Size: {img.estimatedBytes.toLocaleString()} bytes (~{img.dataUrlChars.toLocaleString()} data URL chars)</li>
                    <li>
                      Dimensions:{" "}
                      {img.width && img.height ? `${img.width}×${img.height}` : "unknown"}
                      {img.dimensionError ? ` — ${img.dimensionError}` : ""}
                    </li>
                    <li>MIME: {img.mime}</li>
                  </ul>
                </div>
              ))}
              <p className="text-xs text-gray-500">
                Total: {report.payload.totalFormatted} · App limit OK:{" "}
                {report.payload.withinAppLimit ? "yes" : "NO"} · Vercel body limit OK:{" "}
                {report.payload.withinVercelLimit ? "yes" : "NO"}
                {report.payload.validationError && (
                  <span className="text-red-600"> · {report.payload.validationError}</span>
                )}
              </p>
            </Section>

            <Section title="OpenAI request">
              <div className="flex flex-wrap gap-2 text-xs">
                <BoolBadge value={report.openai.sent} label="Sent" />
                <BoolBadge value={report.openai.success} label="Success" />
              </div>
              <p className="text-xs text-gray-500">Model: {report.openai.model}</p>
              {report.openai.durationMs != null && (
                <p className="text-xs text-gray-500">Duration: {report.openai.durationMs}ms</p>
              )}
              {report.openai.error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 font-mono whitespace-pre-wrap">
                  {report.openai.error}
                </p>
              )}
              <p className="text-xs font-semibold text-gray-700">Raw OpenAI response</p>
              <JsonBlock value={report.openai.rawResponse} />
            </Section>

            <Section title="PlantNet request">
              <div className="flex flex-wrap gap-2 text-xs">
                <BoolBadge value={report.plantnet.sent} label="Sent" />
                <BoolBadge value={report.plantnet.success} label="Success" />
              </div>
              {report.plantnet.httpStatus != null && (
                <p className="text-xs text-gray-500">HTTP status: {report.plantnet.httpStatus}</p>
              )}
              {report.plantnet.durationMs != null && (
                <p className="text-xs text-gray-500">Duration: {report.plantnet.durationMs}ms</p>
              )}
              {report.plantnet.error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 font-mono whitespace-pre-wrap">
                  {report.plantnet.error}
                </p>
              )}
              <p className="text-xs font-semibold text-gray-700">Raw PlantNet response</p>
              <JsonBlock value={report.plantnet.rawResponse} />
            </Section>

            <Section title="Final result">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>
                  <span className="text-gray-500">Success:</span>{" "}
                  {report.final.success ? "yes" : "no"}
                </p>
                <p>
                  <span className="text-gray-500">Source:</span> {report.final.source ?? "—"}
                </p>
                <p>
                  <span className="text-gray-500">Species:</span> {report.final.species ?? "—"}
                </p>
                <p>
                  <span className="text-gray-500">Common name:</span>{" "}
                  {report.final.commonName ?? "—"}
                </p>
                <p>
                  <span className="text-gray-500">Confidence:</span>{" "}
                  {report.final.confidence ?? "—"}
                </p>
              </div>
              {failureReason && (
                <p className="text-sm text-red-800 bg-red-50 border border-red-300 rounded-lg p-3 font-semibold">
                  Exact failure reason: {failureReason}
                </p>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
