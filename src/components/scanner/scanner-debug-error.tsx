"use client";

import type { IdentifyDebugLog } from "@/lib/ai/identify-errors";
import Link from "next/link";

interface ScannerDebugErrorPanelProps {
  error: string;
  failureStep?: string | null;
  debug?: IdentifyDebugLog | null;
}

export function ScannerDebugErrorPanel({
  error,
  failureStep,
  debug,
}: ScannerDebugErrorPanelProps) {
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-2 text-sm">
      <p className="font-bold text-red-900">Scanner error (debug mode)</p>
      {failureStep && (
        <p>
          <span className="font-semibold text-red-800">Step:</span>{" "}
          <code className="text-xs bg-red-100 px-1 rounded">{failureStep}</code>
        </p>
      )}
      <p className="font-mono text-xs text-red-800 whitespace-pre-wrap break-all">{error}</p>
      {debug && (
        <pre className="text-[10px] bg-gray-950 text-green-100 rounded-lg p-2 overflow-x-auto max-h-40">
          {JSON.stringify(debug, null, 2)}
        </pre>
      )}
      <Link href="/debug/scanner" className="text-xs text-green-700 hover:underline inline-block">
        Open full scanner debug →
      </Link>
    </div>
  );
}
