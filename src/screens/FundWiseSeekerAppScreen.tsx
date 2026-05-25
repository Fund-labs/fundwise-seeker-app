import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PublicKey } from "@solana/web3.js";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import * as Haptics from "expo-haptics";
import { atob } from "js-base64";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { FUNDWISE_ALLOWED_HOSTS, FUNDWISE_IDENTITY, FUNDWISE_WEB_URL, RECEIPTS_URL, SOLANA_CHAIN } from "../config";
import {
  ACTIVITY,
  GROUPS,
  ME,
  type FundGroup,
  type FundWiseGroup,
  type PersonId,
  type Proposal,
  type SplitGroup,
  formatUsd,
  personOf,
} from "../data/fundwise";
import { useIncomingFundWiseLink } from "../hooks/useIncomingFundWiseLink";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import {
  getMobileSettlementRequestPreview,
  type MobileSettlementRequestPreview,
} from "../lib/fundwise-api";
import { buildFundyTelegramUrl } from "../lib/fundy-telegram";
import {
  getFundWiseLinkDetail,
  getFundWiseLinkLabel,
  parseFundWiseLink,
  type FundWiseLinkIntent,
} from "../lib/fundwise-link";
import { getSeekerDeviceInfo } from "../lib/seeker-device";
import { shortAddress } from "../lib/short-address";
import { colors } from "../theme/colors";

type ScreenId = "boot" | "welcome" | "tour" | "auth" | "success" | "home" | "groups" | "activity" | "wallet" | "split" | "fund";
type HapticKind = "tap" | "selection" | "success" | "warning";
type IconTone = "blue" | "gold" | "green" | "ink" | "telegram";
type IoniconName = ComponentProps<typeof Ionicons>["name"];
type NotificationTone = "success" | "info" | "warning";
type WalletPreference = "seeker" | "solflare" | "any";
type AppNotification = {
  body: string;
  id: number;
  title: string;
  tone: NotificationTone;
};
type NotifyInput = Omit<AppNotification, "id">;
type SheetState =
  | { kind: "fab" }
  | { kind: "add-expense" }
  | { kind: "settle-picker" }
  | { kind: "settle"; settlement: SettlementOption }
  | { kind: "vote"; choice: "yes" | "no"; groupId: string; proposal: Proposal }
  | { kind: "telegram"; group?: FundWiseGroup }
  | { kind: "invite"; group?: FundWiseGroup }
  | { kind: "deposit"; group: FundGroup }
  | { kind: "propose"; group: FundGroup }
  | { kind: "create-group" }
  | { kind: "profile" };

type SettlementOption = {
  amt: number;
  from: PersonId;
  group: SplitGroup;
  to: PersonId;
};

type SignatureIntent = {
  apply?: () => void;
  body: string;
  groupId?: string;
  kind: "connect" | "settle" | "deposit" | "vote";
  returnScreen: ScreenId;
  successBody: string;
  successTitle: string;
  title: string;
};

type SuccessState = {
  body: string;
  pill?: string;
  returnScreen: ScreenId;
  title: string;
};

const BOOT_MS = 2500;
const ONBOARDING_STORAGE_KEY = "fundwise-seeker:onboarding-complete:v1";

const MARK_ICONS: Record<string, IoniconName> = {
  copy: "copy-outline",
  deposit: "arrow-down-outline",
  fw: "shield-checkmark-outline",
  in: "arrow-down-outline",
  more: "ellipsis-horizontal",
  new: "add-circle-outline",
  out: "arrow-up-outline",
  pay: "checkmark-circle-outline",
  qr: "qr-code-outline",
  rec: "receipt-outline",
  receive: "arrow-down-outline",
  send: "arrow-up-outline",
  settle: "checkmark-circle-outline",
  sms: "chatbubble-outline",
  split: "reorder-three-outline",
  telegram: "paper-plane-outline",
  tg: "paper-plane-outline",
  vault: "wallet-outline",
  vote: "checkbox-outline",
};

const SHEET_ROW_ICONS: Record<string, IoniconName> = {
  "connected dapps": "apps-outline",
  "default token": "pricetag-outline",
  "help & support": "help-circle-outline",
  network: "globe-outline",
  notifications: "notifications-outline",
  security: "shield-checkmark-outline",
};

const NAV_ICONS: Record<"activity" | "groups" | "home" | "wallet", { active: IoniconName; inactive: IoniconName }> = {
  activity: { active: "time", inactive: "time-outline" },
  groups: { active: "people", inactive: "people-outline" },
  home: { active: "home", inactive: "home-outline" },
  wallet: { active: "wallet", inactive: "wallet-outline" },
};

function normalizeMark(mark: string) {
  return mark.trim().toLowerCase();
}

function iconForMark(mark: string): IoniconName {
  const key = normalizeMark(mark);
  return SHEET_ROW_ICONS[key] || MARK_ICONS[key] || "sparkles-outline";
}

function toneForMark(mark: string): IconTone {
  const key = normalizeMark(mark);
  if (key === "tg" || key === "telegram") return "telegram";
  if (key === "vault" || key === "deposit" || key === "in" || key === "receive") return "blue";
  if (key === "pay" || key === "out" || key === "send" || key === "settle") return "gold";
  if (key === "fw" || SHEET_ROW_ICONS[key]) return "ink";
  return "green";
}

function iconColorForTone(tone: IconTone) {
  if (tone === "blue") return colors.fundBlue;
  if (tone === "gold") return colors.gold;
  if (tone === "telegram") return "#229ED9";
  if (tone === "ink") return colors.textSoft;
  return colors.primaryMid;
}

function getSettlementPreviewCopy(preview: MobileSettlementRequestPreview) {
  if (preview.status === "ready" && preview.amount) {
    const roleCopy = preview.role === "payer" ? "you pay" : preview.role === "payee" ? "you receive" : "ready";
    return `${preview.amount.display} ${preview.amount.token} · ${roleCopy}`;
  }

  if (preview.status === "expired") {
    return "Expired · open FundWise to recover context";
  }

  if (preview.status === "wrong_wallet") {
    return "Different wallet required for this request";
  }

  if (preview.status === "not_member") {
    return "Wallet is not a verified Group member";
  }

  if (preview.status === "not_settleable") {
    return "Balance changed · open FundWise to refresh";
  }

  return "Preview available";
}

function getSettlementPreviewRoleCopy(preview: MobileSettlementRequestPreview) {
  if (preview.role === "payer") return "You pay";
  if (preview.role === "payee") return "You receive";
  if (preview.role === "wrong_wallet") return "Wrong wallet";
  if (preview.role === "not_member") return "Not a member";
  return "Member";
}

function getSettlementPreviewStatusCopy(preview: MobileSettlementRequestPreview) {
  if (preview.status === "ready") return "Ready";
  if (preview.status === "expired") return "Expired";
  if (preview.status === "wrong_wallet") return "Wrong wallet";
  if (preview.status === "not_member") return "Not member";
  if (preview.status === "not_settleable") return "Needs refresh";
  return "Preview";
}

