# FundWise Seeker Progress

## Snapshot

Date: 2026-05-27

Status: `main` now includes the first real-device Seeker QA pass after the repo moved to `/Volumes/Sarthi/fundlabs/FundWiseSeeker`. The stale emulator entry was removed, the connected Seeker was targeted, and the debug build installed/launched through `npx expo run:android --port 8082` with JDK 17 and Android SDK env vars exported. `npm run typecheck` passes, the app process stayed alive on device, and filtered Android crash logs were empty after the latest JS bundle reload.

The mounted v5 UI now reflects the May 27 device feedback: onboarding skips the long tour and goes straight to wallet authorization, the dashboard starts clean with no demo groups/activity/balances, the bottom plus opens New group instead of share/link actions, the create-group sheet is keyboard-aware and scrollable so the primary button is pressable above device navigation, and the dashboard/bottom nav respect Android status/navigation safe areas.

Roadmap alignment: FundWise ADR-0046 moved the immediate June launch path to mobile web -> Add to Home Screen PWA -> TWA/APK. This React Native Seeker app is now the native companion/follow-on surface for Android App Links, mobile previews, dApp Store packaging, and later native transaction intents. It should not block the web/PWA beta unless a shared handoff contract breaks.

## Next App TODO

Pick up here next:

1. Continue real-device QA on the connected Seeker: onboarding, wallet approval/reject/retry, dashboard empty state, New group, Add expense after group creation, Settle picker empty state, proposal, invite, notification bell, and Wallet tab.
2. Exercise the create-group sheet with keyboard open/closed and Android navigation visible; verify the mode cards, token chips, and primary button remain reachable.
3. Test Android App Links for `https://fundwise.fun/groups`, `/join`, `/settle/r/{requestId}`, and `/receipts/{id}` against the devnet-backed FundWise environment.
4. Test Fundy Telegram redirects from the app, including group-aware `startgroup` links.
5. Test wallet connect, reject, retry, background/resume, and recovered-link behavior with Solana Mobile Wallet and/or Solflare.
6. Fix remaining device-only UI issues: text overflow, Android back behavior, popup placement, sheet height edge cases, and Telegram button behavior.
7. Build/share a UAT APK only after the real-device app flow passes without relying on an active Metro session.

Out of scope for the next app pass: Supabase migrations, mainnet rehearsal, and production secret setup. Those belong to the full FundWise product launch gate, not the immediate Seeker app QA loop.

Update:

