import type { BetaFeedbackInput } from "./types";
import { FEEDBACK_STORAGE_KEY, getCategoryLabel } from "./types";
import { getRecentClientErrors } from "@/lib/errors/report-error";
import { trackEvent } from "@/lib/analytics/track";

/** Device + recent-error context attached to bug reports for triage. */
function buildDiagnostics(): string {
  if (typeof window === "undefined") return "";
  const lines: string[] = [
    `UA: ${navigator.userAgent}`,
    `Viewport: ${window.innerWidth}x${window.innerHeight}`,
    `Online: ${navigator.onLine}`,
  ];
  const recent = getRecentClientErrors(3);
  if (recent.length > 0) {
    lines.push(
      `Recent errors: ${recent.map((e) => `[${e.kind ?? "error"}] ${e.message}`.slice(0, 160)).join(" | ")}`
    );
  }
  return `--- Diagnostics ---\n${lines.join("\n")}`;
}

function buildMessage(input: BetaFeedbackInput): string {
  const parts: string[] = [];
  if (input.category) {
    parts.push(`Category: ${getCategoryLabel(input.category)}`);
  }
  if (input.tried?.trim()) parts.push(`What I tried: ${input.tried.trim()}`);
  if (input.confused?.trim()) parts.push(`What confused me: ${input.confused.trim()}`);
  if (input.improvement?.trim()) parts.push(`What would help: ${input.improvement.trim()}`);
  if (input.category === "bug") {
    const diag = buildDiagnostics();
    if (diag) parts.push(diag);
  }
  return parts.join("\n\n");
}

function saveLocal(input: BetaFeedbackInput, message: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    existing.push({
      id: crypto.randomUUID(),
      ...input,
      feedback_type: "beta",
      message,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    /* ignore */
  }
}

export async function submitBetaFeedback(
  input: BetaFeedbackInput
): Promise<{ ok: boolean; storage: "supabase" | "local"; error?: string }> {
  const message = buildMessage(input);
  if (!input.category && !input.tried?.trim() && !input.confused?.trim() && !input.improvement?.trim()) {
    return { ok: false, storage: "local", error: "Pick a type or add a note." };
  }

  trackEvent("feedback_submitted", {
    category: input.category ?? "none",
    route: input.route ?? "",
  });

  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, message }),
    });
    const data = (await res.json()) as { ok: boolean; storage?: "supabase" | "local"; error?: string };
    if (data.ok) {
      if (data.storage === "local") saveLocal(input, message);
      return { ok: true, storage: data.storage ?? "local" };
    }
    saveLocal(input, message);
    return { ok: true, storage: "local" };
  } catch {
    saveLocal(input, message);
    return { ok: true, storage: "local" };
  }
}
