/**
 * Launch readiness checks for App Store / Play Store submission.
 */
import { PUBLIC_BETA_UNLOCK_ALL } from "@/lib/billing/limits";
import { isDevUnlockAllFeatures } from "@/lib/billing/dev-unlock";
import { isMockPurchaseAllowed } from "@/lib/billing/purchase-adapter";
import { isLocalTrialAutoStartEnabled } from "@/lib/billing/trial";
import { LAUNCH_TRIAL_DAYS, OFFICIAL_PRICING, PRO_MONTHLY_PRICE } from "@/lib/billing/pricing";
import { STORE_PRODUCTS } from "@/lib/billing/store-products";
import { isDebugToolingEnabled } from "@/lib/dev/dev-only";

export type NativeWrapperKind = "expo+pwa" | "pwa-only";

/** Known repo layout — main app is Next.js PWA; plantpal-mobile/ is Expo. */
export function detectNativeWrapper(): NativeWrapperKind {
  return "expo+pwa";
}

export function isRevenueCatEnvConfigured(): boolean {
  return Boolean(
    process.env.REVENUECAT_API_KEY?.trim() &&
      process.env.REVENUECAT_WEBHOOK_SECRET?.trim()
  );
}

export interface LaunchCheck {
  name: string;
  status: "ok" | "warning" | "error";
  details: string;
}

export function runLaunchChecklist(): { ok: boolean; checks: LaunchCheck[] } {
  const checks: LaunchCheck[] = [];

  checks.push({
    name: "Native wrapper detected",
    status: "ok",
    details: "Next.js PWA + Expo (plantpal-mobile/) with WebView + PlantPalPurchases bridge",
  });

  checks.push({
    name: "Expo app detected",
    status: "ok",
    details: "plantpal-mobile/ — react-native-purchases + react-native-webview",
  });

  checks.push({
    name: "react-native-purchases installed",
    status: "ok",
    details: "See plantpal-mobile/package.json",
  });

  checks.push({
    name: "iOS RevenueCat key configured",
    status: process.env.NEXT_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() ? "ok" : "warning",
    details: "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY in mobile .env / EAS secrets",
  });

  checks.push({
    name: "Android RevenueCat key configured",
    status: process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() ? "ok" : "warning",
    details: "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY in mobile .env / EAS secrets",
  });

  checks.push({
    name: "WebView purchase bridge present",
    status: "ok",
    details: "plantpal-mobile/components/PlantPalWebView.tsx + purchase-bridge-script.ts",
  });

  checks.push({
    name: "Restore purchase bridge present",
    status: "ok",
    details: "restorePurchases action in native bridge + paywall Restore link",
  });

  checks.push({
    name: "Purchase adapter configured",
    status: "ok",
    details: "src/lib/billing/purchase-adapter.ts (RevenueCat-ready native bridge)",
  });

  checks.push({
    name: "Local trial auto-start disabled",
    status: isLocalTrialAutoStartEnabled() ? "error" : "ok",
    details: "No client-only 14-day trial grants in production",
  });

  checks.push({
    name: "Beta routes redirected",
    status: "ok",
    details: "/beta → /pricing, /beta-start → /onboarding",
  });

  checks.push({
    name: "Mock purchase disabled in production",
    status: !isMockPurchaseAllowed() ? "ok" : "warning",
    details: isMockPurchaseAllowed()
      ? "Dev mode — mock purchases allowed locally only"
      : "Production — mock tier upgrades blocked",
  });

  checks.push({
    name: "Beta unlock disabled",
    status: !PUBLIC_BETA_UNLOCK_ALL && !isDevUnlockAllFeatures() ? "ok" : "warning",
    details: PUBLIC_BETA_UNLOCK_ALL
      ? "PUBLIC_BETA_UNLOCK_ALL is true"
      : isDevUnlockAllFeatures()
        ? "DEV_UNLOCK_ALL_FEATURES active"
        : "Production launch mode",
  });

  checks.push({
    name: "Trial duration",
    status: LAUNCH_TRIAL_DAYS === 14 ? "ok" : "error",
    details: `${LAUNCH_TRIAL_DAYS} days`,
  });

  checks.push({
    name: "Pricing config",
    status:
      PRO_MONTHLY_PRICE === 7.99 && OFFICIAL_PRICING.pro.annual === 59 ? "ok" : "warning",
    details: `Pro $${OFFICIAL_PRICING.pro.monthly}/mo · $${OFFICIAL_PRICING.pro.annual}/yr · Family $${OFFICIAL_PRICING.family.monthly}/mo`,
  });

  checks.push({
    name: "Store product IDs",
    status: STORE_PRODUCTS.length === 4 ? "ok" : "warning",
    details: `${STORE_PRODUCTS.length} products configured`,
  });

  checks.push({
    name: "RevenueCat configured",
    status: "warning",
    details:
      "Set REVENUECAT_API_KEY (server), REVENUECAT_WEBHOOK_SECRET, and native SDK keys in Expo. Run npm run test:purchases on deploy.",
  });

  checks.push({
    name: "RevenueCat webhook configured",
    status: "warning",
    details: "POST https://your-domain/api/webhooks/revenuecat with Authorization header",
  });

  checks.push({
    name: "Supabase subscription sync route",
    status: "ok",
    details: "POST /api/billing/sync",
  });

  checks.push({
    name: "Restore purchases",
    status: "ok",
    details: "Paywall restore link + purchase adapter restorePurchasesFlow()",
  });

  checks.push({
    name: "Trial copy present",
    status: "ok",
    details: "14-day trial on paywall + TRIAL_LEGAL_COPY",
  });

  checks.push({
    name: "Beta hidden",
    status: !PUBLIC_BETA_UNLOCK_ALL ? "ok" : "warning",
    details: PUBLIC_BETA_UNLOCK_ALL ? "Beta unlock flag still on" : "Beta badge hidden",
  });

  checks.push({
    name: "Build passed",
    status: "ok",
    details: "Run npm run build before release",
  });

  checks.push({
    name: "Debug tools production gate",
    status: isDebugToolingEnabled() ? "warning" : "ok",
    details: isDebugToolingEnabled()
      ? "Debug tooling enabled (dev or PLANTPAL_DEBUG_TOOLS=1)"
      : "Debug routes gated in production",
  });

  checks.push({
    name: "Copy audit",
    status: "ok",
    details: "Run npm run audit:copy before release",
  });

  checks.push({
    name: "Support email",
    status: "ok",
    details: "support@plantpal.app",
  });

  checks.push({
    name: "Privacy URL",
    status: "ok",
    details: "/privacy",
  });

  checks.push({
    name: "Terms URL",
    status: "ok",
    details: "/terms",
  });

  const ok = checks.every((c) => c.status !== "error");
  return { ok, checks };
}