- 2026-06-09 Seeker UI refresh + wallet-connect shipped (committed and pushed to `main`): (1) **UI** — bundled the real Tanker / General Sans / JetBrains Mono faces via `expo-font` with a `useFonts` gate in `App.tsx`, re-faced the live screen's `serif`/`mono`, routed 84 `StyleSheet` text entries through per-weight General Sans (ad-hoc codemod), retuned the hard shadows to 5/5 + added an 8/8 FAB shadow, and aligned the split/fund mode badges to the green-pale / blue-pale tokens (commit `c1cd2f8`). (2) **Wallet-connect** — replaced the raw `transact()`+`authorize()`+`signMessages()` path with `useMobileWallet().connect()` so the `@wallet-ui` SDK owns the MWA auth token and persists the authorization (the connected address now survives app restart; reconnects reuse the token), derived `walletAddress` solely from the SDK `account`, added a Disconnect action + a 60s wallet-call timeout, made the wallet picker informational (MWA can't target a specific wallet), and kept the per-action `signMessages` approval for settle/deposit/vote (commit `81970fc`). Router-app (`/Volumes/Sarthi/Router_labs/Router-app`) was the wallet reference. `npm run typecheck` green on both; each commit went through a multi-agent adversarial review (one regression caught + fixed). REMAINING: on-device QA on the connected Seeker (`npx expo run:android` — `adb` not on this machine), and the Android release-cert SHA-256 fingerprint for App Links / TWA.
- 2026-06-08 UI refresh (kickoff; shipped 2026-06-09 — see [ui-refresh-plan.md](./ui-refresh-plan.md)): kicked off a full UI update of the live `FundWiseSeekerAppScreen` to match the new FundWise web "Playground" design system. Mapped both apps: the palettes already match ~95% (this is a typography/shadow/component-style port, not a recolor). Decisions locked with user — (1) bundle the real Tanker + General Sans + JetBrains Mono faces via `expo-font`, (2) scope to the live screen + `src/theme/*` + `App.tsx` only (skip unused V2/onboarding alternates), (3) tokens + shared style helpers, no `src/ui/` rewrite. DONE: downloaded the 8 real TTFs into `assets/fonts/` (Tanker-Regular, GeneralSans-Regular/Medium/Semibold/Bold, JetBrainsMono-Regular/Medium/SemiBold — all verified valid TrueType). DONE 2026-06-09 (commit `c1cd2f8`): `expo-font` install, `src/theme/fonts.ts`, `App.tsx` loader, the serif/mono 2-line re-face (`FundWiseSeekerAppScreen.tsx:3578-3579`), the General-Sans body codemod over the single `StyleSheet.create` (line 3595→end), hard-shadow retune (`:3580-3593`) + press-lift, and color-token fill-ins. Full resume steps with line numbers in `docs/ui-refresh-plan.md`.
- 2026-05-27 real-device pass: installed and launched the updated debug app on the connected Seeker via `npx expo run:android --port 8082`; `npm run typecheck` passed; Android process stayed alive; filtered `AndroidRuntime`, `ReactNativeJS`, `Expo`, and `System.err` crash logs were empty.
- Reduced onboarding friction by making the welcome CTA start wallet authorization directly instead of forcing the tour. The existing tour component remains available through replay paths but no longer blocks signup.
- Removed demo dashboard state from the mounted screen. Fresh sessions now start with empty groups, no activity, zero balances, neutral wallet totals, and explicit empty states with a Create group action.
- Rewired bottom plus actions to open New group directly. The old quick-action/share-style sheet is no longer the bottom-nav path, which removes the unexpected link/share text from the plus button.
- Added local empty group creation for Split and Fund modes so Create group produces a real in-memory group and returns to the Groups view without invite/share copy as the primary result.
- Fixed Android top/bottom safe-area behavior in the mounted screen: status bar is non-translucent, dashboard content has status-bar padding, bottom nav participates in layout instead of overlaying content, detail/action bars include bottom safe padding, and the fake gesture pill is hidden.
- Fixed the create-group usability blocker: bottom sheets are wrapped in a keyboard-aware frame, sheet content scrolls with extra bottom padding, and Split/Fund selection is now presented as two larger mode cards.
- Linked EAS project `@sarthiii/fundwise-seeker` in `app.json` (`projectId: e8b27a7f-9a8c-4a87-ab2e-94cf258c86c9`) and submitted devnet Android build `947e7fc2-55b4-4dc2-b09c-3d8bd6655d99`. Last checked on 2026-05-26: EAS status is `IN_QUEUE` and no artifact URL is available yet.
- Built and installed the local native debug APK successfully with JDK 17 and Android SDK configured. Output: `android/app/build/outputs/apk/debug/app-debug.apk` (68 MB). The 2026-05-27 install/launch path succeeded on the connected Seeker after exporting Android SDK paths from the moved volume checkout.
- Device QA finding: the installed Seeker package was still `versionName=0.1.0`, `versionCode=1`; loading the current Metro bundle into that stale binary produced `PlatformConstants could not be found`, which is a JS/native dev-client mismatch rather than a repo code fix. The fresh `0.1.1` APK is the real validation target.
- Prepared `v0.1.1` as a devnet APK path on the normal `https://fundwise.fun` host: app/package version `0.1.1`, Android versionCode `2`, EAS `devnet` profile, `.env.devnet.example`, and `npm run verify:devnet`.
- Kept `npm run verify:production` as the later mainnet gate so the devnet path does not weaken production readiness checks.
- Added `AGENTS.md` and `npm run verify:fundwise-sync` so future Seeker changes check the sibling FundWise source only when shared contracts or handoff surfaces are touched.
- Synced the Seeker repo with the latest FundWise ADR-0046/ADR-0047 launch order: mobile web/PWA/TWA first, Split Mode mainnet beta, then narrow LI.FI/CCTP route-then-settle funding.
- Added [production-launch-gate.md](./production-launch-gate.md) to link the HITL env, Supabase migration, mobile QA, tiny mainnet rehearsal, and Seeker/TWA APK steps back to FundWise source docs and migrations.
- Added Android App Link coverage for `beta.fundwise.fun` and `/join` alongside existing `fundwise.fun`, `/groups`, `/settle/r`, and `/receipts`.
- Added `EXPO_PUBLIC_FUNDWISE_ALLOWED_HOSTS` so native link recovery can accept both beta and production FundWise hosts without accepting arbitrary external hosts.
- Wired the Telegram sheet to the Fundy agent bot redirect with configurable `EXPO_PUBLIC_FUNDY_TELEGRAM_URL` and group-aware Telegram `startgroup` links.
- Added v5-style in-app notification popups for notification bell taps, invite/Fundy shares, and draft-safe sheet completions such as Expense added, Proposal opened, and Group created.
- Added `npm run verify:production` and `npm run verify:production:strict` to smoke-check app-link host/path coverage and mainnet RPC posture before APK/TWA release work.
- Generated the native Expo Android project in `android/` for Android Studio inspection.
- Reworked the UI against the FundWise mobile prototypes from `FundWise/design/app/mobile.jsx`: Strata-style mark, light FundWise green surfaces, compact link cards, hero handoff panel, and bottom navigation.
- Reworked first-run onboarding to match the approved Seeker Android HTML review direction: link recovery inbox, MWA wallet trust boundary, and phone-to-PC continuation.
- Kept reduced-motion support, AsyncStorage completion persistence, and the Replay Intro action.
- Added branded launcher icon config through `assets/icon.png` and `android.adaptiveIcon`.
- Reworked the home screen into an Android-first Seeker flow: connect wallet, recover Group state, continue on web/PC.
- Added explicit system copy that protected reads, money movement, and receipt verification remain owned by the FundWise web app.
- Added API status retry and accessibility labels/hints for the main mobile actions.
- Added the phone-to-web handoff panel. The app now exposes the current FundWise link, opens it in the web app, and shares the same URL through the native Android share sheet so a user can start on phone and continue on desktop or PC.
- Corrected invite lookup against the real FundWise API response shape. `GET /api/groups?code=...` returns a Group row or `null`, not `{ group }`.
- Added a FundWise link parser for Group links, invite links, Settlement request links, and Settlement receipt links.
- Persisted the latest incoming app link with AsyncStorage so device testers can recover the last FundWise handoff after restart.
- The Seeker home screen now previews the latest link, pre-fills invite codes from links, and provides Open / Clear actions.
- Added lightweight Seeker device detection from React Native Platform constants for UI treatment only.
- Added a dApp Store APK build profile and local Android release signing path that reads keystore settings from environment variables.
- Recorded the MWA platform boundary: Android native is supported; iOS is not a target for this MWA flow.
- Cross-checked the current wallet integration against the React Native install/setup docs: `react-native-quick-crypto` loads first through `index.js`, `MobileWalletProvider` wraps the app, and the onboarding approval path uses direct MWA `transact` from `@solana-mobile/mobile-wallet-adapter-protocol-web3js`.
- Added recommended wallet choices for Seeker-native Solana Mobile Wallet, Solflare, and other MWA-compatible wallets.
- Wired persisted incoming-link recovery into the currently mounted `FundWiseSeekerAppScreen`, not only the legacy `SeekerHomeScreen`.
- Expanded FundWise link parsing to cover `/settle/r/{requestId}`, `/receipts/{receiptId_or_tx_signature}`, and configurable Receipt service `/v1/receipts` and `/v1/graph/receipts` links.
- Expanded Android intent filters for `https://fundwise.fun/groups`, `/join`, `/settle/r`, and `/receipts`.
- Changed native settlement and deposit sheets back to web continuation instead of presenting message signing as payment.
- Aligned default mobile cluster/RPC config with mainnet defaults.
- Matched the mounted RN UI to the `design/` Seeker App spec with Ionicons controls, compact card hierarchy, green hero treatment, and prototype-style group/activity glyphs.
- Cross-checked the updated FundWise roadmap: FW-091 remains blocked on the release signing certificate SHA-256 fingerprint; FW-092 and FW-093 are shipped on the FundWise side; FW-094/FW-095/FW-096 are native-money-movement follow-ups, not web/PWA beta blockers.
- Added Seeker-native support for the FundWise mobile Settlement Request preview API. Incoming `/settle/r/{requestId}` links now show a redacted live preview after wallet authorization, including amount/role when ready and clear expired/wrong-wallet/not-member/not-settleable states.
- Persisted the latest MWA-authorized wallet address in component state so direct `transact` approvals can drive native preview requests even when the Wallet UI provider has not populated `account`.
- Captured the UX research in `.superstack/learnings.md` and [SADR-006](../plans/SADR/SADR-006-link-first-seeker-onboarding.md): Seeker should be link-first, explicit about wallet consent, and honest as a recovery/preview/handoff app until native transaction intent and recovery APIs ship.
- Implemented the first SADR-006 slice in the mounted RN app: onboarding completion now persists, recovered links can bypass generic onboarding, MWA no longer opens automatically, `/settle/r` links render a larger preview/recovery card, preview retry is available, and FundWise handoff prefers preview fallback URLs or concrete group routes.

