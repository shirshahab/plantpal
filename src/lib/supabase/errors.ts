import type { PostgrestError } from "@supabase/supabase-js";
import { EXPECTED_PROJECT_REF } from "./config";

export { EXPECTED_PROJECT_REF };

type ErrorLike = Pick<PostgrestError, "message" | "code" | "details" | "hint">;

export function isMissingTableError(error: ErrorLike): boolean {
  return (
    error.code === "PGRST205" ||
    (error.message.includes("Could not find the table") &&
      error.message.includes("schema cache"))
  );
}

/** Format a Supabase/PostgREST error for display — always includes the real message. */
export function formatPostgrestError(error: ErrorLike): string {
  const lines = [
    error.message,
    error.code ? `Code: ${error.code}` : null,
    error.details ? `Details: ${error.details}` : null,
    error.hint ? `Hint: ${error.hint}` : null,
  ].filter(Boolean) as string[];

  const formatted = lines.join("\n");

  if (!isMissingTableError(error)) {
    if (
      error.code === "42501" ||
      error.message.toLowerCase().includes("row-level security")
    ) {
      return `${formatted}\n\nThis is usually an auth issue. Log out, log back in, and try again.`;
    }
    return formatted;
  }

  return [
    formatted,
    "",
    "The API cannot see this table yet. If you already ran supabase/FIX_RUN_THIS.sql:",
    "• Confirm Success in Supabase SQL Editor (project fxmxkmqgxlhggqngsxja)",
    "• Restart the dev server: stop npm run dev, then run it again",
    "• Hard-refresh the browser (Ctrl+Shift+R)",
    "• Open /debug/supabase to compare server vs browser probes",
    "",
    "If you have not run the setup SQL yet:",
    "https://supabase.com/dashboard/project/fxmxkmqgxlhggqngsxja/sql/new",
  ].join("\n");
}