function formatSettlementPreviewExpiry(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Expiry unavailable";
  }

  return `Expires ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function normalizeFundWiseUrl(value: string) {
  try {
    return new URL(value, FUNDWISE_WEB_URL).toString();
  } catch {
    return value;
  }
}

function bytesFromString(value: string) {
  return new Uint8Array(value.split("").map((char) => char.charCodeAt(0)));
}

function triggerHaptic(kind: HapticKind = "tap") {
  if (kind === "success") {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => Vibration.vibrate([10]));
    return;
  }

  if (kind === "warning") {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => Vibration.vibrate([20, 20, 20]));
    return;
  }

  if (kind === "selection") {
    void Haptics.selectionAsync().catch(() => Vibration.vibrate([10]));
    return;
  }

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => Vibration.vibrate([10]));
}

function readableWalletError(error: unknown) {
  const message = error instanceof Error && error.message ? error.message : "Wallet approval did not complete.";

  if (message.includes("CancellationException") || message.toLowerCase().includes("cancel")) {
    return "Wallet request was cancelled. Retry and approve it with the side fingerprint sensor.";
  }

  if (message.toLowerCase().includes("authorization request failed")) {
    return "Wallet approval did not complete. Try again and approve with the side fingerprint sensor.";
  }

  return message;
}

function walletErrorDebug(error: unknown) {
  if (error instanceof Error) {
    const errorWithCode = error as Error & { code?: unknown; data?: unknown; userInfo?: unknown };
    return {
      code: errorWithCode.code,
      data: errorWithCode.data,
      message: error.message,
      name: error.name,
      userInfo: errorWithCode.userInfo,
    };
  }

  return { message: String(error) };
}

function walletAddressToString(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "toBase58" in value && typeof value.toBase58 === "function") {
    return value.toBase58();
  }

  return String(value);
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function StrataLogo({ size = 56, white = false }: { size?: number; white?: boolean }) {
  const scale = size / 96;
  const slabColor = white ? "#FFFFFF" : colors.primaryDeep;

  return (
    <View style={{ height: size, width: size }}>
      <View
        style={[
          styles.logoSlab,
          {
            backgroundColor: slabColor,
            borderRadius: 7 * scale,
            height: 14 * scale,
            left: 14 * scale,
            top: 22 * scale,
            transform: [{ rotate: "-2deg" }],
            width: 68 * scale,
          },
        ]}
      />
      <View
        style={[
          styles.logoSlab,
          {
            backgroundColor: white ? "#FFFFFF" : colors.primaryMid,
            borderRadius: 7 * scale,
            height: 14 * scale,
            left: 11 * scale,
            top: 41 * scale,
            width: 74 * scale,
          },
        ]}
      />
      <View
        style={[
          styles.logoSlab,
          {
            backgroundColor: white ? "#FFFFFF" : colors.mint,
            borderRadius: 7 * scale,
            height: 14 * scale,
            left: 17 * scale,
            top: 60 * scale,
            transform: [{ rotate: "2deg" }],
            width: 62 * scale,
          },
        ]}
      />
    </View>
  );
}

function Wordmark({ light = false, size = 34 }: { light?: boolean; size?: number }) {
  return (
    <Text style={[styles.wordmark, { color: light ? colors.white : colors.text, fontSize: size }]}>
      Fund<Text style={[styles.wordmarkItalic, styles.wordmarkAccent]}>w</Text>ise
    </Text>
  );
}

function AppButton({
  children,
  disabled,
  onPress,
  style,
  textStyle,
  variant = "primary",
}: {
  children: string;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: "primary" | "ghost" | "blue" | "danger";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "ghost" ? styles.buttonGhost : variant === "blue" ? styles.buttonBlue : variant === "danger" ? styles.buttonDanger : styles.buttonPrimary,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.buttonText, variant === "ghost" ? styles.buttonGhostText : null, textStyle]}>{children}</Text>
    </Pressable>
  );
}

function AppShell({
  activeTab,
  children,
  onFab,
  onTab,
}: {
  activeTab?: "home" | "groups" | "activity" | "wallet";
  children: React.ReactNode;
  onFab?: () => void;
  onTab?: (tab: "home" | "groups" | "activity" | "wallet") => void;
}) {
  return (
    <View style={styles.appScreen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {activeTab && onTab && onFab ? <BottomNav active={activeTab} onFab={onFab} onTab={onTab} /> : null}
      <View pointerEvents="none" style={styles.gesturePill} />
    </View>
  );
}

function Avatar({ id, ring = false, size = 32 }: { id: PersonId; ring?: boolean; size?: number }) {
  const person = personOf(id);

  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: person.color,
          borderColor: ring ? colors.bg : "transparent",
          borderRadius: size / 2,
          borderWidth: ring ? 2 : 0,
          height: size,
          width: size,
        },
      ]}
    >
      <Text style={[styles.avatarText, { color: id === "dev" ? colors.text : colors.white, fontSize: Math.round(size * 0.4) }]}>{person.initial}</Text>
    </View>
  );
}

function AvatarStack({ ids, max = 5, size = 28 }: { ids: PersonId[]; max?: number; size?: number }) {
  const shown = ids.slice(0, max);
  const rest = ids.length - shown.length;

  return (
    <View style={styles.avatarStack}>
      {shown.map((id, index) => (
        <View key={id} style={{ marginLeft: index === 0 ? 0 : -size * 0.34 }}>
          <Avatar id={id} ring size={size} />
        </View>
      ))}
      {rest > 0 ? (
        <View style={[styles.avatarRest, { borderRadius: size / 2, height: size, marginLeft: -size * 0.34, width: size }]}>
          <Text style={styles.avatarRestText}>+{rest}</Text>
        </View>
      ) : null}
    </View>
  );
}

function BootScreen({ onDone }: { onDone: () => void }) {
  const top = useRef(new Animated.Value(0)).current;
  const mid = useRef(new Animated.Value(0)).current;
  const bottom = useRef(new Animated.Value(0)).current;
  const copy = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const slabTiming = (value: Animated.Value) =>
      Animated.timing(value, {
        duration: 700,
        easing: Easing.bezier(0.2, 0.8, 0.25, 1),
        toValue: 1,
        useNativeDriver: true,
      });

    Animated.parallel([
      Animated.sequence([Animated.delay(150), slabTiming(top)]),
      Animated.sequence([Animated.delay(400), slabTiming(mid)]),
      Animated.sequence([Animated.delay(650), slabTiming(bottom)]),
      Animated.sequence([
        Animated.delay(1150),
        Animated.timing(copy, {
          duration: 550,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const sweepLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1700),
        Animated.timing(sweep, {
          duration: 1200,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    );
    sweepLoop.start();

    const timer = setTimeout(onDone, BOOT_MS);
    return () => {
      clearTimeout(timer);
      sweepLoop.stop();
    };
  }, [bottom, copy, mid, onDone, sweep, top]);

  const animatedSlab = (value: Animated.Value, style: StyleProp<ViewStyle>, rotate: string) => (
    <Animated.View
      style={[
        styles.bootSlab,
        style,
        {
          opacity: value,
          transform: [
            { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [-62, 0] }) },
            { scale: value.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.72, 1.03, 1] }) },
            { rotate },
          ],
        },
      ]}
    />
  );

  return (
    <View style={styles.bootScreen}>
      <StatusBar hidden />
      <View style={styles.bootGlow} />
      <View style={styles.bootLogo}>
        {animatedSlab(top, styles.bootTop, "-2deg")}
        {animatedSlab(mid, styles.bootMid, "0deg")}
        {animatedSlab(bottom, styles.bootBottom, "2deg")}
      </View>
      <Animated.View style={[styles.bootCopy, { opacity: copy, transform: [{ translateY: copy.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
        <Wordmark light size={46} />
        <Text style={styles.bootTag}>Stack · split · settle</Text>
      </Animated.View>
      <Animated.View style={[styles.bootLoadbar, { opacity: copy }]}>
        <Animated.View
          style={[
            styles.bootLoadSweep,
            {
              transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-120, 120] }) }],
            },
          ]}
        />
      </Animated.View>
      <View pointerEvents="none" style={[styles.gesturePill, styles.gesturePillDark]} />
    </View>
  );
}

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const floatA = useRef(new Animated.Value(0)).current;
  const floatB = useRef(new Animated.Value(0)).current;
  const floatC = useRef(new Animated.Value(0)).current;
  const floatD = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { duration: 2000, easing: Easing.inOut(Easing.cubic), toValue: 1, useNativeDriver: true }),
        Animated.timing(pulse, { duration: 2000, easing: Easing.inOut(Easing.cubic), toValue: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();

    const floatLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { duration: 2000, easing: Easing.inOut(Easing.cubic), toValue: 1, useNativeDriver: true }),
          Animated.timing(value, { duration: 2000, easing: Easing.inOut(Easing.cubic), toValue: 0, useNativeDriver: true }),
        ]),
      );
    const loops = [floatLoop(floatA, 0), floatLoop(floatB, 300), floatLoop(floatC, 600), floatLoop(floatD, 900)];
    loops.forEach((item) => item.start());

    return () => {
      loop.stop();
      loops.forEach((item) => item.stop());
    };
  }, [floatA, floatB, floatC, floatD, pulse]);

  return (
    <View style={[styles.onboardingScreen, styles.welcomeScreen]}>
      <StatusBar barStyle="dark-content" hidden={false} />
      <View style={styles.onboardingBody}>
        <StrataLogo size={58} />
        <Text style={styles.welcomeTitle}>
          Welcome to{"\n"}Fund<Text style={[styles.wordmarkItalic, styles.wordmarkAccent]}>w</Text>ise
        </Text>
        <Text style={styles.welcomeCopy}>Split expenses with friends, pool funds with intention - all on-chain.</Text>
        <View style={styles.welcomeHalo}>
          <Animated.View
            style={[
              styles.haloBlur,
              {
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
              },
            ]}
          />
          <View style={[styles.sparkle, styles.sparkleOne]} />
          <View style={[styles.sparkle, styles.sparkleTwo]} />
          <View style={[styles.sparkle, styles.sparkleThree]} />
          <View style={styles.welcomeAvatars}>
            {(["asha", "kiran", "mia", "dev"] as PersonId[]).map((id, index) => {
              const float = [floatA, floatB, floatC, floatD][index];
              return (
              <Animated.View
                key={id}
                style={{
                  marginLeft: index === 0 ? 0 : -18,
                  transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, index % 2 === 0 ? -8 : 8] }) }],
                }}
              >
                <Avatar id={id} ring size={62} />
              </Animated.View>
              );
            })}
          </View>
        </View>
      </View>
      <View style={styles.onboardingFooter}>
        <AppButton onPress={onNext}>Get started</AppButton>
        <Text style={styles.terms}>No email · No password · Your wallet is your identity</Text>
      </View>
      <View pointerEvents="none" style={styles.gesturePill} />
    </View>
  );
}

function TourScreen({ onAuth, onSkip }: { onAuth: () => void; onSkip: () => void }) {
  const [index, setIndex] = useState(0);
  const cards = [
    { body: "Snap a receipt, pick who paid, and FundWise calculates everyone's share in USDC.", emphasis: "we split the math.", kind: "split", title: "Log it once," },
    { body: "Create a treasury for trips, gifts, or rent. Spending needs a multisig vote.", emphasis: "vote to spend.", kind: "pool", title: "Pool funds," },
    { body: "One tap to settle. Sub-second confirmation, fractions of a cent in fees, no chargebacks.", emphasis: "final on Solana.", kind: "chain", title: "Settle in seconds," },
  ] as const;
  const card = cards[index];
  const isLast = index === cards.length - 1;

  const next = () => {
    triggerHaptic("tap");
    if (isLast) {
      onAuth();
      return;
    }
    setIndex((current) => current + 1);
  };

  const back = () => {
    triggerHaptic("tap");
    setIndex((current) => Math.max(0, current - 1));
  };

  return (
    <View style={styles.onboardingScreen}>
      <StatusBar barStyle="dark-content" hidden={false} />
      <View style={styles.tourTop}>
        <View style={styles.dots}>
          {cards.map((item, itemIndex) => (
            <View key={item.kind} style={[styles.dot, itemIndex === index ? styles.dotActive : null]} />
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
      <View style={styles.tourCard}>
        <TourIllustration kind={card.kind} />
        <Text style={styles.tourTitle}>
          {card.title}
          {"\n"}
          <Text style={styles.tourEmphasis}>{card.emphasis}</Text>
        </Text>
        <Text style={styles.tourCopy}>{card.body}</Text>
      </View>
      <View style={[styles.onboardingFooter, styles.row]}>
        {index > 0 ? (
          <AppButton onPress={back} style={styles.flexOne} variant="ghost">
            Back
          </AppButton>
        ) : (
          <View style={styles.flexOne} />
        )}
        <AppButton onPress={next} style={styles.flexTwo}>
          {isLast ? "Enter FundWise" : "Next"}
        </AppButton>
      </View>
      <View pointerEvents="none" style={styles.gesturePill} />
    </View>
  );
}

function TourIllustration({ kind }: { kind: "split" | "pool" | "chain" }) {
  const entry = useRef(new Animated.Value(0)).current;
  const motion = useRef(new Animated.Value(0)).current;
  const coinDropOne = useRef(new Animated.Value(0)).current;
  const coinDropTwo = useRef(new Animated.Value(0)).current;
  const coinDropThree = useRef(new Animated.Value(0)).current;
  const fillRise = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    entry.setValue(0);
    motion.setValue(0);
    coinDropOne.setValue(0);
    coinDropTwo.setValue(0);
    coinDropThree.setValue(0);
    fillRise.setValue(0);
    wave.setValue(0);

    Animated.timing(entry, {
      duration: 360,
      easing: Easing.bezier(0.2, 0.8, 0.25, 1),
      toValue: 1,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    const poolLoops: Animated.CompositeAnimation[] = [];
    const poolTimers: ReturnType<typeof setTimeout>[] = [];

    if (kind === "pool") {
      Animated.timing(fillRise, {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: false,
      }).start();

      const waveLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(wave, {
            duration: 1250,
            easing: Easing.inOut(Easing.cubic),
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(wave, {
            duration: 1250,
            easing: Easing.inOut(Easing.cubic),
            toValue: 0,
            useNativeDriver: true,
          }),
        ]),
      );
      waveLoop.start();
      poolLoops.push(waveLoop);

      const startCoinDrop = (value: Animated.Value, delayMs: number) => {
        const coinLoop = Animated.loop(
          Animated.timing(value, {
            duration: 2400,
            easing: Easing.inOut(Easing.cubic),
            toValue: 1,
            useNativeDriver: true,
          }),
          { resetBeforeIteration: true },
        );
        const timer = setTimeout(() => coinLoop.start(), delayMs);
        poolTimers.push(timer);
        poolLoops.push(coinLoop);
      };

      startCoinDrop(coinDropOne, 0);
      startCoinDrop(coinDropTwo, 800);
      startCoinDrop(coinDropThree, 1400);
    }

    return () => {
      loop.stop();
      poolLoops.forEach((poolLoop) => poolLoop.stop());
      poolTimers.forEach(clearTimeout);
    };
  }, [coinDropOne, coinDropThree, coinDropTwo, entry, fillRise, kind, motion, wave]);

  const enterStyle = {
    opacity: entry,
    transform: [
      { translateY: entry.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
      { scale: entry.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };

  if (kind === "pool") {
    const coinDropStyle = (value: Animated.Value) => ({
      opacity: value.interpolate({ inputRange: [0, 0.2, 0.86, 1], outputRange: [0, 1, 0.85, 0] }),
      transform: [
        { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, 150] }) },
        { rotate: value.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) },
      ],
    });

    return (
      <Animated.View style={[styles.poolIllustration, enterStyle]}>
        <Animated.View style={[styles.coin, styles.coinOne, coinDropStyle(coinDropOne)]}>
          <Text style={styles.coinText}>$</Text>
        </Animated.View>
        <Animated.View style={[styles.coin, styles.coinTwo, coinDropStyle(coinDropTwo)]}>
          <Text style={styles.coinText}>$</Text>
        </Animated.View>
        <Animated.View style={[styles.coin, styles.coinThree, coinDropStyle(coinDropThree)]}>
          <Text style={styles.coinText}>$</Text>
        </Animated.View>
        <Animated.View style={[styles.jarWrap, { transform: [{ scale: motion.interpolate({ inputRange: [0, 0.78, 1], outputRange: [1, 1, 1.025] }) }] }]}>
          <View style={styles.jarLip} />
          <View style={styles.jar}>
            <Animated.View style={[styles.jarFill, { height: fillRise.interpolate({ inputRange: [0, 1], outputRange: ["0%", "72%"] }) }]}>
              <Animated.View
                style={[
                  styles.jarWave,
                  {
                    transform: [
                      { translateY: wave.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
                      { scaleX: wave.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
                    ],
                  },
                ]}
              />
            </Animated.View>
            <Text style={styles.jarAmount}>$600</Text>
            <Text style={styles.jarLabel}>80% of goal</Text>
          </View>
        </Animated.View>
      </Animated.View>
    );
  }

  if (kind === "chain") {
    return (
      <Animated.View style={[styles.receipt, enterStyle]}>
        <View style={styles.receiptTop}>
          <Animated.View
            style={[
              styles.checkBadge,
              { transform: [{ scale: motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.12, 1] }) }] },
            ]}
          >
            <Text style={styles.checkBadgeText}>✓</Text>
          </Animated.View>
          <View>
            <Text style={styles.receiptStatus}>Settled · on-chain</Text>
            <Text style={styles.receiptWhere}>Lisbon Trip</Text>
          </View>
        </View>
        <Text style={styles.receiptAmount}>$30.00</Text>
        <Text style={styles.receiptMeta}>Kiran {"->"} You · confirmed in 0.4s</Text>
        <View style={styles.chainMini}>
          {[0, 1, 2, 3].map((item) => (
            <Animated.View
              key={item}
              style={[
                styles.chainMiniBlock,
                {
                  opacity: motion.interpolate({
                    inputRange: [0, Math.min(0.2 + item * 0.18, 0.96), Math.min(0.34 + item * 0.18, 1)],
                    outputRange: [0.35, 0.35, 1],
                  }),
                  transform: [{ scale: motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, item === 2 ? 1.12 : 1, 1] }) }],
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.receiptTx}>tx · 5KqJrLAU7...aH2pK7vNqRcXz8M3</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.ticket, enterStyle]}>
      <View style={styles.ticketTop}>
        <Text style={styles.ticketAmount}>$184.20</Text>
        <Text style={styles.ticketTag}>Split</Text>
      </View>
      <TicketLine label="Wine dinner" value="4 people" />
      <TicketLine label="Each pays" value="$46.05" />
      <TicketLine label="Paid by" value="You" />
      <Animated.View
        style={[
          styles.splitPulse,
          {
            opacity: motion.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.22, 1, 0.22] }),
            transform: [{ translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-82, 82] }) }],
          },
        ]}
      />
      <View style={styles.ticketAvatars}>
        {(["kiran", "asha", "mia", "dev"] as PersonId[]).map((id, index) => (
          <Animated.View
            key={id}
            style={{
              marginLeft: index === 0 ? 0 : -12,
              transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, index % 2 === 0 ? -5 : 5] }) }],
            }}
          >
            <Avatar id={id} ring size={36} />
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

function TicketLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.ticketLine}>
      <Text style={styles.ticketLabel}>{label}</Text>
      <Text style={styles.ticketValue}>{value}</Text>
    </View>
  );
}

function AuthScreen({
  canRetry,
  error,
  intent,
  onSelectWallet,
  onStart,
  onRetry,
  progress,
  running,
  walletPreference,
  walletAddress,
}: {
  canRetry: boolean;
  error: string | null;
  intent: SignatureIntent;
  onSelectWallet: (preference: WalletPreference) => void;
  onStart: () => void;
  onRetry: () => void;
  progress: number;
  running: boolean;
  walletPreference: WalletPreference;
  walletAddress: string | null;
}) {
  const ring = useRef(new Animated.Value(0)).current;
  const isConnect = intent.kind === "connect";
  const walletOptions: Array<{ body: string; id: WalletPreference; label: string; mark: string; tag: string }> = [
    { body: "Seeker-native approval with the side fingerprint sensor.", id: "seeker", label: "Solana Mobile Wallet", mark: "SM", tag: "Recommended" },
    { body: "Installed wallet. Works through Mobile Wallet Adapter.", id: "solflare", label: "Solflare", mark: "SF", tag: "Installed" },
    { body: "Show every MWA-compatible wallet on this phone.", id: "any", label: "Other wallets", mark: "MW", tag: "Adapter" },
  ];

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(ring, { duration: 2400, easing: Easing.out(Easing.cubic), toValue: 1, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [ring]);

  const selectedWallet = walletOptions.find((option) => option.id === walletPreference) || walletOptions[0];
  const idleTitle = isConnect ? "Choose a wallet" : intent.title;
  const idleBody =
    isConnect
      ? `${selectedWallet.label} is selected. Connecting only verifies your public wallet. FundWise cannot move funds from this step.`
      : intent.body;
  const primaryCopy = running ? "Waiting for wallet" : canRetry ? "Try again" : isConnect ? "Connect wallet" : "Approve in wallet";
  const authEyebrow = isConnect
    ? `Mobile Wallet Adapter · ${SOLANA_CHAIN.replace("solana:", "")}`
    : intent.kind === "deposit"
      ? "Seed Vault · Sign deposit"
      : intent.kind === "settle"
        ? "Seed Vault · Sign settlement"
        : "Seed Vault · Sign vote";
  const sensorHint = running ? "Hold finger on side sensor" : isConnect ? "Connect, then approve on the side sensor" : "Ready for side sensor approval";

  return (
    <View style={styles.onboardingScreen}>
      <StatusBar barStyle="dark-content" hidden={false} />
      <View pointerEvents="none" style={[styles.sideSensorRail, running ? styles.sideSensorRailActive : null]}>
        <View style={styles.sideSensorHalo} />
        <View style={styles.sideSensorButton}>
          <Ionicons color={colors.mint} name="finger-print-outline" size={22} />
        </View>
        <View style={styles.sideSensorArrow}>
          <Ionicons color={colors.mint} name="arrow-forward" size={14} />
        </View>
        <Text style={styles.sideSensorLabel}>Side sensor</Text>
      </View>
      <View style={styles.authBody}>
        <Text style={styles.authEyebrow}>{authEyebrow}</Text>
        <Text style={styles.authTitle}>{running ? "Approve in wallet" : idleTitle}</Text>
        <Text style={styles.authCopy}>
          {running ? `Approve in ${selectedWallet.label}, then use the side fingerprint sensor if the wallet asks.` : idleBody}
        </Text>
        {isConnect ? (
          <View style={styles.walletOptions}>
            {walletOptions.map((option) => {
              const active = option.id === walletPreference;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option.id}
                  onPress={() => {
                    triggerHaptic("selection");
                    onSelectWallet(option.id);
                  }}
                  style={[styles.walletOption, active ? styles.walletOptionActive : null]}
                >
                  <View style={styles.walletOptionMark}>
                    <Text style={styles.walletOptionMarkText}>{option.mark}</Text>
                  </View>
                  <View style={styles.flexOne}>
                    <View style={styles.walletOptionHead}>
                      <Text style={styles.walletOptionTitle}>{option.label}</Text>
                      <Text style={[styles.walletOptionTag, active ? styles.walletOptionTagActive : null]}>{option.tag}</Text>
                    </View>
                    <Text style={styles.walletOptionBody}>{option.body}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.signatureIntentCard}>
            <IconTile mark={intent.kind === "vote" ? "Vote" : intent.kind === "deposit" ? "Vault" : "Pay"} size={20} style={styles.signatureIntentIcon} />
            <View style={styles.flexOne}>
              <Text style={styles.signatureIntentTitle}>{intent.title}</Text>
              <Text style={styles.signatureIntentBody}>{intent.body}</Text>
            </View>
          </View>
        )}
        <View pointerEvents="none" style={styles.fpDiagram}>
          <Animated.View
            style={[
              styles.fpRing,
              {
                opacity: ring.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.55, 0] }),
                transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.42] }) }],
              },
            ]}
          />
          <View style={styles.fpIcon}>
            <View style={styles.fpLineOuter} />
            <View style={styles.fpLineInner} />
            <View style={styles.fpLineStem} />
            {running ? <View style={styles.fpScanLine} /> : null}
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.sideSensorHint}>
          <View style={styles.pulseDot} />
          <Text style={styles.sideSensorHintText}>{sensorHint}</Text>
        </View>
        {error ? <Text style={styles.authError}>{error}</Text> : null}
      </View>
      <View style={styles.onboardingFooter}>
        <View style={styles.walletStrip}>
          <View style={styles.walletDot} />
          <Text style={styles.walletStripText}>{walletAddress ? shortAddress(walletAddress, 6) : `${SOLANA_CHAIN.replace("solana:", "")} · Mobile Wallet Adapter`}</Text>
        </View>
        <AppButton disabled={running} onPress={canRetry ? onRetry : onStart}>
          {primaryCopy}
        </AppButton>
      </View>
      <View pointerEvents="none" style={styles.gesturePill} />
    </View>
  );
}

function SuccessScreen({ onDone, state, walletAddress }: { onDone: () => void; state: SuccessState; walletAddress: string | null }) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { damping: 10, mass: 0.8, stiffness: 150, toValue: 1, useNativeDriver: true }).start();
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone, pop]);

  return (
    <View style={styles.successScreen}>
      <StatusBar barStyle="light-content" hidden={false} />
      <View style={styles.successBody}>
        <Animated.View style={[styles.successMark, { opacity: pop, transform: [{ scale: pop }] }]}>
          <Text style={styles.successCheck}>✓</Text>
        </Animated.View>
        <Text style={styles.successTitle}>{state.title}</Text>
        <Text style={styles.successCopy}>{state.body}</Text>
        <View style={styles.successPill}>
          <View style={styles.successDot} />
          <Text style={styles.successPillText}>{state.pill || (walletAddress ? shortAddress(walletAddress, 8) : "Wallet authorized")}</Text>
        </View>
      </View>
      <View pointerEvents="none" style={[styles.gesturePill, styles.gesturePillDark]} />
    </View>
  );
}

function TopHeader({
  onNotifications,
  onProfile,
  walletAddress,
}: {
  onNotifications: () => void;
  onProfile: () => void;
  walletAddress: string | null;
}) {
  return (
    <View style={styles.dashboardTop}>
      <View>
        <Text style={styles.greeting}>Good morning</Text>
        <Text style={styles.userName}>{ME.name} 👋</Text>
      </View>
      <View style={styles.headerActions}>
        <Pressable accessibilityRole="button" onPress={onNotifications} style={styles.iconButton}>
          <Ionicons color={colors.text} name="notifications-outline" size={18} />
          <View style={styles.badge} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onProfile} style={styles.profileButton}>
          <Text style={styles.profileInitial}>{walletAddress ? ME.initial : "?"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NotificationToast({ notification }: { notification: AppNotification }) {
  const motion = useRef(new Animated.Value(0)).current;
  const icon: IoniconName =
    notification.tone === "success"
      ? "checkmark-circle-outline"
      : notification.tone === "warning"
        ? "alert-circle-outline"
        : "notifications-outline";

  useEffect(() => {
    motion.setValue(0);
    Animated.spring(motion, { damping: 15, mass: 0.8, stiffness: 180, toValue: 1, useNativeDriver: true }).start();
  }, [motion, notification.id]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.notificationToast,
        {
          opacity: motion,
          transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }],
        },
      ]}
    >
      <View style={[styles.notificationIcon, notification.tone === "success" ? styles.notificationSuccess : notification.tone === "warning" ? styles.notificationWarning : styles.notificationInfo]}>
        <Ionicons color={notification.tone === "warning" ? "#8A5A00" : notification.tone === "success" ? colors.primaryMid : "#229ED9"} name={icon} size={18} />
      </View>
      <View style={styles.flexOne}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationBody}>{notification.body}</Text>
      </View>
    </Animated.View>
  );
}

function IconTile({
  mark,
  size = 20,
  style,
  tone,
}: {
  mark: string;
  size?: number;
  style: StyleProp<ViewStyle>;
  tone?: IconTone;
}) {
  const resolvedTone = tone || toneForMark(mark);

  return (
    <View
      style={[
        style,
        resolvedTone === "blue" ? styles.iconToneBlue : resolvedTone === "gold" ? styles.iconToneGold : resolvedTone === "telegram" ? styles.iconToneTelegram : resolvedTone === "ink" ? styles.iconToneInk : styles.iconToneGreen,
      ]}
    >
      <Ionicons color={iconColorForTone(resolvedTone)} name={iconForMark(mark)} size={size} />
    </View>
  );
}

function HeroChrome({ fund = false }: { fund?: boolean }) {
  return (
    <>
      <View pointerEvents="none" style={[styles.heroGlow, fund ? styles.heroGlowFund : null]} />
      <View pointerEvents="none" style={styles.heroSheen} />
    </>
  );
}

function getLinkRecoveryMark(intent: FundWiseLinkIntent) {
  if (intent.kind === "settlement-request" || intent.kind === "settlement-blink") {
    return "Pay";
  }

  if (intent.kind === "receipt-graph" || intent.kind === "settlement-receipt") {
    return "Rec";
  }

  return "FW";
}

function LinkRecoveryCard({
  intent,
  loading,
  onConnectWallet,
  onClear,
  onOpen,
  onRetryPreview,
  settlementPreview,
  settlementPreviewError,
  settlementPreviewLoading,
  walletAddress,
}: {
  intent: FundWiseLinkIntent | null;
  loading: boolean;
  onConnectWallet: () => void;
  onClear: () => void;
  onOpen: () => void;
  onRetryPreview: () => void;
  settlementPreview: MobileSettlementRequestPreview | null;
  settlementPreviewError: string | null;
  settlementPreviewLoading: boolean;
  walletAddress: string | null;
}) {
  if (loading) {
    return (
      <View style={styles.linkRecoveryCard}>
        <IconTile mark="FW" size={20} style={styles.linkRecoveryIcon} />
        <View style={styles.flexOne}>
          <Text style={styles.linkRecoveryTitle}>Checking saved link</Text>
          <Text style={styles.linkRecoverySub}>Recovering the latest FundWise handoff on this phone.</Text>
        </View>
      </View>
    );
  }

  if (!intent) {
    return null;
  }

  const detail = getFundWiseLinkDetail(intent);
  const isSettlementLink = intent.kind === "settlement-blink";

  if (isSettlementLink) {
    const canOpenFallback = Boolean(walletAddress || settlementPreview || settlementPreviewError);
    const primaryAction =
      !walletAddress
        ? "Connect wallet"
        : settlementPreviewLoading
          ? "Checking"
          : settlementPreviewError
            ? "Retry preview"
            : settlementPreview?.status === "wrong_wallet"
              ? "Switch wallet"
              : "Continue on FundWise";
    const primaryPress =
      !walletAddress || settlementPreview?.status === "wrong_wallet"
        ? onConnectWallet
        : settlementPreviewError
          ? onRetryPreview
          : onOpen;

    return (
      <View style={styles.settlementRecoveryCard}>
        <View style={styles.settlementRecoveryHead}>
          <IconTile mark="Pay" size={20} style={styles.linkRecoveryIcon} />
          <View style={styles.flexOne}>
            <Text style={styles.linkRecoveryEyebrow}>Recovered settlement link</Text>
            <Text style={styles.settlementRecoveryTitle}>Review before you open FundWise</Text>
          </View>
          {settlementPreview ? (
            <View style={[styles.statusBadge, settlementPreview.status === "ready" ? styles.statusBadgeReady : null]}>
              <Text style={[styles.statusBadgeText, settlementPreview.status === "ready" ? styles.statusBadgeTextReady : null]}>
                {getSettlementPreviewStatusCopy(settlementPreview)}
              </Text>
            </View>
          ) : null}
        </View>

        {settlementPreviewLoading ? (
          <View style={styles.settlementSkeleton}>
            <View style={styles.skeletonAmount} />
            <View style={styles.skeletonLineWide} />
            <View style={styles.skeletonLine} />
          </View>
        ) : settlementPreview ? (
          <View style={styles.settlementPreviewBody}>
            {settlementPreview.amount ? (
              <Text style={styles.settlementPreviewAmount}>
                {settlementPreview.amount.display} <Text style={styles.settlementPreviewToken}>{settlementPreview.amount.token}</Text>
              </Text>
            ) : (
              <Text style={styles.settlementPreviewAmountMuted}>Amount unavailable</Text>
            )}
            <Text style={styles.settlementPreviewRole}>{getSettlementPreviewRoleCopy(settlementPreview)}</Text>
            <View style={styles.settlementMetaGrid}>
              <View style={styles.settlementMetaItem}>
                <Text style={styles.settlementMetaLabel}>Wallet</Text>
                <Text style={styles.settlementMetaValue}>{walletAddress ? shortAddress(walletAddress, 6) : "Not connected"}</Text>
              </View>
              <View style={styles.settlementMetaItem}>
                <Text style={styles.settlementMetaLabel}>Request</Text>
                <Text style={styles.settlementMetaValue}>{shortAddress(settlementPreview.requestId, 5)}</Text>
              </View>
            </View>
            <Text style={styles.settlementPreviewHelp}>{formatSettlementPreviewExpiry(settlementPreview.expiresAt)}</Text>
          </View>
        ) : settlementPreviewError ? (
          <View style={styles.settlementPreviewBody}>
            <Text style={styles.settlementPreviewAmountMuted}>Preview unavailable</Text>
            <Text style={styles.settlementPreviewHelp}>{settlementPreviewError}</Text>
          </View>
        ) : (
          <View style={styles.settlementPreviewBody}>
            <Text style={styles.settlementPreviewAmountMuted}>Wallet needed</Text>
            <Text style={styles.settlementPreviewHelp}>Connect to verify the amount and your role. FundWise cannot move funds when connecting.</Text>
          </View>
        )}

        <View style={styles.settlementRecoveryActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: settlementPreviewLoading, disabled: settlementPreviewLoading }}
            disabled={settlementPreviewLoading}
            onPress={primaryPress}
            style={[styles.linkRecoveryPrimary, styles.settlementRecoveryPrimary, settlementPreviewLoading ? styles.disabled : null]}
          >
            <Text style={styles.linkRecoveryPrimaryText}>{primaryAction}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClear} style={styles.linkRecoverySecondary}>
            <Text style={styles.linkRecoverySecondaryText}>Clear</Text>
          </Pressable>
          {canOpenFallback && !settlementPreviewLoading ? (
            <Pressable accessibilityRole="button" onPress={onOpen} style={styles.linkRecoverySecondary}>
              <Text style={styles.linkRecoverySecondaryText}>Open</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  const previewDetail =
    isSettlementLink && settlementPreviewLoading
      ? "Checking live Settlement amount..."
      : isSettlementLink && settlementPreview
        ? getSettlementPreviewCopy(settlementPreview)
        : isSettlementLink && settlementPreviewError
          ? `Preview unavailable · ${settlementPreviewError}`
          : isSettlementLink && !walletAddress
            ? "Connect wallet to preview amount"
            : null;
  const compactDetail = previewDetail || (detail.length > 24 ? shortAddress(detail, 6) : detail);
  const primaryAction = isSettlementLink && !walletAddress ? "Connect" : "Open";

  return (
    <View style={styles.linkRecoveryCard}>
      <IconTile mark={getLinkRecoveryMark(intent)} size={20} style={styles.linkRecoveryIcon} />
      <View style={styles.flexOne}>
        <Text style={styles.linkRecoveryEyebrow}>Recovered link</Text>
        <Text numberOfLines={1} style={styles.linkRecoveryTitle}>
          {getFundWiseLinkLabel(intent)}
        </Text>
        <Text numberOfLines={1} style={styles.linkRecoverySub}>
          {compactDetail}
        </Text>
      </View>
      <View style={styles.linkRecoveryActions}>
        <Pressable
          accessibilityRole="button"
          onPress={isSettlementLink && !walletAddress ? onConnectWallet : onOpen}
          style={styles.linkRecoveryPrimary}
        >
          <Text style={styles.linkRecoveryPrimaryText}>{primaryAction}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClear} style={styles.linkRecoverySecondary}>
          <Text style={styles.linkRecoverySecondaryText}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HomeScreen({
  groups,
  incomingIntent,
  incomingLoading,
  onAction,
  onClearIncomingLink,
  onConnectWallet,
  onFab,
  onNotify,
  onOpenIncomingLink,
  onOpenGroup,
  onProfile,
  onRetrySettlementPreview,
  onTab,
  settlementPreview,
  settlementPreviewError,
  settlementPreviewLoading,
  walletAddress,
}: {
  groups: FundWiseGroup[];
  incomingIntent: FundWiseLinkIntent | null;
  incomingLoading: boolean;
  onAction: (kind: SheetState) => void;
  onClearIncomingLink: () => void;
  onConnectWallet: () => void;
  onFab: () => void;
  onNotify: (notification: NotifyInput) => void;
  onOpenIncomingLink: () => void;
  onOpenGroup: (group: FundWiseGroup) => void;
  onProfile: () => void;
  onRetrySettlementPreview: () => void;
  onTab: (tab: "home" | "groups" | "activity" | "wallet") => void;
  settlementPreview: MobileSettlementRequestPreview | null;
  settlementPreviewError: string | null;
  settlementPreviewLoading: boolean;
  walletAddress: string | null;
}) {
  return (
    <AppShell activeTab="home" onFab={onFab} onTab={onTab}>
      <TopHeader
        onNotifications={() =>
          onNotify({
            body: "Vote, settlement, receipt, and Fundy Telegram alerts are enabled for this device.",
            title: "Notifications ready",
            tone: "info",
          })
        }
        onProfile={onProfile}
        walletAddress={walletAddress}
      />
      <BalanceHero />
      <LinkRecoveryCard
        intent={incomingIntent}
        loading={incomingLoading}
        onConnectWallet={onConnectWallet}
        onClear={onClearIncomingLink}
        onOpen={onOpenIncomingLink}
        onRetryPreview={onRetrySettlementPreview}
        settlementPreview={settlementPreview}
        settlementPreviewError={settlementPreviewError}
        settlementPreviewLoading={settlementPreviewLoading}
        walletAddress={walletAddress}
      />
      <View style={styles.quickGrid}>
        <QuickAction label="Split" mark="Split" onPress={() => onAction({ kind: "add-expense" })} />
        <QuickAction label="Deposit" mark="In" onPress={() => onAction({ group: groups.find((group): group is FundGroup => group.mode === "fund")!, kind: "deposit" })} />
        <QuickAction label="Settle" mark="Pay" onPress={() => onAction({ kind: "settle-picker" })} />
        <QuickAction label="New group" mark="New" onPress={() => onAction({ kind: "create-group" })} />
      </View>
      <View style={styles.alertStack}>
        <ActionAlert
          body="Amazon gift card $450 · 3 of 4 yes"
          mark="Vote"
          onPress={() => {
            const group = groups.find((item) => item.id === "priya");
            if (group) onOpenGroup(group);
          }}
          title="Vote needed · Priya's Gift"
          tone="vote"
        />
        <ActionAlert
          body="Flatmates · settle in one tap"
          mark="Pay"
          onPress={() => {
            const group = groups.find((item): item is SplitGroup => item.id === "flat" && item.mode === "split");
            if (group) onAction({ kind: "settle", settlement: { ...group.settlements[0], group } });
          }}
          title="You owe Kiran $30"
          tone="settle"
        />
        <ActionAlert body="Open the FundWise mini-app inside any chat" mark="TG" onPress={() => onAction({ kind: "telegram" })} title="Split with anyone, in Telegram" tone="telegram" />
      </View>
      <SectionHeader action="See all" onAction={() => onTab("groups")} title="Your groups" />
      <View style={styles.stack}>
        {groups.map((group) => (
          <GroupCard group={group} key={group.id} onPress={() => onOpenGroup(group)} />
        ))}
      </View>
      <SectionHeader action="View all" onAction={() => onTab("activity")} title="Recent activity" />
      <ActivityList compact />
    </AppShell>
  );
}

function BalanceHero() {
  return (
    <View style={styles.balanceHero}>
      <HeroChrome />
      <Text style={styles.heroLabel}>Net balance · all groups</Text>
      <Text style={styles.heroAmount}>+$39.50</Text>
      <Text style={styles.heroSub}>USDC owed to you across 2 groups</Text>
      <View style={styles.heroStrip}>
        <HeroStat label="You're owed" value="$114.50" />
        <HeroStat label="You owe" value="$75.00" />
        <HeroStat label="In vaults" value="$250" />
      </View>
    </View>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={styles.heroStatValue}>{value}</Text>
    </View>
  );
}

function QuickAction({ label, mark, onPress }: { label: string; mark: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        triggerHaptic("tap");
        onPress();
      }}
      style={({ pressed }) => [styles.quickAction, pressed ? styles.pressed : null]}
    >
      <IconTile mark={mark} size={20} style={styles.quickIcon} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function ActionAlert({
  body,
  mark,
  onPress,
  title,
  tone,
}: {
  body: string;
  mark: string;
  onPress: () => void;
  title: string;
  tone: "vote" | "settle" | "telegram";
}) {
  const alertTone: IconTone = tone === "settle" ? "gold" : tone === "telegram" ? "telegram" : "green";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        triggerHaptic("tap");
        onPress();
      }}
      style={({ pressed }) => [
        styles.actionAlert,
        tone === "vote" ? styles.alertVote : tone === "settle" ? styles.alertSettle : styles.alertTelegram,
        pressed ? styles.pressed : null,
      ]}
    >
      <IconTile mark={mark} size={18} style={styles.alertMark} tone={alertTone} />
      <View style={styles.alertBody}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertSub}>{body}</Text>
      </View>
      <Ionicons color={colors.textSubtle} name="chevron-forward" size={18} />
    </Pressable>
  );
}

function SectionHeader({ action, onAction, title }: { action?: string; onAction?: () => void; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.sectionActionButton}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function GroupCard({ group, onPress }: { group: FundWiseGroup; onPress: () => void }) {
  const split = group.mode === "split";
  const amount = split ? formatUsd(group.myBalance) : `$${group.myContrib}`;
  const label = split ? (group.myBalance >= 0 ? "You're owed" : "You owe") : "Contributed";
  const meta = split ? `${group.members.length} people · ${group.expenses.length} expenses` : `${group.members.length} people · ${Math.round((group.total / group.goal) * 100)}% of goal`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        triggerHaptic("tap");
        onPress();
      }}
      style={({ pressed }) => [styles.groupCard, pressed ? styles.pressed : null]}
    >
      <View style={styles.groupIcon}><Text style={styles.groupIconText}>{group.emoji}</Text></View>
      <View style={styles.groupCopy}>
        <Text style={styles.groupName}>{group.name}</Text>
        <View style={styles.groupMetaRow}>
          <Text style={[styles.modeTag, split ? styles.modeSplit : styles.modeFund]}>{split ? "Split" : "Fund"}</Text>
          <Text style={styles.groupMeta}>{meta}</Text>
        </View>
      </View>
      <View style={styles.groupRight}>
        <Text style={[styles.groupAmount, split && group.myBalance < 0 ? styles.negative : split ? styles.positive : null]}>{amount}</Text>
        <Text style={styles.groupRightLabel}>{label}</Text>
      </View>
    </Pressable>
  );
}

function SplitGroupScreen({
  group,
  onBack,
  onInvite,
  onSettle,
  onSheet,
}: {
  group: SplitGroup;
  onBack: () => void;
  onInvite: () => void;
  onSettle: () => void;
  onSheet: (sheet: SheetState) => void;
}) {
  const byDay = group.expenses.reduce<Record<string, SplitGroup["expenses"]>>((acc, expense) => {
    acc[expense.day] = [...(acc[expense.day] || []), expense];
    return acc;
  }, {});

  return (
    <View style={styles.appScreen}>
      <HeaderNav onBack={onBack} onRight={onInvite} rightLabel="Invite" title={group.name} />
      <ScrollView contentContainerStyle={[styles.scrollContent, styles.detailScroll]} showsVerticalScrollIndicator={false}>
        <View style={styles.splitHero}>
          <HeroChrome />
          <View style={styles.heroRow}>
            <Text style={styles.bigEmoji}>{group.emoji}</Text>
            <View style={styles.alignRight}>
              <Text style={styles.heroLabel}>Your balance</Text>
              <Text style={styles.detailAmount}>{formatUsd(group.myBalance)}</Text>
              <Text style={styles.heroSub}>{group.myBalance >= 0 ? "You're owed" : "You owe"} · {group.currency}</Text>
            </View>
          </View>
          <View style={styles.membersLine}>
            <AvatarStack ids={group.members} />
            <Text style={styles.membersText}>{group.members.length} members</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.balanceChipRow} horizontal showsHorizontalScrollIndicator={false}>
          {group.balances.map((balance) => (
            <View key={balance.who} style={styles.balanceChip}>
              <Text style={styles.balanceChipName}>{personOf(balance.who).name}</Text>
              <Text style={[styles.balanceChipValue, balance.v >= 0 ? styles.positive : styles.negative]}>{formatUsd(balance.v)}</Text>
            </View>
          ))}
        </ScrollView>
        <ActionAlert body="Open the mini-app in any chat to add expenses" mark="TG" onPress={() => onSheet({ group, kind: "telegram" })} title="Share this group on Telegram" tone="telegram" />
        {Object.entries(byDay).map(([day, items]) => (
          <View key={day}>
            <Text style={styles.dayHeader}>{day}</Text>
            <View style={styles.stack}>
              {items.map((expense) => (
                <View key={expense.id} style={styles.expenseRow}>
                  <View style={styles.expenseIcon}><Text style={styles.expenseIconText}>{expense.icon}</Text></View>
                  <View style={styles.expenseCopy}>
                    <Text style={styles.expenseTitle}>{expense.name}</Text>
                    <Text style={styles.expenseMeta}>{personOf(expense.payer).name} paid · {group.members.length} ways</Text>
                  </View>
                  <View style={styles.alignRight}>
                    <Text style={styles.expenseTotal}>${expense.total.toFixed(2)}</Text>
                    <Text style={[styles.expenseShare, expense.myShare >= 0 ? styles.positive : styles.negative]}>
                      {expense.myShare >= 0 ? `lent +$${expense.myShare.toFixed(2)}` : `owe -$${Math.abs(expense.myShare).toFixed(2)}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.actionBar}>
        <AppButton onPress={() => onSheet({ kind: "add-expense" })} style={styles.flexOne} variant="ghost">Add expense</AppButton>
        <AppButton onPress={onSettle} style={styles.flexOne}>Settle up</AppButton>
      </View>
      <View pointerEvents="none" style={styles.gesturePill} />
    </View>
  );
}

