# SADR-003: Readable Wallet Names With .skr First, SNS Second, And Phantom Handles

**Status:** Suggested / research-backed, not accepted
**Date:** 2026-05-25
**Owner:** FundWiseSeeker / FundWise
**Related:** [SADR-001](./SADR-001-seeker-native-settlement-handoff.md), [SADR-002](./SADR-002-seeker-genesis-member-badge-gating.md), [SADR-004](./SADR-004-native-settlement-transaction-construction.md), [FundWise SADR-008](../../../FundWise/plans/SADR/SADR-008-settlement-blinks.md), [FundWise SADR-010](../../../FundWise/plans/SADR/SADR-010-actionable-settlement-nudges.md)

## Summary

FundWiseSeeker should explore **Readable Wallet Names** with a Seeker-first rollout: resolve and display `.skr` names first, add SNS / `.sol` second, and keep user-verified Phantom `@` handles as later display/contact hints until there is a supported third-party resolver.

The boundary:

```text
name = display and lookup hint
wallet signature + FundWise membership = authority
verified Settlement tx = payment truth
```

Names must never replace wallet signatures, Group membership checks, Settlement verification, or Receipt Graph proof.

## Why This Exists

Raw addresses are hostile UX in a group finance app. Names make the stack feel human:

```text
ana.skr / ana.sol / @ana -> Group Member -> Tap-to-Settle -> Receipt
```

Readable names help:

- FundWise show safer Member labels.
- Fundy write better Telegram prompts.
- Seeker recover mobile flows without making users compare base58 strings.
- Receipts render cleaner human views while preserving raw wallet proof.

The risk is mispayment. A name resolver can be stale, spoofed, unavailable, or not globally resolvable. FundWise must resolve names conservatively and force wallet confirmation before any payment.

## Research Notes

### `.skr` is Seeker-native and should be first-class on mobile

Solana Mobile documents `.skr` domains as Seeker-native, human-readable names that map to Solana wallet addresses. Every Seeker owner receives a `.skr` domain, and Solana Mobile says `.skr` is built on AllDomains with forward and reverse resolution.

Relevant source:

- Solana Mobile `.skr` domains: https://docs.solanamobile.com/solana-mobile-stack/skr-domain

Implication:

- `.skr` is a natural FundWiseSeeker display and lookup surface.
- `.skr` is the first implementation priority because this SADR is Seeker-led.
- `.skr` should pair with Seeker Genesis verification, but it must not require SGT for general display.
- The resolver should be server-side or through a vetted SDK/API boundary, not arbitrary client trust.

### `.sol` via Solana Name Service is the broad Solana default

Solana Name Service documents `.sol` domain names and provides developer SDKs for resolving names and reverse lookups. SNS supports resolving wallet records and reverse resolving a wallet's favorite domain.

Relevant sources:

- SNS docs: https://docs.sns.id
- SNS SDK resolve docs: https://docs.sns.id/dev/sns-sdk/editor
- SNS JS SDK: https://www.npmjs.com/package/@bonfida/sns-sdk

Implication:

- `.sol` should follow `.skr` as the broad Solana compatibility layer.
- `.sol` is broader than Seeker and useful on web, Fundy, and receipts.
- Use `.sol` as a lookup hint; still show and verify the resulting wallet before settlement.

### Phantom `@` usernames are useful but not a public authority yet

Phantom supports usernames as wallet identity inside Phantom. Phantom docs and support materials describe usernames as a way to identify and send to people in Phantom, but the public developer docs currently do not show a stable public resolver API that third-party apps should rely on for `@handle -> wallet` resolution.

Relevant sources:

- Phantom docs: https://docs.phantom.com
- Phantom username support: https://help.phantom.com/hc/en-us/articles/33478025712531-About-Phantom-usernames-and-public-addresses

Implication:

- Phantom `@` handles should be user-verified display/contact metadata in V1.
- Do not let users settle to a typed Phantom `@handle` unless Phantom exposes a supported resolver or the handle is linked to a wallet by a signed user action.
- A user can claim "my Phantom handle is @ana" only as profile metadata until FundWise verifies a wallet binding.

## Decision

FundWiseSeeker should support a **multi-source wallet name layer** with strict trust levels.

