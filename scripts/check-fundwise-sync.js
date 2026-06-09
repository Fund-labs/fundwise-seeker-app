#!/usr/bin/env node

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const fundwiseRoot = path.resolve(root, process.env.FUNDWISE_REPO_PATH || "../FundWise");
const force = process.argv.includes("--force");

function git(cwd, args) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

function lines(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function existsInFundWise(relativePath) {
  return fs.existsSync(path.join(fundwiseRoot, relativePath));
}

function changedFiles() {
  return Array.from(
    new Set([
      ...lines(git(root, ["diff", "--name-only", "HEAD"])),
      ...lines(git(root, ["diff", "--cached", "--name-only"])),
    ]),
  );
}

function diffText() {
  return [
    git(root, ["diff", "HEAD", "--", "."]),
    git(root, ["diff", "--cached", "--", "."]),
  ].join("\n");
}

const contractPathPatterns = [
  /^app\.json$/,
  /^\.env\.example$/,
  /^src\/config\.ts$/,
  /^src\/lib\/fundwise-/,
  /^src\/lib\/fundy-/,
  /^src\/hooks\/useIncomingFundWiseLink\.ts$/,
  /^scripts\/verify-production-readiness\.js$/,
  /^docs\/(architecture|production-launch-gate|progress|solana-mobile-crosscheck)\.md$/,
  /^plans\/SADR\//,
];

const contractKeywordPattern =
  /\b(FUNDWISE_|FundWise|fundwise|Fundy|fundy|Telegram|telegram|receipt|receipts|settle|settlement|assetlinks|Supabase|Helius|RPC|\/groups|\/join|\/settle\/r|\/receipts)\b/;

const files = changedFiles();
const shouldVerify =
  force ||
  files.some((file) => contractPathPatterns.some((pattern) => pattern.test(file))) ||
  contractKeywordPattern.test(diffText());

if (!shouldVerify) {
  console.log("FundWise sync check skipped: current Seeker changes do not touch shared FundWise contracts.");
  process.exit(0);
}

if (!fs.existsSync(fundwiseRoot)) {
  console.error(`FundWise sync check failed: sibling repo not found at ${fundwiseRoot}`);
  process.exit(1);
}

const requiredFundWiseFiles = [
  "docs/adr/0046-mobile-native-split-beta-then-multichain-funding.md",
  "docs/adr/0047-integration-sequence-and-provider-rail-boundaries.md",
  "plans/SADR/SADR-009-fundy-group-autopilot.md",
  "plans/SADR/SADR-010-actionable-settlement-nudges.md",
  "app/api/auth/wallet/challenge/route.ts",
  "app/api/auth/wallet/session/route.ts",
  "app/api/auth/wallet/verify/route.ts",
  "app/api/group-invites/preview/route.ts",
  "app/.well-known/assetlinks.json/route.ts",
  "app/api/mobile/settlement-requests/route.ts",
  "app/api/mobile/settlement-requests/[requestId]/preview/route.ts",
  "app/api/telegram/link/route.ts",
  "app/api/telegram/link-code/route.ts",
  "app/groups/page.tsx",
  "app/groups/[id]/page.tsx",
  "app/receipts/[id]/page.tsx",
  "components/agent-section.tsx",
  "components/footer.tsx",
  "components/invite-group-dialog.tsx",
  "lib/server/fundy-telegram-auth.ts",
  "lib/server/mobile-settlement-requests.ts",
  "lib/server/wallet-session.ts",
  "supabase/migrations/20260525120000_add_provider_rail_intents.sql",
  "supabase/migrations/20260525143000_add_rate_limit_buckets.sql",
  "tests/assetlinks.test.ts",
  "tests/mobile-settlement-requests.test.ts",
  "tests/fundy-telegram-auth.test.ts",
];

const missing = requiredFundWiseFiles.filter((file) => !existsInFundWise(file));

const seekerConfig = read("src/config.ts");
const botUrlMatch = seekerConfig.match(/https:\/\/t\.me\/([A-Za-z0-9_]+)/);
const botHandle = botUrlMatch?.[1] || "fundyonSol_bot";
const fundwiseBotSources = ["components/agent-section.tsx", "components/footer.tsx"]
  .map((file) => fs.readFileSync(path.join(fundwiseRoot, file), "utf8"))
  .join("\n");

if (!fundwiseBotSources.includes(botHandle)) {
  missing.push(`FundWise Telegram bot mention for ${botHandle}`);
}

if (missing.length > 0) {
  console.error("FundWise sync check failed. Missing or mismatched FundWise source contract:");
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

const contentChecks = [
  {
    file: "app/api/groups/route.ts",
    includes: "Legacy Group code lookup is no longer available",
    label: "legacy invite-code lookup is production-disabled",
  },
  {
    file: "app/api/group-invites/preview/route.ts",
    includes: "getGroupInvitePreview",
    label: "tokenized invite preview route",
  },
  {
    file: "components/invite-group-dialog.tsx",
    includes: "inviteToken",
    label: "invite dialog emits inviteToken URLs",
  },
  {
    file: "app/api/mobile/settlement-requests/[requestId]/preview/route.ts",
    includes: "withAuthenticatedHandler",
    label: "mobile settlement preview uses wallet-session auth",
  },
  {
    file: "app/api/auth/wallet/verify/route.ts",
    includes: "writeWalletSessionCookie",
    label: "wallet verify writes FundWise session cookie",
  },
];

const mismatched = contentChecks.filter(({ file, includes }) => {
  const source = fs.readFileSync(path.join(fundwiseRoot, file), "utf8");
  return !source.includes(includes);
});

if (mismatched.length > 0) {
  console.error("FundWise sync check failed. Mismatched FundWise source contract:");
  for (const item of mismatched) {
    console.error(`- ${item.file}: expected ${item.label}`);
  }
  process.exit(1);
}

const head = git(fundwiseRoot, ["rev-parse", "--short", "HEAD"]) || "unknown";
const status = git(fundwiseRoot, ["status", "--short"]);

console.log("FundWise sync check passed.");
console.log(`FundWise repo: ${fundwiseRoot}`);
console.log(`FundWise HEAD: ${head}`);
console.log(`Verified files: ${requiredFundWiseFiles.length}`);
console.log(`Fundy bot: ${botHandle}`);

if (status) {
  console.warn("WARN FundWise repo has local changes; verify against the intended FundWise branch before release.");
}
