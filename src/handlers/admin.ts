import { Context } from "telegraf";
import {
  getMember,
  resetMember,
  markIntroduced,
  getStats,
  logEvent,
} from "../db/queries";
import { restrictMember, unrestrictMember } from "../services/permissions";
import { getMessage } from "../services/messages";
import { logger } from "../logger";

function parseTarget(text: string): number | null {
  const parts = text.split(/\s+/);
  if (parts.length < 2) return null;
  const id = parseInt(parts[1], 10);
  return isNaN(id) ? null : id;
}

export async function handleResetIntro(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message)) return;

  const targetId = parseTarget(ctx.message.text);
  if (!targetId) {
    await ctx.reply("Usage: /resetintro <telegram_id>");
    return;
  }

  const member = getMember(targetId);
  if (!member) {
    await ctx.reply(getMessage("adminStatusNotFound"));
    return;
  }

  resetMember(targetId);
  await restrictMember(ctx, targetId);
  logEvent(targetId, "admin_reset", { by: ctx.from?.id });

  await ctx.reply(
    getMessage("adminResetSuccess", {
      name: member.first_name ?? member.username ?? "Unknown",
      id: targetId,
    })
  );
  logger.info("Admin reset intro", { targetId, by: ctx.from?.id });
}

export async function handleApprove(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message)) return;

  const targetId = parseTarget(ctx.message.text);
  if (!targetId) {
    await ctx.reply("Usage: /approve <telegram_id>");
    return;
  }

  const member = getMember(targetId);
  if (!member) {
    await ctx.reply(getMessage("adminStatusNotFound"));
    return;
  }

  markIntroduced(targetId, "[Manually approved by admin]", 0);
  await unrestrictMember(ctx, targetId);
  logEvent(targetId, "admin_approve", { by: ctx.from?.id });

  await ctx.reply(
    getMessage("adminApproveSuccess", {
      name: member.first_name ?? member.username ?? "Unknown",
      id: targetId,
    })
  );
  logger.info("Admin approved", { targetId, by: ctx.from?.id });
}

export async function handleStatus(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message)) return;

  const targetId = parseTarget(ctx.message.text);
  if (!targetId) {
    await ctx.reply("Usage: /status <telegram_id>");
    return;
  }

  const member = getMember(targetId);
  if (!member) {
    await ctx.reply(getMessage("adminStatusNotFound"));
    return;
  }

  const lines = [
    `<b>Member Status</b>`,
    `ID: <code>${member.telegram_id}</code>`,
    `Username: ${member.username ? "@" + member.username : "N/A"}`,
    `Name: ${member.first_name ?? "N/A"}`,
    `Status: <b>${member.status}</b>`,
    `Joined: ${member.joined_at}`,
    member.introduced_at ? `Introduced: ${member.introduced_at}` : null,
    member.intro_text
      ? `Intro: <i>${member.intro_text.slice(0, 200)}${member.intro_text.length > 200 ? "..." : ""}</i>`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  await ctx.reply(lines, { parse_mode: "HTML" });
}

export async function handleStats(ctx: Context) {
  const stats = getStats();

  await ctx.reply(
    getMessage("statsMessage", {
      total: stats.total,
      pending: stats.pending,
      introduced: stats.introduced,
      left: stats.left_count,
    })
  );
}
