import { FUNDWISE_API_URL } from "../config";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

export type FundWiseHealth = {
  ok?: boolean;
  status?: string;
};

export type InviteLookup = {
  group?: {
    id: string;
    name: string;
    mode?: "split" | "fund";
    invite_code?: string;
  };
  error?: string;
};

async function readJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${FUNDWISE_API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init?.headers,
      },
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
      error: error instanceof Error ? error.message : "Unable to reach FundWise.",
    };
  }
}

export function getHealth() {
  return readJson<FundWiseHealth>("/api/health");
}

export function lookupInvite(code: string) {
  return readJson<InviteLookup>(`/api/groups?code=${encodeURIComponent(code.trim())}`);
}
