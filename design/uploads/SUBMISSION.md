# FundWise Submission Brief

**Deadline:** 2026-05-11 Colosseum Frontier  
**Primary story:** Group money, done right
**Current evidence:** devnet rehearsal passed, responsive QA passed, `pnpm build` passing

## One-Line Pitch

Group money, done right. FundWise helps friends create a private Group, log shared Expenses, see live Balances, and settle the exact amount owed in USDC with a verifiable on-chain Receipt.

## Demo Script

Target length: 90-120 seconds.

1. **Open with the pain.** Shared-expense apps track who owes what, but they do not actually settle the debt.
2. **Create the Group.** Show `/groups`, connect a Solana wallet, and create a Split Mode Group for a trip or shared tab.
3. **Add an Expense.** Show a familiar Expense entry flow with payer, amount, and split method.
4. **Show live Balances.** Explain that FundWise nets the Group ledger and computes the simplest Settlement edge.
5. **Settle in USDC.** As the debtor, open Settlement preview, confirm the exact USDC transfer, and mention SOL is only for gas.
6. **Show the Receipt.** Land on the Receipt with amount, sender, recipient, timestamp, and on-chain signature.
7. **Sponsor support, briefly.** If the debtor lacks Solana USDC, LI.FI can support `Top up to settle`; Zerion can support wallet-readiness guidance. These support the core flow, not replace it.

## Screenshot Checklist

- Landing page hero: product name, `Start splitting`, `Read the story`, and the interactive Group preview.
- Story page: problem narrative, Settlement Request Link loop, and LI.FI cross-chain top-up angle.
- `/groups` disconnected state: wallet-first entry with `Connect Wallet`.
- Group dashboard: Expense list, Balances, Suggested Settlements.
- Settlement preview: sender, recipient, USDC amount, Solana fee note.
- Receipt: confirmed USDC Settlement and transaction signature.
- Optional support shot: `Top up to settle` entry point if LI.FI is shown.

## Submission Copy

FundWise is a wallet-native shared-expense app for groups that want settlement finality, not just bookkeeping. Members create a private Group, log shared Expenses, see live Balances, and settle exact net amounts in USDC on Solana. Each Settlement produces a clear Receipt with the on-chain transaction signature, so the awkward "did you pay?" follow-up disappears.

The hackathon MVP focuses on one coherent path: `Group -> Expense -> Balance -> Settlement -> Receipt`. LI.FI is used as a support layer for EVM-first debtors who need to top up their Solana wallet before settling. Zerion is framed as wallet-readiness and guidance around the same core flow. Fund Mode, Fundy, the Agent Skill Endpoint, and Scoped Agent Access remain future direction unless separately shipped.

## Track Framing

**Visa Frontier:** FundWise is a consumer payments product. The strongest story is exact USDC Settlement for real shared expenses, with a clear Receipt and mobile-friendly wallet confirmation.

**LI.FI:** LI.FI helps a debtor reach Solana USDC when their funds sit on another chain. The user-facing language should be `Top up to settle`, not bridge management.

**Zerion:** Zerion supports wallet-readiness analysis and next-action guidance. It is not a wallet-auth replacement and does not sit inside the core Settlement path.

## Do Not Claim

- Mainnet-beta is live unless a fresh mainnet rehearsal proves it.
- Fund Mode Proposal lifecycle is complete.
- Fundy is shipped.
- Agent Skill Endpoint or Scoped Agent Access is shipped.
- Settlement is gasless.
- FundWise supports multi-stablecoin Settlement.
- LI.FI directly pays creditors cross-chain.
