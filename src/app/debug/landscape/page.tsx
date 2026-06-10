"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadLandscapeProjects, fetchRemoteLandscapeProjects } from "@/lib/landscape/storage";

interface DebugRecord {
  ok?: boolean;
  payloadKb?: number;
  source?: string;
  error?: string;
  savedLocal?: boolean;
  savedRemote?: boolean;
  at?: string;
}

export default function LandscapeDebugPage() {
  const [record, setRecord] = useState<DebugRecord | null>(null);
  const [localCount, setLocalCount] = useState(0);
  const [remoteCount, setRemoteCount] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("plantpal-landscape-debug");
      if (raw) setRecord(JSON.parse(raw) as DebugRecord);
    } catch {
      /* ignore */
    }
    setLocalCount(loadLandscapeProjects().length);
    void fetchRemoteLandscapeProjects().then((p) => setRemoteCount(p.length));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Garden Designer debug</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last generation attempt + saved project counts.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 text-sm">
          <Row label="Local saved projects" value={String(localCount)} />
          <Row
            label="Remote saved projects"
            value={remoteCount === null ? "loading…" : String(remoteCount)}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 text-sm">
          <p className="font-semibold text-gray-900">Last generation</p>
          {!record ? (
            <p className="text-gray-500">No generation attempts recorded on this device yet.</p>
          ) : (
            <>
              <Row label="When" value={record.at ?? "—"} />
              <Row label="Result" value={record.ok ? "success" : "failed"} />
              <Row label="Payload size" value={record.payloadKb ? `${record.payloadKb} KB` : "—"} />
              <Row label="Source" value={record.source ?? "—"} />
              <Row label="Saved locally" value={String(record.savedLocal ?? "—")} />
              <Row label="Saved to cloud" value={String(record.savedRemote ?? "—")} />
              {record.error && (
                <p className="text-red-600 bg-red-50 rounded-lg px-3 py-2">{record.error}</p>
              )}
            </>
          )}
        </div>

        <Link href="/landscape" className="text-sm text-green-700 font-medium underline">
          Open Garden Designer →
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right break-all">{value}</span>
    </div>
  );
}
