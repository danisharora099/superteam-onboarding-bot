import { Telegraf } from "telegraf";
import { config } from "./config";
import { errorHandler } from "./middleware/error-handler";
import { adminGuard } from "./middleware/admin-guard";
import { handleJoin } from "./handlers/join";
import { handleIntro } from "./handlers/intro";
import { handleLeave } from "./handlers/leave";
import { handleGate } from "./handlers/gate";
import {
  handleResetIntro,
  handleApprove,
  handleStatus,
  handleStats,
  handleTestJoin,
  handleExample,
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
  bot.command("testjoin", adminGuard, handleTestJoin);

  // ── Public commands ────────────────────────────────
  bot.command("example", handleExample);

  // ── Event handlers ─────────────────────────────────
  bot.on("new_chat_members", handleJoin);
  bot.on("left_chat_member", handleLeave);

  // ── Message handlers ───────────────────────────────
  // Gate: auto-delete messages from pending users in main group
  // Intro: validate intros in the intro channel
  bot.on("message", handleGate, handleIntro);

  logger.info("Bot handlers registered");

  return bot;
}
