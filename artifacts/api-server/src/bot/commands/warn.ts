import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { warningsTable } from "@workspace/db";

async function insertWarn(
  guildId: string,
  userId: string,
  moderatorId: string,
  reason: string,
) {
  await db.insert(warningsTable).values({ guildId, userId, moderatorId, reason });
}

function warnEmbed(tag: string, mod: string, reason: string) {
  return new EmbedBuilder()
    .setColor(0xffcc00)
    .setTitle("⚠️ Member Warned")
    .addFields(
      { name: "User", value: tag, inline: true },
      { name: "Moderator", value: mod, inline: true },
      { name: "Reason", value: reason },
    )
    .setTimestamp();
}

const command: BotCommand = {
  name: "warn",
  description: "Warn a member and log it",
  usage: "warn @user [reason]",
  category: "moderation",

  slashData: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member and log it")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) =>
      o.setName("user").setDescription("The member to warn").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Reason for the warning"),
    ),

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
    await insertWarn(message.guild!.id, target.id, message.author.id, reason);
    await message.reply({ embeds: [warnEmbed(target.user.tag, message.author.tag, reason)] });
    try { await target.send(`⚠️ You were warned in **${message.guild!.name}**.\nReason: ${reason}`); } catch {}
  },

  async executeSlash(interaction) {
    const user = interaction.options.getUser("user", true);
    const member = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    await insertWarn(interaction.guildId!, user.id, interaction.user.id, reason);
    await interaction.reply({ embeds: [warnEmbed(user.tag, interaction.user.tag, reason)] });
    try { await user.send(`⚠️ You were warned in **${interaction.guild!.name}**.\nReason: ${reason}`); } catch {}
    void member;
  },
};

export default command;
