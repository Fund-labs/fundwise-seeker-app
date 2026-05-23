import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  Share,
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
import { getFundWiseLinkLabel, parseFundWiseLink, type FundWiseLinkIntent } from "../lib/fundwise-link";
import { getSeekerDeviceInfo } from "../lib/seeker-device";
import { shortAddress } from "../lib/short-address";
import { colors } from "../theme/colors";

type HealthState = "checking" | "online" | "offline";
type WalletState = "idle" | "connecting" | "connected" | "error";

function buildWebUrl(path: string) {
  return `${FUNDWISE_WEB_URL}${path}`;
}

function extractInviteCode(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed, FUNDWISE_WEB_URL);
    return url.searchParams.get("code") || url.pathname.split("/").filter(Boolean).at(-1) || trimmed;
  } catch {
    return trimmed;
  }
}

function formatWalletError(error: unknown) {
  if (error instanceof Error) {
    return error.message || "Wallet connection did not complete.";
  }

  return "Wallet connection did not complete.";
}

function StrataMark() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.mark}>
      <View style={[styles.markSlab, styles.markTop]} />
      <View style={[styles.markSlab, styles.markMiddle]} />
      <View style={[styles.markSlab, styles.markBottom]} />
    </View>
  );
}

function Header({ walletAddress }: { walletAddress: string | null }) {
  return (
    <View style={styles.header}>
      <View style={styles.lockup}>
        <StrataMark />
        <View>
          <Text style={styles.wordmark}>FundWise</Text>
          <Text style={styles.headerMeta}>Android wallet companion</Text>
        </View>
      </View>
      <View style={styles.walletBadge}>
        <Text style={styles.walletBadgeText}>{walletAddress ? shortAddress(walletAddress, 4) : "No wallet"}</Text>
      </View>
    </View>
  );
}

function LinkSummary({ intent }: { intent: FundWiseLinkIntent }) {
  const label = getFundWiseLinkLabel(intent);
  const detail =
    intent.kind === "invite" && intent.inviteCode
      ? `Invite ${intent.inviteCode}`
      : intent.settlementId
        ? shortAddress(intent.settlementId, 6)
        : intent.groupId
          ? shortAddress(intent.groupId, 6)
          : "FundWise web";

  return (
    <View style={styles.linkSummary}>
      <View style={styles.linkIcon}>
        <Text style={styles.linkIconText}>{intent.kind === "settlement-request" ? "$" : "FW"}</Text>
      </View>
      <View style={styles.linkCopy}>
        <Text numberOfLines={1} style={styles.linkTitle}>
          {label}
        </Text>
        <Text numberOfLines={1} style={styles.linkDetail}>
          {detail}
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{label}</Text>
      {value ? <Text style={styles.sectionValue}>{value}</Text> : null}
    </View>
  );
}

