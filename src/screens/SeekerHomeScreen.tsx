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
import { getFundWiseLinkLabel, parseFundWiseLink } from "../lib/fundwise-link";
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
  const incomingLink = useIncomingFundWiseLink();
  const [health, setHealth] = useState<HealthState>("checking");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteResult, setInviteResult] = useState<InviteLookup | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [walletRoundTrip, setWalletRoundTrip] = useState<"idle" | "backgrounded" | "returned">("idle");

  const walletAddress = account?.address.toBase58() ?? null;
  const normalizedInviteCode = useMemo(() => extractInviteCode(inviteCode), [inviteCode]);
  const latestLinkIntent = useMemo(
    () => (incomingLink.url ? parseFundWiseLink(incomingLink.url, FUNDWISE_WEB_URL) : null),
    [incomingLink.url],
  );

  const latestLinkLabel = latestLinkIntent ? getFundWiseLinkLabel(latestLinkIntent) : null;

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

  useEffect(() => {
    if (!latestLinkIntent?.inviteCode) {
      return;
    }

    setInviteCode((currentInviteCode) => currentInviteCode || latestLinkIntent.inviteCode || "");
  }, [latestLinkIntent?.inviteCode]);

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

  function openLatestLink() {
    if (latestLinkIntent?.url || incomingLink.url) {
      void Linking.openURL(latestLinkIntent?.url || incomingLink.url || "");
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
          <ActionButton
            onPress={() => void connect()}
            disabled={!isOnline || Boolean(walletAddress)}
            style={styles.buttonGridButton}
          >
            Connect
          </ActionButton>
          <ActionButton
            onPress={() => void disconnect()}
            disabled={!walletAddress}
            variant="secondary"
            style={styles.buttonGridButton}
          >
            Disconnect
          </ActionButton>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>FundWise</Text>
        <ActionButton onPress={openGroups}>Open Groups</ActionButton>
        {incomingLink.loading ? (
          <Text style={styles.metaText}>Checking latest app link</Text>
        ) : latestLinkIntent ? (
          <View style={styles.linkSummary}>
            <Text style={styles.intentText}>{latestLinkLabel}</Text>
            {latestLinkIntent.groupId ? (
              <Text style={styles.metaText}>Group: {shortAddress(latestLinkIntent.groupId, 7)}</Text>
            ) : null}
            {latestLinkIntent.settleFrom && latestLinkIntent.settleTo ? (
              <Text style={styles.metaText}>
                Settlement: {shortAddress(latestLinkIntent.settleFrom, 4)} to{" "}
                {shortAddress(latestLinkIntent.settleTo, 4)}
              </Text>
            ) : null}
            {incomingLink.source ? (
              <Text style={styles.metaText}>
                Source: {incomingLink.source === "storage" ? "saved link" : "app link"}
              </Text>
            ) : null}
            <Text style={styles.linkText} numberOfLines={2}>
              {latestLinkIntent.url}
            </Text>
            <View style={styles.buttonGrid}>
              <ActionButton onPress={openLatestLink} style={styles.buttonGridButton}>
                Open Link
              </ActionButton>
              <ActionButton
                onPress={() => void incomingLink.clear()}
                variant="secondary"
                style={styles.buttonGridButton}
              >
                Clear
              </ActionButton>
            </View>
          </View>
        ) : (
          <Text style={styles.metaText}>No recent FundWise link</Text>
        )}
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
          <ActionButton
            onPress={handleLookupInvite}
            disabled={!normalizedInviteCode || inviteLoading}
            style={styles.buttonGridButton}
          >
            {inviteLoading ? "Checking" : "Check"}
          </ActionButton>
          <ActionButton
            onPress={openInvite}
            disabled={!normalizedInviteCode}
            variant="secondary"
            style={styles.buttonGridButton}
          >
            Open
          </ActionButton>
        </View>
        {inviteLoading ? <ActivityIndicator color={colors.accent} /> : null}
        {inviteResult?.group ? (
          <View style={styles.resultBlock}>
            <Text style={styles.resultText}>{inviteResult.group.name}</Text>
            <Text style={styles.metaText}>
              {inviteResult.group.mode === "fund" ? "Fund Mode" : "Split Mode"} Group
            </Text>
          </View>
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
  buttonGridButton: {
    flex: 1,
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
  linkSummary: {
    gap: 8,
  },
  intentText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "800",
  },
  resultBlock: {
    gap: 4,
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
