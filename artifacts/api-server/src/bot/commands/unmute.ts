import {
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "../types";

function unmuteEmbed(tag: string, mod: string) {
  return new EmbedBuilder()
    .setColor(0x00cc99)
    .setTitle("🔊 Member Unmuted")
    .addFields(
      { name: "User", value: tag, inline: true },
      { name: "Moderator", value: mod, inline: true },
    )
    .setTimestamp();
}

const command: BotCommand = {
  name: "unmute",
  description: "Remove a timeout from a member",
  usage: "unmute @user",
  category: "moderation",

  slashData: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove a timeout from a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) =>
      o.setName("user").setDescription("The member to unmute").setRequired(true),
    ),

  async execute({ message }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply("❌ You need Moderate Members permission."); return;
    }
    const target = message.mentions.members?.first();
    if (!target) { await message.reply("❌ Please mention a member."); return; }
    await target.timeout(null);
    await message.reply({ embeds: [unmuteEmbed(target.user.tag, message.author.tag)] });
  },

  async executeSlash(interaction) {
    const raw = interaction.options.getMember("user");
    if (!(raw instanceof GuildMember)) {
      await interaction.reply({ content: "❌ Could not find that member.", ephemeral: true }); return;
    }
    await raw.timeout(null);
    await interaction.reply({ embeds: [unmuteEmbed(raw.user.tag, interaction.user.tag)] });
  },
};

export default command;
