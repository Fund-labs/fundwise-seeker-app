# SADR-004: Native Settlement Transaction Construction

**Status:** Suggested / research-backed, not accepted
**Date:** 2026-05-25
**Owner:** FundWiseSeeker / FundWise
**Related:** [SADR-001](./SADR-001-seeker-native-settlement-handoff.md), [SADR-003](./SADR-003-readable-wallet-names-skr-sol-phantom.md), [SADR-005](./SADR-005-native-settlement-recovery-inbox.md), [FundWise SADR-008](../../../FundWise/plans/SADR/SADR-008-settlement-blinks.md), [FundWise SADR-010](../../../FundWise/plans/SADR/SADR-010-actionable-settlement-nudges.md), [Receipts SADR-001](../../../Receipts/plans/SADR/SADR-001-receipt-graph.md)

## Summary

FundWiseSeeker should explore **Native Settlement Transaction Construction**: an Android-native flow where Seeker opens a FundWise Settlement Request, fetches a fresh server-issued execution intent, signs/sends the USDC transaction through Mobile Wallet Adapter, submits the resulting signature back to FundWise, and opens the Receipt. This flow is incomplete without [SADR-005](./SADR-005-native-settlement-recovery-inbox.md), which defines pending-signature, expired-intent, and receipt recovery behavior.

The boundary:

```text
FundWise = intent, live amount, membership, transaction verification, ledger write
FundWiseSeeker = native preflight, wallet session, transaction signing UX, receipt handoff
Wallet = private key custody and signature
Receipts = receipt rendering, graph proof, paid proof APIs
```

FundWiseSeeker must not become a second settlement ledger. It can make the payment feel native, but FundWise still decides what is owed and whether the submitted transaction counts.

## Why This Exists

SADR-001 makes Seeker the link recovery and wallet handoff surface. SADR-003 makes Seeker identity readable with `.skr` first. The next product wedge is:

```text
ana.skr -> Settlement Request -> Seeker preflight -> MWA sign/send -> Receipt Graph
```

This removes the web bounce for the highest-intent mobile moment while preserving the existing FundWise and Receipts truth boundaries.

Good native settlement should:

- feel like Tap-to-Settle inside the Seeker app;
- reuse the Settlement Blink / Action transaction builder where possible;
- show the payer, payee, amount, mint, fee payer, and wallet before signing;
- recover if the app is backgrounded, the wallet times out, or the signature is submitted but receipt persistence lags.

## Research Notes

### Mobile Wallet Adapter is the Android signing boundary

Solana Mobile documents MWA as the protocol for Solana mobile dApps to connect with wallet apps for transaction and message signing. The current docs list Android native support and no current iOS support for MWA.

The React Native docs expose both provider-level wallet helpers and direct MWA sessions. The direct session docs describe `signAndSendTransactions`, where the dApp sends an unsigned transaction to the wallet and the wallet signs and submits it.

Relevant sources:

- Solana Mobile MWA overview: https://docs.solanamobile.com/developers/mobile-wallet-adapter
- Solana Mobile React Native setup: https://docs.solanamobile.com/get-started/react-native/setup
- Solana Mobile direct MWA sessions: https://docs.solanamobile.com/get-started/react-native/invoke-mwa-sessions-directly
- MWA 2.0 specification: https://solana-mobile.github.io/mobile-wallet-adapter/spec/spec.html

Implication:

- FundWiseSeeker should use MWA for native settlement signing.
- The wallet, not the app, holds private keys.
- Native settlement should stay Android-first until a separate iOS wallet strategy exists.
- Prefer `signAndSendTransactions` first because it maps to the current MWA mandatory signing/send path; only use `signTransactions` if FundWise needs dApp-side submission control.

### Settlement Blinks and native settlement should share the server builder

Solana Actions are APIs that return signable transactions for users to preview, sign, and send. Blinks turn those APIs into shareable, metadata-rich links. FundWise SADR-008 already proposes a Settlement Action endpoint that creates short-lived execution intents.

Relevant sources:

- Solana Actions and Blinks guide: https://solana.com/developers/guides/advanced/actions
- Source page requested in SADR-008: https://github.com/solana-foundation/solana-com/blob/main/apps/docs/content/guides/advanced/actions.mdx
- FundWise SADR-008: [Settlement Blinks](../../../FundWise/plans/SADR/SADR-008-settlement-blinks.md)

