import { Context } from "telegraf";
import { config } from "../config";
import { logger } from "../logger";

export async function restrictMember(
  ctx: Context,
  telegramId: number
): Promise<boolean> {
  try {
    await ctx.telegram.restrictChatMember(config.MAIN_GROUP_ID, telegramId, {
      permissions: {
        can_send_messages: false,
        can_send_audios: false,
        can_send_documents: false,
        can_send_photos: false,
        can_send_videos: false,
        can_send_video_notes: false,
        can_send_voice_notes: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
        can_invite_users: false,
      },
    });
    logger.info("Restricted member", { telegramId });
    return true;
  } catch (err) {
    logger.error("Failed to restrict member", {
      telegramId,
      error: String(err),
    });
    return false;
  }
}

export async function unrestrictMember(
  ctx: Context,
  telegramId: number
): Promise<boolean> {
  try {
    // Check if user is admin/creator — they can't be restricted/unrestricted
    const chatMember = await ctx.telegram.getChatMember(
      config.MAIN_GROUP_ID,
      telegramId
    );
    if (
      chatMember.status === "creator" ||
      chatMember.status === "administrator"
    ) {
      logger.info("Skipping unrestrict for admin/creator", { telegramId });
      return true;
    }

    await ctx.telegram.restrictChatMember(config.MAIN_GROUP_ID, telegramId, {
      permissions: {
        can_send_messages: true,
        can_send_audios: true,
        can_send_documents: true,
        can_send_photos: true,
        can_send_videos: true,
        can_send_video_notes: true,
        can_send_voice_notes: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_invite_users: true,
      },
    });
    logger.info("Unrestricted member", { telegramId });
    return true;
  } catch (err) {
    logger.error("Failed to unrestrict member", {
      telegramId,
      error: String(err),
    });
    return false;
  }
}
