import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { ActionButton } from "../components/ActionButton";
import { colors } from "../theme/colors";

type OnboardingKind = "link" | "wallet" | "continue";

type OnboardingSlide = {
  body: string;
  eyebrow: string;
  primary: string;
  secondary: string;
  title: string;
  kind: OnboardingKind;
};

const slides: OnboardingSlide[] = [
  {
    body: "Seeker should feel like an inbox for the Group state you just opened, not an empty crypto app.",
    eyebrow: "Link recovery",
    kind: "link",
    primary: "Open saved link",
    secondary: "Paste invite code",
    title: "Start from a real FundWise link.",
  },
  {
    body: "The wallet step explains trust. Seeker asks for MWA, the wallet owns approval, and no private keys touch the app.",
    eyebrow: "Wallet handoff",
    kind: "wallet",
    primary: "Connect MWA wallet",
    secondary: "Continue without wallet",
    title: "Connect when identity matters.",
  },
  {
    body: "The phone is the start point. Review, settlement, and receipt confirmation can move to a larger FundWise screen.",
    eyebrow: "Continuation",
    kind: "continue",
    primary: "Start Seeker",
    secondary: "Share to PC",
    title: "Move to PC without losing context.",
  },
];

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
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

function SeekerHeader({ onSkip, step }: { onSkip: () => void; step: number }) {
  return (
    <View style={styles.header}>
      <View style={styles.lockup}>
        <StrataMark />
        <View>
          <Text style={styles.wordmark}>FundWise</Text>
          <Text style={styles.headerMeta}>Android Seeker</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <Text style={styles.stepBadge}>{step}/3</Text>
        <Pressable
          accessibilityHint="Skips onboarding and opens Seeker."
          accessibilityLabel="Skip onboarding"
          accessibilityRole="button"
          onPress={onSkip}
          style={({ pressed }) => [styles.skipButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProgressDots({ activeIndex }: { activeIndex: number }) {
  return (
    <View style={styles.progressRow}>
      {slides.map((slide, index) => (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          key={slide.kind}
          style={[styles.progressDot, index === activeIndex ? styles.progressDotActive : null]}
        />
      ))}
    </View>
  );
}

function ModeChip({ label = "Seeker", tone = "green" }: { label?: string; tone?: "green" | "blue" }) {
  const isBlue = tone === "blue";

  return (
    <View style={[styles.modeChip, isBlue ? styles.modeChipBlue : styles.modeChipGreen]}>
      <View style={[styles.modeDot, isBlue ? styles.modeDotBlue : styles.modeDotGreen]} />
      <Text style={[styles.modeText, isBlue ? styles.modeTextBlue : styles.modeTextGreen]}>{label}</Text>
    </View>
  );
}

function MiniCard({
  detail,
  label,
  mark,
  tone = "green",
}: {
  detail: string;
  label: string;
  mark: string;
  tone?: "green" | "blue";
}) {
  const isBlue = tone === "blue";

  return (
    <View style={[styles.miniCard, isBlue ? styles.miniCardBlue : null]}>
      <View style={[styles.miniMark, isBlue ? styles.miniMarkBlue : null]}>
        <Text style={[styles.miniMarkText, isBlue ? styles.miniMarkTextBlue : null]}>{mark}</Text>
      </View>
      <View style={styles.miniCopy}>
        <Text style={styles.miniTitle}>{label}</Text>
        <Text style={styles.miniDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function LinkRecoveryHero({
  reduceMotion,
  signal,
}: {
  reduceMotion: boolean;
  signal: Animated.Value;
}) {
  const scanY = reduceMotion
    ? 0
    : signal.interpolate({
        inputRange: [0, 1],
        outputRange: [-12, 74],
      });
  const toastOpacity = reduceMotion
    ? 1
    : signal.interpolate({
        inputRange: [0, 0.24, 1],
        outputRange: [0, 1, 1],
      });

  return (
    <View style={styles.linkHero}>
      <View style={styles.linkHeroHeader}>
        <View>
          <Text style={styles.heroKickerLight}>Latest app link</Text>
          <Text style={styles.linkHeroTitle}>Lisbon Trip</Text>
        </View>
        <ModeChip label="Split" />
      </View>
      <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }] }]} />
      <View style={styles.linkHeroBody}>
        <MiniCard detail="fundwise.fun/groups/lisbon" label="Invite saved" mark="LK" />
        <MiniCard detail="Ready to reopen after wallet handoff" label="Settlement receipt" mark="RC" tone="blue" />
      </View>
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
        <Text style={styles.toastIcon}>OK</Text>
        <Text style={styles.toastText}>Link recovered on Android</Text>
      </Animated.View>
    </View>
  );
}

function WalletNode({
  active,
  label,
  mark,
  scale,
}: {
  active?: boolean;
  label: string;
  mark: string;
  scale: Animated.AnimatedInterpolation<number> | number;
}) {
  return (
    <Animated.View style={[styles.walletNode, active ? styles.walletNodeActive : null, { transform: [{ scale }] }]}>
      <Text style={[styles.walletNodeMark, active ? styles.walletNodeMarkActive : null]}>{mark}</Text>
      <Text style={[styles.walletNodeLabel, active ? styles.walletNodeLabelActive : null]}>{label}</Text>
    </Animated.View>
  );
}

function WalletHandoffHero({
  reduceMotion,
  signal,
}: {
  reduceMotion: boolean;
  signal: Animated.Value;
}) {
  const activeScale = reduceMotion
    ? 1
    : signal.interpolate({
        inputRange: [0, 1],
        outputRange: [0.96, 1.03],
      });

  return (
    <View style={styles.walletHero}>
      <View style={styles.walletHeroTop}>
        <Text style={styles.heroKickerLight}>Mobile Wallet Adapter</Text>
        <Text style={styles.lockGlyph}>LOCK</Text>
      </View>
      <View style={styles.walletNodeRow}>
        <WalletNode label="Seeker" mark="PH" scale={1} />
        <View style={styles.walletConnector} />
        <WalletNode active label="MWA" mark="MW" scale={activeScale} />
        <View style={styles.walletConnector} />
        <WalletNode label="Wallet" mark="OK" scale={1} />
      </View>
      <View style={styles.walletStatus}>
        <View>
          <Text style={styles.walletStatusLabel}>Wallet</Text>
          <Text style={styles.walletStatusValue}>7xKp...mN4q</Text>
        </View>
        <View>
          <Text style={styles.walletStatusLabel}>Cluster</Text>
          <Text style={styles.walletStatusValue}>mainnet</Text>
        </View>
      </View>
    </View>
  );
}

function ContinueHero({
  reduceMotion,
  signal,
}: {
  reduceMotion: boolean;
  signal: Animated.Value;
}) {
  const packetX = reduceMotion
    ? 82
    : signal.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 128],
      });
  const packetY = reduceMotion
    ? -28
    : signal.interpolate({
        inputRange: [0, 0.55, 1],
        outputRange: [0, -38, -18],
      });
  const packetOpacity = reduceMotion
    ? 1
    : signal.interpolate({
        inputRange: [0, 0.16, 0.84, 1],
        outputRange: [0, 1, 1, 0],
      });

  return (
    <View style={styles.continueHero}>
      <View style={styles.urlCard}>
        <Text style={styles.urlLabel}>Continuation URL</Text>
        <Text style={styles.urlText}>fundwise.fun/groups/lisbon</Text>
        <Text style={styles.urlText}>?settleFrom=7xKp...</Text>
        <Text style={styles.urlText}>&settleTo=9mNd...</Text>
        <Animated.View
          style={[
            styles.sharePacket,
            {
              opacity: packetOpacity,
              transform: [{ translateX: packetX }, { translateY: packetY }],
            },
          ]}
        />
      </View>
      <View style={styles.surfaceRow}>
        <View style={styles.surfaceCard}>
          <Text style={styles.surfaceMark}>PH</Text>
          <Text style={styles.surfaceTitle}>Phone</Text>
          <Text style={styles.surfaceDetail}>Start quick</Text>
        </View>
        <View style={[styles.surfaceCard, styles.surfaceCardBlue]}>
          <Text style={[styles.surfaceMark, styles.surfaceMarkBlue]}>PC</Text>
          <Text style={styles.surfaceTitle}>Web / PC</Text>
          <Text style={styles.surfaceDetail}>Review safely</Text>
        </View>
      </View>
    </View>
  );
}

