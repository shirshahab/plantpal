"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/lib/store/auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type SyncStatus = "synced" | "offline" | "pending" | "failed" | "local";

interface SyncContextValue {
  status: SyncStatus;
  useCloud: boolean;
  lastError: string | null;
  markPending: () => void;
  markSynced: () => void;
  markFailed: (message: string) => void;
  markLocal: () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isMockMode } = useAuth();
  const useCloud = !isMockMode && isSupabaseConfigured() && !!user;

  const [status, setStatus] = useState<SyncStatus>(
    useCloud ? "pending" : "local"
  );
  const [lastError, setLastError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!useCloud) {
      setStatus("local");
      return;
    }
    if (!online) {
      setStatus("offline");
    }
  }, [useCloud, online]);

  const markPending = useCallback(() => {
    if (!useCloud) return;
    setStatus(online ? "pending" : "offline");
    setLastError(null);
  }, [useCloud, online]);

  const markSynced = useCallback(() => {
    if (!useCloud) {
      setStatus("local");
      return;
    }
    setStatus(online ? "synced" : "offline");
    setLastError(null);
  }, [useCloud, online]);

  const markFailed = useCallback((message: string) => {
    setLastError(message);
    setStatus(useCloud && online ? "failed" : "offline");
  }, [useCloud, online]);

  const markLocal = useCallback(() => {
    setStatus("local");
    setLastError(null);
  }, []);

  return (
    <SyncContext.Provider
      value={{
        status,
        useCloud,
        lastError,
        markPending,
        markSynced,
        markFailed,
        markLocal,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
