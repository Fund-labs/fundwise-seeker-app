import type { PublicKey } from "@solana/web3.js";

// The project-owned wallet seam (docs/wallet-transport-seam.md). Screens learn
// these 4 members; everything platform-specific hides inside an adapter.
//
// Contract notes beyond the types:
// - `connect` may background the app while the wallet approves; callers must
//   tolerate resume.
// - Timeout policy: `connect` is bounded inside the adapter (a dead wallet
//   surfaces a retry). `signMessages` is deliberately unbounded — the shipped
//   auth-challenge flow must tolerate a wallet backgrounded past 60s; callers
//   that want a bound wrap the call in `withWalletTimeout` per call site.
// - No `signAndSendTransaction`: settlement handoff stays on FundWise web.
export type WalletAccount = Readonly<{
  address: PublicKey;
  label?: string;
}>;

export interface WalletTransport {
  readonly account: WalletAccount | null;
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  signMessages(message: Uint8Array): Promise<Uint8Array>;
}

const WALLET_TIMEOUT_MS = 60000;

// Race a wallet round-trip against a timeout so a non-responding wallet surfaces
// a retry instead of hanging forever (MWA transact has no built-in timeout).
export function withWalletTimeout<T>(promise: Promise<T>, ms = WALLET_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Wallet request timed out.")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
