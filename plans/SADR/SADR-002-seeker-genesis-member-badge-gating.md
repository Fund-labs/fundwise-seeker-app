# SADR-002: Seeker Genesis Member Badge Gating

**Status:** Suggested / research-backed, not accepted
**Date:** 2026-05-25
**Owner:** FundWiseSeeker / FundWise
**Related:** [SADR-001](./SADR-001-seeker-native-settlement-handoff.md), [SADR-003](./SADR-003-readable-wallet-names-skr-sol-phantom.md), [FundWise SADR-007](../../../FundWise/plans/SADR/SADR-007-dynamic-creator-badge.md), [FundWise SADR-010](../../../FundWise/plans/SADR/SADR-010-actionable-settlement-nudges.md), [Receipts SADR-001](../../../Receipts/plans/SADR/SADR-001-receipt-graph.md)

## Summary

FundWiseSeeker should explore **Seeker Genesis Member Badge Gating**: a server-verified Seeker ownership proof that can unlock non-custodial product treatment such as early access, Seeker-specific onboarding, badge eligibility, and optional future perks.

The core rule:

```text
Platform device signal = UX hint
SIWS + Seeker Genesis Token ownership = verified Seeker claim
FundWise ledger and policy = actual entitlement source
```

This feature must not let a Seeker device or Seeker Genesis Token bypass wallet auth, Group membership, Settlement verification, Receipt verification, sanctions/risk policy, or any money movement guardrail.

## Why This Exists

FundWise has a natural Solana Mobile wedge:

- Tap-to-Settle works best on a crypto-native Android device.
- Seeker users are likely to understand wallet signing, dApp Store discovery, and MWA.
- Seeker Genesis Token gives FundWise a one-device proof surface for early access and anti-sybil experiments.
- Dynamic Creator Badge can later project a public-safe "Seeker founder/member" state after proof gates.

The product opportunity is not "token-gate the whole app." It is:

```text
Seeker owner verifies -> gets better mobile onboarding / beta access / badge eligibility -> uses Tap-to-Settle -> Receipt Graph proves real activity
```

## Current State

Current FundWiseSeeker already has:

- Mobile Wallet Adapter integration.
- Direct MWA authorization and message-signing proof path.
- Lightweight Seeker device detection from React Native Platform constants.
- Documentation saying the device signal is spoofable and SGT-backed verification is future work.

Current gap:

- No backend SIWS verification route.
- No Seeker Genesis Token ownership check.
- No stored Seeker verification claim.
- No entitlement model for early access, fee experiments, badge eligibility, or Seeker-specific UX.
- No Dynamic Creator Badge linkage.

## Research Notes

### Seeker Genesis Token is the secure ownership signal

Solana Mobile documents Seeker Genesis Token as a unique NFT representing verified ownership of a Seeker device. It can be minted once per device into the primary account in the user's Seed Vault Wallet.

Relevant source:

- Seeker Genesis Token docs: https://docs.solanamobile.com/marketing/engaging-seeker-users

The docs also note that SGT implements Token Extensions / Token-2022 and includes Metadata Pointer plus Token Group Member/Pointer extensions. Verification examples check Token-2022 accounts, mint authority, metadata pointer, and group membership.

### SGT can move between a user's wallet accounts

Solana Mobile documents that SGT transferability is permissioned within Seed Vault Wallet when a user changes primary account, and the mint address stays the same when transferred.

Implication:

- FundWise should track the SGT mint address, not just the current wallet.
- One-time claims must check whether the SGT mint has already claimed the benefit.
- Wallet-level verification can expire and be refreshed if the user changes primary account.

### Anti-sybil claims require three checks

Solana Mobile's anti-sybil example says a claim should check:

1. connected wallet owns an SGT;
2. user proves wallet ownership by signing;
3. the SGT mint has not already been used for the claim.

Implication:

- FundWise should not grant one-time perks from wallet ownership alone.
- Server-side records must store the SGT mint used for the claim.
- The verification flow should use SIWS or equivalent wallet signing, then server-side SGT verification.

### Platform constants are only a UI signal

Solana Mobile's "Detecting Seeker Users" docs warn that React Native Platform constants can be spoofed and should not be used where guaranteed Seeker ownership is required. The same docs recommend SIWS plus SGT verification for secure checks.

Relevant source:

- Detecting Seeker Users: https://docs.solanamobile.com/recipes/general/detecting-seeker-users

Implication:

- Keep `Platform.constants.Model === "Seeker"` for UI treatment only.
- Do not use it for access control, rewards, discounts, badges, or private data.

### Seeker has the right native context

