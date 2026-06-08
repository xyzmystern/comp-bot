import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "unmute",
  description: "Remove a timeout from a member",
  usage: "unmute @user",
  category: "moderation",
  async execute({ message }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply("❌ You need Moderate Members permission.");
      return;
    }

    const target = message.mentions.members?.first();
    if (!target) {
      await message.reply("❌ Please mention a member.");
      return;
    }

    await target.timeout(null);

    const embed = new EmbedBuilder()
      .setColor(0x00cc99)
      .setTitle("🔊 Member Unmuted")
      .addFields(
        { name: "User", value: target.user.tag, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
