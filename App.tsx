import { clusterApiUrl } from "@solana/web3.js";
import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import { FUNDWISE_IDENTITY, SOLANA_CHAIN, SOLANA_RPC_ENDPOINT } from "./src/config";
import { SeekerHomeScreen } from "./src/screens/SeekerHomeScreen";

export default function App() {
  return (
    <MobileWalletProvider
      chain={SOLANA_CHAIN}
      endpoint={SOLANA_RPC_ENDPOINT || clusterApiUrl("mainnet-beta")}
      identity={FUNDWISE_IDENTITY}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <SeekerHomeScreen />
      </SafeAreaView>
    </MobileWalletProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
