# Build Context

```json
{
  "mobile": {
    "platform": "react-native",
    "wallet_method": "mwa",
    "scaffold_repo": "existing FundWiseSeeker Expo custom dev build",
    "physical_device_tested": true,
    "latest_device_connection": "SM02E406039970 connected and QA-passed on 2026-06-09; installed dist/fundwiseseeker-v0.1.1-beta-devnet.apk",
    "latest_tested_apk_sha256": "f1133742d5e7ca56c08f73e6146166d35d21f9eeb502c488916d2efa837f5eab",
    "latest_app_link_tests": "Cold-started https://fundwise.fun/groups/seeker-smoke and https://fundwise.fun/settle/r/seeker-smoke-request into fun.fundwise.seeker on SM02E406039970; both recovered in-app without error-log output.",
    "launch_path": "FundWise mobile web -> PWA -> TWA/APK, with RN as native Seeker companion"
  },
  "build_status": {
    "rpc_provider": "Helius mainnet target for production; public Solana RPC only acceptable for local/default smoke checks",
    "mainnet_deployed": false
  },
  "review": {
    "security_score": "C",
    "quality_score": "C",
    "ready_for_mainnet": false,
    "findings": [
      {
        "severity": "critical",
        "category": "core_mobile_flow",
        "description": "Created Seeker groups previously lived only in memory and disappeared after process restart; local AsyncStorage persistence is now patched but not yet device-regression verified.",
        "fix": "Run the patched APK on Seeker, prove create/open/add-expense/relaunch persistence, then wire the production flow to FundWise-backed group reads/writes."
      },
      {
        "severity": "critical",
        "category": "navigation",
        "description": "A visible group card remained on Home when tapped on the physical device; the recovered-link route loop was patched locally.",
        "fix": "Device-verify opening groups from Home and Groups, including after creating a new group and after process restart."
      },
      {
        "severity": "critical",
        "category": "layout",
        "description": "The empty-state Create group button was clipped behind the bottom nav on Seeker; bottom-nav reserve space and Modal-backed sheets are now patched locally.",
        "fix": "Device-verify CTA visibility for empty state, quick actions, Add expense, New group, Deposit, Settle, Proposal, Invite, Telegram, and Profile sheets."
      },
      {
        "severity": "high",
        "category": "performance",
        "description": "Current device baseline showed 10 janky frames out of 337, 99th percentile frame time of 53ms, and 651 high-input-latency events; layout/shadow reductions are patched locally.",
        "fix": "Re-run gfxinfo on the patched APK, then profile the home/sheet flows, memoize repeated cards, isolate sheet state, and gate releases on gfxinfo targets."
      },
      {
        "severity": "high",
        "category": "production_config",
        "description": "Strict production verification fails because the app defaults to public Solana mainnet RPC.",
        "fix": "Configure paid production RPC such as Helius mainnet and require npm run verify:production:strict to pass before release."
      },
      {
        "severity": "high",
        "category": "app_links",
        "description": "fundwise.fun assetlinks.json is blocked by a missing Android certificate fingerprint, and beta.fundwise.fun currently does not resolve.",
        "fix": "Set FUNDWISE_SEEKER_ANDROID_CERT_SHA256_FINGERPRINTS server-side and restore beta DNS before beta/prod App Link verification."
      }
    ]
  }
}
```
