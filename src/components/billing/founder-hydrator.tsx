"use client";

import { useLayoutEffect } from "react";
import { hydrateFounderModeFromStorage } from "@/lib/billing/beta-unlock";

/** Sync founder cookie before children fire API requests. */
export function FounderHydrator() {
  useLayoutEffect(() => {
    hydrateFounderModeFromStorage();
  }, []);
  return null;
}
