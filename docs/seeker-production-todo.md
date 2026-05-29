# Seeker Production Todo

Last updated: 2026-05-29T17:36:58+02:00

Current decision: FundWise Seeker is not production-ready until the physical-device regression pass is rerun and the external production blockers are cleared. The app now has local patches for group persistence, group opening, bottom-nav/sheet layering, Add expense state updates, and white-screen recovery. Those fixes passed local build/type checks and a signed APK was produced, but ADB currently has no connected device, so the patched build still needs on-device proof.

## Current Evidence

Device:

- Android package: `fun.fundwise.seeker`
- Connected device: none at latest retry; previous pass used `SM02E406039970`
- Build used for this pass: fresh local Android release build, signed locally with the Android debug keystore for device verification
- Latest patched APK: `android/app/build/outputs/apk/release/app-release-debugsigned.apk`

Verification commands:

- `npm run typecheck`: passed
- `npm run verify:devnet`: passed
- `npm run verify:production`: passed with warnings
- `npm run verify:production:strict`: failed because production defaults to public Solana RPC
- `./gradlew assembleRelease`: passed
- `apksigner verify --verbose android/app/build/outputs/apk/release/app-release-debugsigned.apk`: passed
- `adb shell am start -W -n fun.fundwise.seeker/.MainActivity`: cold launch `TotalTime=382ms`, `WaitTime=383ms`

Runtime log snapshot:

- No `AndroidRuntime`, `ReactNativeJS`, `ReactNative`, or `Expo` errors in the filtered runtime log after launch and core taps.
- Observed warning: `HWUI: Image decoding logging dropped!`

Smoothness snapshot from `adb shell dumpsys gfxinfo fun.fundwise.seeker`:

- Total frames rendered: `337`
- Janky frames: `10 (2.97%)`
- Legacy janky frames: `63 (18.69%)`
- 50th percentile: `8ms`
- 90th percentile: `10ms`
- 95th percentile: `20ms`
- 99th percentile: `53ms`
- Slow UI thread: `9`
- Frame deadline missed: `10`
- High input latency: `651`

Live integration checks:

- `https://fundwise.fun/api/health`: healthy, returns `{"ok":true,"service":"fundwise"}`
- `https://fundwise.fun/.well-known/assetlinks.json`: blocked because `FUNDWISE_SEEKER_ANDROID_CERT_SHA256_FINGERPRINTS` is not set server-side
- `https://beta.fundwise.fun/.well-known/assetlinks.json`: DNS does not resolve

## P0 - Core App Must Work

1. Persist groups and local state across app restarts.
   - Status: patched locally, awaiting physical-device regression proof.
   - Previous failure: a group created in the app disappeared after `adb shell am force-stop fun.fundwise.seeker` and relaunch.
   - Fix applied: added versioned AsyncStorage persistence for local groups and selected group id.
   - Acceptance: create a group, force-stop app, relaunch, and the group remains visible and openable.

2. Fix group-card navigation.
   - Status: patched locally, awaiting physical-device regression proof.
   - Previous failure: after creating `Split group`, tapping the visible group card stayed on Home.
   - Cause found: persisted recovered-link routing forced the screen back to Home every time the recovered URL remained in state.
   - Fix applied: route each incoming URL once, reset the guard only when the URL clears, and return to the newly created group detail after creation.
   - Acceptance: group opens from Home and Groups tab on a physical device.

3. Fix bottom navigation and safe-area layout.
   - Status: patched locally, awaiting physical-device regression proof.
   - Previous failure: after clean relaunch, the empty-state `Create group` button was clipped to a 2 px visible/touchable height behind the bottom nav.
   - UI hierarchy evidence: `Create group` button bounds were `[117,2338][1083,2340]` while bottom nav occupied `[0,2340][1200,2670]`.
   - Fix applied: added explicit bottom-nav reserve space to scroll content and reduced oversized home content that pushed actions below the fold.
   - Acceptance: every primary action above the nav has at least a 44 px touch height and remains visible on Seeker.

4. Move bottom sheets to a real modal/portal layer.
   - Status: patched locally, awaiting physical-device regression proof.
   - Fix applied: all `BottomSheet` content now renders inside React Native `Modal`, above the app shell and bottom nav.
   - Acceptance: Add expense, New group, Settle, Deposit, Proposal, Invite, Telegram, and Profile sheets all render over nav and keep primary buttons tappable.

