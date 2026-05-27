import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import { FUNDWISE_IDENTITY, SOLANA_CHAIN, SOLANA_RPC_ENDPOINT } from "./src/config";
import { FundWiseSeekerAppScreen } from "./src/screens/FundWiseSeekerAppScreen";
import { colors } from "./src/theme/colors";

export default function App() {
  return (
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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.bg,
    flex: 1,
  },
});
