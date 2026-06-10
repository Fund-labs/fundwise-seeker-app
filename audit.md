# FundWiseSeeker Security & Integration Audit

Snapshot date: 2026-06-10
Scope: full app at `main` HEAD (`ecab70f`) including the uncommitted UI-refresh working-tree changes; every HTTP call, deep-link parser, wallet flow, Android config, and docs-vs-code claim. All integration contracts cross-verified line-by-line against FundWise `staging` HEAD (`d2ad35d`).
Method: multi-agent review with adversarial verification (part of the 2026-06-10 FundLabs ecosystem audit; FundWise-side report at `FundWise/.superstack/security-reports/FundWise-2026-06-10.md`).

Verdict: **security posture is good — zero confirmed vulnerabilities.** The app handles no private keys, never constructs or sends transactions, and takes recipients/amounts only from server responses. The risk is **integration drift**: the wallet-session auth flow has likely never worked against real FundWise, the demo flows claim real mainnet settlement, and App Links cannot verify until ops config lands. None of this is shipped-money risk today precisely because the app cannot move money — but it blocks any public APK.

## Security findings

None confirmed. For the record, two candidates were investigated and cleared:

- **Custom-scheme deep links bypass the host allowlist** (`src/lib/fundwise-link.ts:59-68`): mechanically true — `fundwiseseeker://` URLs skip the http(s) host check — but verified to grant zero incremental capability: the settlement preview is server-authoritative behind FundWise session auth, `openIncomingLink` only opens the server-built `fallbackUrl`, and the identical card is reachable via the allowlisted `https://fundwise.fun` link. Cosmetic phishing nudge at most. Tighten when convenient, not a vulnerability.
- **`android:allowBackup="true"`** (`android/app/src/main/AndroidManifest.xml`): AsyncStorage state (local ledger, recovered settlement links) is included in device backups. No secrets are stored (session lives in httpOnly cookies). Set `allowBackup=false` for release builds as hygiene.

## Integration findings (the real work)

### Blockers

1. **Wallet-session auth likely fails on a real device — and was never device-verified.**
   `ensureFundWiseWalletSession` posts the raw MWA `signMessages()` payload (`src/lib/fundwise-api.ts:191-195`); the installed `@wallet-ui/react-native-web3js` returns MWA signed payloads verbatim (`message||signature` per MWA convention — the official adapter slices the last 64 bytes). FundWise verifies a 64-byte detached Ed25519 signature (`FundWise/lib/server/wallet-session.ts:216-231`) and returns 401 otherwise, so connect fails closed and every session-authed call (settlement preview) stays blocked. `docs/seeker-production-todo.md:172-175` admits runtime verification is outstanding; the only "auth-pass" screenshot predates the auth wiring commit (`5938ad7`, 2026-06-09) by 17 days.
   **Fix: slice the last 64 bytes of the signed payload before base64-encoding, then run the on-device pass (bundle the `__Host-` cookie round-trip check into the same pass).**
2. **Mock settle/deposit/vote flows claim real on-chain settlement.**
   After a ceremonial `signMessages()` of a text blob whose signature is discarded (`src/screens/FundWiseSeekerAppScreen.tsx:3639-3651`), the app applies a local-only mutation and shows "Transaction confirmed on Solana mainnet." (`:2686`), a hardcoded "Confirmation: Solana mainnet" MetaRow (`:2669`), and "members were notified" toasts with no backend call. For a real-USDC product this copy in any public APK is a release blocker — users can believe a debt settled when no value moved. Gate the mock flows behind an explicit "Demo" label or remove the on-chain claims until mobile transaction intents (FundWise FW-094/095/096) are live.
3. **Android App Links cannot verify.**
   `FUNDWISE_SEEKER_ANDROID_CERT_SHA256_FINGERPRINTS` is unset on production FundWise (its assetlinks route correctly 503s, fail-closed) and `beta.fundwise.fun` no longer resolves (ADR-0049 collapsed beta onto the prod host) but is still registered in `app.json:19-70`. Code on both sides is ready; missing pieces are ops-only: set the env with the **release** cert fingerprint (not the debug-keystore QA cert) and drop the beta host from `app.json`.