Solana Mobile documents Seeker as a crypto-native Android device with Seed Vault, dApp Store, Seeker Genesis Token, and `.skr` domain support. The docs recommend starting with Mobile Wallet Adapter and publishing to the dApp Store to reach Seeker users.

Relevant source:

- Seeker docs: https://docs.solanamobile.com/solana-mobile-stack/seeker

## Decision

FundWiseSeeker should add a server-verified Seeker ownership track, but FundWise should own final entitlements.

The first accepted product use should be narrow:

1. **Seeker Verified Member** status inside FundWise/FundWiseSeeker.
2. **Seeker beta access** to Tap-to-Settle and mobile-first experiments.
3. **Dynamic Creator Badge eligibility signal**, public only if the user opts in.
4. **Receipt Graph proof enrichment**, private/redacted unless explicitly public.

Do not use Seeker verification for:

- automatic Group access;
- bypassing beta gates for non-Seeker users who already earned access;
- bypassing paid features without a separate pricing/legal decision;
- Settlement, Contribution, Proposal, or Treasury authority;
- public financial score or public reliability ranking.

## Verification Flow

### 1. Client requests challenge

```text
POST /api/seeker/verification/challenge
```

Returns a nonce and SIWS payload metadata scoped to `fundwise.fun`.

### 2. Client signs with MWA / SIWS

FundWiseSeeker uses Mobile Wallet Adapter to request a sign-in payload signature from the connected wallet.

### 3. Server verifies wallet ownership

Server verifies:

- SIWS payload domain and URI match FundWise.
- Nonce is valid, unexpired, and unused.
- Signature matches the connected wallet.

### 4. Server verifies SGT ownership

Server checks Token-2022 accounts for the wallet and verifies candidate SGT mint accounts against the Solana Mobile SGT constants:

```text
mint_authority = GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4
metadata_address = GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te
group_address = GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te
token_program = Token-2022
```

Production can use Helius `getTokenAccountsByOwnerV2` with pagination, as recommended in the Solana Mobile docs. A standard RPC fallback can exist for local/devnet-like testing, but production verification should use the robust path.

### 5. Server stores verified claim

The server stores:

- wallet address;
- SGT mint address;
- verification method;
- SIWS nonce hash;
- verification timestamp;
- expiration timestamp;
- current entitlement projection.

## Product Surfaces

### FundWiseSeeker

- Show "Seeker verified" after server verification.
- Prefer Seeker-specific Tap-to-Settle onboarding.
- Offer a "Refresh Seeker status" action when the primary wallet changes.
- Keep unverified Seeker device UI separate from verified SGT state.

### FundWise web

- Use verified Seeker status for beta-access treatment only after explicit policy.
- Show a private "Seeker verified" chip in account/profile settings.
- Do not show Seeker status on public invite previews.
- Do not reveal another Member's Seeker status in a Group unless the display mode is accepted.

### Dynamic Creator Badge

Integrate with [FundWise SADR-007](../../../FundWise/plans/SADR/SADR-007-dynamic-creator-badge.md) as a private eligibility input:

```text
seeker_verified = true
seeker_claim_epoch = 2026-05
```

Public badge metadata should not include SGT mint, wallet history, exact claim timing, or device identity unless the user explicitly opts into a public "Seeker founder/member" marker.

### Receipts / Receipt Graph

Receipt Graph may use verified Seeker status as private context:

```text
source_context.seeker_verified_at = timestamp
```

Public receipt output should not expose Seeker status by default. If used, it should be a redacted proof badge such as:

```text
mobile_verified_context = true
```

not the SGT mint or device identity.

## Proposed Data Model

### seeker_verification_challenges

```text
id
wallet
domain
uri
nonce_hash
issued_at
expires_at
used_at
status              -- issued, used, expired, rejected
```

### seeker_verification_claims

```text
id
wallet
sgt_mint
verification_method -- siws_sgt
verified_at
expires_at
revoked_at
status              -- active, expired, revoked, review_required
source_rpc
proof_hash
last_refresh_at
```

Unique:

- active claim by `wallet`;
- active claim by `sgt_mint` for one-time benefits.

### seeker_entitlements

```text
id
wallet
sgt_mint
entitlement_type    -- seeker_verified_member, tap_to_settle_beta, badge_eligible, receipt_pack_beta
source_claim_id
status              -- active, expired, revoked
starts_at
expires_at
metadata_json
```

### seeker_claim_usage

Tracks one-time anti-sybil usage by SGT mint.

```text
id
sgt_mint
claim_type          -- founder_badge, beta_invite, fee_credit, receipt_pack
claimed_by_wallet
claimed_at
source_claim_id
```

## Entitlement Rules

V1 entitlement rules:

