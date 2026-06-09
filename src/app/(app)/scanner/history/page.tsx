"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Leaf, ScanLine, Tag, TrendingUp, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { SyncStatusBadge } from "@/components/sync/sync-status-badge";
import { useAuth } from "@/lib/store/auth-provider";
import { usePhotos } from "@/lib/store/photos-provider";
import {
  canUseSupabase,
  getDb,
  getHealthReports,
  type HealthReportSummary,
} from "@/lib/db";
import { getScanHistory, getScanHistoryDisplayUrl, type ScanHistoryEntry } from "@/lib/scanner/scan-history";
import type { PhotoType } from "@/lib/types/ai";
import { formatDate } from "@/lib/utils";

const TYPE_LABELS: Record<PhotoType, string> = {
  profile: "Profile",
  health_scan: "Health scan",
  growth: "Progress photo",
  nursery_tag: "Nursery tag",
  identification: "Plant ID",
};

const TYPE_ICONS: Partial<Record<PhotoType, React.ElementType>> = {
  identification: Leaf,
  health_scan: ScanLine,
  nursery_tag: Tag,
  growth: TrendingUp,
};

const SOURCE_LABELS: Record<string, string> = {
  ai: "AI generated",
  mock: "Mock fallback",
};

export default function ScannerHistoryPage() {
  const { user, isMockMode } = useAuth();
  const { photos, refreshPhotos, ready } = usePhotos();
  const [reports, setReports] = useState<HealthReportSummary[]>([]);
  const [identifyHistory, setIdentifyHistory] = useState<ScanHistoryEntry[]>([]);

  const scannerPhotos = photos.filter((p) =>
    ["identification", "health_scan", "nursery_tag", "growth"].includes(p.photoType)
  );

  useEffect(() => {
    async function loadReports() {
      if (canUseSupabase(user?.id) && !isMockMode) {
        const data = await getHealthReports(getDb(), user.id, 30);
        setReports(data);
      }
    }
    loadReports();
    refreshPhotos();
    setIdentifyHistory(getScanHistory());
  }, [user?.id, isMockMode, refreshPhotos]);

  const hasContent =
    identifyHistory.length > 0 || scannerPhotos.length > 0 || reports.length > 0;

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <PageHeader
        title="Scanner History"
        description="Past identifications, diagnoses, tags, and progress photos"
        action={<SyncStatusBadge />}
      />

      {!ready ? (
        <div className="h-32 animate-pulse bg-gray-100 rounded-2xl" />
      ) : !hasContent ? (
        <EmptyState
          icon="📷"
          compact
          title="No scans yet"
          description="Scan a plant to identify it, diagnose yellow leaves, or read a nursery tag."
          actionLabel="Open Plant Camera"
          actionHref="/scanner"
        />
      ) : (
        <div className="space-y-6">
          {identifyHistory.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">Plant identifications</h2>
              {identifyHistory.map((entry) => {
                const displayUrl = getScanHistoryDisplayUrl(entry);
                return (
                <Card key={entry.id} padding="sm" className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {displayUrl ? (
                      <Image
                        src={displayUrl}
                        alt={entry.plantName}
                        fill
                        className="object-cover"
                        unoptimized={displayUrl.startsWith("data:")}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-50">
                        <Leaf className="w-6 h-6 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {entry.plantName}
                        </p>
                        <p className="text-xs text-gray-500 italic truncate">
                          {entry.scientificName}
                        </p>
                      </div>
                      {entry.addedToGarden && (
                        <Badge variant="success" className="shrink-0 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" />
                          In garden
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(entry.createdAt)}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {SOURCE_LABELS[entry.source] ?? entry.source}
                      </Badge>
                      {!entry.addedToGarden && (
                        <Link
                          href="/scanner"
                          className="text-[10px] text-green-600 hover:underline"
                        >
                          Scan again →
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
              })}
            </section>
          )}

          {scannerPhotos.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">Saved photos</h2>
              {scannerPhotos.map((photo) => {
                const Icon = TYPE_ICONS[photo.photoType] ?? Camera;
                return (
                  <Card key={photo.id} padding="sm" className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <Image
                        src={photo.photoUrl}
                        alt={photo.notes || "Scan"}
                        fill
                        className="object-cover"
                        unoptimized={photo.photoUrl.startsWith("data:")}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {TYPE_LABELS[photo.photoType]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(photo.createdAt)}</p>
                      {photo.notes && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{photo.notes}</p>
                      )}
                      {photo.plantId && (
                        <Link
                          href={`/plants/${photo.plantId}`}
                          className="text-xs text-green-600 mt-1 inline-block"
                        >
                          View plant →
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              })}
            </section>
          )}

          {reports.map((report) => (
            <Card key={report.id} padding="sm" className="flex gap-3">
              <div className="w-16 h-16 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <ScanLine className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Health diagnosis</p>
                <p className="text-xs text-gray-500">{formatDate(report.createdAt)}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{report.issue}</p>
                {report.plantId && (
                  <Link
                    href={`/plants/${report.plantId}`}
                    className="text-xs text-green-600 mt-1 inline-block"
                  >
                    View plant →
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