function FundGroupScreen({
  group,
  onBack,
  onInvite,
  onSheet,
}: {
  group: FundGroup;
  onBack: () => void;
  onInvite: () => void;
  onSheet: (sheet: SheetState) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.min(100, Math.round((group.total / group.goal) * 100));

  return (
    <View style={styles.appScreen}>
      <HeaderNav onBack={onBack} onRight={onInvite} rightLabel="Invite" title={group.name} />
      <ScrollView contentContainerStyle={[styles.scrollContent, styles.detailScroll]} showsVerticalScrollIndicator={false}>
        <View style={[styles.splitHero, styles.fundHero]}>
          <HeroChrome fund />
          <View style={styles.heroRow}>
            <Text style={styles.bigEmoji}>{group.emoji}</Text>
            <View style={styles.alignRight}>
              <Text style={styles.heroLabel}>Pool liquidity</Text>
              <Text style={styles.detailAmount}>${group.total}</Text>
              <Text style={styles.heroSub}>{group.currency} · {pct}% of ${group.goal} goal</Text>
            </View>
          </View>
          <View style={styles.goalTrack}><View style={[styles.goalFill, { width: `${pct}%` }]} /></View>
          <View style={styles.goalRow}>
            <Text style={styles.heroSub}>Goal · ${group.goal}</Text>
            <Text style={styles.heroSub}>{group.members.length} members · 3-of-5 multisig</Text>
          </View>
        </View>
        <View style={styles.contributionCard}>
          <Avatar id="you" size={40} />
          <View style={styles.flexOne}>
            <Text style={styles.cardSubtle}>Your contribution</Text>
            <Text style={styles.contributionAmount}>${group.myContrib}</Text>
            <Text style={styles.monoTiny}>{Math.round((group.myContrib / group.total) * 100)}% of pool</Text>
          </View>
          <AppButton onPress={() => onSheet({ group, kind: "deposit" })} style={styles.smallButton}>Top up</AppButton>
        </View>
        <ActionAlert body="Members vote inside the chat" mark="TG" onPress={() => onSheet({ group, kind: "telegram" })} title="Share to Telegram" tone="telegram" />
        <SectionHeader action="+ New" onAction={() => onSheet({ group, kind: "propose" })} title="Proposals" />
        <View style={styles.stack}>
          {group.proposals.map((proposal) => (
            <ProposalCard group={group} key={proposal.id} onVote={(choice) => onSheet({ choice, groupId: group.id, kind: "vote", proposal })} proposal={proposal} />
          ))}
        </View>
        <SectionHeader action={expanded ? "Hide" : "Show all"} onAction={() => setExpanded((value) => !value)} title="Members" />
        {expanded ? (
          <View style={styles.memberList}>
            {group.members.map((id) => (
              <View key={id} style={styles.memberRow}>
                <Avatar id={id} size={34} />
                <View style={styles.flexOne}>
                  <Text style={styles.memberName}>{personOf(id).name}{id === "you" ? " · me" : ""}</Text>
                  <Text style={styles.cardSubtle}>Joined · signed</Text>
                </View>
                {id === "you" ? <Text style={styles.memberContrib}>${group.myContrib}</Text> : null}
              </View>
            ))}
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setExpanded(true)} style={styles.membersCollapsed}>
            <AvatarStack ids={group.members} />
            <Text style={styles.membersText}>{group.members.length} members in this pool</Text>
            <Ionicons color={colors.textSubtle} name="chevron-forward" size={18} />
          </Pressable>
        )}
      </ScrollView>
      <View style={styles.actionBar}>
        <AppButton onPress={() => onSheet({ group, kind: "propose" })} style={styles.flexOne}>New proposal</AppButton>
      </View>
      <View pointerEvents="none" style={styles.gesturePill} />
    </View>
  );
}