Implication:

- FundWiseSeeker should not build a separate settlement amount or instruction policy.
- The first production path should reuse the same FundWise transaction builder used by Settlement Blinks.
- FundWise can expose a mobile endpoint that returns the same unsigned transaction plus stricter mobile display metadata.

### Solana transaction constraints shape the UX

Solana transactions contain instructions, required signatures, and a recent blockhash. Instructions execute atomically: if one fails, the entire transaction fails. Recent blockhashes expire, and failed transactions can still charge fees.

Relevant source:

- Solana transaction docs: https://solana.com/docs/core/transactions

Implication:

- Execution intents should expire quickly.
- Mobile UI needs a stale-transaction retry path.
- FundWise should never record a Settlement just because a transaction was issued to a wallet.
- The receipt state must distinguish `transaction_submitted`, `confirmed_unrecorded`, `recorded`, and `recovery_needed`.

### USDC transfer construction should be conservative

Solana token transfer docs recommend `TransferChecked` because it verifies mint and decimals before moving tokens. Destination associated token account creation may be needed, but the displayed payment amount should remain the FundWise amount.

Relevant source:

- Solana token transfer docs: https://solana.com/docs/tokens/basics/transfer-tokens

Implication:

- FundWise should build or approve SPL USDC `TransferChecked` instructions.
- Associated token account creation must be explicit in preflight if it changes fees or instructions.
- FundWise verification must check mint, sender, recipient, amount, token program, and execution intent.

## Decision

FundWiseSeeker should add a feature-flagged native settlement execution path after link recovery and mobile preflight are stable on physical Android devices.

V1 accepted:

1. FundWise owns Settlement Request intent, Group membership, live amount, recipient, mint, and server-side verification.
2. FundWise exposes a mobile-safe preview and transaction-build API.
3. FundWiseSeeker fetches the preview fresh; it never computes settlement amounts from local state.
4. FundWiseSeeker displays alias plus canonical wallet, amount, mint, fee payer, destination, and expiration before requesting a wallet signature.
5. The first production path should use a FundWise-built unsigned transaction so web Blinks and Seeker native settlement share one builder.
6. FundWiseSeeker requests MWA signing/sending, then submits the returned signature to FundWise.
7. FundWise records the Settlement only after verifying the on-chain transaction against the execution intent.
8. Receipts receives or indexes the confirmed signature and returns the receipt/graph URL.

V1 rejected:

- mobile-calculated settlement amounts;
- native ledger writes from FundWiseSeeker;
- accepting a mobile-submitted signature without server verification;
- Phantom-only signing as the primary path;
- iOS claims for this MWA-native flow;
- hiding canonical wallet addresses in money movement;
- treating `.skr` or `.sol` resolution as payment authority.

## Target Flow

```text
1. User opens /settle/r/{requestId} in FundWiseSeeker.
2. App connects or reuses an MWA wallet session.
3. App resolves display names, preferring .skr when available.
4. App calls FundWise preview endpoint with requestId + wallet.
5. FundWise returns wallet role, amount, recipient, mint, expiry, and next action.
6. User taps Settle.
7. App calls FundWise transaction endpoint.
8. FundWise creates a settlement_execution_intent and returns an unsigned transaction.
9. App shows final preflight and calls MWA signAndSendTransactions.
10. Wallet signs and submits; app receives tx signature.
11. App POSTs signature to FundWise confirm endpoint.
12. FundWise verifies, records Settlement, and asks Receipts to produce proof.
13. App opens the Receipt URL and stores recoverable local state.
```

## Proposed API Shape

### Preview

```text
GET /api/mobile/settlement-requests/{requestId}/preview?wallet={wallet}
```

Returns:

```text
request_id
group_id
wallet_role              -- debtor, creditor, member, outsider
from_wallet
to_wallet
display_from_alias
display_to_alias
asset                    -- USDC
mint
amount
decimals
amount_source            -- live_balance
expires_at
native_sign_available
fallback_url
receipt_expected_url
```

Rules:

- Outsiders receive only redacted unavailable state.
- Amount comes from the current FundWise settlement graph.
- Aliases are display context only.

### Build transaction

```text
POST /api/mobile/settlement-requests/{requestId}/transaction
```

