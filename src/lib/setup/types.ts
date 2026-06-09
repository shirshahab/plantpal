export type SetupStatus = "ok" | "warn" | "fail" | "skip";

export interface SetupCheckItem {
  id: string;
  label: string;
  status: SetupStatus;
  message: string;
  fix?: string;
}

export interface SetupCheckReport {
  overall: SetupStatus;
  mode: "mock" | "supabase";
  checks: SetupCheckItem[];
  integrations?: import("@/lib/types/integrations").IntegrationHealthCard[];
  integrationSummary?: {
    live: number;
    configured: number;
    fallback: number;
  };
  checkedAt: string;
}
