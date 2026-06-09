import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { PrimaryButton, ScreenHeader } from "@/components/ui";
import { Brand } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    const fn = mode === "signin" ? signIn : signUp;
    const result = await fn(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.replace("/(tabs)/garden");
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>🌿</Text>
        <ScreenHeader title="PlantPal" subtitle="Sign in to sync your garden" />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={Brand.textSecondary}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={Brand.textSecondary}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          onPress={submit}
          disabled={loading}
        />
        <PrimaryButton
          label={mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          variant="secondary"
        />
        <PrimaryButton label="Continue without account" onPress={() => router.back()} variant="outline" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 24, paddingTop: 60 },
  logo: { fontSize: 48, textAlign: "center", marginBottom: 8 },
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
  error: { color: Brand.danger, marginBottom: 10 },
});