function SlideHero({
  kind,
  reduceMotion,
  signal,
}: {
  kind: OnboardingKind;
  reduceMotion: boolean;
  signal: Animated.Value;
}) {
  if (kind === "wallet") {
    return <WalletHandoffHero reduceMotion={reduceMotion} signal={signal} />;
  }

  if (kind === "continue") {
    return <ContinueHero reduceMotion={reduceMotion} signal={signal} />;
  }

  return <LinkRecoveryHero reduceMotion={reduceMotion} signal={signal} />;
}

function SlideSupport({ kind }: { kind: OnboardingKind }) {
  if (kind === "wallet") {
    return (
      <View style={styles.supportGrid}>
        <MiniCard detail="Wallet signs outside Seeker" label="No keys" mark="LK" />
        <MiniCard detail="Detects app switch back" label="Return state" mark="RT" tone="blue" />
      </View>
    );
  }

  if (kind === "continue") {
    return (
      <View style={styles.boundaryCard}>
        <View>
          <Text style={styles.boundaryTitle}>Protected money boundary</Text>
          <Text style={styles.boundaryDetail}>Native app opens web for settlement until signing is tested.</Text>
        </View>
        <Text style={styles.boundaryMark}>LOCK</Text>
      </View>
    );
  }

  return (
    <View style={styles.supportStack}>
      <MiniCard detail="Invite, Group dashboard, Settlement, or Receipt" label="Recover Group state" mark="GR" />
      <MiniCard detail="Latest link is still there after wallet handoff" label="Survive app switching" mark="RT" />
    </View>
  );
}

