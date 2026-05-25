# SADR-001: Seeker-Native Settlement Handoff

**Status:** Suggested / research-backed, not accepted
**Date:** 2026-05-25
**Owner:** FundWiseSeeker
**Related:** [SADR-002](./SADR-002-seeker-genesis-member-badge-gating.md), [SADR-003](./SADR-003-readable-wallet-names-skr-sol-phantom.md), [SADR-004](./SADR-004-native-settlement-transaction-construction.md), [SADR-005](./SADR-005-native-settlement-recovery-inbox.md), [FundWise SADR-008](../../../FundWise/plans/SADR/SADR-008-settlement-blinks.md), [FundWise SADR-010](../../../FundWise/plans/SADR/SADR-010-actionable-settlement-nudges.md), [Receipts SADR-001](../../../Receipts/plans/SADR/SADR-001-receipt-graph.md), [Fundy SADR-001](../../../Fundy/plans/SADR/SADR-001-fundy-group-autopilot.md), [FundWise SADR-009](../../../FundWise/plans/SADR/SADR-009-fundy-group-autopilot.md)

## Summary

FundWiseSeeker should explore **Seeker-native Settlement handoff**: an Android-first mobile surface that can recover FundWise Group links, Settlement Request links, Settlement Blinks, and Receipt links, then guide the user through the right wallet or web continuation path.

V1 should not replace FundWise as the ledger or Receipts as the proof service. The mobile app should own link recovery, wallet identity, preflight UX, native sharing, and continuation. Native transaction construction should be accepted only after the web Settlement flow, Android app links, physical-device MWA signing, and post-payment receipt persistence are proven end to end.

## Why This Exists

The current FundLabs feature map has three strong surfaces:

- FundWise creates live Settlement Request Links and future Settlement Blinks.
- Fundy can distribute those links from Telegram.
- Receipts can turn confirmed Solana transactions into structured proof.

The missing surface is mobile recovery. A Seeker user should be able to tap a link from Telegram, a Blink, a receipt, or a browser and land in the Android app with the same FundWise context preserved.

The killer feature is not a separate mobile ledger. It is:

```text
Telegram / Blink / web link -> Seeker app recovery -> MWA wallet context -> FundWise Settlement -> Receipt Graph proof
```

## Current State

Current FundWiseSeeker capabilities:

- React Native / Expo custom development build.
- `@wallet-ui/react-native-web3js` and `@solana/web3.js`.
- `react-native-quick-crypto` polyfill imported first through `index.js`.
- `MobileWalletProvider` at the app root.
- Direct MWA `transact` path for wallet authorization and message-signing proof.
- FundWise API health check and public invite lookup.
- Incoming link persistence through `AsyncStorage`.
- FundWise link parser for Group links, invite links, Settlement Request links, and Settlement receipt links.
- Native share sheet for continuation links.
- Android intent filter for `https://fundwise.fun/groups`.
- No native settlement transaction construction yet.

Current gap:

- Android app links do not yet cover `/settle/r/...`.
- Receipt Endpoint / Receipt Graph links are not first-class mobile intents.
- Native transaction construction is intentionally not wired.
- Receipt persistence after a native wallet-submitted transaction is not defined.
- Seeker Genesis Token ownership is not verified server-side.

## Research Notes

### Solana Mobile React Native path matches the current app

Solana Mobile's React Native installation docs direct apps to install `@wallet-ui/react-native-web3js`, `react-native-quick-crypto`, `@solana/web3.js`, and `expo-dev-client`. The docs also require the crypto polyfill to be imported before Solana code, and call out that MWA needs a custom Expo development build instead of Expo Go.

Current app fit:

- `index.js` imports `./polyfill` first.
- `App.tsx` wraps the app in `MobileWalletProvider`.
- `src/config.ts` owns FundWise identity, chain, and endpoint.

Relevant source:

- Solana Mobile React Native installation: https://docs.solanamobile.com/get-started/react-native/installation

### MWA is the right Android wallet boundary

Solana Mobile documents Mobile Wallet Adapter as the protocol for Solana mobile dApps to connect with wallet apps for transaction and message signing. The platform table gives Android native full support and states that iOS is not currently supported for MWA.

Implication:

- FundWiseSeeker should stay Android-first for native wallet signing.
- iOS should not be treated as a direct port of this flow.
- FundWise web can remain the fallback for non-MWA clients.

Relevant source:

- Solana Mobile MWA overview: https://docs.solanamobile.com/developers/mobile-wallet-adapter

### App Links are a security and UX requirement

Android App Links verification checks HTTP/HTTPS intent filters and fetches `https://<host>/.well-known/assetlinks.json` for each host. Android's docs provide commands to trigger and inspect app-link verification state on devices.

The MWA specification also treats Digital Asset Links as part of native dApp identity. Wallet endpoints can use package identity plus asset links to verify the dApp identity URI; failure to establish these links weakens wallet trust.