5. Verify Add expense end to end.
   - Status: patched locally, awaiting physical-device regression proof.
   - Previous blocker: user reported the lower navbar blocks the execute/save button.
   - Fix applied: sheet layering moved to `Modal`, amount inputs use decimal keyboards, and Add expense now mutates local split-group balances/activity instead of acting like a placeholder.
   - Acceptance: create split group, open Add expense, enter amount/memo, save expense, see balance/activity update, force-stop/relaunch, and expense remains.

## P0 - Runtime And Build Discipline

6. Stop relying on stale APKs and mismatched dev clients.
   - Status: patched locally, with one active environment hygiene fix.
   - Observed earlier failure: white screen with `[runtime not ready]` and missing `PlatformConstants` when a stale dev client/runtime was launched against the wrong Metro environment.
   - Environment fix: a stale `Router_labs/Router-app` Expo Metro process was found on port 8081 and stopped.
   - Fix applied: added a single script for install, launch, logcat capture, screenshot capture, and gfxinfo capture.
   - Acceptance: one command produces a fresh installable APK and a readable QA evidence folder.

7. Add a device regression harness.
   - Status: initial ADB harness added, awaiting connected device.
   - Minimum flow: launch, create group, open group, open Add expense, save expense, relaunch, verify persisted state.
   - Preferred tool: Maestro or Detox if compatible with the current Expo/RN setup.
   - Current fallback: `npm run qa:device android/app/build/outputs/apk/release/app-release-debugsigned.apk` captures screenshots, UI hierarchy, logcat, and gfxinfo under `qa-evidence/`.
   - Storage policy: QA captures stay on the workstation; the transient UIAutomator file uses `/data/local/tmp` and is deleted after capture, not public `/sdcard` storage.

8. Keep log monitoring as a release gate.
   - Status: script added; full gate blocked until device reconnects.
   - Required log filters: `AndroidRuntime`, `ReactNativeJS`, `ReactNative`, `Expo`, `InputDispatcher`, `WindowManager`, `Choreographer`, `HWUI`.
   - Gate: no runtime crashes, no React fatal errors, no repeated input-dispatch warnings, no unhandled promise warnings.
   - Store each pass under a timestamped QA folder.

## P1 - Smoothness And Interaction Quality

9. Reduce high input latency.
   - Current measured signal: `Number High input latency: 651`.
   - Partial fix applied: reduced heavy hero/card shadows and tightened home layout. Further proof requires a new `gfxinfo` run.
   - Likely remaining contributors: large `ScrollView` re-render surface, haptics on every tap, and full-screen overlays.
   - Fix: memoize repeated cards, isolate sheet state from dashboard re-renders, and avoid unnecessary haptics on disabled/no-op taps.
   - Acceptance: high input latency count does not spike during create/open/add-expense flows.

10. Improve frame tail latency.
    - Current measured signal: 99th percentile frame time is `53ms`.
    - Fix: reduce layout churn, avoid animating layout-heavy properties, keep sheets mounted through modal boundaries, and profile expensive components.
    - Acceptance target: less than 1 percent janky frames for the core flow, 99th percentile under 32 ms during ordinary taps.

11. Make press feedback reliable.
    - Status: partially patched locally.
    - Previous issue: visible buttons sometimes looked tappable but did not complete the expected action.
    - Fix applied: group cards and key buttons now expose clearer accessibility/test identifiers and larger hit areas. Continue expanding this across remaining controls during device QA.
    - Acceptance: every visual button in the home, group, and sheet flows has a working accessible target.

12. Keyboard and CTA behavior.
    - Status: partially patched locally.
    - Fix all forms so primary CTAs remain visible above the keyboard and Android navigation area.
    - Amount fields need numeric keyboard behavior, sane formatting while editing, and inline validation.
    - Acceptance: no form action is hidden by keyboard or bottom nav.

## P1 - Product And Design Cleanup

13. Rework Home information hierarchy.
    - Status: partially patched locally.
    - Previous issue: the hero and recovered-link card pushed core actions and groups too far down.
    - Fix applied: shortened hero, compacted empty state, and reduced recovered-link visual weight. Continue tuning after screenshots from the patched build.
    - Acceptance: on Seeker, a connected user can see balance, primary action, and first group without hunting.

14. Rationalize creation entry points.
    - Current paths: quick action, empty-state action, bottom FAB, Groups tab add button.
    - Fix: keep clear primary actions per screen and ensure each path opens the same sheet with the same behavior.
    - Acceptance: no duplicate path is broken, clipped, or semantically different without reason.

15. Replace placeholder/demo assumptions.
    - Current risk: data module still contains demo groups while mounted app starts empty local state.
    - Fix: either wire real FundWise groups or clearly isolate demo data from production app code.
    - Acceptance: production app never shows demo ledger data and never creates misleading default balances.

