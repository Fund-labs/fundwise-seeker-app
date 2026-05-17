import type { Chain } from "@solana-mobile/mobile-wallet-adapter-protocol";

export const FUNDWISE_WEB_URL =
  process.env.EXPO_PUBLIC_FUNDWISE_WEB_URL?.replace(/\/$/, "") || "https://fundwise.fun";

export const FUNDWISE_API_URL =
  process.env.EXPO_PUBLIC_FUNDWISE_API_URL?.replace(/\/$/, "") || FUNDWISE_WEB_URL;

export const SOLANA_CLUSTER =
  process.env.EXPO_PUBLIC_SOLANA_CLUSTER ||
  process.env.EXPO_PUBLIC_SOLANA_CHAIN?.replace("solana:", "") ||
  "mainnet";

export const SOLANA_CHAIN = `solana:${SOLANA_CLUSTER}` as Chain;

export const SOLANA_RPC_ENDPOINT =
  process.env.EXPO_PUBLIC_SOLANA_RPC_ENDPOINT || process.env.EXPO_PUBLIC_SOLANA_RPC_URL || "";

export const FUNDWISE_IDENTITY = {
  name: "FundWise",
  uri: FUNDWISE_WEB_URL,
  icon: "fundwise-logo.png",
};
