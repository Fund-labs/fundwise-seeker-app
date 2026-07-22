import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import { createContext, type ReactNode } from "react";
import { Platform } from "react-native";
import { FUNDWISE_IDENTITY, SOLANA_CHAIN, SOLANA_RPC_ENDPOINT } from "../config";
import { useDeeplinkTransport } from "./DeeplinkTransport";
import { useMwaTransport } from "./MwaTransport";
import type { WalletTransport } from "./transport";

export const WalletTransportContext = createContext<WalletTransport | null>(null);

// Mounts ONE stable tree shape per platform. Platform.OS never changes at
// runtime, so this top-level ternary picks exactly one subtree for the life of
// the app — each bridge calls its own transport hook unconditionally, so hook
// counts never vary within a mounted tree (the React #310 class of bug this
// seam exists to prevent).
export function WalletProvider({ children }: { children: ReactNode }) {
  if (Platform.OS === "ios") {
    return <DeeplinkTransportBridge>{children}</DeeplinkTransportBridge>;
  }

  return (
    <MobileWalletProvider
      chain={SOLANA_CHAIN}
      endpoint={SOLANA_RPC_ENDPOINT}
      identity={FUNDWISE_IDENTITY}
    >
      <MwaTransportBridge>{children}</MwaTransportBridge>
    </MobileWalletProvider>
  );
}

function MwaTransportBridge({ children }: { children: ReactNode }) {
  const transport = useMwaTransport();

  return <WalletTransportContext.Provider value={transport}>{children}</WalletTransportContext.Provider>;
}

function DeeplinkTransportBridge({ children }: { children: ReactNode }) {
  const transport = useDeeplinkTransport();

  return <WalletTransportContext.Provider value={transport}>{children}</WalletTransportContext.Provider>;
}
