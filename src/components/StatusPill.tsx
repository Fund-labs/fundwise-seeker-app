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
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ok: {
    backgroundColor: "rgba(20, 241, 149, 0.16)",
  },
  warn: {
    backgroundColor: "rgba(245, 183, 89, 0.16)",
  },
  idle: {
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
});
