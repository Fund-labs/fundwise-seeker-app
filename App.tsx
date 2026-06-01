import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import { Component, type ReactNode } from "react";
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { FUNDWISE_IDENTITY, SOLANA_CHAIN, SOLANA_RPC_ENDPOINT } from "./src/config";
import { FundWiseSeekerAppScreen } from "./src/screens/FundWiseSeekerAppScreen";
import { colors } from "./src/theme/colors";

export default function App() {
  return (
    <AppErrorBoundary>
      <MobileWalletProvider
        chain={SOLANA_CHAIN}
        endpoint={SOLANA_RPC_ENDPOINT}
        identity={FUNDWISE_IDENTITY}
      >
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.bg} translucent={false} />
          <FundWiseSeekerAppScreen />
        </SafeAreaView>
      </MobileWalletProvider>
    </AppErrorBoundary>
  );
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[FundWise] App render failed", error);
  }

  render() {
    if (this.state.error) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.bg} translucent={false} />
          <View style={styles.errorScreen}>
            <Text style={styles.errorEyebrow}>FundWise Seeker</Text>
            <Text style={styles.errorTitle}>Something needs a reset</Text>
            <Text style={styles.errorBody}>The app hit a display error. Your wallet keys and signatures are not stored here.</Text>
            <Pressable accessibilityRole="button" onPress={() => this.setState({ error: null })} style={styles.errorButton}>
              <Text style={styles.errorButtonText}>Try again</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorBody: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginTop: 10,
    textAlign: "center",
  },
  errorButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 14,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 52,
    paddingHorizontal: 20,
    width: "100%",
  },
  errorButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  errorEyebrow: {
    color: colors.primaryMid,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  errorScreen: {
    alignItems: "center",
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  errorTitle: {
    color: colors.text,
    fontFamily: "serif",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 35,
    marginTop: 10,
    textAlign: "center",
  },
  safeArea: {
    backgroundColor: colors.bg,
    flex: 1,
  },
});
