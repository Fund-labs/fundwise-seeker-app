# SADR-005: Native Settlement Recovery Inbox

**Status:** Suggested / research-backed, not accepted
**Date:** 2026-05-25
**Owner:** FundWiseSeeker / FundWise / Receipts
**Related:** [SADR-001](./SADR-001-seeker-native-settlement-handoff.md), [SADR-004](./SADR-004-native-settlement-transaction-construction.md), [FundWise SADR-008](../../../FundWise/plans/SADR/SADR-008-settlement-blinks.md), [FundWise SADR-010](../../../FundWise/plans/SADR/SADR-010-actionable-settlement-nudges.md), [Receipts SADR-001](../../../Receipts/plans/SADR/SADR-001-receipt-graph.md)

## Summary

FundWiseSeeker should explore a **Native Settlement Recovery Inbox**: a durable mobile surface for settlement attempts that were started on Seeker but are not yet cleanly recorded, receipted, or dismissed.

This is required for SADR-004. Native Tap-to-Settle is not production-grade if the happy path works but these cases are confusing:

```text
wallet signed -> app backgrounded -> network drops -> FundWise not notified
wallet submitted -> Solana confirmed -> Receipt not ready
transaction issued -> blockhash expired -> user needs a clean retry
wallet canceled -> user needs continue-on-web fallback
```

The Recovery Inbox makes every native settlement attempt auditable, resumable, and explainable without turning FundWiseSeeker into a ledger.

## Why This Exists

Mobile settlement has more failure surfaces than web settlement:

- the app can be backgrounded during the wallet round trip;
- the wallet can submit a transaction while the dApp misses the callback;
- the device can lose network after signing;
- the execution intent can expire while the wallet is open;
- FundWise can verify the transfer before Receipts has finished indexing;
- users may tap the same settlement link again from Telegram, Dialect, QR, or browser.

The recovery product is:

```text
Pending -> Check status -> Confirm / recover / retry / open receipt / continue on web
```

The inbox should be boring, explicit, and trustworthy. It should reduce support load and prevent double-payment confusion.

## Research Notes

### Solana signatures can be recovered independently of the app callback

Solana RPC exposes signature status lookup through `getSignatureStatuses`. A client or server can query whether a transaction signature has processed, confirmed, finalized, or failed. Solana transaction docs also describe signatures and transaction atomicity.

Relevant sources:

- Solana `getSignatureStatuses`: https://solana.com/docs/rpc/http/getsignaturestatuses
- Solana transaction docs: https://solana.com/docs/core/transactions

Implication:

- A lost mobile callback is recoverable if FundWiseSeeker has the signature or execution intent.
- FundWise should own canonical recovery because it can verify the transaction against the execution intent and ledger.
- The app should show status from FundWise first, not from client-side RPC guesses.

### Mobile app lifecycle must be first-class

React Native documents `AppState` for tracking whether an app is active, backgrounded, or inactive. This matters because MWA wallet flows involve app switching and can return after an unknown delay.

Relevant source:

- React Native AppState: https://reactnative.dev/docs/appstate

Implication:

- FundWiseSeeker should recheck pending settlement sessions on foreground.
- Background/foreground transitions are expected behavior, not edge cases.
- Recovery UI should be fed by persisted state plus fresh server checks.

### Local persistence is needed but not authoritative

The FundWiseSeeker app already uses AsyncStorage for onboarding and incoming-link recovery. AsyncStorage is suitable for non-secret local persistence, such as pending execution intent IDs and last-known status.

Relevant source:

- Expo AsyncStorage: https://docs.expo.dev/versions/latest/sdk/async-storage/

Implication:

- Store no private keys, secrets, or trusted ledger state.
- Store recovery pointers: request ID, execution intent ID, signature, status, timestamps, and fallback URL.
- Treat local inbox rows as hints that must refresh from FundWise.

### Receipts must support delayed proof states

Receipts SADR-001 already defines Receipt Graph as the proof layer. Native settlement recovery needs receipt states that separate on-chain confirmation from receipt availability.

Relevant source:

- Receipts SADR-001: [Receipt Graph](../../../Receipts/plans/SADR/SADR-001-receipt-graph.md)

Implication:

- The user can be told "confirmed, receipt pending" only after FundWise verification.
- Receipt recovery should produce a stable Receipt URL when indexing catches up.
- Public receipt links must remain privacy-safe.

## Decision

FundWiseSeeker should propose a Recovery Inbox before native settlement is considered production-ready.

Proposed V1:

