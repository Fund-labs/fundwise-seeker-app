export type FundWiseLinkKind =
  | "invite"
  | "group"
  | "settlement-request"
  | "settlement-receipt"
  | "unknown";

export type FundWiseLinkIntent = {
  kind: FundWiseLinkKind;
  url: string;
  groupId?: string;
  inviteCode?: string;
  settlementId?: string;
  settleFrom?: string;
  settleTo?: string;
};

function getPathParts(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);

  if (!url.protocol.startsWith("http") && url.host) {
    return [url.host, ...parts];
  }

  return parts;
}

export function parseFundWiseLink(value: string, baseUrl: string): FundWiseLinkIntent | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed, baseUrl);
    const base = new URL(baseUrl);
    const isWebUrl = url.protocol === "https:" || url.protocol === "http:";

    if (isWebUrl && url.host !== base.host) {
      return {
        kind: "unknown",
        url: url.toString(),
      };
    }

    const parts = getPathParts(url);
    const inviteCode = url.searchParams.get("code")?.trim() || undefined;
    const settleFrom = url.searchParams.get("settleFrom")?.trim() || undefined;
    const settleTo = url.searchParams.get("settleTo")?.trim() || undefined;

    if (parts[0] !== "groups") {
      return {
        kind: "unknown",
        url: url.toString(),
      };
    }

    const groupId = parts[1];
    const settlementId = parts[2] === "settlements" ? parts[3] : undefined;

    if (settlementId) {
      return {
        kind: "settlement-receipt",
        url: url.toString(),
        groupId,
        settlementId,
      };
    }

    if (settleFrom && settleTo) {
      return {
        kind: "settlement-request",
        url: url.toString(),
        groupId,
        settleFrom,
        settleTo,
      };
    }

    if (inviteCode) {
      return {
        kind: "invite",
        url: url.toString(),
        groupId,
        inviteCode: inviteCode.toUpperCase(),
      };
    }

    if (groupId) {
      return {
        kind: "group",
        url: url.toString(),
        groupId,
      };
    }

    return {
      kind: "group",
      url: url.toString(),
    };
  } catch {
    return null;
  }
}

export function getFundWiseLinkLabel(intent: FundWiseLinkIntent) {
  switch (intent.kind) {
    case "invite":
      return intent.inviteCode ? `Invite ${intent.inviteCode}` : "Invite link";
    case "settlement-request":
      return "Settlement request";
    case "settlement-receipt":
      return "Settlement receipt";
    case "group":
      return intent.groupId ? "Group dashboard" : "Groups";
    case "unknown":
      return "FundWise link";
  }
}
