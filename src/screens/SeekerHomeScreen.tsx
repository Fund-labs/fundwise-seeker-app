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
import { getFundWiseLinkLabel, parseFundWiseLink } from "../lib/fundwise-link";
import { shortAddress } from "../lib/short-address";
import { colors } from "../theme/colors";

type HealthState = "checking" | "online" | "offline";
type StepState = "done" | "active" | "idle";

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

function StrataMark() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.mark}>
      <View style={[styles.markSlab, styles.markTop]} />
      <View style={[styles.markSlab, styles.markMiddle]} />
      <View style={[styles.markSlab, styles.markBottom]} />
    </View>
  );
}

function Header({
  walletAddress,
  onOpenGroups,
}: {
  walletAddress: string | null;
  onOpenGroups: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.lockup}>
        <StrataMark />
        <View>
          <Text style={styles.wordmark}>FundWise</Text>
          <Text style={styles.headerMeta}>Seeker for Android</Text>
        </View>
      </View>
      <Pressable
        accessibilityHint="Opens FundWise Groups in the web app."
        accessibilityLabel="Open FundWise Groups"
        accessibilityRole="button"
        onPress={onOpenGroups}
        style={({ pressed }) => [styles.avatarButton, pressed ? styles.pressed : null]}
      >
        <Text style={styles.avatarText}>{walletAddress ? walletAddress.slice(0, 1) : "S"}</Text>
      </Pressable>
    </View>
  );
}

function StepRow({
  detail,
  index,
  state,
  title,
}: {
  detail: string;
  index: string;
  state: StepState;
  title: string;
}) {
  const stateStyle =
    state === "done" ? styles.doneStep : state === "active" ? styles.activeStep : styles.idleStep;

  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepIndex, stateStyle]}>
        <Text style={styles.stepIndexText}>{index}</Text>
      </View>
      <View style={styles.stepCopy}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.metaText}>{detail}</Text>
      </View>
    </View>
  );
}

function ModeChip({ mode }: { mode: "split" | "fund" | "seeker" }) {
  const isFund = mode === "fund";
  const label = mode === "seeker" ? "Seeker" : isFund ? "Fund" : "Split";

  return (
    <View style={[styles.modeChip, isFund ? styles.fundChip : styles.splitChip]}>
      <View style={[styles.modeDot, isFund ? styles.fundDot : styles.splitDot]} />
      <Text style={[styles.modeText, isFund ? styles.fundText : styles.splitText]}>{label}</Text>
    </View>
  );
}

