"use client";

import { useEffect } from "react";
import {
  closeTopOverlay,
  installPlantPalBackBridge,
} from "@/lib/navigation/overlay-stack";

/** Handles browser back and native Android back for overlay dismissal. */
export function BackHandler() {
  useEffect(() => {
    installPlantPalBackBridge();

    const onPopState = () => {
      if (closeTopOverlay()) return;
    };

    window.addEventListener("popstate", onPopState);

    const onNativeBack = () => {
      closeTopOverlay();
    };
    window.addEventListener("plantpal:back", onNativeBack);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("plantpal:back", onNativeBack);
    };
  }, []);

  return null;
}
