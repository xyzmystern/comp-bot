import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { remindersTable } from "@workspace/db";

function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const n = parseInt(match[1]!);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };
  return n * (multipliers[unit!] ?? 0);
}

const command: BotCommand = {
  name: "remind",
  description: "Set a reminder (e.g. !remind 10m take a break)",
  usage: "remind <duration> <message>",
  aliases: ["reminder"],
  category: "utility",
  async execute({ message, args }) {
    const durationStr = args[0];
    if (!durationStr) {
      await message.reply("❌ Usage: `!remind 10m take a break`");
      return;
    }

    const ms = parseDuration(durationStr);
    if (!ms) {
      await message.reply("❌ Invalid duration. Use `10m`, `1h`, `2d`, etc.");
      return;
    }

    const reminderText = args.slice(1).join(" ");
    if (!reminderText) {
      await message.reply("❌ Please include a reminder message.");
      return;
    }

    const remindAt = new Date(Date.now() + ms);

    await db.insert(remindersTable).values({
      userId: message.author.id,
      channelId: message.channel.id,
      message: reminderText,
      remindAt,
    });

    await message.reply(
      `⏰ Got it! I'll remind you about **${reminderText}** <t:${Math.floor(remindAt.getTime() / 1000)}:R>.`,
    );
  },
};

export default command;
