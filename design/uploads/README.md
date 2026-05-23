# FundWise

**Group money, done right.** Create a private Group, log shared Expenses, see live Balances, and settle exact USDC amounts on Solana with a clear Receipt.

FundWise also has a second mode, **Fund Mode**, for pooled USDC Treasuries. That remains part of the product direction, but proposal flows are still incomplete and the current MVP is optimized around **Split Mode**.

## Documentation Map

Read these in order:

1. [AGENTS.md](./AGENTS.md)
2. [STATUS.md](./STATUS.md)
3. [CONTEXT.md](./CONTEXT.md)
4. [ROADMAP.md](./ROADMAP.md)
5. [HACKATHON_PLAN.md](./HACKATHON_PLAN.md)
6. [PRD.md](./PRD.md)
7. [issues.md](./issues.md)
8. [docs/adr/](./docs/adr/)

Quick links:

- [STATUS.md](./STATUS.md) - current repo state, locked decisions, next session
- [CONTEXT.md](./CONTEXT.md) - domain language and product invariants
- [PRD.md](./PRD.md) - MVP scope, user stories, implementation decisions
- [ROADMAP.md](./ROADMAP.md) - phased delivery plan
- [HACKATHON_PLAN.md](./HACKATHON_PLAN.md) - track strategy and sponsor framing
- [SUBMISSION.md](./SUBMISSION.md) - judge-facing demo script and submission copy
- [issues.md](./issues.md) - active indexed backlog for hackathon execution
- [docs/README.md](./docs/README.md) - chunked documentation index by topic
- [DECISIONS.md](./DECISIONS.md) - ADR index
- [docs/agentic-settlement-endpoint.md](./docs/agentic-settlement-endpoint.md) - research note for Payable Settlement Requests, x402, MPP, and pay.sh
- [docs/agent-payment-policy.md](./docs/agent-payment-policy.md) - spending capacity, safety policy, endpoint gaps, and Group ownership notes for payment-aware agents
- [audit.md](./audit.md) - current security findings and mainnet blockers

## Current Product Shape

### Split Mode

The current MVP path is:

`Group -> Expense -> Balance -> Settlement -> Receipt`

- Web app first
- `/groups` uses a wallet-first entry state so disconnected users can connect immediately and continue into their Group list
- After wallet connect, the app should restore the exact intent the user came for: invite-linked Group, Settlement Request Link, or first Group creation
- Plain `/groups` with no existing Groups should open Group creation immediately; returning users with existing Groups should stay on the Group list
- Group creation defaults to Split Mode; Fund Mode is visible as an invite-only beta inside the create flow rather than a public default path
- Wallet-native auth (`@solana/wallet-adapter-*`); optional Phantom Connect may layer on later (see ADR-0014)
- Wallet-signed browser-session verification gates protected Group ledger reads and Receipts
- Invite link or QR join flow with an explicit `Join {GroupName}` confirmation after connect
- Settlement Request Links open the live settleable state and context, but never auto-send a Settlement
- USDC-only settlement asset
- Planned multi-currency Expense entry converts a Source Currency amount into a stored USD/USDC ledger value using an Exchange Rate Snapshot
- Planned Expense Proof upload lets Members attach a merchant receipt photo, PDF, or proof link to an Expense
- Activity Feed, not chat
- Current net Group Balance settlement, not per-Expense settlement

### Fund Mode

Fund Mode remains in the product and repo, but it is not the primary hackathon demo path.

- Group-owned Treasury using Squads primitives
- Contributions into Treasury
- Public Group creation keeps Fund Mode invite-only for now; internal testing can be re-enabled with `FUNDWISE_FUND_MODE_INVITE_WALLETS`
- Proposal / approval / execution flow still pending and not part of the current hackathon mainline

### Sponsor layers

- `LI.FI` is the primary sponsor support layer after Split Mode hardening. It lets EVM-first users top up into Solana USDC through an `Add funds` / `Top up to settle` flow without needing to understand the underlying route details.
- `Zerion` is a secondary intelligence layer for wallet analysis, reminders, and future FundWise Agent flows.
- **FundWise Agent** is the preferred umbrella name for later assistant surfaces. Telegram bot and Telegram mini app are channels for it, not a separate product.
- **Fundy** is the planned hosted Telegram bot that will run the FundWise Agent. Fundy Lite (hackathon) is command-based with Zerion wallet analysis. Fundy Full (post-hackathon) adds LLM via OpenRouter for natural language, personal finance features, budgets, and proactive reminders. See ADR-0018.
- **Agent Skill Endpoint** (`/skill.md`) is the public URL at **`https://fundwise.kairen.xyz/skill.md`** that autonomous agents can `curl` to discover FundWise capabilities, what to call vs avoid, supported actions, and how to authenticate through Scoped Agent Access. API reference markdown is available at **`https://fundwise.kairen.xyz/api/docs`**.
- **Payable Settlement Requests** are a planned research direction for agent-paid settlement through x402 / MPP-style payment flows. They should extend Settlement Request Links for approved agents without bypassing scoped authority, live Balance checks, or Receipt verification. See [docs/agentic-settlement-endpoint.md](./docs/agentic-settlement-endpoint.md).
- **Spending Policies** are required before any agent can pay a Settlement. They set per-Settlement caps, daily limits, Group scope, counterparty scope, expiry, and human fallback behavior. See [docs/agent-payment-policy.md](./docs/agent-payment-policy.md).

