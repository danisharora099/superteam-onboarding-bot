import { Context } from "telegraf";
import { config } from "../config";
import { upsertMember, logEvent } from "../db/queries";
import { restrictMember } from "../services/permissions";
import { getMessage } from "../services/messages";
import { logger } from "../logger";

export async function handleJoin(ctx: Context) {
  if (!ctx.message || !("new_chat_members" in ctx.message)) return;

  const chatId = ctx.chat?.id;
  if (chatId !== config.MAIN_GROUP_ID) return;

  for (const member of ctx.message.new_chat_members) {
    if (member.is_bot) continue;

    const telegramId = member.id;
    const username = member.username ?? null;
    const firstName = member.first_name ?? "there";

    logger.info("New member joined", { telegramId, username, firstName });

    // Upsert as pending (handles rejoin case)
    upsertMember(telegramId, username, firstName);
    logEvent(telegramId, "join", { username, firstName });

    // Mute in main group
    await restrictMember(ctx, telegramId);

    // Build intro channel link
    const introChannelLink = `https://t.me/c/${String(config.INTRO_CHANNEL_ID).replace("-100", "")}`;

    // Send welcome DM (fallback to group reply)
    const welcomeText = getMessage("welcome", {
      name: firstName,
      introChannelLink,
    });

    try {
      await ctx.telegram.sendMessage(telegramId, welcomeText, {
        parse_mode: "HTML",
      });
    } catch {
      // DM failed (user hasn't started bot), reply in group
      try {
        const msg = await ctx.reply(welcomeText, { parse_mode: "HTML" });
        // Auto-delete welcome after 2 minutes to keep group clean
        setTimeout(() => {
          ctx.telegram
            .deleteMessage(chatId, msg.message_id)
            .catch(() => {});
        }, 120_000);
      } catch (err) {
        logger.error("Failed to send welcome", {
          telegramId,
          error: String(err),
        });
      }
    }
  }
}
