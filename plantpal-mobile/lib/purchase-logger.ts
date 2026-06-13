/** Dev-only purchase logging — never log API keys or secrets. */
export function purchaseLog(event: string, meta?: Record<string, unknown>): void {
  if (!__DEV__) return;
  if (meta) {
    console.info("[plantpal-purchases]", event, meta);
  } else {
    console.info("[plantpal-purchases]", event);
  }
}
