"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileDown,
  HeartPulse,
  Microscope,
  ShieldAlert,
  Sprout,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/store/auth-provider";
import { useToast } from "@/lib/store/toast-provider";
import {
  hasExpertReviewRequest,
  saveExpertReviewRequest,
  updateHealthReportStatus,
} from "@/lib/health/report-storage";
import {
  getFeedbackForReport,
  saveDiagnosisFeedback,
} from "@/lib/health/feedback";
import { CONFIDENCE_TIER_COPY } from "@/lib/health/evidence";
import {
  COMMERCIAL_DISCLAIMER,
  DIAGNOSIS_BASIS_NOTE,
  HEALTH_DISCLAIMER,
  type DiagnosisFeedback,
  type FeedbackOutcome,
  type FeedbackVerdict,
  type HealthReportStatus,
  type ProHealthReport,
} from "@/lib/types/health";

const SEVERITY_STYLES: Record<string, string> = {
  mild: "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  severe: "bg-red-100 text-red-700",
};

const RISK_STYLES: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const URGENCY_LABELS: Record<string, string> = {
  monitor: "Monitor",
  act_soon: "Act soon",
  urgent: "Urgent",
};

const TIER_STYLES: Record<string, string> = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-orange-100 text-orange-800 border-orange-200",
  needs_photos: "bg-gray-100 text-gray-700 border-gray-200",
};

function Pill({ label, value, styles }: { label: string; value: string; styles?: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
        {label}
      </span>
      <span
        className={cn(
          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
          styles ?? "bg-gray-100 text-gray-700"
        )}
      >
        {value.replace(/_/g, " ")}
      </span>
    </div>
  );
}

