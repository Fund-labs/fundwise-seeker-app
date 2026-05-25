import { FUNDY_TELEGRAM_URL } from "../config";

type FundyTelegramMode = "dm" | "group";

type FundyTelegramOptions = {
  groupId?: string;
  mode?: FundyTelegramMode;
};

function telegramPayload(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 64);
}

export function buildFundyTelegramUrl(options: FundyTelegramOptions = {}) {
  const url = new URL(FUNDY_TELEGRAM_URL);

  if (options.groupId) {
    const payload = telegramPayload(`group_${options.groupId}`);
    url.searchParams.set(options.mode === "group" ? "startgroup" : "start", payload);
  }

  return url.toString();
}