V1 accepted:

1. Resolve `.skr` names through the Seeker / AllDomains-supported path once the resolver source is chosen.
2. Resolve `.sol` names through SNS.
3. Reverse-resolve `.skr` / `.sol` for display when available.
4. Store user-verified Phantom `@` handles as display/contact hints.
5. Always store and act on canonical wallet addresses.
6. Always show the resolved wallet before settlement.

V1 rejected:

- using Phantom `@` handles as payment destinations without official resolver support;
- hiding raw wallet confirmation on money movement;
- treating any name as proof of Group membership;
- letting names authorize Fundy actions;
- putting name records into public Receipt Graph output by default.

## Trust Levels

| Level | Source | Allowed use |
| --- | --- | --- |
| `verified_wallet` | Wallet signed in and linked in FundWise | Authority for membership, action, Settlement, and receipt context |
| `resolver_verified` | `.skr`/`.sol` resolved through accepted resolver | Lookup/display hint; must map to wallet and be confirmed |
| `reverse_resolved` | Wallet reverse resolves to a name | Display hint; can be stale or preference-based |
| `user_attested` | User entered Phantom `@handle` or display name while signed in | Profile/contact hint only |
| `unverified_text` | Free-form chat/input text | Never payment authority |

## Product Rules

- FundWise stores wallet addresses as canonical identity.
- Names are aliases attached to wallets, not replacement identifiers.
- A typed name must resolve to a wallet before it can appear in a settlement preflight.
- Settlement preflight must show both name and shortened wallet.
- Fundy must not parse a name from chat and settle to it without confirmation.
- Receipts should include raw wallet addresses; names are optional redacted display context.
- Public receipt output should not reveal private Member names unless the receipt privacy mode allows it.
- Name cache should expire and refresh.
- If a name changes ownership, future resolution must reflect the current owner, but old receipts stay tied to the original wallet address.

## Proposed Data Model

### wallet_name_aliases

```text
id
wallet
namespace              -- skr, sol, phantom, custom
name                   -- ana.skr, ana.sol, @ana
normalized_name
trust_level            -- resolver_verified, reverse_resolved, user_attested
source                 -- skr_resolver, sns, phantom_user_input, fundwise_profile
resolver_record_hash
verified_at
expires_at
revoked_at
created_at
updated_at
```

Unique:

- active `(namespace, normalized_name)` when resolver verified;
- multiple user-attested aliases may be allowed, but only one primary display alias per wallet.

### wallet_name_resolution_events

```text
id
input_name
namespace
resolved_wallet
resolver
status                 -- resolved, not_found, conflict, unsupported, stale, error
error_code
created_at
```

### member_display_preferences

```text
id
group_id
wallet
preferred_alias_id
display_mode           -- wallet_only, alias_plus_wallet, alias_only_private
updated_at
```

Rules:

- `alias_only_private` may be used only in private/member-authenticated surfaces.
- Public surfaces should prefer `alias_plus_wallet` or wallet-only.

## Resolution Order

For typed input:

1. Detect namespace:
   - `*.skr` -> `.skr` resolver.
   - `*.sol` -> SNS resolver.
   - `@name` -> Phantom handle path, V1 unsupported for payment resolution unless signed/user-linked.
   - base58 public key -> direct wallet.
2. Normalize input.
3. Resolve through accepted resolver.
4. Show preflight result:

```text
ana.skr
G9v...4mK
Resolved via .skr resolver
```

5. Require wallet confirmation before settlement.

For display:

1. Use Member-chosen alias if verified and unexpired.
2. Else use reverse-resolved `.skr` if Seeker context and verified.
3. Else use reverse-resolved `.sol`.
4. Else use user profile display name.
5. Else use shortened wallet.

## FundWiseSeeker UX

### Add name lookup to link recovery

When a Settlement Request or Group invite opens, Seeker can show:

```text
Pay Ana
ana.skr
G9v...4mK
```

If resolution fails:

```text
Name unavailable. Wallet address is still verified by FundWise.
```

### Add profile name manager

Allow signed-in users to:

- add a `.skr` name they own;
- add a `.sol` name they own;
- add a Phantom `@` handle as self-attested display/contact metadata;
- choose primary alias;
- remove aliases.