- `seeker_verified_member`: active while wallet owns and verifies SGT.
- `tap_to_settle_beta`: active if SGT verified and the beta is open.
- `badge_eligible`: active only after Split Mode proof gate and user opt-in.
- `receipt_pack_beta`: research-only; do not ship without pricing/privacy review.

Rules:

- Core FundWise access still depends on wallet auth, beta access, and Group membership.
- SGT verification can add entitlements, not replace existing requirements.
- If SGT transfers to a new primary wallet, the new wallet must verify again.
- One-time benefits are bound to the SGT mint, not to the wallet.
- Revocation must be possible without public accusations.

## Security And Privacy Requirements

- Never trust React Native Platform constants for gating.
- Require SIWS or equivalent signature proof before checking SGT ownership.
- Verify SGT server-side, not in the mobile app.
- Store SGT mint as sensitive product data; do not expose it in public APIs.
- Do not put SGT mint, device identity, or Seeker status into public receipts by default.
- Do not let SGT bypass Group membership, Settlement verification, rate limits, or risk checks.
- Do not market fee credits, rewards, or cashback without legal/product review.
- Reverify claims periodically and on wallet change.
- Keep Helius/RPC keys server-side only.

## Implementation Sequence

### Phase 0 - Planning

- Add this SADR.
- Cross-link with Seeker handoff, Dynamic Creator Badge, Tap-to-Settle Reminders, and Receipt Graph.

### Phase 1 - Server verification spike

- Add SIWS challenge route.
- Add SIWS verification route.
- Add server-side SGT verification using Token-2022 account/mint checks.
- Store `seeker_verification_claims`.

### Phase 2 - Seeker app status

- Add "Verify Seeker ownership" in FundWiseSeeker.
- Show verified/unverified states.
- Add refresh/expire behavior.

### Phase 3 - Entitlement projection

- Add `seeker_entitlements`.
- Gate only safe beta UX: Tap-to-Settle beta, mobile experiments, optional private chip.
- Keep web fallback for non-Seeker users.

### Phase 4 - Badge linkage

- Feed verified Seeker status into Dynamic Creator Badge eligibility.
- Require user opt-in before public badge metadata includes any Seeker marker.

### Phase 5 - Receipt/pack experiments

- Consider Receipt Graph / receipt-pack beta features only after pricing and privacy review.

## Acceptance Criteria For A Future ADR

- Platform constants are documented as UI-only.
- SIWS verification is implemented server-side.
- SGT ownership verification checks Token-2022, mint authority, metadata pointer, and group membership.
- SGT mint is stored for anti-sybil one-time claim prevention.
- Core FundWise auth, Group access, and money movement do not depend on SGT.
- A verified Seeker wallet can receive a non-critical beta entitlement.
- Public badge/receipt metadata does not leak SGT mint or device identity.
- Revocation and refresh flows are defined.

## Alternatives Considered

### Use Platform constants only

Rejected. This is useful for UI, but spoofable and not acceptable for entitlements, badges, or claims.

### Gate all FundWise access behind SGT

Rejected. FundWise should not become Seeker-only. Seeker is a wedge, not the whole market.

### Make the Dynamic Creator Badge depend directly on SGT ownership

Rejected. The badge should reflect verified FundWise activity first. SGT can be a secondary eligibility or cohort signal.

### Put SGT mint in public badge metadata

Rejected. It creates unnecessary device/wallet linkability. Public metadata should be bucketed and opt-in.

## Open Questions

- Should `tap_to_settle_beta` require SGT verification, or should SGT only boost onboarding priority?
- Should Seeker verified status be visible to other Group Members?
- How often should SGT claims expire and require refresh?
- Should one-time benefits be one per SGT mint forever, or per season?
- Should `.skr` resolution be part of the same profile surface or a separate SADR?
- Which RPC provider should be canonical for production SGT verification?

## Sources

- FundWiseSeeker Settlement handoff: [SADR-001](./SADR-001-seeker-native-settlement-handoff.md)
- FundWise Dynamic Creator Badge: [FundWise SADR-007](../../../FundWise/plans/SADR/SADR-007-dynamic-creator-badge.md)
- FundWise Tap-to-Settle Reminders: [FundWise SADR-010](../../../FundWise/plans/SADR/SADR-010-actionable-settlement-nudges.md)
- Receipt Graph: [Receipts SADR-001](../../../Receipts/plans/SADR/SADR-001-receipt-graph.md)
- Seeker Genesis Token docs: https://docs.solanamobile.com/marketing/engaging-seeker-users
- Detecting Seeker Users: https://docs.solanamobile.com/recipes/general/detecting-seeker-users
- Seeker docs: https://docs.solanamobile.com/solana-mobile-stack/seeker
