# FundWise Seeker Progress

## Snapshot

Date: 2026-05-17

Status: scaffold ready, local typecheck passing, Android device run blocked by missing local Android toolchain.

Update:

- Corrected invite lookup against the real FundWise API response shape. `GET /api/groups?code=...` returns a Group row or `null`, not `{ group }`.
- Added a FundWise link parser for Group links, invite links, Settlement request links, and Settlement receipt links.
- Persisted the latest incoming app link with AsyncStorage so device testers can recover the last FundWise handoff after restart.
- The Seeker home screen now previews the latest link, pre-fills invite codes from links, and provides Open / Clear actions.

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

Source:

- `src/config.ts`
- `src/theme/colors.ts`
- `src/screens/SeekerHomeScreen.tsx`
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
- `react-native-get-random-values`
- `@react-native-community/netinfo`
- `expo-haptics`
- `expo-build-properties`

## Current App Behavior

Implemented:

- MWA provider in `App.tsx`
- Solana chain/RPC config via Expo public env vars
- FundWise API base URL config
- wallet connect/disconnect UI
- wallet address display
- network online/offline state
- app background/return tracking for wallet handoff
- FundWise `/api/health` check
- public invite-code lookup through `GET /api/groups?code=...`
- latest incoming FundWise link persistence and parsing
- FundWise link previews for Groups, invite links, Settlement requests, and Settlement receipts
- Android app link intent filter for `https://fundwise.fun/groups`
- open FundWise Groups in browser/web app
- open incoming FundWise link
- Seeker AMOLED palette
- 56 px primary tap targets
- tap haptics

Intentionally not implemented yet:

- native settlement transaction construction
- native contribution transaction construction
- wallet-signed FundWise browser session replacement
- protected Group dashboard reads in native app
- receipt persistence from native tx
- dApp Store publishing assets
- SGT / Seeker-owner gating
- `.skr` address resolution

Reason: FundWise web app remains money-moving source of truth until native flow is tested end to end on Android with MWA wallet.

## Seeker Skill Fixes Applied

From Seeker skills:

- MWA dev client required; Expo Go not enough.
- crypto RNG polyfill must be first import.
- use `@wallet-ui/react-native-web3js`.
- Android `minSdkVersion` must be 26.
- dApp Store expects APK, not AAB.
- no private keys in app code.
- Seeker UX: AMOLED black, 56 px primary actions, haptics.

Applied:

- `polyfill.js` imports `react-native-get-random-values` first through `index.js`.
- `app.json` uses `expo-build-properties` with `android.minSdkVersion = 26`.
- `src/theme/colors.ts` defines Seeker AMOLED palette.
- `ActionButton` uses 56 px height and tap haptics.
- `README.md` documents APK / dApp Store constraints.

## Validation Run

Passed:

```bash
cd /Users/sarthiborkar/Build/fundlabs/FundWiseSeeker
npm install
npm run typecheck
npm exec expo -- install --check
npm exec expo -- config --type public
```

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

Android run blocked on this machine:

- Java runtime missing.
- `ANDROID_HOME` missing.
- Android SDK / emulator not configured.

Observed:

```bash
java -version
```

returned:

```text
Unable to locate a Java Runtime.
```

Required before device/emulator run:

- install JDK 17
- install Android Studio / Android SDK
- configure `ANDROID_HOME`
- install platform tools / `adb`
- connect Android device or start emulator
- install Mock MWA Wallet or real MWA-compatible wallet

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
