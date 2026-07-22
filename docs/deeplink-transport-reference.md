# DeeplinkTransport implementation reference — Phantom + Solflare (verified 2026-07-22)

Research basis for the `DeeplinkTransport` adapter in [wallet-transport-seam.md](./wallet-transport-seam.md) (FundWise FW-136). All endpoint/handshake facts below were verified against official docs on 2026-07-22; anything marked UNVERIFIED is community-reported only.

**TLDR:** Both wallets speak the same Phantom-designed protocol — universal-link base `https://<wallet>.app|.com/ul/v1/<method>`, x25519/nacl-box encryption with a per-session dapp keypair, responses appended as query params to your `redirect_link`. Solflare is a near-exact clone (only the connect response key name differs), so one transport + per-wallet config `{ baseUrl, encryptionPubkeyResponseParam }` covers both. Raw deeplinks are NOT deprecated as of July 2026. **Critical iOS rule: `redirect_link` must be our custom scheme (`fundwiseseeker://…`), NOT an https universal link — https redirects open in the browser (Phantom's own docs).**

## Endpoints

### Phantom (base `https://phantom.app/ul/v1/`)

| Method | Request params | Response (query params on `redirect_link`) |
|---|---|---|
| `connect` | `app_url` (URL-encoded), `dapp_encryption_public_key` (base58 x25519 pubkey), `redirect_link` (URL-encoded), `cluster` (optional, default `mainnet-beta`) | `phantom_encryption_public_key`, `nonce`, `data` (base58, encrypted). Decrypted `data` = `{ public_key, session }` |
| `disconnect` | `dapp_encryption_public_key`, `nonce`, `redirect_link`, `payload` = encrypted `{ session }` | Approve: NO params. Reject: `errorCode`, `errorMessage` |
| `signMessage` | `dapp_encryption_public_key`, `nonce`, `redirect_link`, `payload` = encrypted `{ message: <base58 bytes>, session, display?: "utf8"\|"hex" }` | Approve: `nonce` + `data` → decrypts to `{ signature: <base58> }`. Reject: `errorCode`, `errorMessage` |

### Solflare (base `https://solflare.com/ul/v1/`)

Identical, two differences: connect response key is **`solflare_encryption_public_key`**, and `app_url` is used for app metadata (title/icon) rather than session validation. Supply the same https URL to both.

## Handshake (both wallets)

1. Per session: `dappKeyPair = nacl.box.keyPair()`.
2. Connect URL: `dapp_encryption_public_key = bs58.encode(dappKeyPair.publicKey)` + encoded `app_url`, `redirect_link` → `Linking.openURL`.
3. Wallet redirects to `redirect_link?<wallet>_encryption_public_key=…&nonce=…&data=…`.
4. `sharedSecret = nacl.box.before(bs58.decode(walletPubkey), dappKeyPair.secretKey)`.
5. `nacl.box.open.after(bs58.decode(data), bs58.decode(nonce), sharedSecret)` → `{ public_key, session }`. Persist session + sharedSecret + dappKeyPair + wallet pubkey.
6. Later requests: JSON payload incl. `session`, fresh random 24-byte nonce, `nacl.box.after(...)` → send `nonce` + `payload` + original `dapp_encryption_public_key` + `redirect_link`.
7. Decrypt responses with the **response's** nonce (never reuse the request nonce).
8. Sessions do not expire (until wallet keypair change / chain switch / app_url blocked); always pass `session` or the wallet silently starts a new connect flow.

## Expo/RN setup

- Libraries: `react-native-get-random-values` (**import first** — RNG polyfill), `tweetnacl`, `bs58`, `expo-linking`, `react-native-url-polyfill`. No `@solana/web3.js` needed for connect/signMessage-only.
- `app.json`: `"scheme": "fundwiseseeker"` + `ios.bundleIdentifier`. Callback: `redirect_link = Linking.createURL("onConnect")` etc.
- Listen with BOTH `Linking.addEventListener("url", …)` (warm) and `Linking.getInitialURL()` (cold start).
- Expo Go cannot test this — dev-client or standalone build only.

## Gotchas (the ones that eat weeks)

1. **`redirect_link` = custom scheme, not https.** Official Phantom trade-off: custom schemes "properly redirect back to your mobile app"; https URLs "open in the browser instead of your app."
2. **Dapp→wallet direction = universal links** (`https://phantom.app/ul/…`) — degrades to App Store when the wallet is missing; the wallets' own custom schemes are officially "not recommended" (hijackable).
3. **iOS may kill the app during the wallet hop.** Persist `dappKeyPair.secretKey`, pending-request context, and session/sharedSecret in SecureStore/AsyncStorage so the `getInitialURL()` cold-start path completes the handshake. Force-close = reconnect required (official).
4. `message` in signMessage is **base58-encoded bytes**, not raw utf8. `display` only affects wallet UI.
5. `encodeURIComponent` on `app_url` and `redirect_link` — required.
6. Disconnect success = callback with no `errorCode`; wipe local session regardless.
7. Fresh random 24-byte nonce per request.
8. UNVERIFIED: simulator can't exercise universal links; Android behavior when Phantom missing opens browser.

## Deprecation status (2026-07)

- Phantom raw deeplinks: active, not deprecated. Phantom also ships `@phantom/react-native-sdk` (embedded wallets / social login) — additive, not a replacement; for a wallet-agnostic transport that must also serve Solflare, raw deeplinks are the right layer.
- Solflare v1 deeplinks: current, no deprecation notes. UNVERIFIED whether Solflare has any newer SDK (none found).

## Sources (fetched 2026-07-22)

docs.phantom.com: phantom-deeplinks/{provider-methods/connect,disconnect,signmessage; encryption; handling-sessions; specifying-redirects; deeplinks-ios-and-android}; llms.txt. docs.solflare.com: solflare/technical/deeplinks (+ provider-methods, encryption). phantom.com/learn/blog/the-complete-guide-to-phantom-deeplinks. github.com/phantom/deep-link-demo-app.