function LinkPreviewCard({
  label,
  mode,
  subtitle,
}: {
  label: string;
  mode: "split" | "fund" | "seeker";
  subtitle: string;
}) {
  const isFund = mode === "fund";

  return (
    <View style={styles.previewCard}>
      <View style={[styles.previewCover, isFund ? styles.fundCover : styles.splitCover]}>
        <View style={styles.previewGlow} />
      </View>
      <View style={styles.previewCopy}>
        <Text numberOfLines={1} style={styles.previewTitle}>
          {label}
        </Text>
        <View style={styles.previewMetaRow}>
          <ModeChip mode={mode} />
          <Text numberOfLines={1} style={styles.metaText}>
            {subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

function BottomNav({
  onOpenGroups,
  onRefresh,
  onShare,
}: {
  onOpenGroups: () => void;
  onRefresh: () => void;
  onShare: () => void;
}) {
  const items = [
    { label: "Home", value: "Seeker", active: true, onPress: undefined },
    { label: "Groups", value: "Web", active: false, onPress: onOpenGroups },
    { label: "Send", value: "PC", active: false, onPress: onShare },
    { label: "API", value: "Ping", active: false, onPress: onRefresh },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => (
        <Pressable
          accessibilityLabel={`${item.label} ${item.value}`}
          accessibilityRole="button"
          key={item.label}
          onPress={item.onPress}
          style={({ pressed }) => [
            styles.navItem,
            item.active ? styles.navItemActive : null,
            pressed && item.onPress ? styles.pressed : null,
          ]}
        >
          <Text style={[styles.navValue, item.active ? styles.navValueActive : null]}>{item.value}</Text>
          <Text style={[styles.navLabel, item.active ? styles.navLabelActive : null]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function SeekerHomeScreen({ onReplayOnboarding }: { onReplayOnboarding?: () => void }) {
  const { account, connect, disconnect } = useMobileWallet();
  const isOnline = useNetworkStatus();
  const incomingLink = useIncomingFundWiseLink();
  const [health, setHealth] = useState<HealthState>("checking");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteResult, setInviteResult] = useState<InviteLookup | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletRoundTrip, setWalletRoundTrip] = useState<"idle" | "backgrounded" | "returned">("idle");

  const walletAddress = account?.address.toBase58() ?? null;
  const normalizedInviteCode = useMemo(() => extractInviteCode(inviteCode), [inviteCode]);
  const latestLinkIntent = useMemo(
    () => (incomingLink.url ? parseFundWiseLink(incomingLink.url, FUNDWISE_WEB_URL) : null),
    [incomingLink.url],
  );

  const latestLinkLabel = latestLinkIntent ? getFundWiseLinkLabel(latestLinkIntent) : null;
  const continuationUrl = latestLinkIntent?.url || buildWebUrl("/groups");
  const apiStatusLabel =
    health === "checking" ? "API checking" : health === "online" ? "API online" : "API offline";
  const walletStepState: StepState = walletAddress ? "done" : "active";
  const linkStepState: StepState = latestLinkIntent || inviteResult?.group ? "done" : walletAddress ? "active" : "idle";
  const continuationStepState: StepState = latestLinkIntent || inviteResult?.group ? "active" : "idle";
  const latestMode = inviteResult?.group?.mode || "seeker";
  const heroStatus = walletAddress ? "Wallet linked" : isOnline ? "Ready to connect" : "Offline";

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
      if (nextState === "background" || nextState === "inactive") {
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

  async function handleConnectWallet() {
    if (!isOnline) {
      setWalletError("Reconnect before opening your wallet.");
      return;
    }

    setWalletError(null);

    try {
      await connect();
    } catch {
      setWalletError("Wallet connection did not complete.");
    }
  }

  async function handleDisconnectWallet() {
    setWalletError(null);

    try {
      await disconnect();
    } catch {
      setWalletError("Unable to disconnect wallet.");
    }
  }

  async function handleLookupInvite() {
    if (!normalizedInviteCode) {
      return;
    }

    if (!isOnline) {
      setInviteResult({ error: "You are offline. Reconnect before checking an invite." });
      return;
    }

    setInviteLoading(true);
    const result = await lookupInvite(normalizedInviteCode);
    setInviteLoading(false);
    setInviteResult(result.ok ? result.data : { error: result.error });
  }

  async function refreshHealth() {
    setHealth("checking");
    const result = await getHealth();
    setHealth(result.ok ? "online" : "offline");
  }

  function openGroups() {
    void Linking.openURL(buildWebUrl("/groups"));
  }

  function openContinuationUrl() {
    void Linking.openURL(continuationUrl);
  }

  async function shareContinuationUrl() {
    setShareError(null);

    try {
      await Share.share({
        title: "Open FundWise",
        message: continuationUrl,
        url: continuationUrl,
      });
    } catch {
      setShareError("Unable to open the share sheet.");
    }
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
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header onOpenGroups={openGroups} walletAddress={walletAddress} />

        <View style={styles.hero}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <View style={styles.heroContent}>
            <View style={styles.heroTopline}>
              <Text style={styles.heroKicker}>Android Seeker</Text>
              <ModeChip mode="seeker" />
            </View>
            <Text style={styles.heroTitle}>Phone first. Web when it matters.</Text>
            <Text style={styles.heroSubtitle}>
              Connect a mobile wallet, recover the FundWise link, then send the exact state to web or PC.
            </Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{heroStatus}</Text>
                <Text style={styles.heroStatLabel}>Wallet</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{latestLinkIntent ? "Linked" : "Groups"}</Text>
                <Text style={styles.heroStatLabel}>Target</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statusRow}>
          <StatusPill label={walletAddress ? "Wallet connected" : "Wallet idle"} tone={walletAddress ? "ok" : "idle"} />
          <StatusPill label={isOnline ? "Network online" : "Network offline"} tone={isOnline ? "ok" : "warn"} />
          <StatusPill
            label={apiStatusLabel}
            tone={health === "online" ? "ok" : health === "offline" ? "warn" : "idle"}
          />
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Start here</Text>
            <Text style={styles.panelMeta}>MWA</Text>
          </View>
          <View style={styles.stepList}>
            <StepRow
              detail={walletAddress ? shortAddress(walletAddress, 6) : "Use a Solana Mobile Wallet Adapter wallet."}
              index="1"
              state={walletStepState}
              title="Connect on Android"
            />
            <StepRow
              detail={latestLinkLabel || inviteResult?.group?.name || "Open Groups or paste an invite link."}
              index="2"
              state={linkStepState}
              title="Recover Group state"
            />
            <StepRow
              detail="Open or share the same Group, Settlement, or Receipt on FundWise web."
              index="3"
              state={continuationStepState}
              title="Continue on web or PC"
            />
          </View>
          <View style={styles.buttonGrid}>
            <ActionButton
              accessibilityHint="Opens your Solana mobile wallet through Mobile Wallet Adapter."
              accessibilityLabel="Connect Solana wallet"
              disabled={!isOnline || Boolean(walletAddress)}
              onPress={() => void handleConnectWallet()}
              style={styles.buttonGridButton}
            >
              Connect
            </ActionButton>
            <ActionButton
              accessibilityHint="Opens the Android share sheet with the current FundWise URL."
              accessibilityLabel="Send FundWise link to desktop or PC"
              onPress={() => void shareContinuationUrl()}
              style={styles.buttonGridButton}
              variant="secondary"
            >
              Send to PC
            </ActionButton>
          </View>
          {walletError ? <Text style={styles.errorText}>{walletError}</Text> : null}
          {shareError ? <Text style={styles.errorText}>{shareError}</Text> : null}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Latest link</Text>
            <Text style={styles.panelMeta}>{incomingLink.source === "storage" ? "Saved" : "Live"}</Text>
          </View>
          {incomingLink.loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primaryMid} />
              <Text style={styles.metaText}>Checking latest app link</Text>
            </View>
          ) : latestLinkIntent ? (
            <View style={styles.linkSummary}>
              <LinkPreviewCard
                label={latestLinkLabel || "FundWise link"}
                mode={latestMode}
                subtitle={latestLinkIntent.groupId ? shortAddress(latestLinkIntent.groupId, 7) : "Ready to open"}
              />
              {latestLinkIntent.settleFrom && latestLinkIntent.settleTo ? (
                <Text style={styles.metaText}>
                  Settlement: {shortAddress(latestLinkIntent.settleFrom, 4)} to{" "}
                  {shortAddress(latestLinkIntent.settleTo, 4)}
                </Text>
              ) : null}
              <Text numberOfLines={2} style={styles.linkText}>
                {latestLinkIntent.url}
              </Text>
              <View style={styles.buttonGrid}>
                <ActionButton
                  accessibilityLabel="Open latest FundWise link"
                  onPress={openLatestLink}
                  style={styles.buttonGridButton}
                >
                  Open Link
                </ActionButton>
                <ActionButton
                  accessibilityLabel="Clear saved FundWise link"
                  onPress={() => void incomingLink.clear()}
                  style={styles.buttonGridButton}
                  variant="secondary"
                >
                  Clear
                </ActionButton>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No recent link</Text>
              <Text style={styles.metaText}>Open a FundWise group on this phone or paste an invite below.</Text>
              <ActionButton accessibilityLabel="Open FundWise Groups" onPress={openGroups} variant="secondary">
                Open Groups
              </ActionButton>
            </View>
          )}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Invite recovery</Text>
            <Text style={styles.panelMeta}>Group</Text>
          </View>
          <TextInput
            accessibilityLabel="Invite code or FundWise link"
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="url"
            onChangeText={(value) => {
              setInviteCode(value);
              setInviteResult(null);
            }}
            placeholder="Invite code or FundWise link"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            value={inviteCode}
          />
          <View style={styles.buttonGrid}>
            <ActionButton
              accessibilityHint="Looks up the public FundWise Group preview for this invite code."
              accessibilityLabel="Check invite code"
              disabled={!normalizedInviteCode || inviteLoading}
              onPress={handleLookupInvite}
              style={styles.buttonGridButton}
            >
              {inviteLoading ? "Checking" : "Check"}
            </ActionButton>
            <ActionButton
              accessibilityHint="Opens this invite in the FundWise web app."
              accessibilityLabel="Open invite in FundWise"
              disabled={!normalizedInviteCode}
              onPress={openInvite}
              style={styles.buttonGridButton}
              variant="secondary"
            >
              Open
            </ActionButton>
          </View>
          {inviteLoading ? <ActivityIndicator color={colors.primaryMid} /> : null}
          {inviteResult?.group ? (
            <LinkPreviewCard
              label={inviteResult.group.name}
              mode={inviteResult.group.mode || "split"}
              subtitle={`${inviteResult.group.member_count || 0} members`}
            />
          ) : null}
          {inviteResult?.error ? <Text style={styles.errorText}>{inviteResult.error}</Text> : null}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Wallet boundary</Text>
            <Text style={styles.panelMeta}>{SOLANA_CHAIN.replace("solana:", "")}</Text>
          </View>
          <Text style={styles.walletText}>
            {walletAddress ? shortAddress(walletAddress, 6) : "No wallet connected"}
          </Text>
          {walletRoundTrip !== "idle" ? (
            <Text style={styles.metaText}>
              Wallet handoff: {walletRoundTrip === "backgrounded" ? "waiting" : "returned"}
            </Text>
          ) : null}
          <Text style={styles.metaText}>
            Seeker keeps transaction approval and receipt verification inside FundWise web until native signing is ready.
          </Text>
          <View style={styles.buttonGrid}>
            <ActionButton
              accessibilityLabel="Open continuation link in web app"
              onPress={openContinuationUrl}
              style={styles.buttonGridButton}
            >
              Open Web
            </ActionButton>
            <ActionButton
              accessibilityLabel="Disconnect Solana wallet"
              disabled={!walletAddress}
              onPress={() => void handleDisconnectWallet()}
              style={styles.buttonGridButton}
              variant="secondary"
            >
              Disconnect
            </ActionButton>
          </View>
          {onReplayOnboarding ? (
            <ActionButton
              accessibilityHint="Shows the animated FundWise Seeker onboarding again."
              accessibilityLabel="Replay onboarding"
              onPress={onReplayOnboarding}
              variant="secondary"
            >
              Replay Intro
            </ActionButton>
          ) : null}
        </View>
      </ScrollView>

      <BottomNav
        onOpenGroups={openGroups}
        onRefresh={() => void refreshHealth()}
        onShare={() => void shareContinuationUrl()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  container: {
    flexGrow: 1,
    gap: 14,
    padding: 18,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
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
    backgroundColor: colors.primaryFresh,
    left: 7,
    top: 24,
    transform: [{ rotate: "2deg" }],
    width: 22,
  },
  wordmark: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0,
  },
  headerMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  avatarButton: {
    alignItems: "center",
    backgroundColor: colors.primaryPale,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.72,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    minHeight: 224,
    overflow: "hidden",
    padding: 20,
  },
  heroOrbLarge: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 90,
    height: 180,
    position: "absolute",
    right: -54,
    top: -52,
    width: 180,
  },
  heroOrbSmall: {
    backgroundColor: "rgba(45,184,112,0.55)",
    borderRadius: 46,
    bottom: -24,
    height: 92,
    position: "absolute",
    right: 30,
    width: 92,
  },
  heroContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  heroTopline: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroKicker: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 39,
    marginTop: 22,
    maxWidth: 290,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 300,
  },
  heroStats: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 18,
    padding: 12,
  },
  heroStat: {
    flex: 1,
    gap: 2,
  },
  heroStatValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
  },
  heroDivider: {
    backgroundColor: "rgba(255,255,255,0.28)",
    height: 32,
    marginHorizontal: 12,
    width: 1,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14,
    shadowColor: colors.text,
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  panelTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  panelMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  stepList: {
    gap: 12,
  },
  stepRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  stepIndex: {
    alignItems: "center",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  doneStep: {
    backgroundColor: colors.primaryMid,
  },
  activeStep: {
    backgroundColor: colors.primary,
  },
  idleStep: {
    backgroundColor: colors.surfaceInset,
  },
  stepIndexText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
  stepCopy: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  metaText: {
    color: colors.textMuted,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  buttonGrid: {
    flexDirection: "row",
    gap: 10,
  },
  buttonGridButton: {
    flex: 1,
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  linkSummary: {
    gap: 10,
  },
  previewCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceTint,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  previewCover: {
    borderRadius: 12,
    height: 48,
    overflow: "hidden",
    width: 48,
  },
  splitCover: {
    backgroundColor: colors.primaryFresh,
  },
  fundCover: {
    backgroundColor: colors.fundBlue,
  },
  previewGlow: {
    backgroundColor: "rgba(255,255,255,0.38)",
    borderRadius: 44,
    height: 72,
    left: 18,
    position: "absolute",
    top: -16,
    width: 72,
  },
  previewCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  previewTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  previewMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  modeChip: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  splitChip: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.borderStrong,
  },
  fundChip: {
    backgroundColor: colors.fundBluePale,
    borderColor: colors.fundBlueBorder,
  },
  modeDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  splitDot: {
    backgroundColor: colors.primaryFresh,
  },
  fundDot: {
    backgroundColor: colors.fundBlue,
  },
  modeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  splitText: {
    color: colors.primary,
  },
  fundText: {
    color: colors.fundBlue,
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  emptyState: {
    gap: 10,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  walletText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  bottomNav: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "space-between",
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  navItem: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    gap: 2,
    minHeight: 52,
    justifyContent: "center",
  },
  navItemActive: {
    backgroundColor: colors.primaryPale,
  },
  navValue: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
  },
  navValueActive: {
    color: colors.primary,
  },
  navLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: "800",
  },
  navLabelActive: {
    color: colors.primary,
  },
});