export function SeekerHomeScreen() {
  const { account, connect, disconnect } = useMobileWallet();
  const isOnline = useNetworkStatus();
  const incomingLink = useIncomingFundWiseLink();
  const seekerDeviceInfo = useMemo(() => getSeekerDeviceInfo(), []);
  const [health, setHealth] = useState<HealthState>("checking");
  const [linkInput, setLinkInput] = useState("");
  const [inviteResult, setInviteResult] = useState<InviteLookup | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [walletState, setWalletState] = useState<WalletState>("idle");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [handoffState, setHandoffState] = useState<"idle" | "wallet-opened" | "returned">("idle");
  const [shareError, setShareError] = useState<string | null>(null);

  const walletAddress = account?.address.toBase58() ?? null;
  const normalizedInviteCode = useMemo(() => extractInviteCode(linkInput), [linkInput]);
  const pastedIntent = useMemo(() => parseFundWiseLink(linkInput, FUNDWISE_WEB_URL), [linkInput]);
  const latestIntent = useMemo(
    () => (incomingLink.url ? parseFundWiseLink(incomingLink.url, FUNDWISE_WEB_URL) : null),
    [incomingLink.url],
  );
  const activeIntent = pastedIntent || latestIntent;
  const inviteUrl = normalizedInviteCode ? buildWebUrl(`/groups?code=${encodeURIComponent(normalizedInviteCode)}`) : "";
  const continuationUrl = activeIntent?.url || inviteUrl || buildWebUrl("/groups");
  const walletLabel =
    walletState === "connecting"
      ? "Opening wallet"
      : walletAddress
        ? shortAddress(walletAddress, 6)
        : "Connect wallet";
  const deviceLabel = seekerDeviceInfo.isSeekerDevice ? "Seeker" : seekerDeviceInfo.model || "Android";
  const apiLabel = health === "checking" ? "Checking" : health === "online" ? "Online" : "Offline";

  useEffect(() => {
    setWalletState(walletAddress ? "connected" : "idle");
  }, [walletAddress]);

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
    let wasAway = false;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (walletState !== "connecting") {
        return;
      }

      if (nextState === "background" || nextState === "inactive") {
        wasAway = true;
        setHandoffState("wallet-opened");
      }

      if (wasAway && nextState === "active") {
        setHandoffState("returned");
      }
    });

    return () => subscription.remove();
  }, [walletState]);

  useEffect(() => {
    if (!latestIntent?.inviteCode) {
      return;
    }

    setLinkInput((current) => current || latestIntent.inviteCode || "");
  }, [latestIntent?.inviteCode]);

  async function refreshHealth() {
    setHealth("checking");
    const result = await getHealth();
    setHealth(result.ok ? "online" : "offline");
  }

  async function handleConnectWallet() {
    if (walletAddress) {
      setWalletError(null);
      await disconnect();
      return;
    }

    setWalletError(null);
    setHandoffState("idle");
    setWalletState("connecting");

    try {
      const connectedAccount = await connect();
      setWalletState("connected");
      setWalletError(null);
      console.log("FundWise wallet connected", connectedAccount.address.toBase58());
    } catch (error) {
      const message = formatWalletError(error);
      setWalletState("error");
      setWalletError(message);
      console.warn("FundWise wallet connection failed", message, error);
    }
  }

  async function handleLookupInvite() {
    if (!normalizedInviteCode) {
      return;
    }

    if (!isOnline) {
      setInviteResult({ error: "You are offline. Reconnect before checking this invite." });
      return;
    }

    setInviteLoading(true);
    const result = await lookupInvite(normalizedInviteCode);
    setInviteLoading(false);
    setInviteResult(result.ok ? result.data : { error: result.error });
  }

  function openContinuation() {
    void Linking.openURL(continuationUrl);
  }

  function openGroups() {
    void Linking.openURL(buildWebUrl("/groups"));
  }

  async function shareContinuation() {
    setShareError(null);

    try {
      await Share.share({
        title: "FundWise",
        message: continuationUrl,
        url: continuationUrl,
      });
    } catch {
      setShareError("Unable to open the Android share sheet.");
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Header walletAddress={walletAddress} />

        <View style={styles.hero}>
          <Text style={styles.heroKicker}>{deviceLabel} ready</Text>
          <Text style={styles.heroTitle}>Open a group, connect a wallet, continue cleanly.</Text>
          <Text style={styles.heroCopy}>
            FundWise stays focused on shared expense links. This Android app should get you into the right group and
            hand wallet approval to a real Solana wallet.
          </Text>
          <View style={styles.statusRow}>
            <StatusPill label={walletAddress ? "Wallet connected" : "Wallet needed"} tone={walletAddress ? "ok" : "idle"} />
            <StatusPill label={isOnline ? "Network online" : "Network offline"} tone={isOnline ? "ok" : "warn"} />
            <StatusPill label={`API ${apiLabel}`} tone={health === "online" ? "ok" : health === "offline" ? "warn" : "idle"} />
          </View>
        </View>

        <View style={styles.primaryPanel}>
          <SectionHeader label="Wallet" value={SOLANA_CHAIN.replace("solana:", "")} />
          <Text style={styles.panelCopy}>
            {walletAddress
              ? "This wallet is connected for FundWise identity checks."
              : "Tap connect. Your wallet app should open for approval through Mobile Wallet Adapter."}
          </Text>
          <ActionButton
            accessibilityHint="Opens a Solana wallet through Mobile Wallet Adapter."
            accessibilityLabel={walletAddress ? "Disconnect wallet" : "Connect wallet"}
            disabled={walletState === "connecting"}
            onPress={() => void handleConnectWallet()}
          >
            {walletState === "connecting" ? "Opening wallet..." : walletAddress ? "Disconnect wallet" : "Connect wallet"}
          </ActionButton>
          <View style={styles.walletStatusBox}>
            <Text style={styles.walletStatusLabel}>Status</Text>
            <Text style={styles.walletStatusValue}>{walletLabel}</Text>
          </View>
          {handoffState !== "idle" ? (
            <Text style={styles.helperText}>
              Wallet handoff: {handoffState === "wallet-opened" ? "wallet opened" : "returned to FundWise"}
            </Text>
          ) : null}
          {walletError ? <Text style={styles.errorText}>{walletError}</Text> : null}
        </View>

        <View style={styles.panel}>
          <SectionHeader label="FundWise link" value={activeIntent ? getFundWiseLinkLabel(activeIntent) : "Paste or open"} />
          {activeIntent ? <LinkSummary intent={activeIntent} /> : null}
          <TextInput
            accessibilityLabel="FundWise invite or group link"
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="url"
            onChangeText={(value) => {
              setLinkInput(value);
              setInviteResult(null);
            }}
            placeholder="Paste invite code or FundWise link"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            value={linkInput}
          />
          <View style={styles.buttonRow}>
            <ActionButton
              accessibilityLabel="Open FundWise link"
              disabled={!continuationUrl}
              onPress={openContinuation}
              style={styles.rowButton}
            >
              Open
            </ActionButton>
            <ActionButton
              accessibilityLabel="Share FundWise link"
              onPress={() => void shareContinuation()}
              style={styles.rowButton}
              variant="secondary"
            >
              Share
            </ActionButton>
          </View>
          {shareError ? <Text style={styles.errorText}>{shareError}</Text> : null}
          {incomingLink.loading ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator color={colors.primaryMid} />
              <Text style={styles.helperText}>Checking saved link</Text>
            </View>
          ) : latestIntent ? (
            <Pressable
              accessibilityLabel="Use latest saved FundWise link"
              accessibilityRole="button"
              onPress={() => setLinkInput(latestIntent.url)}
              style={({ pressed }) => [styles.savedLink, pressed ? styles.pressed : null]}
            >
              <Text style={styles.savedLinkLabel}>Latest saved link</Text>
              <Text numberOfLines={1} style={styles.savedLinkText}>
                {latestIntent.url}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.panel}>
          <SectionHeader label="Invite lookup" value="Public preview" />
          <Text style={styles.panelCopy}>Check a group invite before opening it in the browser.</Text>
          <View style={styles.buttonRow}>
            <ActionButton
              accessibilityLabel="Check invite"
              disabled={!normalizedInviteCode || inviteLoading}
              onPress={() => void handleLookupInvite()}
              style={styles.rowButton}
            >
              {inviteLoading ? "Checking..." : "Check"}
            </ActionButton>
            <ActionButton
              accessibilityLabel="Open FundWise groups"
              onPress={openGroups}
              style={styles.rowButton}
              variant="secondary"
            >
              Groups
            </ActionButton>
          </View>
          {inviteLoading ? <ActivityIndicator color={colors.primaryMid} /> : null}
          {inviteResult?.group ? (
            <View style={styles.groupPreview}>
              <Text style={styles.groupName}>{inviteResult.group.name}</Text>
              <Text style={styles.groupMeta}>
                {inviteResult.group.member_count || 0} members · {inviteResult.group.mode || "split"}
              </Text>
            </View>
          ) : null}
          {inviteResult?.error ? <Text style={styles.errorText}>{inviteResult.error}</Text> : null}
        </View>

        <View style={styles.footerPanel}>
          <Text style={styles.footerTitle}>Current boundary</Text>
          <Text style={styles.helperText}>
            Native wallet connection is being tested here. Settlement review, money movement, and receipt persistence
            still open FundWise web until the full native signing path is proven.
          </Text>
          <Text style={styles.deviceLine}>
            Device: {deviceLabel}
            {seekerDeviceInfo.release ? ` / Android ${seekerDeviceInfo.release}` : ""}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  container: {
    gap: 14,
    padding: 18,
    paddingBottom: 28,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  lockup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  mark: {
    height: 34,
    width: 34,
  },
  markSlab: {
    borderRadius: 6,
    height: 6,
    position: "absolute",
  },
  markTop: {
    backgroundColor: colors.primaryDeep,
    left: 5,
    top: 8,
    transform: [{ rotate: "-2deg" }],
    width: 24,
  },
  markMiddle: {
    backgroundColor: colors.primary,
    left: 3,
    top: 16,
    width: 28,
  },
  markBottom: {
    backgroundColor: colors.fundBlue,
    left: 7,
    top: 24,
    transform: [{ rotate: "2deg" }],
    width: 22,
  },
  wordmark: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  headerMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  walletBadge: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  walletBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  heroKicker: {
    color: colors.fundBlue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32,
  },
  heroCopy: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  primaryPanel: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionValue: {
    color: colors.textSubtle,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  panelCopy: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  walletStatusBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  walletStatusLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  walletStatusValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 3,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  linkSummary: {
    alignItems: "center",
    backgroundColor: colors.surfaceTint,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  linkIcon: {
    alignItems: "center",
    backgroundColor: colors.fundBluePale,
    borderRadius: 12,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  linkIconText: {
    color: colors.fundBlue,
    fontSize: 12,
    fontWeight: "900",
  },
  linkCopy: {
    flex: 1,
    minWidth: 0,
  },
  linkTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  linkDetail: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 54,
    paddingHorizontal: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  rowButton: {
    flex: 1,
  },
  inlineLoading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  savedLink: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  savedLinkLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  savedLinkText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  pressed: {
    opacity: 0.72,
  },
  groupPreview: {
    backgroundColor: colors.fundBluePale,
    borderColor: colors.fundBlueBorder,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  groupName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  groupMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  footerPanel: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  footerTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  deviceLine: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: "800",
  },
});
