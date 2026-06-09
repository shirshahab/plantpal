import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Brand } from "@/lib/theme";

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "primary",
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  style?: ViewStyle;
}) {
  return (
    <Pressable
      style={[
        styles.btn,
        variant === "primary" && styles.btnPrimary,
        variant === "secondary" && styles.btnSecondary,
        variant === "outline" && styles.btnOutline,
        disabled && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.btnText,
          variant === "primary" && styles.btnTextPrimary,
          variant === "secondary" && styles.btnTextSecondary,
          variant === "outline" && styles.btnTextOutline,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function AiSafetyDisclaimer() {
  return (
    <Text style={styles.disclaimer}>
      PlantPal can make mistakes. Use this as guidance, not certainty.
    </Text>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: Brand.text,
  },
  subtitle: {
    fontSize: 14,
    color: Brand.textSecondary,
    marginTop: 4,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { fontSize: 16, fontWeight: "600" },
  btnTextPrimary: { color: Brand.white },
  btnTextSecondary: { color: Brand.primary },
  btnTextOutline: { color: Brand.primary },
  btnPrimary: {
    backgroundColor: Brand.primary,
  },
  btnSecondary: {
    backgroundColor: Brand.sage + "33",
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: Brand.primary,
    backgroundColor: Brand.white,
  },
  btnDisabled: { opacity: 0.5 },
  disclaimer: {
    fontSize: 12,
    color: Brand.warning,
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 10,
    marginVertical: 8,
  },
});