function HeaderNav({ onBack, onRight, rightLabel, title }: { onBack: () => void; onRight?: () => void; rightLabel?: string; title: string }) {
  return (
    <View style={styles.headerNav}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.navButton}>
        <Ionicons color={colors.text} name="chevron-back" size={22} />
      </Pressable>
      <Text numberOfLines={1} style={styles.navTitle}>{title}</Text>
      {onRight ? (
        <Pressable accessibilityRole="button" onPress={onRight} style={styles.navRight}><Text style={styles.navRightText}>{rightLabel}</Text></Pressable>
      ) : (
        <View style={styles.navRight} />
      )}
    </View>
  );
}

function ProposalCard({ group, onVote, proposal }: { group: FundGroup; onVote: (choice: "yes" | "no") => void; proposal: Proposal }) {
  const yesPct = Math.round((proposal.yes / proposal.total) * 100);

  return (
    <View style={styles.proposalCard}>
      <View style={styles.heroRow}>
        <View style={styles.flexOne}>
          <Text style={styles.proposalTitle}>{proposal.title}</Text>
          <Text style={styles.proposalMemo}>{proposal.memo}</Text>
        </View>
        <Text style={[styles.proposalStatus, proposal.status === "pending" ? styles.statusPending : proposal.status === "approved" ? styles.statusApproved : styles.statusExecuted]}>
          {proposal.status}
        </Text>
      </View>
      <Text style={styles.proposalAmount}>${proposal.amt}</Text>
      <View style={styles.proposalTrack}><View style={[styles.proposalFill, { width: `${yesPct}%` }]} /></View>
      <View style={styles.goalRow}>
        <Text style={styles.cardSubtle}>{proposal.yes}/{proposal.total} approved</Text>
        <Text style={styles.cardSubtle}>{proposal.status === "pending" ? `${proposal.total - proposal.yes - proposal.no} undecided` : `Vault · ${group.currency}`}</Text>
      </View>
      {proposal.status === "pending" ? (
        <View style={styles.voteButtons}>
          <AppButton onPress={() => onVote("no")} style={styles.flexOne} variant="ghost">Reject</AppButton>
          <AppButton onPress={() => onVote("yes")} style={styles.flexOne}>Approve</AppButton>
        </View>
      ) : null}
    </View>
  );
}

function GroupsScreen({ groups, onCreate, onFab, onOpenGroup, onTab }: { groups: FundWiseGroup[]; onCreate: () => void; onFab: () => void; onOpenGroup: (group: FundWiseGroup) => void; onTab: (tab: "home" | "groups" | "activity" | "wallet") => void }) {
  const [filter, setFilter] = useState<"all" | "split" | "fund">("all");
  const filtered = groups.filter((group) => filter === "all" || group.mode === filter);

  return (
    <AppShell activeTab="groups" onFab={onFab} onTab={onTab}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Groups</Text>
        <Pressable accessibilityRole="button" onPress={onCreate} style={styles.addButton}>
          <Ionicons color={colors.white} name="add" size={23} />
        </Pressable>
      </View>
      <SegmentedTabs active={filter} labels={[["all", "All"], ["split", "Split"], ["fund", "Fund"]]} onChange={setFilter} />
      <View style={styles.stack}>
        {filtered.map((group) => (
          <GroupCard group={group} key={group.id} onPress={() => onOpenGroup(group)} />
        ))}
      </View>
    </AppShell>
  );
}

function ActivityScreen({ onFab, onTab }: { onFab: () => void; onTab: (tab: "home" | "groups" | "activity" | "wallet") => void }) {
  const [filter, setFilter] = useState<"all" | "expenses" | "settlements" | "votes">("all");

  return (
    <AppShell activeTab="activity" onFab={onFab} onTab={onTab}>
      <View style={styles.pageHeader}><Text style={styles.pageTitle}>Activity</Text></View>
      <SegmentedTabs active={filter} labels={[["all", "All"], ["expenses", "Expenses"], ["settlements", "Settlements"], ["votes", "Votes"]]} onChange={setFilter} />
      <ActivityList />
    </AppShell>
  );
}

function WalletScreen({
  isOnline,
  onFab,
  onProfile,
  onTab,
  onTelegram,
  walletAddress,
}: {
  isOnline: boolean;
  onFab: () => void;
  onProfile: () => void;
  onTab: (tab: "home" | "groups" | "activity" | "wallet") => void;
  onTelegram: () => void;
  walletAddress: string | null;
}) {
  const device = useMemo(() => getSeekerDeviceInfo(), []);

  return (
    <AppShell activeTab="wallet" onFab={onFab} onTab={onTab}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Wallet</Text>
        <Pressable accessibilityRole="button" onPress={onProfile} style={styles.profileButton}><Text style={styles.profileInitial}>{ME.initial}</Text></Pressable>
      </View>
      <View style={styles.balanceHero}>
        <HeroChrome />
        <Text style={styles.heroLabel}>Wallet balance</Text>
        <Text style={styles.heroAmount}>$248.30</Text>
        <Text style={styles.heroSub}>USDC · {SOLANA_CHAIN.replace("solana:", "")}</Text>
        <View style={styles.heroStrip}>
          <HeroStat label="Device" value={device.isSeekerDevice ? "Seeker" : device.model || "Android"} />
          <HeroStat label="RPC" value={isOnline ? "Online" : "Offline"} />
          <HeroStat label="Fees · 30d" value="$0.01" />
        </View>
      </View>
      <View style={styles.quickGrid}>
        <QuickAction label="Receive" mark="In" onPress={() => undefined} />
        <QuickAction label="Send" mark="Out" onPress={() => undefined} />
        <QuickAction label="QR" mark="QR" onPress={() => undefined} />
        <QuickAction label="Telegram" mark="TG" onPress={onTelegram} />
      </View>
      <SectionHeader title="Recent transactions" />
      <ActivityList />
      <SectionHeader title="Address" />
      <View style={styles.addressBox}>
        <Text numberOfLines={1} style={styles.addressText}>{walletAddress || "Wallet not connected"}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            triggerHaptic("tap");
            if (walletAddress) void Share.share({ message: walletAddress });
          }}
          style={styles.copyChip}
        >
          <Text style={styles.copyChipText}>Copy</Text>
        </Pressable>
      </View>
    </AppShell>
  );
}

