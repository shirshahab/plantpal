/**
 * Hard auth diagnostics — always logs to console with [plantpal-auth].
 * Debug panel reads from getAuthDiagnosticState().
 */

export type AuthLogEvent =
  | "SIGN_IN_START"
  | "SIGN_IN_SUCCESS"
  | "SESSION_AFTER_SIGNIN"
  | "ROUTE_DECISION"
  | "ONBOARDING_CHECK"
  | "PROFILE_CHECK"
  | "REDIRECT"
  | "SESSION_LOST"
  | "AUTH_STATE_CHANGED";

export interface AuthDiagnosticState {
  currentRoute: string;
  sessionExists: boolean;
  userId: string | null;
  authLoading: boolean;
  onboardingComplete: boolean;
  lastRedirectReason: string | null;
  lastAuthEvent: string | null;
  profileLoadResult: string | null;
  errorMessage: string | null;
}

const MAX_LOG = 100;
const logEntries: { ts: number; event: string; detail: Record<string, unknown> }[] = [];

let diagnosticState: AuthDiagnosticState = {
  currentRoute: "",
  sessionExists: false,
  userId: null,
  authLoading: true,
  onboardingComplete: false,
  lastRedirectReason: null,
  lastAuthEvent: null,
  profileLoadResult: null,
  errorMessage: null,
};

let lastRedirectReason: string | null = null;

export function isAuthDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV === "development") return true;
  try {
    return new URLSearchParams(window.location.search).get("debugAuth") === "1";
  } catch {
    return false;
  }
}

function currentRoute(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname + window.location.search;
}

export function logAuth(
  event: AuthLogEvent | string,
  detail: Record<string, unknown> = {}
): void {
  const route = currentRoute();
  const entry = { ts: Date.now(), event, detail: { ...detail, route } };
  logEntries.push(entry);
  if (logEntries.length > MAX_LOG) logEntries.shift();

  console.info(`[plantpal-auth] ${event}`, detail);

  diagnosticState = {
    ...diagnosticState,
    currentRoute: route,
    lastAuthEvent: event,
    ...(typeof detail.sessionExists === "boolean"
      ? { sessionExists: detail.sessionExists }
      : {}),
    ...(typeof detail.userId === "string" ? { userId: detail.userId } : {}),
    ...(typeof detail.authLoading === "boolean"
      ? { authLoading: detail.authLoading }
      : {}),
    ...(typeof detail.onboardingComplete === "boolean"
      ? { onboardingComplete: detail.onboardingComplete }
      : {}),
    ...(typeof detail.profileLoadResult === "string"
      ? { profileLoadResult: detail.profileLoadResult }
      : {}),
    ...(typeof detail.error === "string" ? { errorMessage: detail.error } : {}),
  };

  if (event === "REDIRECT" && typeof detail.reason === "string") {
    lastRedirectReason = detail.reason;
    diagnosticState.lastRedirectReason = detail.reason;
  }
}

export function patchAuthDiagnostic(patch: Partial<AuthDiagnosticState>): void {
  diagnosticState = { ...diagnosticState, ...patch, currentRoute: currentRoute() };
}

export function getAuthDiagnosticState(): AuthDiagnosticState {
  return { ...diagnosticState, currentRoute: currentRoute(), lastRedirectReason };
}

export function getAuthLogEntries() {
  return [...logEntries];
}

export function logRedirect(target: string, reason: string, extra: Record<string, unknown> = {}) {
  logAuth("REDIRECT", { target, reason, ...extra });
}

export function getLastRedirectReason(): string | null {
  return lastRedirectReason;
}

/** Poll session for 10s after login. */
export function startSessionWatchdog(readSession: () => Promise<boolean>): void {
  let hadSession = true;
  let ticks = 0;
  const timer = setInterval(() => {
    ticks += 1;
    void readSession().then((hasSession) => {
      if (hadSession && !hasSession) {
        logAuth("SESSION_LOST", {
          reason: getLastRedirectReason() ?? "unknown",
          route: currentRoute(),
          lastEvent: diagnosticState.lastAuthEvent,
        });
      }
      hadSession = hasSession;
      patchAuthDiagnostic({ sessionExists: hasSession });
      if (ticks >= 20) clearInterval(timer);
    });
  }, 500);
}
