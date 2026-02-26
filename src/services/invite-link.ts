import { Telegram } from "telegraf";
import { config } from "../config";
import { logger } from "../logger";

let cachedLink: string | null = null;

export async function getIntroInviteLink(telegram: Telegram): Promise<string> {
  if (cachedLink) return cachedLink;

  try {
    cachedLink = await telegram.exportChatInviteLink(config.INTRO_CHANNEL_ID);
    logger.info("Generated intro invite link", { link: cachedLink });
    return cachedLink;
  } catch (err) {
    logger.error("Failed to generate invite link", { error: String(err) });
    return "[invite link unavailable — ask an admin]";
  }
}
