import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "kick",
  description: "Kick a member from the server",
  usage: "kick @user [reason]",
  category: "moderation",
  async execute({ message, args }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.KickMembers)) {
      await message.reply("❌ You don't have permission to kick members.");
      return;
    }

    const target =
      message.mentions.members?.first() ??
      (args[0]
        ? await message.guild!.members.fetch(args[0]).catch(() => null)
        : null);

    if (!target) {
      await message.reply("❌ Please mention a valid member to kick.");
      return;
    }

    if (!target.kickable) {
      await message.reply("❌ I cannot kick that member.");
      return;
    }

    const reason = args.slice(1).join(" ") || "No reason provided";
    await target.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle("👢 Member Kicked")
      .addFields(
        { name: "User", value: target.user.tag, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
        { name: "Reason", value: reason },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
