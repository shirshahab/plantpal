import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader, PrimaryButton } from "@/components/ui";
import { Brand } from "@/lib/theme";
import { Link } from "expo-router";

const PATHS = [
  { id: "basics", title: "Plant Care Basics", lessons: 5, emoji: "🌱" },
  { id: "watering", title: "Watering Mastery", lessons: 4, emoji: "💧" },
  { id: "pests", title: "Pest & Disease", lessons: 6, emoji: "🐛" },
  { id: "fruit", title: "Fruit Trees", lessons: 5, emoji: "🍊" },
];

export default function AcademyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Academy"
        subtitle="Learn and earn XP — synced with web Academy"
      />
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🎓</Text>
        <Text style={styles.heroTitle}>Daily lesson</Text>
        <Text style={styles.heroBody}>
          Complete one short lesson to build your gardening skills. Progress syncs when you use the same account on web and mobile.
        </Text>
        <PrimaryButton label="Start today's lesson" onPress={() => {}} />
      </View>
      {PATHS.map((path) => (
        <View key={path.id} style={styles.pathCard}>
          <Text style={styles.pathEmoji}>{path.emoji}</Text>
          <View style={styles.pathInfo}>
            <Text style={styles.pathTitle}>{path.title}</Text>
            <Text style={styles.pathMeta}>{path.lessons} lessons</Text>
          </View>
        </View>
      ))}
      <Text style={styles.note}>
        Full lesson content loads from your PlantPal web backend. Open the PWA for interactive quizzes until native lessons ship.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: Brand.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  heroEmoji: { fontSize: 32, marginBottom: 8 },
  heroTitle: { fontSize: 18, fontWeight: "700", color: Brand.text },
  heroBody: { fontSize: 14, color: Brand.textSecondary, marginVertical: 8, lineHeight: 20 },
  pathCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pathEmoji: { fontSize: 28, marginRight: 12 },
  pathInfo: { flex: 1 },
  pathTitle: { fontSize: 15, fontWeight: "600", color: Brand.text },
  pathMeta: { fontSize: 12, color: Brand.textSecondary, marginTop: 2 },
  note: { fontSize: 12, color: Brand.textSecondary, marginTop: 12, lineHeight: 18 },
});
