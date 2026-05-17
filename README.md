# FundWise Seeker

Android-first FundWise client for Solana Mobile Seeker and other Android devices.

This app is a sibling client to `FundWise`, not a replacement for it. The Next.js app remains the product/API source of truth; this client focuses on the mobile wallet handoff, invite/settlement link handling, and the smallest useful Seeker-native surface.

It follows the local Seeker skill guidance from `/Users/sarthiborkar/Build/seeker-skills`:

- `seeker-app-builder`
- `seeker-app-scaffold`
- `seeker-ux`
- `mwa-setup`

## Current Slice

- React Native / Expo custom development build
- Solana Mobile Wallet Adapter via `@wallet-ui/react-native-web3js`
- canonical `react-native-get-random-values` polyfill as the first import
- FundWise API health check
- Public invite-code lookup
- FundWise deep-link handling for `/groups`
- Network and app-background state handling for wallet round trips
- Seeker AMOLED palette, 56 px primary tap targets, and tap haptics

Money-moving actions still open the FundWise web app until native transaction construction and server receipt persistence are tested end to end.

Progress log: [docs/progress.md](./docs/progress.md)

## Run

Prerequisites for Android builds:

- Node 20+
- Java JDK
- Android Studio / Android SDK with `ANDROID_HOME` configured
- Android device or emulator with an MWA-compatible wallet

```bash
npm install
npm run android
```

MWA requires a custom Expo development build. Expo Go is not enough.

For local API testing:

```bash
EXPO_PUBLIC_FUNDWISE_WEB_URL=http://localhost:3000 npm run android
```

For device testing against a machine-local web server, use your computer's LAN IP instead of `localhost`.

To start Metro only:

```bash
npm start -- --port 8099
```

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_FUNDWISE_WEB_URL` | `https://fundwise.fun` | Web app URL opened for Groups, invites, and settlement links. |
| `EXPO_PUBLIC_FUNDWISE_API_URL` | same as web URL | FundWise HTTP API base URL. |
| `EXPO_PUBLIC_SOLANA_CLUSTER` | `mainnet` | Cluster suffix used to build the MWA CAIP-2 chain string. |
| `EXPO_PUBLIC_SOLANA_RPC_ENDPOINT` | Solana public mainnet endpoint | RPC endpoint passed to `MobileWalletProvider`. |

Compatibility aliases are also supported: `EXPO_PUBLIC_SOLANA_CHAIN` and `EXPO_PUBLIC_SOLANA_RPC_URL`.

## Build Boundary

Keep all ledger writes, protected reads, settlement receipt verification, and treasury state owned by `FundWise`.

The mobile app can own:

- Seeker-native wallet connection
- Android app links
- invite and settlement link recovery
- native preflight UX
- later: native Settlement / Contribution transaction construction once tested with a real wallet

Do not store private keys in this app.

## Seeker / dApp Store Notes

- Expo Go will fail for MWA; use a custom development build.
- Android `minSdkVersion` is pinned to `26` through `expo-build-properties`.
- dApp Store shipping expects an APK, not an AAB.
- Use a different signing key from Google Play if this is also shipped there.
