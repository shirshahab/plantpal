import { Alert, ScrollView, StyleSheet, Text, View, Platform } from "react-native";
import * as Linking from "expo-linking";
import { ScreenHeader, PrimaryButton } from "@/components/ui";
import { Brand } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter, type Href } from "expo-router";
import { getApiBaseUrl, isSupabaseConfigured } from "@/lib/config";
import { getRevenueCatApiKey, isRevenueCatConfigured } from "@/lib/revenuecat";

const WEB_LINKS = [
  { label: "Upgrade to Pro", path: "/upgrade", inApp: true },
  { label: "Plant Doctor", path: "/doctor", inApp: false },
  { label: "Price Checker", path: "/price-checker", inApp: false },
  { label: "Today Tasks", path: "/today", inApp: true },
  { label: "Settings", path: "/settings", inApp: true },
  { label: "Tester Guide", path: "/tester-guide", inApp: false },
];

export default function MoreScreen() {
  const { user, mockMode, signOut } = useAuth();
  const router = useRouter();
  const apiUrl = getApiBaseUrl();
  const rcKey = getRevenueCatApiKey();
  const rcReady = isRevenueCatConfigured();

  function openPath(path: string, inApp: boolean) {
    if (inApp) {
      router.push(`/web?path=${encodeURIComponent(path)}` as Href);
      return;
    }
    Linking.openURL(`${apiUrl}${path}`).catch(() => {
      Alert.alert("Could not open", "Set EXPO_PUBLIC_API_URL to your PlantPal web URL.");
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="More" subtitle="Tools, settings, and subscriptions" />

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Account</Text>
        <Text style={styles.cardValue}>
          {user?.email ?? (mockMode ? "Local mode — sign in to sync" : "Not signed in")}
        </Text>
        {!user ? (
          <PrimaryButton label="Sign in" onPress={() => router.push("/login")} />
        ) : (
          <PrimaryButton label="Sign out" onPress={() => void signOut()} variant="outline" />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Store billing</Text>
        <Text style={styles.hint}>
          Platform: {Platform.OS} · RevenueCat: {rcReady ? "configured" : rcKey ? "initializing" : "key missing"}
        </Text>
        {__DEV__ && (
          <Text style={styles.mono}>
            {rcKey ? "SDK key present" : "Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY or EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY"}
          </Text>
        )}
        <PrimaryButton
          label="Upgrade (in-app paywall)"
          onPress={() => openPath("/upgrade", true)}
          style={styles.linkBtn}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Backend</Text>
        <Text style={styles.mono} numberOfLines={2}>
          {apiUrl}
        </Text>
        <Text style={styles.hint}>
          Supabase: {isSupabaseConfigured() ? "configured" : "not configured"}
        </Text>
      </View>

      <Text style={styles.section}>Open in app browser</Text>
      {WEB_LINKS.filter((l) => l.inApp).map((link) => (
        <PrimaryButton
          key={link.path}
          label={link.label}
          onPress={() => openPath(link.path, true)}
          variant="secondary"
          style={styles.linkBtn}
        />
      ))}

      <Text style={styles.section}>Open in system browser</Text>
      {WEB_LINKS.filter((l) => !l.inApp).map((link) => (
        <PrimaryButton
          key={link.path}
          label={link.label}
          onPress={() => openPath(link.path, false)}
          variant="outline"
          style={styles.linkBtn}
        />
      ))}

      <Text style={styles.version}>PlantPal Mobile v1.0.0 · {Brand.tagline}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Brand.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardLabel: { fontSize: 11, fontWeight: "700", color: Brand.textSecondary, textTransform: "uppercase" },
  cardValue: { fontSize: 15, color: Brand.text, marginVertical: 6 },
  mono: { fontSize: 11, color: Brand.textSecondary, fontFamily: "monospace" },
  hint: { fontSize: 12, color: Brand.textSecondary, marginTop: 4 },
  section: { fontSize: 13, fontWeight: "700", color: Brand.text, marginVertical: 8 },
  linkBtn: { marginBottom: 8 },
  version: { textAlign: "center", fontSize: 12, color: Brand.textSecondary, marginTop: 16 },
});
