import { FUNDWISE_API_URL } from "../config";
import { Base64 } from "js-base64";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

export type FundWiseHealth = {
  ok?: boolean;
  status?: string;
};

export type FundWiseGroupPreview = {
  id: string;
  name: string;
  mode?: "split" | "fund";
  code?: string | null;
  invite_code?: string | null;
  member_count?: number | null;
  stablecoin_mint?: string | null;
};

export type InviteLookup = {
  group?: FundWiseGroupPreview;
  error?: string;
};

export type FundWiseWalletSession = {
  authenticated: boolean;
  wallet: string | null;
};

export type FundWiseWalletChallenge = {
  message: string;
  expiresAt: number;
};

export type GroupInvitePreview = {
  groupId: string;
  name: string;
  mode: "split" | "fund";
  memberCount: number;
  expiresAt: string;
};

export type MobileSettlementRequestPreview = {
  requestId: string;
  status: "ready" | "not_settleable" | "expired" | "not_member" | "wrong_wallet";
  role: "payer" | "payee" | "member" | "not_member" | "wrong_wallet";
  amount: {
    baseUnits: number;
    display: string;
    token: string;
  } | null;
  payer: {
    wallet: string;
    isViewer: boolean;
  };
  payee: {
    wallet: string;
    isViewer: boolean;
  };
  mint: string | null;
  expiresAt: string;
  fallbackUrl: string;
};

const REQUEST_TIMEOUT_MS = 12_000;

function bytesFromString(value: string) {
  const bytes: number[] = [];

  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
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

function bytesToBase64(bytes: Uint8Array) {
  return Base64.fromUint8Array(bytes);
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${FUNDWISE_API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as T & { error?: string };

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data.error || `FundWise returned ${response.status}.`,
      };
    }

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.name === "AbortError"
          ? "FundWise request timed out. Check the network and try again."
          : error instanceof Error
            ? error.message
            : "Unable to reach FundWise.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function readJson<T>(path: string, init?: RequestInit) {
  return fetchJson<T>(path, init);
}

function writeJson<T>(path: string, body?: unknown, init?: RequestInit) {
  return fetchJson<T>(path, {
    method: "POST",
    ...init,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export function getHealth() {
  return readJson<FundWiseHealth>("/api/health");
}

export function getWalletSession() {
  return readJson<FundWiseWalletSession>("/api/auth/wallet/session");
}

export async function ensureFundWiseWalletSession(params: {
  wallet: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}): Promise<ApiResult<FundWiseWalletSession>> {
  const wallet = params.wallet.trim();
  const currentSession = await getWalletSession();

  if (
    currentSession.ok &&
    currentSession.data.authenticated &&
    currentSession.data.wallet === wallet
  ) {
    return currentSession;
  }

  const challenge = await writeJson<FundWiseWalletChallenge>("/api/auth/wallet/challenge", {
    wallet,
  });

  if (!challenge.ok) {
    return challenge;
  }

  const signature = await params.signMessage(bytesFromString(challenge.data.message));
  const verified = await writeJson<{ wallet: string }>("/api/auth/wallet/verify", {
    wallet,
    signature: bytesToBase64(signature),
  });

  if (!verified.ok) {
    return verified;
  }

  return {
    ok: true,
    data: {
      authenticated: true,
      wallet: verified.data.wallet,
    },
  };
}

export function previewGroupInvite(inviteToken: string) {
  return readJson<GroupInvitePreview>(
    `/api/group-invites/preview?inviteToken=${encodeURIComponent(inviteToken.trim())}`,
  );
}

export async function lookupInvite(code: string): Promise<ApiResult<InviteLookup>> {
  const trimmed = code.trim();

  if (/^FWI-[a-f0-9]{64}$/i.test(trimmed)) {
    const result = await previewGroupInvite(trimmed);

    if (!result.ok) {
      return result;
    }

    return {
      ok: true,
      data: {
        group: {
          id: result.data.groupId,
          name: result.data.name,
          mode: result.data.mode,
          member_count: result.data.memberCount,
        },
      },
    };
  }

  const result = await readJson<FundWiseGroupPreview | null>(
    `/api/groups?code=${encodeURIComponent(trimmed)}`,
  );

  if (!result.ok) {
    return result;
  }

  if (!result.data) {
    return {
      ok: false,
      status: 404,
      error: "Invite code not found.",
    };
  }

  return {
    ok: true,
    data: {
      group: result.data,
    },
  };
}

export function getMobileSettlementRequestPreview(requestId: string) {
  const encodedRequestId = encodeURIComponent(requestId.trim());

  return readJson<MobileSettlementRequestPreview>(
    `/api/mobile/settlement-requests/${encodedRequestId}/preview`,
  );
}
