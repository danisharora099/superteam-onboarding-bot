import { Context } from "telegraf";
import { config } from "../config";
import { markLeft, logEvent, getMember } from "../db/queries";
import { logger } from "../logger";

export async function handleLeave(ctx: Context) {
  if (!ctx.message || !("left_chat_member" in ctx.message)) return;

  const chatId = ctx.chat?.id;
  if (chatId !== config.MAIN_GROUP_ID) return;

  const member = ctx.message.left_chat_member;
  if (member.is_bot) return;

  const telegramId = member.id;
  const existing = getMember(telegramId);

  if (existing) {
    markLeft(telegramId);
    logEvent(telegramId, "leave");
    logger.info("Member left", { telegramId, username: member.username });
  }
}
