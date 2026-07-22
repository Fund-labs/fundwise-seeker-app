// RNG polyfill MUST load before tweetnacl (tweetnacl grabs crypto.getRandomValues
// at import time) — keep this import first, matching the polyfill.js pattern of
// installing globals before anything consumes them.
import "react-native-get-random-values";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking } from "react-native";
import nacl from "tweetnacl";
import { FUNDWISE_WEB_URL, SOLANA_CLUSTER } from "../config";
import { withWalletTimeout, type WalletAccount, type WalletTransport } from "./transport";

// DeeplinkTransport (iOS): Phantom/Solflare universal-link connect + signMessage
// per docs/deeplink-transport-reference.md. Dapp→wallet uses the https
// universal-link base (degrades to App Store when the wallet is missing);
// wallet→dapp uses our custom scheme — https redirect_links open in the
// browser instead of the app (documented iOS gotcha).

export type DeeplinkWalletConfig = Readonly<{
  id: "phantom" | "solflare";
  label: string;
  baseUrl: string;
  encryptionPubkeyResponseParam: string;
}>;

export const PHANTOM_DEEPLINK_WALLET: DeeplinkWalletConfig = {
  id: "phantom",
  label: "Phantom",
  baseUrl: "https://phantom.app/ul/v1/",
  encryptionPubkeyResponseParam: "phantom_encryption_public_key",
};

export const SOLFLARE_DEEPLINK_WALLET: DeeplinkWalletConfig = {
  id: "solflare",
  label: "Solflare",
  baseUrl: "https://solflare.com/ul/v1/",
  encryptionPubkeyResponseParam: "solflare_encryption_public_key",
};

// No wallet-picker UI in this slice — flip this constant to target Solflare.
const ACTIVE_DEEPLINK_WALLET: DeeplinkWalletConfig = PHANTOM_DEEPLINK_WALLET;

const DEEPLINK_WALLETS: Record<DeeplinkWalletConfig["id"], DeeplinkWalletConfig> = {
  phantom: PHANTOM_DEEPLINK_WALLET,
  solflare: SOLFLARE_DEEPLINK_WALLET,
};

// Matches "scheme" in app.json. Built by hand (equivalent to
// Linking.createURL) so the transport needs no expo-linking dependency —
// dev-client and standalone builds both register this custom scheme.
const APP_SCHEME = "fundwiseseeker";

// Every wallet→dapp redirect lands under this prefix. Exported (via
// `isWalletCallbackUrl`) so other Linking listeners — e.g. the incoming
// FundWise-link hook — can recognize and skip wallet round-trips instead of
// treating them as app content links.
const WALLET_CALLBACK_PREFIX = `${APP_SCHEME}://wallet-callback/`;

export function isWalletCallbackUrl(url: string): boolean {
  return url.startsWith(WALLET_CALLBACK_PREFIX);
}

const CALLBACK_ROUTES = {
  connect: `${WALLET_CALLBACK_PREFIX}connect`,
  signMessage: `${WALLET_CALLBACK_PREFIX}sign-message`,
  disconnect: `${WALLET_CALLBACK_PREFIX}disconnect`,
} as const;

type CallbackMethod = keyof typeof CALLBACK_ROUTES;

const SESSION_STORAGE_KEY = "fundwise-seeker:wallet-deeplink:session";
const PENDING_STORAGE_KEY = "fundwise-seeker:wallet-deeplink:pending";

// Phantom/Solflare expect the web3.js cluster spelling.
const WALLET_CLUSTER = SOLANA_CLUSTER === "mainnet" ? "mainnet-beta" : SOLANA_CLUSTER;

// Everything needed to resume after iOS kills the app during the wallet hop
// (all binary fields base58-encoded for JSON storage).
type PersistedSession = Readonly<{
  walletId: DeeplinkWalletConfig["id"];
  dappPublicKey: string;
  dappSecretKey: string;
  walletEncryptionPublicKey: string;
  sharedSecret: string;
  session: string;
  address: string;
}>;

type PendingRequest =
  | { method: "connect"; walletId: DeeplinkWalletConfig["id"]; dappPublicKey: string; dappSecretKey: string }
  | { method: "signMessage" }
  | { method: "disconnect" };

type PendingResolver =
  | { method: "connect"; resolve: (account: WalletAccount) => void; reject: (error: Error) => void }
  | { method: "signMessage"; resolve: (signature: Uint8Array) => void; reject: (error: Error) => void }
  | { method: "disconnect"; resolve: () => void; reject: (error: Error) => void };

