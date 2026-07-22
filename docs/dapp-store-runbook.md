# Solana dApp Store submission — runbook (ADR-0063 W4, verified 2026-07-22)

Publishing the Seeker app (`fun.fundwise.seeker`) to the Solana Mobile dApp Store. Companion: the Play/TWA runbook in `FundWise/docs/twa-play-runbook.md`. Mid-2026 state: the old CLI-mint flow is superseded — **the Publisher Portal (publish.solanamobile.com) is the primary path**; the CLI is a portal-backed companion for updates/CI.

**TLDR:** Portal + KYC/KYB + ~0.2 SOL wallet → signed APK (NOT an AAB, and NOT the Play signing key) → portal submission → review 3–5 business days (community: 2–3 d new, ~1 d updates). **~1.5–2 weeks with buffer — comfortable in the Serbia window.** The publisher wallet is a permanent, unrecoverable identity: back up the seed.

## 1. Onboarding (owner, start now)

1. Read Publisher Policy + Developer Agreement.
2. Create the publisher account at publish.solanamobile.com; complete **KYC/KYB** (turnaround UNVERIFIED — front-load it).
3. Fund a browser-extension wallet (Phantom/Solflare/Backpack) with **~0.2 SOL** (fees + Arweave storage; portal shows an estimator). **This wallet = the permanent publisher identity — losing it means no future updates.** Back up the seed.
4. NFT model (portal mints via wallet signing prompts — approve every request): Publisher NFT (once), App NFT (per app), Release NFT (per version).

## 2. Build the release APK

- **APK only** (no AAB), signed with a **dedicated keystore ≠ Play's**:
  ```bash
  keytool -genkey -v -keystore dappstore-release.keystore -alias fundwise -keyalg RSA -keysize 2048 -validity 10000
  ```
- Expo path — the repo already has a `dapp-store` profile in `eas.json` (`buildType: apk`):
  ```bash
  eas build --platform android --profile dapp-store
  ```
  Point EAS credentials at the dedicated keystore; bump `versionCode`/`versionName`.
- Verify: `apksigner verify --print-certs app-release.apk`. No published targetSdk requirement (UNVERIFIED) — use Play-grade targetSdk anyway.

## 3. Assets (per the official publishing SPEC)

| Asset | Spec |
|---|---|
| Icon | 512×512 PNG |
| Banner | 1200×600 PNG |
| Feature graphic | 1200×1200 PNG |
| Screenshots | 1080×1920 (or 1920×1080), JPG, all same orientation — bring 4+ (required minimum UNVERIFIED) |
| Optional video | 1080×1920 MP4 |
| App name | ≤32 chars |

## 4. Submit, review, update

- Portal: connect wallet → Add a dApp → New dApp → details → Home → **New Version** → upload APK → approve all signing prompts (~1h hands-on).
- Review: manual, **official 3–5 business days**; silent past 5 days → App Review Inquiry in `#dev-answers` on the Solana Mobile Discord. Budget 1 week incl. one rejection cycle.
- Updates: portal New Version (same signing key, bumped versionCode) or CI:
  ```bash
  npm i -g @solana-mobile/dapp-store-cli
  export DAPP_STORE_API_KEY=<portal → settings → api-keys>
  dapp-store --apk-file ./app-release.apk --keypair ./keypair.json --whats-new "Release notes"
  ```

## 5. Risks

Crypto-native store — no policy risk for wallet functionality. Real risks: losing the publisher wallet or keystore (both unrecoverable) and KYC turnaround. Operational rule: seed + keystore backups before first submission.

Sources (2026-07-22): docs.solanamobile.com/dapp-store/{submit-new-app, submit-an-update, build-and-sign-an-apk, publishing-cli}; solana-mobile/dapp-publishing SPEC.md; Helius "Publishing Solana Mobile Apps" (secondary, review-time reports).
