# FundWise Seeker Architecture

## Decision

Build `FundWiseSeeker` as a separate sibling app under `fundlabs`, using the existing `FundWise` web/API app as the source of truth.

## Why Not Inside `FundWise`

The web app is already a deployable Next.js product with Cloudflare, Supabase, wallet-session cookies, and server-side settlement verification. A React Native Android app has different build tooling, native dependencies, app-link config, device testing, and release packaging. Keeping it separate avoids mixing Next.js and native mobile concerns.

## Stack

- React Native + Expo custom dev build
- `@wallet-ui/react-native-web3js` for Mobile Wallet Adapter
- `react-native-get-random-values` polyfill loaded before Solana libraries
- Existing FundWise HTTP API for shared state
- `expo-build-properties` pins Android `minSdkVersion` to 26 for Seeker/MWA compatibility

## First Milestone

1. Connect wallet with MWA.
2. Resolve incoming FundWise links.
3. Open Group and Settlement flows in the web app.
4. Read public API state such as health and invite lookup.
5. Share the same FundWise continuation URL to desktop/PC through the native Android share sheet.
6. Add native transaction construction only after the web mainnet flow is stable and testable on a physical Android device.

## Design Source

The Android screen should follow the FundWise mobile prototypes in `FundWise/design/app/mobile.jsx`: Strata-style mark, light FundWise green surfaces, compact cards, grouped status chips, and bottom mobile navigation.

## Android-First Product Shape

The first screen should make the phone role explicit:

- connect a Solana wallet through Mobile Wallet Adapter
- recover an invite, Group, Settlement Request, or Receipt link
- continue the same FundWise state in the web app on phone, desktop, or PC

This is intentionally not a separate ledger. It is a Seeker-native entry and recovery surface for the existing FundWise product.

## Onboarding Motion

The first-run onboarding owns the initial mental model:

- recover a real FundWise link as saved Group state
- connect through Mobile Wallet Adapter only when identity or signing is needed
- continue the same state on web or PC

Motion is limited to short opacity and transform transitions using React Native `Animated`. It respects Android reduced-motion settings through `AccessibilityInfo` and never blocks entry to the app.

## Native Android Project

Expo prebuild generates `android/` for Android Studio. The folder is local generated output and remains ignored by git unless the project intentionally moves to a bare/native-owned workflow.

## Testing Rule

Development can use any Android device or emulator with Mock MWA Wallet. Production readiness requires a physical Android device with a real MWA-compatible wallet.
