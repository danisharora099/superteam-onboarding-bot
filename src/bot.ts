import { Telegraf } from "telegraf";
import { config } from "./config";
import { errorHandler } from "./middleware/error-handler";
import { adminGuard } from "./middleware/admin-guard";
import { handleJoin } from "./handlers/join";
import { handleIntro } from "./handlers/intro";
import { handleLeave } from "./handlers/leave";
import {
  handleResetIntro,
  handleApprove,
  handleStatus,
  handleStats,
} from "./handlers/admin";
import { logger } from "./logger";

export function createBot() {
  const bot = new Telegraf(config.BOT_TOKEN);

  // Global error handler
  bot.catch(errorHandler);

  // ── Admin commands (guarded) ── register before generic message handler
  bot.command("resetintro", adminGuard, handleResetIntro);
  bot.command("approve", adminGuard, handleApprove);
  bot.command("status", adminGuard, handleStatus);
  bot.command("stats", adminGuard, handleStats);

  // ── Event handlers ─────────────────────────────────
  bot.on("new_chat_members", handleJoin);
  bot.on("left_chat_member", handleLeave);

  // ── Intro channel messages (catch-all for text) ────
  bot.on("message", handleIntro);

  logger.info("Bot handlers registered");

  return bot;
}
