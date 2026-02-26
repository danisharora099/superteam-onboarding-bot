import { Context } from "telegraf";
import { config } from "../config";
import { getMember, markIntroduced, logEvent } from "../db/queries";
import { unrestrictMember } from "../services/permissions";
import { validateIntro } from "../services/validation";
import { getMessage } from "../services/messages";
import { logger } from "../logger";

export async function handleIntro(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message)) return;

  const chatId = ctx.chat?.id;
  if (chatId !== config.INTRO_CHANNEL_ID) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const member = getMember(telegramId);
  if (!member) {
    // Not tracked — they haven't joined via the main group
    return;
  }

  if (member.status === "introduced") {
    await ctx.reply(getMessage("alreadyIntroduced"));
    return;
  }

  const introText = ctx.message.text;
  const firstName = ctx.from.first_name ?? "there";

  // Validate intro
  const result = validateIntro(introText);

  if (result.tooShort) {
    await ctx.reply(getMessage("introTooShort", { name: firstName }), {
      reply_parameters: { message_id: ctx.message.message_id },
    });
    logEvent(telegramId, "intro_rejected", { reason: "too_short" });
    return;
  }

  if (!result.valid) {
    const missingItems = result.missingSections
      .map((s) => `• ${s}`)
      .join("\n");
    await ctx.reply(
      getMessage("introRejected", { name: firstName, missingItems }),
      { reply_parameters: { message_id: ctx.message.message_id } }
    );
    logEvent(telegramId, "intro_rejected", {
      missingSections: result.missingSections,
    });
    return;
  }

  // Valid intro — mark as introduced, unrestrict
  markIntroduced(telegramId, introText, ctx.message.message_id);
  logEvent(telegramId, "intro_accepted");

  const unrestricted = await unrestrictMember(ctx, telegramId);

  if (unrestricted) {
    await ctx.reply(getMessage("introAccepted", { name: firstName }), {
      reply_parameters: { message_id: ctx.message.message_id },
    });

    // Auto-pin the intro
    try {
      await ctx.pinChatMessage(ctx.message.message_id, {
        disable_notification: true,
      });
    } catch (err) {
      logger.warn("Failed to pin intro", {
        telegramId,
        error: String(err),
      });
    }

    logger.info("Intro accepted", { telegramId, firstName });
  } else {
    await ctx.reply(
      "Your intro looks great but I couldn't unmute you. Please contact an admin."
    );
  }
}
