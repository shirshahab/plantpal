import {
  configureRevenueCat,
  getCurrentEntitlementNative,
  loadStoreProducts,
  loginRevenueCat,
  purchaseProduct,
  restorePurchasesNative,
  type NativePurchaseResult,
} from "./revenuecat";
import { purchaseLog } from "./purchase-logger";

export interface PurchaseBridgeRequest {
  type: "PLANTPAL_PURCHASE_REQUEST";
  requestId: string;
  action: string;
  payload?: {
    userId?: string;
    productId?: string;
  };
}

export interface PurchaseBridgeResponse {
  type: "PLANTPAL_PURCHASE_RESPONSE";
  requestId: string;
  ok: boolean;
  payload?: unknown;
  error?: string;
}

export async function handlePurchaseBridgeMessage(
  raw: string,
  respond: (response: PurchaseBridgeResponse) => void
): Promise<void> {
  let msg: PurchaseBridgeRequest;
  try {
    msg = JSON.parse(raw) as PurchaseBridgeRequest;
  } catch {
    return;
  }

  if (msg.type !== "PLANTPAL_PURCHASE_REQUEST" || !msg.requestId || !msg.action) {
    return;
  }

  const { requestId, action, payload } = msg;

  try {
    switch (action) {
      case "configure": {
        if (payload?.userId) {
          await loginRevenueCat(payload.userId);
        } else {
          await configureRevenueCat();
        }
        respond({ type: "PLANTPAL_PURCHASE_RESPONSE", requestId, ok: true, payload: { configured: true } });
        break;
      }
      case "loadProducts": {
        const products = await loadStoreProducts();
        respond({ type: "PLANTPAL_PURCHASE_RESPONSE", requestId, ok: true, payload: products });
        break;
      }
      case "purchaseProduct": {
        if (!payload?.productId) {
          respond({
            type: "PLANTPAL_PURCHASE_RESPONSE",
            requestId,
            ok: false,
            error: "Missing productId",
          });
          break;
        }
        const result = await purchaseProduct(payload.productId);
        respond(buildPurchaseResponse(requestId, result));
        break;
      }
      case "restorePurchases": {
        const result = await restorePurchasesNative();
        respond(buildPurchaseResponse(requestId, result));
        break;
      }
      case "getCurrentEntitlement": {
        const entitlement = await getCurrentEntitlementNative();
        respond({
          type: "PLANTPAL_PURCHASE_RESPONSE",
          requestId,
          ok: true,
          payload: entitlement,
        });
        break;
      }
      default:
        respond({
          type: "PLANTPAL_PURCHASE_RESPONSE",
          requestId,
          ok: false,
          error: "Unknown action: " + action,
        });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Native purchase error";
    purchaseLog("bridge_error", { action, message });
    respond({
      type: "PLANTPAL_PURCHASE_RESPONSE",
      requestId,
      ok: false,
      error: message,
    });
  }
}

function buildPurchaseResponse(
  requestId: string,
  result: NativePurchaseResult
): PurchaseBridgeResponse {
  if (result.ok && result.customerInfo) {
    return {
      type: "PLANTPAL_PURCHASE_RESPONSE",
      requestId,
      ok: true,
      payload: { customerInfo: result.customerInfo },
    };
  }
  return {
    type: "PLANTPAL_PURCHASE_RESPONSE",
    requestId,
    ok: false,
    error: result.error ?? "Purchase canceled or failed",
  };
}

export function serializeBridgeResponse(response: PurchaseBridgeResponse): string {
  return JSON.stringify(response);
}
