import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { ScreenHeader, PrimaryButton, AiSafetyDisclaimer } from "@/components/ui";
import { Brand } from "@/lib/theme";
import { identifyPlant, type IdentifyResult } from "@/lib/api";
import { useRouter } from "expo-router";

async function uriToBase64DataUrl(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const ext = uri.toLowerCase().includes(".png") ? "png" : "jpeg";
  return `data:image/${ext};base64,${base64}`;
}

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function captureAndIdentify() {
    if (!cameraRef.current) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      if (!photo?.uri) throw new Error("Could not capture photo");
      const dataUrl = await uriToBase64DataUrl(photo.uri);
      const res = await identifyPlant(dataUrl);
      if (!res.ok || !res.data) {
        setError(res.error ?? "Identification failed");
      } else {
        setResult(res.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Brand.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is needed to scan plants.</Text>
        <PrimaryButton label="Allow camera" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Scan" subtitle="Identify plants with Live AI + Pl@ntNet" />
      <AiSafetyDisclaimer />

      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      </View>

      <PrimaryButton
        label={loading ? "Identifying…" : "Capture & identify"}
        onPress={captureAndIdentify}
        disabled={loading}
      />

      {loading && <ActivityIndicator color={Brand.primary} style={{ marginTop: 16 }} />}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>
            Ensure EXPO_PUBLIC_API_URL points to your deployed PlantPal backend with OPENAI_API_KEY set.
          </Text>
        </View>
      )}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Best match</Text>
          <Text style={styles.resultName}>{result.common_name}</Text>
          <Text style={styles.resultSpecies}>{result.scientific_name}</Text>
          <Text style={styles.confidence}>{result.confidence_score}% confidence</Text>
          {result.identification_rationale ? (
            <Text style={styles.rationale}>{result.identification_rationale}</Text>
          ) : null}
          {result.top_matches && result.top_matches.length > 1 && (
            <View style={styles.altWrap}>
              <Text style={styles.altTitle}>Other possibilities</Text>
              {result.top_matches.slice(1, 4).map((m, i) => (
                <Text key={i} style={styles.altItem}>
                  • {m.common_name}
                </Text>
              ))}
            </View>
          )}
          <PrimaryButton
            label="Add to garden"
            onPress={() => {
              router.push({
                pathname: "/(tabs)/add",
                params: { species: result.scientific_name, name: result.common_name },
              });
            }}
          />
          <PrimaryButton label="Scan again" onPress={() => setResult(null)} variant="outline" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  permText: { textAlign: "center", marginBottom: 16, color: Brand.textSecondary },
  cameraWrap: { borderRadius: 16, overflow: "hidden", marginVertical: 12 },
  camera: { width: "100%", height: 320 },
  errorBox: {
    backgroundColor: "#FEE2E2",
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  errorText: { color: Brand.danger, fontWeight: "600" },
  errorHint: { color: Brand.textSecondary, fontSize: 12, marginTop: 6 },
  resultBox: {
    backgroundColor: Brand.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  resultLabel: { fontSize: 11, fontWeight: "700", color: Brand.primary, textTransform: "uppercase" },
  resultName: { fontSize: 22, fontWeight: "700", color: Brand.text, marginTop: 4 },
  resultSpecies: { fontSize: 14, color: Brand.textSecondary, fontStyle: "italic" },
  confidence: { fontSize: 13, color: Brand.primary, fontWeight: "600", marginTop: 8 },
  rationale: { fontSize: 14, color: Brand.text, marginTop: 10, lineHeight: 20 },
  altWrap: { marginTop: 12 },
  altTitle: { fontSize: 12, fontWeight: "600", color: Brand.textSecondary },
  altItem: { fontSize: 13, color: Brand.text, marginTop: 4 },
});
