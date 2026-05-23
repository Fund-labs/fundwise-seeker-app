# FundWise on Solana Seeker — Coding Agent Handoff

You're building **FundWise**, a group-money app for the Solana Seeker (Android crypto phone with a side-mounted fingerprint reader integrated with the device's Seed Vault). The HTML prototype in this project (`Seeker App.html`) is the visual + interaction spec. Your job is to translate it to a production app (recommended: **React Native + Mobile Wallet Adapter / Seed Vault SDK** on Android).

Read this whole document before writing code. Then open `Seeker App.html` and step through every screen via the side caption list — that is the source of truth for UX, copy, and motion.

---

## 1. Product in one paragraph

FundWise lets friends share money in two modes: **Split mode** (log expenses, settle balances on-chain in USDC) and **Fund mode** (pool stablecoins into a multisig vault, spend via threshold votes). The product is wallet-native — your Solana key is your identity, every signature goes through the Seeker's hardware Seed Vault via the side fingerprint sensor. No email, no password.

## 2. Tech stack

- **React Native** (or Jetpack Compose if you prefer native Android — Seeker only ships Android).
- **Mobile Wallet Adapter** + **Seed Vault SDK** for all signing. Never store private keys yourself; always delegate to the vault, which prompts the fingerprint reader.
- **Solana web3.js** + **@solana/spl-token** for USDC transfers and account state.
- **Squads Protocol** (or your own program) for the Fund-mode multisig vault + proposal/vote logic.
- **Telegram Mini App** (separate Web App target) reusing the same React components where possible.

## 3. Brand & design tokens

Strict adherence. The brand mark is three rounded green slabs stacked at slight angles ("Strata"). SVGs and a `Logo` component are in `brand-strata/`.

```
--fw-deep:    #0A4D2C   gradient stop 1
--fw-forest:  #0D6B3A   gradient stop 2
--fw-emerald: #1A9151   gradient stop 3 (primary accent)
--fw-jade:    #2DB870   mid
--fw-mint:    #4EC98A   gradient stop 4 (highlight)
--fw-ink:     #0D1F14   primary text (light theme)
--fw-bg:      #F4F1EA   app background (light theme)

# Dark theme — cool blue-grey, premium (Linear/Vercel style)
--fw-bg-dark:      #0A111C
--fw-surface-dark: #131B2A
--fw-ink-dark:     #E8EDF2
--fw-ink-2-dark:   #8A99AD
```

**Brand greens stay the same in both themes.** Only the surfaces and ink shift.

**Type pairing**

- Headings & wordmark: **DM Serif Display** (with the `w` italicized in "Fundwise")
- UI body: **Plus Jakarta Sans**
- Mono / labels / addresses: **JetBrains Mono**

**Iconography**: thin stroke (1.6–2px), 24×24 viewBox, `stroke="currentColor"`.

## 4. Device + biometric model

The Seeker has a power button on the right edge that doubles as a fingerprint reader. **Every signature must use it.** The on-screen fingerprint visual is a *diagram*, not a button. Make on-screen FP UI `pointer-events: none`. The real interaction is:

1. App requests a signature from Seed Vault.
2. OS shows the system biometric prompt (or our in-app prompt if we use a custom UI behind it).
3. User presses the side fingerprint sensor.
4. Seed Vault returns a signature; app submits the transaction.

Triggers for signing in this app:
- **Onboarding** — connect wallet (one-time signature to prove ownership).
- **Settle** — sign a USDC transfer.
- **Deposit** — sign a USDC transfer into the vault PDA.
- **Vote** — sign a vote message for the proposal (or a multisig approval if using Squads).

## 5. Haptics

Trigger `Haptics.selection()` or `Vibration.vibrate([10])` on:
- Every button/card tap.
- Successful fingerprint scan (light success haptic).
- Transaction confirmation (success haptic).
- Error states (warning haptic).

The HTML prototype shows a green ripple — that's the *visualization* of the haptic. In the real app it's invisible; the user just feels it.

## 6. Flows / screens (open `Seeker App.html` and click each)