16. Dismissed recovered-link state.
    - Current issue: recovered-link card can remain prominent and crowd the dashboard.
    - Fix: persist dismissed state per link and show compact recovery affordance after dismissal.
    - Acceptance: clearing/dismissing a recovered link survives relaunch.

## P1 - Integration Readiness

17. Android App Links.
    - Fix server env `FUNDWISE_SEEKER_ANDROID_CERT_SHA256_FINGERPRINTS`.
    - Restore/confirm `beta.fundwise.fun` DNS before beta QA.
    - Acceptance: `assetlinks.json` returns a valid package/fingerprint statement for `fun.fundwise.seeker` on both production and beta hosts.

18. Solana RPC.
    - Current strict production failure: defaults to `https://api.mainnet-beta.solana.com`.
    - Fix: configure a paid production RPC, expected Helius mainnet endpoint or an intentional equivalent.
    - Acceptance: `npm run verify:production:strict` passes with redacted production env loaded.

19. Mobile Wallet Adapter.
    - Verify wallet authorization, message signing, rejection, retry, app background/resume, and missing-wallet states on a physical Android device.
    - Acceptance: no white screen, no stuck auth state, and no lost return context.

20. FundWise API.
    - Verify `/api/health`, invite lookup, and mobile settlement preview against beta and production.
    - Add timeout and retry behavior for preview calls.
    - Acceptance: bad network, expired settlement, wrong wallet, not member, and not settleable all have clear recoverable UI.

21. Telegram/Fundy integration.
    - Verify `EXPO_PUBLIC_FUNDY_TELEGRAM_URL`, per-group Telegram deep links, and fallback behavior when Telegram is not installed.
    - Acceptance: tapping Telegram actions never dead-ends silently.

22. Receipts and settlement links.
    - Verify `/settle/r/{requestId}` and `/receipts/{id}` App Link recovery from cold start, warm start, and background state.
    - Acceptance: recovered link context survives auth and fallback-to-web.

23. Release signing and dApp Store packaging.
    - Generate or confirm production/dApp Store keystore.
    - Set signing env vars used by `android/app/build.gradle`.
    - Verify final APK with `apksigner verify --print-certs`.
    - Acceptance: final artifact is signed with the cert configured in `assetlinks.json`.

## P2 - Production Hardening

24. Add app-level error boundary and recovery screen.
    - Status: patched locally, awaiting device verification.
    - Acceptance: JS render failure gives a branded recovery path instead of a white screen.

25. Add lightweight telemetry for production QA.
    - Track screen transitions, failed API calls, wallet errors, App Link source, and core flow completion.
    - Do not log private keys, signatures, full wallet addresses, or sensitive group contents.

26. Add offline and poor-network states.
    - Existing `useNetworkStatus` is present, but core API flows need explicit retry and stale-state behavior.
    - Acceptance: user sees retryable errors, not silent no-ops.

27. Add accessibility pass.
    - Critical controls need meaningful labels, larger touch targets, state labels, and deterministic focus order.
    - Acceptance: UIAutomator hierarchy exposes human-readable controls for the release flow.

28. Add release evidence checklist.
    - Store screenshots, logcat, gfxinfo, APK signature output, App Link verification output, and command output per build.
    - Acceptance: each release candidate has an evidence folder that can be reviewed without rerunning the device.

## Suggested Execution Order

1. Reconnect Seeker and run `npm run qa:device android/app/build/outputs/apk/release/app-release-debugsigned.apk`.
2. Manually verify create group, open group, Add expense, force-stop/relaunch persistence, and sheet CTA visibility on the patched APK.
3. Re-run `gfxinfo` and compare jank/input-latency against the baseline above.
4. Wire real FundWise-backed group reads/writes after local placeholder state is stable.
5. Fix App Links server env/DNS and production RPC strict check.
6. Re-run full mobile wallet, settlement, receipts, Telegram, and packaging gates.

## Release Gate

Do not mark Seeker production-ready until all of these are true:

- Core create/open/add-expense/relaunch flow passes on a physical Android device.
- `npm run typecheck`, `npm run verify:devnet`, and `npm run verify:production:strict` pass.
- Filtered logcat is clean for runtime and React fatal errors during the full core flow.
- `gfxinfo` meets the jank/input-latency targets for the core flow.
- App Links verify for both configured hosts.
- Release APK is signed with the cert published in `assetlinks.json`.
- No primary CTA is hidden by bottom nav, keyboard, or sheet layering.
