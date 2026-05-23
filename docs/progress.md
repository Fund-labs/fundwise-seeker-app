# FundWise Seeker Progress

## Snapshot

Date: 2026-05-19

Status: Android Studio project generated, local typecheck passing, device/emulator run blocked by missing local Android toolchain.

Update:

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
- FundWise link previews for Groups, invite links, Settlement requests, and Settlement receipts
- Android app link intent filter for `https://fundwise.fun/groups`
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
- secure SGT / Seeker-owner gating
- `.skr` address resolution

Reason: FundWise web app remains money-moving source of truth until native flow is tested end to end on Android with MWA wallet.

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
npm exec expo -- install --check
npx expo prebuild --platform android --no-install
./android/gradlew assembleDebug
```

Result:

- `npm run typecheck`: pass.
- `npm exec expo -- install --check`: pass using local Expo dependency map because command context is offline.
- `npx expo prebuild --platform android --no-install`: pass, `android/` generated.
- `./android/gradlew assembleDebug`: pass with JDK 17 and Android SDK configured.
- Debug APK generated at `android/app/build/outputs/apk/debug/app-debug.apk`.
- `./android/gradlew assembleRelease`: blocked by `No space left on device` while compiling release native libraries; no release APK produced.

Notes:

- Expo dependency check used local SDK map because network unavailable in command context.
- Public config shows Android package `fun.fundwise.seeker`.
- Public config shows app link filter for `https://fundwise.fun/groups`.
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

Android toolchain is now present enough for native debug APK builds.

Remaining runtime blocker:

- No Android device or emulator was connected during the latest validation.
- MWA wallet connection still needs physical-device or emulator testing with Mock MWA Wallet or a real MWA-compatible wallet.
- dApp Store release signing still needs a real keystore and `FUNDWISE_DAPP_STORE_*` secret values.
- Local disk had only 133 MiB free after the release attempt, which is not enough for native release packaging.

## Next Steps

1. Install Android toolchain.
2. Run:

```bash
cd /Users/sarthiborkar/Build/fundlabs/FundWiseSeeker
npm run android
```

3. Test wallet connect with Mock MWA Wallet.
4. Test app link open from `https://fundwise.fun/groups?...`.
5. Test invite lookup against prod FundWise.
6. Add native FundWise auth strategy or keep web handoff for protected reads.
7. After web mainnet flow stable, build native Settlement/Contribution tx path.
8. Add dApp Store publishing checklist.

## Current Safety Boundary

No private keys stored.

No native autonomous money movement.

All money-moving flows still hand off to FundWise web app for wallet confirmation.
