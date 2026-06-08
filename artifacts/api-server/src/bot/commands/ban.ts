import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "ban",
  description: "Ban a member from the server",
  usage: "ban @user [reason]",
  category: "moderation",
  requiresAdmin: true,
  async execute({ message, args }) {
    if (
      !message.member?.permissions.has(PermissionFlagsBits.BanMembers)
    ) {
      await message.reply("❌ You don't have permission to ban members.");
      return;
    }

    const target =
      message.mentions.members?.first() ??
      (args[0]
        ? await message.guild!.members.fetch(args[0]).catch(() => null)
        : null);

    if (!target) {
      await message.reply("❌ Please mention a valid member to ban.");
      return;
    }

    if (!target.bannable) {
      await message.reply("❌ I cannot ban that member.");
      return;
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    await target.ban({ reason, deleteMessageDays: 1 });

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("🔨 Member Banned")
      .addFields(
        { name: "User", value: `${target.user.tag}`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
        { name: "Reason", value: reason },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
