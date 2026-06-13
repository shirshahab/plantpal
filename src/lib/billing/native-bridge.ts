/**
 * Native purchase bridge injected by Expo / Capacitor wrapper apps.
 * The main Next.js app runs as PWA; native IAP flows through this bridge.
 */
import type { UserSubscription } from "@/lib/types/billing";

export type NativePurchasePlatform = "ios" | "android";

export interface PurchaseCustomerInfo {
  activeEntitlements: string[];
  activeProductIds: string[];
  originalTransactionId?: string | null;
  purchaseToken?: string | null;
  expirationDate?: string | null;
  isTrialing?: boolean;
  storePlatform?: NativePurchasePlatform;
}

export interface NativePurchaseResult {
  ok: boolean;
  customerInfo?: PurchaseCustomerInfo;
  error?: string;
}

export interface StoreProductPrice {
  productId: string;
  title: string;
  priceString: string;
  currencyCode?: string;
}

export interface PlantPalPurchasesBridge {
  isAvailable: boolean;
  platform: NativePurchasePlatform;
  isConfigured?: () => boolean;
  configure?: (userId: string) => Promise<void>;
  loadProducts: () => Promise<StoreProductPrice[]>;
  purchaseProduct: (productId: string) => Promise<NativePurchaseResult>;
  /** @deprecated Use purchaseProduct */
  purchase?: (productId: string) => Promise<NativePurchaseResult>;
  restorePurchases: () => Promise<NativePurchaseResult>;
  /** @deprecated Use restorePurchases */
  restore?: () => Promise<NativePurchaseResult>;
  getCurrentEntitlement: () => Promise<PurchaseCustomerInfo | null>;
  /** @deprecated Use getCurrentEntitlement */
  getCustomerInfo?: () => Promise<PurchaseCustomerInfo | null>;
}

declare global {
  interface Window {
    PlantPalPurchases?: PlantPalPurchasesBridge;
    ReactNativeWebView?: { postMessage: (message: string) => void };
    __plantPalPurchaseBridge?: {
      handleResponse: (msg: {
        type: string;
        requestId: string;
        ok: boolean;
        payload?: unknown;
        error?: string;
      }) => void;
    };
  }
}

function normalizeBridge(bridge: PlantPalPurchasesBridge): PlantPalPurchasesBridge {
  return {
    ...bridge,
    purchaseProduct: bridge.purchaseProduct ?? bridge.purchase!,
    purchase: bridge.purchase ?? bridge.purchaseProduct,
    restorePurchases: bridge.restorePurchases ?? bridge.restore!,
    restore: bridge.restore ?? bridge.restorePurchases,
    getCurrentEntitlement: bridge.getCurrentEntitlement ?? bridge.getCustomerInfo!,
    getCustomerInfo: bridge.getCustomerInfo ?? bridge.getCurrentEntitlement,
    isConfigured: bridge.isConfigured ?? (() => bridge.isAvailable),
  };
}

export function getNativePurchasesBridge(): PlantPalPurchasesBridge | null {
  if (typeof window === "undefined") return null;
  const bridge = window.PlantPalPurchases;
  if (!bridge?.isAvailable) return null;
  const purchaseFn = bridge.purchaseProduct ?? bridge.purchase;
  const restoreFn = bridge.restorePurchases ?? bridge.restore;
  if (typeof purchaseFn !== "function" || typeof restoreFn !== "function") return null;
  return normalizeBridge(bridge);
}

export function detectCapacitorPlatform(): NativePurchasePlatform | null {
  if (typeof window === "undefined") return null;
  const cap = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const platform = cap?.getPlatform?.();
  if (platform === "ios") return "ios";
  if (platform === "android") return "android";
  return null;
}

export function detectWebViewPlatform(): NativePurchasePlatform | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/PlantPal\/iOS/i.test(ua)) return "ios";
  if (/PlantPal\/Android/i.test(ua)) return "android";
  return null;
}

export function postNativeMessage(type: string, payload?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.ReactNativeWebView?.postMessage(JSON.stringify({ type, ...payload }));
}

export type SubscriptionPatchFromStore = Pick<
  UserSubscription,
  | "tier"
  | "billingCycle"
  | "subscriptionStatus"
  | "trialStatus"
  | "planStartDate"
  | "planEndDate"
  | "trialStartedAt"
  | "trialEndsAt"
  | "storePlatform"
  | "storeProductId"
  | "storeOriginalTransactionId"
  | "storePurchaseToken"
>;
