import type { Chain } from "@solana-mobile/mobile-wallet-adapter-protocol";

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

function hostOf(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

function splitHosts(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
}

export const FUNDWISE_WEB_URL =
  stripTrailingSlash(process.env.EXPO_PUBLIC_FUNDWISE_WEB_URL || "https://fundwise.fun");

export const FUNDWISE_API_URL =
  stripTrailingSlash(process.env.EXPO_PUBLIC_FUNDWISE_API_URL || FUNDWISE_WEB_URL);

export const RECEIPTS_URL =
  stripTrailingSlash(process.env.EXPO_PUBLIC_RECEIPTS_URL || FUNDWISE_WEB_URL);

export const FUNDWISE_ALLOWED_HOSTS = Array.from(
  new Set(
    [
      "fundwise.fun",
      "beta.fundwise.fun",
      hostOf(FUNDWISE_WEB_URL),
      hostOf(FUNDWISE_API_URL),
      hostOf(RECEIPTS_URL),
      ...splitHosts(process.env.EXPO_PUBLIC_FUNDWISE_ALLOWED_HOSTS),
    ].filter((host): host is string => Boolean(host)),
  ),
);

export const SOLANA_CLUSTER =
  process.env.EXPO_PUBLIC_SOLANA_CLUSTER ||
  process.env.EXPO_PUBLIC_SOLANA_CHAIN?.replace("solana:", "") ||
  "mainnet";

export const SOLANA_CHAIN = `solana:${SOLANA_CLUSTER}` as Chain;

const DEFAULT_SOLANA_RPC_ENDPOINT =
  SOLANA_CLUSTER === "mainnet"
    ? "https://api.mainnet-beta.solana.com"
    : `https://api.${SOLANA_CLUSTER}.solana.com`;

export const SOLANA_RPC_ENDPOINT =
  process.env.EXPO_PUBLIC_SOLANA_RPC_ENDPOINT ||
  process.env.EXPO_PUBLIC_SOLANA_RPC_URL ||
  DEFAULT_SOLANA_RPC_ENDPOINT;

export const FUNDWISE_IDENTITY = {
  name: "FundWise",
  uri: FUNDWISE_WEB_URL,
  icon: "favicon.ico",
};
