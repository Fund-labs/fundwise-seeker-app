import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { FUNDWISE_WEB_URL, SOLANA_CHAIN } from "../config";
import { shortAddress } from "../lib/short-address";
import { colors } from "../theme/colors";

type StepId = "boot" | "welcome" | "auth" | "success" | "tour" | "dashboard";
type HapticKind = "tap" | "selection" | "success" | "warning";
type HapticRipple = { id: string; kind: HapticKind };
type TourCard = {
  body: string;
  key: "split" | "pool" | "chain";
  title: string;
  titleEmphasis: string;
};

const STEPS: StepId[] = ["boot", "welcome", "auth", "success", "tour", "dashboard"];
const TOUR_CARDS: TourCard[] = [
  {
    body: "Snap a receipt, pick who paid, and FundWise calculates everyone's share in USDC.",
    key: "split",
    title: "Log it once,",
    titleEmphasis: "we split the math.",
  },
  {
    body: "Create a treasury for trips, gifts, or rent. Spending needs a multisig vote.",
    key: "pool",
    title: "Pool funds,",
    titleEmphasis: "vote to spend.",
  },
  {
    body: "One tap to settle. Sub-second confirmation, fractions of a cent in fees, no chargebacks.",
    key: "chain",
    title: "Settle in seconds,",
    titleEmphasis: "final on Solana.",
  },
];

function makeRippleId() {
  return Math.random().toString(36).slice(2, 10);
}

function runTapHaptic(kind: HapticKind = "tap") {
  if (kind === "success") {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return;
  }

  if (kind === "warning") {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return;
  }

  if (kind === "selection") {
    void Haptics.selectionAsync();
    return;
  }

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    if (error.message.includes("CancellationException") || error.message.toLowerCase().includes("cancel")) {
      return "Wallet request was cancelled. Try again and approve the connection in your wallet.";
    }

    return error.message;
  }

  return "Wallet connection did not complete.";
}

function StrataLogo({ size = 56 }: { size?: number }) {
  const scale = size / 96;

  return (
    <View style={{ height: size, width: size }}>
      <View
        style={[
          styles.logoSlab,
          styles.logoTop,
          {
            borderRadius: 7 * scale,
            height: 14 * scale,
            left: 14 * scale,
            top: 22 * scale,
            width: 68 * scale,
          },
        ]}
      />
      <View
        style={[
          styles.logoSlab,
          styles.logoMiddle,
          {
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
          styles.logoBottom,
          {
            borderRadius: 7 * scale,
            height: 14 * scale,
            left: 17 * scale,
            top: 60 * scale,
            width: 62 * scale,
          },
        ]}
      />
    </View>
  );
}

function AppStatus({ dark = false }: { dark?: boolean }) {
  return <View style={[styles.statusSpacer, dark ? styles.statusSpacerDark : null]} />;
}

function PrimaryButton({
  children,
  disabled,
  onPress,
  style,
  variant = "gradient",
}: {
  children: string;
  disabled?: boolean;
  onPress: () => void;
  style?: object;
  variant?: "gradient" | "dark" | "ghost";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "ghost" ? styles.buttonGhost : variant === "dark" ? styles.buttonDark : styles.buttonGradient,
        pressed && !disabled ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
        style,
      ]}
    >
      <Text style={[styles.buttonText, variant === "ghost" ? styles.buttonGhostText : null]}>{children}</Text>
    </Pressable>
  );
}

function ScreenShell({
  children,
  dark,
  footer,
  style,
}: {
  children: ReactNode;
  dark?: boolean;
  footer?: ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.screen, dark ? styles.screenDark : styles.screenLight, style]}>
      <AppStatus dark={dark} />
      <View style={styles.screenBody}>{children}</View>
      {footer ? <View style={styles.screenFooter}>{footer}</View> : null}
      <View style={[styles.gesturePill, dark ? styles.gesturePillDark : null]} />
    </View>
  );
}

