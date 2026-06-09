import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader, PrimaryButton } from "@/components/ui";
import { Brand } from "@/lib/theme";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function AddPlantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; species?: string }>();
  const { user, mockMode } = useAuth();
  const [name, setName] = useState(params.name ?? "");
  const [species, setSpecies] = useState(params.species ?? "");
  const [zipCode, setZipCode] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to add a plant image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow camera access to photograph your plant.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function savePlant() {
    if (!name.trim() || !species.trim()) {
      Alert.alert("Missing info", "Enter a nickname and species.");
      return;
    }
    const supabase = getSupabase();
    if (!supabase || mockMode || !user) {
      Alert.alert(
        "Sign in required",
        "Log in with Supabase to save plants to your cloud garden."
      );
      router.push("/login");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("plants").insert({
      user_id: user.id,
      name: name.trim(),
      species: species.trim(),
      zip_code: zipCode.trim() || "00000",
      location_type: "indoor",
      planting_type: "pot",
      sun_exposure: "partial_sun",
      health_status: "healthy",
      image: photoUri ?? null,
    });
    setSaving(false);

    if (error) {
      Alert.alert("Could not save", error.message);
      return;
    }

    Alert.alert("Plant added", `${name} is in your garden.`);
    setName("");
    setSpecies("");
    setPhotoUri(null);
    router.push("/(tabs)/garden");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Add Plant" subtitle="Scan, search, or add manually" />

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} />
      ) : (
        <View style={styles.previewPlaceholder}>
          <Text style={styles.previewText}>No photo yet</Text>
        </View>
      )}

      <View style={styles.row}>
        <PrimaryButton label="Take photo" onPress={takePhoto} variant="outline" style={styles.half} />
        <PrimaryButton label="Choose photo" onPress={pickPhoto} variant="outline" style={styles.half} />
      </View>
      <PrimaryButton
        label="Add now, photo later"
        onPress={() => setPhotoUri(null)}
        variant="secondary"
      />

      <TextInput
        style={styles.input}
        placeholder="Nickname (e.g. Kitchen Ficus)"
        placeholderTextColor={Brand.textSecondary}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Species (e.g. Ficus lyrata)"
        placeholderTextColor={Brand.textSecondary}
        value={species}
        onChangeText={setSpecies}
      />
      <TextInput
        style={styles.input}
        placeholder="ZIP code"
        placeholderTextColor={Brand.textSecondary}
        keyboardType="number-pad"
        value={zipCode}
        onChangeText={setZipCode}
        maxLength={5}
      />

      <PrimaryButton
        label={saving ? "Saving…" : "Save plant"}
        onPress={savePlant}
        disabled={saving}
      />
      <PrimaryButton
        label="Scan to identify first"
        onPress={() => router.push("/(tabs)/scan")}
        variant="secondary"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, paddingBottom: 40 },
  preview: { width: "100%", height: 180, borderRadius: 16, marginBottom: 12 },
  previewPlaceholder: {
    height: 180,
    borderRadius: 16,
    backgroundColor: Brand.sage + "33",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  previewText: { color: Brand.textSecondary },
  row: { flexDirection: "row", gap: 8, marginBottom: 8 },
  half: { flex: 1 },
  input: {
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 10,
    color: Brand.text,
  },
});
