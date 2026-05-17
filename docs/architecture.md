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
5. Add native transaction construction only after the web mainnet flow is stable and testable on a physical Android device.

## Testing Rule

Development can use any Android device or emulator with Mock MWA Wallet. Production readiness requires a physical Android device with a real MWA-compatible wallet.
