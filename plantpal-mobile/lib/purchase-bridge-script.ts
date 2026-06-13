import type { StorePlatform } from "./revenuecat";

/**
 * Injected into WebView before page load.
 * Exposes window.PlantPalPurchases and routes calls through ReactNativeWebView postMessage.
 */
export function buildBridgeInjectScript(platform: StorePlatform): string {
  return `
(function () {
  if (window.PlantPalPurchases && window.PlantPalPurchases.isAvailable) return;

  var pending = {};
  var requestCounter = 0;

  function nextRequestId() {
    requestCounter += 1;
    return "pp_" + Date.now() + "_" + requestCounter;
  }

  function callNative(action, payload) {
    return new Promise(function (resolve, reject) {
      if (!window.ReactNativeWebView || !window.ReactNativeWebView.postMessage) {
        reject(new Error("Native bridge unavailable"));
        return;
      }
      var requestId = nextRequestId();
      pending[requestId] = { resolve: resolve, reject: reject };
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "PLANTPAL_PURCHASE_REQUEST",
        requestId: requestId,
        action: action,
        payload: payload || {}
      }));
    });
  }

  window.__plantPalPurchaseBridge = {
    handleResponse: function (msg) {
      if (!msg || msg.type !== "PLANTPAL_PURCHASE_RESPONSE") return;
      var entry = pending[msg.requestId];
      if (!entry) return;
      delete pending[msg.requestId];
      if (msg.ok) {
        entry.resolve(msg.payload);
      } else {
        entry.reject(new Error(msg.error || "Purchase canceled or failed"));
      }
    }
  };

  function wrapPurchaseResult(promise) {
    return promise.then(function (payload) {
      if (payload && payload.ok === false) {
        return { ok: false, error: payload.error || "Purchase canceled or failed" };
      }
      if (payload && payload.customerInfo) {
        return { ok: true, customerInfo: payload.customerInfo };
      }
      if (payload && payload.activeEntitlements) {
        return { ok: true, customerInfo: payload };
      }
      return { ok: true, customerInfo: payload };
    }).catch(function (err) {
      return { ok: false, error: (err && err.message) || "Purchase canceled or failed" };
    });
  }

  window.PlantPalPurchases = {
    isAvailable: true,
    platform: "${platform}",
    isConfigured: function () { return true; },
    configure: function (userId) {
      return callNative("configure", { userId: userId }).then(function () { return undefined; });
    },
    loadProducts: function () {
      return callNative("loadProducts", {});
    },
    purchaseProduct: function (productId) {
      return wrapPurchaseResult(callNative("purchaseProduct", { productId: productId }));
    },
    purchase: function (productId) {
      return window.PlantPalPurchases.purchaseProduct(productId);
    },
    restorePurchases: function () {
      return wrapPurchaseResult(callNative("restorePurchases", {}));
    },
    restore: function () {
      return window.PlantPalPurchases.restorePurchases();
    },
    getCurrentEntitlement: function () {
      return callNative("getCurrentEntitlement", {});
    },
    getCustomerInfo: function () {
      return window.PlantPalPurchases.getCurrentEntitlement();
    }
  };

  document.addEventListener("message", function (event) {
    try {
      var data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      window.__plantPalPurchaseBridge.handleResponse(data);
    } catch (e) {}
  });

  window.addEventListener("message", function (event) {
    try {
      var data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      window.__plantPalPurchaseBridge.handleResponse(data);
    } catch (e) {}
  });
})();
true;
`;
}