function utf8Encode(value: string): Uint8Array {
  const bytes: number[] = [];

  for (let i = 0; i < value.length; i += 1) {
    const codePoint = value.codePointAt(i);

    if (codePoint === undefined) {
      break;
    }

    if (codePoint > 0xffff) {
      i += 1; // Surrogate pair consumed two UTF-16 units.
    }

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }

  return Uint8Array.from(bytes);
}

function utf8Decode(bytes: Uint8Array): string {
  let percentEncoded = "";

  for (const byte of bytes) {
    percentEncoded += `%${byte.toString(16).padStart(2, "0")}`;
  }

  return decodeURIComponent(percentEncoded);
}

function buildWalletUrl(config: DeeplinkWalletConfig, method: string, params: Record<string, string>): string {
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return `${config.baseUrl}${method}?${query}`;
}

function encryptPayload(payload: unknown, sharedSecret: Uint8Array): { nonceB58: string; payloadB58: string } {
  // Fresh random 24-byte nonce per request — never reused.
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encrypted = nacl.box.after(utf8Encode(JSON.stringify(payload)), nonce, sharedSecret);

  return { nonceB58: bs58.encode(nonce), payloadB58: bs58.encode(encrypted) };
}

function decryptPayload<T>(dataB58: string, nonceB58: string, sharedSecret: Uint8Array): T {
  // Always the RESPONSE's nonce — never the request nonce.
  const decrypted = nacl.box.open.after(bs58.decode(dataB58), bs58.decode(nonceB58), sharedSecret);

  if (!decrypted) {
    throw new Error("Could not decrypt the wallet response.");
  }

  return JSON.parse(utf8Decode(decrypted)) as T;
}

function parseCallbackUrl(url: string): { method: CallbackMethod; params: URLSearchParams } | null {
  for (const method of Object.keys(CALLBACK_ROUTES) as CallbackMethod[]) {
    const route = CALLBACK_ROUTES[method];

    if (url === route || url.startsWith(`${route}?`)) {
      const queryIndex = url.indexOf("?");

      return {
        method,
        params: new URLSearchParams(queryIndex === -1 ? "" : url.slice(queryIndex + 1)),
      };
    }
  }

  return null;
}

function callbackError(action: string, params: URLSearchParams): Error | null {
  const errorCode = params.get("errorCode");

  if (!errorCode) {
    return null;
  }

  const errorMessage = params.get("errorMessage");

  return new Error(`Wallet ${action} failed (${errorCode})${errorMessage ? `: ${errorMessage}` : "."}`);
}

async function readStoredJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);

    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function accountForSession(session: PersistedSession): WalletAccount {
  return {
    address: new PublicKey(session.address),
    label: DEEPLINK_WALLETS[session.walletId]?.label ?? session.walletId,
  };
}