export function SeekerOnboardingScreen({ onDone }: { onDone: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const signal = useRef(new Animated.Value(0)).current;
  const transition = useRef(new Animated.Value(1)).current;
  const { height } = useWindowDimensions();
  const activeSlide = slides[activeIndex];
  const isLastSlide = activeIndex === slides.length - 1;
  const isCompact = height < 760;

  useEffect(() => {
    if (reduceMotion) {
      signal.setValue(1);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(signal, {
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(signal, {
          duration: 350,
          easing: Easing.inOut(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [reduceMotion, signal]);

  useEffect(() => {
    if (reduceMotion) {
      transition.setValue(1);
      return;
    }

    transition.setValue(0);
    Animated.timing(transition, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, reduceMotion, transition]);

  function goNext() {
    if (isLastSlide) {
      onDone();
      return;
    }

    setActiveIndex((index) => Math.min(index + 1, slides.length - 1));
  }

  return (
    <View style={styles.screen}>
      <SeekerHeader onSkip={onDone} step={activeIndex + 1} />
      <ScrollView
        contentContainerStyle={[styles.content, isCompact ? styles.compactContent : null]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.slideBody,
            {
              opacity: transition,
              transform: [
                {
                  translateY: reduceMotion
                    ? 0
                    : transition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                },
              ],
            },
          ]}
        >
          <ProgressDots activeIndex={activeIndex} />
          <Text style={styles.eyebrow}>{activeSlide.eyebrow}</Text>
          <Text style={styles.title}>{activeSlide.title}</Text>
          <Text style={styles.body}>{activeSlide.body}</Text>
          <SlideHero kind={activeSlide.kind} reduceMotion={reduceMotion} signal={signal} />
          <SlideSupport kind={activeSlide.kind} />
        </Animated.View>
      </ScrollView>
      <View style={styles.actions}>
        <ActionButton
          accessibilityHint={isLastSlide ? "Completes onboarding and opens Seeker." : "Shows the next onboarding step."}
          accessibilityLabel={isLastSlide ? "Start using Seeker" : activeSlide.primary}
          onPress={goNext}
        >
          {activeSlide.primary}
        </ActionButton>
        <Pressable
          accessibilityHint={isLastSlide ? "Shares a FundWise continuation link after onboarding." : "Skips this optional onboarding action."}
          accessibilityLabel={activeSlide.secondary}
          accessibilityRole="button"
          onPress={goNext}
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.secondaryButtonText}>{activeSlide.secondary}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    backgroundColor: colors.bg,
    gap: 8,
    paddingBottom: 16,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
  },
  boundaryCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 13,
  },
  boundaryDetail: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 2,
  },
  boundaryMark: {
    color: colors.primaryMid,
    fontSize: 11,
    fontWeight: "900",
  },
  boundaryTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  compactContent: {
    paddingBottom: 6,
  },
  content: {
    paddingBottom: 12,
    paddingHorizontal: 18,
  },
  continueHero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    overflow: "hidden",
    padding: 14,
  },
  eyebrow: {
    color: colors.primaryMid,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  headerMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  heroKickerLight: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
    opacity: 0.84,
    textTransform: "uppercase",
  },
  linkHero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  linkHeroBody: {
    gap: 8,
    padding: 12,
  },
  linkHeroHeader: {
    backgroundColor: colors.primaryMid,
    minHeight: 104,
    overflow: "hidden",
    padding: 14,
  },
  linkHeroTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: 4,
  },
  lockGlyph: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
    opacity: 0.84,
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
  markBottom: {
    backgroundColor: colors.primaryFresh,
    left: 7,
    top: 24,
    transform: [{ rotate: "2deg" }],
    width: 22,
  },
  markMiddle: {
    backgroundColor: colors.primary,
    left: 3,
    top: 16,
    width: 28,
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
  miniCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  miniCardBlue: {
    backgroundColor: colors.fundBluePale,
    borderColor: colors.fundBlueBorder,
  },
  miniCopy: {
    flex: 1,
    minWidth: 0,
  },
  miniDetail: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
    marginTop: 2,
  },
  miniMark: {
    alignItems: "center",
    backgroundColor: colors.primaryPale,
    borderRadius: 11,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  miniMarkBlue: {
    backgroundColor: colors.fundBlue,
  },
  miniMarkText: {
    color: colors.primaryMid,
    fontSize: 11,
    fontWeight: "900",
  },
  miniMarkTextBlue: {
    color: colors.white,
  },
  miniTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
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
  modeChipBlue: {
    backgroundColor: colors.fundBluePale,
    borderColor: colors.fundBlueBorder,
  },
  modeChipGreen: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.borderStrong,
  },
  modeDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  modeDotBlue: {
    backgroundColor: colors.fundBlue,
  },
  modeDotGreen: {
    backgroundColor: colors.primaryFresh,
  },
  modeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  modeTextBlue: {
    color: colors.fundBlue,
  },
  modeTextGreen: {
    color: colors.primaryMid,
  },
  pressed: {
    opacity: 0.72,
  },
  progressDot: {
    backgroundColor: colors.surfaceInset,
    borderRadius: 999,
    height: 7,
    width: 18,
  },
  progressDotActive: {
    backgroundColor: colors.primaryMid,
    width: 34,
  },
  progressRow: {
    flexDirection: "row",
    gap: 7,
  },
  scanLine: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 999,
    height: 2,
    left: 16,
    position: "absolute",
    right: 16,
    top: 74,
  },
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
  },
  secondaryButtonText: {
    color: colors.primaryMid,
    fontSize: 14,
    fontWeight: "900",
  },
  sharePacket: {
    backgroundColor: colors.primaryMid,
    borderRadius: 9,
    bottom: 27,
    height: 18,
    left: 34,
    position: "absolute",
    width: 18,
  },
  skipButton: {
    alignItems: "center",
    borderRadius: 999,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  slideBody: {
    gap: 12,
  },
  stepBadge: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.primaryMid,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  supportGrid: {
    flexDirection: "row",
    gap: 8,
  },
  supportStack: {
    gap: 8,
  },
  surfaceCard: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minHeight: 102,
    padding: 12,
  },
  surfaceCardBlue: {
    backgroundColor: colors.fundBluePale,
    borderColor: colors.fundBlueBorder,
  },
  surfaceDetail: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  surfaceMark: {
    color: colors.primaryMid,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 18,
  },
  surfaceMarkBlue: {
    color: colors.fundBlue,
  },
  surfaceRow: {
    flexDirection: "row",
    gap: 10,
  },
  surfaceTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 34,
  },
  toast: {
    alignItems: "center",
    backgroundColor: colors.primaryMid,
    borderRadius: 13,
    bottom: 20,
    flexDirection: "row",
    gap: 8,
    left: 28,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: "absolute",
    right: 28,
  },
  toastIcon: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },
  toastText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
  urlCard: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 120,
    overflow: "hidden",
    padding: 13,
  },
  urlLabel: {
    color: colors.primaryMid,
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 7,
    textTransform: "uppercase",
  },
  urlText: {
    color: colors.textMuted,
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  walletConnector: {
    backgroundColor: "rgba(255,255,255,0.28)",
    flex: 1,
    height: 2,
  },
  walletHero: {
    backgroundColor: colors.primaryMid,
    borderRadius: 24,
    gap: 20,
    overflow: "hidden",
    padding: 16,
  },
  walletHeroTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  walletNode: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    height: 86,
    justifyContent: "center",
    width: 86,
  },
  walletNodeActive: {
    backgroundColor: colors.white,
  },
  walletNodeLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },
  walletNodeLabelActive: {
    color: colors.primaryMid,
  },
  walletNodeMark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  walletNodeMarkActive: {
    color: colors.primaryMid,
  },
  walletNodeRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  walletStatus: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  walletStatusLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
    opacity: 0.74,
    textTransform: "uppercase",
  },
  walletStatusValue: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 3,
  },
  wordmark: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
});
