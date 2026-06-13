import { Stack, useLocalSearchParams } from "expo-router";
import { PlantPalWebView } from "@/components/PlantPalWebView";

export default function WebScreen() {
  const { path } = useLocalSearchParams<{ path?: string | string[] }>();
  const webPath = Array.isArray(path) ? path[0] : path ?? "/";

  return (
    <>
      <Stack.Screen options={{ title: "PlantPal", headerBackTitle: "Back" }} />
      <PlantPalWebView path={webPath} />
    </>
  );
}
