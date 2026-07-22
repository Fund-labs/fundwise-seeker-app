import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useMemo } from "react";
import { withWalletTimeout, type WalletTransport } from "./transport";

// MwaTransport (Android): wraps the @wallet-ui Mobile Wallet Adapter hook so
// the SDK owns the MWA auth token and persists the authorization — the address
// survives app restart and reconnects reuse the token instead of re-prompting.
export function useMwaTransport(): WalletTransport {
  const { account, connect, disconnect, signMessages } = useMobileWallet();

  return useMemo(
    () => ({
      account: account ?? null,
      connect: () => withWalletTimeout(connect()),
      disconnect: () => disconnect(),
      // No timeout here: the FundWise auth-challenge sign must be allowed to
      // outlive a backgrounded wallet — a timed-out race discards a signature
      // the wallet believes it delivered. Callers that want a bound wrap the
      // call in withWalletTimeout themselves (per-call policy).
      signMessages: (message: Uint8Array) => signMessages(message),
    }),
    [account, connect, disconnect, signMessages],
  );
}
