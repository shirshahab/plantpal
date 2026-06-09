"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AICarePlanResponse,
  AIDoctorResponse,
  AIGoalPlanResponse,
  AIPriceCheckResponse,
} from "@/lib/types/ai";

const STORAGE_KEY = "plantpal-ai-results";

interface AiStore {
  carePlans: Record<string, AICarePlanResponse>;
  doctorByPlant: Record<string, AIDoctorResponse[]>;
  goalPlans: Record<string, AIGoalPlanResponse>;
  lastPriceCheck: AIPriceCheckResponse | null;
}

const EMPTY: AiStore = {
  carePlans: {},
  doctorByPlant: {},
  goalPlans: {},
  lastPriceCheck: null,
};

interface AiContextValue {
  ready: boolean;
  getCarePlan: (plantId: string) => AICarePlanResponse | null;
  getLatestDoctor: (plantId: string) => AIDoctorResponse | null;
  getGoalPlan: (plantId: string) => AIGoalPlanResponse | null;
  getLastPriceCheck: () => AIPriceCheckResponse | null;
  saveCarePlan: (plantId: string, plan: AICarePlanResponse) => void;
  saveDoctorReport: (plantId: string, report: AIDoctorResponse) => void;
  saveGoalPlan: (plantId: string, plan: AIGoalPlanResponse) => void;
  savePriceCheck: (result: AIPriceCheckResponse) => void;
}

const AiContext = createContext<AiContextValue | null>(null);

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<AiStore>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStore({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: AiStore) => {
    setStore(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const getCarePlan = useCallback(
    (plantId: string) => store.carePlans[plantId] ?? null,
    [store.carePlans]
  );

  const getLatestDoctor = useCallback(
    (plantId: string) => {
      const list = store.doctorByPlant[plantId];
      return list?.[0] ?? null;
    },
    [store.doctorByPlant]
  );

  const getGoalPlan = useCallback(
    (plantId: string) => store.goalPlans[plantId] ?? null,
    [store.goalPlans]
  );

  const getLastPriceCheck = useCallback(
    () => store.lastPriceCheck,
    [store.lastPriceCheck]
  );

  const saveCarePlan = useCallback(
    (plantId: string, plan: AICarePlanResponse) => {
      persist({ ...store, carePlans: { ...store.carePlans, [plantId]: plan } });
    },
    [persist, store]
  );

  const saveDoctorReport = useCallback(
    (plantId: string, report: AIDoctorResponse) => {
      const prev = store.doctorByPlant[plantId] ?? [];
      persist({
        ...store,
        doctorByPlant: {
          ...store.doctorByPlant,
          [plantId]: [report, ...prev].slice(0, 10),
        },
      });
    },
    [persist, store]
  );

  const saveGoalPlan = useCallback(
    (plantId: string, plan: AIGoalPlanResponse) => {
      persist({ ...store, goalPlans: { ...store.goalPlans, [plantId]: plan } });
    },
    [persist, store]
  );

  const savePriceCheck = useCallback(
    (result: AIPriceCheckResponse) => {
      persist({ ...store, lastPriceCheck: result });
    },
    [persist, store]
  );

  const value = useMemo(
    () => ({
      ready,
      getCarePlan,
      getLatestDoctor,
      getGoalPlan,
      getLastPriceCheck,
      saveCarePlan,
      saveDoctorReport,
      saveGoalPlan,
      savePriceCheck,
    }),
    [
      ready,
      getCarePlan,
      getLatestDoctor,
      getGoalPlan,
      getLastPriceCheck,
      saveCarePlan,
      saveDoctorReport,
      saveGoalPlan,
      savePriceCheck,
    ]
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}

export function useAiResults() {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error("useAiResults must be used within AiProvider");
  return ctx;
}
