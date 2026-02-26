import { Context } from "telegraf";
import { logger } from "../logger";

export async function errorHandler(err: unknown, ctx: Context) {
  logger.error("Unhandled error", {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    updateType: ctx.updateType,
    chatId: ctx.chat?.id,
    userId: ctx.from?.id,
  });
}
