# WalletTransport seam — iOS enablement design (FW-136 / FundWise ADR-0063)

**Status:** Accepted design, 2026-07-22 · **Drives:** iOS TestFlight build (FundWise FW-136)
**Context:** MWA (`@wallet-ui/react-native-web3js`) is Android-only. The 2026-07-22 survey found no project-owned wallet seam — `useMobileWallet()` is called raw in `SeekerHomeScreen.tsx:114`, `SeekerOnboardingV2Screen.tsx:828`, `FundWiseSeekerAppScreen.tsx:3357`, with `MobileWalletProvider` mounted in `App.tsx:12-16`. The consumed surface is small and sends are deferred to FundWise web.

## The interface

One module, `src/wallet/` — a deep module: screens learn 4 members, everything platform-specific hides inside.

```ts
// src/wallet/transport.ts
export type WalletAccount = { address: string; label?: string }

export interface WalletTransport {
  readonly account: WalletAccount | null
  connect(): Promise<WalletAccount>
  disconnect(): Promise<void>
  signMessages(message: Uint8Array): Promise<Uint8Array>
}
```

Exposed to screens via a project-owned hook + provider:

```ts
// src/wallet/useWallet.ts
export function useWallet(): WalletTransport
// src/wallet/WalletProvider.tsx — selects the adapter by Platform.OS, mounts ONE stable tree shape
```

Interface notes (part of the contract, not just types): `connect` may background the app (both adapters); callers must tolerate resume. **Timeout policy (refined 2026-07-22 after adversarial review):** `connect` is bounded inside the adapter (60s — MWA `transact` has no built-in timeout), but `signMessages` is deliberately **unbounded** — the shipped auth-challenge flow must tolerate a wallet backgrounded past 60s, and a timed-out race discards a signature the wallet believes it delivered. Call sites that want a bound (e.g. the intent-sign) wrap the call in the exported `withWalletTimeout` themselves — timeout on signing is per-call policy, not transport policy. No `signAndSendTransaction` — settlement handoff stays on FundWise web; do not widen the seam for iOS.

## The adapters

- **`MwaTransport` (Android):** wraps the existing `useMobileWallet` SDK hook. Behavior-preserving — this adapter is a refactor, not a change.
- **`DeeplinkTransport` (iOS):** Phantom (and Solflare) universal-link connect + signMessage flows: build request → open wallet app → receive callback via the existing `Linking` listener path (`src/hooks/useIncomingFundWiseLink.ts` stays untouched; the transport registers its own callback routes). Session keypair + shared-secret handling per Phantom's deeplink spec lives entirely inside the adapter.
- **Later (not now):** Crossmint / embedded wallet = a third adapter behind the same seam. Screens don't change.

Two real adapters ⇒ this is a real seam (not speculative). The interface is also the test surface: an in-memory `FakeTransport` adapter drives screen tests without MWA or a device.

## Migration plan (small, ordered)

1. Add `src/wallet/` (interface + provider + `MwaTransport`). `App.tsx` mounts `WalletProvider`.
2. Migrate the 3 screens from `useMobileWallet` to `useWallet`. Android behavior identical — ship/QA this alone first.
3. Add `DeeplinkTransport` + iOS targets: `ios` key in `app.json` (bundle id, associated domains for callbacks), `ios` EAS profile in `eas.json`.
4. EAS iOS build → TestFlight internal → rehearse the real-USDC settle via deeplink.

## What this does not do

- No transaction signing on iOS (or Android) — unchanged handoff-to-web model.
- No changes to the deep-link parser (`src/lib/fundwise-link.ts`) beyond the transport's own callback routes.
- No MWA removal — Android keeps MWA; Seeker dApp Store build is unaffected.
