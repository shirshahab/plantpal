/** Explicit scanner demo — returns placeholder IDs instead of calling live APIs. */
export function isScannerDemoModeEnabled(): boolean {
  const values = [
    process.env.SCANNER_DEMO_MODE,
    process.env.NEXT_PUBLIC_SCANNER_DEMO_MODE,
  ];
  return values.some((v) => v?.trim().toLowerCase() === "true");
}
