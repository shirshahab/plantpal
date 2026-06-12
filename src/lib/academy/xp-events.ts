import type { XpEventType } from "./types";

const XP_EVENT_NAME = "plantpal-award-xp";

export function emitAwardXp(
  type: XpEventType,
  options?: { silent?: boolean }
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(XP_EVENT_NAME, { detail: { type, silent: options?.silent } })
  );
}

export function subscribeAwardXp(
  handler: (type: XpEventType, options?: { silent?: boolean }) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ type: XpEventType; silent?: boolean }>).detail;
    if (detail?.type) handler(detail.type, { silent: detail.silent });
  };
  window.addEventListener(XP_EVENT_NAME, listener);
  return () => window.removeEventListener(XP_EVENT_NAME, listener);
}
