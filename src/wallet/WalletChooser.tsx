import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ActionButton } from "../components/ActionButton";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { PHANTOM_DEEPLINK_WALLET, SOLFLARE_DEEPLINK_WALLET, type DeeplinkWalletConfig } from "./DeeplinkTransport";

// Minimal two-button wallet choice at the connect action (ADR-0063 amendment 3
// — no separate picker screen). Rendered by the iOS transport bridge, so the
// chooser is an adapter concern: screens still see the 4-member WalletTransport
// and change zero lines. Always mounted — `visible` only toggles the Modal —
// so the iOS tree keeps one stable shape (the React #310 class of bug this
// seam exists to prevent).

type WalletChooserProps = Readonly<{
  visible: boolean;
  onChoose: (walletId: DeeplinkWalletConfig["id"]) => void;
  onCancel: () => void;
}>;

export function WalletChooser({ visible, onChoose, onCancel }: WalletChooserProps) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} statusBarTranslucent transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Cancel wallet selection"
          accessibilityRole="button"
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Connect a wallet</Text>
          <Text style={styles.help}>Choose the wallet app that holds your Solana account.</Text>
          <ActionButton
            accessibilityLabel={`Connect with ${PHANTOM_DEEPLINK_WALLET.label}`}
            onPress={() => onChoose(PHANTOM_DEEPLINK_WALLET.id)}
          >
            {PHANTOM_DEEPLINK_WALLET.label}
          </ActionButton>
          <ActionButton
            accessibilityLabel={`Connect with ${SOLFLARE_DEEPLINK_WALLET.label}`}
            onPress={() => onChoose(SOLFLARE_DEEPLINK_WALLET.id)}
            style={styles.secondaryButton}
            variant="secondary"
          >
            {SOLFLARE_DEEPLINK_WALLET.label}
          </ActionButton>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  handle: {
    alignSelf: "center",
    backgroundColor: "rgba(13,31,20,0.12)",
    borderRadius: 2,
    height: 4,
    marginBottom: 12,
    width: 36,
  },
  help: {
    color: colors.textSoft,
    fontFamily: fonts.sansSemibold,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22,23,15,0.55)",
    justifyContent: "flex-end",
  },
  secondaryButton: {
    marginTop: 10,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 2,
    paddingBottom: 44,
    paddingHorizontal: 20,
    paddingTop: 10,
    width: "100%",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
});
