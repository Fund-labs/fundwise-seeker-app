const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const strict = process.argv.includes("--strict");
const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
const target = targetArg?.split("=")[1] || "production";
const appJson = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const fundwiseApiSource = fs.readFileSync(path.join(root, "src/lib/fundwise-api.ts"), "utf8");
const fundwiseLinkSource = fs.readFileSync(path.join(root, "src/lib/fundwise-link.ts"), "utf8");
const mountedScreenSource = fs.readFileSync(path.join(root, "src/screens/FundWiseSeekerAppScreen.tsx"), "utf8");

const requiredHosts = ["fundwise.fun", "beta.fundwise.fun"];
const requiredPrefixes = ["/groups", "/join", "/settle/r", "/receipts"];
const isDevnet = target === "devnet" || target === "devnet-beta";
const defaultRpc = isDevnet ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com";
const rpcEndpoint =
  process.env.EXPO_PUBLIC_SOLANA_RPC_ENDPOINT ||
  process.env.EXPO_PUBLIC_SOLANA_RPC_URL ||
  defaultRpc;
const cluster =
  process.env.EXPO_PUBLIC_SOLANA_CLUSTER ||
  process.env.EXPO_PUBLIC_SOLANA_CHAIN?.replace("solana:", "") ||
  (isDevnet ? "devnet" : "mainnet");

const filters = appJson.expo?.android?.intentFilters || [];
const dataEntries = filters.flatMap((filter) => filter.data || []);
const failures = [];
const warnings = [];

for (const host of requiredHosts) {
  for (const prefix of requiredPrefixes) {
    const found = dataEntries.some(
      (entry) =>
        entry.scheme === "https" &&
        entry.host === host &&
        entry.pathPrefix === prefix,
    );

    if (!found) {
      failures.push(`Missing Android App Link for https://${host}${prefix}`);
    }
  }
}

if (isDevnet) {
  if (cluster !== "devnet") {
    failures.push(`Expected devnet cluster for devnet release, got ${cluster}`);
  }
} else if (!["mainnet", "mainnet-beta"].includes(cluster)) {
  failures.push(`Expected mainnet cluster for production, got ${cluster}`);
}

if (!isDevnet && rpcEndpoint === defaultRpc) {
  const message = "EXPO_PUBLIC_SOLANA_RPC_ENDPOINT is using public Solana RPC; production should use Helius or another paid RPC.";
  if (strict) {
    failures.push(message);
  } else {
    warnings.push(message);
  }
}

if (!isDevnet && !/^https:\/\/mainnet\.helius-rpc\.com\//.test(rpcEndpoint)) {
  warnings.push("RPC endpoint is not a Helius mainnet URL. This may be fine if a paid fallback provider is intentionally configured.");
}

if (isDevnet && !/devnet/.test(rpcEndpoint)) {
  warnings.push("RPC endpoint does not look like a devnet URL. Verify the endpoint targets Solana devnet before building the beta APK.");
}

if (!fundwiseApiSource.includes("/api/group-invites/preview")) {
  failures.push("Seeker must use FundWise tokenized invite preview API; legacy /api/groups?code is production-disabled.");
}

if (!fundwiseApiSource.includes("/api/auth/wallet/challenge") || !fundwiseApiSource.includes("/api/auth/wallet/verify")) {
  failures.push("Seeker must establish a FundWise wallet session before calling protected FundWise APIs.");
}

if (fundwiseApiSource.includes("preview?wallet=")) {
  failures.push("Mobile settlement preview must use FundWise wallet-session auth, not a wallet query parameter.");
}

if (!fundwiseLinkSource.includes("inviteToken")) {
  failures.push("Seeker link parser must preserve FundWise inviteToken values from production invite links.");
}

if (!mountedScreenSource.includes("ensureFundWiseWalletSession")) {
  failures.push("Mounted Seeker app screen must wire MWA signatures into the FundWise wallet session.");
}

for (const warning of warnings) {
  console.warn(`WARN ${warning}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL ${failure}`);
  }
  process.exit(1);
}

console.log(`Seeker ${isDevnet ? "devnet" : "production"} readiness config check passed.`);
console.log(`Hosts: ${requiredHosts.join(", ")}`);
console.log(`Paths: ${requiredPrefixes.join(", ")}`);
console.log(`Cluster: ${cluster}`);
console.log(`RPC: ${rpcEndpoint.includes("api-key=") ? rpcEndpoint.replace(/api-key=[^&]+/, "api-key=***") : rpcEndpoint}`);
