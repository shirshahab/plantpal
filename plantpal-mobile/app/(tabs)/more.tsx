import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader, PrimaryButton } from "@/components/ui";
import { Brand } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "expo-router";
import { getApiBaseUrl, isSupabaseConfigured } from "@/lib/config";
import * as Linking from "expo-linking";

const LINKS = [
  { label: "Plant Doctor", path: "/doctor" },
  { label: "Price Checker", path: "/price-checker" },
  { label: "Today Tasks", path: "/today" },
  { label: "Beta Start", path: "/beta-start" },
  { label: "Tester Guide", path: "/tester-guide" },
  { label: "Settings", path: "/settings" },
];

export default function MoreScreen() {
  const { user, mockMode, signOut } = useAuth();
  const router = useRouter();
  const apiUrl = getApiBaseUrl();

  function openWebPath(path: string) {
    Linking.openURL(`${apiUrl}${path}`).catch(() => {
      Alert.alert("Could not open", `Set EXPO_PUBLIC_API_URL to your PlantPal web URL.`);
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="More" subtitle="Tools, settings, and web features" />

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
        <Text style={styles.cardLabel}>Backend</Text>
        <Text style={styles.mono} numberOfLines={2}>
          {apiUrl}
        </Text>
        <Text style={styles.hint}>
          Supabase: {isSupabaseConfigured() ? "configured" : "not configured"}
        </Text>
      </View>

      <Text style={styles.section}>Open in web app</Text>
      {LINKS.map((link) => (
        <PrimaryButton
          key={link.path}
          label={link.label}
          onPress={() => openWebPath(link.path)}
          variant="secondary"
          style={styles.linkBtn}
        />
      ))}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Push notifications</Text>
        <Text style={styles.hint}>Coming soon — daily care reminders</Text>
      </View>

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