## Product Decision

`FundWiseSeeker` is a sibling app under `fundlabs`, not a folder inside `FundWise`.

Reason:

- `FundWise` stays Next.js web app + HTTP API source of truth.
- `FundWiseSeeker` owns Android / Solana Mobile / Seeker client concerns.
- Native build deps, app links, APK packaging, MWA testing, Android SDK setup stay separate from Cloudflare / Next.js web deployment.

## Skills Used

Registered skill:

- `build-mobile`

Unregistered local Seeker skills found after parent `Build` search:

- `/Users/sarthiborkar/Build/seeker-skills/seeker-app/seeker-app-builder/SKILL.md`
- `/Users/sarthiborkar/Build/seeker-skills/seeker-app/seeker-app-scaffold/SKILL.md`
- `/Users/sarthiborkar/Build/seeker-skills/seeker-app/seeker-ux/SKILL.md`
- `/Users/sarthiborkar/Build/solana-mobile-dev-skill/mwa/mwa-setup/SKILL.md`

Docs checked:

- Solana Mobile React Native install/setup docs
- Solana Mobile Seeker docs
- Solana dApp Store docs
- Mobile Wallet Adapter docs

## Scaffold Created

Root:

- `FundWiseSeeker/`

Core config:

- `package.json`
- `package-lock.json`
- `app.json`
- `tsconfig.json`
- `babel.config.js`
- `.env.example`
- `.gitignore`

