# Production Launch Gate

This is the Seeker-side execution gate for the latest FundWise mobile-native Split Mode update. FundWise web remains the source of truth for ledger writes, Supabase state, Settlement verification, and Receipts. This repo owns Android App Links, native handoff recovery, Seeker/TWA readiness, and native QA evidence.

Source of truth in the sibling FundWise repo:

- ADR-0046: `../../FundWise/docs/adr/0046-mobile-native-split-beta-then-multichain-funding.md`
- ADR-0047: `../../FundWise/docs/adr/0047-integration-sequence-and-provider-rail-boundaries.md`
- Seeker mobile plan: `../../FundWise/docs/seeker-mobile-app-plan.md`
- Split Mode checklist: `../../FundWise/docs/split-mode-mainnet-checklist.md`
- Ops runbook: `../../FundWise/docs/ops-runbook.md`
- Provider rails migration: `../../FundWise/supabase/migrations/20260525120000_add_provider_rail_intents.sql`
- Rate-limit buckets migration: `../../FundWise/supabase/migrations/20260525143000_add_rate_limit_buckets.sql`

## What This Repo Now Owns

- Android App Links for `fundwise.fun` and `beta.fundwise.fun`.
- Link recovery for `/groups`, `/join`, `/settle/r/{requestId}`, and `/receipts/{id}`.
- Public Expo config for FundWise web/API/Receipts hosts and Solana RPC.
- Production config verification through `npm run verify:production`.
- TWA/APK readiness documentation for the Seeker/dApp Store path.

## 1. HITL Production Config

These steps require dashboard access and must be completed in FundWise / Supabase / Cloudflare. Do not commit real secret values.

Required FundWise server env:

```text
FUNDWISE_SEEKER_ANDROID_CERT_SHA256_FINGERPRINTS=<release cert sha256, comma-separated if multiple>
FUNDWISE_SETTLEMENT_REQUEST_SECRET=<new high-entropy secret>
SOLANA_RPC_URL=<private Helius mainnet RPC>
SOLANA_RPC_FALLBACK_URLS=<private fallback RPC URLs>
NEXT_PUBLIC_SOLANA_RPC_URL=<public client mainnet RPC>
NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS=<public fallback RPC URLs>
NEXT_PUBLIC_SUPABASE_URL=<fundwise-beta or fundwise-prod URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<matching publishable key>
SUPABASE_SERVICE_ROLE_KEY=<matching service role key>
FUNDWISE_SESSION_SECRET=<new per-environment secret>
```

Required Seeker client env:

```text
EXPO_PUBLIC_FUNDWISE_WEB_URL=https://fundwise.fun
EXPO_PUBLIC_FUNDWISE_API_URL=https://fundwise.fun
EXPO_PUBLIC_RECEIPTS_URL=https://fundwise.fun
EXPO_PUBLIC_FUNDWISE_ALLOWED_HOSTS=fundwise.fun,beta.fundwise.fun
EXPO_PUBLIC_FUNDY_TELEGRAM_URL=https://t.me/fundyonSol_bot
EXPO_PUBLIC_SOLANA_CLUSTER=mainnet
EXPO_PUBLIC_SOLANA_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=<public mobile RPC key>
```

Supabase migration gate:

```bash
cd ../FundWise
supabase --version
supabase login
supabase link --project-ref <fundwise-beta-or-prod-ref>
supabase db push --dry-run
supabase db push --include-all
supabase migration list
pnpm supabase:verify-rls
```

The remote migration list must include:

- `20260525120000_add_provider_rail_intents.sql`
- `20260525143000_add_rate_limit_buckets.sql`

Post-migration SQL checks:

```sql
select to_regclass('public.provider_integration_intents') as provider_integration_intents,
       to_regclass('public.provider_quote_snapshots') as provider_quote_snapshots,
       to_regclass('public.provider_events') as provider_events,
       to_regclass('public.provider_reconciliation_results') as provider_reconciliation_results,
       to_regclass('public.rate_limit_buckets') as rate_limit_buckets;
```

```sql
select grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name = 'consume_rate_limit'
order by grantee, privilege_type;
```

Expected: provider rail tables and `rate_limit_buckets` exist, RLS is enabled, public/anon/authenticated have no table access, and `consume_rate_limit` executes only through `service_role`.

## 2. Mobile-Native QA Gate

Run against both `https://beta.fundwise.fun` and `https://fundwise.fun` when each environment is configured.

- iOS Add to Home Screen.
- Android Add to Home Screen.
- Android wallet browser.
- Android App Links from:
  - `/groups`
  - `/groups/{id}`
  - `/join/{id}` or invite equivalent
  - `/settle/r/{requestId}`
  - `/receipts/{id}`
- Wallet connect.
- Invite join.
- Share Settlement Request.
- Receipt open.
- Wallet rejection and retry.
- Background/resume during wallet handoff.
- Poor-network behavior around preview, sign, submit, and receipt.

Local Seeker config check:

```bash
npm run verify:production
```

Strict release check, with env loaded:

```bash
EXPO_PUBLIC_SOLANA_RPC_ENDPOINT="https://mainnet.helius-rpc.com/?api-key=..." npm run verify:production:strict
```

## 3. Split Mode Mainnet Rehearsal

Prerequisites:

- `fundwise-beta` Supabase project has all migrations applied.
- Cloudflare beta env points to mainnet RPC/Helius and `fundwise-beta`.
- Two real wallets have tiny SOL and USDC balances.
- Team accepts that on-chain transfers cannot be rolled back.

Tiny real-money flow:

1. Create beta Split Mode Group.
2. Invite second wallet.
3. Join from mobile invite link.
4. Add Expense.
5. Share Settlement Request.
6. Open `/settle/r/{requestId}` on mobile.
7. Settle tiny USDC amount.
8. Verify Receipt at `/receipts/{id}`.
9. Test wallet rejection.
10. Retry/recover without losing Group or Settlement context.

Capture evidence:

- Group UUID.
- Redacted wallet addresses.
- Settlement tx signature and explorer URL.
- Receipt URL.
- Mobile screenshots for Add to Home Screen, Settlement Request, wallet prompt, and Receipt.
- Any P0/P1 issue with reproduction steps.

## 4. Seeker / TWA APK Path

Start only after the mobile web/PWA gate passes.

1. Generate or reuse a dApp Store-specific Android release signing cert.
2. Export the release cert SHA-256 fingerprint.
3. Set `FUNDWISE_SEEKER_ANDROID_CERT_SHA256_FINGERPRINTS` on FundWise beta/prod.
4. Verify `https://fundwise.fun/.well-known/assetlinks.json` includes package `fun.fundwise.seeker`.
5. Build signed TWA/APK.
6. Verify APK cert with `apksigner verify --print-certs`.
7. Install APK on Android/Seeker.
8. Run the same Split Mode flow inside the APK.

Current Seeker repo APK hooks:

- `eas.json` has a `dapp-store` APK profile.
- Local Android release signing reads `FUNDWISE_DAPP_STORE_*` env vars from generated `android/`.
- `android/` remains generated and ignored until the project intentionally moves to a native-owned workflow.

## Blockers That Cannot Be Solved In Git

- Real Supabase project creation and migration application.
- Real Cloudflare beta/prod env wiring.
- Helius key selection, quota, and fallback provider confirmation.
- Release signing cert generation and fingerprint insertion.
- iOS/Android Add to Home Screen validation.
- Wallet-browser and real-wallet testing.
- Tiny USDC rehearsal and Receipt evidence capture.