### Should-fix

4. **Invite/QR sheets share dead links:** `${WEB}/join/${group.id}` (`FundWiseSeekerAppScreen.tsx:2807,2839`) — FundWise has no `/join` route, and the shared id is a locally generated slug that exists only in this phone's AsyncStorage. Real invites are tokenized `/groups?inviteToken=FWI-…` links (which the app already parses correctly inbound). Generate real invites via the FundWise API or remove the share sheets.
5. **`/receipts/{id}` parser treats the segment as a Solana tx signature** (`src/lib/fundwise-link.ts:87-94`) — FundWise's `{id}` is the `settlements.id` UUID. Latent today (the link is only opened in a webview) but the contract is wrong; fix the parser before any code feeds that value to the Receipts service.
6. **RN cookie round-trip unverified on device** for the `__Host-` challenge/session cookies (`docs/seeker-production-todo.md:174`). Same device pass as item 1.

### Notes

- `lookupInvite` still falls back to `GET /api/groups?code=` which returns **410 in production** (dead code — only the unmounted `SeekerHomeScreen` calls it). Remove or gate.
- The eas.json devnet profile points a devnet-cluster app at production `fundwise.fun` while settle copy hardcodes "mainnet" — deliberate per `docs/production-launch-gate.md:5`, but resolve the copy before the 06-13 launch.
- Uncommitted working-tree changes (UI refresh + `ME.name="Sarthi"`) are UI-only and safe, but exist in **no built APK**, and the new CSS-string `boxShadow`/`filter` styles require RN New Architecture support (shadows silently disappear otherwise). Commit before the next QA build so device evidence matches source.
- `SYSTEM_ALERT_WINDOW` permission ships in the main manifest via `expo-dev-client` in production dependencies — move it to dev dependencies for release builds.

## TODO

- [x] **P0 — Slice MWA signature to 64 bytes** in `ensureFundWiseWalletSession` (code change landed 2026-06-10).
- [ ] P0 — Full on-device auth pass (signature + cookies + settlement preview) against production FundWise — still pending; no device connected.
- [x] **P0 — Remove/flag mock mainnet-settlement copy** until real transaction intents exist (demo-honest copy landed 2026-06-10).
- [ ] **P0 (ops, FundWise side) — Set `FUNDWISE_SEEKER_ANDROID_CERT_SHA256_FINGERPRINTS`** with the release cert; `beta.fundwise.fun` dropped from `app.json` 2026-06-10, env fingerprint still pending.
- [ ] P1 — Replace `/join/{localId}` share links with real tokenized invites (or remove the sheets).
- [x] P1 — Fix the `/receipts/{id}` parser (UUID, not tx signature) (done 2026-06-10).
- [x] P2 — Remove the legacy `?code=` lookup; `allowBackup=false`; move `expo-dev-client` out of prod deps (done 2026-06-10).
- [ ] P2 — Remove unmounted screens (`SeekerHomeScreen` deliberately kept for now).
- [ ] P2 — Commit the UI-refresh working tree; verify New-Architecture shadow support on device.

## How to improve

- **Contract-test against FundWise's own spec.** FundWise serves `/api/openapi.json`; add a CI step that asserts every endpoint + field this app calls exists in that spec (or generate a typed client from it). It would have caught the signature-format, 410, and `/join` drift mechanically.
- **Make the device pass a gate, not a wish.** A scripted ADB QA checklist (auth round-trip, App Links verify, deep-link matrix) that must pass before any APK is shared; today's tracker admits the core flow has no device evidence.
- **One env contract for the ecosystem.** Seeker defaults to mainnet while FundWise defaults to devnet; encode the canonical hosts/clusters in one place and fail fast at boot when they disagree (mirror FundWise's `verify:env` pattern — `verify:production:strict` already exists here, extend it).
- **Delete dead code on sight** (unmounted screens, legacy endpoints): every drift item in this audit lived in code no one exercised.