function BootScreen({ onDone }: { onDone: () => void }) {
  const slabs = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const copy = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.stagger(
        230,
        slabs.map((value) =>
          Animated.timing(value, {
            duration: 700,
            easing: Easing.out(Easing.cubic),
            toValue: 1,
            useNativeDriver: true,
          }),
        ),
      ),
      Animated.timing(copy, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [copy, onDone, slabs]);

  return (
    <View style={[styles.screen, styles.bootScreen]}>
      <View style={styles.bootGlow} />
      <View style={styles.bootStack}>
        {slabs.map((value, index) => {
          const translateY = value.interpolate({ inputRange: [0, 1], outputRange: [-58, 0] });
          const scale = value.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.72, 1.03, 1] });
          const rotate = index === 0 ? "-2deg" : index === 2 ? "2deg" : "0deg";

          return (
            <Animated.View
              key={index}
              style={[
                styles.bootSlab,
                index === 0 ? styles.bootSlabTop : index === 1 ? styles.bootSlabMiddle : styles.bootSlabBottom,
                {
                  opacity: value,
                  transform: [{ translateY }, { scale }, { rotate }],
                },
              ]}
            />
          );
        })}
      </View>
      <Animated.View style={[styles.bootCopy, { opacity: copy, transform: [{ translateY: copy.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
        <Text style={styles.bootWord}>FundWise</Text>
        <Text style={styles.bootTag}>Stack · split · settle</Text>
      </Animated.View>
      <View style={[styles.gesturePill, styles.gesturePillDark]} />
    </View>
  );
}

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 1900,
          easing: Easing.inOut(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 1900,
          easing: Easing.inOut(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <ScreenShell
      footer={
        <>
          <PrimaryButton onPress={onNext}>Get started</PrimaryButton>
          <Text style={styles.terms}>No email · No password · Your wallet is your identity</Text>
        </>
      }
    >
      <View style={styles.welcomeHero}>
        <StrataLogo size={56} />
        <Text style={styles.welcomeTitle}>Welcome to{"\n"}FundWise</Text>
        <Text style={styles.welcomeCopy}>Split expenses with friends, pool funds with intention - all on-chain.</Text>
        <View style={styles.avatarHalo}>
          <Animated.View style={[styles.avatarBlur, { transform: [{ scale }] }]} />
          <View style={[styles.sparkle, styles.sparkleOne]} />
          <View style={[styles.sparkle, styles.sparkleTwo]} />
          <View style={[styles.sparkle, styles.sparkleThree]} />
          <View style={styles.avatarRow}>
            {["A", "K", "M", "D"].map((initial, index) => (
              <View
                key={initial}
                style={[
                  styles.avatarCircle,
                  index === 0 ? styles.avatarDeep : index === 1 ? styles.avatarForest : index === 2 ? styles.avatarEmerald : styles.avatarMint,
                  index > 0 ? styles.avatarOverlap : null,
                ]}
              >
                <Text style={[styles.avatarInitial, index === 3 ? styles.avatarInitialDark : null]}>{initial}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScreenShell>
  );
}

function AuthScreen({
  canRetry,
  error,
  onConnect,
  progress,
  scanning,
  walletAddress,
}: {
  canRetry: boolean;
  error: string | null;
  onConnect: () => void;
  progress: number;
  scanning: boolean;
  walletAddress: string | null;
}) {
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(ring, {
        duration: scanning ? 950 : 1700,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [ring, scanning]);

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.36] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.7, 0] });

  return (
    <ScreenShell
      footer={
        <>
          <View style={styles.walletStrip}>
            <View style={styles.walletStripDot} />
            <Text style={styles.walletStripText}>
              {walletAddress ? shortAddress(walletAddress, 6) : `${SOLANA_CHAIN.replace("solana:", "")} · Mobile Wallet Adapter`}
            </Text>
          </View>
          {canRetry ? <PrimaryButton onPress={onConnect}>Try again</PrimaryButton> : null}
        </>
      }
    >
      <View style={styles.authBody}>
        <Text style={styles.authEyebrow}>Seed Vault · Authorize</Text>
        <Text style={styles.authTitle}>{scanning ? "Approve in your wallet" : "Confirm with your wallet"}</Text>
        <Text style={styles.authCopy}>
          {scanning
            ? "Use your Seeker fingerprint in the wallet prompt. FundWise is waiting for approval to return."
            : canRetry
              ? "The wallet request did not finish. Retry to open the wallet prompt again."
              : "FundWise will open your Solana wallet automatically. Private keys stay out of FundWise."}
        </Text>
        <Pressable
          accessibilityRole={canRetry ? "button" : undefined}
          disabled={!canRetry || scanning}
          onPress={onConnect}
          style={styles.fingerprintWrap}
        >
          <Animated.View style={[styles.fingerprintRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
          <View style={styles.fingerprintIcon}>
            <View style={styles.fingerprintLineTall} />
            <View style={styles.fingerprintLine} />
            <View style={styles.fingerprintLineShort} />
            {scanning ? <View style={styles.scanLine} /> : null}
          </View>
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.authCta}>
          <View style={styles.pulseDot} />
          <Text style={styles.authCtaText}>
            {scanning ? "Fingerprint approval" : canRetry ? "Retry wallet request" : "Opening wallet automatically"}
          </Text>
        </View>
        {error ? <Text style={styles.authError}>{error}</Text> : null}
      </View>
    </ScreenShell>
  );
}

function SuccessScreen({ onDone, walletAddress }: { onDone: () => void; walletAddress: string | null }) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      damping: 10,
      mass: 0.8,
      stiffness: 150,
      toValue: 1,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(onDone, 2100);
    return () => clearTimeout(timer);
  }, [onDone, pop]);

  return (
    <ScreenShell dark style={styles.successScreen}>
      <View style={styles.successBody}>
        <Animated.View style={[styles.successMark, { opacity: pop, transform: [{ scale: pop }] }]}>
          <Text style={styles.successCheck}>✓</Text>
        </Animated.View>
        <Text style={styles.successTitle}>Wallet connected</Text>
        <Text style={styles.successCopy}>Signature verified by the wallet. You are ready to fund and split.</Text>
        <View style={styles.pubkeyPill}>
          <View style={styles.pubkeyDot} />
          <Text style={styles.pubkeyText}>{walletAddress ? shortAddress(walletAddress, 10) : "Wallet authorized"}</Text>
        </View>
      </View>
    </ScreenShell>
  );
}

function SplitIllustration() {
  return (
    <View style={styles.splitIllus}>
      <View style={styles.ticket}>
        <View style={styles.ticketTop}>
          <Text style={styles.ticketAmount}>$184.20</Text>
          <Text style={styles.ticketTag}>Split</Text>
        </View>
        <TicketLine label="Wine dinner" value="4 people" />
        <TicketLine label="Each pays" value="$46.05" />
        <TicketLine label="Paid by" value="You" />
      </View>
      <View style={styles.ticketPulse} />
      <View style={styles.peopleRow}>
        {["K", "A", "M", "D"].map((name, index) => (
          <View
            key={name}
            style={[
              styles.smallAvatar,
              index === 0 ? styles.avatarDeep : index === 1 ? styles.avatarForest : index === 2 ? styles.avatarEmerald : styles.avatarMint,
              index > 0 ? styles.smallAvatarOverlap : null,
            ]}
          >
            <Text style={[styles.smallAvatarText, index === 3 ? styles.avatarInitialDark : null]}>{name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TicketLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.ticketLine}>
      <Text style={styles.ticketLineLabel}>{label}</Text>
      <Text style={styles.ticketLineValue}>{value}</Text>
    </View>
  );
}

function PoolIllustration() {
  return (
    <View style={styles.poolIllus}>
      <Coin style={styles.coinOne} />
      <Coin style={styles.coinTwo} />
      <Coin style={styles.coinThree} />
      <View style={styles.jar}>
        <View style={styles.jarFill} />
        <Text style={styles.jarLabel}>$600</Text>
        <Text style={styles.jarSub}>80% of goal</Text>
      </View>
    </View>
  );
}

function Coin({ style }: { style: object }) {
  return (
    <View style={[styles.coin, style]}>
      <Text style={styles.coinText}>$</Text>
    </View>
  );
}

function ChainIllustration() {
  return (
    <View style={styles.chainIllus}>
      <Block label="Block" style={styles.blockOne} value="$30" />
      <Block dark label="Confirmed" style={styles.blockTwo} value="$120" />
      <Block label="Block" style={styles.blockThree} value="$84" />
      <View style={[styles.chainLine, styles.chainLineOne]} />
      <View style={[styles.chainLine, styles.chainLineTwo]} />
      <View style={styles.txPing} />
      <View style={styles.feePill}>
        <Text style={styles.feeText}>~$0.00025 fee · &lt;1s</Text>
      </View>
    </View>
  );
}

function Block({ dark, label, style, value }: { dark?: boolean; label: string; style: object; value: string }) {
  return (
    <View style={[styles.chainBlock, dark ? styles.chainBlockDark : null, style]}>
      <Text style={[styles.blockLabel, dark ? styles.blockTextDark : null]}>{label}</Text>
      <Text style={[styles.blockValue, dark ? styles.blockTextDark : null]}>{value}</Text>
    </View>
  );
}

function TourIllustration({ kind }: { kind: TourCard["key"] }) {
  if (kind === "pool") {
    return <PoolIllustration />;
  }

  if (kind === "chain") {
    return <ChainIllustration />;
  }

  return <SplitIllustration />;
}

function TourScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const card = TOUR_CARDS[index];
  const isLast = index === TOUR_CARDS.length - 1;

  function next() {
    runTapHaptic("tap");
    if (isLast) {
      onDone();
      return;
    }

    setIndex((current) => current + 1);
  }

  function back() {
    runTapHaptic("tap");
    setIndex((current) => Math.max(0, current - 1));
  }

  return (
    <ScreenShell
      footer={
        <View style={styles.tourFooter}>
          {index > 0 ? (
            <PrimaryButton onPress={back} style={styles.footerBack} variant="ghost">
              Back
            </PrimaryButton>
          ) : (
            <View style={styles.footerBack} />
          )}
          <PrimaryButton onPress={next} style={styles.footerNext}>
            {isLast ? "Enter FundWise" : "Next"}
          </PrimaryButton>
        </View>
      }
    >
      <View style={styles.tourTop}>
        <View style={styles.stepDots}>
          {TOUR_CARDS.map((tourCard, dotIndex) => (
            <View key={tourCard.key} style={[styles.stepDot, dotIndex === index ? styles.stepDotActive : null]} />
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={onDone} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
      <View style={styles.tourCard}>
        <View style={styles.tourIllustration}>
          <TourIllustration kind={card.key} />
        </View>
        <Text style={styles.tourTitle}>
          {card.title}
          {"\n"}
          <Text style={styles.tourEmphasis}>{card.titleEmphasis}</Text>
        </Text>
        <Text style={styles.tourBody}>{card.body}</Text>
      </View>
    </ScreenShell>
  );
}

function DashboardScreen({ walletAddress }: { walletAddress: string | null }) {
  const hapticTap = useCallback(() => {
    runTapHaptic("tap");
  }, []);

  return (
    <View style={[styles.screen, styles.dashboardScreen]}>
      <AppStatus />
      <ScrollView contentContainerStyle={styles.dashboardScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.dashboardTop}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.name}>Sarthi</Text>
          </View>
          <View style={styles.dashboardTopRight}>
            <Pressable accessibilityRole="button" onPress={hapticTap} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>!</Text>
              <View style={styles.badgeDot} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={hapticTap} style={styles.avatarButton}>
              <Text style={styles.avatarButtonText}>S</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Net balance · all groups</Text>
          <Text style={styles.balanceAmount}>+$39.50</Text>
          <Text style={styles.balanceSub}>USDC owed to you across 2 groups</Text>
          <View style={styles.balanceStats}>
            <BalanceStat label="You're owed" value="$114.50" />
            <BalanceStat label="You owe" value="$75.00" />
            <BalanceStat label="In vaults" value="$250" />
          </View>
        </View>

        <View style={styles.quickActions}>
          <QuickAction label="Receive" mark="↓" onPress={hapticTap} />
          <QuickAction label="Pay" mark="↑" onPress={hapticTap} />
          <QuickAction label="Split" mark="≡" onPress={hapticTap} />
          <QuickAction label="Settle" mark="✓" onPress={hapticTap} />
        </View>

        <View style={styles.alertStack}>
          <AlertCard detail="Amazon gift card $450 · 3 of 4 yes" mark="✓" onPress={hapticTap} title="Vote needed · Priya's Gift" tone="vote" />
          <AlertCard detail="Flatmates · settle in one tap" mark="→" onPress={hapticTap} title="You owe Kiran $30" tone="settle" />
        </View>

        <SectionTitle action="See all" title="Your groups" />
        <View style={styles.groupStack}>
          <GroupCard amount="+$84.50" emoji="Trip" label="You're owed" mode="Split" name="Lisbon Trip" onPress={hapticTap} tone="pos" />
          <GroupCard amount="$100" emoji="Gift" label="Contributed" mode="Fund" name="Priya's Gift" onPress={hapticTap} />
          <GroupCard amount="-$45.00" emoji="Home" label="You owe" mode="Split" name="Flatmates" onPress={hapticTap} tone="neg" />
        </View>

        <SectionTitle action="View all" title="Recent activity" />
        <View style={styles.activityStack}>
          <ActivityRow amount="+$138" mark="Wine" meta="You paid · 4 ways · Today" title="Wine dinner · Lisbon" tone="pos" />
          <ActivityRow amount="-$16" mark="Taxi" meta="Asha paid · 3 ways · Today" title="Airport taxi" />
          <ActivityRow amount="+$30" mark="Done" meta="USDC · 0.4s · 2 hrs ago" title="Kiran settled $30" tone="pos" />
          <ActivityRow amount="-$100" mark="Bank" meta="USDC · yesterday" title="Deposited to Priya's Gift" />
        </View>

        <View style={styles.walletFootnote}>
          <Text style={styles.walletFootnoteText}>
            Wallet: {walletAddress ? shortAddress(walletAddress, 8) : "not connected"} · {FUNDWISE_WEB_URL.replace("https://", "")}
          </Text>
        </View>
      </ScrollView>
      <BottomNav onPress={hapticTap} />
      <View style={styles.gesturePill} />
    </View>
  );
}

function BalanceStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.balanceStat}>
      <Text style={styles.balanceStatLabel}>{label}</Text>
      <Text style={styles.balanceStatValue}>{value}</Text>
    </View>
  );
}

function QuickAction({ label, mark, onPress }: { label: string; mark: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed ? styles.pressedScale : null]}>
      <View style={styles.quickActionIcon}>
        <Text style={styles.quickActionMark}>{mark}</Text>
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function AlertCard({
  detail,
  mark,
  onPress,
  title,
  tone,
}: {
  detail: string;
  mark: string;
  onPress: () => void;
  title: string;
  tone: "vote" | "settle";
}) {
  const isVote = tone === "vote";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.alertCard, isVote ? styles.alertVote : styles.alertSettle, pressed ? styles.pressedScale : null]}
    >
      <View style={[styles.alertIcon, isVote ? styles.alertVoteIcon : styles.alertSettleIcon]}>
        <Text style={[styles.alertIconText, isVote ? styles.alertVoteText : styles.alertSettleText]}>{mark}</Text>
      </View>
      <View style={styles.alertTextWrap}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertDetail}>{detail}</Text>
      </View>
      <Text style={styles.alertChevron}>›</Text>
    </Pressable>
  );
}

