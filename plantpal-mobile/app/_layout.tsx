import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { AuthProvider } from "@/providers/AuthProvider";
import { PurchasesProvider } from "@/providers/PurchasesProvider";
import { Brand } from "@/lib/theme";
import { registerForPushNotifications } from "@/lib/notifications";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      void registerForPushNotifications();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <PurchasesProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Brand.background },
            headerTintColor: Brand.primary,
            contentStyle: { backgroundColor: Brand.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="web" options={{ title: "PlantPal" }} />
          <Stack.Screen name="login" options={{ title: "Sign in", presentation: "modal" }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </PurchasesProvider>
    </AuthProvider>
  );
}