function PlanList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-gray-600">
            <span className="text-green-600 mt-0.5 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProReportView({
  report,
  onStatusChange,
}: {
  report: ProHealthReport;
  onStatusChange?: (status: HealthReportStatus) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expertOpen, setExpertOpen] = useState(false);
  const [expertUrgency, setExpertUrgency] = useState<"low" | "medium" | "high">(
    report.diagnosis.severity === "severe" ? "high" : "medium"
  );
  const [expertNotes, setExpertNotes] = useState("");
  const [expertRequested, setExpertRequested] = useState(() =>
    hasExpertReviewRequest(report.id)
  );
  const [feedback, setFeedback] = useState<DiagnosisFeedback | null>(() =>
    getFeedbackForReport(report.id)
  );

  const d = report.diagnosis;
  const tier = d.confidenceTier ?? (d.confidence >= 75 ? "high" : d.confidence >= 50 ? "medium" : "low");
  const tierCopy = CONFIDENCE_TIER_COPY[tier];
  const evidence = d.evidence ?? [];
  const showCommercialDisclaimer =
    d.severity === "severe" || report.commercialContext?.enabled;

  function submitExpertRequest() {
    saveExpertReviewRequest(
      {
        healthReportId: report.id,
        plantId: report.plantId,
        urgency: expertUrgency,
        notes: expertNotes.trim(),
      },
      user?.id
    );
    setExpertRequested(true);
    setExpertOpen(false);
    toast("Expert review requested — you're on the list.");
  }

  function setStatus(status: HealthReportStatus) {
    updateHealthReportStatus(report.id, status, user?.id);
    onStatusChange?.(status);
    toast(
      status === "resolved"
        ? "Marked resolved — great work."
        : "Report updated."
    );
  }

  function giveVerdict(verdict: FeedbackVerdict) {
    const entry = saveDiagnosisFeedback(report.id, d.issueId, { verdict }, user?.id);
    setFeedback({ ...entry });
    toast(
      verdict === "correct"
        ? "Thanks — this helps PlantPal get more accurate."
        : "Noted — future diagnoses for this issue will be more cautious."
    );
  }

  function giveOutcome(outcome: FeedbackOutcome) {
    const entry = saveDiagnosisFeedback(report.id, d.issueId, { outcome }, user?.id);
    setFeedback({ ...entry });
    if (outcome === "improved") {
      updateHealthReportStatus(report.id, "improved", user?.id);
      onStatusChange?.("improved");
      toast("Great news — marked as improving.");
    } else {
      updateHealthReportStatus(report.id, "escalated", user?.id);
      onStatusChange?.("escalated");
      toast("Sorry to hear it — consider requesting an expert review below.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Diagnosis summary */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              Likely issue
            </p>
            <h2 className="text-xl font-bold text-gray-900 mt-0.5">{d.likelyIssue}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {report.species} · {report.growthStage} · {report.locationType}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-gray-900">{d.confidence}%</p>
            <p className="text-xs text-gray-400">confidence</p>
          </div>
        </div>

        <div className={cn("rounded-xl border p-3", TIER_STYLES[tier])}>
          <p className="text-sm font-semibold">{tierCopy.label}</p>
          <p className="text-xs mt-0.5 opacity-90">{tierCopy.description}</p>
          {d.calibrationNote && (
            <p className="text-xs mt-1.5 opacity-90">{d.calibrationNote}</p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Pill label="Severity" value={d.severity} styles={SEVERITY_STYLES[d.severity]} />
          <Pill label="Spread risk" value={d.spreadRisk} styles={RISK_STYLES[d.spreadRisk]} />
          <Pill
            label="Urgency"
            value={URGENCY_LABELS[d.urgency] ?? d.urgency}
            styles={d.urgency === "urgent" ? RISK_STYLES.high : undefined}
          />
          <Pill label="Act within" value={d.actionWindow} />
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-sm text-gray-600">{d.prognosisSummary}</p>
        </div>

        {d.possibleCauses.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1.5">
              Top possible causes
            </h4>
            <ol className="space-y-1.5">
              {d.possibleCauses.map((cause, i) => (
                <li key={cause} className="flex gap-2 text-sm text-gray-600">
                  <span className="font-semibold text-gray-400 shrink-0">{i + 1}.</span>
                  <span>{cause}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="text-xs text-gray-400">{DIAGNOSIS_BASIS_NOTE}</p>
      </Card>

      {/* Disclaimer layer — severe issues and commercial operations */}
      {showCommercialDisclaimer && (
        <Card padding="md" className="bg-amber-50 border-amber-200">
          <p className="text-sm font-medium text-amber-900 flex gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            {COMMERCIAL_DISCLAIMER}
          </p>
        </Card>
      )}

      {/* Export */}
      <Link href={`/doctor/pro/report/${report.id}`} className="block">
        <Button variant="secondary" className="w-full touch-manipulation">
          <FileDown className="w-4 h-4" /> Export Health Report (PDF)
        </Button>
      </Link>

      {/* Evidence checklist */}
      {evidence.length > 0 && (
        <Card padding="md" className="space-y-3">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Microscope className="w-4 h-4 text-teal-600" /> Why PlantPal thinks this
          </h3>
          <ul className="space-y-2">
            {evidence.map((item) => (
              <li key={item.category} className="flex gap-2.5">
                {item.observed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      item.observed ? "text-gray-900" : "text-gray-400"
                    )}
                  >
                    {item.label}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-0.5",
                      item.observed ? "text-gray-500" : "text-gray-400"
                    )}
                  >
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {(d.visualNotes?.length ?? 0) > 0 && (
            <div className="rounded-xl bg-teal-50 border border-teal-100 p-3">
              <p className="text-xs font-semibold text-teal-800 mb-1">From your photos</p>
              <ul className="space-y-1">
                {d.visualNotes.map((note) => (
                  <li key={note} className="text-xs text-teal-700">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Second opinion */}
      {report.secondOpinion && (
        <Card padding="md" className="space-y-3">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-sky-600" /> Second opinion
          </h3>
          <ul className="space-y-2">
            {report.secondOpinion.sources.map((source) => (
              <li key={source.source} className="flex gap-2.5 items-start">
                {source.agreesWithPrimary === null ? (
                  <Circle className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                ) : source.agreesWithPrimary ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{source.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{source.finding}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 rounded-xl bg-gray-50 p-3">
            {report.secondOpinion.note}
          </p>
        </Card>
      )}

      {/* Prognosis */}
      <Card padding="md" className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-rose-500" /> Prognosis
        </h3>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-gray-700">Expected recovery</dt>
            <dd className="text-gray-600">{report.prognosis.expectedRecoveryTime}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Possible impact</dt>
            <dd className="text-gray-600">{report.prognosis.impactEstimate}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">If untreated</dt>
            <dd className="text-gray-600">{report.prognosis.riskIfUntreated}</dd>
          </div>
        </dl>
      </Card>

      {/* Commercial assessment */}
      {report.commercialAssessment && (
        <Card padding="md" className="space-y-3 border-indigo-100 bg-indigo-50/40">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-600" /> Cultivation Room Assessment
          </h3>
          <div className="flex gap-4">
            <Pill
              label="Room risk"
              value={report.commercialAssessment.roomRiskLevel}
              styles={RISK_STYLES[report.commercialAssessment.roomRiskLevel]}
            />
            <Pill
              label="Canopy spread"
              value={report.commercialAssessment.canopySpreadRisk}
              styles={RISK_STYLES[report.commercialAssessment.canopySpreadRisk]}
            />
          </div>
          <p className="text-sm text-gray-600">
            {report.commercialAssessment.operationalRecommendation}
          </p>
          <p className="text-sm text-gray-600">
            {report.commercialAssessment.estimatedImpactRange}
          </p>
          <PlanList
            title="Priority actions"
            items={report.commercialAssessment.priorityActions}
          />
        </Card>
      )}

      {/* Remedy plan */}
      <Card padding="md" className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-green-600" /> Remedy Plan
        </h3>
        <PlanList title="Immediate — today" items={report.remedyPlan.immediate} />
        <PlanList title="Next 72 hours — monitor" items={report.remedyPlan.next72Hours} />
        <PlanList title="7-day plan — recover" items={report.remedyPlan.day7Plan} />
        <PlanList title="14-day plan — prevent relapse" items={report.remedyPlan.day14Plan} />
        <div className="rounded-xl bg-red-50 border border-red-100 p-3">
          <h4 className="text-sm font-semibold text-red-800 mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Avoid
          </h4>
          <ul className="space-y-1">
            {report.remedyPlan.avoid.map((item) => (
              <li key={item} className="text-sm text-red-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-gray-500" /> When to escalate
          </h4>
          <p className="text-sm text-gray-600">{report.remedyPlan.escalation}</p>
        </div>
      </Card>

      {/* Recovery plan + rescan */}
      <Card padding="md" className="space-y-3 bg-green-50/50 border-green-100">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-green-600" /> Recovery Plan started
        </h3>
        <p className="text-sm text-gray-600">
          Follow-up check-ins were added to your Today list: a 48-hour rescan, a
          targeted check, and a progress photo in one week.
        </p>
        <Link href="/today">
          <Button variant="secondary" size="sm">
            View Recovery Plan <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </Card>

      {/* Expert verification */}
      <Card padding="md" className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <BadgeCheck className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">
              Expert verification
              {d.expertVerificationRecommended && (
                <span className="ml-2 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                  Recommended
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Connect with botanists, agronomists, arborists, and crop consultants.
              Expert review is rolling out soon — request a spot and we&apos;ll
              follow up.
            </p>
          </div>
        </div>
        {expertRequested ? (
          <p className="text-sm font-medium text-violet-700 bg-violet-50 rounded-lg px-3 py-2">
            Review requested — we&apos;ll reach out when an expert is available.
          </p>
        ) : (
          <Button
            variant="secondary"
            className="w-full touch-manipulation"
            onClick={() => setExpertOpen(true)}
          >
            Request Expert Review
          </Button>
        )}
      </Card>

      {/* Feedback loop */}
      <Card padding="md" className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Was this diagnosis right?
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Your feedback calibrates future diagnoses for this issue.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => giveVerdict("correct")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors touch-manipulation",
              feedback?.verdict === "correct"
                ? "bg-green-600 border-green-600 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
            )}
          >
            <ThumbsUp className="w-4 h-4" /> Looks right
          </button>
          <button
            type="button"
            onClick={() => giveVerdict("wrong")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors touch-manipulation",
              feedback?.verdict === "wrong"
                ? "bg-red-600 border-red-600 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-red-300"
            )}
          >
            <ThumbsDown className="w-4 h-4" /> Doesn't match
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Sprout className="w-4 h-4 text-green-600" /> How is the plant doing?
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => giveOutcome("improved")}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-medium transition-colors touch-manipulation",
              feedback?.outcome === "improved"
                ? "bg-green-600 border-green-600 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
            )}
          >
            Improving
          </button>
          <button
            type="button"
            onClick={() => giveOutcome("worse")}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-medium transition-colors touch-manipulation",
              feedback?.outcome === "worse"
                ? "bg-amber-600 border-amber-600 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"
            )}
          >
            Got worse
          </button>
        </div>

        {(report.status === "active" || report.status === "monitoring" || report.status === "improved") && (
          <>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setStatus("resolved")}
            >
              Mark fully resolved
            </Button>
            <p className="text-xs text-gray-400">
              Marking resolved clears the dashboard alert and recovery check-ins.
            </p>
          </>
        )}
      </Card>

      <p className="text-xs text-gray-400 px-1">{HEALTH_DISCLAIMER}</p>

      <Modal
        open={expertOpen}
        onClose={() => setExpertOpen(false)}
        title="Request Expert Review"
        description="Join the expert review waitlist for this report."
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="secondary" className="flex-1" onClick={() => setExpertOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={submitExpertRequest}>
              Submit Request
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Urgency"
            value={expertUrgency}
            onChange={(e) => setExpertUrgency(e.target.value as "low" | "medium" | "high")}
            options={[
              { value: "low", label: "Low — general guidance" },
              { value: "medium", label: "Medium — issue is progressing" },
              { value: "high", label: "High — severe or high-value crop" },
            ]}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Notes for the expert (optional)
            </label>
            <textarea
              value={expertNotes}
              onChange={(e) => setExpertNotes(e.target.value)}
              rows={3}
              placeholder="Anything else the expert should know…"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
