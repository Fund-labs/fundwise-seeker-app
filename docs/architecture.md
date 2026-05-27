# FundWise Seeker Architecture

## Decision

Build `FundWiseSeeker` as a separate sibling app under `fundlabs`, using the existing `FundWise` web/API app as the source of truth.

Per FundWise ADR-0046, the immediate Split Mode launch path is mobile web, Add to Home Screen PWA, then Trusted Web Activity. This React Native app is the native Seeker companion and follow-on path, not the only mobile launch surface.

## Why Not Inside `FundWise`

The web app is already a deployable Next.js product with Cloudflare, Supabase, wallet-session cookies, and server-side settlement verification. A React Native Android app has different build tooling, native dependencies, app-link config, device testing, and release packaging. Keeping it separate avoids mixing Next.js and native mobile concerns.

## Stack

- React Native + Expo custom dev build
- `@wallet-ui/react-native-web3js` for Mobile Wallet Adapter
- `react-native-quick-crypto` polyfill loaded before Solana libraries
- Existing FundWise HTTP API for shared state
- `expo-build-properties` pins Android `minSdkVersion` to 26 for Seeker/MWA compatibility
- React Native `Platform.constants.Model === "Seeker"` as a lightweight, spoofable device signal for UI treatment

## First Milestone

1. Connect wallet with MWA.
2. Resolve incoming FundWise `/groups`, `/join`, `/settle/r`, and `/receipts` links from beta and production hosts.
3. Preview mobile Settlement Request Links through the FundWise redacted preview API after wallet authorization.
4. Open Group and Settlement flows in the web app.
5. Read public API state such as health and invite lookup.
6. Share the same FundWise continuation URL to desktop/PC through the native Android share sheet.
7. Add native transaction construction only after the web mainnet flow is stable and testable on a physical Android device.

For the June 13 Split Mode beta, the RN milestone is contract compatibility with FundWise mobile handoff routes and Android App Links. Native money movement waits for FundWise FW-094/FW-095.

## Design Source

The Android screen should follow the FundWise mobile prototypes in `FundWise/design/app/mobile.jsx`: Strata-style mark, light FundWise green surfaces, compact cards, grouped status chips, and bottom mobile navigation.

## Android-First Product Shape

The first screen should make the phone role explicit:

- connect a Solana wallet through Mobile Wallet Adapter
- recover an invite, Group, Settlement Request, or Receipt link
- continue the same FundWise state in the web app on phone, desktop, or PC

The current mounted app keeps this path low-friction on Seeker: the welcome CTA can proceed directly to wallet authorization, the dashboard opens as a fresh empty state with no demo ledger data, and the bottom plus action opens New group directly. Split/Fund group creation is local in-memory UI state until protected FundWise group reads/writes are wired.

This is intentionally not a separate ledger. It is a Seeker-native entry and recovery surface for the existing FundWise product.

The production mobile UX should still be judged first on the FundWise web/PWA/TWA flow: wallet browser access, Add to Home Screen behavior, `/settle/r/{requestId}`, `/receipts/{id}`, and mobile preview APIs. The native app should mirror that contract and improve device-native recovery, not fork the product model.

The native preview path stores the last authorized MWA wallet address in memory so `/api/mobile/settlement-requests/{requestId}/preview?wallet=...` can return role, amount, status, expiry, and fallback URL without exposing private Group context.

## Onboarding Motion

The first-run onboarding owns the initial mental model:

- recover a real FundWise link as saved Group state
- connect through Mobile Wallet Adapter only when identity or signing is needed
- continue the same state on web or PC

Motion is limited to short opacity and transform transitions using React Native `Animated`. It respects Android reduced-motion settings through `AccessibilityInfo` and never blocks entry to the app.

## Device Layout Boundary

The Seeker app should respect Android system UI instead of drawing under it. The root status bar is non-translucent, the mounted app adds status-bar padding, bottom navigation participates in normal layout instead of overlaying scroll content, and detail/action bars include bottom-safe padding. Bottom sheets use a keyboard-aware frame plus internal scrolling so primary buttons such as Create group remain reachable above the Android navigation area and software keyboard.

## MWA Platform Boundary

FundWise Seeker targets Android for native wallet interactions. Mobile Wallet Adapter gives full native support on Android and can support mobile web in Chrome for Android, but it does not support native iOS inter-app wallet sessions. Any future iOS surface should be treated as a separate wallet strategy, not a direct port of this MWA flow.

## Android App Links Boundary

The Seeker app declares Android App Links for `https://fundwise.fun` and `https://beta.fundwise.fun` on `/groups`, `/join`, `/settle/r`, and `/receipts`. Production verification still depends on the FundWise/Split Mode hosts serving valid `/.well-known/assetlinks.json` files for package `fun.fundwise.seeker` and the release signing certificate fingerprint.

## Wallet Integration Mode

The root app still uses `MobileWalletProvider` for shared chain, endpoint, and identity configuration. The FundWise onboarding approval screen now uses direct Mobile Wallet Adapter sessions through `transact` from `@solana-mobile/mobile-wallet-adapter-protocol-web3js` so it can request a fresh wallet authorization and message signature without cached auth-token reuse.

Future wallet-submitted transaction flows should use the same web3js wrapper rather than importing `transact` from the base protocol package directly. Keep `polyfill.js` as the first app import before any Solana code.

## Native Android Project

Expo prebuild generates `android/` for Android Studio. The folder is local generated output and remains ignored by git unless the project intentionally moves to a bare/native-owned workflow.

Release signing follows the Solana dApp Store APK requirement. The tracked `eas.json` profile requests an APK build, and the local generated Android project reads dApp Store keystore values from `FUNDWISE_DAPP_STORE_*` environment variables when building `assembleRelease`.

## Seeker Ownership

The app only uses Platform constants for non-critical UI treatment. Guaranteed Seeker-owner checks require a backend flow: SIWS proves wallet ownership, then the server verifies Seeker Genesis Token ownership and unique mint usage.

## Testing Rule

Development can use any Android device or emulator with Mock MWA Wallet. Production readiness requires a physical Android device with a real MWA-compatible wallet.