1. Persist every native settlement attempt locally as a recovery session.
2. FundWise stores server-side execution intent and recovery status.
3. FundWiseSeeker rechecks pending sessions on app launch, foreground, link open, and manual refresh.
4. FundWise remains the canonical recovery API.
5. Solana RPC status is used by FundWise for verification and recovery, not as a mobile-only truth source.
6. Receipts exposes pending, ready, and recovery-needed receipt states after FundWise verification.
7. The inbox always offers one safe next action: refresh, retry, open receipt, continue on web, or contact support/export evidence.

Rejected-for-now V1:

- recording settlement state only in local mobile storage;
- asking the user to manually paste signatures as the normal recovery path;
- showing "failed" when the transfer may have succeeded on-chain;
- hiding ambiguous states;
- auto-retrying a payment without user confirmation;
- creating a second receipt in FundWiseSeeker.

## Recovery States

| State | Meaning | User action |
| --- | --- | --- |
| `draft` | Link opened, no transaction requested | Refresh or continue on web |
| `intent_issued` | FundWise issued an execution intent and transaction | Sign, refresh, or discard |
| `wallet_opened` | App handed transaction to wallet | Wait, refresh after return |
| `signature_returned` | Wallet returned a signature, not yet verified | Verify now |
| `submitted_unknown` | App may have missed wallet callback | Check status or continue on web |
| `confirmed_unrecorded` | Chain transfer appears confirmed but FundWise has not recorded it | Recover with FundWise |
| `recorded_receipt_pending` | FundWise recorded Settlement, receipt not ready | Wait or refresh receipt |
| `receipt_ready` | Receipt URL is available | Open/share receipt |
| `expired` | Execution intent or blockhash expired before valid payment | Refresh settlement |
| `canceled` | Wallet canceled or user backed out | Retry or continue on web |
| `failed` | Verified failure with no transfer | Retry or continue on web |
| `review_required` | Ambiguous or conflicting evidence | Show evidence and support path |

## Proposed Data Model

### Local recovery session

Stored in FundWiseSeeker AsyncStorage or a future local database:

```text
id
request_id
execution_intent_id
group_id
from_wallet
to_wallet
display_from_alias
display_to_alias
amount
mint
signature
status
fallback_url
receipt_url
last_checked_at
created_at
updated_at
expires_at
```

Rules:

- Local state is a recovery pointer only.
- Local amount and aliases are display snapshots, not settlement truth.
- Sessions should age out after a retention window unless `review_required`.

### Server recovery state

FundWise should expose recovery status over execution intents:

```text
id
request_intent_id
execution_intent_id
wallet
signature
chain_status             -- unknown, processed, confirmed, finalized, failed, not_found
fundwise_status          -- issued, submitted, verified, recorded, duplicate, review_required, expired
receipt_status           -- not_requested, pending, ready, failed
receipt_url
recovery_reason
next_action              -- refresh, retry, open_receipt, continue_web, support
updated_at
```

## Proposed API Shape

### List active recovery items

```text
GET /api/mobile/settlement-recovery?wallet={wallet}
```

Returns current server-known pending or recent recovery items for the wallet.

### Check one recovery item

```text
GET /api/mobile/settlement-recovery/{executionIntentId}
```

Returns:

```text
execution_intent_id
request_id
wallet
signature
chain_status
fundwise_status
receipt_status
receipt_url
next_action
display
updated_at
```

### Attach a signature

```text
POST /api/mobile/settlement-recovery/{executionIntentId}/signature
```

Input:

```json
{
  "wallet": "debtor public key",
  "signature": "solana tx signature"
}
```

Behavior:

1. Require the wallet matches the execution intent.
2. Verify the signature on-chain.
3. If valid, record or recover the Settlement through the existing FundWise path.
4. Trigger receipt generation or indexing.
5. Return the latest recovery state.

### Retry after expiry

```text
POST /api/mobile/settlement-recovery/{executionIntentId}/retry
```

Behavior:

- Only allowed when no successful matching transfer exists.
- Creates a new execution intent from the current live FundWise amount.
- Requires fresh user confirmation and wallet signing.

## FundWiseSeeker UX

### Inbox entry points

- Home screen pending banner.
- Settlement screen recovery card.
- Receipt screen pending state.
- Link-open detection when the same request is tapped again.
- Manual "Settlement history" / "Pending" panel.

### Inbox row copy

Examples:

```text
Ana.skr
12.50 USDC
Submitted. Verifying receipt...
```

```text
Ana.skr
12.50 USDC
Confirmed on Solana. Receipt recovery in progress.
```

```text
Ana.skr
12.50 USDC
Transaction expired. Refresh settlement before paying.
```

### UX rules