Neither sponsor integration should complicate the primary Split Mode settlement path.

### Hosted app and agent discovery

- Production web app: **`https://fundwise.kairen.xyz`**
- Agent Skill: **`https://fundwise.kairen.xyz/skill.md`**
- API docs: **`https://fundwise.kairen.xyz/api/docs`**

## Tech Stack

- Frontend: Next.js 15, React 19, Tailwind v4, Radix / shadcn UI
- Wallets: `@solana/wallet-adapter-*` (primary); optional `@phantom/react-sdk` when Portal is configured
- Chain: Solana devnet for now
- Settlement asset: USDC
- Off-chain state: Supabase / Postgres
- Fund Mode Treasury: Squads (`@sqds/multisig`)
- Cross-chain support: LI.FI SDK

## Repo Structure

```text
/
├── AGENTS.md
├── CONTEXT.md
├── HACKATHON_PLAN.md
├── PRD.md
├── ROADMAP.md
├── STATUS.md
├── issues.md
├── DECISIONS.md
├── docs/adr/
├── docs/agentic-settlement-endpoint.md
├── docs/agent-payment-policy.md
├── app/
│   ├── page.tsx
│   ├── story/
│   │   └── page.tsx          ← public product narrative and PLG loop
│   ├── demo/
│   │   └── page.tsx          ← interactive 5-step product walkthrough
│   └── groups/
│       ├── page.tsx
│       └── [id]/
│           ├── page.tsx
│           └── settlements/[settlementId]/page.tsx
├── components/
│   ├── settlement-preview-dialog.tsx  ← settlement preview before wallet sign
│   └── group-dashboard/
│       ├── expense-dialog.tsx
│       ├── fund-mode-dashboard.tsx
│       ├── group-sidebar.tsx
│       ├── profile-name-dialog.tsx
│       └── split-mode-dashboard.tsx
├── hooks/
│   └── use-group-dashboard.ts
├── lib/
│   ├── db.ts
│   ├── expense-engine.ts
│   ├── simple-payment.ts
│   ├── lifi-bridge.ts
│   ├── squads-multisig.ts
│   └── supabase.ts
├── docs/
│   ├── adr/                         ← active architecture decisions
│   └── archive/                      ← deferred ADRs (post-hackathon)
├── tests/
│   └── expense-engine.test.ts   ← 32 unit tests
├── vitest.config.ts
├── supabase/
    └── schema.sql
```

## Group Dashboard Structure

The main Group route is no longer a single giant page component.

- `app/groups/[id]/page.tsx` is the route shell and UI wiring layer.
- `hooks/use-group-dashboard.ts` owns Group loading, membership checks, shareable Settlement Request Links, Settlement execution, Treasury initialization, Contribution persistence, and profile-name persistence.
- `components/group-dashboard/` holds the Split Mode dashboard, Fund Mode dashboard, sidebar, Expense dialog, and profile dialog as focused UI modules.

## Getting Started

### Prerequisites

- Node 20+
- `pnpm`
- A Solana wallet
- A Solana RPC URL
- A Supabase project with the current schema applied

### Install

```bash
pnpm install
```

### Environment

Create `.env.local` manually. The repo does not currently ship an `.env.example`.

Required keys used by the app:

- `NEXT_PUBLIC_SOLANA_RPC_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FUNDWISE_SESSION_SECRET`

Fallback compatibility is present for:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Run

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test          # vitest — expense engine unit tests
```

### Deploy on Cloudflare Pages

FundWise is configured for a Cloudflare **Pages** project, not direct Worker deploys.

Pages build settings:

- Build command: `pnpm build:pages`
- Build output directory: `.vercel/output/static`
- Deploy command: leave empty
- Node.js: `22` works on Cloudflare Pages; `20` also works locally

Do not use `wrangler deploy` for this app. If deploying manually, use:

```bash
pnpm deploy:pages
```

Current verification state:

- `pnpm exec tsc --noEmit` passes
- `pnpm lint` passes
- `pnpm build` passes
- `pnpm test` — 32 tests passing (expense engine splits, balances, settlement graph)

### Database Bootstrap

The base FundWise tables now live in `supabase/migrations/`, not only in `supabase/schema.sql`.

If a remote Supabase project was linked before that bootstrap migration existed, backfill it with:

```bash
supabase db push --include-all
```

## MVP Notes

- Solana devnet is the active execution environment for now.
- Mainnet-beta comes later, after the devnet hardening and rehearsal path is finished.
- Members need SOL for gas even though Settlements use USDC.
- FundWise now preflights stablecoin transfers before the wallet prompt so users see insufficient-USDC, insufficient-SOL, and token-account-creation guidance earlier.
- The current execution order is:
  devnet settlement hardening -> manual QA -> LI.FI top-up / add-funds flow -> Zerion and FundWise Agent / Telegram support layers -> Fundy (hosted Telegram bot) -> Agent Skill Endpoint + Scoped Agent Access -> later Fund Mode proposals
- Planned Expense entry expansion: allow Source Currency input, show a current exchange-rate quote, save the Exchange Rate Snapshot, and keep Balances / Settlements in the converted USD/USDC ledger value.
- Planned proof expansion: allow one lightweight receipt photo / PDF upload or proof link on an Expense.
- The current docs source of truth is split across [STATUS.md](./STATUS.md), [CONTEXT.md](./CONTEXT.md), and [PRD.md](./PRD.md). If another doc disagrees, those three win.

## License

TBD.