Implication:

- FundWiseSeeker must ship valid `assetlinks.json` for `fundwise.fun` before production wallet prompts are trusted.
- App-link testing should be a release criterion, not a nice-to-have.
- The app should avoid claiming native Settlement production-readiness until app links verify on real devices.

Relevant sources:

- Android App Links verification: https://developer.android.com/training/app-links/verify-applinks
- MWA 2.0 specification: https://solana-mobile.github.io/mobile-wallet-adapter/spec/spec.html

## Decision

FundWiseSeeker should become the Android link recovery and wallet handoff surface for FundWise Settlements, Settlement Blinks, and Receipts.

V1 accepted scope:

1. Recover FundWise links from Android App Links and stored incoming links.
2. Parse and classify Group, invite, Settlement Request, Settlement Blink, Settlement receipt, and Receipt Graph links.
3. Connect a wallet through MWA.
4. Show a mobile-native preflight state: linked wallet, target Group, amount source, settlement direction, and whether the action must continue on web.
5. Open the correct FundWise web route for wallet-confirmed Settlement until native tx construction is accepted.
6. Open or share Receipt Graph / Receipt Endpoint links after payment.

V1 rejected scope:

- native autonomous settlement;
- native FundWise ledger writes without server-side verification;
- native receipt creation without Receipts/FundWise verification;
- iOS MWA claims;
- Seeker device detection as an authority check.

## Link Contract

FundWiseSeeker should recognize these link families:

```text
https://fundwise.fun/groups
https://fundwise.fun/groups/{groupId}
https://fundwise.fun/groups/{groupId}?code={inviteCode}
https://fundwise.fun/groups/{groupId}?settleFrom={debtorWallet}&settleTo={creditorWallet}
https://fundwise.fun/groups/{groupId}/settlements/{settlementId}
https://fundwise.fun/settle/r/{requestId}
https://fundwise.fun/receipts/{receiptId_or_tx_signature}
```

Receipt service links should remain configurable because the Receipts service may deploy on a separate host:

```text
{EXPO_PUBLIC_RECEIPTS_URL}/v1/receipts/{tx_signature}
{EXPO_PUBLIC_RECEIPTS_URL}/v1/graph/receipts/{tx_signature}
```

Suggested intent-filter expansion:

```text
host: fundwise.fun
pathPrefix: /groups
pathPrefix: /settle/r
pathPrefix: /receipts
```

If Receipts uses a separate production host, add that host only after its `assetlinks.json` and privacy model are accepted.

## Product Flow

### Group or invite link

```text
Open link -> parse Group/invite -> show Group recovery -> connect wallet if needed -> continue on FundWise web
```

### Settlement Request Link

```text
Open link -> parse debtor/creditor/request -> connect MWA wallet -> show preflight -> continue to FundWise web Settlement page
```

### Settlement Blink fallback

```text
Open /settle/r/{requestId} -> fetch public request preview -> connect wallet -> hand off to web or Action-aware client
```

FundWiseSeeker should not independently compute the amount from cached mobile state. It should request a fresh preview from FundWise.

### Receipt link

```text
Open receipt link -> show verified receipt preview or browser continuation -> offer share/export
```

Receipt Graph private context should require FundWise/Receipts authorization. The mobile app may display public-redacted context without becoming the graph authority.

## Native Transaction Boundary

Native transaction construction can move from "planned" to "accepted" only after all are true:

- Split Mode web Settlement is stable on mainnet.
- Android App Links verify for every claimed host.
- MWA signing is tested on a physical Android device with a real wallet.
- The app handles background/foreground wallet round trips and signing timeouts.
- FundWise exposes a mobile-safe transaction-build or Settlement intent endpoint.
- FundWise verifies the submitted signature server-side before writing a Settlement.
- Receipts can generate or index a Receipt Graph record from the confirmed signature.
- A failed mobile submission can be recovered by tx signature, request intent, or Helius recovery.

Until then, native flows should be **preflight and continuation**, not money movement.

## Proposed Data / API Needs

### Mobile link intent

Local mobile object:

```text
kind                  -- group, invite, settlement_request, settlement_blink, settlement_receipt, receipt_graph, unknown
url
group_id
request_id
settlement_id
tx_signature
receipt_id
received_at
source                -- initial, event, storage, share_sheet
```

### FundWise preview endpoint

Potential future endpoint:

```text
GET /api/mobile/settlement-requests/{requestId}/preview?wallet={wallet}
```

Returns redacted preview:

```text
request_id
group_id
debtor_wallet
creditor_wallet
asset
amount_source         -- live_balance
expires_at
wallet_role           -- debtor, creditor, member, outsider
next_action           -- continue_web, native_sign_available, unavailable
```

The preview must not expose private Group metadata to outsiders.

### Post-payment handoff

After a web or native payment succeeds:

