const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const strict = process.argv.includes("--strict");
const appJson = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));

const requiredHosts = ["fundwise.fun", "beta.fundwise.fun"];
const requiredPrefixes = ["/groups", "/join", "/settle/r", "/receipts"];
const defaultRpc = "https://api.mainnet-beta.solana.com";
const rpcEndpoint =
  process.env.EXPO_PUBLIC_SOLANA_RPC_ENDPOINT ||
  process.env.EXPO_PUBLIC_SOLANA_RPC_URL ||
  defaultRpc;
const cluster =
  process.env.EXPO_PUBLIC_SOLANA_CLUSTER ||
  process.env.EXPO_PUBLIC_SOLANA_CHAIN?.replace("solana:", "") ||
  "mainnet";

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

if (!["mainnet", "mainnet-beta"].includes(cluster)) {
  failures.push(`Expected mainnet cluster, got ${cluster}`);
}

if (rpcEndpoint === defaultRpc) {
  const message = "EXPO_PUBLIC_SOLANA_RPC_ENDPOINT is using public Solana RPC; production should use Helius or another paid RPC.";
  if (strict) {
    failures.push(message);
  } else {
    warnings.push(message);
  }
}

if (!/^https:\/\/mainnet\.helius-rpc\.com\//.test(rpcEndpoint)) {
  warnings.push("RPC endpoint is not a Helius mainnet URL. This may be fine if a paid fallback provider is intentionally configured.");
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

console.log("Seeker production readiness config check passed.");
console.log(`Hosts: ${requiredHosts.join(", ")}`);
console.log(`Paths: ${requiredPrefixes.join(", ")}`);
console.log(`Cluster: ${cluster}`);
console.log(`RPC: ${rpcEndpoint.includes("api-key=") ? rpcEndpoint.replace(/api-key=[^&]+/, "api-key=***") : rpcEndpoint}`);
