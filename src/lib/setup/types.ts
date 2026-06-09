export type SetupStatus = "ok" | "warn" | "fail" | "skip";

export interface SetupCheckItem {
  id: string;
  label: string;
  status: SetupStatus;
  message: string;
  fix?: string;
}

export interface SetupStorageDebug {
  projectHost: string | null;
  checkMethod: string;
  storageError: string | null;
  bucketsReturned: string[];
  details: {
    listBucketsError: string | null;
    getBucketError: string | null;
    publicProbeStatus: number | null;
    publicProbeMessage: string | null;
    usedServiceRole: boolean;
  };
}

export interface SetupCheckReport {
  overall: SetupStatus;
  mode: "mock" | "supabase";
  checks: SetupCheckItem[];
  storageDebug?: SetupStorageDebug;
  integrations?: import("@/lib/types/integrations").IntegrationHealthCard[];
  integrationSummary?: {
    live: number;
    configured: number;
    fallback: number;
  };
  checkedAt: string;
}
