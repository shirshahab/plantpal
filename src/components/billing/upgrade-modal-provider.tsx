"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { UpgradeModal } from "./upgrade-modal";
import { useSubscription } from "@/lib/store/subscription-provider";

interface UpgradeModalContextValue {
  showUpgradeModal: (options?: { headline?: string; copy?: string }) => void;
  hideUpgradeModal: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextValue | null>(null);

export function UpgradeModalProvider({ children }: { children: React.ReactNode }) {
  const { betaUnlockAll } = useSubscription();
  const [open, setOpen] = useState(false);
  const [headline, setHeadline] = useState<string | undefined>();
  const [copy, setCopy] = useState<string | undefined>();

  const showUpgradeModal = useCallback(
    (options?: { headline?: string; copy?: string }) => {
      if (betaUnlockAll) return;
      setHeadline(options?.headline);
      setCopy(options?.copy);
      setOpen(true);
    },
    [betaUnlockAll]
  );

  const hideUpgradeModal = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ showUpgradeModal, hideUpgradeModal }),
    [showUpgradeModal, hideUpgradeModal]
  );

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}
      {!betaUnlockAll && (
        <UpgradeModal open={open} onClose={hideUpgradeModal} headline={headline} copy={copy} />
      )}
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) {
    throw new Error("useUpgradeModal must be used within UpgradeModalProvider");
  }
  return ctx;
}
