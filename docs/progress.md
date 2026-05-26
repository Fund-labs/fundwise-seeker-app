# FundWise Seeker Progress

## Snapshot

Date: 2026-05-26

Status: `v0.1.1` is prepared as a normal-host devnet APK (`https://fundwise.fun` + Solana devnet). Local typecheck, Expo dependency check, devnet verifier, production verifier, and FundWise sync guardrail pass. EAS project `@sarthiii/fundwise-seeker` is linked and devnet build `947e7fc2-55b4-4dc2-b09c-3d8bd6655d99` has been submitted. A local Android debug APK was built successfully at `android/app/build/outputs/apk/debug/app-debug.apk`. Fresh on-device install is still pending because ADB stopped seeing the Seeker after the stale `0.1.0` debug-client mismatch was identified.

Roadmap alignment: FundWise ADR-0046 moved the immediate June launch path to mobile web -> Add to Home Screen PWA -> TWA/APK. This React Native Seeker app is now the native companion/follow-on surface for Android App Links, mobile previews, dApp Store packaging, and later native transaction intents. It should not block the web/PWA beta unless a shared handoff contract breaks.

## Next App TODO

Pick up here next:

1. Reconnect the Seeker so `adb devices -l` shows it again, then install the fresh `v0.1.1` APK.
2. QA the mounted v5 UI: onboarding, bottom sheets, popup timing, notification bell, add expense, create group, proposal, invite, and Fundy Telegram sheet.
3. Test Fundy Telegram redirects from the app, including group-aware `startgroup` links.
4. Test Android App Links for `https://fundwise.fun/groups`, `/join`, `/settle/r/{requestId}`, and `/receipts/{id}` against the devnet-backed FundWise environment.
5. Test wallet connect, reject, retry, background/resume, and recovered-link behavior with Solana Mobile Wallet and/or Solflare.
6. Fix device-only UI issues: text overflow, sheet scrolling, Android back behavior, popup placement, and Telegram button behavior.
7. Publish/share the UAT APK only after the fresh APK passes on-device QA.

Out of scope for the next app pass: Supabase migrations, mainnet rehearsal, and production secret setup. Those belong to the full FundWise product launch gate, not the immediate Seeker app QA loop.

Update:

- Linked EAS project `@sarthiii/fundwise-seeker` in `app.json` (`projectId: e8b27a7f-9a8c-4a87-ab2e-94cf258c86c9`) and submitted devnet Android build `947e7fc2-55b4-4dc2-b09c-3d8bd6655d99`. Last checked on 2026-05-26: EAS status is `IN_QUEUE` and no artifact URL is available yet.
- Built the local native debug APK successfully with JDK 17 and Android SDK configured. Output: `android/app/build/outputs/apk/debug/app-debug.apk` (68 MB). Install/launch QA is blocked until the Seeker reconnects to ADB.
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
cd /Users/sarthiborkar/Build/fundlabs/FundWiseSeeker
npm install
npm run typecheck
npm exec expo -- install --check
npm exec expo -- config --type public
```

Latest validation:

```bash
cd /Users/sarthiborkar/Build/fundlabs/FundWiseSeeker
npm run typecheck
npx tsx -e "import { parseFundWiseLink } from './src/lib/fundwise-link.ts'; console.log(parseFundWiseLink('https://fundwise.fun/settle/r/req123', 'https://fundwise.fun', 'https://fundwise.fun'))"
npm exec expo -- install --check
npx expo prebuild --platform android --no-install
./android/gradlew assembleDebug
```

Result:

- `npm run typecheck`: pass.
- Native preview API client compile check: pass.
- Parser smoke check for `/groups`, `/settle/r`, `/receipts`, and `/v1/graph/receipts`: pass.
- `npm exec expo -- install --check`: pass using local Expo dependency map because command context is offline.
- `npx expo prebuild --platform android --no-install`: pass, `android/` generated.
- `./android/gradlew assembleDebug`: blocked in the current shell because no Java runtime is visible.
- Existing debug APK from the earlier successful build remains at `android/app/build/outputs/apk/debug/app-debug.apk`, but it was not rebuilt after the latest Seeker-side link fixes.
- `./android/gradlew assembleRelease`: blocked by `No space left on device` while compiling release native libraries; no release APK produced.

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

The generated Android project is present, but the current shell cannot see a Java runtime for Gradle.

Remaining runtime blocker:

- Install or expose a JDK, then rerun `./android/gradlew assembleDebug`.
- No Android device or emulator was connected during the latest validation.
- MWA wallet connection still needs physical-device or emulator testing with Mock MWA Wallet or a real MWA-compatible wallet.
- `https://fundwise.fun/.well-known/assetlinks.json` now has a FundWise route, but production verification still requires the real Seeker release signing cert SHA-256 fingerprint in `FUNDWISE_SEEKER_ANDROID_CERT_SHA256_FINGERPRINTS`.
- dApp Store release signing still needs a real keystore and `FUNDWISE_DAPP_STORE_*` secret values.
- Local disk had 5.3 GiB free during this pass; release packaging may still need more free disk plus signing secrets.

## Next Steps

1. Connect an Android device/emulator with Mock MWA Wallet or a real MWA-compatible wallet.
2. Run:

```bash
cd /Users/sarthiborkar/Build/fundlabs/FundWiseSeeker
npm run android
```

3. Test wallet connect with Mock MWA Wallet.
4. Test app link open from `https://fundwise.fun/groups?...`, `https://fundwise.fun/join/...`, `https://fundwise.fun/settle/r/...`, and `https://fundwise.fun/receipts/...`, then repeat on `https://beta.fundwise.fun`.
5. Test invite lookup against prod FundWise.
6. Add native FundWise auth strategy or keep web handoff for protected reads.
7. Confirm the shipped Split Mode mobile preview API against a deployed FundWise host and a real wallet on Android, then wait for FW-094/FW-095 before enabling native settlement.
8. Add dApp Store publishing checklist.

## Current Safety Boundary

No private keys stored.

No native autonomous money movement.

All money-moving flows still hand off to FundWise web app for wallet confirmation.
