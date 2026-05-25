# Solana Mobile Cross-Check

Date: 2026-05-25

This notes how the current FundWise Seeker app maps to the Solana Mobile resources reviewed from the docs index at `https://docs.solanamobile.com/llms.txt`.

## React Native Installation

Docs direction:

- install `@wallet-ui/react-native-web3js`, `react-native-quick-crypto`, `@solana/web3.js`, and `expo-dev-client`
- import `polyfill.js` before any Solana code
- use a custom Expo development build instead of Expo Go

Current app:

- `package.json` has those dependencies
- `index.js` imports `./polyfill` before registering the app
- `polyfill.js` installs `react-native-quick-crypto`
- `npm run android` uses `expo run:android`

## React Native Setup

Docs direction:

- wrap the root in `MobileWalletProvider`
- provide `chain`, `endpoint`, and `identity`
- consume wallet state and actions through `useMobileWallet`

Current app:

- `App.tsx` wraps the full app in `MobileWalletProvider`
- `src/config.ts` owns FundWise identity, chain, and endpoint
- `FundWiseSeekerAppScreen` uses the provider context for display state and direct MWA sessions for fresh approval
- `SeekerHomeScreen` keeps the legacy `useMobileWallet` connect/disconnect path

## Direct MWA Sessions

Docs direction:

- use direct `transact` from `@solana-mobile/mobile-wallet-adapter-protocol-web3js` only when bypassing higher-level Wallet UI
- the web3js wrapper is preferred over importing `transact` from the base protocol package
- direct sessions are the right place for SIWS, message signing, and wallet-submitted transaction flows

Current app:

- `FundWiseSeekerAppScreen` uses direct `transact` for wallet authorization plus a message-signing proof
- the approval path avoids SIWS-first and cached auth-token reuse while testing Seeker wallet compatibility
- the last MWA-authorized wallet address is retained in memory so native preview APIs can query with the verified viewer wallet
- protected reads and money movement still hand off to FundWise web
- future secure Seeker verification should use SIWS plus backend SGT checks

## Android App Links

Current app:

- `app.json` declares verified links for `https://fundwise.fun` and `https://beta.fundwise.fun` on `/groups`, `/join`, `/settle/r`, and `/receipts`
- `useIncomingFundWiseLink` persists the latest incoming link with AsyncStorage
- `FundWiseSeekerAppScreen` surfaces the recovered link in the mounted home screen
- incoming `/settle/r/{requestId}` links call the FundWise mobile preview API after wallet authorization and render redacted role/amount/status copy before opening the web fallback
- FundWise now has a `/.well-known/assetlinks.json` route; production and beta verification still require the real release signing cert SHA-256 fingerprint in `FUNDWISE_SEEKER_ANDROID_CERT_SHA256_FINGERPRINTS`

## FundWise Mobile Roadmap Boundary

FundWise ADR-0046 makes mobile web, Add to Home Screen PWA, and TWA/APK the launch-critical mobile path for Split Mode. This React Native app remains useful for Solana Mobile / Seeker-specific behavior, Android App Link recovery, dApp Store packaging, and future native transaction intents, but it should not be treated as a replacement for the FundWise web/PWA surface.

## Mobile Wallet Adapter Platform Boundary

Docs direction:

- Android native has full MWA support
- Chrome on Android can support MWA for mobile web/PWA use cases
- iOS is not supported by MWA

Current app:

- Android is the only native target for this wallet flow
- no iOS target is implied for the MWA-based app
- PWA/TWA publishing is now the primary June beta path in FundWise; the RN app is the native companion path

## Detecting Seeker Users

Docs direction:

- `Platform.constants.Model === "Seeker"` is lightweight and spoofable
- guaranteed Seeker ownership requires SIWS plus Seeker Genesis Token verification on a backend

Current app:

- `src/lib/seeker-device.ts` implements the lightweight Platform constants check
- the home screen only uses it as a device signal
- SGT-backed gating remains out of scope until backend verification is added

## Build And Sign APK

Docs direction:

- dApp Store accepts signed APK files
- Expo can build APKs with an EAS profile using `android.buildType = "apk"`
- native Android release signing should use a dApp Store-specific keystore
- verify the final release APK with `apksigner verify --print-certs`

Current app:

- `eas.json` includes a `dapp-store` APK profile
- local generated `android/app/build.gradle` can read `FUNDWISE_DAPP_STORE_*` signing variables
- an earlier debug APK build succeeded, but the current shell needs a visible Java runtime before rebuilding
- release packaging needs free disk, Java, plus real signing secrets before final verification
