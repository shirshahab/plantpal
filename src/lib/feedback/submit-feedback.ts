import type { BetaFeedbackInput } from "./types";
import { FEEDBACK_STORAGE_KEY } from "./types";

function buildMessage(input: BetaFeedbackInput): string {
  const parts: string[] = [];
  if (input.tried?.trim()) parts.push(`What I tried: ${input.tried.trim()}`);
  if (input.confused?.trim()) parts.push(`What confused me: ${input.confused.trim()}`);
  if (input.improvement?.trim()) parts.push(`What would help: ${input.improvement.trim()}`);
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
  if (!message.trim()) {
    return { ok: false, storage: "local", error: "Please share at least one field." };
  }

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