function ActivityList({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.stack}>
      {(compact ? ACTIVITY.slice(0, 4) : ACTIVITY).map((activity) => (
        <View key={activity.id} style={styles.activityRow}>
          <View style={styles.activityIcon}><Text style={styles.activityIconText}>{activity.icon}</Text></View>
          <View style={styles.flexOne}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activitySub}>{activity.sub}</Text>
          </View>
          <Text style={[styles.activityValue, activity.kind === "pos" ? styles.positive : activity.kind === "neg" ? styles.negative : null]}>{activity.value}</Text>
        </View>
      ))}
    </View>
  );
}

function SegmentedTabs<T extends string>({ active, labels, onChange }: { active: T; labels: [T, string][]; onChange: (value: T) => void }) {
  return (
    <View style={styles.segmented}>
      {labels.map(([value, label]) => (
        <Pressable
          accessibilityRole="button"
          key={value}
          onPress={() => {
            triggerHaptic("selection");
            onChange(value);
          }}
          style={[styles.segment, active === value ? styles.segmentActive : null]}
        >
          <Text style={[styles.segmentText, active === value ? styles.segmentTextActive : null]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function BottomNav({ active, onFab, onTab }: { active: "home" | "groups" | "activity" | "wallet"; onFab: () => void; onTab: (tab: "home" | "groups" | "activity" | "wallet") => void }) {
  const tabs = [
    ["home", "Home"],
    ["groups", "Groups"],
    ["activity", "Activity"],
    ["wallet", "Wallet"],
  ] as const;

  return (
    <View style={styles.bottomNav}>
      {tabs.slice(0, 2).map(([id, label]) => (
        <NavButton active={active === id} id={id} key={id} label={label} onTab={onTab} />
      ))}
      <Pressable accessibilityRole="button" onPress={onFab} style={styles.fab}>
        <Ionicons color={colors.white} name="add" size={26} />
      </Pressable>
      {tabs.slice(2).map(([id, label]) => (
        <NavButton active={active === id} id={id} key={id} label={label} onTab={onTab} />
      ))}
    </View>
  );
}

function NavButton({ active, id, label, onTab }: { active: boolean; id: "home" | "groups" | "activity" | "wallet"; label: string; onTab: (tab: "home" | "groups" | "activity" | "wallet") => void }) {
  const icon = active ? NAV_ICONS[id].active : NAV_ICONS[id].inactive;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        triggerHaptic("tap");
        onTab(id);
      }}
      style={styles.navItem}
    >
      <Ionicons color={active ? colors.primaryMid : colors.textSubtle} name={icon} size={20} />
      <Text style={[styles.navLabel, active ? styles.navActive : null]}>{label}</Text>
    </Pressable>
  );
}

function BottomSheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <View style={styles.sheetOverlay}>
      <Pressable accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.sheetClose}>
            <Ionicons color={colors.textSoft} name="close" size={18} />
          </Pressable>
        </View>
        {children}
      </View>
    </View>
  );
}

function ActiveSheet({
  onClose,
  onComplete,
  onDepositSigned,
  onNotify,
  onOpenSheet,
  onReplayIntro,
  onSignature,
  onSettlementSigned,
  sheet,
}: {
  onClose: () => void;
  onComplete: (success: SuccessState, notification?: NotifyInput) => void;
  onDepositSigned: (group: FundGroup, amount: number) => void;
  onNotify: (notification: NotifyInput) => void;
  onOpenSheet: (sheet: SheetState) => void;
  onReplayIntro: () => void;
  onSignature: (intent: SignatureIntent) => void;
  onSettlementSigned: (settlement: SettlementOption) => void;
  sheet: SheetState;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const markShared = useCallback((key: string, notification: NotifyInput) => {
    setCopiedKey(key);
    onNotify(notification);
    setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500);
  }, [onNotify]);

  if (sheet.kind === "fab") {
    const fund = GROUPS.find((group): group is FundGroup => group.mode === "fund")!;
    return (
      <BottomSheet onClose={onClose} title="Quick actions">
        <SheetAction body="Log a cost · split with the group" mark="Split" onPress={() => onOpenSheet({ kind: "add-expense" })} title="Add expense" />
        <SheetAction body="Pay what you owe · receive what you're owed" mark="Pay" onPress={() => onOpenSheet({ kind: "settle-picker" })} title="Settle up" />
        <SheetAction body="Top up a Fund-mode group" mark="Vault" onPress={() => onOpenSheet({ group: fund, kind: "deposit" })} title="Deposit to vault" />
        <SheetAction body="Split or Fund · invite people" mark="New" onPress={() => onOpenSheet({ kind: "create-group" })} title="New group" />
      </BottomSheet>
    );
  }

  if (sheet.kind === "settle-picker") {
    const options = GROUPS.filter((group): group is SplitGroup => group.mode === "split").flatMap((group) =>
      group.settlements.filter((settlement) => settlement.from === "you" || settlement.to === "you").map((settlement) => ({ ...settlement, group })),
    );
    return (
      <BottomSheet onClose={onClose} title="Settle up">
        <Text style={styles.sheetHelp}>Pick a balance to review. Payment continues on FundWise web until mobile transaction intents are live.</Text>
        {options.map((settlement, index) => (
          <SheetAction
            body={`${settlement.group.emoji} ${settlement.group.name}`}
            key={`${settlement.group.id}-${index}`}
            mark={settlement.to === "you" ? "In" : "Out"}
            onPress={() => onOpenSheet({ kind: "settle", settlement })}
            right={formatUsd(settlement.to === "you" ? settlement.amt : -settlement.amt)}
            title={settlement.to === "you" ? `${personOf(settlement.from).name} owes you` : `You owe ${personOf(settlement.to).name}`}
          />
        ))}
      </BottomSheet>
    );
  }

  if (sheet.kind === "settle") {
    const settlement = sheet.settlement;
    const paying = settlement.from === "you";
    const counterparty = paying ? settlement.to : settlement.from;
    return (
      <BottomSheet onClose={onClose} title={paying ? "Settle up" : "Request payment"}>
        <View style={styles.previewCard}>
          <Avatar id="you" size={42} />
          <Text style={styles.previewArrow}>{paying ? "->" : "<-"}</Text>
          <Avatar id={counterparty} size={42} />
        </View>
        <Text style={styles.previewAmount}>${settlement.amt.toFixed(2)}</Text>
        <MetaRow label={paying ? "To" : "From"} value={personOf(counterparty).name} />
        <MetaRow label="Group" value={`${settlement.group.emoji} ${settlement.group.name}`} />
        <MetaRow label="Token" value={`USDC · ${SOLANA_CHAIN.replace("solana:", "")}`} />
        <MetaRow label="Fee" value="~$0.00025 · <1s" />
        <MetaRow label="Confirmation" value="Solana mainnet" />
        <Text style={styles.sheetHelp}>
          {paying ? "Review the transfer, then sign with your Seeker side sensor." : "Send a request so the payer can settle from their wallet."}
        </Text>
        <AppButton
          onPress={() => {
            if (!paying) {
              void Share.share({ message: `${personOf(settlement.from).name}, please settle $${settlement.amt.toFixed(2)} for ${settlement.group.name}. ${FUNDWISE_WEB_URL}/groups/${settlement.group.id}` });
              return;
            }

            onSignature({
              apply: () => onSettlementSigned(settlement),
              body: `Pay ${personOf(settlement.to).name} $${settlement.amt.toFixed(2)} USDC for ${settlement.group.name}.`,
              groupId: settlement.group.id,
              kind: "settle",
              returnScreen: "split",
              successBody: "Transaction confirmed on Solana mainnet.",
              successTitle: "Settlement sent",
              title: "Authorize payment",
            });
          }}
          style={styles.sheetPrimary}
        >
          {paying ? "Sign & pay" : "Request payment"}
        </AppButton>
      </BottomSheet>
    );
  }

  if (sheet.kind === "deposit") {
    return (
      <DepositSheet
        group={sheet.group}
        onClose={onClose}
        onSign={(amount) =>
          onSignature({
            apply: () => onDepositSigned(sheet.group, amount),
            body: `Deposit $${amount.toFixed(2)} USDC into ${sheet.group.name}.`,
            groupId: sheet.group.id,
            kind: "deposit",
            returnScreen: "fund",
            successBody: "Funds were added to the group vault.",
            successTitle: "Deposit signed",
            title: "Sign deposit",
          })
        }
      />
    );
  }

  if (sheet.kind === "vote") {
    return (
      <BottomSheet onClose={onClose} title={sheet.choice === "yes" ? "Approve proposal" : "Reject proposal"}>
        <View style={styles.previewCard}>
          <View style={styles.flexOne}>
            <Text style={styles.monoTiny}>Proposal</Text>
            <Text style={styles.sheetLarge}>{sheet.proposal.title}</Text>
            <Text style={styles.sheetHelp}>{sheet.proposal.memo}</Text>
          </View>
          <Text style={styles.previewAmountSmall}>${sheet.proposal.amt}</Text>
        </View>
        <MetaRow label="Your vote" value={sheet.choice === "yes" ? "Approve" : "Reject"} />
        <MetaRow label="Current tally" value={`${sheet.proposal.yes} approve · ${sheet.proposal.no} reject`} />
        <MetaRow label="Threshold" value={`3 of ${sheet.proposal.total} required`} />
        <AppButton
          onPress={() =>
            onSignature({
              body: "Use the side fingerprint reader to sign this proposal vote.",
              groupId: sheet.groupId,
              kind: "vote",
              returnScreen: "fund",
              successBody: "Your signed vote was captured for the group vault.",
              successTitle: "Vote signed",
              title: "Sign your vote",
            })
          }
          style={styles.sheetPrimary}
        >
          Sign vote
        </AppButton>
      </BottomSheet>
    );
  }

  if (sheet.kind === "telegram") {
    const link = buildFundyTelegramUrl({ groupId: sheet.group?.id, mode: sheet.group ? "group" : "dm" });
    const shareMessage = sheet.group
      ? `Add Fundy to ${sheet.group.name} on Telegram: ${link}`
      : `Open Fundy on Telegram: ${link}`;
    return (
      <BottomSheet onClose={onClose} title="Open in Telegram">
        <View style={styles.telegramHero}>
          <View style={styles.telegramMark}>
            <Ionicons color={colors.white} name="paper-plane-outline" size={24} />
          </View>
          <View style={styles.flexOne}>
            <Text style={styles.telegramTitle}>Fundy · Agent</Text>
            <Text style={styles.telegramSub}>{sheet.group ? `Add to ${sheet.group.name}` : "Split anywhere · in any chat"}</Text>
          </View>
        </View>
        <Text style={styles.sheetHelp}>Open Fundy inside Telegram to add expenses, vote on proposals, and settle balances without leaving the conversation.</Text>
        <View style={styles.addressBox}>
          <Text style={styles.addressText}>{link}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void Share.share({ message: shareMessage });
              markShared("telegram", {
                body: sheet.group ? "Group-aware Telegram invite is ready to send." : "Fundy Telegram redirect is ready to send.",
                title: "Fundy link ready",
                tone: "success",
              });
            }}
            style={styles.copyChip}
          >
            <Text style={styles.copyChipText}>{copiedKey === "telegram" ? "Ready" : "Share"}</Text>
          </Pressable>
        </View>
        <AppButton
          onPress={() => {
            onNotify({
              body: sheet.group ? `Opening Fundy with ${sheet.group.name} context.` : "Opening Fundy in Telegram.",
              title: "Opening Telegram",
              tone: "info",
            });
            void Linking.openURL(link);
          }}
          style={styles.sheetPrimary}
          variant="blue"
        >
          {sheet.group ? "Add Fundy to Telegram" : "Open Fundy in Telegram"}
        </AppButton>
      </BottomSheet>
    );
  }

  if (sheet.kind === "invite") {
    const link = `${FUNDWISE_WEB_URL}/join/${sheet.group?.id || "group"}`;
    return (
      <BottomSheet onClose={onClose} title={`Invite to ${sheet.group?.name || "group"}`}>
        <Text style={styles.sheetHelp}>Share this link. Anyone with a Solana wallet can join in 2 taps.</Text>
        <View style={styles.addressBox}>
          <Text style={styles.addressText}>{link}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void Share.share({ message: link });
              markShared("invite", {
                body: `${sheet.group?.name || "Group"} invite is ready to send.`,
                title: "Invite link ready",
                tone: "success",
              });
            }}
            style={styles.copyChip}
          >
            <Text style={styles.copyChipText}>{copiedKey === "invite" ? "Ready" : "Share"}</Text>
          </Pressable>
        </View>
        <View style={styles.quickGrid}>
          <QuickAction label="Telegram" mark="TG" onPress={() => onOpenSheet({ group: sheet.group, kind: "telegram" })} />
          <QuickAction
            label="QR"
            mark="QR"
            onPress={() =>
              onNotify({
                body: "QR invite handoff is queued for the native share sheet.",
                title: "QR coming next",
                tone: "info",
              })
            }
          />
          <QuickAction label="SMS" mark="SMS" onPress={() => void Share.share({ message: link })} />
          <QuickAction label="More" mark="More" onPress={() => void Share.share({ message: link })} />
        </View>
      </BottomSheet>
    );
  }

  if (sheet.kind === "add-expense") {
    return (
      <AddExpenseSheet
        onClose={onClose}
        onSave={(draft) =>
          onComplete(
            {
              body: "Split calculated. Everyone is notified.",
              pill: draft.groupName,
              returnScreen: "home",
              title: "Expense added",
            },
            {
              body: `${draft.groupName} members were notified about ${draft.memo}.`,
              title: "Expense notification sent",
              tone: "success",
            },
          )
        }
      />
    );
  }

  if (sheet.kind === "propose") {
    return (
      <ProposeSheet
        group={sheet.group}
        onClose={onClose}
        onSubmit={(proposalTitle) =>
          onComplete(
            {
              body: "Members can review and vote from FundWise or Telegram.",
              pill: sheet.group.name,
              returnScreen: "fund",
              title: "Proposal opened",
            },
            {
              body: `${sheet.group.name} members were notified about ${proposalTitle}.`,
              title: "Vote notification sent",
              tone: "success",
            },
          )
        }
      />
    );
  }

  if (sheet.kind === "create-group") {
    return (
      <CreateGroupSheet
        onClose={onClose}
        onCreate={(groupName) =>
          onComplete(
            {
              body: "Share the invite link to add members.",
              pill: groupName,
              returnScreen: "groups",
              title: "Group created",
            },
            {
              body: `${groupName} is ready for invites.`,
              title: "Group notification ready",
              tone: "success",
            },
          )
        }
      />
    );
  }

  return <ProfileSheet onClose={onClose} onNotify={onNotify} onReplayIntro={onReplayIntro} />;
}

function SheetAction({ body, mark, onPress, right, title }: { body: string; mark: string; onPress: () => void; right?: string; title: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        triggerHaptic("tap");
        onPress();
      }}
      style={({ pressed }) => [styles.sheetAction, pressed ? styles.pressed : null]}
    >
      <IconTile mark={mark} size={20} style={styles.sheetActionIcon} />
      <View style={styles.flexOne}>
        <Text style={styles.sheetActionTitle}>{title}</Text>
        <Text style={styles.sheetActionBody}>{body}</Text>
      </View>
      {right ? <Text style={styles.sheetActionRight}>{right}</Text> : <Ionicons color={colors.textSubtle} name="chevron-forward" size={18} />}
    </Pressable>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function DepositSheet({ group, onClose, onSign }: { group: FundGroup; onClose: () => void; onSign: (amount: number) => void }) {
  const [amount, setAmount] = useState("100");
  const parsedAmount = Number(amount);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;

  return (
    <BottomSheet onClose={onClose} title={`Deposit · ${group.name}`}>
      <LabeledInput label="Amount" onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ""))} value={`$${amount}`} />
      <View style={styles.pillRow}>
        {["25", "50", "100", "250"].map((value) => (
          <Pressable accessibilityRole="button" key={value} onPress={() => setAmount(value)} style={[styles.pill, amount === value ? styles.pillActive : null]}>
            <Text style={[styles.pillText, amount === value ? styles.pillTextActive : null]}>${value}</Text>
          </Pressable>
        ))}
      </View>
      <MetaRow label="From" value="Your wallet · $248.30" />
      <MetaRow label="To" value={`${group.emoji} ${group.name} vault`} />
      <MetaRow label="Token" value={`USDC · ${SOLANA_CHAIN.replace("solana:", "")}`} />
      <MetaRow label="Fee" value="~$0.00025 · <1s" />
      <Text style={styles.sheetHelp}>Deposits are signed through the wallet and confirmed with the Seeker side sensor.</Text>
      <AppButton
        disabled={!validAmount}
        onPress={() => onSign(parsedAmount)}
        style={styles.sheetPrimary}
      >
        Sign deposit
      </AppButton>
    </BottomSheet>
  );
}