```text
tx_signature -> FundWise verifies Settlement -> Receipts indexes graph edge -> Seeker opens/share Receipt URL
```

## Security And Privacy Requirements

- Never trust mobile-supplied amount, payer, payee, mint, timestamp, or receipt context.
- Never store private keys in the app.
- Treat Seeker device detection as UX only; real Seeker-owner gating requires SIWS plus backend Seeker Genesis Token verification.
- Use Android App Links plus Digital Asset Links for production domains.
- Keep FundWise as source of truth for Group and Settlement state.
- Keep Receipts as source of truth for receipt rendering, hashing, tokenization, and graph proof.
- Do not expose private Receipt Graph context without scoped service/user authorization.
- Keep query-string API keys out of mobile receipt URLs.
- Handle wallet app switching, timeout, cancellation, offline state, and stale links explicitly.

## Implementation Sequence

### Phase 0 - Planning

- Add this SADR.
- Cross-link FundWise, Fundy, Receipts, and FundLabs SADR indexes.
- Keep native money movement out of scope.

### Phase 1 - Link parser expansion

- Add `/settle/r/{requestId}` parsing.
- Add receipt and graph receipt parsing.
- Add tests for link classification.

### Phase 2 - Android App Links

- Expand `app.json` intent filters for `/settle/r` and `/receipts`.
- Add/verify `assetlinks.json` for `fundwise.fun`.
- Document `adb shell pm get-app-links fun.fundwise.seeker` verification.

### Phase 3 - Mobile preflight

- Add mobile preview UI for Settlement Request and Blink links.
- Show wallet address and role.
- Route money movement to FundWise web.

### Phase 4 - Receipt handoff

- Add receipt preview/open/share UI.
- Integrate public-redacted Receipt Graph links.
- Preserve web fallback for private receipt context.

### Phase 5 - Native settlement spike

- Only after Phase 1-4 pass on a physical Android device.
- Build against a FundWise transaction intent endpoint.
- Submit signature to FundWise for verification.
- Hand off to Receipts for graph indexing.

## Acceptance Criteria For A Future ADR

- The Seeker app can recover `/groups`, `/settle/r`, and receipt links.
- App Links verify for all claimed production paths.
- Wallet authorization works through MWA on a physical Android device.
- Settlement Request previews are fetched fresh from FundWise.
- Mobile app does not compute or trust settlement amounts locally.
- Money movement remains web-confirmed until native tx flow is explicitly accepted.
- Receipt Graph links open/share from the mobile app without leaking private Group context.
- Failed or interrupted wallet flows can be retried or continued on web.

## Alternatives Considered

### Build the full Settlement transaction natively first

Deferred. It is attractive UX, but it increases risk before app links, wallet round trips, and receipt persistence are proven.

### Keep Seeker as only a marketing/onboarding app

Rejected. Link recovery is valuable and already partly implemented. It should become a real product surface without taking ledger authority.

### Use Phantom-only deep links

Rejected for v1 direction. Phantom deep links can work for narrow flows, but MWA keeps the app wallet-agnostic across Solana Mobile-compatible wallets.

### Claim Seeker device detection as access control

Rejected. `Platform.constants.Model` is useful for UI treatment only. Any premium or beta gating should be server-verified through wallet ownership and Seeker Genesis Token checks.

## Open Questions

- What production host will Receipts use, and will it support Android App Links?
- Should `/receipts/{id}` live on `fundwise.fun` as a web proxy over the Receipts service?
- What is the exact mobile-safe FundWise preview endpoint shape?
- Should native settlement use web3.js compatibility first or migrate the mobile stack to Kit before transaction construction?
- Which receipt view should be the default on mobile: FundWise receipt, Receipts HTML, or Receipt Graph?
- Should Seeker Genesis Token ownership unlock early mobile features, lower fees, or badge eligibility?

## Sources

- FundWiseSeeker README: `FundWiseSeeker/README.md`
- FundWiseSeeker architecture: `FundWiseSeeker/docs/architecture.md`
- FundWiseSeeker progress: `FundWiseSeeker/docs/progress.md`
- FundWiseSeeker Solana Mobile cross-check: `FundWiseSeeker/docs/solana-mobile-crosscheck.md`
- Current app files: `FundWiseSeeker/App.tsx`, `FundWiseSeeker/app.json`, `FundWiseSeeker/src/lib/fundwise-link.ts`, `FundWiseSeeker/src/hooks/useIncomingFundWiseLink.ts`
- Solana Mobile React Native installation: https://docs.solanamobile.com/get-started/react-native/installation
- Solana Mobile MWA overview: https://docs.solanamobile.com/developers/mobile-wallet-adapter
- Android App Links verification: https://developer.android.com/training/app-links/verify-applinks
- Mobile Wallet Adapter 2.0 specification: https://solana-mobile.github.io/mobile-wallet-adapter/spec/spec.html
