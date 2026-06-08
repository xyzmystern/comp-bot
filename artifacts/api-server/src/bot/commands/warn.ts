import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { warningsTable } from "@workspace/db";

const command: BotCommand = {
  name: "warn",
  description: "Warn a member and log it",
  usage: "warn @user [reason]",
  category: "moderation",
  async execute({ message, args }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply("❌ You don't have permission to warn members.");
      return;
    }

    const target = message.mentions.members?.first();
    if (!target) {
      await message.reply("❌ Please mention a member to warn.");
      return;
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    await db.insert(warningsTable).values({
      guildId: message.guild!.id,
      userId: target.id,
      moderatorId: message.author.id,
      reason,
    });

    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle("⚠️ Member Warned")
      .addFields(
        { name: "User", value: target.user.tag, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
        { name: "Reason", value: reason },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    try {
      await target.send(
        `⚠️ You have been warned in **${message.guild!.name}**.\nReason: ${reason}`,
      );
    } catch {
      // DMs may be closed
    }
  },
};

export default command;
