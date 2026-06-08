import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import type { BotCommand } from "../types";

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
  name: "mute",
  description: "Timeout (mute) a member for a duration (e.g. 10m, 1h, 1d)",
  usage: "mute @user <duration> [reason]",
  category: "moderation",
  async execute({ message, args }) {
    if (
      !message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)
    ) {
      await message.reply("❌ You need Moderate Members permission.");
      return;
    }

    const target = message.mentions.members?.first();
    if (!target) {
      await message.reply("❌ Please mention a member.");
      return;
    }

    const durationStr = args[1];
    if (!durationStr) {
      await message.reply("❌ Please provide a duration (e.g. `10m`, `1h`, `1d`).");
      return;
    }

    const ms = parseDuration(durationStr);
    if (!ms) {
      await message.reply("❌ Invalid duration format. Use `10m`, `1h`, `2d`, etc.");
      return;
    }

    const reason = args.slice(2).join(" ") || "No reason provided";

    await target.timeout(ms, reason);

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("🔇 Member Muted")
      .addFields(
        { name: "User", value: target.user.tag, inline: true },
        { name: "Duration", value: durationStr, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
        { name: "Reason", value: reason },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
