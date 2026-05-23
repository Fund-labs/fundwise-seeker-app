const { withAndroidManifest } = require("@expo/config-plugins");

const WALLET_PACKAGES = ["com.solanamobile.wallet", "com.solflare.mobile"];
const WALLET_SCHEMES = ["solana-wallet", "solana"];

function getQueries(manifest) {
  if (!manifest.queries) {
    manifest.queries = [{}];
  }

  if (!manifest.queries[0]) {
    manifest.queries[0] = {};
  }

  return manifest.queries[0];
}

function hasPackage(queries, packageName) {
  return (queries.package || []).some((item) => item.$?.["android:name"] === packageName);
}

function hasSchemeIntent(queries, scheme) {
  return (queries.intent || []).some((item) => item.data?.some((data) => data.$?.["android:scheme"] === scheme));
}

function withWalletQueries(config) {
  return withAndroidManifest(config, (nextConfig) => {
    const queries = getQueries(nextConfig.modResults.manifest);

    queries.package = queries.package || [];
    for (const packageName of WALLET_PACKAGES) {
      if (!hasPackage(queries, packageName)) {
        queries.package.push({ $: { "android:name": packageName } });
      }
    }

    queries.intent = queries.intent || [];
    for (const scheme of WALLET_SCHEMES) {
      if (!hasSchemeIntent(queries, scheme)) {
        queries.intent.push({
          action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
          category: [{ $: { "android:name": "android.intent.category.BROWSABLE" } }],
          data: [{ $: { "android:scheme": scheme } }],
        });
      }
    }

    return nextConfig;
  });
}

module.exports = withWalletQueries;
