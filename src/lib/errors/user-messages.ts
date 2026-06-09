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
export function friendlyAiError(error: string | undefined, feature = "AI"): string {
  if (!error) {
    return `OpenAI is not connected yet. Showing smart mock result for this ${feature} request.`;
  }

  const lower = error.toLowerCase();
  if (lower.includes("openai") || lower.includes("api key") || lower.includes("401")) {
    return `OpenAI is not connected yet. Add OPENAI_API_KEY to .env.local and restart the dev server. Showing smart mock result.`;
  }

  if (lower.includes("invalid json")) {
    return "The request was invalid. Please refresh and try again.";
  }

  if (lower.includes("identification failed") || lower.includes("care plan")) {
    return `${error} — showing smart mock result instead.`;
  }

  return error;
}

/** Short toast-friendly AI status when mock is used intentionally. */
export function aiSourceLabel(source: "ai" | "mock" | undefined, feature: string): string {
  if (source === "ai") return `${feature} ready (live AI).`;
  return `${feature} ready (mock — add OPENAI_API_KEY for live AI).`;
}
