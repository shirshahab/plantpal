"use client";

import {
  createContext,
  useCallback,
  useContext,
} from "react";
import { queueToast } from "@/components/gamification/xp-toast-queue";
import { XpToastQueueHost } from "@/components/gamification/xp-toast-queue";

interface ToastContextValue {
  toast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useCallback((message: string) => {
    queueToast(message);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <XpToastQueueHost />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