function AddExpenseSheet({ onClose, onSave }: { onClose: () => void; onSave: (draft: { amount: number; groupName: string; memo: string }) => void }) {
  const splitGroups = GROUPS.filter((group): group is SplitGroup => group.mode === "split");
  const [amount, setAmount] = useState("48.00");
  const [groupId, setGroupId] = useState(splitGroups[0]?.id || "lisbon");
  const [memo, setMemo] = useState("Wine dinner");
  const activeGroup = splitGroups.find((group) => group.id === groupId) || splitGroups[0];
  const parsedAmount = Number(amount);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const members = activeGroup?.members || (["you", "kiran", "asha", "dev"] as PersonId[]);
  const share = validAmount ? parsedAmount / members.length : 0;

  return (
    <BottomSheet onClose={onClose} title="Add expense">
      <LabeledInput label="Amount" onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ""))} value={`$${amount}`} />
      <LabeledInput label="What for?" onChangeText={setMemo} placeholder="e.g. Wine dinner" value={memo} />
      <Text style={styles.fieldLabel}>Group</Text>
      <View style={styles.pillRow}>
        {splitGroups.map((group) => (
          <Pressable accessibilityRole="button" key={group.id} onPress={() => setGroupId(group.id)} style={[styles.pill, group.id === groupId ? styles.pillActive : null]}>
            <Text style={[styles.pillText, group.id === groupId ? styles.pillTextActive : null]}>{group.emoji} {group.name}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.fieldLabel}>Live equal split</Text>
      <View style={styles.memberList}>
        {members.map((id) => (
          <View key={id} style={styles.memberRow}>
            <Avatar id={id} size={30} />
            <Text style={styles.memberName}>{personOf(id).name}</Text>
            <Text style={styles.memberContrib}>${share.toFixed(2)}</Text>
          </View>
        ))}
      </View>
      <AppButton disabled={!validAmount || !memo.trim()} onPress={() => onSave({ amount: parsedAmount, groupName: activeGroup?.name || "Group", memo: memo.trim() || "Expense" })} style={styles.sheetPrimary}>Save expense</AppButton>
    </BottomSheet>
  );
}

function ProposeSheet({ group, onClose, onSubmit }: { group: FundGroup; onClose: () => void; onSubmit: (proposalTitle: string) => void }) {
  const [title, setTitle] = useState("Gift card order");
  return (
    <BottomSheet onClose={onClose} title="New proposal">
      <LabeledInput label="Amount to spend" value="$200" />
      <LabeledInput label="Title" onChangeText={setTitle} placeholder="e.g. Gift card order" value={title} />
      <LabeledInput label="Memo" placeholder="Amazon · $450" value="" />
      <Text style={styles.sheetHelp}>Needs 3 of {group.members.length} approvals before the vault can execute the payout.</Text>
      <AppButton onPress={() => onSubmit(title.trim() || "Proposal")} style={styles.sheetPrimary}>Open vote</AppButton>
    </BottomSheet>
  );
}

function CreateGroupSheet({ onClose, onCreate }: { onClose: () => void; onCreate: (groupName: string) => void }) {
  const [mode, setMode] = useState<"split" | "fund">("split");
  const [name, setName] = useState("New group");
  return (
    <BottomSheet onClose={onClose} title="New group">
      <Text style={styles.fieldLabel}>Pick a mode</Text>
      <View style={styles.pillRow}>
        <Pressable accessibilityRole="button" onPress={() => setMode("split")} style={[styles.pill, mode === "split" ? styles.pillActive : null]}><Text style={[styles.pillText, mode === "split" ? styles.pillTextActive : null]}>Split</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setMode("fund")} style={[styles.pill, mode === "fund" ? styles.pillActive : null]}><Text style={[styles.pillText, mode === "fund" ? styles.pillTextActive : null]}>Fund</Text></Pressable>
      </View>
      <LabeledInput label="Group name" onChangeText={setName} placeholder="e.g. Lisbon Trip" value={name} />
      <Text style={styles.fieldLabel}>Stablecoin</Text>
      <View style={styles.pillRow}>
        {["USDC", "USDT", "PYUSD"].map((token) => (
          <Pressable accessibilityRole="button" key={token} style={[styles.pill, token === "USDC" ? styles.pillActive : null]}><Text style={[styles.pillText, token === "USDC" ? styles.pillTextActive : null]}>{token}</Text></Pressable>
        ))}
      </View>
      <AppButton onPress={() => onCreate(name.trim() || (mode === "split" ? "Split group" : "Fund group"))} style={styles.sheetPrimary}>Create group</AppButton>
    </BottomSheet>
  );
}

function ProfileSheet({ onClose, onNotify, onReplayIntro }: { onClose: () => void; onNotify: (notification: NotifyInput) => void; onReplayIntro: () => void }) {
  return (
    <BottomSheet onClose={onClose} title="Profile">
      <View style={styles.profileSheetTop}>
        <View style={styles.profileButtonLarge}><Text style={styles.profileInitialLarge}>{ME.initial}</Text></View>
        <View>
          <Text style={styles.sheetLarge}>{ME.name}</Text>
          <Text style={styles.sheetHelp}>Seed Vault · biometrics</Text>
        </View>
      </View>
      <SheetAction body="Replay the Seeker intro and wallet explanation" mark="FW" onPress={onReplayIntro} title="Replay intro" />
      {["Security", "Notifications", "Default token", "Network", "Connected dApps", "Help & support"].map((row) => (
        <SheetAction
          body={row === "Network" ? SOLANA_CHAIN.replace("solana:", "") : "FundWise setting"}
          key={row}
          mark={row}
          onPress={() => {
            if (row === "Notifications") {
              onNotify({
                body: "Vote, settlement, receipt, and Telegram alerts use this in-app notification layer.",
                title: "Notifications enabled",
                tone: "info",
              });
            }
          }}
          title={row}
        />
      ))}
    </BottomSheet>
  );
}

function LabeledInput({ label, onChangeText, placeholder, value }: { label: string; onChangeText?: (value: string) => void; placeholder?: string; value: string }) {
  const [localValue, setLocalValue] = useState(value);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        onChangeText={(next) => {
          setLocalValue(next);
          onChangeText?.(next);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        style={styles.input}
        value={localValue}
      />
    </View>
  );
}

export function FundWiseSeekerAppScreen() {
  const { account } = useMobileWallet();
  const [screen, setScreen] = useState<ScreenId>("boot");
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [groups, setGroups] = useState<FundWiseGroup[]>(GROUPS);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("lisbon");
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [intent, setIntent] = useState<SignatureIntent | null>(null);
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [success, setSuccess] = useState<SuccessState>({ body: "Signature verified by Seed Vault.", returnScreen: "home", title: "Wallet connected" });
  const [runningAuth, setRunningAuth] = useState(false);
  const [authProgress, setAuthProgress] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [walletPreference, setWalletPreference] = useState<WalletPreference>("seeker");
  const [authorizedWalletAddress, setAuthorizedWalletAddress] = useState<string | null>(null);
  const [settlementPreview, setSettlementPreview] = useState<MobileSettlementRequestPreview | null>(null);
  const [settlementPreviewError, setSettlementPreviewError] = useState<string | null>(null);
  const [settlementPreviewLoading, setSettlementPreviewLoading] = useState(false);
  const [settlementPreviewRefreshKey, setSettlementPreviewRefreshKey] = useState(0);
  const isOnline = useNetworkStatus();
  const incomingLink = useIncomingFundWiseLink();
  const walletAddress = walletAddressToString(account?.address) || authorizedWalletAddress;
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || groups[0];
  const incomingIntent = useMemo(
    () => (incomingLink.url ? parseFundWiseLink(incomingLink.url, FUNDWISE_WEB_URL, RECEIPTS_URL, FUNDWISE_ALLOWED_HOSTS) : null),
    [incomingLink.url],
  );
  const incomingSettlementRequestId =
    incomingIntent?.kind === "settlement-blink" ? incomingIntent.requestId || null : null;

  useEffect(() => {
    let cancelled = false;

    async function loadOnboardingState() {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);

        if (cancelled) {
          return;
        }

        setOnboardingChecked(true);

        if (completed === "true") {
          setScreen("home");
        }
      } catch {
        if (!cancelled) {
          setOnboardingChecked(true);
        }
      }
    }

    void loadOnboardingState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!onboardingChecked) {
      return undefined;
    }

    if (screen === "boot") {
      const timer = setTimeout(() => setScreen("welcome"), BOOT_MS);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [onboardingChecked, screen]);

  useEffect(() => {
    let cancelled = false;

    async function loadSettlementPreview(requestId: string, viewerWallet: string) {
      setSettlementPreview(null);
      setSettlementPreviewError(null);
      setSettlementPreviewLoading(true);

      const result = await getMobileSettlementRequestPreview(requestId, viewerWallet);

      if (cancelled) {
        return;
      }

      setSettlementPreviewLoading(false);

      if (!result.ok) {
        setSettlementPreviewError(result.error);
        return;
      }

      setSettlementPreview(result.data);
    }

    if (!incomingSettlementRequestId) {
      setSettlementPreview(null);
      setSettlementPreviewError(null);
      setSettlementPreviewLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!walletAddress) {
      setSettlementPreview(null);
      setSettlementPreviewError(null);
      setSettlementPreviewLoading(false);
      return () => {
        cancelled = true;
      };
    }

    void loadSettlementPreview(incomingSettlementRequestId, walletAddress);

    return () => {
      cancelled = true;
    };
  }, [incomingSettlementRequestId, settlementPreviewRefreshKey, walletAddress]);

  useEffect(() => {
    if (!incomingLink.loading && incomingLink.url && screen !== "auth" && screen !== "success") {
      setScreen("home");
    }
  }, [incomingLink.loading, incomingLink.url, screen]);

  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setNotification((current) => (current?.id === notification.id ? null : current));
    }, 2600);

    return () => clearTimeout(timer);
  }, [notification]);

  const notify = useCallback((nextNotification: NotifyInput) => {
    setNotification({ ...nextNotification, id: Date.now() });
    triggerHaptic(nextNotification.tone === "warning" ? "warning" : nextNotification.tone === "success" ? "success" : "tap");
  }, []);

  const openGroup = useCallback((group: FundWiseGroup) => {
    setSelectedGroupId(group.id);
    setScreen(group.mode === "split" ? "split" : "fund");
  }, []);

  const goTab = useCallback((tab: "home" | "groups" | "activity" | "wallet") => {
    setScreen(tab);
  }, []);

  const startSignature = useCallback((nextIntent: SignatureIntent) => {
    setSheet(null);
    setIntent(nextIntent);
    setAuthError(null);
    setAuthProgress(0);
    setScreen("auth");
  }, []);

  const connectIntent = useMemo<SignatureIntent>(
    () => ({
      body: "Place your finger on the side sensor when your wallet asks. FundWise never receives private keys.",
      kind: "connect",
      returnScreen: "home",
      successBody: "Signature verified by Seed Vault. You're ready to fund and split.",
      successTitle: "Wallet connected",
      title: "Place your finger on the sensor",
    }),
    [],
  );

  const activeIntent = intent || connectIntent;

  const runSignature = useCallback(async () => {
    if (runningAuth) {
      return;
    }

    setAuthError(null);
    setRunningAuth(true);
    setAuthProgress(18);
    triggerHaptic("selection");
    let progressTimer: ReturnType<typeof setInterval> | null = null;

    try {
      progressTimer = setInterval(() => setAuthProgress((current) => Math.min(current + 16, 88)), 260);

      const message = [
        "FundWise Seeker",
        `domain=${new URL(FUNDWISE_WEB_URL).host}`,
        `cluster=${SOLANA_CHAIN}`,
        `intent=${activeIntent.kind}`,
        `ts=${new Date().toISOString()}`,
      ].join("\n");

      const authorization = await transact(async (wallet) => {
        const result = await wallet.authorize({
          chain: SOLANA_CHAIN,
          identity: FUNDWISE_IDENTITY,
        });
        const authorizedAddress = result.accounts[0]?.address;

        if (!authorizedAddress) {
          throw new Error("Wallet did not return an account.");
        }

        const signed = await wallet.signMessages({
          addresses: [authorizedAddress],
          payloads: [bytesFromString(message)],
        });

        return {
          address: authorizedAddress,
          signedMessage: signed[0],
        };
      });

      const authorizedAddress = new PublicKey(base64ToBytes(authorization.address)).toBase58();
      setAuthorizedWalletAddress(authorizedAddress);
      console.log("[FundWise] MWA approval completed", {
        address: authorizedAddress,
        signedMessageBytes: authorization.signedMessage.length,
      });
      if (progressTimer) clearInterval(progressTimer);
      activeIntent.apply?.();
      setAuthProgress(100);
      triggerHaptic("success");
      setSuccess({
        body: activeIntent.successBody,
        returnScreen: activeIntent.returnScreen,
        title: activeIntent.successTitle,
      });
      setTimeout(() => {
        if (activeIntent.groupId) setSelectedGroupId(activeIntent.groupId);
        setRunningAuth(false);
        setAuthProgress(0);
        setScreen("success");
      }, 260);
    } catch (error) {
      if (progressTimer) clearInterval(progressTimer);
      console.warn("[FundWise] MWA approval failed", walletErrorDebug(error));
      setRunningAuth(false);
      setAuthProgress(0);
      setAuthError(readableWalletError(error));
      triggerHaptic("warning");
    }
  }, [activeIntent, runningAuth]);

  const afterSuccess = useCallback(() => {
    void AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setScreen(success.returnScreen);
    setIntent(null);
  }, [success.returnScreen]);

  const onSettleSelected = useCallback(() => {
    if (selectedGroup.mode !== "split") {
      setSheet({ kind: "settle-picker" });
      return;
    }
    const settlement = selectedGroup.settlements.find((item) => item.from === "you" || item.to === "you");
    if (!settlement) {
      setSheet({ kind: "settle-picker" });
      return;
    }
    setSheet({ kind: "settle", settlement: { ...settlement, group: selectedGroup } });
  }, [selectedGroup]);

  const applySettlement = useCallback((settlement: SettlementOption) => {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== settlement.group.id || group.mode !== "split") {
          return group;
        }

        return {
          ...group,
          settlements: group.settlements.filter(
            (item) => !(item.from === settlement.from && item.to === settlement.to && item.amt === settlement.amt),
          ),
        };
      }),
    );
  }, []);

  const applyDeposit = useCallback((targetGroup: FundGroup, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    setGroups((current) =>
      current.map((group) => {
        if (group.id !== targetGroup.id || group.mode !== "fund") {
          return group;
        }

        return {
          ...group,
          myContrib: group.myContrib + amount,
          total: group.total + amount,
        };
      }),
    );
  }, []);

  const completeWithSuccess = useCallback((nextSuccess: SuccessState, nextNotification?: NotifyInput) => {
    setSheet(null);
    setSuccess(nextSuccess);
    if (nextNotification) {
      notify(nextNotification);
    }
    setScreen("success");
  }, [notify]);

  const openIncomingLink = useCallback(() => {
    if (settlementPreview?.fallbackUrl) {
      void Linking.openURL(normalizeFundWiseUrl(settlementPreview.fallbackUrl));
      return;
    }

    if (incomingLink.url) {
      void Linking.openURL(incomingLink.url);
    }
  }, [incomingLink.url, settlementPreview?.fallbackUrl]);

  const clearIncomingLink = useCallback(() => {
    void incomingLink.clear();
  }, [incomingLink.clear]);

  const replayIntro = useCallback(() => {
    void AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setSheet(null);
    setIntent(null);
    setAuthError(null);
    setRunningAuth(false);
    setAuthProgress(0);
    setScreen("welcome");
  }, []);

  const content = (() => {
    if (screen === "boot") return <BootScreen onDone={() => onboardingChecked && setScreen("welcome")} />;
    if (screen === "welcome") {
      return (
        <WelcomeScreen
          onNext={() => {
            triggerHaptic("tap");
            setScreen("tour");
          }}
        />
      );
    }
    if (screen === "tour") return <TourScreen onAuth={() => startSignature(connectIntent)} onSkip={() => startSignature(connectIntent)} />;
    if (screen === "auth") {
      return (
        <AuthScreen
          canRetry={Boolean(authError) && !runningAuth}
          error={authError}
          intent={activeIntent}
          onSelectWallet={(preference) => {
            setWalletPreference(preference);
            if (authError && !runningAuth) {
              setAuthError(null);
            }
          }}
          onStart={() => void runSignature()}
          onRetry={() => void runSignature()}
          progress={authProgress}
          running={runningAuth}
          walletPreference={walletPreference}
          walletAddress={walletAddress}
        />
      );
    }
    if (screen === "success") return <SuccessScreen onDone={afterSuccess} state={success} walletAddress={walletAddress} />;
    if (screen === "groups") return <GroupsScreen groups={groups} onCreate={() => setSheet({ kind: "create-group" })} onFab={() => setSheet({ kind: "fab" })} onOpenGroup={openGroup} onTab={goTab} />;
    if (screen === "activity") return <ActivityScreen onFab={() => setSheet({ kind: "fab" })} onTab={goTab} />;
    if (screen === "wallet") {
      return <WalletScreen isOnline={isOnline} onFab={() => setSheet({ kind: "fab" })} onProfile={() => setSheet({ kind: "profile" })} onTab={goTab} onTelegram={() => setSheet({ kind: "telegram" })} walletAddress={walletAddress} />;
    }
    if (screen === "split" && selectedGroup.mode === "split") {
      return (
        <SplitGroupScreen
          group={selectedGroup}
          onBack={() => setScreen("home")}
          onInvite={() => setSheet({ group: selectedGroup, kind: "invite" })}
          onSettle={onSettleSelected}
          onSheet={setSheet}
        />
      );
    }
    if (screen === "fund" && selectedGroup.mode === "fund") {
      return <FundGroupScreen group={selectedGroup} onBack={() => setScreen("home")} onInvite={() => setSheet({ group: selectedGroup, kind: "invite" })} onSheet={setSheet} />;
    }
    return (
      <HomeScreen
        groups={groups}
        incomingIntent={incomingIntent}
        incomingLoading={incomingLink.loading}
        onAction={setSheet}
        onClearIncomingLink={clearIncomingLink}
        onConnectWallet={() => startSignature(connectIntent)}
        onFab={() => setSheet({ kind: "fab" })}
        onNotify={notify}
        onOpenGroup={openGroup}
        onOpenIncomingLink={openIncomingLink}
        onProfile={() => setSheet({ kind: "profile" })}
        onRetrySettlementPreview={() => setSettlementPreviewRefreshKey((current) => current + 1)}
        onTab={goTab}
        settlementPreview={settlementPreview}
        settlementPreviewError={settlementPreviewError}
        settlementPreviewLoading={settlementPreviewLoading}
        walletAddress={walletAddress}
      />
    );
  })();

  return (
    <View style={styles.root}>
      {content}
      {sheet ? (
        <ActiveSheet
          onClose={() => setSheet(null)}
          onComplete={completeWithSuccess}
          onDepositSigned={applyDeposit}
          onNotify={notify}
          onOpenSheet={setSheet}
          onReplayIntro={replayIntro}
          onSignature={(nextIntent) => {
            if (nextIntent.kind === "vote" && nextIntent.groupId) {
              nextIntent.apply = () => {
                setGroups((current) =>
                  current.map((group) => {
                    if (group.id !== nextIntent.groupId || group.mode !== "fund") return group;
                    return {
                      ...group,
                      proposals: group.proposals.map((proposal) =>
                        proposal.status === "pending" && proposal.myVote === null
                          ? { ...proposal, myVote: "yes", yes: proposal.yes + 1, status: proposal.yes + 1 >= 3 ? "approved" : proposal.status }
                          : proposal,
                      ),
                    };
                  }),
                );
              };
            }
            startSignature(nextIntent);
          }}
          onSettlementSigned={applySettlement}
          sheet={sheet}
        />
      ) : null}
      {notification ? <NotificationToast notification={notification} /> : null}
    </View>
  );
}

