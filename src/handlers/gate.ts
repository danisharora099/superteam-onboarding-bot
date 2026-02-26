import { Context } from "telegraf";
import { config } from "../config";
import { getMember } from "../db/queries";
import { getMessage } from "../services/messages";
import { getIntroInviteLink } from "../services/invite-link";
import { logger } from "../logger";

/**
 * Auto-delete messages from pending users in the main group
 * and remind them to introduce themselves first.
 * Acts as a secondary enforcement alongside muting.
 */
export async function handleGate(ctx: Context, next: () => Promise<void>) {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;

  // Only gate the main group
  if (chatId !== config.MAIN_GROUP_ID || !userId) {
    return next();
  }

  // Skip bot messages and commands (handled by other handlers)
  if (ctx.from?.is_bot) return next();

  const member = getMember(userId);

  // If not tracked or already introduced, let through
  if (!member || member.status === "introduced") {
    return next();
  }

  // Pending user — delete their message and remind
  if (ctx.message) {
    try {
      await ctx.deleteMessage();
    } catch (err) {
      logger.warn("Failed to delete gated message", {
        userId,
        error: String(err),
      });
    }

    const firstName = ctx.from.first_name ?? "there";
    const introChannelLink = await getIntroInviteLink(ctx.telegram);

    try {
      const reminder = await ctx.reply(
        getMessage("pendingReminder", { name: firstName, introChannelLink })
      );
      // Auto-delete reminder after 30 seconds
      setTimeout(() => {
        ctx.telegram
          .deleteMessage(chatId, reminder.message_id)
          .catch(() => {});
      }, 30_000);
    } catch (err) {
      logger.warn("Failed to send gate reminder", {
        userId,
        error: String(err),
      });
    }
  }
}