Entrypoints:

- `index.js`
- `polyfill.js`
- `App.tsx`

Docs:

- `README.md`
- `docs/architecture.md`
- `docs/progress.md`
- `docs/solana-mobile-crosscheck.md`

Source:

- `src/config.ts`
- `src/theme/colors.ts`
- `src/screens/SeekerHomeScreen.tsx`
- `src/screens/SeekerOnboardingScreen.tsx`
- `src/components/ActionButton.tsx`
- `src/components/StatusPill.tsx`
- `src/hooks/useIncomingFundWiseLink.ts`
- `src/hooks/useNetworkStatus.ts`
- `src/lib/fundwise-api.ts`
- `src/lib/short-address.ts`

Shared handoff:

- `.superstack/build-context.md`

## Stack

- React Native
- Expo SDK 55 custom dev build
- `@wallet-ui/react-native-web3js`
- `@solana/web3.js`
- `@solana-mobile/mobile-wallet-adapter-protocol`
- `react-native-quick-crypto`
- `@react-native-community/netinfo`
- `expo-haptics`
- `expo-build-properties`

## Current App Behavior

Implemented:

- MWA provider in `App.tsx`
- direct MWA `authorize` plus `signMessages` proof in the FundWise onboarding approval flow
- first-run welcome CTA can continue directly to wallet authorization instead of forcing a multi-step tour
- Wallet UI `useMobileWallet` hook for legacy connect/disconnect in `SeekerHomeScreen`
- Solana chain/RPC config via Expo public env vars
- FundWise API base URL config
- configurable Receipt service URL for link recovery
- first-run animated onboarding
- onboarding screens for link recovery, MWA handoff, and continuation URL handoff
- reduced-motion handling via Android accessibility state
- onboarding completion persistence through AsyncStorage
- onboarding replay action from the Wallet Boundary panel
- wallet connect/disconnect UI
- wallet address display
- Android-first launch steps for wallet connect -> Group recovery -> web/PC continuation
- network online/offline state
- app background/return tracking for wallet handoff
- FundWise `/api/health` check
- public invite-code lookup through `GET /api/groups?code=...`
- latest incoming FundWise link persistence and parsing
- lightweight Seeker device signal from `Platform.constants.Model`
- FundWise link previews for Groups, invite links, Settlement requests, Settlement links, Settlement receipts, and Receipt Graph links
- redacted live Settlement Request previews from `/api/mobile/settlement-requests/{requestId}/preview?wallet=...`
- Android app link intent filters for `https://fundwise.fun/groups`, `/join`, `/settle/r`, and `/receipts`
- Android app link intent filters for `https://beta.fundwise.fun/groups`, `/join`, `/settle/r`, and `/receipts`
- open FundWise Groups in browser/web app
- open incoming FundWise link
- open or share the current FundWise continuation link for phone -> web / desktop handoff
- retry FundWise API health checks from the app
- FundWise mobile prototype palette and Strata-style mark
- generated Android Studio project in `android/`
- mounted v5 dashboard starts empty without hard-coded demo groups/activity/balances
- bottom plus opens New group directly
- local empty Split/Fund group creation in the mounted UI
- keyboard-aware, scrollable bottom sheets with Android bottom-safe padding
- Android status/nav safe-area handling for dashboard, detail actions, onboarding footer, and bottom nav
- 56 px primary tap targets
- tap haptics