function SectionTitle({ action, title }: { action: string; title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      <Text style={styles.sectionAction}>{action}</Text>
    </View>
  );
}

function GroupCard({
  amount,
  emoji,
  label,
  mode,
  name,
  onPress,
  tone,
}: {
  amount: string;
  emoji: string;
  label: string;
  mode: "Split" | "Fund";
  name: string;
  onPress: () => void;
  tone?: "pos" | "neg";
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.groupCard, pressed ? styles.pressedScale : null]}>
      <View style={styles.groupEmoji}>
        <Text style={styles.groupEmojiText}>{emoji}</Text>
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{name}</Text>
        <View style={styles.groupMetaRow}>
          <Text style={[styles.modeTag, mode === "Fund" ? styles.modeTagFund : null]}>{mode}</Text>
          <Text style={styles.groupMeta}>4 people · 5 expenses</Text>
        </View>
      </View>
      <View style={styles.groupAmountWrap}>
        <Text style={[styles.groupAmount, tone === "pos" ? styles.amountPositive : tone === "neg" ? styles.amountNegative : null]}>{amount}</Text>
        <Text style={styles.groupAmountLabel}>{label}</Text>
      </View>
    </Pressable>
  );
}

function ActivityRow({ amount, mark, meta, title, tone }: { amount: string; mark: string; meta: string; title: string; tone?: "pos" }) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityMark}>
        <Text style={styles.activityMarkText}>{mark}</Text>
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityMeta}>{meta}</Text>
      </View>
      <Text style={[styles.activityAmount, tone === "pos" ? styles.amountPositive : null]}>{amount}</Text>
    </View>
  );
}

