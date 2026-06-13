/** Central overlay stack for Android back / browser back handling. */

type OverlayEntry = {
  id: string;
  close: () => void;
};

const stack: OverlayEntry[] = [];
let closingFromPopstate = false;
let historyPushed = false;

export function getOverlayStackDepth(): number {
  return stack.length;
}

export function registerOverlay(id: string, close: () => void): () => void {
  const entry: OverlayEntry = { id, close };
  stack.push(entry);

  if (stack.length === 1 && typeof window !== "undefined") {
    try {
      window.history.pushState({ plantpalOverlay: id }, "");
      historyPushed = true;
    } catch {
      /* ignore */
    }
  }

  return () => {
    const idx = stack.indexOf(entry);
    if (idx >= 0) stack.splice(idx, 1);
    if (stack.length === 0) historyPushed = false;
  };
}

/** Close the top overlay. Returns true if one was closed. */
export function closeTopOverlay(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  closingFromPopstate = true;
  try {
    top.close();
  } finally {
    closingFromPopstate = false;
  }
  return true;
}

export function isClosingFromPopstate(): boolean {
  return closingFromPopstate;
}

/** Call when user closes overlay via UI (X, backdrop) to sync browser history. */
export function syncHistoryAfterOverlayClose(): void {
  if (closingFromPopstate || !historyPushed) return;
  if (stack.length > 0) return;
  if (typeof window === "undefined") return;
  try {
    window.history.back();
  } catch {
    /* ignore */
  }
  historyPushed = false;
}

/** Android / Expo WebView bridge entry point. */
export function handlePlantPalBack(): boolean {
  return closeTopOverlay();
}

declare global {
  interface Window {
    PlantPalBack?: { requestClose: () => boolean };
  }
}

export function installPlantPalBackBridge(): void {
  if (typeof window === "undefined") return;
  window.PlantPalBack = { requestClose: handlePlantPalBack };
}