Intentionally not implemented yet:

- native settlement transaction construction
- native contribution transaction construction
- wallet-signed FundWise browser session replacement
- protected Group dashboard reads in native app
- receipt persistence from native tx
- dApp Store publishing assets
- production `assetlinks.json` on `fundwise.fun`
- secure SGT / Seeker-owner gating
- `.skr` address resolution

Reason: FundWise web/PWA/TWA remains the launch and money-moving source of truth until native intents, confirm/recovery APIs, and receipt status are tested end to end on Android with an MWA wallet.

## Seeker Skill Fixes Applied

From Seeker skills:

- MWA dev client required; Expo Go not enough.
- `react-native-quick-crypto` polyfill must be first import.
- use `@wallet-ui/react-native-web3js`.
- Android `minSdkVersion` must be 26.
- dApp Store expects APK, not AAB.
- no private keys in app code.
- Seeker UX: AMOLED black, 56 px primary actions, haptics.

Applied:

- `polyfill.js` installs `react-native-quick-crypto` first through `index.js`.
- `app.json` uses `expo-build-properties` with `android.minSdkVersion = 26`.
- `src/theme/colors.ts` defines the FundWise mobile prototype palette.
- `ActionButton` uses 56 px height and tap haptics.
- `README.md` documents APK / dApp Store constraints.
- `eas.json` includes a `dapp-store` profile that builds Android APKs.
- local `android/app/build.gradle` release signing reads `FUNDWISE_DAPP_STORE_*` keystore settings when present.

## Validation Run

Passed:

```bash
cd /Volumes/Sarthi/fundlabs/FundWiseSeeker
npm install
npm run typecheck
npm exec expo -- install --check
npm exec expo -- config --type public
```

Latest validation:

```bash
cd /Volumes/Sarthi/fundlabs/FundWiseSeeker
npm run typecheck
npx tsx -e "import { parseFundWiseLink } from './src/lib/fundwise-link.ts'; console.log(parseFundWiseLink('https://fundwise.fun/settle/r/req123', 'https://fundwise.fun', 'https://fundwise.fun'))"
npm exec expo -- install --check
npx expo prebuild --platform android --no-install
./android/gradlew assembleDebug
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ANDROID_HOME=/Users/sarthiborkar/Library/Android/sdk ANDROID_SDK_ROOT=/Users/sarthiborkar/Library/Android/sdk npx expo run:android --port 8082
```

