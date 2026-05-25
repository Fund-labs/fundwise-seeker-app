## FundWise Sync Rule

`FundWiseSeeker` is the app repo and remains the priority. Do not block purely app-local UI, animation, layout, or copy work on FundWise unless the change touches a shared contract.

Before committing Seeker changes that touch FundWise contracts or handoff surfaces, check the sibling `../FundWise` repo and run:

```bash
npm run verify:fundwise-sync
```

Run the sync check when changing:

- app links, `app.json`, `assetlinks.json` assumptions, or launch-gate docs
- `EXPO_PUBLIC_FUNDWISE_*`, `EXPO_PUBLIC_RECEIPTS_URL`, `EXPO_PUBLIC_FUNDY_TELEGRAM_URL`, Solana RPC, Helius, or Supabase envs
- `/groups`, `/join`, `/settle/r`, `/receipts`, mobile settlement preview, receipt, invite, or Fundy/Telegram handoff behavior
- Supabase migration references or production rehearsal steps
- parser/API code under `src/lib/fundwise-*`, `src/lib/fundy-*`, `src/hooks/useIncomingFundWiseLink.ts`, or related screens

Skip the FundWise sync check for app-only work that does not change shared contracts. The app should keep moving; FundWise verification is a gate only when Seeker depends on FundWise behavior.
