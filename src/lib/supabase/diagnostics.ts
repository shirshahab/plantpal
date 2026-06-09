import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";

export interface TableProbeResult {
  table: string;
  ok: boolean;
  status: number | null;
  rowCount: number | null;
  error: Pick<PostgrestError, "message" | "code" | "details" | "hint"> | null;
}

export interface SupabaseDiagnostics {
  url: string;
  projectRef: string | null;
  anonKeyPreview: string;
  mockMode: boolean;
  auth: {
    hasSession: boolean;
    userId: string | null;
    email: string | null;
    authError: string | null;
  };
  tables: TableProbeResult[];
}

function serializeError(
  error: PostgrestError | null
): TableProbeResult["error"] {
  if (!error) return null;
  return {
    message: error.message,
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  };
}

export async function probeTable(
  supabase: SupabaseClient,
  table: string
): Promise<TableProbeResult> {
  const { data, error, status } = await supabase.from(table).select("id").limit(1);

  return {
    table,
    ok: !error,
    status: status ?? null,
    rowCount: error ? null : (data?.length ?? 0),
    error: serializeError(error),
  };
}

export async function runSupabaseDiagnostics(
  supabase: SupabaseClient,
  options: {
    url: string;
    anonKeyPreview: string;
    mockMode: boolean;
    projectRef: string | null;
  }
): Promise<SupabaseDiagnostics> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const tables = await Promise.all([
    probeTable(supabase, "plants"),
    probeTable(supabase, "profiles"),
  ]);

  return {
    url: options.url,
    projectRef: options.projectRef,
    anonKeyPreview: options.anonKeyPreview,
    mockMode: options.mockMode,
    auth: {
      hasSession: !!session,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
      authError: sessionError?.message ?? null,
    },
    tables,
  };
}