export function useDeeplinkTransport(): WalletTransport {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const sessionRef = useRef<PersistedSession | null>(null);
  const pendingRef = useRef<PendingRequest | null>(null);
  const resolverRef = useRef<PendingResolver | null>(null);

  const readSession = useCallback(async (): Promise<PersistedSession | null> => {
    if (sessionRef.current) {
      return sessionRef.current;
    }

    const stored = await readStoredJson<PersistedSession>(SESSION_STORAGE_KEY);
    sessionRef.current = stored;

    return stored;
  }, []);

  const clearPending = useCallback(async () => {
    pendingRef.current = null;
    await AsyncStorage.removeItem(PENDING_STORAGE_KEY);
  }, []);

  const setPending = useCallback(async (pending: PendingRequest) => {
    pendingRef.current = pending;
    await AsyncStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pending));
  }, []);

  const takeResolver = useCallback((): PendingResolver | null => {
    const resolver = resolverRef.current;
    resolverRef.current = null;

    return resolver;
  }, []);

  // Single completion path for BOTH the warm `Linking` event and the
  // cold-start `getInitialURL()` resume: pending-request context lives in
  // AsyncStorage, so a connect handshake finishes (session persisted, account
  // set) even when iOS killed the app during the wallet hop and the original
  // connect() promise no longer exists.
  const completeCallback = useCallback(
    async (url: string) => {
      const callback = parseCallbackUrl(url);

      if (!callback) {
        return;
      }

      const pending = pendingRef.current ?? (await readStoredJson<PendingRequest>(PENDING_STORAGE_KEY));

      // Validate FIRST, consume SECOND. A callback that does not match the
      // pending request (a late disconnect redirect, any app opening our
      // custom scheme) must not consume the resolver or wipe the persisted
      // pending context — otherwise the genuine callback (including the
      // cold-start resume path) can never complete. Error callbacks count as
      // matching their own method.
      if (!pending || pending.method !== callback.method) {
        console.warn(
          `[DeeplinkTransport] Ignoring "${callback.method}" wallet callback: pending request is ${
            pending ? `"${pending.method}"` : "absent"
          }.`,
        );
        return;
      }

      const rejection = callbackError(callback.method, callback.params);

      if (rejection) {
        const resolver = takeResolver();
        await clearPending();
        resolver?.reject(rejection);
        return;
      }

      if (callback.method === "connect") {
        if (pending.method !== "connect") {
          return; // Unreachable (methods matched above); narrows `pending` for TS.
        }

        const config = DEEPLINK_WALLETS[pending.walletId] ?? ACTIVE_DEEPLINK_WALLET;
        const walletEncryptionPublicKey = callback.params.get(config.encryptionPubkeyResponseParam);
        const nonce = callback.params.get("nonce");
        const data = callback.params.get("data");

        if (!walletEncryptionPublicKey || !nonce || !data) {
          // A genuine wallet response always carries these (or errorCode,
          // handled above) — treat as stray, keep waiting for the real one.
          console.warn("[DeeplinkTransport] Ignoring connect callback missing its handshake parameters.");
          return;
        }

        let sharedSecret: Uint8Array;
        let payload: { public_key: string; session: string };

        try {
          sharedSecret = nacl.box.before(bs58.decode(walletEncryptionPublicKey), bs58.decode(pending.dappSecretKey));
          payload = decryptPayload<{ public_key: string; session: string }>(data, nonce, sharedSecret);
        } catch {
          // STALE callback: it was encrypted for a superseded dapp keypair
          // (e.g. the wallet's sheet for a timed-out request approved after a
          // retry re-keyed the pending request). Do NOT reject the current
          // resolver or clear the current pending — the genuine callback for
          // the current keypair can still complete.
          console.warn("[DeeplinkTransport] Ignoring stale connect callback that does not decrypt with the pending keypair.");
          return;
        }

        // Decrypt success proves the callback belongs to the pending request —
        // only now is it safe to consume the resolver and pending context.
        const resolver = takeResolver();
        await clearPending();

        try {
          const session: PersistedSession = {
            walletId: pending.walletId,
            dappPublicKey: pending.dappPublicKey,
            dappSecretKey: pending.dappSecretKey,
            walletEncryptionPublicKey,
            sharedSecret: bs58.encode(sharedSecret),
            session: payload.session,
            address: payload.public_key,
          };

          sessionRef.current = session;
          await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

          const connectedAccount = accountForSession(session);
          setAccount(connectedAccount);

          if (resolver?.method === "connect") {
            resolver.resolve(connectedAccount);
          }
        } catch (error) {
          resolver?.reject(error instanceof Error ? error : new Error("Wallet callback handling failed."));
        }

        return;
      }

      if (callback.method === "signMessage") {
        const resolver = takeResolver();
        await clearPending();

        try {
          const session = await readSession();

          if (!session) {
            resolver?.reject(new Error("Wallet signature callback arrived without an active session."));
            return;
          }

          const nonce = callback.params.get("nonce");
          const data = callback.params.get("data");

          if (!nonce || !data) {
            resolver?.reject(new Error("Wallet signature callback was missing its response data."));
            return;
          }

          const payload = decryptPayload<{ signature: string }>(data, nonce, bs58.decode(session.sharedSecret));

          if (resolver?.method === "signMessage") {
            resolver.resolve(bs58.decode(payload.signature));
          }
          // Cold-start case: the awaiting caller died with the app — the
          // auth-challenge flow re-initiates, so the signature is dropped.
        } catch (error) {
          resolver?.reject(error instanceof Error ? error : new Error("Wallet callback handling failed."));
        }

        return;
      }

      // disconnect: local state was already wiped when the request started.
      const resolver = takeResolver();
      await clearPending();

      if (resolver?.method === "disconnect") {
        resolver.resolve();
      }
    },
    [clearPending, readSession, takeResolver],
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const session = await readSession();

      if (cancelled) {
        return;
      }

      if (session) {
        setAccount(accountForSession(session));
      }

      // Cold start: if the app was killed while the user approved in the
      // wallet, the callback arrives as the launch URL.
      const initialUrl = await Linking.getInitialURL();

      if (!cancelled && initialUrl) {
        await completeCallback(initialUrl);
      }
    }

    void hydrate();

    // Warm path: the app was only backgrounded during the wallet hop.
    const subscription = Linking.addEventListener("url", (event) => {
      void completeCallback(event.url);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [completeCallback, readSession]);

  const supersedeResolver = useCallback(
    (reason: string) => {
      takeResolver()?.reject(new Error(reason));
    },
    [takeResolver],
  );

  const startConnect = useCallback(async (): Promise<WalletAccount> => {
    // Deeplink sessions do not expire — reuse the persisted one instead of
    // bouncing through the wallet again.
    const existing = await readSession();

    if (existing) {
      const existingAccount = accountForSession(existing);
      setAccount(existingAccount);

      return existingAccount;
    }

    supersedeResolver("Wallet request superseded by a new connect request.");

    const keyPair = nacl.box.keyPair();
    await setPending({
      method: "connect",
      walletId: ACTIVE_DEEPLINK_WALLET.id,
      dappPublicKey: bs58.encode(keyPair.publicKey),
      dappSecretKey: bs58.encode(keyPair.secretKey),
    });

    const url = buildWalletUrl(ACTIVE_DEEPLINK_WALLET, "connect", {
      app_url: FUNDWISE_WEB_URL,
      dapp_encryption_public_key: bs58.encode(keyPair.publicKey),
      redirect_link: CALLBACK_ROUTES.connect,
      cluster: WALLET_CLUSTER,
    });

    const result = new Promise<WalletAccount>((resolve, reject) => {
      resolverRef.current = { method: "connect", resolve, reject };
    });

    try {
      await Linking.openURL(url);
    } catch (error) {
      supersedeResolver("Wallet could not be opened.");
      await clearPending();
      throw error instanceof Error ? error : new Error(`Could not open ${ACTIVE_DEEPLINK_WALLET.label}.`);
    }

    return result;
  }, [clearPending, readSession, setPending, supersedeResolver]);

  const signMessages = useCallback(
    async (message: Uint8Array): Promise<Uint8Array> => {
      const session = await readSession();

      if (!session) {
        throw new Error("Connect a wallet before signing.");
      }

      supersedeResolver("Wallet request superseded by a new signature request.");

      const config = DEEPLINK_WALLETS[session.walletId] ?? ACTIVE_DEEPLINK_WALLET;
      const { nonceB58, payloadB58 } = encryptPayload(
        {
          // signMessage wants base58-encoded bytes, not raw utf8.
          message: bs58.encode(message),
          session: session.session,
          display: "utf8",
        },
        bs58.decode(session.sharedSecret),
      );

      await setPending({ method: "signMessage" });

      const url = buildWalletUrl(config, "signMessage", {
        dapp_encryption_public_key: session.dappPublicKey,
        nonce: nonceB58,
        redirect_link: CALLBACK_ROUTES.signMessage,
        payload: payloadB58,
      });

      const result = new Promise<Uint8Array>((resolve, reject) => {
        resolverRef.current = { method: "signMessage", resolve, reject };
      });

      try {
        await Linking.openURL(url);
      } catch (error) {
        supersedeResolver("Wallet could not be opened.");
        await clearPending();
        throw error instanceof Error ? error : new Error(`Could not open ${config.label}.`);
      }

      // Deliberately unbounded — the auth-challenge sign must tolerate a
      // wallet backgrounded past 60s (see transport.ts timeout policy).
      return result;
    },
    [clearPending, readSession, setPending, supersedeResolver],
  );

  const disconnect = useCallback(async (): Promise<void> => {
    const session = await readSession();

    // Wipe local state regardless of what the wallet says (reference gotcha:
    // disconnect success carries no params; local session dies either way).
    sessionRef.current = null;
    setAccount(null);
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    supersedeResolver("Wallet disconnected.");

    if (!session) {
      return;
    }

    try {
      const config = DEEPLINK_WALLETS[session.walletId] ?? ACTIVE_DEEPLINK_WALLET;
      const { nonceB58, payloadB58 } = encryptPayload({ session: session.session }, bs58.decode(session.sharedSecret));

      await setPending({ method: "disconnect" });
      await Linking.openURL(
        buildWalletUrl(config, "disconnect", {
          dapp_encryption_public_key: session.dappPublicKey,
          nonce: nonceB58,
          redirect_link: CALLBACK_ROUTES.disconnect,
          payload: payloadB58,
        }),
      );
    } catch {
      // Wallet-side revoke is best-effort; the local session is already gone.
      await clearPending();
    }
  }, [clearPending, readSession, setPending, supersedeResolver]);

  const connect = useCallback(
    // connect is bounded per the seam contract — a dead wallet surfaces a
    // retry. A late approval still lands: the callback path persists the
    // session and updates `account` even after the race has rejected.
    () => withWalletTimeout(startConnect()),
    [startConnect],
  );

  return useMemo(
    () => ({
      account,
      connect,
      disconnect,
      signMessages,
    }),
    [account, connect, disconnect, signMessages],
  );
}