const serif = "serif";
const mono = "monospace";

const styles = StyleSheet.create({
  actionAlert: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionBar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    left: 0,
    paddingBottom: 20,
    paddingHorizontal: 18,
    paddingTop: 12,
    position: "absolute",
    right: 0,
  },
  activityIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  activityIconText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 20,
  },
  activityRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  activitySub: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  activityTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  activityValue: {
    color: colors.textSoft,
    fontFamily: mono,
    fontSize: 12,
    fontWeight: "800",
  },
  addButton: {
    alignItems: "center",
    backgroundColor: colors.primaryMid,
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "500",
    marginTop: -2,
  },
  addressBox: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    padding: 12,
  },
  addressText: {
    color: colors.textSoft,
    flex: 1,
    fontFamily: mono,
    fontSize: 11,
    fontWeight: "700",
  },
  alertBody: {
    flex: 1,
  },
  alertMark: {
    alignItems: "center",
    backgroundColor: colors.primaryPale,
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  alertMarkText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "900",
  },
  alertSettle: {
    backgroundColor: "rgba(160,120,22,0.06)",
    borderColor: "rgba(160,120,22,0.25)",
  },
  alertStack: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  alertSub: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 2,
  },
  alertTelegram: {
    backgroundColor: "rgba(34,158,217,0.06)",
    borderColor: "rgba(34,158,217,0.25)",
  },
  alertTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  alertVote: {
    backgroundColor: "rgba(78,201,138,0.08)",
    borderColor: "rgba(78,201,138,0.28)",
  },
  alignRight: {
    alignItems: "flex-end",
  },
  appScreen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  authBody: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  authCopy: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 300,
    textAlign: "center",
  },
  authError: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 14,
    maxWidth: 300,
    textAlign: "center",
  },
  authEyebrow: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  authMethodTab: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  authMethodTabActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.primaryDeep,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  authMethodTabs: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    marginBottom: 22,
    maxWidth: 330,
    padding: 4,
    width: "100%",
  },
  authMethodText: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: "900",
  },
  authMethodTextActive: {
    color: colors.primaryDeep,
  },
  authTitle: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 37,
    textAlign: "center",
  },
  walletOption: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: "100%",
  },
  walletOptionActive: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primaryMid,
  },
  walletOptionBody: {
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
    marginTop: 2,
  },
  walletOptionHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  walletOptionMark: {
    alignItems: "center",
    backgroundColor: colors.primaryDeep,
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  walletOptionMarkText: {
    color: colors.white,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "900",
  },
  walletOptions: {
    gap: 7,
    marginTop: 14,
    maxWidth: 350,
    width: "100%",
  },
  walletOptionTag: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  walletOptionTagActive: {
    color: colors.primaryMid,
  },
  walletOptionTitle: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRest: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.bg,
    borderWidth: 2,
    justifyContent: "center",
  },
  avatarRestText: {
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: "900",
  },
  avatarStack: {
    alignItems: "center",
    flexDirection: "row",
  },
  avatarText: {
    fontWeight: "900",
  },
  badge: {
    backgroundColor: colors.danger,
    borderColor: colors.white,
    borderRadius: 5,
    borderWidth: 2,
    height: 10,
    position: "absolute",
    right: 8,
    top: 8,
    width: 10,
  },
  balanceChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 106,
    padding: 12,
  },
  balanceChipName: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  balanceChipRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  balanceChipValue: {
    fontFamily: mono,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },
  balanceHero: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 22,
    elevation: 4,
    marginHorizontal: 20,
    marginTop: 12,
    overflow: "hidden",
    padding: 22,
    position: "relative",
    shadowColor: colors.primaryDeep,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  bigEmoji: {
    color: colors.white,
    fontSize: 30,
    lineHeight: 38,
  },
  bootBottom: {
    backgroundColor: colors.mint,
    left: 41,
    top: 126,
    width: 158,
  },
  bootCopy: {
    alignItems: "center",
  },
  bootGlow: {
    backgroundColor: "rgba(78,201,138,0.18)",
    borderRadius: 150,
    height: 280,
    position: "absolute",
    top: "24%",
    width: 280,
  },
  bootLogo: {
    height: 200,
    marginBottom: 28,
    width: 240,
  },
  bootLoadbar: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 1,
    bottom: 80,
    height: 2,
    overflow: "hidden",
    position: "absolute",
    width: 120,
  },
  bootLoadSweep: {
    backgroundColor: colors.mint,
    borderRadius: 1,
    height: 2,
    opacity: 0.9,
    width: 56,
  },
  bootMid: {
    backgroundColor: colors.primaryMid,
    left: 28,
    top: 78,
    width: 184,
  },
  bootScreen: {
    alignItems: "center",
    backgroundColor: colors.darkDeep,
    flex: 1,
    justifyContent: "center",
  },
  bootSlab: {
    borderRadius: 14,
    height: 36,
    position: "absolute",
  },
  bootTag: {
    color: "#8A99AD",
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 10,
    textTransform: "uppercase",
  },
  bootTop: {
    backgroundColor: colors.primaryDeep,
    left: 35,
    top: 30,
    width: 170,
  },
  bottomNav: {
    alignItems: "center",
    backgroundColor: "rgba(244,241,234,0.94)",
    borderColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    elevation: 8,
    flexDirection: "row",
    height: 84,
    justifyContent: "space-around",
    left: 0,
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    position: "absolute",
    right: 0,
    shadowColor: colors.text,
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  button: {
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  buttonBlue: {
    backgroundColor: "#229ED9",
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderWidth: 1,
  },
  buttonGhostText: {
    color: colors.textSoft,
  },
  buttonPrimary: {
    backgroundColor: colors.primaryDeep,
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  cardSubtle: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: "700",
  },
  checkBadge: {
    alignItems: "center",
    backgroundColor: colors.primaryMid,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  checkBadgeText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },
  chevron: {
    color: colors.textSubtle,
    fontSize: 24,
    fontWeight: "300",
  },
  coin: {
    alignItems: "center",
    backgroundColor: colors.mint,
    borderColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    width: 24,
    zIndex: 2,
  },
  coinOne: {
    left: 48,
    top: 0,
  },
  coinText: {
    color: colors.white,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "900",
  },
  coinThree: {
    left: 108,
    top: -14,
  },
  coinTwo: {
    right: 36,
    top: -6,
  },
  contributionAmount: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 24,
    fontWeight: "700",
  },
  contributionCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
  },
  copyChip: {
    backgroundColor: colors.primaryPale,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  copyChipText: {
    color: colors.primaryMid,
    fontSize: 11,
    fontWeight: "900",
  },
  dayHeader: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginHorizontal: 20,
    marginTop: 18,
    textTransform: "uppercase",
  },
  detailAmount: {
    color: colors.white,
    fontFamily: serif,
    fontSize: 34,
    fontWeight: "700",
  },
  detailScroll: {
    paddingBottom: 112,
  },
  dashboardTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  dot: {
    backgroundColor: "rgba(13,31,20,0.12)",
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  dotActive: {
    backgroundColor: colors.primaryMid,
    width: 24,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  expenseCopy: {
    flex: 1,
  },
  expenseIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 11,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  expenseIconText: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 21,
  },
  expenseMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  expenseRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  expenseShare: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
  expenseTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  expenseTotal: {
    color: colors.text,
    fontFamily: mono,
    fontSize: 12,
    fontWeight: "900",
  },
  fab: {
    alignItems: "center",
    backgroundColor: colors.primaryMid,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 18,
    borderWidth: 1,
    elevation: 8,
    height: 54,
    justifyContent: "center",
    marginTop: -24,
    shadowColor: colors.primaryMid,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    width: 54,
  },
  field: {
    gap: 7,
    marginBottom: 14,
  },
  fieldLabel: {
    color: colors.textSoft,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  flexOne: {
    flex: 1,
  },
  flexTwo: {
    flex: 2,
  },
  fpDiagram: {
    alignItems: "center",
    height: 132,
    justifyContent: "center",
    marginVertical: 10,
    width: 132,
  },
  fpIcon: {
    alignItems: "center",
    backgroundColor: colors.primaryMid,
    borderRadius: 38,
    height: 76,
    justifyContent: "center",
    width: 76,
  },
  fpLineInner: {
    borderColor: colors.white,
    borderRadius: 14,
    borderWidth: 2,
    height: 36,
    position: "absolute",
    width: 25,
  },
  fpLineOuter: {
    borderColor: colors.white,
    borderRadius: 19,
    borderWidth: 2,
    height: 52,
    position: "absolute",
    width: 38,
  },
  fpLineStem: {
    backgroundColor: colors.white,
    borderRadius: 2,
    height: 30,
    position: "absolute",
    top: 36,
    width: 3,
  },
  fpRing: {
    borderColor: "rgba(78,201,138,0.5)",
    borderRadius: 88,
    borderWidth: 2,
    height: 176,
    position: "absolute",
    width: 176,
  },
  fpScanLine: {
    backgroundColor: colors.mint,
    borderRadius: 2,
    height: 3,
    left: 13,
    position: "absolute",
    right: 13,
    top: 48,
  },
  fundHero: {
    backgroundColor: colors.fundBlue,
  },
  gesturePill: {
    alignSelf: "center",
    backgroundColor: "rgba(13,31,20,0.35)",
    borderRadius: 999,
    bottom: 8,
    height: 4,
    position: "absolute",
    width: 128,
  },
  gesturePillDark: {
    backgroundColor: "rgba(255,255,255,0.48)",
  },
  goalFill: {
    backgroundColor: colors.mint,
    borderRadius: 3,
    height: 6,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  goalTrack: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 3,
    height: 6,
    marginTop: 16,
    overflow: "hidden",
  },
  greeting: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  groupAmount: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 16,
    fontWeight: "700",
  },
  groupCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 76,
    padding: 12,
  },
  groupCopy: {
    flex: 1,
  },
  groupIcon: {
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  groupIconText: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 23,
  },
  groupMeta: {
    color: colors.textSubtle,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "600",
  },
  groupMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 4,
  },
  groupName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  groupRight: {
    alignItems: "flex-end",
  },
  groupRightLabel: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "800",
    marginTop: 3,
    textTransform: "uppercase",
  },
  haloBlur: {
    backgroundColor: colors.mint,
    borderRadius: 90,
    height: 178,
    opacity: 0.22,
    position: "absolute",
    width: 178,
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  headerNav: {
    alignItems: "center",
    backgroundColor: colors.bg,
    flexDirection: "row",
    gap: 10,
    paddingBottom: 10,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  heroAmount: {
    color: colors.white,
    fontFamily: serif,
    fontSize: 40,
    fontWeight: "700",
    marginTop: 6,
  },
  heroGlow: {
    backgroundColor: colors.mint,
    borderRadius: 110,
    height: 170,
    opacity: 0.34,
    position: "absolute",
    right: -54,
    top: -56,
    width: 220,
  },
  heroGlowFund: {
    backgroundColor: colors.fundBlueBorder,
    opacity: 0.26,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  heroRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroStat: {
    flex: 1,
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 10,
    fontWeight: "700",
  },
  heroStatValue: {
    color: colors.white,
    fontFamily: serif,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 3,
  },
  heroSheen: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 80,
    height: 86,
    position: "absolute",
    right: -78,
    top: 34,
    transform: [{ rotate: "-16deg" }],
    width: 230,
  },
  heroStrip: {
    borderColor: "rgba(255,255,255,0.18)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    paddingTop: 14,
  },
  heroSub: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  iconButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  iconToneBlue: {
    backgroundColor: colors.fundBluePale,
  },
  iconToneGold: {
    backgroundColor: "rgba(160,120,22,0.16)",
  },
  iconToneGreen: {
    backgroundColor: "rgba(13,107,58,0.08)",
  },
  iconToneInk: {
    backgroundColor: colors.surfaceInset,
  },
  iconToneTelegram: {
    backgroundColor: "rgba(34,158,217,0.13)",
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    minHeight: 48,
    paddingHorizontal: 13,
  },
  linkRecoveryActions: {
    gap: 6,
  },
  linkRecoveryCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 14,
    minHeight: 86,
    padding: 12,
  },
  linkRecoveryEyebrow: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  linkRecoveryIcon: {
    alignItems: "center",
    backgroundColor: colors.primaryPale,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  linkRecoveryIconText: {
    color: colors.primaryMid,
    fontSize: 10,
    fontWeight: "900",
  },
  linkRecoveryPrimary: {
    alignItems: "center",
    backgroundColor: colors.primaryMid,
    borderRadius: 10,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  linkRecoveryPrimaryText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },
  linkRecoverySecondary: {
    alignItems: "center",
    backgroundColor: colors.surfaceInset,
    borderRadius: 10,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  linkRecoverySecondaryText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "900",
  },
  linkRecoverySub: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 2,
  },
  linkRecoveryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  settlementMetaGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  settlementMetaItem: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  settlementMetaLabel: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  settlementMetaValue: {
    color: colors.text,
    fontFamily: mono,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },
  settlementPreviewAmount: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 40,
  },
  settlementPreviewAmountMuted: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 25,
    fontWeight: "700",
    lineHeight: 31,
  },
  settlementPreviewBody: {
    marginTop: 18,
  },
  settlementPreviewHelp: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 10,
  },
  settlementPreviewRole: {
    color: colors.primaryMid,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },
  settlementPreviewToken: {
    color: colors.textSoft,
    fontFamily: mono,
    fontSize: 14,
    fontWeight: "900",
  },
  settlementRecoveryActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  settlementRecoveryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    shadowColor: colors.primaryDeep,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  settlementRecoveryHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  settlementRecoveryPrimary: {
    flex: 1,
    minHeight: 42,
  },
  settlementRecoveryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 19,
    marginTop: 2,
  },
  settlementSkeleton: {
    gap: 9,
    marginTop: 18,
  },
  skeletonAmount: {
    backgroundColor: colors.surfaceInset,
    borderRadius: 12,
    height: 38,
    width: "48%",
  },
  skeletonLine: {
    backgroundColor: colors.surfaceInset,
    borderRadius: 999,
    height: 12,
    width: "42%",
  },
  skeletonLineWide: {
    backgroundColor: colors.surfaceInset,
    borderRadius: 999,
    height: 12,
    width: "74%",
  },
  statusBadge: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusBadgeReady: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primaryMid,
  },
  statusBadgeText: {
    color: colors.textSoft,
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statusBadgeTextReady: {
    color: colors.primaryMid,
  },
  jar: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderColor: colors.text,
    borderWidth: 2,
    borderTopWidth: 0,
    height: 180,
    justifyContent: "center",
    overflow: "hidden",
    width: 150,
    zIndex: 1,
  },
  jarAmount: {
    color: colors.white,
    fontFamily: serif,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 6,
    zIndex: 2,
  },
  jarFill: {
    backgroundColor: colors.primaryMid,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
  jarLabel: {
    color: "rgba(255,255,255,0.86)",
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: "uppercase",
    zIndex: 2,
  },
  jarLip: {
    backgroundColor: colors.text,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    height: 8,
    left: -2,
    position: "absolute",
    right: -2,
    top: -8,
  },
  jarWrap: {
    height: 180,
    position: "relative",
    width: 150,
  },
  jarWave: {
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 999,
    height: 6,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  logoSlab: {
    position: "absolute",
  },
  memberContrib: {
    color: colors.text,
    fontFamily: mono,
    fontSize: 13,
    fontWeight: "900",
  },
  memberList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 20,
    overflow: "hidden",
  },
  memberName: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
  },
  memberRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  membersCollapsed: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    padding: 14,
  },
  membersLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  membersText: {
    color: colors.textSoft,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  metaLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: "700",
  },
  metaRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11,
  },
  metaValue: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
  },
  modeFund: {
    backgroundColor: colors.fundBluePale,
    color: colors.fundBlue,
  },
  modeSplit: {
    backgroundColor: colors.primaryPale,
    color: colors.primaryMid,
  },
  modeTag: {
    borderRadius: 5,
    fontFamily: mono,
    fontSize: 8,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 5,
    paddingVertical: 2,
    textTransform: "uppercase",
  },
  monoTiny: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  navActive: {
    color: colors.primaryMid,
  },
  navButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  navButtonText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "300",
    marginTop: -3,
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    gap: 2,
    justifyContent: "center",
    minHeight: 52,
  },
  navLabel: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: "800",
  },
  navMark: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: "900",
  },
  navRight: {
    alignItems: "center",
    minWidth: 58,
  },
  navRightText: {
    color: colors.primaryMid,
    fontSize: 12,
    fontWeight: "900",
  },
  navTitle: {
    color: colors.text,
    flex: 1,
    fontFamily: serif,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  negative: {
    color: colors.danger,
  },
  notificationBody: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
    marginTop: 1,
  },
  notificationIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  notificationInfo: {
    backgroundColor: "rgba(34,158,217,0.12)",
  },
  notificationSuccess: {
    backgroundColor: colors.primaryPale,
  },
  notificationTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  notificationToast: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    left: 16,
    padding: 12,
    position: "absolute",
    right: 16,
    shadowColor: "#0D1F14",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { height: 10, width: 0 },
    top: 44,
    zIndex: 90,
  },
  notificationWarning: {
    backgroundColor: colors.warningPale,
  },
  onboardingBody: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  onboardingFooter: {
    gap: 10,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  onboardingScreen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  pageHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  pageTitle: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 30,
    fontWeight: "700",
  },
  pill: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pillActive: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primaryMid,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  pillText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "900",
  },
  pillTextActive: {
    color: colors.primaryMid,
  },
  poolIllustration: {
    alignItems: "center",
    height: 220,
    justifyContent: "flex-end",
    overflow: "visible",
    position: "relative",
    width: 260,
  },
  positive: {
    color: colors.primaryMid,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  previewAmount: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  previewAmountSmall: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 24,
    fontWeight: "700",
  },
  previewArrow: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 18,
    fontWeight: "900",
  },
  previewCard: {
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: 14,
    flexDirection: "row",
    gap: 14,
    justifyContent: "center",
    marginBottom: 14,
    padding: 16,
  },
  profileButton: {
    alignItems: "center",
    backgroundColor: colors.primaryMid,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  profileButtonLarge: {
    alignItems: "center",
    backgroundColor: colors.primaryMid,
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  profileInitial: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  profileInitialLarge: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
  },
  profileSheetTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
  },
  progressFill: {
    backgroundColor: colors.mint,
    borderRadius: 2,
    height: 4,
  },
  progressTrack: {
    backgroundColor: "rgba(13,31,20,0.08)",
    borderRadius: 2,
    height: 4,
    marginBottom: 18,
    overflow: "hidden",
    width: 230,
  },
  proposalAmount: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 26,
    fontWeight: "700",
    marginTop: 8,
  },
  proposalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  proposalFill: {
    backgroundColor: colors.primaryMid,
    borderRadius: 3,
    height: 6,
  },
  proposalMemo: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  proposalStatus: {
    borderRadius: 8,
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  proposalTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  proposalTrack: {
    backgroundColor: colors.surfaceInset,
    borderRadius: 3,
    height: 6,
    marginTop: 12,
    overflow: "hidden",
  },
  pulseDot: {
    backgroundColor: colors.mint,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  quickAction: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 7,
    minHeight: 82,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  quickIcon: {
    alignItems: "center",
    backgroundColor: colors.primaryPale,
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  quickIconText: {
    color: colors.primaryMid,
    fontSize: 10,
    fontWeight: "900",
  },
  quickLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  receipt: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    width: 260,
  },
  receiptAmount: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 36,
    fontWeight: "700",
    marginTop: 14,
  },
  receiptMeta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  receiptStatus: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  receiptTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  chainMini: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
  chainMiniBlock: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.borderStrong,
    borderRadius: 7,
    borderWidth: 1,
    height: 18,
    width: 42,
  },
  receiptTx: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 14,
  },
  receiptWhere: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  root: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  scrollContent: {
    paddingBottom: 104,
  },
  sectionAction: {
    color: colors.primaryMid,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  sectionActionButton: {
    minHeight: 40,
    justifyContent: "center",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  segment: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 38,
  },
  segmentActive: {
    backgroundColor: colors.surface,
  },
  segmentText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: "900",
  },
  segmented: {
    backgroundColor: colors.surfaceInset,
    borderRadius: 14,
    flexDirection: "row",
    gap: 4,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 4,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    bottom: 0,
    left: 0,
    maxHeight: "92%",
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    position: "absolute",
    right: 0,
  },
  sheetAction: {
    alignItems: "center",
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 8,
    minHeight: 70,
    padding: 14,
  },
  sheetActionBody: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  sheetActionIcon: {
    alignItems: "center",
    backgroundColor: colors.primaryPale,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  sheetActionIconText: {
    color: colors.primaryMid,
    fontSize: 10,
    fontWeight: "900",
  },
  sheetActionRight: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 12,
    fontWeight: "900",
  },
  sheetActionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  sheetClose: {
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  sheetCloseText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "300",
    marginTop: -2,
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: "rgba(13,31,20,0.12)",
    borderRadius: 2,
    height: 4,
    marginBottom: 12,
    width: 36,
  },
  sheetHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetHelp: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 12,
  },
  sheetLarge: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 22,
    fontWeight: "700",
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,16,11,0.42)",
    justifyContent: "flex-end",
  },
  sheetPrimary: {
    marginTop: 16,
  },
  sheetTitle: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 22,
    fontWeight: "700",
  },
  sideSensorArrow: {
    alignItems: "center",
    backgroundColor: "rgba(13,107,58,0.09)",
    borderRadius: 999,
    height: 26,
    justifyContent: "center",
    position: "absolute",
    right: 32,
    top: 31,
    width: 26,
  },
  sideSensorButton: {
    alignItems: "center",
    backgroundColor: colors.darkDeep,
    borderBottomLeftRadius: 18,
    borderColor: "rgba(78,201,138,0.52)",
    borderTopLeftRadius: 18,
    borderWidth: 1,
    height: 76,
    justifyContent: "center",
    position: "absolute",
    right: -4,
    shadowColor: colors.mint,
    shadowOffset: { height: 0, width: -8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    width: 32,
  },
  sideSensorHalo: {
    borderColor: "rgba(78,201,138,0.34)",
    borderRadius: 42,
    borderWidth: 1,
    height: 102,
    position: "absolute",
    right: -30,
    width: 84,
  },
  sideSensorHint: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  sideSensorHintText: {
    color: colors.primaryMid,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  sideSensorLabel: {
    color: colors.primaryMid,
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.9,
    position: "absolute",
    right: 31,
    textTransform: "uppercase",
    top: 62,
    width: 68,
  },
  sideSensorRail: {
    alignItems: "flex-end",
    height: 126,
    justifyContent: "center",
    opacity: 0.86,
    position: "absolute",
    right: 0,
    top: "32%",
    width: 106,
    zIndex: 2,
  },
  sideSensorRailActive: {
    opacity: 1,
  },
  signatureIntentBody: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 3,
  },
  signatureIntentCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    maxWidth: 350,
    padding: 12,
    width: "100%",
  },
  signatureIntentIcon: {
    alignItems: "center",
    backgroundColor: colors.primaryPale,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  signatureIntentTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  skipButton: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  skipText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "900",
  },
  smallButton: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  sparkle: {
    backgroundColor: colors.mint,
    borderRadius: 2,
    height: 4,
    position: "absolute",
    width: 4,
  },
  sparkleOne: {
    left: "22%",
    top: "18%",
  },
  sparkleThree: {
    right: "23%",
    top: "24%",
  },
  sparkleTwo: {
    bottom: "22%",
    left: "18%",
  },
  splitHero: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 22,
    marginHorizontal: 20,
    overflow: "hidden",
    padding: 20,
    position: "relative",
  },
  stack: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  statusApproved: {
    backgroundColor: colors.primaryPale,
    color: colors.primaryMid,
  },
  statusExecuted: {
    backgroundColor: colors.surfaceInset,
    color: colors.textSoft,
  },
  statusPending: {
    backgroundColor: colors.warningPale,
    color: colors.warning,
  },
  successBody: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  successCheck: {
    color: colors.white,
    fontSize: 54,
    fontWeight: "900",
  },
  successCopy: {
    color: colors.darkMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 310,
    textAlign: "center",
  },
  successDot: {
    backgroundColor: colors.mint,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  successMark: {
    alignItems: "center",
    backgroundColor: colors.primaryMid,
    borderRadius: 60,
    height: 120,
    justifyContent: "center",
    marginBottom: 24,
    width: 120,
  },
  successPill: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  successPillText: {
    color: colors.darkText,
    fontFamily: mono,
    fontSize: 11,
    fontWeight: "800",
  },
  successScreen: {
    backgroundColor: colors.darkDeep,
    flex: 1,
  },
  successTitle: {
    color: colors.darkText,
    fontFamily: serif,
    fontSize: 31,
    fontWeight: "700",
    textAlign: "center",
  },
  telegramHero: {
    alignItems: "center",
    backgroundColor: "#229ED9",
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    padding: 16,
  },
  telegramMark: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  telegramMarkText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
  telegramSub: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  telegramTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  terms: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  ticket: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    padding: 18,
    width: 250,
  },
  ticketAmount: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 32,
    fontWeight: "700",
  },
  ticketAvatars: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 18,
  },
  ticketLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  ticketLine: {
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  splitPulse: {
    backgroundColor: "rgba(45,184,112,0.28)",
    borderRadius: 999,
    height: 108,
    left: 72,
    position: "absolute",
    top: 42,
    width: 34,
  },
  ticketTag: {
    backgroundColor: colors.primaryPale,
    borderRadius: 7,
    color: colors.primaryMid,
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
    textTransform: "uppercase",
  },
  ticketTop: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ticketValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
  },
  tourCard: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  tourCopy: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  tourEmphasis: {
    color: colors.primaryMid,
    fontStyle: "italic",
  },
  tourTitle: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 34,
    marginTop: 20,
    textAlign: "center",
  },
  tourTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  userName: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 25,
    fontWeight: "700",
  },
  voteButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  walletDot: {
    backgroundColor: colors.primaryMid,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  walletStrip: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(13,31,20,0.04)",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  walletStripText: {
    color: colors.textSoft,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "800",
  },
  welcomeAvatars: {
    flexDirection: "row",
  },
  welcomeCopy: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 288,
    textAlign: "center",
  },
  welcomeHalo: {
    alignItems: "center",
    height: 178,
    justifyContent: "center",
    marginTop: 36,
    width: "100%",
  },
  welcomeTitle: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 42,
    marginTop: 24,
    textAlign: "center",
  },
  welcomeScreen: {
    backgroundColor: colors.cream,
  },
  wordmark: {
    fontFamily: serif,
    fontWeight: "700",
  },
  wordmarkAccent: {
    color: colors.mint,
  },
  wordmarkItalic: {
    fontStyle: "italic",
  },
});
