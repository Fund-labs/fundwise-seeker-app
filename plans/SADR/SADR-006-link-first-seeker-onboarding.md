# SADR-006: Link-First Seeker Onboarding and Settlement Preview Flow

**Status:** Suggested / research-backed, partially implemented
**Date:** 2026-05-25
**Owner:** FundWiseSeeker / FundWise
**Related:** [SADR-001](./SADR-001-seeker-native-settlement-handoff.md), [SADR-004](./SADR-004-native-settlement-transaction-construction.md), [SADR-005](./SADR-005-native-settlement-recovery-inbox.md), [FundWise SADR-008](../../../FundWise/plans/SADR/SADR-008-settlement-blinks.md)

## Summary

FundWiseSeeker should optimize first-run UX around the user's actual job:

```text
Open link -> Preview safely -> Connect wallet when needed -> Continue on FundWise -> Receipt/recovery
```

The native app should not behave like a smaller fake dashboard before it has protected live reads. Its strongest production role is Seeker-native recovery, wallet handoff, preview, and receipt confidence.

## Why This Exists

User research and product benchmarks point to the same pattern:

- mobile money apps reduce uncertainty before asking for commitment;
- wallet prompts create anxiety unless the app explains what will happen first;
- setup should be delayed until it clearly unlocks the user's current goal;
- error states must offer recovery, not dead ends;
- receipt/activity trails are the trust layer after a money action.

For Seeker, the highest-risk trust break is asking for wallet authorization before the user understands which group, amount, counterparty, token, and state they are approving.

## Decision

FundWiseSeeker should adopt a link-first flow:

1. If opened from `/settle/r/{requestId}`, show the Settlement Request as the primary surface.
2. If no wallet is connected, explain that connection only verifies the viewer wallet and cannot move funds.
3. After wallet authorization, fetch the FundWise redacted preview API and show amount, role, status, expiry, and fallback route.
4. Use one primary action per state:
   - `Connect wallet`
   - `Continue on FundWise`
   - `Switch wallet`
   - `Retry preview`
5. Keep native settlement execution disabled until FW-094/FW-095 expose signed transaction intents and confirm/recovery APIs.
6. Persist first-run onboarding completion. Returning users should land on Home/recovery, not the boot tour.
7. Provide a profile action to replay the intro for education.

## Redesigned Flow

### Cold install without a link

```text
Boot -> Welcome -> Optional tour -> Connect wallet -> Home/recovery
```

The tour remains available but should not teach every feature. It should only explain:

- Split: who owes who;
- Fund: pooled vaults require votes;
- Settle: final receipt on Solana.

### Open from Settlement Request Link

```text
Home/recovery -> Settlement preview card
```

No generic onboarding should block the request. The preview card should show:

- status badge;
- amount and token if FundWise can safely reveal it;
- `you pay` / `you receive` role;
- expiry;
- connected wallet short address;
- safe next action.

### Wallet Handoff

```text
Tap Connect -> Auth screen -> Tap Connect wallet -> MWA opens -> Wallet approves -> Return -> Refresh preview
```

The app should not auto-open MWA. Every wallet prompt must follow an explicit user tap.

### Future Native Settlement

```text
Preview -> Review transaction -> MWA sign/send -> Submitted -> Confirming -> Receipt pending -> Receipt ready
```

This waits for FundWise intent and recovery APIs. Until then, the native app should continue on FundWise web/PWA for payment execution.

## UX Rules

- Put concrete trust copy beside the CTA: "FundWise cannot move funds when connecting."
- Do not show sample balances as live production state.
- Prefer skeleton cards over spinners for preview loading.
- Treat cancellation as a normal state, not a scary error.
- Wrong-wallet state should offer `Switch wallet`.
- Expired/not-member/not-settleable states should offer FundWise fallback.
- Advanced details such as mint, request ID, and signatures belong behind secondary disclosure.

## Implementation Plan

### P0

- Persist onboarding completion in AsyncStorage.
- Stop auto-launching MWA from the auth screen.
- Promote recovered Settlement Request links into a larger preview card.
- Use FundWise preview fallback URL for handoff.
- Add clear copy for wallet-needed, wrong-wallet, expired, not-member, not-settleable, loading, and error states.

### P1

- Add wallet handoff state machine with app foreground refresh.
- Add receipt detail/recovery sheet.
- Add global offline strip and per-action retry.
- Gate or label demo financial data until protected reads exist.

### P2

- Load production brand fonts.
- Animate sheets with reduced-motion support.
- Add copy/clipboard confirmation.
- Replace prototype-static forms with controlled, validated forms.

## Needs From FundWise

- Protected group summary read contract.
- Wallet balance/activity summary.
- Receipt detail read contract for `/receipts/{id}`.
- Settlement recovery status API.
- Feature flags for native-disabled actions.
