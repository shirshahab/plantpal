"use client";

import { AuthDebugPanel } from "@/components/dev/auth-debug-panel";

/**
 * Development-only auth state readout in the app shell.
 * Also available on any route via ?debugAuth=1 through AuthDebugPanel.
 */
export function AuthDebug() {
  return <AuthDebugPanel />;
}