Result:

- `npm run typecheck`: pass.
- 2026-05-27 `npx expo run:android --port 8082`: pass after exporting `JAVA_HOME`, `ANDROID_HOME`, and `ANDROID_SDK_ROOT`; debug app installed/opened on the connected Seeker and Metro reloaded the updated JS bundle.
- 2026-05-27 filtered on-device crash logs after launch: empty for `AndroidRuntime`, `ReactNativeJS`, `Expo`, and `System.err`.
- Native preview API client compile check: pass.
- Parser smoke check for `/groups`, `/settle/r`, `/receipts`, and `/v1/graph/receipts`: pass.
- `npm exec expo -- install --check`: pass using local Expo dependency map because command context is offline.
- `npx expo prebuild --platform android --no-install`: pass, `android/` generated.
- `./android/gradlew assembleDebug`: previously blocked when Java was not visible; current local debug build succeeds when `JAVA_HOME` points at Homebrew JDK 17.
- Local debug APK path: `android/app/build/outputs/apk/debug/app-debug.apk`. Treat it as a dev-client/test artifact, not release evidence.
- `./android/gradlew assembleRelease`: previously blocked by `No space left on device` while compiling release native libraries; no release APK has been produced yet.

Notes:

- Expo dependency check used local SDK map because network unavailable in command context.
- Public config shows Android package `fun.fundwise.seeker`.
- Public config shows app link filters for `https://fundwise.fun` and `https://beta.fundwise.fun` on `/groups`, `/join`, `/settle/r`, and `/receipts`.
- Public config shows `minSdkVersion: 26`.

Audit:

```bash
npm audit --omit=dev
```

Result:

- 4 moderate advisories through Expo Metro/PostCSS chain.
- `npm audit fix --force` suggests breaking Expo downgrade.
- No force fix applied.

## Local Blockers

The generated Android project is present and the debug build/install path works when JDK 17 and Android SDK paths are exported.

Remaining blockers:

- MWA wallet connection still needs a fuller physical-device pass with Solana Mobile Wallet and/or Solflare: approve, reject, retry, background/resume, and recovered-link recovery.
- The 2026-05-27 debug install depended on Metro for the latest JS bundle. A shareable UAT APK still needs a build/test pass that does not rely on an active Metro session.
- `https://fundwise.fun/.well-known/assetlinks.json` now has a FundWise route, but production verification still requires the real Seeker release signing cert SHA-256 fingerprint in `FUNDWISE_SEEKER_ANDROID_CERT_SHA256_FINGERPRINTS`.
- dApp Store release signing still needs a real keystore and `FUNDWISE_DAPP_STORE_*` secret values.
- Release packaging may still need more free disk plus signing secrets.

## Next Steps

1. Continue on the connected Seeker or another Android device with a real MWA-compatible wallet.
2. Run the volume-aware Android command:

```bash
cd /Volumes/Sarthi/fundlabs/FundWiseSeeker
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ANDROID_HOME=/Users/sarthiborkar/Library/Android/sdk ANDROID_SDK_ROOT=/Users/sarthiborkar/Library/Android/sdk npx expo run:android --port 8082
```

3. Test wallet connect with Solana Mobile Wallet, Solflare, or Mock MWA Wallet.
4. Test app link open from `https://fundwise.fun/groups?...`, `https://fundwise.fun/join/...`, `https://fundwise.fun/settle/r/...`, and `https://fundwise.fun/receipts/...`, then repeat on `https://beta.fundwise.fun`.
5. Test invite lookup against prod FundWise.
6. Add native FundWise auth strategy or keep web handoff for protected reads.
7. Confirm the shipped Split Mode mobile preview API against a deployed FundWise host and a real wallet on Android, then wait for FW-094/FW-095 before enabling native settlement.
8. Add dApp Store publishing checklist.

## Current Safety Boundary

No private keys stored.

No native autonomous money movement.

All money-moving flows still hand off to FundWise web app for wallet confirmation.