- Never encourage a second payment while a prior attempt is ambiguous.
- Always show amount, token, and shortened wallets in recovery details.
- Show receipt URL only after FundWise or Receipts says it is ready.
- Do not expose private Group or Member names in unauthenticated recovery surfaces.
- Provide a "continue on web" fallback for every unsettled item.
- Provide support/export evidence for `review_required`: request ID, execution intent ID, signature, timestamps.

## Security And Privacy Requirements

- Local recovery state is untrusted and must refresh from FundWise.
- Do not store private keys, wallet auth tokens, or secrets.
- Never auto-submit a new transaction from an inbox action.
- Recovery retry must create a new execution intent and require user confirmation.
- Signature attachment must verify signer, amount, recipient, mint, decimals, and execution intent.
- Dedupe repeated signatures and repeated confirm calls.
- Treat on-chain metadata and logs as untrusted input.
- Public receipt recovery must not leak Group name, Member names, aliases, or Seeker status.

## Implementation Sequence

### Phase 0 - Planning

- Add this SADR.
- Cross-link SADR-004 and product indexes.
- Keep native settlement marked incomplete without recovery.

### Phase 1 - Local recovery store

- Define local recovery session shape.
- Persist session before opening wallet.
- Update session on wallet return, app foreground, app restart, and link reopen.
- Add retention and manual clear rules.

### Phase 2 - FundWise recovery API

- Add execution-intent recovery read endpoint.
- Add signature attach/recover endpoint.
- Add retry endpoint with duplicate-payment guard.
- Emit audit events for recovery transitions.

### Phase 3 - Inbox UI

- Add pending banner and inbox list.
- Add detail view with safe next actions.
- Add web fallback and support/export evidence.

### Phase 4 - Receipts recovery

- Add receipt pending/ready/recovery-needed response mapping.
- Open/share Receipt Graph when ready.
- Keep receipt privacy defaults from Receipts SADR-001.

### Phase 5 - Validation

- Test app backgrounding during MWA.
- Test wallet cancellation.
- Test lost network after signature.
- Test callback missed but signature later recovered.
- Test Solana confirmed but FundWise record delayed.
- Test Receipt pending and later ready.
- Test duplicate tap and expired execution intent.

## Acceptance Criteria For A Future ADR

- Every native settlement attempt creates a local recovery session before wallet handoff.
- FundWise exposes canonical recovery status by execution intent.
- FundWise can recover a valid submitted signature after the app misses the callback.
- The app rechecks pending sessions on foreground and launch.
- Ambiguous states block duplicate payment prompts.
- Receipt pending and receipt ready states are distinct.
- Users can retry only after FundWise proves no matching transfer succeeded.
- Recovery evidence can be exported for support without leaking private Group context.

## Alternatives Considered

### Rely on wallet history

Rejected. Wallet history can show a transfer but cannot prove it matches a FundWise execution intent, live amount, Group membership, or receipt policy.

### Rely on web fallback only

Rejected. Web fallback is necessary, but native settlement needs native recovery because the user may never reach web after signing.

### Ask users to paste signatures

Rejected as the normal path. It can remain a support fallback, but the app should persist and recover signatures automatically where possible.

### Treat timeout as failed

Rejected. A timeout can happen after a wallet submits a transaction. The correct state is ambiguous until FundWise checks the signature or execution intent.

## Open Questions

- Should recovery sessions sync across devices, or stay local plus server-wallet-scoped?
- How long should completed and expired recovery rows remain visible?
- Should Receipts expose a polling endpoint optimized for pending receipt states?
- Should Helius Enhanced Transactions or webhooks be added as a recovery accelerator?
- What support evidence is safe to export from private Groups?
- Should recovery inbox include web-originated Blinks, or only Seeker-native attempts?

## Sources

- FundWiseSeeker native settlement SADR: [SADR-004](./SADR-004-native-settlement-transaction-construction.md)
- FundWiseSeeker handoff SADR: [SADR-001](./SADR-001-seeker-native-settlement-handoff.md)
- FundWise Settlement Blinks SADR: [FundWise SADR-008](../../../FundWise/plans/SADR/SADR-008-settlement-blinks.md)
- Receipts Receipt Graph SADR: [Receipts SADR-001](../../../Receipts/plans/SADR/SADR-001-receipt-graph.md)
- Solana `getSignatureStatuses`: https://solana.com/docs/rpc/http/getsignaturestatuses
- Solana transaction docs: https://solana.com/docs/core/transactions
- React Native AppState: https://reactnative.dev/docs/appstate
- Expo AsyncStorage: https://docs.expo.dev/versions/latest/sdk/async-storage/
