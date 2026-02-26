import { Context, MiddlewareFn } from "telegraf";
import { config } from "../config";
import { logger } from "../logger";

export const adminGuard: MiddlewareFn<Context> = async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const member = await ctx.telegram.getChatMember(
      config.MAIN_GROUP_ID,
      userId
    );
    if (member.status === "creator" || member.status === "administrator") {
      return next();
    }
  } catch (err) {
    logger.error("Failed to check admin status", {
      userId,
      error: String(err),
    });
  }

  await ctx.reply("This command is only available to admins.");
};
