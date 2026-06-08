import {
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "../types";

function banEmbed(tag: string, mod: string, reason: string) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle("🔨 Member Banned")
    .addFields(
      { name: "User", value: tag, inline: true },
      { name: "Moderator", value: mod, inline: true },
      { name: "Reason", value: reason },
    )
    .setTimestamp();
}

const command: BotCommand = {
  name: "ban",
  description: "Ban a member from the server",
  usage: "ban @user [reason]",
  category: "moderation",
  requiresAdmin: true,

  slashData: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) =>
      o.setName("user").setDescription("The member to ban").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Reason for the ban"),
    ),

  async execute({ message, args }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
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
    await message.reply({
      embeds: [banEmbed(target.user.tag, message.author.tag, reason)],
    });
  },

  async executeSlash(interaction) {
    const raw = interaction.options.getMember("user");
    if (!(raw instanceof GuildMember)) {
      await interaction.reply({ content: "❌ Could not find that member.", ephemeral: true });
      return;
    }
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    if (!raw.bannable) {
      await interaction.reply({ content: "❌ I cannot ban that member.", ephemeral: true });
      return;
    }
    await raw.ban({ reason, deleteMessageDays: 1 });
    await interaction.reply({
      embeds: [banEmbed(raw.user.tag, interaction.user.tag, reason)],
    });
  },
};

export default command;
