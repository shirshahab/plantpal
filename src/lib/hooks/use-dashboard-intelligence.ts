"use client";

import { useEffect, useState } from "react";
import type { DashboardIntelligenceContext } from "@/lib/intelligence/dashboard-insights";

const cache = new Map<string, { data: DashboardIntelligenceContext; expires: number }>();
const TTL_MS = 10 * 60 * 1000;

const FALLBACK: DashboardIntelligenceContext = {
  mentionedPlants: [],
  f5Topics: [],
  topProblems: [],
  source: "fallback",
  fetchedAt: null,
  topicCounts: [],
  recentMentionCount: 0,
};

export function useDashboardIntelligence(zipCode: string) {
  const [context, setContext] = useState<DashboardIntelligenceContext>(FALLBACK);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const zip = zipCode?.trim().slice(0, 5);
    if (!zip || !/^\d{5}$/.test(zip)) {
      setContext(FALLBACK);
      return;
    }

    const hit = cache.get(zip);
    if (hit && hit.expires > Date.now()) {
      setContext(hit.data);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/intelligence/dashboard-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zip_code: zip }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { ok?: boolean; data?: DashboardIntelligenceContext } | null) => {
        if (cancelled) return;
        const data = json?.ok && json.data ? json.data : FALLBACK;
        cache.set(zip, { data, expires: Date.now() + TTL_MS });
        setContext(data);
      })
      .catch(() => {
        if (!cancelled) setContext(FALLBACK);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [zipCode]);

  return { context, loading };
}