Input:

```json
{
  "wallet": "debtor public key",
  "chain": "solana:mainnet",
  "client": "fundwise-seeker"
}
```

Returns:

```text
execution_intent_id
request_id
transaction_base64
transaction_format       -- versioned_transaction
transaction_fingerprint
fee_payer
from_wallet
to_wallet
source_token_account
destination_token_account
mint
amount
decimals
expires_at
display
```

Rules:

- `wallet` must equal the current debtor wallet for the request.
- The transaction uses the wallet as signer and fee payer unless a later fee-sponsorship ADR accepts a different policy.
- The transaction expires quickly, for example 2-5 minutes or sooner if blockhash expires.
- FundWise stores the transaction fingerprint and execution intent before returning the transaction.

### Confirm signature

```text
POST /api/mobile/settlement-executions/{executionIntentId}/confirm
```

Input:

```json
{
  "wallet": "debtor public key",
  "signature": "solana tx signature"
}
```

Behavior:

1. Load execution intent.
2. Fetch and verify transaction from Solana RPC.
3. Require sender, recipient, mint, amount, token program, and signer match the intent.
4. Record Settlement through the existing FundWise path.
5. Trigger or link Receipts processing.
6. Return `recorded`, `pending_receipt`, or `recovery_needed`.

If the chain transfer succeeded but recording fails, the user must see a recovery state, not a failed-payment state.

## Proposed Data Model

### mobile_settlement_sessions

```text
id
request_intent_id
execution_intent_id
wallet
chain
app_instance_id
status                  -- previewed, transaction_issued, wallet_opened, submitted, confirmed, recorded, recovery_needed, canceled, expired
last_signature
last_error_code
created_at
updated_at
expires_at
```

This object is operational mobile state. It is not a ledger entry.

### settlement_execution_intents

Reuse or extend the FundWise SADR-008 model:

```text
id
request_intent_id
group_id
from_wallet
to_wallet
amount
mint
decimals
debtor_account
transaction_fingerprint
blockhash
created_at
expires_at
status                  -- transaction_issued, submitted, recorded, expired, review_required
recorded_settlement_id
recorded_tx_sig
client_surface          -- blink, web, seeker_native
```

## FundWiseSeeker UX Rules

- Primary action label: `Settle USDC`.
- Always show alias plus shortened wallet for payer and recipient.
- Show `.skr` first when available, then `.sol`, then wallet.
- Show amount and token mint context before the wallet prompt.
- Show "FundWise verifies the transfer before receipt" in the transaction status surface, not as marketing copy.
- On wallet return, show one of:
  - `Submitted. Verifying receipt...`
  - `Confirmed on Solana. Receipt recovery in progress.`
  - `Not sent. You can retry or continue on web.`
  - `Transaction expired. Refresh settlement.`
- Store enough local state to resume confirmation after app restart.
- Always keep a web fallback button.

## Security And Privacy Requirements

- Never store private keys.
- Never accept mobile-supplied amount, recipient, mint, decimals, or Group state.
- Simulate or server-preflight the transaction before asking for wallet signing.
- Use short-lived execution intents and blockhash-aware expiry.
- Verify the submitted signature server-side before writing a Settlement.
- Require the signer to match the intended debtor wallet.
- Reject stale, duplicate, partial, wrong-mint, wrong-decimal, wrong-recipient, or wrong-amount transfers.
- Treat names as aliases only; wallet address remains canonical.
- Keep private Group names and Member names out of unauthenticated previews.
- Handle wallet cancellation, backgrounding, network loss, duplicate submissions, and app restart.
- Keep feature flag off for production until physical-device MWA testing passes.

## Implementation Sequence

### Phase 0 - Planning

- Add this SADR.
- Remove the stale "SADR needed" placeholder from the central index.
- Cross-link FundWise, Receipts, and FundWiseSeeker indexes.

### Phase 1 - Shared transaction builder contract

- Align FundWise SADR-008 execution intents with mobile needs.
- Add mobile-specific display metadata to the transaction build response.
- Decide `signAndSendTransactions` vs `signTransactions` as the production default.
- Add tests for transaction fingerprinting and expiry.

### Phase 2 - FundWise mobile endpoints

