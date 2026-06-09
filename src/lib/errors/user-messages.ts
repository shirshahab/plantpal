import type { PostgrestError } from "@supabase/supabase-js";
import { LIVE_IDENTIFICATION_FAILED } from "@/lib/ai/messages";
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
export function friendlyAiError(error: string | undefined, feature = "AI"): string {
  if (!error) {
    return `We couldn't analyze those photos. Please try again.`;
  }

  const lower = error.toLowerCase();

  if (
    error === LIVE_IDENTIFICATION_FAILED ||
    lower.includes("live identification failed")
  ) {
    return LIVE_IDENTIFICATION_FAILED;
  }

  if (
    lower.includes("too large") ||
    lower.includes("entity too large") ||
    lower.includes("unexpected token") ||
    lower.includes("not valid json")
  ) {
    return "Photos are too large. Try again with smaller images.";
  }

  if (
    lower.includes("couldn't analyze") ||
    lower.includes("please try again")
  ) {
    return error;
  }

  if (lower.includes("maximum") && lower.includes("photo")) {
    return error;
  }

  if (lower.includes("openai") || lower.includes("api key") || lower.includes("401")) {
    return `We couldn't analyze those photos. Please try again.`;
  }

  if (lower.includes("invalid json") || lower.includes("invalid request")) {
    return "Photos are too large. Try again with smaller images.";
  }

  if (lower.includes("photo analysis failed")) {
    return "We couldn't analyze those photos. Please try again.";
  }

  if (lower.includes("care plan")) {
    return `${error} — showing smart mock result instead.`;
  }

  return error.length > 120
    ? "We couldn't analyze those photos. Please try again."
    : error;
}

/** Short toast-friendly AI status when mock is used intentionally. */
export function aiSourceLabel(source: "ai" | "mock" | undefined, feature: string): string {
  if (source === "ai") return `${feature} ready (live AI).`;
  return `${feature} ready (mock — add OPENAI_API_KEY for live AI).`;
}
