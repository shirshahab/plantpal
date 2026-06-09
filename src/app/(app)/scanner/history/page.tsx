"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Leaf, ScanLine, Tag, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
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

export default function ScannerHistoryPage() {
  const { user, isMockMode } = useAuth();
  const { photos, refreshPhotos, ready } = usePhotos();
  const [reports, setReports] = useState<HealthReportSummary[]>([]);

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
  }, [user?.id, isMockMode, refreshPhotos]);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <PageHeader
        title="Scanner History"
        description="Past identifications, diagnoses, tags, and progress photos"
        action={<SyncStatusBadge />}
      />

      {!ready ? (
        <div className="h-32 animate-pulse bg-gray-100 rounded-2xl" />
      ) : scannerPhotos.length === 0 && reports.length === 0 ? (
        <EmptyState
          icon="📷"
          compact
          title="No scans yet"
          description="Scan a plant to identify it, diagnose yellow leaves, or read a nursery tag."
          actionLabel="Open Plant Camera"
          actionHref="/scanner"
        />
      ) : (
        <div className="space-y-3">
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
