import { useContext } from "react";
import type { WalletTransport } from "./transport";
import { WalletTransportContext } from "./WalletProvider";

export function useWallet(): WalletTransport {
  const transport = useContext(WalletTransportContext);

  if (!transport) {
    throw new Error("useWallet must be used within a WalletProvider.");
  }

  return transport;
}
