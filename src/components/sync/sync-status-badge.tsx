"use client";

import { Cloud, CloudOff, Loader2, HardDrive, AlertCircle } from "lucide-react";
import { useSync, type SyncStatus } from "@/lib/store/sync-provider";
import { cn } from "@/lib/utils";

const LABELS: Record<SyncStatus, string> = {
  synced: "Synced",
  offline: "Offline mode",
  pending: "Syncing…",
  failed: "Sync failed",
  local: "Local demo mode",
};

const ICONS: Record<SyncStatus, React.ElementType> = {
  synced: Cloud,
  offline: CloudOff,
  pending: Loader2,
  failed: AlertCircle,
  local: HardDrive,
};

export function SyncStatusBadge({ className }: { className?: string }) {
  const { status, lastError } = useSync();
  const Icon = ICONS[status];
  const spinning = status === "pending";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border",
        status === "synced" && "bg-green-50 text-green-700 border-green-100",
        status === "local" && "bg-gray-50 text-gray-600 border-gray-100",
        status === "offline" && "bg-amber-50 text-amber-700 border-amber-100",
        status === "pending" && "bg-blue-50 text-blue-700 border-blue-100",
        status === "failed" && "bg-red-50 text-red-700 border-red-100",
        className
      )}
      title={lastError ?? undefined}
    >
      <Icon className={cn("w-3.5 h-3.5", spinning && "animate-spin")} />
      {LABELS[status]}
    </div>
  );
}
