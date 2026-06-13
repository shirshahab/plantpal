"use client";

import { useEffect, useRef } from "react";
import {
  registerOverlay,
  syncHistoryAfterOverlayClose,
} from "@/lib/navigation/overlay-stack";

/** Register an open overlay so Android / browser back closes it first. */
export function useOverlay(id: string, open: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const unregister = registerOverlay(id, () => onCloseRef.current());
    return unregister;
  }, [id, open]);

  useEffect(() => {
    if (!open) {
      syncHistoryAfterOverlayClose();
    }
  }, [open]);
}
