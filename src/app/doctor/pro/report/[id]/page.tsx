"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import {
  getExpertReviewRequest,
  getHealthReport,
} from "@/lib/health/report-storage";
import { getFeedbackForReport } from "@/lib/health/feedback";
import { buildRecoveryTasks } from "@/lib/health/recovery-tasks";
import { CONFIDENCE_TIER_COPY } from "@/lib/health/evidence";
import {
  COMMERCIAL_DISCLAIMER,
  HEALTH_DISCLAIMER,
  PHOTO_SLOTS,
  type DiagnosisFeedback,
  type ProHealthReport,
} from "@/lib/types/health";
import type { ExpertReviewRequest } from "@/lib/health/report-storage";
import type { PlantTask } from "@/lib/types/tasks";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-green-700 border-b border-gray-200 pb-1.5 mb-3">
      {children}
    </h2>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
        {label}
      </p>
      <p className="text-sm text-gray-900 font-medium capitalize">
        {value.replace(/_/g, " ")}
      </p>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm text-gray-700">
          <span className="text-green-600 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function HealthReportExportPage() {
  const params = useParams<{ id: string }>();
  const [report, setReport] = useState<ProHealthReport | null>(null);
  const [feedback, setFeedback] = useState<DiagnosisFeedback | null>(null);
  const [expertRequest, setExpertRequest] = useState<ExpertReviewRequest | null>(null);
  const [recoveryTasks, setRecoveryTasks] = useState<PlantTask[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    const r = getHealthReport(id);
    setReport(r);
    if (r) {
      setFeedback(getFeedbackForReport(r.id));
      setExpertRequest(getExpertReviewRequest(r.id));
      setRecoveryTasks(buildRecoveryTasks([r], new Date()));
    }
    setLoaded(true);
  }, [params?.id]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading report…</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-gray-500">
          This report isn&apos;t available on this device.
        </p>
        <Link href="/doctor/pro" className="text-sm font-medium text-green-600">
          ← Back to Plant Doctor
        </Link>
      </div>
    );
  }

  const d = report.diagnosis;
  const tier = d.confidenceTier ?? (d.confidence >= 75 ? "high" : d.confidence >= 50 ? "medium" : "low");
  const photoEntries = PHOTO_SLOTS.filter(
    (slot) => report.photoThumbs?.[slot.id]
  );
  const evidence = (d.evidence ?? []).filter((e) => e.observed);

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/doctor/pro"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 touch-manipulation"
          >
            <Printer className="w-4 h-4" /> Save as PDF / Print
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 print:p-0">
        <div className="bg-white rounded-2xl shadow-sm print:shadow-none p-8 print:p-6 space-y-7">
          {/* Header */}
          <header className="flex items-start justify-between border-b-2 border-green-600 pb-4">
            <div>
              <p className="text-lg font-bold text-green-700">PlantPal</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">
                Plant Health Report
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {report.species} · {new Date(report.createdAt).toLocaleDateString(undefined, { dateStyle: "long" })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{d.confidence}%</p>
              <p className="text-xs text-gray-400">confidence</p>
              <p className="text-xs font-semibold text-gray-600 mt-1">
                {CONFIDENCE_TIER_COPY[tier].label}
              </p>
            </div>
          </header>

          {/* Diagnosis */}
          <section>
            <SectionTitle>Diagnosis</SectionTitle>
            <p className="text-xl font-bold text-gray-900">{d.likelyIssue}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <Fact label="Severity" value={d.severity} />
              <Fact label="Spread risk" value={d.spreadRisk} />
              <Fact label="Urgency" value={d.urgency} />
              <Fact label="Act within" value={d.actionWindow} />
            </div>
            <p className="text-sm text-gray-700 mt-3">{d.prognosisSummary}</p>
            {d.possibleCauses.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-semibold text-gray-900 mb-1">Possible causes</p>
                <BulletList items={d.possibleCauses} />
              </div>
            )}
          </section>

          {/* Evidence */}
          {(evidence.length > 0 || (d.visualNotes?.length ?? 0) > 0) && (
            <section>
              <SectionTitle>Evidence considered</SectionTitle>
              <BulletList
                items={[
                  ...evidence.map((e) => `${e.label}: ${e.detail}`),
                  ...(d.visualNotes ?? []).map((n) => `From photos: ${n}`),
                ]}
              />
            </section>
          )}

          {/* Photos */}
          {photoEntries.length > 0 && (
            <section>
              <SectionTitle>Photos</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                {photoEntries.map((slot) => (
                  <figure key={slot.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={report.photoThumbs![slot.id]!}
                      alt={slot.label}
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    />
                    <figcaption className="text-[11px] text-gray-500 mt-1 text-center">
                      {slot.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Remedy plan */}
          <section>
            <SectionTitle>Remedy Plan</SectionTitle>
            <div className="space-y-4">
              {[
                { title: "Immediate: today", items: report.remedyPlan.immediate },
                { title: "Next 72 hours", items: report.remedyPlan.next72Hours },
                { title: "7-day plan", items: report.remedyPlan.day7Plan },
                { title: "14-day plan", items: report.remedyPlan.day14Plan },
                { title: "Avoid", items: report.remedyPlan.avoid },
              ]
                .filter((s) => s.items.length > 0)
                .map((s) => (
                  <div key={s.title}>
                    <p className="text-sm font-semibold text-gray-900 mb-1">{s.title}</p>
                    <BulletList items={s.items} />
                  </div>
                ))}
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Escalation: </span>
                {report.remedyPlan.escalation}
              </p>
            </div>
          </section>

          {/* Prognosis */}
          <section>
            <SectionTitle>Prognosis</SectionTitle>
            <BulletList
              items={[
                `Expected recovery: ${report.prognosis.expectedRecoveryTime}`,
                report.prognosis.impactEstimate,
                `If untreated: ${report.prognosis.riskIfUntreated}`,
              ]}
            />
          </section>

          {/* Commercial assessment */}
          {report.commercialAssessment && (
            <section>
              <SectionTitle>Cultivation Room Assessment</SectionTitle>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Fact label="Room risk" value={report.commercialAssessment.roomRiskLevel} />
                <Fact
                  label="Canopy spread risk"
                  value={report.commercialAssessment.canopySpreadRisk}
                />
              </div>
              <p className="text-sm text-gray-700 mb-2">
                {report.commercialAssessment.operationalRecommendation}
              </p>
              <BulletList items={report.commercialAssessment.priorityActions} />
            </section>
          )}

          {/* Follow-up tasks */}
          {recoveryTasks.length > 0 && (
            <section>
              <SectionTitle>Follow-up Tasks (Recovery Plan)</SectionTitle>
              <BulletList
                items={recoveryTasks.map(
                  (t) => `${t.title}, due ${new Date(t.dueDate).toLocaleDateString()}`
                )}
              />
            </section>
          )}

          {/* Status */}
          <section>
            <SectionTitle>Status</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Fact label="Report status" value={report.status} />
              <Fact
                label="Expert review"
                value={
                  expertRequest
                    ? `Requested (${expertRequest.urgency} urgency)`
                    : "Not requested"
                }
              />
              <Fact
                label="Owner feedback"
                value={
                  feedback?.verdict
                    ? feedback.verdict === "correct"
                      ? "Diagnosis confirmed"
                      : "Marked incorrect"
                    : "None yet"
                }
              />
            </div>
          </section>

          {/* Disclaimers */}
          <footer className="border-t border-gray-200 pt-4 space-y-2">
            <p className="text-xs text-gray-500">{COMMERCIAL_DISCLAIMER}</p>
            <p className="text-xs text-gray-400">{HEALTH_DISCLAIMER}</p>
            <p className="text-[11px] text-gray-300">
              Report ID: {report.id} · Generated {new Date().toLocaleString()}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
