# Project Learnings

> Managed by `/learn`. Append-only - latest entry wins on conflicts.

## Patterns

### link-first-money-onboarding
- **Insight:** For Seeker, first-run UX should prioritize the user's current money job, especially Settlement Request links, before generic product education or wallet setup.
- **Confidence:** 9/10
- **Source:** product-review, frontend-design-guidelines, build-mobile
- **Files:** src/screens/FundWiseSeekerAppScreen.tsx, plans/SADR/SADR-006-link-first-seeker-onboarding.md
- **Date:** 2026-05-25

### explicit-wallet-consent
- **Insight:** MWA should open only after an explicit user tap and a plain-language explanation of what wallet connection can and cannot do.
- **Confidence:** 9/10
- **Source:** build-mobile, frontend-design-guidelines
- **Files:** src/screens/FundWiseSeekerAppScreen.tsx, docs/solana-mobile-crosscheck.md
- **Date:** 2026-05-25

### preview-before-handoff
- **Insight:** Settlement links should show amount, role, status, expiry, wallet, and fallback before sending users to FundWise web/PWA.
- **Confidence:** 9/10
- **Source:** product-review
- **Files:** src/lib/fundwise-api.ts, src/screens/FundWiseSeekerAppScreen.tsx
- **Date:** 2026-05-25

## Pitfalls

### fake-live-financial-state
- **Insight:** Sample balances, groups, and activity must not look like live production ledger state unless backed by FundWise protected reads.
- **Confidence:** 8/10
- **Source:** product-review
- **Files:** src/data/fundwise.ts, src/screens/FundWiseSeekerAppScreen.tsx, docs/architecture.md
- **Date:** 2026-05-25

### auto-wallet-launch-friction
- **Insight:** Auto-opening wallet prompts during onboarding creates anxiety and makes users feel trapped, especially in high-stakes money flows.
- **Confidence:** 9/10
- **Source:** build-mobile, frontend-design-guidelines
- **Files:** src/screens/FundWiseSeekerAppScreen.tsx
- **Date:** 2026-05-25

## Preferences

### one-primary-action-per-state
- **Insight:** Each Seeker money state should present one obvious primary action such as Connect wallet, Continue on FundWise, Switch wallet, or Retry preview.
- **Confidence:** 8/10
- **Source:** frontend-design-guidelines
- **Files:** src/screens/FundWiseSeekerAppScreen.tsx
- **Date:** 2026-05-25

## Architecture

### seeker-recovery-not-ledger
- **Insight:** Until native intent, confirm, and recovery APIs ship, FundWiseSeeker should remain a native recovery/preview/handoff layer while FundWise remains the ledger source of truth.
- **Confidence:** 10/10
- **Source:** build-mobile
- **Files:** docs/architecture.md, plans/SADR/SADR-004-native-settlement-transaction-construction.md, plans/SADR/SADR-006-link-first-seeker-onboarding.md
- **Date:** 2026-05-25

## Tools

(entries here)
