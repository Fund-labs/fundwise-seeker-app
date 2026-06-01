import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type StatusPillProps = {
  label: string;
  tone?: "ok" | "warn" | "idle";
};

export function StatusPill({ label, tone = "idle" }: StatusPillProps) {
  return (
    <View style={[styles.pill, styles[tone]]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ok: {
    backgroundColor: colors.primary,
    borderColor: colors.border,
  },
  warn: {
    backgroundColor: colors.warningPale,
    borderColor: colors.border,
  },
  idle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
});
