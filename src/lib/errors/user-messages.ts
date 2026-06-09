import type { PostgrestError } from "@supabase/supabase-js";
import { isMissingTableError } from "@/lib/supabase/errors";

type ErrorLike = Pick<PostgrestError, "message" | "code" | "details" | "hint">;

/** User-facing message for Supabase / save failures. */
export function friendlySaveError(error: ErrorLike | string): string {
  const err: ErrorLike =
    typeof error === "string"
      ? { message: error, code: "", details: "", hint: "" }
      : error;

  if (isMissingTableError(err)) {
    return [
      "PlantPal could not save because a required database table is missing.",
      "Run supabase/FIX_RUN_THIS.sql in the Supabase SQL Editor, restart npm run dev, then try again.",
      "Open /setup to verify tables.",
    ].join(" ");
  }

  if (
    err.code === "42501" ||
    err.message.toLowerCase().includes("row-level security") ||
    err.message.toLowerCase().includes("permission denied")
  ) {
    return "PlantPal could not save — you may not be signed in, or row-level security blocked the action. Sign out, sign back in, and try again.";
  }

  if (err.message.includes("plant-photos") || err.message.includes("Bucket not found")) {
    return "Photo upload failed — the plant-photos storage bucket may be missing. Run supabase/FIX_RUN_THIS.sql and check /setup.";
  }

  if (err.message.includes("logged in")) {
    return err.message;
  }

  return err.message || "Something went wrong while saving. Check /setup for configuration issues.";
}

/** User-facing message for AI API failures shown in UI. */
export function friendlyAiError(error: string | undefined, _feature = "AI"): string {
  if (!error?.trim()) {
    return `We couldn't analyze those photos. Please try again.`;
  }

  const trimmed = error.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.includes("too large") ||
    lower.includes("entity too large") ||
    (lower.includes("maximum") && lower.includes("photo"))
  ) {
    return trimmed.includes("Photos are too large")
      ? trimmed
      : "Photos are too large. Try again with smaller images.";
  }

  if (lower.includes("invalid image format") || lower.includes("image encoding failed")) {
    return trimmed;
  }

  if (lower.includes("openai http") || lower.includes("openai request failed")) {
    return trimmed;
  }

  if (lower.includes("plantnet")) {
    return trimmed;
  }

  if (lower.includes("timed out") || lower.includes("timeout")) {
    return trimmed;
  }

  if (lower.includes("daily plant scan limit") || lower.includes("too many scans")) {
    return trimmed;
  }

  if (lower.includes("care plan")) {
    return `${trimmed} — showing smart mock result instead.`;
  }

  // Pass through detailed server errors (failureReason) for identification/debugging.
  if (
    lower.includes("failed") ||
    lower.includes("invalid") ||
    lower.includes("unauthorized") ||
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("api key")
  ) {
    return trimmed;
  }

  return trimmed.length > 200 ? `${trimmed.slice(0, 197)}…` : trimmed;
}

/** Short toast-friendly AI status when mock is used intentionally. */
export function aiSourceLabel(source: "ai" | "mock" | undefined, feature: string): string {
  if (source === "ai") return `${feature} ready (live AI).`;
  return `${feature} ready (mock — add OPENAI_API_KEY for live AI).`;
}
