import { config } from "./config";
import { setLogLevel } from "./logger";
import { logger } from "./logger";
import { getDb, closeDb } from "./db";
import { createBot } from "./bot";

// Set log level from config
setLogLevel(config.LOG_LEVEL);

// Initialize database
getDb();

// Create and launch bot
const bot = createBot();

bot.launch(() => {
  logger.info("Bot started", {
    mainGroup: config.MAIN_GROUP_ID,
    introChannel: config.INTRO_CHANNEL_ID,
  });
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info("Shutting down", { signal });
  bot.stop(signal);
  closeDb();
  process.exit(0);
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