`.skr` and `.sol` ownership must be resolver-verified. Phantom `@` handle is self-attested until an official resolver is available.

## Fundy UX

Fundy can use aliases to improve chat messages:

```text
Ana has a settlement ready.
```

But Fundy should keep sensitive flows explicit:

```text
Ana (G9v...4mK) has a settlement ready. Tap to review.
```

Fundy should not accept:

```text
settle @ana 20
```

as a money movement command. At most it can create a draft suggestion that requires wallet-confirmed review.

## Receipt UX

Receipt Graph can include aliases in private context:

```json
{
  "payer_alias": "ana.skr",
  "payer_wallet": "G9v..."
}
```

Public receipt output should default to wallet addresses. Alias display should require a privacy mode decision because names can reveal social identity.

## Implementation Sequence

### Phase 0 - Planning

- Add this SADR.
- Keep wallet addresses canonical.

### Phase 1 - `.skr` resolver spike

- Choose `.skr` resolver API/SDK.
- Add resolution and reverse lookup.
- Add Seeker profile UI for `.skr` display.
- Add cache, expiration, and unit tests for normalization, not-found, and conflicts.

### Phase 2 - `.sol` / SNS resolver spike

- Add server-side SNS resolution and reverse lookup.
- Add cache and expiration if not shared with the `.skr` resolver.
- Add unit tests for normalization, not-found, and conflicts.

### Phase 3 - alias preferences

- Add `wallet_name_aliases` and `member_display_preferences`.
- Show alias + shortened wallet in private Group surfaces.
- Keep public views wallet-only unless explicitly accepted.

### Phase 4 - Fundy and Receipt integration

- Let Fundy read safe aliases through FundWise service APIs.
- Let Receipt Graph include private aliases only under scoped access.

### Phase 5 - Phantom handle review

- Watch for an official Phantom public resolver.
- Until then, keep Phantom `@` handles as self-attested profile/contact metadata.

## Acceptance Criteria For A Future ADR

- `.skr` names resolve through an accepted resolver and are cached with expiry.
- `.sol` names resolve through SNS and are cached with expiry.
- Phantom `@` handles are not used for payment resolution without official resolver support.
- Settlement preflight always shows canonical wallet address.
- Names never authorize Group membership or money movement.
- Fundy can display aliases without creating payment authority.
- Receipts preserve raw wallets and only expose aliases under accepted privacy modes.
- Name changes do not mutate historical payment truth.

## Alternatives Considered

### Only support `.skr`

Rejected. `.skr` is ideal for Seeker, but `.sol` is broader across Solana users and useful in web/Fundy flows.

### Implement SNS before `.skr`

Rejected for this SADR's sequence. SNS is valuable, but the product wedge is Seeker-first and `.skr` gives FundWiseSeeker a more differentiated mobile identity surface.

### Let Phantom `@` handles be typed payment recipients

Rejected for V1. Without an official resolver contract/API for external apps, this is too risky for settlement.

### Display aliases without wallets

Rejected for money flows. Alias-only display can be acceptable inside private profile surfaces, but settlement preflight should show alias plus shortened wallet.

## Open Questions

- Which `.skr` resolver source should be canonical for production?
- Should FundWise store resolver proof hashes or only cached results?
- Should users be able to hide aliases inside a Group?
- Should aliases appear in public Receipt HTML?
- Should `.sol` reverse lookup use favorite domain only or allow multiple aliases?
- When Phantom exposes a resolver, what proof level should `@` handles receive?

## Sources

- Solana Mobile `.skr` domains: https://docs.solanamobile.com/solana-mobile-stack/skr-domain
- Solana Mobile Seeker docs: https://docs.solanamobile.com/solana-mobile-stack/seeker
- SNS docs: https://docs.sns.id
- SNS SDK resolve docs: https://docs.sns.id/dev/sns-sdk/editor
- SNS SDK package: https://www.npmjs.com/package/@bonfida/sns-sdk
- Phantom developer docs: https://docs.phantom.com
- Phantom username support: https://help.phantom.com/hc/en-us/articles/33478025712531-About-Phantom-usernames-and-public-addresses
