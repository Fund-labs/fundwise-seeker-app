export type FundWiseLinkKind =
  | "invite"
  | "group"
  | "receipt-graph"
  | "settlement-blink"
  | "settlement-request"
  | "settlement-receipt"
  | "unknown";

export type FundWiseLinkIntent = {
  kind: FundWiseLinkKind;
  url: string;
  groupId?: string;
  inviteCode?: string;
  inviteToken?: string;
  receiptId?: string;
  requestId?: string;
  settlementId?: string;
  settleFrom?: string;
  settleTo?: string;
  txSignature?: string;
};

function getPathParts(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);

  if (!url.protocol.startsWith("http") && url.host) {
    return [url.host, ...parts];
  }

  return parts;
}

export function parseFundWiseLink(
  value: string,
  baseUrl: string,
  receiptsUrl?: string,
  allowedHosts: string[] = [],
): FundWiseLinkIntent | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^FWI-[a-f0-9]{64}$/i.test(trimmed)) {
    return {
      kind: "invite",
      inviteToken: trimmed,
      url: `${baseUrl.replace(/\/$/, "")}/groups?invite=true&inviteToken=${encodeURIComponent(trimmed)}`,
    };
  }

  try {
    const url = new URL(trimmed, baseUrl);
    const base = new URL(baseUrl);
    const receiptsBase = receiptsUrl ? new URL(receiptsUrl) : null;
    const allowedHostSet = new Set([base.host, receiptsBase?.host, ...allowedHosts].filter((host): host is string => Boolean(host)));
    const isWebUrl = url.protocol === "https:" || url.protocol === "http:";
    const isFundWiseHost = allowedHostSet.has(url.host);
    const isReceiptsHost = Boolean(receiptsBase && url.host === receiptsBase.host);

    if (isWebUrl && !isFundWiseHost && !isReceiptsHost) {
      return {
        kind: "unknown",
        url: url.toString(),
      };
    }

    const parts = getPathParts(url);
    const inviteCode = url.searchParams.get("code")?.trim() || undefined;
    const inviteToken =
      url.searchParams.get("inviteToken")?.trim() ||
      url.searchParams.get("token")?.trim() ||
      undefined;
    const settleFrom = url.searchParams.get("settleFrom")?.trim() || undefined;
    const settleTo = url.searchParams.get("settleTo")?.trim() || undefined;

    if (parts[0] === "settle" && parts[1] === "r" && parts[2]) {
      return {
        kind: "settlement-blink",
        requestId: parts[2],
        url: url.toString(),
      };
    }

    if (parts[0] === "receipts" && parts[1]) {
      return {
        kind: "settlement-receipt",
        receiptId: parts[1],
        txSignature: parts[1],
        url: url.toString(),
      };
    }

    if (isReceiptsHost && parts[0] === "v1" && parts[1] === "receipts" && parts[2]) {
      return {
        kind: "settlement-receipt",
        receiptId: parts[2],
        txSignature: parts[2],
        url: url.toString(),
      };
    }

    if (isReceiptsHost && parts[0] === "v1" && parts[1] === "graph" && parts[2] === "receipts" && parts[3]) {
      return {
        kind: "receipt-graph",
        receiptId: parts[3],
        txSignature: parts[3],
        url: url.toString(),
      };
    }

    if (parts[0] === "join") {
      return {
        kind: "invite",
        url: url.toString(),
        groupId: parts[1],
        inviteCode: inviteCode?.toUpperCase(),
        inviteToken,
      };
    }

    if (parts[0] !== "groups") {
      return {
        kind: "unknown",
        url: url.toString(),
      };
    }

    const groupId = parts[1];
    const settlementId = parts[2] === "settlements" ? parts[3] : undefined;

    if (inviteToken) {
      return {
        kind: "invite",
        url: url.toString(),
        groupId,
        inviteToken,
      };
    }

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
    case "receipt-graph":
      return "Receipt Graph";
    case "settlement-blink":
      return "Settlement link";
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

export function getFundWiseLinkDetail(intent: FundWiseLinkIntent) {
  if (intent.kind === "invite" && intent.inviteToken) {
    return "Tokenized invite";
  }

  if (intent.kind === "invite" && intent.inviteCode) {
    return `Invite ${intent.inviteCode}`;
  }

  if (intent.kind === "settlement-blink" && intent.requestId) {
    return `Request ${intent.requestId}`;
  }

  if ((intent.kind === "settlement-receipt" || intent.kind === "receipt-graph") && (intent.receiptId || intent.txSignature)) {
    return intent.receiptId || intent.txSignature || "Receipt";
  }

  if (intent.settlementId) {
    return intent.settlementId;
  }

  if (intent.groupId) {
    return intent.groupId;
  }

  return "FundWise web";
}
