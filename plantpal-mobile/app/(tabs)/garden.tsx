import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScreenHeader, PrimaryButton } from "@/components/ui";
import { Brand } from "@/lib/theme";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Link } from "expo-router";

interface PlantRow {
  id: string;
  name: string;
  species: string;
  health_status: string;
}

export default function GardenScreen() {
  const { mockMode } = useAuth();
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlants = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || mockMode) {
      setPlants([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("plants")
      .select("id, name, species, health_status")
      .order("created_at", { ascending: false });
    if (!error && data) setPlants(data as PlantRow[]);
    setLoading(false);
  }, [mockMode]);

  useEffect(() => {
    void loadPlants();
  }, [loadPlants]);

  async function onRefresh() {
    setRefreshing(true);
    await loadPlants();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerPad}>
        <ScreenHeader
          title="Garden"
          subtitle={
            mockMode
              ? "Connect Supabase to sync your plants"
              : `${plants.length} plant${plants.length === 1 ? "" : "s"}`
          }
        />
      </View>

      {loading ? (
        <ActivityIndicator color={Brand.primary} style={{ marginTop: 40 }} />
      ) : plants.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>Start your garden</Text>
          <Text style={styles.emptyBody}>
            Add your first plant or scan one with your camera.
          </Text>
          <Link href="/(tabs)/add" asChild>
            <PrimaryButton label="Add plant" onPress={() => {}} />
          </Link>
        </View>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.plantCard}>
              <Text style={styles.plantName}>{item.name}</Text>
              <Text style={styles.plantSpecies}>{item.species}</Text>
              <Text style={styles.plantHealth}>{item.health_status.replace("_", " ")}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  headerPad: { paddingHorizontal: 16, paddingTop: 8 },
  list: { padding: 16, paddingBottom: 32 },
  plantCard: {
    backgroundColor: Brand.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  plantName: { fontSize: 17, fontWeight: "700", color: Brand.text },
  plantSpecies: { fontSize: 13, color: Brand.textSecondary, fontStyle: "italic", marginTop: 2 },
  plantHealth: {
    fontSize: 12,
    color: Brand.primary,
    fontWeight: "600",
    marginTop: 8,
    textTransform: "capitalize",
  },
  empty: { alignItems: "center", padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: Brand.text },
  emptyBody: {
    fontSize: 14,
    color: Brand.textSecondary,
    textAlign: "center",
    marginVertical: 12,
    lineHeight: 20,
  },
});
