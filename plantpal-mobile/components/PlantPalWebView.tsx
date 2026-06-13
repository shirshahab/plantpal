import { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, BackHandler, Platform, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { useAuth } from "@/providers/AuthProvider";
import { getApiBaseUrl } from "@/lib/config";
import { buildBridgeInjectScript } from "@/lib/purchase-bridge-script";
import {
  handlePurchaseBridgeMessage,
  type PurchaseBridgeResponse,
} from "@/lib/purchase-bridge";
import { loginRevenueCat, isRevenueCatConfigured } from "@/lib/revenuecat";
import { purchaseLog } from "@/lib/purchase-logger";
import { Brand } from "@/lib/theme";

interface PlantPalWebViewProps {
  path?: string;
}

export function PlantPalWebView({ path = "/" }: PlantPalWebViewProps) {
  const webRef = useRef<WebView>(null);
  const { user } = useAuth();
  const apiBase = getApiBaseUrl();
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const uri = `${apiBase}${normalizedPath}`;

  const userAgentSuffix = platform === "ios" ? "PlantPal/iOS" : "PlantPal/Android";

  useEffect(() => {
    if (user?.id) {
      void loginRevenueCat(user.id);
    }
  }, [user?.id]);

  const injectScript = useMemo(() => buildBridgeInjectScript(platform), [platform]);

  const sendResponse = useCallback((response: PurchaseBridgeResponse) => {
    const serialized = JSON.stringify(response);
    webRef.current?.injectJavaScript(`
      (function() {
        try {
          var msg = ${serialized};
          if (window.__plantPalPurchaseBridge) {
            window.__plantPalPurchaseBridge.handleResponse(msg);
          }
          if (window.ReactNativeWebView && window.dispatchEvent) {
            window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(msg) }));
          }
        } catch (e) {}
      })();
      true;
    `);
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      void handlePurchaseBridgeMessage(event.nativeEvent.data, sendResponse);
    },
    [sendResponse]
  );

  const onLoadEnd = useCallback(() => {
    purchaseLog("webview_loaded", {
      path: normalizedPath,
      revenueCat: isRevenueCatConfigured(),
    });
    if (user?.id) {
      webRef.current?.injectJavaScript(`
        if (window.PlantPalPurchases && window.PlantPalPurchases.configure) {
          window.PlantPalPurchases.configure(${JSON.stringify(user.id)});
        }
        true;
      `);
    }
  }, [normalizedPath, user?.id]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      webRef.current?.injectJavaScript(`
        (function() {
          if (window.PlantPalBack && window.PlantPalBack.requestClose()) {
            return;
          }
          window.dispatchEvent(new Event("plantpal:back"));
          if (window.history.length > 1) {
            window.history.back();
            return;
          }
        })();
        true;
      `);
      return true;
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ uri }}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={injectScript}
        onMessage={onMessage}
        onLoadEnd={onLoadEnd}
        applicationNameForUserAgent={userAgentSuffix}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={Brand.primary} size="large" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  webview: { flex: 1 },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.background,
  },
});