function BottomNav({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.bottomNav}>
      <NavItem active label="Home" mark="⌂" onPress={onPress} />
      <NavItem label="Groups" mark="••" onPress={onPress} />
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      <NavItem label="Activity" mark="✓" onPress={onPress} />
      <NavItem label="Wallet" mark="$" onPress={onPress} />
    </View>
  );
}

function NavItem({ active, label, mark, onPress }: { active?: boolean; label: string; mark: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.navItem}>
      <Text style={[styles.navMark, active ? styles.navActive : null]}>{mark}</Text>
      <Text style={[styles.navLabel, active ? styles.navActive : null]}>{label}</Text>
    </Pressable>
  );
}

function HapticLayer({ ripples }: { ripples: HapticRipple[] }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {ripples.map((ripple) => (
        <View
          key={ripple.id}
          style={[
            styles.hapticRipple,
            ripple.kind === "success" ? styles.hapticRippleSuccess : null,
            ripple.kind === "warning" ? styles.hapticRippleWarning : null,
          ]}
        />
      ))}
    </View>
  );
}

export function SeekerOnboardingV2Screen() {
  const { account, connect } = useMobileWallet();
  const [step, setStep] = useState<StepId>("boot");
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [ripples, setRipples] = useState<HapticRipple[]>([]);
  const authAutoStartedRef = useRef(false);
  const { height } = useWindowDimensions();
  const walletAddress = account?.address.toBase58() ?? null;
  const compact = height < 740;

  const emitHaptic = useCallback((kind: HapticKind = "tap") => {
    runTapHaptic(kind);
    const ripple = { id: makeRippleId(), kind };
    setRipples((current) => [...current, ripple]);
    setTimeout(() => {
      setRipples((current) => current.filter((item) => item.id !== ripple.id));
    }, 520);
  }, []);

  const goTo = useCallback(
    (next: StepId, kind: HapticKind = "tap") => {
      emitHaptic(kind);
      setStep(next);
    },
    [emitHaptic],
  );

  const runWalletConnect = useCallback(async () => {
    if (scanning) {
      return;
    }

    setWalletError(null);
    setScanning(true);
    setScanProgress(18);
    emitHaptic("selection");
    let progressTimer: ReturnType<typeof setInterval> | undefined;

    try {
      progressTimer = setInterval(() => {
        setScanProgress((current) => Math.min(current + 18, 86));
      }, 260);

      await connect();
      clearInterval(progressTimer);
      setScanProgress(100);
      emitHaptic("success");
      setTimeout(() => {
        setScanning(false);
        setScanProgress(0);
        setStep("success");
      }, 260);
    } catch (error) {
      setScanning(false);
      setScanProgress(0);
      setWalletError(getErrorMessage(error));
      emitHaptic("warning");
    } finally {
      if (progressTimer) {
        clearInterval(progressTimer);
      }
    }
  }, [connect, emitHaptic, scanning]);

  useEffect(() => {
    if (step !== "auth") {
      authAutoStartedRef.current = false;
      return;
    }

    if (walletAddress) {
      setStep("success");
      return;
    }

    if (authAutoStartedRef.current) {
      return;
    }

    authAutoStartedRef.current = true;
    const timer = setTimeout(() => {
      void runWalletConnect();
    }, 450);

    return () => clearTimeout(timer);
  }, [runWalletConnect, step, walletAddress]);

  const content = useMemo(() => {
    switch (step) {
      case "boot":
        return <BootScreen onDone={() => setStep("welcome")} />;
      case "welcome":
        return <WelcomeScreen onNext={() => goTo("auth")} />;
      case "auth":
        return (
          <AuthScreen
            canRetry={Boolean(walletError) && !scanning}
            error={walletError}
            onConnect={() => void runWalletConnect()}
            progress={scanProgress}
            scanning={scanning}
            walletAddress={walletAddress}
          />
        );
      case "success":
        return <SuccessScreen onDone={() => setStep("tour")} walletAddress={walletAddress} />;
      case "tour":
        return <TourScreen onDone={() => goTo("dashboard")} />;
      case "dashboard":
        return <DashboardScreen walletAddress={walletAddress} />;
    }
  }, [goTo, runWalletConnect, scanProgress, scanning, step, walletAddress, walletError]);

  return (
    <View style={[styles.root, compact ? styles.rootCompact : null]}>
      {content}
      <HapticLayer ripples={ripples} />
    </View>
  );
}

