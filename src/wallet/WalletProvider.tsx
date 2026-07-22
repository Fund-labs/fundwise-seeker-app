import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import { createContext, type ReactNode } from "react";
import { FUNDWISE_IDENTITY, SOLANA_CHAIN, SOLANA_RPC_ENDPOINT } from "../config";
import { useMwaTransport } from "./MwaTransport";
import type { WalletTransport } from "./transport";

export const WalletTransportContext = createContext<WalletTransport | null>(null);

// Mounts ONE stable tree shape: the MWA SDK provider plus a bridge exposing the
// project-owned WalletTransport seam. Adapter selection (e.g. a future iOS
// deeplink transport) happens inside the bridge — never by swapping the
// subtree, so screen state survives adapter differences.
export function WalletProvider({ children }: { children: ReactNode }) {
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
