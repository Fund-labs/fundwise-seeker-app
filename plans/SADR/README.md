# FundWiseSeeker SADR Index

Last updated: 2026-05-25

Strategic Architecture Decision Records for FundWiseSeeker plans. These are planning records, not accepted implementation ADRs.

## Decisions

| SADR | Status | Decision |
| --- | --- | --- |
| [SADR-001](./SADR-001-seeker-native-settlement-handoff.md) | Suggested / research-backed | Explore Seeker-native Settlement, Blink, and Receipt handoff while keeping FundWise and Receipts as ledger/proof sources of truth |
| [SADR-002](./SADR-002-seeker-genesis-member-badge-gating.md) | Suggested / research-backed | Explore SIWS + Seeker Genesis Token verification for Seeker Verified Member status, beta access, badge eligibility, and private receipt context |
| [SADR-003](./SADR-003-readable-wallet-names-skr-sol-phantom.md) | Suggested / research-backed | Explore `.skr`-first readable wallet names, then SNS / `.sol`, with Phantom `@` handles as display/contact hints while keeping wallet addresses canonical |
| [SADR-004](./SADR-004-native-settlement-transaction-construction.md) | Suggested / research-backed | Explore native Settlement transaction construction through MWA while keeping FundWise as the intent, verification, and ledger source of truth |
| [SADR-005](./SADR-005-native-settlement-recovery-inbox.md) | Suggested / research-backed | Explore a native Settlement Recovery Inbox for pending signatures, expired intents, receipt recovery, and safe retry paths |

## Cross-Product SADRs

| Product | SADR | Why it matters to FundWiseSeeker |
| --- | --- | --- |
| FundWise | [SADR-008](../../../FundWise/plans/SADR/SADR-008-settlement-blinks.md) | Defines the Settlement Blink links Seeker recovers |
| FundWise | [SADR-010](../../../FundWise/plans/SADR/SADR-010-actionable-settlement-nudges.md) | Defines Tap-to-Settle Reminder links that should open cleanly on Android |
| FundWise | [SADR-007](../../../FundWise/plans/SADR/SADR-007-dynamic-creator-badge.md) | Defines how verified Seeker status can feed badge eligibility without leaking device identity |
| Receipts | [SADR-001](../../../Receipts/plans/SADR/SADR-001-receipt-graph.md) | Defines receipt links Seeker opens after successful settlement |
| Receipts | [SADR-002](../../../Receipts/plans/SADR/SADR-002-privacy-modes-and-payable-receipt-packs.md) | Defines public-redacted and private receipt views Seeker should respect when opening receipt links or recovery states |
