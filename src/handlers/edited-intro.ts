import { Context } from "telegraf";
import { config } from "../config";
import { getMember, markIntroduced, logEvent } from "../db/queries";
import { unrestrictMember } from "../services/permissions";
import { validateIntro } from "../services/validation";
import { getMessage } from "../services/messages";
import { logger } from "../logger";

/**
 * Handle edited messages in the intro channel.
 * If a pending user edits their intro to fix it, re-validate.
 */
export async function handleEditedIntro(ctx: Context) {
  const edited = ctx.editedMessage;
  if (!edited || !("text" in edited)) return;

  const chatId = ctx.chat?.id;
  if (chatId !== config.INTRO_CHANNEL_ID) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const member = getMember(telegramId);
  if (!member || member.status !== "pending") return;

  const firstName = ctx.from.first_name ?? "there";
  const result = validateIntro(edited.text);

  if (!result.valid) {
    // Still invalid — don't spam, they'll see the original feedback
    return;
  }

  // Valid after edit — accept it
  markIntroduced(telegramId, edited.text, edited.message_id);
  logEvent(telegramId, "intro_accepted", { via: "edit" });

  const unrestricted = await unrestrictMember(ctx, telegramId);

  if (unrestricted) {
    await ctx.telegram.sendMessage(
      chatId,
      getMessage("introAccepted", { name: firstName }),
      { reply_parameters: { message_id: edited.message_id } }
    );

    try {
      await ctx.telegram.pinChatMessage(chatId, edited.message_id, {
        disable_notification: true,
      });
    } catch (err) {
      logger.warn("Failed to pin edited intro", {
        telegramId,
        error: String(err),
      });
    }

    logger.info("Edited intro accepted", { telegramId, firstName });
  }
}
