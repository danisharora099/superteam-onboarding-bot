import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, "BOT_TOKEN is required"),
  MAIN_GROUP_ID: z.coerce.number({ message: "MAIN_GROUP_ID must be a number" }),
  INTRO_CHANNEL_ID: z.coerce.number({
    message: "INTRO_CHANNEL_ID must be a number",
  }),
  DB_PATH: z.string().default("./data/bot.db"),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const config = parsed.data;
