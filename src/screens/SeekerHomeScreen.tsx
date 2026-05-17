import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ActionButton } from "../components/ActionButton";
import { StatusPill } from "../components/StatusPill";
import { FUNDWISE_WEB_URL, SOLANA_CHAIN } from "../config";
import { useIncomingFundWiseLink } from "../hooks/useIncomingFundWiseLink";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { getHealth, lookupInvite, type InviteLookup } from "../lib/fundwise-api";
import { shortAddress } from "../lib/short-address";
import { colors } from "../theme/colors";

type HealthState = "checking" | "online" | "offline";

function buildWebUrl(path: string) {
  return `${FUNDWISE_WEB_URL}${path}`;
}

function extractInviteCode(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    return url.searchParams.get("code") || url.pathname.split("/").filter(Boolean).at(-1) || trimmed;
  } catch {
    return trimmed;
  }
}

export function SeekerHomeScreen() {
  const { account, connect, disconnect } = useMobileWallet();
  const isOnline = useNetworkStatus();
  const incomingUrl = useIncomingFundWiseLink();
  const [health, setHealth] = useState<HealthState>("checking");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteResult, setInviteResult] = useState<InviteLookup | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [walletRoundTrip, setWalletRoundTrip] = useState<"idle" | "backgrounded" | "returned">("idle");

  const walletAddress = account?.address.toBase58() ?? null;
  const normalizedInviteCode = useMemo(() => extractInviteCode(inviteCode), [inviteCode]);

  useEffect(() => {
    let cancelled = false;

    getHealth().then((result) => {
      if (!cancelled) {
        setHealth(result.ok ? "online" : "offline");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let wasBackgrounded = false;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background") {
        wasBackgrounded = true;
        setWalletRoundTrip("backgrounded");
        return;
      }

      if (wasBackgrounded && nextState === "active") {
        setWalletRoundTrip("returned");
      }
    });

    return () => subscription.remove();
  }, []);

  async function handleLookupInvite() {
    if (!normalizedInviteCode) {
      return;
    }

    setInviteLoading(true);
    const result = await lookupInvite(normalizedInviteCode);
    setInviteLoading(false);
    setInviteResult(result.ok ? result.data : { error: result.error });
  }

  function openGroups() {
    void Linking.openURL(buildWebUrl("/groups"));
  }

  function openIncomingLink() {
    if (incomingUrl) {
      void Linking.openURL(incomingUrl);
    }
  }

  function openInvite() {
    if (normalizedInviteCode) {
      void Linking.openURL(buildWebUrl(`/groups?code=${encodeURIComponent(normalizedInviteCode)}`));
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>FundWise Seeker</Text>
        <Text style={styles.title}>Groups, balances, settlement</Text>
      </View>

      <View style={styles.statusRow}>
        <StatusPill label={isOnline ? "Network online" : "Network offline"} tone={isOnline ? "ok" : "warn"} />
        <StatusPill
          label={health === "checking" ? "API checking" : health === "online" ? "API online" : "API offline"}
          tone={health === "online" ? "ok" : health === "offline" ? "warn" : "idle"}
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Wallet</Text>
        <Text style={styles.walletText}>
          {walletAddress ? shortAddress(walletAddress, 6) : "No wallet connected"}
        </Text>
        <Text style={styles.metaText}>Cluster: {SOLANA_CHAIN.replace("solana:", "")}</Text>
        {walletRoundTrip !== "idle" ? (
          <Text style={styles.metaText}>
            Wallet handoff: {walletRoundTrip === "backgrounded" ? "waiting" : "returned"}
          </Text>
        ) : null}
        <View style={styles.buttonGrid}>
          <ActionButton onPress={() => void connect()} disabled={!isOnline || Boolean(walletAddress)}>
            Connect
          </ActionButton>
          <ActionButton
            onPress={() => void disconnect()}
            disabled={!walletAddress}
            variant="secondary"
          >
            Disconnect
          </ActionButton>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>FundWise</Text>
        <View style={styles.buttonStack}>
          <ActionButton onPress={openGroups}>Open Groups</ActionButton>
          {incomingUrl ? (
            <ActionButton onPress={openIncomingLink} variant="secondary">
              Open Latest Link
            </ActionButton>
          ) : null}
        </View>
        {incomingUrl ? <Text style={styles.linkText} numberOfLines={2}>{incomingUrl}</Text> : null}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Invite</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setInviteCode}
          placeholder="Invite code or FundWise link"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={inviteCode}
        />
        <View style={styles.buttonGrid}>
          <ActionButton onPress={handleLookupInvite} disabled={!normalizedInviteCode || inviteLoading}>
            {inviteLoading ? "Checking" : "Check"}
          </ActionButton>
          <ActionButton onPress={openInvite} disabled={!normalizedInviteCode} variant="secondary">
            Open
          </ActionButton>
        </View>
        {inviteLoading ? <ActivityIndicator color={colors.accent} /> : null}
        {inviteResult?.group ? (
          <Text style={styles.resultText}>{inviteResult.group.name}</Text>
        ) : null}
        {inviteResult?.error ? <Text style={styles.errorText}>{inviteResult.error}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 14,
    padding: 18,
  },
  header: {
    gap: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  panel: {
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: 14,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  walletText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  buttonGrid: {
    flexDirection: "row",
    gap: 10,
  },
  buttonStack: {
    gap: 10,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.bg,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 12,
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  resultText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "800",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "700",
  },
});
