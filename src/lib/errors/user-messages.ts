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
    return "PlantPal couldn't save to the cloud right now. Your changes are kept on this device. Please try again later.";
  }

  if (
    err.code === "42501" ||
    err.message.toLowerCase().includes("row-level security") ||
    err.message.toLowerCase().includes("permission denied")
  ) {
    return "PlantPal could not save. You may not be signed in, or row-level security blocked the action. Sign out, sign back in, and try again.";
  }

  if (err.message.includes("plant-photos") || err.message.includes("Bucket not found")) {
    return "Photo upload failed. Cloud photo storage is unavailable right now. Your photo is kept on this device; try again later.";
  }

  if (err.message.includes("logged in")) {
    return err.message;
  }

  return err.message || "Something went wrong while saving. Please try again.";
}

/** User-facing message for AI API failures shown in UI. */
export function friendlyAiError(error: string | undefined, feature = "AI"): string {
  if (!error?.trim()) {
    return feature === "diagnosis"
      ? "We need one clearer photo or a short description to figure this out."
      : "We couldn't read those photos. Try a clearer shot in good light.";
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
    return `${trimmed} Showing a preview plan instead.`;
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
  if (source === "ai") return `${feature} ready.`;
  return `${feature} ready (preview mode).`;
}