- Add preview endpoint.
- Add transaction build endpoint behind a feature flag.
- Add confirm endpoint that reuses existing Settlement verification.
- Add audit events for issued, submitted, recorded, expired, and recovery-needed states.

### Phase 3 - FundWiseSeeker native UX

- Add native settlement preflight for `/settle/r/{requestId}`.
- Show `.skr` / `.sol` aliases from SADR-003 without trusting them.
- Call MWA signing/sending.
- Persist execution intent and pending signature locally for recovery.

### Phase 4 - Receipts handoff

- Return receipt URL after FundWise records the Settlement.
- Open/share Receipt Graph link.
- Handle `pending_receipt` and recovery states.

### Phase 5 - Physical-device validation

- Test with a real MWA wallet on Android.
- Test app backgrounding, wallet cancellation, timeout, duplicate tap, offline return, stale blockhash, wrong wallet, and receipt recovery.
- Keep web fallback visible until production telemetry proves native settlement is reliable.

## Acceptance Criteria For A Future ADR

- FundWise can issue a short-lived mobile settlement execution intent.
- The transaction builder is shared with or equivalent to the Settlement Blink builder.
- FundWiseSeeker signs/sends through MWA on a physical Android device.
- The debtor wallet, recipient wallet, USDC mint, amount, decimals, and fee payer are shown before signing.
- FundWise records the Settlement only after on-chain verification.
- Receipts returns a receipt or recovery state from the submitted signature.
- Interrupted mobile flows can resume by execution intent or tx signature.
- Web fallback remains available for unsupported wallets, expired transactions, and recovery failures.

## Alternatives Considered

### Keep all money movement on web

Safe, but it leaves the Seeker app as a handoff shell. Native settlement is the mobile feature that makes Seeker worth installing after link recovery works.

### Build the transaction entirely in FundWiseSeeker first

Deferred. It duplicates settlement policy, amount calculation, and token instruction decisions. A later client-side builder can be accepted only if it consumes a signed FundWise execution intent and passes deterministic fingerprint checks.

### Use only Blinks inside the app

Rejected as the primary Seeker-native path. Blinks are excellent for shareable surfaces, but the app can provide better recovery, wallet state, `.skr` display, and receipt follow-through.

### Use Phantom-only deep links

Rejected for V1. MWA keeps the flow wallet-agnostic across compatible Android wallets.

### Record native Settlements locally

Rejected. FundWise remains the ledger and verification source of truth.

## Open Questions

- Should the app prefer wallet-side submit via `signAndSendTransactions` or dApp-side submit via `signTransactions` for better recovery?
- Should FundWise sponsor fees in the future, or should the debtor always be fee payer?
- How much transaction detail should be shown in compact mobile preflight without overwhelming users?
- Should mobile transaction endpoints be the same URLs as Action POST endpoints with a different client header?
- What Helius or RPC fallback should recover signatures when FundWise confirm is delayed?
- Should native settlement stay Seeker-only at first or ship to all Android users with MWA wallets?

## Sources

- FundWiseSeeker README: `FundWiseSeeker/README.md`
- FundWiseSeeker progress: `FundWiseSeeker/docs/progress.md`
- FundWiseSeeker handoff SADR: [SADR-001](./SADR-001-seeker-native-settlement-handoff.md)
- Readable wallet names SADR: [SADR-003](./SADR-003-readable-wallet-names-skr-sol-phantom.md)
- FundWise Settlement Blinks SADR: [FundWise SADR-008](../../../FundWise/plans/SADR/SADR-008-settlement-blinks.md)
- Receipts Receipt Graph SADR: [Receipts SADR-001](../../../Receipts/plans/SADR/SADR-001-receipt-graph.md)
- Solana Mobile MWA overview: https://docs.solanamobile.com/developers/mobile-wallet-adapter
- Solana Mobile React Native setup: https://docs.solanamobile.com/get-started/react-native/setup
- Solana Mobile direct MWA sessions: https://docs.solanamobile.com/get-started/react-native/invoke-mwa-sessions-directly
- MWA 2.0 specification: https://solana-mobile.github.io/mobile-wallet-adapter/spec/spec.html
- Solana Actions and Blinks guide: https://solana.com/developers/guides/advanced/actions
- Solana transaction docs: https://solana.com/docs/core/transactions
- Solana token transfer docs: https://solana.com/docs/tokens/basics/transfer-tokens
