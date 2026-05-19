import { clusterApiUrl } from "@solana/web3.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { FUNDWISE_IDENTITY, SOLANA_CHAIN, SOLANA_RPC_ENDPOINT } from "./src/config";
import { SeekerHomeScreen } from "./src/screens/SeekerHomeScreen";
import { SeekerOnboardingScreen } from "./src/screens/SeekerOnboardingScreen";
import { colors } from "./src/theme/colors";

const ONBOARDING_KEY = "fundwise-seeker:onboarding-complete";

export default function App() {
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => {
        if (mounted) {
          setShowOnboarding(value !== "true");
        }
      })
      .catch(() => {
        if (mounted) {
          setShowOnboarding(true);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsOnboardingLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function completeOnboarding() {
    setShowOnboarding(false);

    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // Onboarding persistence is a convenience; the user should still enter the app.
    }
  }

  async function replayOnboarding() {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
    } catch {
      // Replay should still work even if storage is unavailable.
    }

    setShowOnboarding(true);
  }

  return (
    <MobileWalletProvider
      chain={SOLANA_CHAIN}
      endpoint={SOLANA_RPC_ENDPOINT || clusterApiUrl("mainnet-beta")}
      identity={FUNDWISE_IDENTITY}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        {isOnboardingLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primaryMid} />
          </View>
        ) : showOnboarding ? (
          <SeekerOnboardingScreen onDone={() => void completeOnboarding()} />
        ) : (
          <SeekerHomeScreen onReplayOnboarding={() => void replayOnboarding()} />
        )}
      </SafeAreaView>
    </MobileWalletProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingState: {
    alignItems: "center",
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: "center",
  },
});
