import {
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "../types";

function kickEmbed(tag: string, mod: string, reason: string) {
  return new EmbedBuilder()
    .setColor(0xff6600)
    .setTitle("👢 Member Kicked")
    .addFields(
      { name: "User", value: tag, inline: true },
      { name: "Moderator", value: mod, inline: true },
      { name: "Reason", value: reason },
    )
    .setTimestamp();
}

const command: BotCommand = {
  name: "kick",
  description: "Kick a member from the server",
  usage: "kick @user [reason]",
  category: "moderation",

  slashData: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) =>
      o.setName("user").setDescription("The member to kick").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Reason for the kick"),
    ),

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
    await message.reply({
      embeds: [kickEmbed(target.user.tag, message.author.tag, reason)],
    });
  },

  async executeSlash(interaction) {
    const raw = interaction.options.getMember("user");
    if (!(raw instanceof GuildMember)) {
      await interaction.reply({ content: "❌ Could not find that member.", ephemeral: true });
      return;
    }
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    if (!raw.kickable) {
      await interaction.reply({ content: "❌ I cannot kick that member.", ephemeral: true });
      return;
    }
    await raw.kick(reason);
    await interaction.reply({
      embeds: [kickEmbed(raw.user.tag, interaction.user.tag, reason)],
    });
  },
};

export default command;
