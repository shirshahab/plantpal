import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader, PrimaryButton } from "@/components/ui";
import { Brand } from "@/lib/theme";

export default function TodayScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Today"
        subtitle="Your daily care command center"
      />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>No tasks due right now</Text>
        <Text style={styles.cardBody}>
          Add plants to your garden to get personalized watering and care reminders.
        </Text>
        <PrimaryButton label="View garden" onPress={() => router.push("/(tabs)/garden")} variant="secondary" />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick tip</Text>
        <Text style={styles.cardBody}>
          Check soil moisture before watering — most plants prefer the top inch to dry out first.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: Brand.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Brand.text, marginBottom: 6 },
  cardBody: { fontSize: 14, color: Brand.textSecondary, lineHeight: 20, marginBottom: 12 },
});