const serif = "serif";
const mono = "monospace";

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  rootCompact: {
    minHeight: 0,
  },
  screen: {
    flex: 1,
    overflow: "hidden",
  },
  screenLight: {
    backgroundColor: colors.bg,
  },
  screenDark: {
    backgroundColor: colors.darkDeep,
  },
  screenBody: {
    flex: 1,
    paddingHorizontal: 24,
  },
  screenFooter: {
    gap: 10,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  statusSpacer: {
    height: StatusBar.currentHeight ?? 0,
  },
  statusSpacerDark: {
    backgroundColor: "transparent",
  },
  statusBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 6,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  statusTime: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  statusDark: {
    color: "#F0EFE6",
  },
  statusRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  signalBars: {
    backgroundColor: colors.text,
    borderRadius: 2,
    height: 11,
    width: 15,
  },
  wifiMark: {
    backgroundColor: colors.text,
    borderRadius: 7,
    height: 11,
    width: 14,
  },
  statusBarsDark: {
    backgroundColor: "#F0EFE6",
  },
  battery: {
    borderColor: colors.text,
    borderRadius: 3,
    borderWidth: 1,
    height: 11,
    padding: 1,
    width: 22,
  },
  batteryDark: {
    borderColor: "rgba(240,239,230,0.5)",
  },
  batteryFill: {
    backgroundColor: colors.text,
    borderRadius: 2,
    flex: 1,
    width: 15,
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
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  logoSlab: {
    position: "absolute",
  },
  logoTop: {
    backgroundColor: colors.primaryDeep,
    transform: [{ rotate: "-2deg" }],
  },
  logoMiddle: {
    backgroundColor: colors.primaryMid,
  },
  logoBottom: {
    backgroundColor: colors.mint,
    transform: [{ rotate: "2deg" }],
  },
  button: {
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 18,
  },
  buttonGradient: {
    backgroundColor: colors.primaryMid,
  },
  buttonDark: {
    backgroundColor: colors.text,
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.52,
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  buttonGhostText: {
    color: colors.textSoft,
  },
  bootScreen: {
    alignItems: "center",
    backgroundColor: colors.darkDeep,
    justifyContent: "center",
  },
  bootGlow: {
    backgroundColor: "rgba(78,201,138,0.18)",
    borderRadius: 160,
    height: 270,
    position: "absolute",
    top: "24%",
    width: 270,
  },
  bootStack: {
    height: 200,
    marginBottom: 30,
    width: 240,
  },
  bootSlab: {
    borderRadius: 14,
    height: 36,
    position: "absolute",
  },
  bootSlabTop: {
    backgroundColor: colors.primaryDeep,
    left: 35,
    top: 30,
    width: 170,
  },
  bootSlabMiddle: {
    backgroundColor: colors.primaryMid,
    left: 28,
    top: 78,
    width: 184,
  },
  bootSlabBottom: {
    backgroundColor: colors.mint,
    left: 41,
    top: 126,
    width: 158,
  },
  bootCopy: {
    alignItems: "center",
  },
  bootWord: {
    color: colors.white,
    fontFamily: serif,
    fontSize: 46,
    fontWeight: "700",
    letterSpacing: -1,
  },
  bootTag: {
    color: "#7A8C80",
    fontFamily: mono,
    fontSize: 10,
    letterSpacing: 2.2,
    marginTop: 10,
    textTransform: "uppercase",
  },
  welcomeHero: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  welcomeTitle: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: -1,
    lineHeight: 42,
    marginTop: 26,
    textAlign: "center",
  },
  welcomeCopy: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 280,
    textAlign: "center",
  },
  avatarHalo: {
    alignItems: "center",
    height: 170,
    justifyContent: "center",
    marginBottom: 6,
    marginTop: 36,
    width: "100%",
  },
  avatarBlur: {
    backgroundColor: colors.mint,
    borderRadius: 85,
    height: 170,
    opacity: 0.22,
    position: "absolute",
    width: 170,
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
  sparkleTwo: {
    bottom: "22%",
    left: "18%",
  },
  sparkleThree: {
    right: "22%",
    top: "24%",
  },
  avatarRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  avatarCircle: {
    alignItems: "center",
    borderColor: colors.bg,
    borderRadius: 30,
    borderWidth: 3,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  avatarOverlap: {
    marginLeft: -18,
  },
  avatarDeep: {
    backgroundColor: colors.primaryDeep,
  },
  avatarForest: {
    backgroundColor: colors.primary,
  },
  avatarEmerald: {
    backgroundColor: colors.primaryMid,
  },
  avatarMint: {
    backgroundColor: colors.mint,
  },
  avatarInitial: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },
  avatarInitialDark: {
    color: colors.text,
  },
  terms: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
  authBody: {
    alignItems: "center",
    flex: 1,
    paddingTop: 18,
  },
  authEyebrow: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 10,
    letterSpacing: 2.2,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  authTitle: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.7,
    lineHeight: 36,
    textAlign: "center",
  },
  authCopy: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 16,
    marginTop: 10,
    maxWidth: 285,
    textAlign: "center",
  },
  fingerprintWrap: {
    alignItems: "center",
    height: 170,
    justifyContent: "center",
    marginVertical: 8,
    width: 170,
  },
  fingerprintRing: {
    borderColor: "rgba(78,201,138,0.45)",
    borderRadius: 85,
    borderWidth: 2,
    height: 170,
    position: "absolute",
    width: 170,
  },
  fingerprintIcon: {
    alignItems: "center",
    backgroundColor: colors.primaryMid,
    borderRadius: 46,
    height: 92,
    justifyContent: "center",
    width: 92,
  },
  fingerprintLineTall: {
    borderColor: colors.white,
    borderRadius: 18,
    borderWidth: 2,
    height: 48,
    position: "absolute",
    width: 34,
  },
  fingerprintLine: {
    borderColor: colors.white,
    borderRadius: 13,
    borderWidth: 2,
    height: 34,
    position: "absolute",
    width: 24,
  },
  fingerprintLineShort: {
    backgroundColor: colors.white,
    borderRadius: 2,
    height: 28,
    position: "absolute",
    top: 34,
    width: 3,
  },
  scanLine: {
    backgroundColor: colors.mint,
    borderRadius: 2,
    height: 3,
    left: 12,
    position: "absolute",
    right: 12,
    top: 45,
  },
  progressTrack: {
    backgroundColor: "rgba(13,31,20,0.08)",
    borderRadius: 2,
    height: 4,
    marginBottom: 18,
    overflow: "hidden",
    width: 220,
  },
  progressFill: {
    backgroundColor: colors.mint,
    height: 4,
  },
  authCta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  pulseDot: {
    backgroundColor: colors.mint,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  authCtaText: {
    color: colors.primaryMid,
    fontFamily: mono,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  authError: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 12,
    maxWidth: 280,
    textAlign: "center",
  },
  walletStrip: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(13,31,20,0.04)",
    borderColor: colors.border,
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  walletStripDot: {
    backgroundColor: colors.primaryMid,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  walletStripText: {
    color: colors.textSoft,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "600",
  },
  successScreen: {
    backgroundColor: "#0C1612",
  },
  successBody: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
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
  successCheck: {
    color: colors.white,
    fontSize: 54,
    fontWeight: "900",
  },
  successTitle: {
    color: "#F0EFE6",
    fontFamily: serif,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  successCopy: {
    color: "#9BA8A0",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 20,
    marginTop: 8,
    textAlign: "center",
  },
  pubkeyPill: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pubkeyDot: {
    backgroundColor: colors.mint,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  pubkeyText: {
    color: "#C9D3CC",
    fontFamily: mono,
    fontSize: 11,
    fontWeight: "600",
  },
  tourTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 16,
    paddingTop: 6,
  },
  stepDots: {
    flexDirection: "row",
    gap: 5,
  },
  stepDot: {
    backgroundColor: "rgba(13,31,20,0.12)",
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  stepDotActive: {
    backgroundColor: colors.primaryMid,
    width: 20,
  },
  skipButton: {
    borderRadius: 10,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  skipText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  tourCard: {
    flex: 1,
    justifyContent: "center",
  },
  tourIllustration: {
    alignItems: "center",
    height: 240,
    justifyContent: "center",
    marginBottom: 20,
  },
  tourTitle: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  tourEmphasis: {
    color: colors.primaryMid,
    fontStyle: "italic",
  },
  tourBody: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 10,
  },
  tourFooter: {
    flexDirection: "row",
    gap: 10,
  },
  footerBack: {
    flex: 1,
  },
  footerNext: {
    flex: 2,
  },
  splitIllus: {
    height: 220,
    position: "relative",
    width: 260,
  },
  ticket: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    left: 30,
    padding: 16,
    position: "absolute",
    top: 8,
    width: 200,
  },
  ticketTop: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ticketAmount: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 28,
    fontWeight: "700",
  },
  ticketTag: {
    backgroundColor: "rgba(78,201,138,0.12)",
    borderRadius: 5,
    color: colors.primaryMid,
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "800",
    paddingHorizontal: 7,
    paddingVertical: 3,
    textTransform: "uppercase",
  },
  ticketLine: {
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  ticketLineLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "600",
  },
  ticketLineValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  ticketPulse: {
    backgroundColor: colors.mint,
    borderRadius: 4,
    height: 8,
    left: 130,
    position: "absolute",
    top: 120,
    width: 8,
  },
  peopleRow: {
    bottom: 0,
    flexDirection: "row",
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
  },
  smallAvatar: {
    alignItems: "center",
    borderColor: colors.bg,
    borderRadius: 21,
    borderWidth: 3,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  smallAvatarOverlap: {
    marginLeft: -12,
  },
  smallAvatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  poolIllus: {
    alignItems: "flex-end",
    height: 220,
    justifyContent: "center",
    position: "relative",
    width: 260,
  },
  jar: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderColor: colors.text,
    borderTopWidth: 0,
    borderWidth: 2,
    height: 180,
    justifyContent: "center",
    overflow: "hidden",
    width: 150,
  },
  jarFill: {
    backgroundColor: colors.primaryMid,
    bottom: 0,
    height: "72%",
    left: 0,
    position: "absolute",
    right: 0,
  },
  jarLabel: {
    color: colors.white,
    fontFamily: serif,
    fontSize: 24,
    fontWeight: "700",
  },
  jarSub: {
    color: "rgba(255,255,255,0.86)",
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
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
  },
  coinOne: {
    left: 48,
    top: 0,
  },
  coinTwo: {
    right: 36,
    top: -6,
  },
  coinThree: {
    left: 108,
    top: -14,
  },
  coinText: {
    color: colors.white,
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "900",
  },
  chainIllus: {
    height: 220,
    position: "relative",
    width: 260,
  },
  chainBlock: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 72,
    justifyContent: "center",
    position: "absolute",
    width: 72,
  },
  chainBlockDark: {
    backgroundColor: colors.primaryMid,
    borderColor: colors.primaryMid,
  },
  blockOne: {
    left: 8,
    top: 18,
  },
  blockTwo: {
    left: 94,
    top: 74,
  },
  blockThree: {
    left: 180,
    top: 130,
  },
  blockLabel: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  blockValue: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 16,
    fontWeight: "700",
  },
  blockTextDark: {
    color: colors.white,
  },
  chainLine: {
    backgroundColor: colors.textSubtle,
    height: 2,
    position: "absolute",
    width: 90,
  },
  chainLineOne: {
    left: 60,
    top: 62,
    transform: [{ rotate: "35deg" }],
  },
  chainLineTwo: {
    left: 146,
    top: 118,
    transform: [{ rotate: "35deg" }],
  },
  txPing: {
    backgroundColor: colors.mint,
    borderRadius: 5,
    height: 10,
    left: 166,
    position: "absolute",
    top: 108,
    width: 10,
  },
  feePill: {
    backgroundColor: "rgba(78,201,138,0.1)",
    borderColor: "rgba(78,201,138,0.2)",
    borderRadius: 8,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
  },
  feeText: {
    color: colors.primaryMid,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "700",
  },
  dashboardScreen: {
    backgroundColor: colors.bg,
  },
  dashboardScroll: {
    paddingBottom: 104,
  },
  dashboardTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 6,
  },
  greeting: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
  },
  name: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 24,
    fontWeight: "700",
  },
  dashboardTopRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.white,
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
  badgeDot: {
    backgroundColor: colors.danger,
    borderColor: colors.white,
    borderRadius: 4,
    borderWidth: 2,
    height: 9,
    position: "absolute",
    right: 8,
    top: 8,
    width: 9,
  },
  avatarButton: {
    alignItems: "center",
    backgroundColor: colors.primaryMid,
    borderRadius: 19,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  avatarButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    marginHorizontal: 22,
    marginTop: 8,
    overflow: "hidden",
    padding: 22,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  balanceAmount: {
    color: colors.white,
    fontFamily: serif,
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: -1,
    marginTop: 6,
  },
  balanceSub: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
  },
  balanceStats: {
    borderColor: "rgba(255,255,255,0.16)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
  },
  balanceStat: {
    flex: 1,
  },
  balanceStatLabel: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  balanceStatValue: {
    color: colors.white,
    fontFamily: serif,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  quickAction: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  quickActionIcon: {
    alignItems: "center",
    backgroundColor: "rgba(13,107,58,0.08)",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  quickActionMark: {
    color: colors.primaryMid,
    fontSize: 20,
    fontWeight: "900",
  },
  quickActionLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
  },
  alertStack: {
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  alertCard: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  alertVote: {
    backgroundColor: "rgba(78,201,138,0.05)",
    borderColor: "rgba(78,201,138,0.3)",
  },
  alertSettle: {
    backgroundColor: "rgba(199,165,59,0.08)",
    borderColor: "rgba(199,165,59,0.3)",
  },
  alertIcon: {
    alignItems: "center",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  alertVoteIcon: {
    backgroundColor: "rgba(78,201,138,0.15)",
  },
  alertSettleIcon: {
    backgroundColor: "rgba(199,165,59,0.18)",
  },
  alertIconText: {
    fontSize: 16,
    fontWeight: "900",
  },
  alertVoteText: {
    color: colors.primaryMid,
  },
  alertSettleText: {
    color: colors.gold,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  alertDetail: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  alertChevron: {
    color: colors.textSubtle,
    fontSize: 24,
  },
  sectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  sectionTitleText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  sectionAction: {
    color: colors.primaryMid,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  groupStack: {
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  groupCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  groupEmoji: {
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  groupEmojiText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "900",
  },
  groupInfo: {
    flex: 1,
    minWidth: 0,
  },
  groupName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  groupMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 3,
  },
  modeTag: {
    backgroundColor: "rgba(78,201,138,0.12)",
    borderRadius: 4,
    color: colors.primaryMid,
    fontFamily: mono,
    fontSize: 8,
    fontWeight: "800",
    paddingHorizontal: 5,
    paddingVertical: 1,
    textTransform: "uppercase",
  },
  modeTagFund: {
    backgroundColor: "rgba(42,79,168,0.12)",
    color: colors.fundBlue,
  },
  groupMeta: {
    color: colors.textSoft,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "600",
  },
  groupAmountWrap: {
    alignItems: "flex-end",
  },
  groupAmount: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 16,
    fontWeight: "700",
  },
  amountPositive: {
    color: colors.primaryMid,
  },
  amountNegative: {
    color: colors.danger,
  },
  groupAmountLabel: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 9,
    fontWeight: "800",
    marginTop: 1,
    textTransform: "uppercase",
  },
  activityStack: {
    paddingHorizontal: 22,
  },
  activityRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
  },
  activityMark: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  activityMarkText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: "900",
  },
  activityCopy: {
    flex: 1,
  },
  activityTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  activityMeta: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  activityAmount: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 14,
    fontWeight: "700",
  },
  walletFootnote: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  walletFootnoteText: {
    color: colors.textSubtle,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: "700",
  },
  bottomNav: {
    alignItems: "center",
    backgroundColor: "rgba(244,241,234,0.95)",
    borderColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    paddingBottom: 22,
    paddingHorizontal: 14,
    paddingTop: 10,
    position: "absolute",
    right: 0,
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    gap: 2,
    minHeight: 44,
    justifyContent: "center",
  },
  navMark: {
    color: colors.textSubtle,
    fontSize: 18,
    fontWeight: "900",
  },
  navLabel: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: "800",
  },
  navActive: {
    color: colors.primaryMid,
  },
  fab: {
    alignItems: "center",
    backgroundColor: colors.primaryMid,
    borderRadius: 18,
    height: 54,
    justifyContent: "center",
    marginTop: -22,
    width: 54,
  },
  fabText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 30,
  },
  hapticRipple: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13,31,20,0.12)",
  },
  hapticRippleSuccess: {
    backgroundColor: "rgba(78,201,138,0.24)",
  },
  hapticRippleWarning: {
    backgroundColor: "rgba(199,59,59,0.18)",
  },
});