### Onboarding (in order)
1. **Boot** — 3-slab strata logo animation, slabs stack-up sequentially (15ms, 40ms, 65ms cubic-bezier .2 .8 .25 1), then wordmark fades up. ~2.5s total. No status bar.
2. **Welcome** — strata logo + "Welcome to *Fund**w**ise*" + floating avatar halo (4 overlapping avatars with breathing blur + sparkles). CTA: Get started.
3. **Quick tour** — 3-card carousel with custom illustrations:
   - "Log it once, we split the math." → receipt + people row
   - "Pool funds, vote to spend." → jar filling with coins
   - "Settle in seconds, final on Solana." → settlement receipt + mini blockchain
   - Step dots, Skip / Back / Next.
4. **Authenticate** — eyebrow "Seed Vault · Authorize", body diagram, prompt: *"Place your finger on the sensor"*. **Only the side fingerprint triggers the scan.** Pulsing arrow + halo highlight the side button. On-screen UI is non-interactive.
5. **Connected** — green check pop, "Wallet connected" + truncated pubkey pill, auto-advance after 2.2s.
6. **Home** — dashboard (see below).

### Home / Dashboard
- Greeting + bell with red dot + avatar
- **Balance hero** (green gradient) — Net balance, sub, strip of 3 stats (You're owed / You owe / In vaults)
- 4 **quick actions** (Split / Deposit / Settle / New group) — these route into sheets
- **Action items**:
  - "Vote needed · Priya's Gift" → opens the fund group
  - "You owe Kiran $30" → opens Settle sheet directly
  - "Split with anyone, in Telegram" → opens Telegram share sheet
- **Your groups** list with mode tags (Split / Fund) and balance per group
- **Recent activity** list
- Bottom nav: Home · Groups · `+` FAB · Activity · Wallet

### Group · Split mode (`Lisbon Trip` is the canonical example)
- Hero (green) — emoji, "Your balance", amount, members avatar stack
- Balance chips row (one per member, horizontally scrollable)
- "Share to Telegram" alert
- Expenses grouped by day with payer info + "you lent / you owe" per row
- Sticky bottom bar: **Add expense** (ghost) + **Settle up** (gradient primary)

### Group · Fund mode (`Priya's Gift` is the canonical example)
Ordering matters — small / personal features go first:
- Hero (cobalt-indigo) — emoji, "Pool liquidity", goal progress bar, members + "3-of-5 multisig"
- **Your contribution** card — avatar, amount, % of pool, **Top up** button (green gradient) — this is the only way to deposit
- "Share to Telegram" small alert
- Proposals list (status: pending / approved / executed, vote bar, Approve / Reject buttons)
- Members section — collapsed by default, just shows avatar stack + count. Tap "Show all" to expand. **Never show other people's contributions** — only show your own amount even when expanded.
- Sticky bottom bar: full-width **New proposal**

### Sheets (modal, bottom-up slide, handle on top)
- **FAB menu** — 4 quick actions
- **Add expense** — amount, description, group, payer pills, live equal split preview
- **Settle picker** — list of balances involving "you" across all groups
- **Settle preview** — from→to row, amount, group, fee, "Sign & pay" → routes to auth + side fingerprint
- **Vote** — proposal summary + your choice → routes to auth
- **Telegram share** — Telegram-blue hero, mini-app invite link with copy, primary "Open in Telegram"
- **Invite** — link with copy, 4 share options (Telegram / QR / SMS / More)
- **Deposit** — amount input + chips ($25/$50/$100/$250) → routes to auth
- **Propose** — amount, title, memo, "needs 3 of N approvals" hint
- **Create group** — 3-step wizard: mode (Split/Fund) → name → token (USDC/USDT/PYUSD)
- **Profile** — name + address + settings rows

### Tabs (bottom nav)
- **Groups** — full group list with All / Split / Fund tabs and a `+` to create
- **Activity** — all txns with tabs (All / Expenses / Settlements / Votes)
- **Wallet** — balance hero, receive/send/QR/Telegram, recent transactions, address with copy

## 7. State model (data shapes)

```ts
type GroupMode = 'split' | 'fund';

type SplitGroup = {
  id: string; name: string; emoji: string;
  mode: 'split'; currency: 'USDC' | 'USDT' | 'PYUSD';
  members: PersonId[];           // ['you', 'kiran', ...]
  myBalance: number;             // signed
  expenses: Expense[];
  balances: { who: PersonId; v: number }[];
  settlements: { from: PersonId; to: PersonId; amt: number }[];
};

type FundGroup = {
  id: string; name: string; emoji: string;
  mode: 'fund'; currency: 'USDC' | 'USDT' | 'PYUSD';
  members: PersonId[];
  total: number;                 // pool liquidity
  goal: number;
  myContrib: number;
  proposals: Proposal[];
};

type Proposal = {
  id: string; title: string; memo: string; amt: number;
  status: 'pending' | 'approved' | 'executed';
  yes: number; no: number; total: number;
  myVote: 'yes' | 'no' | null;
};
```

## 8. Animation specs

| Element                | Spec                                                                |
|------------------------|---------------------------------------------------------------------|
| Boot slabs             | cubic-bezier(.2,.8,.25,1) 700ms, 150ms stagger, drop-from-above     |
| Wordmark fade-in       | 550ms ease-out at 1150ms                                            |
| Welcome avatar floats  | 4s ease-in-out infinite, offset 300ms each                          |
| FP scan rings          | 2.4s ease-out infinite, 800ms stagger                               |
| Scan progress          | 25% per 240ms tick (≈1s total)                                      |
| Success check draw     | stroke-dashoffset 0→0 over 500ms after 350ms                        |
| Sheet slide-in         | cubic-bezier(.2,.8,.25,1) 320ms                                     |
| Coin drop (jar)        | 2.4s ease-in-out infinite, rotation                                 |

## 9. Telegram integration

Telegram is a first-class share channel and **not just a button on the share sheet**. Three surfaces:
- Dashboard alert card "Split with anyone, in Telegram" → Telegram share sheet
- Per-group "Share to Telegram" small alert
- Wallet tab quick action

Also build a Telegram Mini App as a separate target — the same group detail / vote / add-expense components should render inside the chat. Invite link format: `t.me/fundwise_bot?group=<id>`.

## 10. Implementation tips

- All `#fff` card backgrounds reference `var(--fw-surface)`. Wire your theme so the surface var swaps between `#FFFFFF` (light) and `#131B2A` (dark).
- The on-screen fingerprint visual is decorative — `pointer-events: none`. Side button is the only scan trigger.
- Status bar icons use `currentColor` for theme adaptation.
- Don't show other members' contributions in Fund mode. Privacy by default.
- Never invent settlement amounts on the client — read from the chain (vault PDA balance, member balances reduced from on-chain expense entries).
- Use Solana for both Split-mode token transfers and Fund-mode multisig actions. Fees are sub-cent; advertise that copy ("~$0.00025 · <1s") on success screens.

## 11. Files in this project

```
Seeker App.html              ← run this; it's the spec
seeker/
  data.jsx                   ← sample data (groups, people, activity)
  device.jsx                 ← Device frame, status bar, avatars, primitives
  onboarding.jsx             ← Boot, Welcome, Auth, Success, Quick tour
  dashboard.jsx              ← Home, Groups tab, Activity tab, Wallet tab
  group-split.jsx            ← Split-mode group detail
  group-fund.jsx             ← Fund-mode group detail
  sheets.jsx                 ← All bottom-sheets
  app.jsx                    ← Router, state, scan/sign machine
brand-strata/
  README.md                  ← brand usage
  svg/                       ← logo marks + wordmark
  components/Logo.tsx        ← drop-in React component
```

Open `Seeker App.html` in a browser, use the side caption to scrub through every step (Boot → Wallet). Toggle the light/dark switch under the haptic note. Tap the glowing side fingerprint on Authenticate / sign sheets to feel the scan.

That is the product. Build it.
