/**
 * Safe auth lifecycle tracing — enabled with ?debugAuth=1 or in development.
 * No secrets logged.
 */

export type AuthTraceEvent =
  | "SIGN_IN_SUCCESS"
  | "SESSION_CONFIRMED"
  | "PROFILE_LOADED"
  | "PROFILE_CREATED"
  | "ONBOARDING_STATUS"
  | "REDIRECT_TO_ONBOARDING"
  | "REDIRECT_TO_DASHBOARD"
  | "REDIRECT_TO_LOGIN"
  | "AUTH_STATE_CHANGED"
  | "SESSION_LOST"
  | "SESSION_WATCHDOG"
  | "PROVIDER_MOUNTED";

export interface AuthTraceEntry {
  ts: number;
  event: AuthTraceEvent | string;
  route: string;
  hasSession: boolean;
  userIdPresent: boolean;
  onboardingComplete: boolean;
  redirectTarget: string | null;
  reason: string;
}

const MAX_ENTRIES = 80;
const traceLog: AuthTraceEntry[] = [];

let lastRedirect: string | null = null;
let lastProviderMounted: string | null = null;
let previousEvent: string | null = null;
let watchdogTimer: ReturnType<typeof setInterval> | null = null;

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

export interface TraceAuthInput {
  event: AuthTraceEvent | string;
  hasSession?: boolean;
  userId?: string | null;
  onboardingComplete?: boolean;
  redirectTarget?: string | null;
  reason?: string;
}

export function traceAuthEvent(input: TraceAuthInput): void {
  const entry: AuthTraceEntry = {
    ts: Date.now(),
    event: input.event,
    route: currentRoute(),
    hasSession: input.hasSession ?? false,
    userIdPresent: Boolean(input.userId),
    onboardingComplete: input.onboardingComplete ?? false,
    redirectTarget: input.redirectTarget ?? null,
    reason: input.reason ?? "",
  };

  if (isAuthDebugEnabled()) {
    traceLog.push(entry);
    if (traceLog.length > MAX_ENTRIES) traceLog.shift();
    console.info(`[auth-trace] ${input.event}`, entry);
  }

  previousEvent = input.event;
  if (input.redirectTarget) {
    lastRedirect = `${input.redirectTarget}${input.reason ? ` (${input.reason})` : ""}`;
  }
}

export function markProviderMounted(name: string): void {
  lastProviderMounted = name;
  traceAuthEvent({
    event: "PROVIDER_MOUNTED",
    reason: name,
    hasSession: false,
  });
}

export function getAuthTraceLog(): AuthTraceEntry[] {
  return [...traceLog];
}

export function getAuthTraceMeta() {
  return {
    lastRedirect,
    lastProviderMounted,
    previousEvent,
  };
}

/** Poll session for 10s after login to catch unexpected session loss. */
export function startSessionWatchdog(
  readSession: () => Promise<boolean>,
  context: { userId?: string | null; onboardingComplete?: boolean }
): void {
  if (!isAuthDebugEnabled()) return;

  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }

  let hadSession = true;
  let ticks = 0;
  const maxTicks = 20;

  traceAuthEvent({
    event: "SESSION_WATCHDOG",
    hasSession: true,
    userId: context.userId,
    onboardingComplete: context.onboardingComplete,
    reason: "watchdog started (10s)",
  });

  watchdogTimer = setInterval(() => {
    ticks += 1;
    void readSession().then((hasSession) => {
      if (hadSession && !hasSession) {
        traceAuthEvent({
          event: "SESSION_LOST",
          hasSession: false,
          userId: context.userId,
          onboardingComplete: context.onboardingComplete ?? false,
          redirectTarget: lastRedirect,
          reason: `route=${currentRoute()} prev=${previousEvent ?? "none"} provider=${lastProviderMounted ?? "none"}`,
        });
      }
      hadSession = hasSession;

      if (ticks >= maxTicks && watchdogTimer) {
        clearInterval(watchdogTimer);
        watchdogTimer = null;
      }
    });
  }, 500);
}
